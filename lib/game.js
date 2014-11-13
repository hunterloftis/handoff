function Game(renderer, joystick, magic, target, raf) {
  this.renderer = renderer;
  this.joystick = joystick;
  this.magic = magic;
  this.target = target;

  this.loop = new Loop(raf || requestAnimationFrame, 180);
  this.player = new Player();
  this.level = new Level();
  this.spells = [];

  PubSub.subscribe('magic/cast', this.onCast.bind(this));
}

Game.prototype.start = function() {
  this.loop.start(simulate.bind(this), render.bind(this));

  function simulate(seconds) {
    this.player.update(seconds, this.joystick.getXY());
    this.spells = this.spells.filter(function updateSpell(spell) {
      return spell.update(seconds, this);
    }.bind(this));
  }

  function render(seconds) {
    this.renderer.render(seconds, this.getState());
  }
};

Game.prototype.getState = function() {
  return {
    player: this.player.getState(),
    level: this.level.getState(),
    joystick: this.joystick.getState(),
    magic: this.magic.getState(),
    spells: this.spells.map(getState)
  };

  function getState(obj) {
    return obj.getState();
  }
};

Game.prototype.onCast = function(spellName) {
  if (spellName === 'fireball') {
    this.spells.push(new Fireball());
  }
};
