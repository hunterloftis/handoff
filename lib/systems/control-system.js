function controlSystem(seconds, entities, joystick) {
  entities.with(['controllable']).forEach(update);

  function update(entity) {
    var state = entity.state;
    state.pushX = joystick.x;
    state.pushY = joystick.y;
  }
}
