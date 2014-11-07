function Player() {
  this.x = 0;
  this.y = 0;
  this.speed = 750;
}

Player.prototype.update = function(seconds, joystick) {
  this.x += this.speed * joystick.x * seconds;
  this.y += this.speed * joystick.y * seconds;
};
