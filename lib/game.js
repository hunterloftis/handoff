function Game(requestAnimationFrame, renderer, joystick) {
  this.renderer = renderer;
  this.joystick = joystick;

  this.loop = new Loop(requestAnimationFrame, 180);
  this.player = new Player();
  this.level = new Level();
}

Game.prototype.start = function() {
  this.loop.start(simulate.bind(this), render.bind(this));

  function simulate(seconds) {
    this.player.update(seconds, this.joystick.getXY());
  }

  function render(seconds) {
    this.renderer.render(seconds, {
      player: this.player,
      level: this.level,
      joystick: this.joystick.getCircle()
    });
  }
};
