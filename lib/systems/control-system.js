function controlSystem(seconds, entities, joystick) {
  entities.with(['controllable']).forEach(update);

  function update(entity) {
    entity.pushX = joystick.x;
    entity.pushY = joystick.y;
  }
}
