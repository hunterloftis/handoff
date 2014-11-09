function Level() {
  this.x = 0;
  this.y = 0;
}

Level.prototype.getState = function() {
  return {
    x: this.x,
    y: this.y
  };
};
