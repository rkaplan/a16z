var minimized_id = null;
var creating = false;

var getMinimizedWindowId = function(cb) {
  if (minimized_id !== null) return cb(minimized_id);
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
}


var urlToId = {};
var creator = {};
var created = {};

var attribute = function(parent, child) {
  creator[child.id] = parent.id;
  if (!(parent.id in created)) {
    created[parent.id] = {}
  }
  created[parent.id][child.id] = true;
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if ((tabId in creator) && (changeInfo.status == "loading" || changeInfo.status == "complete")) {
    chrome.tabs.sendMessage(creator[tabId], {tabId: tabId, status: changeInfo.status});
  }
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  if (!(tabId in created)) return;
  for (id in created[tabId]) {
    id = parseInt(id);
    chrome.tabs.remove(id);
    delete created[tabId][id];
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  if (request.preLoad) {
  	console.log(request.preLoad, sender.tab.url);
    getMinimizedWindowId(function(minimized_id) {
      chrome.tabs.create({windowId: minimized_id, url: request.preLoad}, function(tab) {
        urlToId[request.preLoad] = tab.id;
        sendResponse(tab.id);
        attribute(sender.tab, tab);
      });
    });
    return true;
  }

  if (request.load) {
    var tab_id = urlToId[request.load];
    delete created[sender.tab.id][tab_id];
    for (id in created[sender.tab.id]) {
      id = parseInt(id);
      if (id !== tab_id) {
        chrome.tabs.remove(id);
        delete created[sender.tab.id][id];
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
