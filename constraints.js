var Spring = function() {

};


var RotatorJoint = function(elem1, elem2) {
  this.elem1 = elem1;
  this.elem2 = elem2;
};

RotatorJoint.prototype.relax = function() {
  // Move both elem ends to their middle position.
  var dx = (this.elem1.pt2.x - this.elem2.pt1.x),
      dy = (this.elem1.pt2.y - this.elem2.pt1.y),
      x = this.elem1.pt2.x + dx / 2.,
      y = this.elem1.pt2.y + dy / 2.;
  this.elem1.pinEnd(pt(x, y), 1);
  this.elem2.pinEnd(pt(x, y), 0);

  return dx + dy;
};

RotatorJoint.prototype.draw = function(ctx) {
  var d = 4;

  ctx.strokeStyle = "#FF0000";
  ctx.strokeRect(this.elem1.pt2.x - d / 2, this.elem1.pt2.y - d / 2, d, d);
};


var FixedRotatorJoint = function(fixed_pt, elem, elem_end) {
  this.fixedPt = fixed_pt;
  this.elem = elem;
  this.elemEnd = end
};

FixedRotatorJoint.prototype.relax = function() {
  return this.elem.pinEnd(this.fixedPt, this.end);
};

FixedRotatorJoint.prototype.draw = function(ctx) {
  var d = 4;
  var pt = this.elemEnd == 0 ? this.elem.pt1 : this.elem.pt2;

  ctx.fillStyle = "#FF0000";
  ctx.fillRect(pt.x - d / 2, pt.y - d / 2, d, d);
};


var BarElement = function(pt1, pt2) {
  this.pt1 = pt1;
  this.pt2 = pt2;

  var dx = pt1.x - pt2.x,
      dy = pt1.y - pt2.y;
  this.length = Math.sqrt(dx * dx + dy * dy);
};

BarElement.prototype.relax = function() {
  var l = pt_diff(this.pt1, this.pt2),
      sl = Math.sqrt(l),
      dl = (this.length - sl) / 2,
      dx = (this.pt1.x - this.pt2.x) / sl,
      dy = (this.pt1.y, this.pt2.y) / sl;

  this.pt1 = pt(this.pt1.x + dl * dx, this.pt1.y + dl * dy);
  this.pt2 = pt(this.pt2.x - dl * dx, this.pt2.y - dl * dy);

  return dl * dl;
};

BarElement.prototype.draw = function(ctx) {
  ctx.strokeStyle = "#FFFF00";
  line(ctx, this.pt1, this.pt2);
};

BarElement.prototype.pinEnd = function(end, pt) {
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


// Iterative constraint relaxation solver.

var IterativeConstraintSolver = function(ctx, constraints, epsilon) {
  this.constraints = constraints;
  this.epsilon = epsilon;
};

IterativeConstraintSolver.prototype.solve = function() {
  var error = 2 * this.epsilon;
  while (error > this.epsilon) {
    error = 0;
    for (var i = 0; i < this.constraints.length; ++i) {
      error += this.constraints[i].relax();
    }
  }
};

IterativeConstraintSolver.prototype.drawConstraints = function(ctx) {
  for (var i = 0; i < this.constraints.length; ++i) {
    this.constraints[i].draw(ctx);
  }
}


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

