
(function() {
	var links = [];

	window.nearestLink = function(data) {
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
					bestLink = links[i].link;
					bestLinkDist = dist;
				} 
			}
			// orthogonal line to horizontal bounds
			if (x > links[i].x1 && x < links[i].x2) {
				var y1Dist = Math.abs(y - links[i].y1);
				if (y1Dist < bestLinkDist) {
					bestLink = links[i].link;
					bestLinkDist = y1Dist;
				}
				var y2Dist = Math.abs(y - links[i].y2);
				if (y2Dist < bestLinkDist) {
					bestLink = links[i].link;
					bestLinkDist = y2Dist;
				}
			}

			// orthogonal line to vertical bounds
			if (y > links[i].y1 && y < links[i].y2) {
				var x1Dist = Math.abs(x - links[i].x1);
				if (x1Dist < bestLinkDist) {
					bestLink = links[i].link;
					bestLinkDist = x1Dist;
				}
				var x2Dist = Math.abs(x - links[i].x2);
				if (x2Dist < bestLinkDist) {
					bestLink = links[i].link;
					bestLinkDist = x2Dist;
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