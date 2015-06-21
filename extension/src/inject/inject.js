var idToLink = {};

var preloadLinks = function(links) {
	links.forEach(function(link) {
		var href = link.getAttribute("href");
		chrome.runtime.sendMessage({preLoad: href}, function(tabId) {
			idToLink[tabId] = link;
		});
		link.addEventListener("click", function() {
			chrome.runtime.sendMessage({load: href});
		})

	});
}

var linkStarted = function(link) {
	console.log("STARTED LOADING", link);
	link.style.color = "red";
}

var linkFinished = function(link) {
	console.log("LINK FINISHED", link);
	link.style.color = "green";
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.tabId) {
			var link = idToLink[request.tabId];
			if (request.status == "loading") {
				linkStarted(link);
			} else {
				linkFinished(link);
			}
		}
});

var links = Array.prototype.slice.call(document.querySelectorAll("a"));
links.forEach(function(link) {
	var loader = function() {
		link.removeEventListener("mouseover", loader);
		preloadLinks([link]);
	};
	link.addEventListener("mouseover", loader);
});
