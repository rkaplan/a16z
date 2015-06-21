chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    tabs.forEach(function(tab) {
      chrome.tabs.sendMessage(tab.id, request, function(response) {
        console.log(response.farewell);
      });
    });
  });
});

// var responseListener = function(details){
//     var rule = {
//         "name": "Origin",
//         "value": "http://localhost:3000"
//     };
//     console.log(details.responseHeaders);
//     details.responseHeaders.push(rule);
//     return {responseHeaders: details.responseHeaders};
// };
//
//  chrome.webRequest.onHeadersReceived.addListener(responseListener,
//      {urls: [   "*://*/*" ] },
//      ["blocking", "responseHeaders"]);


var minimized_id = null;
var urlToId = {};
var idToUrl = {};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  if (request.preLoad) {
    var doIt = function() {
      chrome.tabs.create({windowId: minimized_id, url: request.preLoad}, function(tab) {
        urlToId[request.preLoad] = tab.id;
        idToUrl[tab.id] = request.preLoad;
        sendResponse({startLoad: request.preLoad});
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
    return;
  }

  if (request.load) {
    var tab_id = urlToId[request.load];
    chrome.tabs.move(tab_id, {windowId: sender.tab.windowId, index: sender.tab.index}, function() {
      // console.log(arguments);
      chrome.tabs.update(tab_id, {highlighted: true});
      chrome.tabs.remove(sender.tab.id);
    });
  }
});
