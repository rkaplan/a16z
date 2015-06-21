(function() {
    var data = localStorage.getItem('data');
    if (typeof data !== "object")
        data = [];

    var possibleStarts = [];
    for (var x = 400; x <= 700; x += 100) {
        for (var y = 100; y <= 400; y += 100) {
            possibleStarts.push({x : x, y : y});
        }
    }

    var N = 0;
    var TRIALS = 150;

    var frames = [],
        startTime = null,
        start = { x : 0, y : 0 },
        target = { x : 0, y : 0 },
        peakV = 0;

    var v = { x : 0, y : 0 },
        p = { x : 0, y : 0 },
        mouseX = 0,
        mouseY = 0;

    var c = {
        $circle : $('<div>').css({
                        'border-radius' : '50%',
                        'width' : '50px', 
                        'height' : '50px', 
                        'background' : 'rgb(255, 0, 0)',
                        'border' : '3px solid red',
                        'position' : 'absolute',
                        'z-index' : 99999,
                    })
    };

    var resetCircle = function() {
        N += 1;

        // var newPos = possibleStarts[Math.floor(Math.random() * possibleStarts.length)];
        // while (newPos.x == c.x && newPos.y == c.y) {
        //     newPos = possibleStarts[Math.floor(Math.random() * possibleStarts.length)];
        // }
        var newPos = {
            x : 400 + Math.floor(Math.random() * 300),
            y : 100 + Math.floor(Math.random() * 300)
        }

        frames = [];
        start = { x : mouseX, y : mouseY };
        target = { x : newPos.x, y : newPos.y };
        peakV = 0;

        c.$circle.css({
            left : '' + (target.x - 25) + 'px',
            top : '' + (target.y - 25) + 'px'
        });

        c.$circle.show();
        startTime = new Date().getTime();
    }

    var timer = setInterval(function() {
        if (!startTime)
            return;

        if (p.x && p.y) {
            // update velocities, with smoothing
            v.x = v.x * 0.7 + (mouseX - p.x) * 0.3;
            v.y = v.y * 0.7 + (mouseY - p.y) * 0.3;
        }

        p.x = mouseX;
        p.y = mouseY;
        vMag = Math.sqrt(v.x * v.x + v.y * v.y);

        if (vMag > peakV) {
            peakV = vMag;
        }

        var dt = new Date().getTime() - startTime;
        frames.push({
            dt : dt,
            vMag : vMag
        });
    }, 33);

    c.$circle.click(function(e) {
        c.$circle.hide();

        // save data
        var dx = target.x - start.x;
        var dy = target.y - start.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var datum = {
            // frames : frames,
            start : start,
            target : target,
            peakV : peakV,
            dist : dist,
            totalTime : new Date().getTime() - startTime
        };
        if (datum.totalTime < 5000) {
            data.push(datum);
            console.log('dist = ' + dist + ', peakV = ' + peakV);
        } else {
            console.log('too slow, ignoring');
        }

        localStorage.setItem('data', data);

        // rerender
        if (N < TRIALS) {
            console.log('trial ' + N);
            setTimeout(resetCircle, 500);
        } else {
            console.log('all done!');
            window.location = "data:text/plain," + JSON.stringify(data);
        }
    });

    $(document).mousemove(function(e) {
        mouseX = e.pageX;
        mouseY = e.pageY;
    });

    $(document).ready(function() {
        c.$circle.appendTo('body');
        resetCircle();
    });
})();