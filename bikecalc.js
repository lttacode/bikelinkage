
var Geometry = function(
    reach, stack, bb_height, cs_length, st_len, st_angle, ht_angle, ht_len) {
  this.stack = stack;
  this.reach = reach;
  this.bb_height = bb_height;
  this.cs_length = cs_length;
  this.st_angle = st_angle;
  this.ht_angle = ht_angle;
  this.st_len = st_len;
  this.ht_len = ht_len;
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

function line(context, from, to) {
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();

  context.strokeRect(to.x - 2, to.y - 2, 4, 4);
  context.strokeRect(from.x - 2, from.y - 2, 4, 4);
};

function move_pt_a(from, dist, angle) {
  var x = from.x;
  var y = from.y;
  var a = (angle) / 180.0 * Math.PI
  x = x + Math.sin(a) * dist;
  y = y + Math.cos(a) * dist;

  return pt(x, y);
};

function cntr(point, factor, origin) {
  return pt(origin.x + point.x * factor, origin.y - point.y * factor);
};


// Bike object.

var Bike = function(ctx, w, h, o_x, o_y, scale, geo, img_url, links, shock) {
  this.geo = geo;

  this.ctx = ctx;
  this.w = w;
  this.h = h;

  this.bg_image = new Image();
  var self = this;
  this.bg_image.onload = function() {
    self.draw(ctx, w, h);
  }
  this.bg_image.src = img_url;
  this.img_url = img_url;
  this.origin = pt(o_x, o_y);
  this.scale = scale;

  this.links = links;
  this.shock = shock;

  this.points = [];
  this.points.push.apply(this.points, links);
  this.points.push.apply(this.points, shock);
};

Bike.prototype.redraw = function() {
  this.draw(this.ctx, this.w, this.h);
};

Bike.prototype.drawShock = function(ctx, w, h, shock) {
  var from = cntr(shock[0], this.scale, this.origin);
  var to = cntr(shock[1], this.scale, this.origin);

  ctx.strokeColor = "#00FF00";
  line(ctx, from, to);
}

Bike.prototype.drawLinkage = function(ctx, w, h, links) {
  var prev = null;
  var marked_width = 6;
  var marked_offset = marked_width / 2;

  ctx.strokeStyle = "#FFFF00";
  var len = links.length;
  for (var nlink = 0; nlink < len; nlink++) {
    var link = cntr(links[nlink], this.scale, this.origin);
    ctx.strokeRect(link.x - marked_offset, link.y - marked_offset,
        marked_width, marked_width);
    if (prev) {
      line(ctx, prev, link);
    }
    prev = link;
  }
};

Bike.prototype.draw = function(ctx, w, h) {
  ctx.drawImage(this.bg_image, 0, 0);

  ctx.strokeStyle = "#000000";
  ctx.strokeRect(0, 0, w, h);

  ctx.strokeStyle = "#0000FF";

  var geo = this.geo;
  var bb_pos = pt(0, 0);
  var ht_upper = pt(bb_pos.x + geo.reach, bb_pos.y + geo.stack);
  var ht_lower = move_pt_a(ht_upper, geo.ht_len, geo.ht_angle + 90.);
  var st_upper = move_pt_a(bb_pos, geo.st_len, geo.st_angle - 90.);
  var st_mid = move_pt_a(bb_pos, geo.st_len * 0.7, geo.st_angle - 90.);

  var rear_axle = move_pt_a(bb_pos, geo.cs_length, -90);

  var origin = this.origin;
  var scale = this.scale;
  bb_pos = cntr(bb_pos, scale, origin);
  ht_upper = cntr(ht_upper, scale, origin);
  ht_lower = cntr(ht_lower, scale, origin);
  st_upper = cntr(st_upper, scale, origin);
  st_mid = cntr(st_mid, scale, origin);
  rear_axle = cntr(rear_axle, scale, origin);

  line(ctx, bb_pos, ht_lower);
  line(ctx, bb_pos, st_upper);
  line(ctx, ht_upper, ht_lower);
  line(ctx, st_mid, ht_upper);
  line(ctx, bb_pos, rear_axle);

  this.drawLinkage(ctx, w, h, this.links);
  this.drawShock(ctx, w, h, this.shock);
};

Bike.prototype.movePoint = function(i, newX, newY) {
  this.points[i].x = newX;
  this.points[i].y = newY;
  this.draw(this.ctx, this.w, this.h);
};

Bike.prototype.screenToPhysCoordinates = function(x, y) {
  x = (x - this.origin.x) / this.scale;
  y = -(y - this.origin.y) / this.scale;

  return pt(x, y);
};

Bike.prototype.drawDebugPt = function(pt) {
  pt = cntr(pt, this.scale, this.origin);

  this.ctx.fillStyle = "#FF5500";
  this.ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
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

Bike.prototype.printData = function() {
  var s = this;
  var g = this.geo;
  console.log(
    (
      "// Geometry:\n" +
      "new Geometry(%i, %i, %i, %i, %i, %f, %f, %i),\n" +
      "// Background image:\n" +
      "'%s',\n" +
      "// Rear triangle links:\n" +
      "%s,\n" +
      "// Rear shock:\n" +
      "%s,\n"
    ),
    g.reach, g.stack, g.bb_height, g.cs_length, g.st_len, g.st_angle,
        g.ht_angle, g.ht_len,
    s.img_url,
    "[" + s.links.join(", ") + "]",
    "[" + s.shock.join(", ") + "]"
  );
};

// Constructors.

var Enduro29_M = function(ctx, w, h) {
  return new Bike(
      ctx, w, h, w * 0.5065, h * 0.4865, 0.39,
      // Geometry:
      new Geometry(425, 632, 351, 430, 445, 75, 67.5, 120),
      // Background image:
      "http://s7d5.scene7.com/is/image/Specialized/121781?$Hero$",
      //"resources/enduro29.jpg",
      // Rear triangle links:
      [pt(15, 35), pt(-420, 30), pt(-68, 215), pt(15, 205)],
      // Rear shock:
      [pt(-41, 223), pt(200, 374)] );
};

// Utilities.

String.prototype.format = function() {
    var s = this, i = arguments.length;

    while (i--) {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }
    return s;
};
