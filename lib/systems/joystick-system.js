function joystickSystem(seconds, entities, joystickState) {
  entities.with(['joystick']).forEach(update);

  function update(entity) {
    entity.x = joystickState.x;
    entity.y = joystickState.y;
    entity.radius = joystickState.radius;
  }
}
