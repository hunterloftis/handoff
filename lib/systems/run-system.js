function runSystem(seconds, entities) {
  entities.with(['running', 'position']).forEach(update);

  function update(entity) {
    var state = entity.state;

    var vx = (state.x[0] - state.x[1]) / state.interval[1];
    var vy = (state.y[0] - state.y[1]) / state.interval[1];

    var impulseX = state.power * state.pushX;
    var impulseY = state.power * state.pushY;

    var dx = vx * state.slowdown + impulseX;
    var dy = vy * state.slowdown + impulseY;
    var speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > state.maxSpeed) {
      dx *= state.maxSpeed / speed;
      dy *= state.maxSpeed / speed;
    }

    var newX = state.x[0] + dx * seconds;
    var newY = state.y[0] + dy * seconds;

    state.x.unshift(newX);
    state.x.pop();

    state.y.unshift(newY);
    state.y.pop();

    state.interval.unshift(seconds);
    state.interval.pop();

    state.distance += speed * seconds;
  }
}
