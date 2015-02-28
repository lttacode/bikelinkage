
// Rotating joint constraint, e.g. bearings.

var RotatorJoint = function(elem1, elem2) {
  this.elem1 = elem1;
  this.elem2 = elem2;

  elem1.makeEndJointed(1);
  elem2.makeEndJointed(0);
};

RotatorJoint.prototype.relax = function() {
  var elem1 = this.elem1, elem2 = this.elem2;

  // Move both elem ends to their middle position.
  var dx = (elem1.pt2.x - elem2.pt1.x) / 2,
      dy = (elem1.pt2.y - elem2.pt1.y) / 2,
      x = elem1.pt2.x - dx,
      y = elem1.pt2.y - dy;
  elem1.pinEnd(pt(x, y), 1);
  elem2.pinEnd(pt(x, y), 0);

  return dx + dy;
};

RotatorJoint.prototype.draw = function(canvas) {
  canvas.strokeStyle("#644");
  canvas.drawMarker(this.elem1.pt2, 6);
};

RotatorJoint.prototype.moveTo = function(to) {
  // Move associated elements.
  this.elem1.pinEnd(to, 1);
  this.elem2.pinEnd(to, 0);
};

RotatorJoint.prototype.position = function() {
  return this.elem1.pt1;
};

RotatorJoint.prototype.distance = function(from) {
  var dx = this.elem1.pt2.x - from.x,
      dy = this.elem1.pt2.y - from.y;
  return dx * dx + dy * dy;
};


// Half-fixed rotating joint constraints, e.g. affixed bearing.

var FixedRotatorJoint = function(fixed_pt, elem, elem_end) {
  this.fixedPt = fixed_pt;
  this.elem = elem;
  this.elemEnd = elem_end;
  elem.makeEndJointed(elem_end);
};

FixedRotatorJoint.prototype.relax = function() {
  return this.elem.pinEnd(this.fixedPt, this.elemEnd);
};

FixedRotatorJoint.prototype.draw = function(canvas) {
  var d = 4;
  var pt = this.elemEnd == 0 ? this.elem.pt1 : this.elem.pt2;

  canvas.strokeStyle("#FF0000");
  canvas.drawMarker(pt, 6);
  canvas.drawMarker(pt, 10);
};

FixedRotatorJoint.prototype.moveTo = function(to) {
  // Nop. Can't move a fixed rotator joint.
};

FixedRotatorJoint.prototype.position = function() {
  // Undefined. Can't move a fixed rotator joint.
};

FixedRotatorJoint.prototype.distance = function(from) {
  // Fixed rotator joints cannot be dragged.
  return Number.MAX_VALUE;
};


// Relative-fixed rotating joint constraints, e.g. bearing attached
// relative to a bar.

var RelativeFixedRotatorJoint = function(
    fixed_pt,
    elem,
    elem_float, float_end) {
  this.fixedPt = fixed_pt;
  this.elem = elem;
  this.elemFloat = elem_float;
  this.floatEnd = float_end;

  // Vector through points of elem.
  var lineVect = pt(elem.pt1.x - elem.pt2.x, elem.pt1.y - elem.pt2.y),
      lineLen = vec_len(lineVect),
      unitLine = pt(lineVect.x / lineLen, lineVect.y / lineLen);

  // Orthogonal vector to lineVect.
  var orthoVect = pt(lineVect.y, -lineVect.x),
      orthoLen = vec_len(lineVect),
      unitOrtho = pt(orthoVect.x / orthoLen, orthoVect.y / orthoLen);

  // Vector from pt1 on line through our third point.
  var linePtVect = pt(elem.pt1.x - fixed_pt.x, elem.pt1.y - fixed_pt.y);

  // linePtVect projected along line defined by element's points.
  var distPtAlongLine = (linePtVect.x * unitLine.x + linePtVect.y * unitLine.y);

  // Distance of point projected along orthoganl to line of element.
  var distPtAlongOrtho =
      (linePtVect.x * unitOrtho.x + linePtVect.y * unitOrtho.y);

  var vl = vec_len(lineVect), ol = vec_len(orthoVect),
      va = (linePtVect.x * lineVect.x + linePtVect.y * lineVect.y);

  debugVect(lineVect, "#0000FF");
  debugVect(orthoVect, "#00FF00");

  this.distLine = distPtAlongLine;
  this.distOrtho = distPtAlongOrtho;
};

