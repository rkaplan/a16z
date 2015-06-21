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
var created = {};

var attribute = function(parent, child) {
  creator[child.id] = parent.id;
  if (parent.id in created) {
    created[parent.id].push(child.id);
  } else {
    created[parent.id] = [child.id];
  }
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  console.log(creator, tabId);
  if ((tabId in creator) && (changeInfo.status == "loading" || changeInfo.status == "complete")) {
    console.log(changeInfo);
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
    console.log(request);
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
        chrome.tabs.remove(sender.tab.id);
      }
    });
  }
  return true;
});
