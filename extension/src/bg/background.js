/*global chrome, _*/
(function(){
  "use strict";
  var redirectPage = chrome.extension.getURL("src/redirector.html");

  var minimized_id = null;
  var creating = false;

  var getMinimizedWindowId = function(cb) {
    if (minimized_id !== null){
      return cb(minimized_id);
    }
    if (creating) {
      var find = setInterval(function() {
        if (minimized_id) {
          clearInterval(find);
          creating = false;
          cb(minimized_id);
        }
      }, 10);
      return;
    }
    creating = true;
    chrome.windows.create(function(minimized) {
      chrome.windows.update(minimized.id, {state: "minimized"}, function() {
        minimized_id = minimized.id;
        creating = false;
        cb(minimized_id);
      });
    });
  };


  var urlToId = {};
  var creator = {};
  var created = {};
  var freeTabs = [];
  var lastBack = null;
  var MAX_FREE_TABS = 10;

  function getFreeTab(options, cb){
    if (freeTabs.length === 0){
      return chrome.tabs.create(options, cb);
    } else {
      // return the free tab pointed to the passed in URL
      return chrome.tabs.update(freeTabs.pop(), {url: options.url}, cb);
    }
  }

  function removeTab(tabId){
    if (freeTabs.length > MAX_FREE_TABS){
      // too many free tabs in the background, actually close this one
      return chrome.tabs.remove(tabId);
    }
    // save this in the "tab pool" for use later
    freeTabs.push(tabId);
    // pause executation on this tab
    pauseTab(tabId);
  }

  function pauseTab(tabId){
    return;
    chrome.debugger.attach({tabId: tabId}, "1.1", function(){
      chrome.debugger.sendCommand({tabId: tabId}, "pause", function(args){
        console.log("paused", tabId, args);
        //chrome.debugger.detach({tabId: tabId});
      });
    });
  }

  var attribute = function(parent, child) {
    creator[child.id] = parent.id;
    if (!(parent.id in created)) {
      created[parent.id] = {};
    }
    created[parent.id][child.id] = true;
  };

  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tab.url === redirectPage) {
      return;
    }
    if ((tabId in creator) && (changeInfo.status === "loading" || changeInfo.status === "complete")) {
      chrome.tabs.sendMessage(creator[tabId], {tabId: tabId, status: changeInfo.status});
    }
  });

  chrome.tabs.onRemoved.addListener(function(tabId) {
    if (!(tabId in created)){
      return;
    }
    for (var id in created[tabId]) {
      if (created[tabId].hasOwnProperty(id)){
        id = parseInt(id, 10);
        //chrome.tabs.remove(id);
        removeTab(id);
        delete created[tabId][id];
      }
    }
  });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    var setupTab = function(tab) {
      urlToId[request.preLoad] = tab.id;
      sendResponse(tab.id);
      attribute(sender.tab, tab);
    };

    if (request.requestRedirect){
      getMinimizedWindowId(function(minimized_id){
        if (sender.tab.windowId !== minimized_id){
          lastBack = sender.tab.id;
        }
        if (tabHistory[sender.tab.id].length === 0){
          return "about:blank";
        }
        //console.log("popping", tabHistory[sender.tab.id].pop());
        tabHistory[sender.tab.id].currentPage = tabHistory[sender.tab.id].history.pop();
        sendResponse(tabHistory[sender.tab.id].currentPage);
        // console.log("redirecting to", tabHistory[sender.tab.id]);
      });
    }

    if (request.preLoad) {
      getMinimizedWindowId(function(minimized_id) {
        window.redirectTo = request.preLoad;
        // console.log(redirectPage);
        getFreeTab({windowId: minimized_id, url: redirectPage}, function(tab) {
          setupTab(tab);
          // clone parent tab's history
          tabHistory[tab.id] = {
            history: tabHistory[sender.tab.id].history.slice(0),
            currentPage: tabHistory[sender.tab.id].currentPage
          };
          if (tabHistory[tab.id].currentPage){
            // push the tab's current page onto the backstack
            tabHistory[tab.id].history.push(tabHistory[tab.id].currentPage);
          }
          // put the new page as the most recent history item
          tabHistory[tab.id].history.push(request.preLoad);
          tabHistory[tab.id].currentPage = null;
        });
      });
      return true;
    }

    if (request.load) {
      var tab_id = urlToId[request.load];
      // console.log("Loading page with backstack", tabHistory[tab_id]);
      delete created[sender.tab.id][tab_id];
      for (var id in created[sender.tab.id]) {
        if (created[sender.tab.id].hasOwnProperty(id)){
          id = parseInt(id, 10);
          if (id !== tab_id) {
            //chrome.tabs.remove(id);
            removeTab(id);
            delete created[sender.tab.id][id];
          }
        }
      }
      var index = request.meta ? -1 : sender.tab.index + 1;
      chrome.tabs.move(tab_id, {windowId: sender.tab.windowId, index: index}, function() {
        if (request.meta) {
          // chrome.tabs.duplicate(tab_id);
        } else {
          chrome.tabs.update(tab_id, {highlighted: true});
          // TODO: don't remove this tab and instead send to background if we need more free tabs
          chrome.tabs.remove(sender.tab.id);
        }
      });
    }
    return true;
  });

  // Begin History Stuff
  var tabHistory = {};

  var tabId = -1, historyProgress = 0;

  chrome.webNavigation.onCommitted.addListener(function(details){
    /*if (details.frameId === 0 && tabHistory.hasOwnProperty(details.tabId)){
      var historyObj = tabHistory[details.tabId];
      if (historyObj.loading && historyObj.history.length > historyObj.index){
        console.log("Just loaded " + details.url + " for endgoal of " + historyObj.history[historyObj.length - 1]);
        chrome.tabs.update(details.tabId, {url: historyObj.history[historyObj.index++]});
      }
    }*/
  });

  chrome.webNavigation.onCompleted.addListener(function(details){
    if (details.frameId !== 0){
      return;
    }
    if (details.tabId === lastBack){
      lastBack = null;
      // update the current page now that back is complete
      //tabHistory[details.tabId].currentPage = details.url;
      return;
    }
    getMinimizedWindowId(function(minimized_id){
      chrome.tabs.get(details.tabId, function(tab){
        if (tab.windowId !== minimized_id){
          if (!tabHistory.hasOwnProperty(details.tabId)){
            tabHistory[details.tabId] = {
              history: [],
              currentPage: null
            };
          }
          if (tabHistory[details.tabId].currentPage){
            // this wasn't a back button, so push current page onto the stack
            var historyObj = tabHistory[details.tabId];
            // don't push same page twice
            if (historyObj.history[historyObj.history.length - 1] !== historyObj.currentPage &&
                historyObj.currentPage !== details.url){
              // console.log("pushing current page", historyObj.history[historyObj.history.length - 1], historyObj.currentPage, historyObj);
              tabHistory[details.tabId].history.push(tabHistory[details.tabId].currentPage);
            }
          }
          // update current page
          // console.log("Setting current page to", details.url, tabHistory[details.tabId]);
          tabHistory[details.tabId].currentPage = details.url;
          /*console.log("pushing", tabHistory[details.tabId], details.url);
          tabHistory[details.tabId].push(details.url);*/
        }
      });
    });
  });

  chrome.tabs.onCreated.addListener(function(tab){
    getMinimizedWindowId(function(minimized_id){
      if (tab.windowId !== minimized_id){
        tabHistory[tab.id] = {
          history: [],
          currentPage: null
        };
      }
    });
  });

  chrome.tabs.onRemoved.addListener(function(tabId){
    delete tabHistory[tabId];
  });

  chrome.windows.getAll(function(windows) {
    for(var i = 0; i < windows.length; i++) {
      if (windows[i].state === "minimized") {
        return true;
      }
    }
    getMinimizedWindowId(function() {});
  });

}());
