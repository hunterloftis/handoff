var controllableSystem = {
  name: 'controllable',
  props: {
    dirX: 0,
    dirY: 0
  },
  getState: function() {
    return {
      dirX: this.dirX,
      dirY: this.dirY
    };
  },
  update: function(seconds, joystick) {
    this.dirX = joystick.x;
    this.dirY = joystick.y;
  }
};
