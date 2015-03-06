
var DBG = function() {
  this.output = null;
  this.logs = 0;
  this.msgs = []
};

debug = new DBG();

DBG.prototype.logfmt = function() {
  var msg = arguments[0], i = arguments.length ;
  while (--i) {
    s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
  }

  this.logs++;
  this.msgs.push(msg);
};

DBG.prototype.log = function() {
  var msg = arguments[0], len = arguments.length, j = 1;
  while (j < len) {
    msg = msg.concat(" " + arguments[j]);
  }
  this.logs++;
  this.msgs.push(msg);
};

DBG.prototype.render = function() {
  if (!this.output) {
    this.output = document.getElementById("debug");
  }
  this.output.textContent = this.msgs.join("\n");
};
