var ConstraintsController = function(canvas, bike_sim, solver, drag_handler) {
  drag_handler.register(
      canvas.canvas2d, this.canDrag(), this.dragging(), this.dragEnd());

  this.canvas = canvas;
  this.bikeSim = bike_sim;
  this.solver = solver;
  this.dragHandler = drag_handler;
  this.constraints = solver.constraints;

  this.maxPointDistance = 15;
}

ConstraintsController.prototype.dragging = function() {
  var self = this;

  return function(dragged_index, start, end) {
    var links = self.bikeSim.links,
        len = links.length,
        point = null;
    start = self.canvas.screenToPhysCoordinates(start[0], start[1]);
    end = self.canvas.screenToPhysCoordinates(end[0], end[1]);

    self.constraints[dragged_index].moveTo(end);
    self.solver.solve();
    self.solver.drawConstraints();
  }
};

ConstraintsController.prototype.canDrag = function() {
  var self = this;

  return function(start) {
    self.solver.drawConstraints();
    var constraints = self.constraints, len = constraints.length;
    start = self.canvas.screenToPhysCoordinates(start[0], start[1]);
    self.canvas.drawMarker(start);

    var link_index = self.solver.findClosestConstraint(
       start, self.maxPointDistance);

    return link_index;
  }
};

ConstraintsController.prototype.dragEnd = function() {
  var self = this;

  return function(index, start, end) {
    self.bikeSim.printData();
  }
};