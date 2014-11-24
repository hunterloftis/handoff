var controllableSystem = {
  name: 'controllable',
  props: {
    dirX: 0,
    dirY: 0
  },
  update: function(seconds, joystick) {
    this.dirX = joystick.x;
    this.dirY = joystick.y;
  }
};
