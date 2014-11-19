var components = {};

components.running = {
  props: {
    power: 13,
    maxSpeed: 220,
    slowdown: 0.96,
    distance: 0,
    pushX: 0,
    pushY: 0
  }
};

components.position = {
  props: {
    x: [0, 0, 0],
    y: [0, 0, 0],
    interval: [1, 1, 1]
  },
  get: function(state) {
    var vx0 = (state.x[0] - state.x[1]) / state.interval[1];
    var vx1 = (state.x[1] - state.x[2]) / state.interval[2];

    var vy0 = (state.y[0] - state.y[1]) / state.interval[1];
    var vy1 = (state.y[1] - state.y[2]) / state.interval[2];

    return {
      x: state.x[0],
      y: state.y[0],
      vx: vx0,
      vy: vy0,
      ax: vx0 - vx1,
      ay: vy0 - vy1,
      speed: Math.sqrt(vx0 * vx0 + vy0 * vy0)
    };
  }
};

components.wandering = {
  props: {
    wanderAngle: 0
  }
};

components.mappable = {
  props: {
    mapType: 0,
    mapWidth: 100,
    mapHeight: 100
  }
};

components.joystick = {
  props: {
    x: 0,
    y: 0,
    radius: 0
  }
};
