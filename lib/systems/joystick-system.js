function joystickSystem(seconds, entities, joystickState) {
  entities.with(['joystick']).forEach(update);

  function update(entity) {
    var state = entity.state;

    state.x = joystickState.x;
    state.y = joystickState.y;
    state.radius = joystickState.radius;
  }
}
