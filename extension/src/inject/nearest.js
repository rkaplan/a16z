var nearestLink;

(function() {
	var links = [];

	nearestLink = function(data) {
		if (links.length === 0)
			return;

		var x = data.x,
			y = data.y,
			bestLink,
			bestLinkDist = Infinity;
		for (var i = 0; i < links.length; i++) {
			var pts = [
				{ x : links[i].x1, y : links[i].y1 },
				{ x : links[i].x1, y : links[i].y2 },
				{ x : links[i].x2, y : links[i].y1 },
				{ x : links[i].x2, y : links[i].y2 }
			];
			for (var j = 0; j < pts.length; j++) {
				var dx = x - pts[j].x,
					dy = y - pts[j].y,
					dist = Math.sqrt(dx * dx + dy * dy);
				if (dist < bestLinkDist) {
					bestLink = links[i];
					bestLinkDist = dist;
				} 
			}
		}

		return bestLink;
	}

	$(document).ready(function() {
		var $links = $('a[href]');
		for (var i = 0; i < $links.length; i++) {
			var bbox = $links[i].getBoundingClientRect();
			links.push({
				x1 : Math.floor(bbox.left + window.scrollX),
				y1 : Math.floor(bbox.top + window.scrollY),
				x2 : Math.floor(bbox.right + window.scrollX),
				y2 : Math.floor(bbox.bottom + window.scrollY),
				link : $links[i]
			});
		}
	});
})();