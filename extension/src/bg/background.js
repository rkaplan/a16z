


var minimized_id = null;
var urlToId = {};
var creator = {};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if ((tabId in creator) && (changeInfo.status == "loading" || changeInfo.status == "complete")) {
    chrome.tabs.sendMessage(creator[tabId], {tabId: tabId, status: changeInfo.status});
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  if (request.preLoad) {
    var doIt = function() {
      chrome.tabs.create({windowId: minimized_id, url: request.preLoad}, function(tab) {
        urlToId[request.preLoad] = tab.id;
        sendResponse(tab.id);
        creator[tab.id] = sender.tab.id;
      });
    }
    if (!minimized_id) {
      chrome.windows.create(function(minimized) {
        chrome.windows.update(minimized.id, {state: "minimized"}, function() {
          minimized_id = minimized.id;
          doIt();
        });
      });
    } else {
      doIt();
    }
    return true;
  }

  if (request.load) {
    var tab_id = urlToId[request.load];
    chrome.tabs.move(tab_id, {windowId: sender.tab.windowId, index: sender.tab.index}, function() {
      // console.log(arguments);
      chrome.tabs.update(tab_id, {highlighted: true});
      chrome.tabs.remove(sender.tab.id);
    });
  }
  return true;
});
