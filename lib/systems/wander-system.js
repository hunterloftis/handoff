function wanderSystem(seconds, entities) {
  entities.with(['wandering', 'position', 'running']).forEach(update);

  function update(entity) {
    var state = entity.state;

    state.pushX = Math.cos(state.wanderAngle) * 0.2;
    state.pushY = Math.sin(state.wanderAngle) * 0.2;
    state.wanderAngle += Math.random() * seconds * 2 * 10 - seconds * 10;
  }
}
