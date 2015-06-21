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
    vMag = 0,
    p = { x : 0, y : 0 },
    timeStep = 12,
    mouseX = 0,
    mouseY = 0,
    t = 12, // average time delta between frames
    predictedPt = { x : 0, y : 0 },
    radius = 15;

var predictNextPt = function() {
    if (p.x && p.y) {
        // update velocities, with smoothing
        v.x = v.x * 0.7 + (mouseX - p.x) * 0.3;
        v.y = v.y * 0.7 + (mouseY - p.y) * 0.3;
    }

    p.x = mouseX;
    p.y = mouseY;
    vMag = Math.sqrt(v.x * v.x + v.y * v.y);
    if (vMag < 0.1)
        v.x = v.y = 0;

    predictedPt.x = predictedPt.x * 0.75 + (p.x + v.x * t) * 0.25;
    predictedPt.y = predictedPt.y * 0.75 + (p.y + v.y * t) * 0.25;

    console.log(vMag);
}

var $closestElem, closestElemColor;
var closestLink = function(x, y) {
    var $elem = $.nearest({x : x, y : y}, 'a[href]');
    if ($elem === $closestElem)
        return $elem;
    
    // restore old closest to original color
    if ($closestElem)
        $closestElem.css('color', closestElemColor);

    // save current state of new closest and then update color
    closestElemColor = $elem.css('color');
    $closestElem = $elem;
    $elem.css('color', 'red');
    return $elem;
}

$(document).mousemove(function(e) {
    mouseX = e.pageX;
    mouseY = e.pageY;
});

var timer = setInterval(function() {
    predictNextPt();
    $circle.css({
        'width' : '' + (radius * 2) + 'px',
        'height' : '' + (radius * 2) + 'px',
        'left' : predictedPt.x - 15,
        'top' : predictedPt.y - 15,
        'display' : 'block'
    });
    console.log(closestLink(predictedPt.x, predictedPt.y));
}, 16); // 60fps
