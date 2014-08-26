var d3 = require('d3');
require('./main.css');
var BezierCurve = require('../lib/bezier-curve');
var Rect = require('../lib/rect');

var svg = d3.select('#example').append('svg')
  .attr({
    width: 400,
    height: 400
  });

var handleRadius = 8;
var intersectionRadius = 4;

var curves = [
  {
    type: 'L',
    points: [
      {x: 25, y: 150},
      {x: 320, y: 254}
    ]
  },
  {
    type: 'L',
    points: [
      {x: 150, y: 125},
      {x: 145, y: 220}
    ]
  }
];

var mainLayer = svg.append('g').attr('class', 'main-layer');
var handleTextLayer = svg.append('g').attr('class', 'handle-text-layer');
var intersectionLayer = svg.append('g').attr('class', 'intersection-layer');
var handleLayer = svg.append('g').attr('class', 'handle-layer');

var drag = d3.behavior.drag()
  .origin(function(d) { return d; })
  .on('drag', dragmove);

function dragmove(d) {
  d.x = d3.event.x;
  d.y = d3.event.y;
  d3.select(this).attr({cx: d.x, cy: d.y});
  d.pathElem.attr('d', pathData);
  if (d.controlLineElem) {
  }
  handleTextLayer.selectAll('text.handle-text.path' + d.pathID + '.p' + (d.handleID + 1))
    .attr({x: d.x, y: d.y}).text(handleText(d, d.handleID));

  calcuateIntersection();
}

function pathData(d) {
  var p = d.points;
  switch (d.type) {
  case 'L':
    return [
      'M', p[0].x, ' ', p[0].y,
      ' ', p[1].x, ' ', p[1].y
    ].join('');
  case 'Q':
    return [
      'M', p[0].x, ' ', p[0].y,
      'Q', p[1].x, ' ', p[1].y,
      ' ', p[2].x, ' ', p[2].y
    ].join('');
  case 'C':
    return [
      'M', p[0].x, ' ', p[0].y,
      'C', p[1].x, ' ', p[1].y,
      ' ', p[2].x, ' ', p[2].y,
      ' ', p[3].x, ' ', p[3].y,
    ].join('');
  }
}

function handleText(d, i) {
  return 'p' + (i + 1) + ': ' + d.x + '/' + d.y;
}

mainLayer.selectAll('path.curves').data(curves)
  .enter().append('path')
  .attr({
    'class': function(d, i) { return 'curves path' + i; },
    d: pathData
  })
  .each(function (d, i) {
    var pathElem = d3.select(this),
        controlLineElem,
        handleTextElem;
    handleTextElem = handleTextLayer.selectAll('text.handle-text.path' + i)
      .data(d.points).enter().append('text')
      .attr({
        'class': function(handleD, handleI) {
          return 'handle-text path' + i + ' p' + (handleI + 1);
        },
        x: function(d) { return d.x },
        y: function(d) { return d.y },
        dx: 10,
        dy: 0
      })
      .text(handleText);
    handleLayer.selectAll('circle.handle.path' + i)
      .data(d.points).enter().append('circle')
      .attr({
        'class': 'handle path' + i,
        cx: function(d) { return d.x },
        cy: function(d) { return d.y },
        r: handleRadius
      })
      .each(function(d, handleI) {
        d.pathID = i;
        d.handleID = handleI;
        d.pathElem = pathElem;
        d.controlLineElem = controlLineElem;
      })
      .call(drag);

  });

function HomogeneousPoint(x, y, w) {
  this.x = x;
  this.y = y;
  this.w = (w === undefined ? 1 : w);
}

// You must check this.w is not zero in advance.
HomogeneousPoint.prototype.toPoint2D = function() {
  return { x: this.x / this.w, y: this.y / this.w };
}

HomogeneousPoint.fromPoint2D = function(p1, p2) {
  return new HomogeneousPoint(p1, p2);
};

HomogeneousPoint.getIntersection = function(l1, l2) {
  return new HomogeneousPoint(
    l1.b * l2.c - l2.b * l1.c,
    l2.a * l1.c - l1.a * l2.c,
    l1.a * l2.b - l2.a * l1.b
  );
};

function HomogeneousLine(a, b, c) {
  this.a = a;
  this.b = b;
  this.c = c;
}

HomogeneousLine.fromTwoHomogeneousPoints = function(p1, p2) {
  return new HomogeneousLine(
    p1.y * p2.w - p2.y * p1.w,
    p2.x * p1.w - p1.x * p2.w,
    p1.x * p2.y - p2.x * p1.y
  );
};

function calcuateIntersection() {
  var homogeneousIntersection
  var intersections = [];
  var lines = curves.map(function(curve) {
    var points = curve.points.map(function(p) {
      return HomogeneousPoint.fromPoint2D(p.x, p.y);
    });
    return HomogeneousLine.fromTwoHomogeneousPoints(points[0], points[1]);
  });
  lines.forEach(function(line, i) {
    console.log('i', i, 'line', line);
  });

  homogeneousIntersection = HomogeneousPoint.getIntersection(lines[0], lines[1]);
  console.log('homogeneous intersection', homogeneousIntersection);
  if (homogeneousIntersection.w !== 0) {
    intersections.push(homogeneousIntersection.toPoint2D());
    console.log('intersection', intersections[0]);
  }

  var elems = intersectionLayer.selectAll('.intersection').data(intersections);

  elems.enter().append('circle')
    .attr({
      'class': 'intersection',
      cx: function(d) { return d.x },
      cy: function(d) { return d.y },
      r: intersectionRadius
    });

  elems
    .attr({
      cx: function(d) { return d.x },
      cy: function(d) { return d.y },
    });

  elems.exit().remove();
}

calcuateIntersection();
