function Game(container, requestAnimationFrame) {
  this.container = container;

  this.loop = new Loop(requestAnimationFrame, 60);
  this.player = new Player();
  this.level = new Level();

  this.camera = new Camera(container, 0.3);
  this.joystick = new Joystick(container);
}

Game.prototype.start = function() {
  this.loop.start(simulate.bind(this), render.bind(this));

  function simulate(seconds) {
    this.player.update(seconds, this.joystick.getXY());
  }

  function render(seconds) {
    this.camera.render(seconds, {
      player: this.player,
      level: this.level,
      joystick: this.joystick.getCircle()
    });
  }
};
