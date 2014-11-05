function Game(container) {
  this.container = container;

  this.touch = new Touch(container);
  this.loop = new Loop(60);
  this.player = new Player();
  this.camera = new Camera(container);
  this.level = new Level();
}

Game.prototype.start = function() {
  this.loop.start(simulate.bind(this), render.bind(this));

  function simulate(seconds) {
    this.player.update(seconds, this.touch.x, this.touch.y);
  }

  function render(seconds) {
    this.camera.render(seconds, {
      player: this.player,
      level: this.level
    });
  }
};