RelativeFixedRotatorJoint.prototype.relax = function() {
  var elem = this.elem;

  // Vector through points of elem.
  var lineVect = pt(elem.pt1.x - elem.pt2.x, elem.pt1.y - elem.pt2.y),
      lineLen = vec_len(lineVect),
      unitLine = pt(lineVect.x / lineLen, lineVect.y / lineLen);

  // Orthogonal vector to lineVect.
  var orthoVect = pt(lineVect.y, -lineVect.x),
      orthoLen = vec_len(lineVect),
      unitOrtho = pt(orthoVect.x / orthoLen, orthoVect.y / orthoLen);

  // New location is elem.pt1 + distOrtho along orthoVect + distLine along
  // lineVect.
  var s = this;
  var dx = s.distOrtho * unitOrtho.x + s.distLine * unitLine.x,
      dy = s.distOrtho * unitOrtho.y + s.distLine * unitLine.y;
  var p = pt(
      elem.pt1.x - dx,
      elem.pt1.y - dy);

  var elem_dx = pt_dx(p, this.fixedPt);
  var elem_dy = pt_dy(p, this.fixedPt);

  // Move the floating end half-way to necessary point.
  this.fixedPt = pt(this.fixedPt.x + elem_dx, this.fixedPt.y + elem_dy);
  this.elemFloat.pinEnd(this.fixedPt, this.floatEnd);

  // Move the linkage bar element half-way towards link as well.
  elem.pinEnd(pt(elem.pt1.x + elem_dx / 2, elem.pt1.y + elem_dx / 2), 0);
  elem.pinEnd(pt(elem.pt2.x + elem_dx / 2, elem.pt2.y + elem_dx / 2), 1);

  window.debugCanvas.strokeStyle("#FF00FF");
  window.debugCanvas.drawMarker(pt(elem.pt1.x + dx / 2, elem.pt1.y + dy / 2));
  window.debugCanvas.drawMarker(pt(elem.pt2.x + dx, elem.pt2.y + dy));

  var error = elem_dx * elem_dx + elem_dy * elem_dy;
  return error;
};

RelativeFixedRotatorJoint.prototype.draw = function(canvas) {
  canvas.strokeStyle("#0099AA");
  canvas.drawMarker(this.fixedPt, 6);
  canvas.drawMarker(this.fixedPt, 12);
};

RelativeFixedRotatorJoint.prototype.moveTo = function(to) {
  this.fixedPt = to;
};

RelativeFixedRotatorJoint.prototype.position = function() {
  return this.fixedPt;
};

RelativeFixedRotatorJoint.prototype.distance = function(from) {
  return pt_diff(this.fixedPt, from);
};


// Bar element, fixed connection between two joints.

var BarElement = function(pt1, pt2) {
  this.pt1 = pt1;
  this.pt2 = pt2;

  // If the ends are jointed, then they cannot be dragged, otherwise they can.
  this.jointedEnds = [false, false];

  var dx = pt1.x - pt2.x,
      dy = pt1.y - pt2.y;
  this.length = Math.sqrt(dx * dx + dy * dy);
};

BarElement.prototype.relax = function() {
  return this.lengthenTo(this.length);
}

BarElement.prototype.lengthenTo = function(toLength) {
  var l = pt_diff(this.pt1, this.pt2),
      sl = Math.sqrt(l),
      dl = (toLength - sl) / 2,
      dx = (this.pt1.x - this.pt2.x) / sl,
      dy = (this.pt1.y - this.pt2.y) / sl;

  this.pt1 = pt(this.pt1.x + dl * dx, this.pt1.y + dl * dy);
  this.pt2 = pt(this.pt2.x - dl * dx, this.pt2.y - dl * dy);

  return dl * dl;
};

BarElement.prototype.draw = function(canvas) {
  //canvas.strokeStyle("#FF00FF");
  canvas.line(this.pt1, this.pt2);
};

BarElement.prototype.pinEnd = function(pt, end) {
  var dt = 0;
  if (end == 0) {
    dt = pt_diff(this.pt1, pt);
    this.pt1 = pt;
  } else {
    dt = pt_diff(this.pt2, pt);
    this.pt2 = pt;
  }
  return dt;
};

BarElement.prototype.makeEndJointed = function(end) {
  this.jointedEnds[end] = true;
}

BarElement.prototype.moveTo = function(to) {
  var dx1 = this.jointedEnds[0] ?
          Number.MAX_VALUE : (to.x - this.pt1.x),
      dx2 = this.jointedEnds[1] ?
          Number.MAX_VALUE : (to.x - this.pt2.x),
      dy1 = this.jointedEnds[0] ?
          Number.MAX_VALUE : (to.y - this.pt1.y),
      dy2 = this.jointedEnds[1] ?
          Number.MAX_VALUE : (to.y - this.pt2.y),
      dx = Math.min(dx1, dx2),
      dy = Math.min(dy1, dy2);
  if (!this.jointedEnds[0]) {
    this.pt1.x += dx;
    this.pt1.y += dy;
  }
  if (!this.jointedEnds[1]) {
    this.pt2.x += dx;
    this.pt2.y += dy;
  }
};

