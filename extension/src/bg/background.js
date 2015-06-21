/*global chrome*/
(function(){
  "use strict";
  var getMinimizedWindowId = function(cb) {
    chrome.windows.getAll(function(windows) {
      for (var i = 0; i < windows.length; i++) {
        if (windows[i].state === "minimized") {
          return cb(windows[i].id);
        }
      }
      chrome.windows.create(function(minimized) {
        chrome.windows.update(minimized.id, {state: "minimized"}, function() {
          cb(minimized.id);
        });
      });
    });
  };


  var urlToId = {};
  var creator = {};
  var created = {};

  var MAX_HISTORY_SIZE = 5;

  var attribute = function(parent, child) {
    creator[child.id] = parent.id;
    if (parent.id in created) {
      created[parent.id].push(child.id);
    } else {
      created[parent.id] = [child.id];
    }
  };

  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    //console.log(creator, tabId);
    if ((tabId in creator) && (changeInfo.status === "loading" || changeInfo.status === "complete")) {
      //console.log(changeInfo);
      chrome.tabs.sendMessage(creator[tabId], {tabId: tabId, status: changeInfo.status});
    }
  });

  // chrome.tabs.onRemoved.addListener(function(tabId) {
  //   if (tabId in created) {
  //
  //   }
  // });

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.preLoad) {
      //console.log(request);
      getMinimizedWindowId(function(minimized_id) {
        var url = request.preLoad, loadingHistory = false;
        if (tabHistory.hasOwnProperty(sender.tab.id) && tabHistory[sender.tab.id].history.length > 0){
          var obj = tabHistory[sender.tab.id];
          //obj.history.push(url);
          url = obj.history[0];
          loadingHistory = true;
        }
        chrome.tabs.create({windowId: minimized_id, url: url}, function(tab) {
          urlToId[request.preLoad] = tab.id;
          sendResponse(tab.id);
          attribute(sender.tab, tab);
          if (loadingHistory){
            // clone history for current tab and then insert most recent url
            tabHistory[tab.id] = tabHistory[sender.tab.id];
            tabHistory[tab.id].history.push(request.preLoad);
            //tabHistory[tab.id].loading = true;
          }
        });
      });
      return true;
    }

    if (request.load) {
      var tab_id = urlToId[request.load];
      created[sender.tab.id].forEach(function(id) {
        if (id !== tab_id) {
          chrome.tabs.remove(id);
        }
      });
      var index = request.meta ? -1 : sender.tab.index + 1;
      chrome.tabs.move(tab_id, {windowId: sender.tab.windowId, index: index}, function() {
        // console.log(arguments);
        if (request.meta) {
          // chrome.tabs.duplicate(tab_id);
        } else {
          chrome.tabs.update(tab_id, {highlighted: true});
          tabHistory[tab_id].loading = false;
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
    getMinimizedWindowId(function(minimized_id){
      chrome.tabs.get(details.tabId, function(tab){
        if (tab.windowId !== minimized_id){
          if (!tabHistory.hasOwnProperty(details.tabId)){
            tabHistory[details.tabId] = {
              history: [],
              index: 0,
              loading: false
            };
          }
          tabHistory[details.tabId].history.push(details.url);
        }
      });
    });
  });

  chrome.tabs.onCreated.addListener(function(tab){
    getMinimizedWindowId(function(minimized_id){
      if (tab.windowId !== minimized_id){
        tabHistory[tab.id] = {
          history: [],
          index: 0,
          loading: false
        };
      }
    });
  });

  chrome.tabs.onRemoved.addListener(function(tabId){
    delete tabHistory[tabId];
  });
}());
