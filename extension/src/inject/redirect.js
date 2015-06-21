chrome.runtime.sendMessage({requestRedirect: true}, function(response) {
   window.location.href = response;
});
