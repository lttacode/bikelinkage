var ScaledCanvas = function(
    context, w, h,
    physical_viewport_w,
    origin) {
  this.ctx = context;
  this.w = w;
  this.h = h;
  this.origin = origin;
  this.scale = w / physical_viewport_w;

  this.markerWidth = 4;
};

function transform(point, factor, origin) {
  return pt(origin.x + point.x * factor, origin.y - point.y * factor);
};

ScaledCanvas.prototype.drawBackground = function(
    bg_image, bg_scale, bg_origin) {
  var w = bg_image.width, h = bg_image.height,
      x = this.origin.x - bg_origin.x * bg_scale,
      y = this.origin.y - bg_origin.y * bg_scale;
  this.ctx.drawImage(bg_image, x, y, w * bg_scale, h * bg_scale);
};

ScaledCanvas.prototype.drawMarker = function(pt, markerWidth) {
  pt = transform(pt, this.scale, this.origin);
  if (!markerWidth) {
    markerWidth = this.markerWidth;
  }
  this.ctx.strokeRect(
      pt.x - markerWidth / 2,
      pt.y - markerWidth / 2,
      markerWidth,
      markerWidth);
}

ScaledCanvas.prototype.line = function(from, to) {
  from = transform(from, this.scale, this.origin);
  to = transform(to, this.scale, this.origin);

  this.ctx.beginPath();
  this.ctx.moveTo(from.x, from.y);
  this.ctx.lineTo(to.x, to.y);
  this.ctx.stroke();
};

ScaledCanvas.prototype.lineWithMarkers = function(from, to) {
  this.line(from, to);

  this.drawMarker(from);
  this.drawMarker(to);
};

ScaledCanvas.prototype.fillRect = function(x1, y1, x2, y2) {
  this.ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
};

ScaledCanvas.prototype.strokeRect = function(x1, y1, x2, y2) {
  this.ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
};

ScaledCanvas.prototype.fillStyle = function(s) {
  this.ctx.fillStyle = s;
};

ScaledCanvas.prototype.strokeStyle = function(s) {
  this.ctx.strokeStyle = s;
};

ScaledCanvas.prototype.circle = function(center, r) {
  center = transform(center, this.scale, this.origin);
  r = this.scale * r;

  this.ctx.beginPath();
  this.ctx.arc(center.x, center.y, r, 0, Math.PI * 2, true);
  this.ctx.closePath();
  this.ctx.stroke();
};

ScaledCanvas.prototype.drawLoading = function(n, m) {
  var repeated = function(s, n) {
    return new Array(n + 1).join(s);
  }
  var ctx = this.ctx, w = this.w, h = this.h;

  ctx.fillStyle = "#333";
  ctx.font = '20px san-serif';
  var text = "Loading" + repeated('.', n % m) + repeated(' ', m - n % m),
      textDim = ctx.measureText(text),
      textHeight = 20;

  var x1 = (w / 2) - (textDim.width / 2),
      x2 = x1 + textDim.width,
      y1 = (h / 2) - (textHeight / 2),
      y2 = y1 + textHeight;
  ctx.clearRect(x1, y1 - textHeight, x2 - x1, y2 - y1 + textHeight);
  ctx.fillText(text, x1, y1);
};

ScaledCanvas.prototype.screenToPhysCoordinates = function(x, y) {
  x = (x - this.origin.x) / this.scale;
  y = -(y - this.origin.y) / this.scale;

  return pt(x, y);
};
