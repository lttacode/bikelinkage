var wheel_29 = 366.5; // WTB Exiwolf 29x2.3 based on circumference 2302mm.
var wheel_26x240 = 340.5; // 26x2.40 tire.

var Geometry = function(
    reach, stack, bb_height, cs_length, st_len, st_angle, ht_angle, ht_len,
    wheel_radius) {
  this.stack = stack;
  this.reach = reach;
  this.bb_height = bb_height;
  this.cs_length = cs_length;
  this.st_angle = st_angle;
  this.ht_angle = ht_angle;
  this.st_len = st_len;
  this.ht_len = ht_len;
  this.wheel_radius = wheel_radius;
};

var Point = function(x, y) {
  this.x = x;
  this.y = y;
};

Point.prototype.toString = function() {
  return "pt(" + Math.round(this.x) + ", " + Math.round(this.y) + ")";
};

function pt(x, y) {
  return new Point(x, y)
};

function move_pt_a(from, dist, angle) {
  var x = from.x;
  var y = from.y;
  var a = (angle) / 180.0 * Math.PI
  x = x + Math.sin(a) * dist;
  y = y + Math.cos(a) * dist;

  return pt(x, y);
};

// Bike object.

var Bike = function(
    canvas,
    geo,
    img_url, img_origin, img_scale,
    links,
    shock, stroke) {
  this.geo = geo;

  this.canvas = canvas;

  this.bg_image = new Image();
  var self = this;

  this.img_url = img_url;
  this.img_origin = img_origin;
  this.img_scale = img_scale;

  this.links = links;
  this.shock = shock;
  this.shock_stroke = stroke;

  this.points = [];
  this.points.push.apply(this.points, links);
  this.points.push.apply(this.points, shock);

  // Load background image.
  var n = 1;
  var loadInterval = setInterval(function() {
    canvas.drawLoading(n, 4);
    n += 1;
  }, 500);

  this.bg_image.onload = function() {
    clearInterval(loadInterval);
    self.draw();
  }
  this.bg_image.src = img_url;
};

Bike.prototype.drawShock = function() {
  this.canvas.strokeStyle("#00FF00");
  this.canvas.lineWithMarkers(this.shock[0], this.shock[1]);
}

Bike.prototype.drawLinkage = function() {
  var prev = null;
  this.canvas.strokeStyle("#FFFF00");

  var len = this.links.length;
  for (var nlink = 0; nlink < len; nlink++) {
    var link = this.links[nlink];
    this.canvas.drawMarker(link);
    if (prev) {
      this.canvas.line(prev, link);
    }
    prev = link;
  }
};

Bike.prototype.draw = function() {
  var ctx = this.canvas;
  ctx.drawBackground(this.bg_image, this.img_scale, this.img_origin);

  ctx.strokeStyle("#000000");
  ctx.strokeRect(0, 0, this.canvas.w, this.canvas.h);

  var geo = this.geo;
  var bb_pos = pt(0, 0);
  var ht_upper = pt(bb_pos.x + geo.reach, bb_pos.y + geo.stack);
  var ht_lower = move_pt_a(ht_upper, geo.ht_len, geo.ht_angle + 90.);
  var st_upper = move_pt_a(bb_pos, geo.st_len, geo.st_angle - 90.);
  var st_mid = move_pt_a(bb_pos, geo.st_len * 0.7, geo.st_angle - 90.);

  // Calculate the locatio of the rear triangle by finding ground via bb
  // height, then the the y position of the rear wheel via wheel radius, and
  // triangulating with chainstay length. Simplified via
  // cos(arccos(x)) == sqrt(1 - x^2)
  // d = (wheel_radius - bb_height) / cs_length.
  // rear_x = cos(arcsin(d)) * cs_length = sqrt(1 - d^2) * cs_length.
  var d = (geo.wheel_radius - geo.bb_height) / geo.cs_length,
      rear_y = bb_pos.y - geo.bb_height + geo.wheel_radius,
      rear_x = bb_pos.x - Math.sqrt(1 - d * d) * geo.cs_length;
  var rear_axle = pt(rear_x, rear_y);

  ctx.strokeStyle("#0000FF");
  ctx.lineWithMarkers(bb_pos, ht_lower);
  ctx.lineWithMarkers(bb_pos, st_upper);
  ctx.lineWithMarkers(ht_upper, ht_lower);
  ctx.lineWithMarkers(st_mid, ht_upper);
  ctx.lineWithMarkers(bb_pos, rear_axle);

  ctx.circle(rear_axle, geo.wheel_radius);

  this.drawLinkage();
  this.drawShock();
};

