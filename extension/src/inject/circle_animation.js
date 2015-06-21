var intermediateColor = function(percent) {
  if(percent >= 0 && percent < 11.1) {
    return "#1789B4";
  } else if (percent >= 11.1 && percent < 22.2) {
    return "#179AB4";
  } else if (percent >= 22.2 && percent < 33.3) {
    return "#17B4AD";
  } else if (percent >= 33.3 && percent < 44.4) {
    return "#60D815";
  } else if (percent >= 44.4 && percent < 55.5) {
    return "#A4E719";
  } else if (percent >= 55.5 && percent < 66.6) {
    return "#E2E10A";
  } else if (percent >= 66.6 && percent < 77.7) {
    return "#FA940A";
  } else if (percent >= 77.7 && percent < 88.8) {
    return "#E95F0F";
  } else if (percent >= 88.8 && percent <= 100) {
    return "#DB1111";
  }
}

var insertCircle = function(linkElement) {
  return $('<div class="circle-container ready" style="transform: translateX(-16px) scale(1.5, 1.5)">\
      <div class="circle"></div>\
      <div class="circle-border"></div>\
    </div>').insertBefore(linkElement);
}

var startCircleAnimation = function(circleContainer) {
  circleContainer.removeClass('ready');
  var circle = circleContainer.children('.circle');
  circle.animate({textIndent: 100}, {
      // grow the loading circle
      step: function(current) {
        var scale = 1 + current * 0.03;
        circle.css('transform', 'scale(' + scale + ', ' + scale + ')');
      },
      duration: 2000,
    }
  )
}

// set COLORS based on priors
var setPriors = function(linkElement, prior) {
  var circle = linkElement.prev();
  var color = intermediateColor(prior*100);
  circle.children('.circle-border').css('border', '1px solid ' + color);
  circle.children('.circle').css('background-color', color);
}

// set SIZE based on mouse click likelihood
var setMostLikely = function(linkElement) {
  var circle = linkElement.prev();
  $('.circle-container').removeClass('likely');
  circle.addClass('likely');
}

// call when loading is done
var finishLoading = function(linkElement) {
  var circleContainer = linkElement.prev();
  var originalScale = circleContainer.hasClass('likely') ? 2.5 : 1.5;
  // make circle bounce
  circleContainer.animate({textIndent: 100}, {
      step: function(current) {
        var scale = -0.00024*originalScale*Math.pow(current, 2) + 0.026*originalScale*current + 0.8*originalScale;
        circleContainer.css('transform', 'translateX(-16px) scale(' + scale + ',' + scale + ')');
      },
      duration: 400
    }
  );
  // make ripple expand and fade
  circleContainer.children('.circle-border').animate( {textIndent: 100}, {
      step: function(current) {
        var scale = 1 + current*0.05;
        var opacity = 1 - current*0.01;
        $(this).css('transform', 'scale(' + scale + ',' + scale + ')');
        $(this).css('opacity', opacity);
      },
      duration: 800
    }
  );
}

var startLoading = function(linkElement) {
  startCircleAnimation(linkElement.prev());
  // TODO: actually load
}
