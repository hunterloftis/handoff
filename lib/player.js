function Player() {
  this.x = 0;
  this.y = 0;
  this.speed = 750;

  this.currentSpeed = 0;
}

Player.prototype.update = function(seconds, joystick) {
  var dx = this.speed * joystick.x;
  var dy = this.speed * joystick.y;
  this.x += dx * seconds;
  this.y += dy * seconds;
  this.currentSpeed = Math.sqrt(dx * dx + dy * dy);
};
