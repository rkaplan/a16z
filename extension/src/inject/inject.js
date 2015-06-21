// var API_URL = "https://a16z.herokuapp.com";
var API_URL = "https://16a664b2.ngrok.com";

var cacheUrl = function(url) {
	var frame = document.createElement("iframe");
	frame.style.display = "none";
	frame.src = API_URL + "/frame/" + encodeURIComponent(url);
	document.body.appendChild(frame);
};

if (location.href.indexOf(API_URL) !== -1) {
	// we're on our own frame site, don't inject or else we get a loop!
} else {
	// we're on something like nytimes.com, yay, time to inject
	chrome.runtime.onMessage.addListener(function(request) {
		alert(JSON.stringify(request));
	});
	cacheUrl(location.href);
}

// This needs to run on the iframe page
/*
var updateCacheStatus = function(e) {
    chrome.runtime.sendMessage("kdikmknnallalfkidkhnjleliajhople", {
        cacheEvent: e,
        url: decodeURIComponent(location.href.match(/.*\/(.*)$/)[1])
    });
}

window.applicationCache.addEventListener("progress", function (e) {
    updateCacheStatus({total: e.total, loaded: e.loaded});
});
*/
