function Player() {
  this.x = 0;
  this.y = 0;
  this.speed = 200;
}

Player.prototype.update = function(seconds, xThrottle, yThrottle) {
  this.x += this.speed * xThrottle * seconds;
  this.y += this.speed * yThrottle * seconds;
};
