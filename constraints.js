
var RotatorJoint = function(elem1, elem2) {
  this.elem1 = elem1;
  this.elem2 = elem2;

  elem1.makeEndJointed(1);
  elem2.makeEndJointed(0);
};

RotatorJoint.prototype.relax = function() {
  // Move both elem ends to their middle position.
  var dx = (this.elem1.pt2.x - this.elem2.pt1.x) / 2,
      dy = (this.elem1.pt2.y - this.elem2.pt1.y) / 2,
      x = this.elem1.pt2.x - dx,
      y = this.elem1.pt2.y - dy;
  this.elem1.pinEnd(pt(x, y), 1);
  this.elem2.pinEnd(pt(x, y), 0);

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

RotatorJoint.prototype.distance = function(from) {
  var dx = this.elem1.pt2.x - from.x,
      dy = this.elem1.pt2.y - from.y;
  return dx * dx + dy * dy;
};


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

FixedRotatorJoint.prototype.distance = function(from) {
  // Fixed rotator joints cannot be dragged.
  return Number.MAX_VALUE;
};


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

BarElement.prototype.distance = function(from) {
  // Dragging jointed ends not supported, so set dist to max int if jointed.
  var d1 = this.jointedEnds[0] ?
          Number.MAX_VALUE : pt_diff(from, this.pt1),
      d2 = this.jointedEnds[1] ?
          Number.MAX_VALUE : pt_diff(from, this.pt2);

  return Math.min(d1, d2);
};


var Spring = function(pt1, pt2, stroke) {
  this.stroke = stroke;
  this.parent.constructor.call(this, pt1, pt2);

  this.maxLength = this.length;
  this.minLength = this.length - stroke;
};
Spring.prototype = Object.create(BarElement.prototype);
Spring.prototype.parent = BarElement;

Spring.prototype.relax = function() {
  var l = pt_diff(this.pt1, this.pt2);

  if (l < this.minLength * this.minLength) {
    this.lengthenTo(this.minLength);
  } else if (l > this.maxLength * maxLength) {
    this.lengthenTo(this.maxLength);
  }
};


// Iterative constraint relaxation solver.

var IterativeConstraintSolver = function(canvas, constraints, epsilon) {
  this.constraints = constraints;
  this.epsilon = epsilon;
  this.canvas = canvas;
};

IterativeConstraintSolver.prototype.solve = function() {
  var error = 2 * this.epsilon;
  while (error > this.epsilon) {
    error = 0;
    for (var i = 0; i < this.constraints.length; ++i) {
      error += this.constraints[i].relax();
    }
    //this.drawConstraints("rgba(0, 0, 0, 0.7)");
  }
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

function pt_diff(pt1, pt2) {
  var dx = pt1.x - pt2.x,
      dy = pt1.y - pt2.y;
  return dx * dx + dy * dy;
}

