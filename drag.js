var DragController = function() {
  this.dragging = false;
  this.startpos = null;
  this.endpos = null;
  this.client_rect = null;
  this.handler = null;
  this.dragObject = null;
};

DragController.prototype.clear = function() {
  this.dragging = false;
  this.startpos = null;
  this.endpos = null;
};

DragController.prototype.adjustEventPoint = function(e) {
  var doc = document.documentElement;
  var left = (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
  var top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);
  return [
      e.clientX - this.client_rect.left + left,
      e.clientY - this.client_rect.top + top];
};

DragController.prototype.dragStart = function() {
  var self = this;
  return function(e) {
    var point = self.adjustEventPoint(e);
    var dragObject = self.canDragCallback ? self.canDragCallback(point) : null;
    if (dragObject == null) {
      return false;
    }
    self.dragObject = dragObject;
    self.dragging = true;
    self.startpos = point;
  }
};

DragController.prototype.dragEnd = function() {
  var self = this;
  return function(e) {
    if (self.dragging) {
      self.dragging = false;
      self.endpos = self.adjustEventPoint(e);

      if (self.handler) {
        self.handler(self.dragObject, self.startpos, self.endpos);
      }
      if (self.dragEndCallback) {
        self.dragEndCallback(self.dragObject, self.startpos, self.endpos);
      }
      self.dragObject = null;
    }
  }
};

DragController.prototype.mouseDragging = function() {
  var self = this;
  return function(e) {
    if (self.dragging) {
      var pos = self.adjustEventPoint(e);

      if (self.handler) {
        if (!self.handler(self.dragObject, self.startpos, pos)) {
          self.dragging = false;
        }
      }
    }
  }
};

DragController.prototype.register = function(
    elem,
    can_drag_callback,
    dragging_handler,
    drag_end_callback) {
  elem.onmousedown = this.dragStart();
  elem.onmouseup = this.dragEnd();
  elem.onmousemove = this.mouseDragging();

  this.clear();
  this.handler = dragging_handler;
  this.canDragCallback = can_drag_callback;
  this.dragEndCallback = drag_end_callback;
  this.client_rect = elem.getBoundingClientRect();
};