Bike.prototype.movePoint = function(i, newX, newY) {
  this.points[i].x = newX;
  this.points[i].y = newY;
};

Bike.prototype.drawDebugPt = function(pt) {
  this.canvas.fillStyle("#FF5500");
  this.canvas.drawMarker(pt);
};

Bike.prototype.findClosestPoint = function(pt, max_dist) {
  var closestPt = function(items) {
    for (var i = 0; i < items.length; ++i) {
      var it = items[i];
      var dx = pt.x - it.x, dy = pt.y - it.y;
      if (dx * dx + dy * dy < max_dist * max_dist) {
        return i;
      }
    }
    return null;
  }
  return closestPt(this.points);
};

Bike.prototype.buildConstraints = function() {
  var constraints = [];

  // Need at least two points to define a swinging link.
  if (this.links.length > 1) {
    // Attach first link to main frame with rotating joint.
    var elem = new BarElement(this.links[0], this.links[1]);
    var joint = new FixedRotatorJoint(this.links[0], elem, 0);
    constraints.push(elem);
    constraints.push(joint);

    // Attach all intermediate joints.
    for (var i = 1; i < this.links.length - 2; ++i) {
      var nextElem = new BarElement(this.links[i], this.links[i + 1]);
      joint = new RotatorJoint(elem, nextElem);
      constraints.push(nextElem);
      constraints.push(joint);
      elem = nextElem;
    }

    // Attach remaining final link, if it exists.
    if (this.links.length > 2) {
      var i = this.links.length - 2;
      nextElem = new BarElement(this.links[i], this.links[i + 1]);
      // Join the previous element with last element as rotating joint.
      constraints.push(new RotatorJoint(elem, nextElem));
      // Affix last element as fixed joint.
      constraints.push(new FixedRotatorJoint(this.links[i + 1], nextElem, 1));
      // Push last bar element as well.
      constraints.push(nextElem);
    }
  }

  return constraints;
};

Bike.prototype.printData = function() {
  var s = this;
  var g = this.geo;
  console.log(
    (
      "// Geometry:\n" +
      "new Geometry(%i, %i, %i, %i, %i, %f, %f, %i, %f),\n" +
      "// Background image:\n" +
      "'%s',\n" +
      "pt(%d, %d), %f,\n" +
      "// Rear triangle links:\n" +
      "%s,\n" +
      "// Rear shock:\n" +
      "%s, %d\n"
    ),
    g.reach, g.stack, g.bb_height, g.cs_length, g.st_len, g.st_angle,
        g.ht_angle, g.ht_len, g.wheel_radius,
    s.img_url, s.img_origin.x, s.img_origin.y, s.img_scale,
    "[" + s.links.join(", ") + "]",
    "[" + s.shock.join(", ") + "]", this.shock_stroke
  );
};

// Constructors.

var Enduro29_M = function(ctx) {
  return new Bike(
      ctx,

      // Geometry:
      new Geometry(425, 632, 335, 425, 445, 75, 67.5, 120, wheel_29),
      // Background image:
      'http://brimages.bikeboardmedia.netdna-cdn.com/wp-content/uploads/2013/02/S-Works-Enduro-29r.jpg',
      pt(515, 451), 0.71,

      //'http://s7d5.scene7.com/is/image/Specialized/121781?$Hero$',
      //"resources/enduro29.jpg",
      //pt(303, 293), 1.015,

      //'http://stwww.bikemag.com/files/2013/02/broadsideG.jpg',
      // origin, scale tbd

      // Rear triangle links:
      [pt(13, 35), pt(-390, -2), pt(-70, 220), pt(13, 210)],
      // Rear shock:
      [pt(-42, 230), pt(198, 378)], 57

      );
};

var Orange322_17 = function(ctx) {
  var bb_height = wheel_26x240 + 12.0;
  return new Bike(
      ctx,

      // Geometry:
      new Geometry(400, 590, bb_height, 460, 431.8, 74, 63, 120, wheel_26x240),
      // Background image:
      'http://p.vitalmtb.com/photos/users/29582/setup_checks/25474/photos/23134/s780_IMG_1314.jpg?1397595647',
      pt(326, 356), 1.2,

      //"resources/enduro29.jpg",
      //pt(303, 293), 1.015,

      // Rear triangle links:
      [pt(28, 55), pt(-457, -10)],
      // Rear shock:
      [pt(-17, 228), pt(220, 255)], 57

      );
}

// Utilities.

String.prototype.format = function() {
    var s = this, i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};
