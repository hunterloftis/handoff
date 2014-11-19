function Game(renderer, joystick, raf) {
  this.renderer = renderer;
  this.joystick = joystick;

  this.loop = new Loop(raf || requestAnimationFrame, 180);
  this.entities = new EntitySystem(components);

  this.entities.create('player')
    .add('positioned')
    .add('runnable')
    .add('controllable')
    .add('player');

  this.entities.create('player2')
    .add('positioned')
    .add('runnable')
    .add('player');

  this.entities.create('level')
    .add('mappable');

  this.entities.create('joystick')
    .add('joystick');
}

Game.prototype.start = function() {
  this.loop.start(simulate.bind(this), render.bind(this));

  function simulate(seconds) {
    controlSystem(seconds, this.entities, this.joystick.getXY());
    runSystem(seconds, this.entities);
  }

  function render(seconds) {
    joystickSystem(seconds, this.entities, this.joystick.getState());
    this.renderer.render(seconds, this.entities.getState());
  }
};
