function Component(props) {
  _.extend(this, props);
}

Component.prototype.get = function() {
  return this;
};

var components = {};

components.runnable = new Component({
  power: 13,
  maxSpeed: 220,
  slowdown: 0.96,
  distance: 0
});

components.positioned = new Component({
  x: [0, 0, 0],
  y: [0, 0, 0],
  interval: [1, 1, 1],
  get: function() {
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
      ay: vy0 - vy1,
      speed: Math.sqrt(vx0 * vx0 + vy0 * vy0)
    };
  }
});

components.controllable = new Component({
  pushX: 0,
  pushY: 0
});

components.mappable = new Component({
  mapType: 0,
  mapWidth: 100,
  mapHeight: 100
});

components.joystick = new Component({
  x: 0,
  y: 0,
  radius: 0
});
