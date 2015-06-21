chrome.runtime.onMessageExternal.addListener(function(request, sender, sendResponse) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    tabs.forEach(function(tab) {
      chrome.tabs.sendMessage(tab.id, request, function(response) {
        console.log(response.farewell);
      });
    });
  });
});
