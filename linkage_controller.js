var LinkageController = function(canvas, bike_sim, solver, drag_handler) {
  drag_handler.register(
      canvas.canvas2d, this.canDrag(), this.dragging(), this.dragEnd());

  this.canvas = canvas;
  this.bikeSim = bike_sim;
  this.solver = solver;
  this.dragHandler = drag_handler;

  this.maxPointDistance = 15;
}

LinkageController.prototype.dragging = function() {
  var self = this;

  return function(dragged_index, start, end) {
    var links = self.bikeSim.links,
        len = links.length,
        point = null;
    start = self.canvas.screenToPhysCoordinates(start[0], start[1]);
    end = self.canvas.screenToPhysCoordinates(end[0], end[1]);
    self.bikeSim.drawDebugPt(start);
    self.bikeSim.drawDebugPt(end);

    self.bikeSim.movePoint(dragged_index, end.x, end.y);
    self.bikeSim.draw();
    self.bikeSim.drawDebugPt(self.bikeSim.points[dragged_index]);

    return true;
  }
};

LinkageController.prototype.canDrag = function() {
  var self = this;

  return function(start) {
    self.solver.drawConstraints();
    var links = self.bikeSim.links, len = links.length, point = null;
    start = self.canvas.screenToPhysCoordinates(start[0], start[1]);
    self.bikeSim.drawDebugPt(start);

    var link_index = self.bikeSim.findClosestPoint(
       start, self.maxPointDistance);

    if (link_index != null) {
      self.bikeSim.drawDebugPt(self.bikeSim.points[link_index]);
    }
    return link_index;
  }
};

LinkageController.prototype.dragEnd = function() {
  var self = this;

  return function(index, start, end) {
    self.bikeSim.printData();
    console.log("%d, %d", start.x, start.y);
  }
};