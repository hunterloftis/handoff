function runSystem(seconds, entities) {
  entities.with(['runnable', 'positioned']).forEach(update);

  function update(entity) {
    var vx = (entity.x[0] - entity.x[1]) / entity.interval[1];
    var vy = (entity.y[0] - entity.y[1]) / entity.interval[1];

    var impulseX = entity.power * entity.pushX;
    var impulseY = entity.power * entity.pushY;

    var dx = vx * entity.slowdown + impulseX;
    var dy = vy * entity.slowdown + impulseY;
    var speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > entity.maxSpeed) {
      dx *= entity.maxSpeed / speed;
      dy *= entity.maxSpeed / speed;
    }

    var newX = entity.x[0] + dx * seconds;
    var newY = entity.y[0] + dy * seconds;

    entity.x.unshift(newX);
    entity.x.pop();

    entity.y.unshift(newY);
    entity.y.pop();

    entity.interval.unshift(seconds);
    entity.interval.pop();

    entity.distance += speed * seconds;
  }
}