BarElement.prototype.position = function() {
  // TODO(ltta): This doesn't really work but we mostly move joints.
  debugger;

  if (!this.jointedEnds[1]) {
    return this.pt2;
  }
  return this.pt1;
};

BarElement.prototype.distance = function(from) {
  // Dragging jointed ends not supported, so set dist to max int if jointed.
  var d1 = this.jointedEnds[0] ?
          Number.MAX_VALUE : pt_diff(from, this.pt1),
      d2 = this.jointedEnds[1] ?
          Number.MAX_VALUE : pt_diff(from, this.pt2);

  return Math.min(d1, d2);
};


// Spring, elastic connetion between to joints, stroke defines maximum
// compression, initial length is maximum extension.

var Spring = function(pt1, pt2, stroke) {
  this.stroke = stroke;
  Spring.prototype.parent.call(this, pt1, pt2);

  this.maxLength = this.length;
  this.minLength = this.length - stroke;
};
Spring.prototype = Object.create(BarElement.prototype);
Spring.prototype.parent = BarElement;

Spring.prototype.relax = function() {
  var l = pt_diff(this.pt1, this.pt2);

  if (l < this.minLength * this.minLength) {
    return this.lengthenTo(this.minLength);
  } else if (l > this.maxLength * this.maxLength) {
    return this.lengthenTo(this.maxLength);
  }
  return 0;
};


// Iterative constraint relaxation solver.

var IterativeConstraintSolver = function(
    canvas, constraints, epsilon, max_iter) {
  this.constraints = constraints;
  this.epsilon = epsilon;
  this.maxIter = max_iter;
  this.canvas = canvas;

  window.debugCanvas = canvas;
};

IterativeConstraintSolver.prototype.solve = function() {
  var error = 2 * this.epsilon;
  var iter = 0;
  while (error > this.epsilon && iter++ < this.maxIter) {
    error = 0;
    for (var i = 0; i < this.constraints.length; ++i) {
      error += this.constraints[i].relax();

      // TODO(ltta): Remove. Used for debugging for now.
      if (isNaN(error)) {
        debugger;
      }
    }
  }
  console.log(error, iter);
  return error < 2 * this.epsilon;
};

IterativeConstraintSolver.prototype.drawConstraints = function(strokeStyle) {
  this.canvas.clear();

  if (!strokeStyle) {
    strokeStyle = "#FF0000";
  }
  this.canvas.strokeStyle(strokeStyle);

  for (var i = 0; i < this.constraints.length; ++i) {
    this.constraints[i].draw(this.canvas);
  }
}

IterativeConstraintSolver.prototype.findClosestConstraint = function(
       point, max_dist) {
  // Square max dist so we don't have to sqrt.
  max_dist = max_dist * max_dist;

  for (var i = 0; i < this.constraints.length; ++i) {
    var c = this.constraints[i]
    if (c.distance(point) < max_dist) {
      return i;
    }
  }
  return null;
};


// Utilities.

function pt_dy(pt1, pt2) {
  return pt1.y - pt2.y;
}

function pt_dx(pt1, pt2) {
  return pt1.x - pt2.x;
}

function vec_len(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

// Distance of point pt from line defined by points line_pt1, line_pt2.
function pt_ln_dist(line_pt1, line_pt2, pt) {
  var x0 = pt.x, y0 = pt.y,
      x1 = line_pt1.x, y1 = line_pt1.y,
      x2 = line_pt2.x, y1 = line_pt2.y,

      ldy = line_pt2.y - line_pt1.y,
      ldx = line_pt2.x - line_pt1.x;

  return Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 + y2 * x1) /
      Math.sqrt(pt_diff(line_pt2, line_pt1));
}

function pt_diff(pt1, pt2) {
  var dx = pt1.x - pt2.x,
      dy = pt1.y - pt2.y;
  return dx * dx + dy * dy;
}

// Some quick hacks for debugging the linear algebra.

window.debugCanvas = null;

function debugVect(v, s) {
  if (window.debugCanvas) {
    if (s) {
      window.debugCanvas.strokeStyle(s);
    }
    window.debugCanvas.line(pt(300, 300), pt(300 + v.x, 300 + v.y));
  }
}

function debugPt(p, s) {
  if (window.debugCanvas) {
    if (s) {
      window.debugCanvas.strokeStyle(s);
    }
    window.debugCanvas.drawMarker(pt(300 + p.x, 300 + p.y));
  }
}