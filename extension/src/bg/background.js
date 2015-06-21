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
}


var urlToId = {};
var creator = {};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if ((tabId in creator) && (changeInfo.status == "loading" || changeInfo.status == "complete")) {
    console.log(changeInfo);
    chrome.tabs.sendMessage(creator[tabId], {tabId: tabId, status: changeInfo.status});
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  if (request.preLoad) {
    getMinimizedWindowId(function(minimized_id) {
      chrome.tabs.create({windowId: minimized_id, url: request.preLoad}, function(tab) {
        urlToId[request.preLoad] = tab.id;
        sendResponse(tab.id);
        creator[tab.id] = sender.tab.id;
      });
    });
    return true;
  }

  if (request.load) {
    var tab_id = urlToId[request.load];
    var index = request.meta ? -1 : sender.tab.index + 1;
    chrome.tabs.move(tab_id, {windowId: sender.tab.windowId, index: index}, function() {
      // console.log(arguments);
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
