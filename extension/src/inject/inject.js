var idToLink = {};
var kickedOff = {};
var loadingLinks = {};

var absolutePath = function(link) {
   return (link.protocol+"//"+link.host+link.pathname+link.search+link.hash);
};

var handleClick = function(link) {
	return function(e) {
		var request = new XMLHttpRequest();
		request.open("POST", "https://a16z.herokuapp.com/a/record", true);
		request.setRequestHeader("Content-Type", "application/json");
		request.send(JSON.stringify({
	  	from: window.location.href,
	  	to: absolutePath(link)
		}));

		if (loadingLinks[link]) {
			e.preventDefault();
			chrome.runtime.sendMessage({load: absolutePath(link), meta: e.ctrlKey || e.metaKey});
		}
	}
}

var preloadLinks = function(links) {
	links.forEach(function(link) {
    var href = absolutePath(link);
    if (href.indexOf("mailto") !== -1) return;
    console.log('preloadLinks() : ' + href);
    if (kickedOff[href]) return;
    kickedOff[href] = true;
    link.style.color = "red";
		chrome.runtime.sendMessage({preLoad: href}, function(tabId) {
			idToLink[tabId] = link;
		});
		link.addEventListener("click", handleClick(link));
	});
}

var linkStarted = function(link) {
	// console.log("STARTED LOADING", link);
	link.style.color = "yellow";
}

var linkFinished = function(link) {
	// console.log("LINK FINISHED", link);
	link.style.color = "green";
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.tabId) {
		var link = idToLink[request.tabId];
		loadingLinks[link] = true;
		if (request.status == "loading") {
			linkStarted(link);
		} else {
			linkFinished(link);
		}
	}
});


// below code is for hover loading
// var links = Array.prototype.slice.call(document.querySelectorAll("a"));
// links.forEach(function(link) {
//        var loader = function() {
//                   link.removeEventListener("mouseover", loader);
//                   preloadLinks([link]);
//           };
//         link.addEventListener("mouseover", loader);
//   });
