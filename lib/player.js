function Player() {
  this.x = [0, 0, 0];
  this.y = [0, 0, 0];
  this.interval = [1, 1, 1];
  this.slowdown = 0.9;
  this.power = 80;
  this.speed = 500;
}

Player.prototype.update = function(seconds, joystick) {
  var vx = (this.x[0] - this.x[1]) / this.interval[1];
  var vy = (this.y[0] - this.y[1]) / this.interval[1];

  var impulseX = this.power * joystick.x;
  var impulseY = this.power * joystick.y;

  var dx = vx * this.slowdown + impulseX;
  var dy = vy * this.slowdown + impulseY;
  var speed = Math.sqrt(dx * dx + dy * dy);

  if (speed > this.speed) {
    dx *= this.speed / speed;
    dy *= this.speed / speed;
  }

  var newX = this.x[0] + dx * seconds;
  var newY = this.y[0] + dy * seconds;

  this.x.unshift(newX);
  this.x.pop();

  this.y.unshift(newY);
  this.y.pop();

  this.interval.unshift(seconds);
  this.interval.pop();
};

Player.prototype.getPhysics = function() {
  var vx0 = (this.x[0] - this.x[1]) / this.interval[1];
  var vx1 = (this.x[1] - this.x[2]) / this.interval[2];

  var vy0 = (this.y[0] - this.y[1]) / this.interval[1];
  var vy1 = (this.y[1] - this.y[2]) / this.interval[2];

  return {
    x: this.x[0],
    y: this.y[0],
    vx: vx0,
    vy: vy0,
    ax: vx0 - vx1,
    ay: vy0 - vy1
  };
};
