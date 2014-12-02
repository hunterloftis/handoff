var Loop = require('./loop/loop');
var EntityGroup = require('./esystem').EntityGroup;

var SYSTEMS = [
  require('./systems/position'),
  require('./systems/walking'),
  require('./systems/controllable'),
  require('./systems/wandering'),
  require('./systems/player'),
  require('./systems/level'),
  require('./systems/joystick'),
  require('./systems/dude'),
  require('./systems/surfing')
];

module.exports = Game;

function Game(renderer, joystick, raf) {
  this.renderer = renderer;
  this.joystick = joystick;
  this.loop = new Loop(raf || requestAnimationFrame, 180);

  this.entities = new EntityGroup(SYSTEMS);

  this.entities.create('player')
    .add('position')
    .add('surfing')
    .add('controllable')
    .add('player');

  var i = 10;
  while (i-- > 0) {
    var newDude = this.entities.create()    // Will automatically generate an ID for you if not specified
      .add('position', { x: Math.random() * 500 - 250, y: Math.random() * 500 - 250 })
      .add('wandering')
      .add('dude');

    if (Math.random() < 0.5) newDude.add('walking', { maxSpeed: 150 });
    else newDude.add('surfing');
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
    entities.update('surfing', seconds);
    entities.update('joystick', seconds, joystick.getState());
  }

  function render(seconds) {
    renderer.render(seconds, entities.getState());
  }
};
