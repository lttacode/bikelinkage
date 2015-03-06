
// Rotating joint constraint, e.g. bearings.

var RotatorJoint = function(name, elem1, elem2) {
  this.elem1 = elem1;
  this.elem2 = elem2;
  this.name = name;

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

var FixedRotatorJoint = function(name, fixed_pt, elem, elem_end) {
  this.fixedPt = fixed_pt;
  this.elem = elem;
  this.elemEnd = elem_end;
  this.name = name;
  elem.makeEndJointed(elem_end);
};

FixedRotatorJoint.prototype.relax = function() {
  return this.elem.pinEnd(this.fixedPt, this.elemEnd);
};

FixedRotatorJoint.prototype.draw = function(canvas) {
  var d = 4;
  var pt = this.elemEnd == 0 ? this.elem.pt1 : this.elem.pt2;

  canvas.strokeStyle("#aa6699");
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
    name,
    fixed_pt,
    elem,
    elem_float, float_end) {
  this.fixedPt = fixed_pt;
  this.elem = elem;
  this.elemFloat = elem_float;
  this.floatEnd = float_end;
  this.name = name;

  // Vector through points of elem.
  var lineVect = pt(elem.pt1.x - elem.pt2.x, elem.pt1.y - elem.pt2.y),
      lineLen = vec_len(lineVect),
      unitLine = pt(lineVect.x / lineLen, lineVect.y / lineLen);

  // Orthogonal vector to lineVect.
  var orthoVect = pt(lineVect.y, -lineVect.x),
      orthoLen = vec_len(orthoVect),
      unitOrtho = pt(orthoVect.x / orthoLen, orthoVect.y / orthoLen);

  // Vector from pt1 on line through our third point.
  var linePtVect = pt(elem.pt1.x - fixed_pt.x, elem.pt1.y - fixed_pt.y);

  // linePtVect projected along line defined by element's points.
  var distPtAlongLine = (linePtVect.x * unitLine.x + linePtVect.y * unitLine.y);

  // Distance of point projected along orthoganl to line of element.
  var distPtAlongOrtho =
      (linePtVect.x * unitOrtho.x + linePtVect.y * unitOrtho.y);

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
      orthoLen = vec_len(orthoVect),
      unitOrtho = pt(orthoVect.x / orthoLen, orthoVect.y / orthoLen);

  // New location is elem.pt1 + distOrtho along orthoVect + distLine along
  // lineVect.
  var s = this;
  var dx = s.distOrtho * unitOrtho.x + s.distLine * unitLine.x,
      dy = s.distOrtho * unitOrtho.y + s.distLine * unitLine.y;
  var p = pt(
      elem.pt1.x - dx / 2,
      elem.pt1.y - dy / 2);

  var elem_dx = pt_dx(p, this.fixedPt);
  var elem_dy = pt_dy(p, this.fixedPt);

  this.fixedPt = pt(this.fixedPt.x + elem_dx, this.fixedPt.y + elem_dy);

  if (this.elemFloat) {
    var dl = Math.sqrt(pt_diff(this.elemFloat.pt1, this.elemFloat.pt2));
    var force_vect = this.elemFloat.getForceVector(),
        float_dx = force_vect.x / 2,
        float_dy = force_vect.y / 2;

    debugLog("Force: " + force_vect.x + ", " + force_vect.y);

    var end1 = pt(
        elem.pt1.x + float_dx,
        elem.pt1.y + float_dy);
    var end2 = pt(
        elem.pt2.x + float_dx,
        elem.pt2.y + float_dy);

    this.elemFloat.pinEnd(this.fixedPt, this.floatEnd);

    elem.pinEnd(end1, 0);
    elem.pinEnd(end2, 1);
  } else {
    var float_dx = 0, float_dy = 0;
  }

  var error = elem_dx * elem_dx + elem_dy * elem_dy +
      float_dx * float_dx + float_dy * float_dy;
  return error;
};

RelativeFixedRotatorJoint.prototype.draw = function(canvas) {
  canvas.line(this.fixedPt, this.elem.pt1);
  canvas.line(this.fixedPt, this.elem.pt2);
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

var BarElement = function(name, pt1, pt2) {
  this.pt1 = pt1;
  this.pt2 = pt2;
  this.name = name;

  // If the ends are jointed, then they cannot be dragged, otherwise they can.
  this.jointedEnds = [false, false];

  var dx = pt1.x - pt2.x,
      dy = pt1.y - pt2.y;
  this.length = Math.sqrt(dx * dx + dy * dy);
};

BarElement.prototype.relax = function() {
  return this.lengthenTo(this.length);
}

BarElement.prototype.lengthenTo = function(toLength, ends) {
  var l = pt_diff(this.pt1, this.pt2),
      sl = Math.sqrt(l),
      dl = (toLength - sl),
      dx = (this.pt1.x - this.pt2.x) / sl,
      dy = (this.pt1.y - this.pt2.y) / sl;

  if (!ends || ends.length == 2) {
    this.pt1 = pt(this.pt1.x + dl * dx / 2, this.pt1.y + dl * dy / 2);
    this.pt2 = pt(this.pt2.x - dl * dx / 2, this.pt2.y - dl * dy / 2);
  } else {
    if (ends[0] == 1) {
      this.pt2 = pt(this.pt2.x - dl * dx, this.pt2.y - dl * dy);
    } else {
      this.pt1 = pt(this.pt1.x + dl * dx, this.pt1.y + dl * dy);
    }
  }

  return dl * dl;
};

BarElement.prototype.draw = function(canvas) {
  canvas.strokeStyle("#aa6699");
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

BarElement.prototype.getEndPt = function(end) {
  return end == 0 ? this.pt1 : this.pt2;
}

BarElement.prototype.makeEndJointed = function(end) {
  this.jointedEnds[end] = true;
}

BarElement.prototype.calculateLength2 = function() {
  return pt_diff(this.pt1, this.pt2);
}

BarElement.prototype.calculateLength = function() {
  return Math.sqrt(pt_diff(this.pt1, this.pt2));
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

BarElement.prototype.calculateForceVector = function(forLength) {
  var l = pt_diff(this.pt1, this.pt2),
      sl = Math.sqrt(l),
      dl = (sl - forLength),
      dx = -(this.pt2.x - this.pt1.x) / sl,
      dy = -(this.pt2.y - this.pt1.y) / sl;

  return pt(dl * dx, dl * dy);
};

BarElement.prototype.getForceVector = function() {
  return this.calculateForceVector(this.length);
}


// Spring, elastic connetion between to joints, stroke defines maximum
// compression, initial length is maximum extension.

var Spring = function(name, pt1, pt2, stroke, compressed_ends) {
  this.stroke = stroke;
  this.compression = 0;
  this.compressedEnds = compressed_ends;
  this.epsilon = 0.999;
  Spring.prototype.parent.call(this, name, pt1, pt2);

  this.maxLength = this.length;
  this.minLength = this.length - stroke;
  this.pinnedLength = this.length;
};
Spring.prototype = Object.create(BarElement.prototype);
Spring.prototype.parent = BarElement;

Spring.prototype.calculateDesiredLength = function() {
  var l = this.calculateLength2() * this.epsilon,
      min = this.minLength,
      max = this.maxLength,
      l2 = this.stroke / 2;
  if (this.compression) {
    debugLog("Compressed Length: " + l +","+ (max - this.compression));
    return this.maxLength - this.compression;
  } else if (l < min * min) {
    debugLog("Min Length: " + l + " = " + (min * min) + " : " + (min + l2));
    return min + l2;
  } else if (l > max * max) {
    debugLog("Max Length: " + ( max - l2));
    return max - l2;
  }
  return -1;
}

Spring.prototype.relax = function() {
  var dl = this.calculateDesiredLength();
  if (dl >= 0) {
    return this.lengthenTo(dl, this.compressedEnds);
  }
  return 0;
};

Spring.prototype.pinEnd = function(pt, end) {
  var res = Spring.prototype.parent.prototype.pinEnd.call(this, pt, end);
  var dl = this.calculateDesiredLength();
  this.pinnedLength = dl >= 0 ? this.calculateForceVector(dl) : null;
  return res;
};

Spring.prototype.draw = function(canvas) {
  canvas.strokeStyle("rgba(255, 255, 0, 0.7)");
  canvas.line(this.pt1, this.pt2);
};

Spring.prototype.setCompression = function(compression) {
  this.compression = compression;
}

Spring.prototype.measureCompression = function() {
  return this.maxLength - this.calculateLength();
}

Spring.prototype.getForceVector = function() {
  return this.pinnedLength ? this.pinnedLength : pt(0, 0);
};


// Iterative constraint relaxation solver.

var IterativeConstraintSolver = function(
    canvas, constraints, epsilon, max_iter) {
  this.constraints = constraints;
  this.epsilon = epsilon;
  this.maxIter = max_iter;
  this.canvas = canvas;
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
    this.drawConstraints();
  }
  var succeeded = error < 2 * this.epsilon;
  if (!succeeded) {
    console.log("solve did not succeed: error", error);
  }
  return succeeded;
};

IterativeConstraintSolver.prototype.drawConstraints = function(strokeStyle) {
  this.canvas.clear();
  //debugClear();

  if (!strokeStyle) {
    strokeStyle = "#aa6699";
  }
  this.canvas.strokeStyle(strokeStyle);

  var lineWidth = this.canvas.ctx.lineWidth;
  this.canvas.ctx.lineWidth = 3;

  for (var i = 0; i < this.constraints.length; ++i) {
    this.constraints[i].draw(this.canvas);
  }

  this.canvas.ctx.lineWidth = lineWidth;
};

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
};

function pt_dx(pt1, pt2) {
  return pt1.x - pt2.x;
};

function vec_len(v) {
  return Math.sqrt(v.x * v.x + v.y * v.y);
};

// Distance of point pt from line defined by points line_pt1, line_pt2.
function pt_ln_dist(line_pt1, line_pt2, pt) {
  var x0 = pt.x, y0 = pt.y,
      x1 = line_pt1.x, y1 = line_pt1.y,
      x2 = line_pt2.x, y1 = line_pt2.y,

      ldy = line_pt2.y - line_pt1.y,
      ldx = line_pt2.x - line_pt1.x;

  return Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 + y2 * x1) /
      Math.sqrt(pt_diff(line_pt2, line_pt1));
};

function pt_diff(pt1, pt2) {
  var dx = pt1.x - pt2.x,
      dy = pt1.y - pt2.y;
  return dx * dx + dy * dy;
};

// Some quick hacks for debugging the linear algebra.

window.debugCanvas = null;

function initDebugCanvas() {
 if (!window.debugCanvas) {
    window.debugCanvas = document.getElementById("canvasDebug");
    window.debugCtx = window.debugCanvas.getContext("2d");
    window.debugW = window.debugCanvas.width;
    window.debugH = window.debugCanvas.height;
    window.debugLine = 0;
  }
};

function debugClear() {
  initDebugCanvas();
  window.debugLine = 0;
  window.debugCtx.clearRect(0, 0, window.debugW, window.debugH);
};

function debugLog(text) {
  initDebugCanvas();
  window.debugCtx.fillStyle = "#333";
  window.debugCtx.font = '10px san-serif';

  var textDim = window.debugCtx.measureText(text),
      textHeight = 20;

  var x1 = 20,
      x2 = x1 + textDim.width,
      y1 = 20 + (textHeight / 2) + window.debugLine,
      y2 = y1 + textHeight;
  window.debugCtx.clearRect(x1, y1 - textHeight, x2 - x1, y2 - y1 + textHeight);
  window.debugCtx.fillText(text, x1, y1);
  if (window.debugLine > window.debugH) {
    window.debugLine = 0;
  } else {
    window.debugLine += textHeight;
  }
};

function debugVect(v, s) {
  initDebugCanvas();
  if (s) {
    window.debugCtx.strokeStyle = s;
  }

  var x = window.debugW / 2, y = window.debugH / 2;
  window.debugCtx.beginPath();
  window.debugCtx.moveTo(x, y);
  window.debugCtx.lineTo(x + v.x, y - v.y);
  window.debugCtx.stroke();
};

function debugPt(pt, s) {
  initDebugCanvas();
  if (s) {
    window.debugCtx.strokeStyle = s;
  }

  var markerWidth = 4;

  window.debugCtx.strokeRect(
      pt.x - markerWidth / 2,
      pt.y - markerWidth / 2,
      markerWidth,
      markerWidth);
};
