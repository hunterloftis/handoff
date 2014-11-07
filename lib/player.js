function Player() {
  this.x = 0;
  this.y = 0;
  this.maxSpeed = 750;
  this.currentSpeed = 0;
  this.leanX = 0;
  this.leanY = 0;
}

Player.prototype.update = function(seconds, joystick) {
  var dx = this.maxSpeed * joystick.x;
  var dy = this.maxSpeed * joystick.y;
  var dLeanX = (dx / this.maxSpeed) - this.leanX;
  var dLeanY = (dy / this.maxSpeed) - this.leanY;
  var leanCorrection = Math.min(1, seconds * 20);

  this.x += dx * seconds;
  this.y += dy * seconds;
  this.leanX += dLeanX * leanCorrection;
  this.leanY += dLeanY * leanCorrection;
  this.currentSpeed = Math.sqrt(dx * dx + dy * dy);
};
