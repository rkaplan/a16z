/*global chrome*/
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

  var MAX_HISTORY_SIZE = 5;

  var attribute = function(parent, child) {
    creator[child.id] = parent.id;
    if (!(parent.id in created)) {
      created[parent.id] = {};
    }
    created[parent.id][child.id] = true;
  };

  chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
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
        chrome.tabs.remove(id);
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

    if (request.preLoad) {
      getMinimizedWindowId(function(minimized_id) {
        window.redirectTo = request.preLoad;
        console.log(redirectPage);
        chrome.tabs.create({windowId: minimized_id, url: redirectPage}, function(tab) {
          chrome.tabs.update(tab.id, {url: request.preLoad}, function(res) {
            console.log(res);
            setupTab(tab);
          });
        });
      });
      return true;
    }

    if (request.load) {
      var tab_id = urlToId[request.load];
      delete created[sender.tab.id][tab_id];
      for (var id in created[sender.tab.id]) {
        if (created[sender.tab.id].hasOwnProperty(id)){
          id = parseInt(id, 10);
          if (id !== tab_id) {
            chrome.tabs.remove(id);
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
            tabHistory[details.tabId] = [];
          }
          tabHistory[details.tabId].history.push(details.url);
        }
      });
    });
  });

  chrome.tabs.onCreated.addListener(function(tab){
    getMinimizedWindowId(function(minimized_id){
      if (tab.windowId !== minimized_id){
        tabHistory[tab.id] = [];
      }
    });
  });

  chrome.tabs.onRemoved.addListener(function(tabId){
    delete tabHistory[tabId];
  });
}());
