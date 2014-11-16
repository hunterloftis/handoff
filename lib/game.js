function Game(renderer, joystick, remote, raf) {
  this.renderer = renderer;
  this.joystick = joystick;
  this.remote = remote;

  this.loop = new Loop(raf || requestAnimationFrame, 180);
  this.player = new Player();
  this.level = new Level();
}

Game.prototype.start = function() {
  this.loop.start(simulate.bind(this), render.bind(this));

  function simulate(seconds) {
    this.player.update(seconds, this.joystick.getXY());
  }

  function render(seconds) {
    var state = this.getState();
    this.renderer.render(seconds, state);
    if (this.remote) this.remote.broadcast(seconds, state);
  }
};

Game.prototype.getState = function() {
  return {
    player: this.player.getState(),
    level: this.level.getState(),
    joystick: this.joystick.getState()
  };
};
