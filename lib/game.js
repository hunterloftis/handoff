function Game(renderer, joystick, raf) {
  this.renderer = renderer;
  this.joystick = joystick;
  this.loop = new Loop(raf || requestAnimationFrame, 180);

  this.entities = new EntityGroup([
    positionSystem,
    walkingSystem,
    controllableSystem,
    wanderingSystem,
    playerSystem,
    levelSystem,
    joystickSystem
  ]);

  this.entities.create('player')
    .add('position')
    .add('walking')
    .add('controllable')
    .add('player');

  var i = 50;
  while (i--) {
    this.entities.create()    // Will automatically generate an ID for you if not specified
      .add('position', { x: Math.random() * 500 - 250, y: Math.random() * 500 - 250 })
      .add('walking', { maxSpeed: 150 })
      .add('wandering')
      .add('player');
  }

  this.entities.create('level')
    .add('level');

  this.entities.create('joystick')
    .add('joystick');
}

Game.prototype.start = function() {
  var entities = this.entities;
  var joystick = this.joystick;
  var renderer = this.renderer;

  this.loop.start(simulate.bind(this), render.bind(this));

  function simulate(seconds) {
    entities.update('controllable', seconds, joystick.getXY());
    entities.update('wandering', seconds);
    entities.update('walking', seconds);
    entities.update('joystick', seconds, joystick.getState());
  }

  function render(seconds) {
    renderer.render(seconds, entities.getState());
  }
};
