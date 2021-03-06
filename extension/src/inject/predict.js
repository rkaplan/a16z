var K_SAME_PREDICTION_THRESHOLD_MS = 250; // only preload if the same link has been prediced for this many ms
var SHOW_PREDICTION_CIRCLE = false;
var SHOW_LINK_COLOR = false;
var mouseMoved = false; // set to true on the first mouse move

var $circle = $('<div>').css({
    'border-radius' : '50%',
    'width' : '30px',
    'height' : '30px',
    'background' : 'rgba(0, 0, 0, 0)',
    'border' : '3px solid red',
    'position' : 'absolute',
    'pointer-events' : 'none',
    'z-index' : 99999,
    'display' : 'none'
}).appendTo('body');

var v = { x : 0, y : 0 },
    p = { x : 0, y : 0 },
    predictedPt = {
        x : 0,
        y : 0,
        fresh : false
    },
    vMag = 0,
    mouseX = 0,
    mouseY = 0,
    curMotion = {
        startPt : { x : 0, y : 0},
        peakVel : { x : 0, y : 0, mag : 0},
        active : false
    },

    radius = 15;

var predictNextPt = function() {
    if (p.x && p.y) {
        // update velocities, with smoothing
        v.x = v.x * 0.7 + (mouseX - p.x) * 0.3;
        v.y = v.y * 0.7 + (mouseY - p.y) * 0.3;
    }

    if (p.x == mouseX && p.y == mouseY && curMotion.active) { // motion just ended
        // reset data about this motion
        curMotion = {
            startPt : { x : 0, y : 0},
            peakVel : { x : 0, y : 0, mag : 0},
            active : false
        };

        // we now have the most accurate "prediction"
        predictedPt = {
            x : p.x,
            y : p.y
        };

    } else if (p.x == mouseX && p.y == mouseY && !curMotion.active) { // idle
        predictedPt = {
            x : p.x,
            y : p.y,
            fresh : false
        };

    } else if ((p.x != mouseX || p.y != mouseY) && !curMotion.active) { // we're beginning a new motion
        curMotion.startPt.x = mouseX;
        curMotion.startPt.y = mouseY;
        curMotion.peakVel.x = 0;
        curMotion.peakVel.y = 0;
        curMotion.active = true;
        predictedPt.fresh = true;
    }

    p.x = mouseX;
    p.y = mouseY;
    vMag = Math.sqrt(v.x * v.x + v.y * v.y);
    if (vMag < 0.1)
        v.x = v.y = 0;

    if (vMag > curMotion.peakVel.mag && curMotion.active) {
        curMotion.peakVel.x = v.x;
        curMotion.peakVel.y = v.y;
        curMotion.peakVel.mag = vMag;
        curMotion.peakVel.cosT = v.x / vMag;
        curMotion.peakVel.sinT = v.y / vMag;
    }

    var A = 5.5, B = 38.0; // obtained from linear regression on Russell's training data
    var xDist = A * curMotion.peakVel.x + B * curMotion.peakVel.cosT;
    var yDist = A * curMotion.peakVel.y + B * curMotion.peakVel.sinT;
    if (curMotion.active) {
        predictedPt.x = curMotion.startPt.x + xDist,
        predictedPt.y = curMotion.startPt.y + yDist;
    }
}

var $closestElem, closestElemColor;
var closestLink = function(x, y) {
    // var elem = $.nearest({x : x, y : y}, 'a[href]')[0];
    var elem = window.nearestLink({x : x, y : y});
    return elem;
    // if (elem)
    //     return $(elem);
    // return false;
    // if (!$elem)
    //     return false;
    // if (!SHOW_LINK_COLOR || $elem === $closestElem)
    //     return $elem;

    // // restore old closest to original color
    // if ($closestElem)
    //     $closestElem.css('color', closestElemColor);

    // // // save current state of new closest and then update color
    // closestElemColor = $elem.css('color');
    // $closestElem = $elem;
    // $elem.css('color', 'red');
    // return $elem;
}

var lastPred, lastPredTime;
var alreadyPreloaded = {};
var setInstantaneousPrediction = function(link) {
    var curTime = new Date().getTime();

    if(!lastPred) { // first prediction
        lastPred = link;
        lastPredTime = curTime;

    } else {
        // same prediction for several ms
        if (lastPred == link && curTime - lastPredTime >= K_SAME_PREDICTION_THRESHOLD_MS) {

            // we haven't preloaded it before, so preload
            if (!alreadyPreloaded.hasOwnProperty(link.href)) {
                console.log("preloading " + link.href);
                insertCircle($(link));
                setMostLikely($(link));
                setPriors($(link), 1);
                preloadLinks([link]);
                alreadyPreloaded[link.href] = true;
            }

        // prediction changed before the preload threshold
        } else if (lastPred != link) {
            lastPred = link;
            lastPredTime = curTime;
        }
    }
    return false;
}

var timer = function() {
    predictNextPt();

    if (predictedPt.fresh && SHOW_PREDICTION_CIRCLE) {
        $('<div>').css({
            'border-radius' : '50%',
            'width' : '' + (radius * 2) + 'px',
            'height' : '' + (radius * 2) + 'px',
            'left' : predictedPt.x - 15,
            'top' : predictedPt.y - 15,
            'background' : 'rgba(0, 0, 0, 0)',
            'border' : '3px solid red',
            'position' : 'absolute',
            'pointer-events' : 'none',
            'z-index' : 99999,
            'display' : 'block'
        }).appendTo('body');
        // $circle.css({
        //     'width' : '' + (radius * 2) + 'px',
        //     'height' : '' + (radius * 2) + 'px',
        //     'left' : predictedPt.x - 15,
        //     'top' : predictedPt.y - 15,
        //     'display' : 'block'
        // });
    }

    var link = closestLink(predictedPt.x, predictedPt.y);
    if (link)
        setInstantaneousPrediction(link);
    requestAnimationFrame(timer);
};

var loadPriors = function() {
  var url = encodeURIComponent(location.href);
  var as = Array.prototype.slice.call(document.querySelectorAll("a"));
  var aDict = {};
  as.forEach(function(a) {
    var path = absolutePath(a);
    if (path in aDict) return;
    aDict[path] = a;
  });

  $.getJSON("https://a16z.herokuapp.com/a/popular/" + url + "?limit=5", function(data) {
    var anchors = data.entries.map(function(entry) {
      return {a: aDict[entry.url], prior: entry.weight};
    }).filter(function(entry) {
      return entry.a;
    });
    var preloaders = anchors.slice(0, 3);
    preloaders.forEach(function(entry) {
      var el = $(entry.a);
      insertCircle(el);
      setPriors(el, Math.random());
      // setPriors(el, entry.prior / data.numClicks);
    });
    preloadLinks(preloaders.map(function(e) {return e.a}).slice(0, 2));
  });

}

$(document).mousemove(function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;

    if(!mouseMoved) { // first mouse move on page
        requestAnimationFrame(timer);
        mouseMoved = true;
        loadPriors();
    }
});

// debugging:
$(document).click(function(e) {
    console.log('pageX : ' + e.pageX + ', pageY : ' + e.pageY);
});
