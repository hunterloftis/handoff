function Player() {
  this.x = 0;
  this.y = 0;
  this.maxSpeed = 750;

  this.currentSpeed = 0;
  this.xPercent = 0;
  this.yPercent = 0;
}

Player.prototype.update = function(seconds, joystick) {
  var dx = this.maxSpeed * joystick.x;
  var dy = this.maxSpeed * joystick.y;

  this.x += dx * seconds;
  this.y += dy * seconds;
  this.currentSpeed = Math.sqrt(dx * dx + dy * dy);
  this.xPercent = dx / this.maxSpeed;
  this.yPercent = dy / this.maxSpeed;
};
