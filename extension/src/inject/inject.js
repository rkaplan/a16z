window.preLoad = function(url) {
	chrome.runtime.sendMessage({preLoad: url});
}

window.load = function(url) {
	chrome.runtime.sendMessage({load: url});
}
