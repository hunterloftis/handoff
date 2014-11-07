function Camera(container, trail) {
  this.resize = _.debounce(this.resize.bind(this), 1000, { leading: true });

  this.x = 0;
  this.y = 0;
  this.zoom = 1;
  this.trail = trail || 0.5;    // Catch up to the target in (trail) seconds

  this.pixelRatio = Math.floor(window.devicePixelRatio || 1);
  this.container = container;

  this.renderer = PIXI.autoDetectRenderer(1, 1, {
    antialias: true,
    resolution: this.pixelRatio,
    view: container
  });

  this.stage = new PIXI.Stage(0x97c56e, true);

  this.world = new PIXI.DisplayObjectContainer();

  this.floorTexture = PIXI.Texture.fromImage('images/tile.jpg');
  this.floorSprite = new PIXI.TilingSprite(this.floorTexture, this.width, this.height);

  this.robotSprite = PIXI.Sprite.fromImage('images/robot.png');
  this.robotSprite.scale.set(1);

  this.joyGraphic = new PIXI.Graphics();
  this.joyGraphic.alpha = 0.1;

  this.world.addChild(this.floorSprite);
  this.world.addChild(this.robotSprite);

  this.stage.addChild(this.world);
  this.stage.addChild(this.joyGraphic);

  this.resize();

  window.addEventListener('resize', this.resize);
}

Camera.prototype.resize = function() {
  var container = this.container;
  var width = this.width = container.clientWidth;
  var height = this.height = container.clientHeight;

  this.zoom = Math.max(width, height) / 1080;

  this.renderer.resize(width, height);

  this.world.scale.set(this.zoom);

  this.world.removeChild(this.floorSprite);
  this.floorSprite.width = width / this.zoom;
  this.floorSprite.height = height / this.zoom;
  this.world.addChildAt(this.floorSprite, 0);
};

Camera.prototype.render = function(seconds, state) {
  this.world.position.x = this.width * 0.5;
  this.world.position.y = this.height * 0.5;

  var robot = this.robotSprite;
  var floor = this.floorSprite;

  var dx = state.player.x - this.x;
  var dy = state.player.y - this.y;
  var correction = Math.min(seconds / this.trail, 1);

  this.x += dx * correction;
  this.y += dy * correction;

  robot.position.x = state.player.x - this.x - robot.width / 2;
  robot.position.y = state.player.y - this.y - robot.height / 2;

  floor.position.x = this.world.position.x / -this.zoom;
  floor.position.y = this.world.position.y / -this.zoom;
  floor.tilePosition.x = state.level.x - this.x;
  floor.tilePosition.y = state.level.y - this.y;

  this.joyGraphic.clear();
  this.joyGraphic.lineStyle(10, 0xffffff)
  this.joyGraphic.beginFill(0x000000);
  this.joyGraphic.drawCircle(state.joystick.x, state.joystick.y, state.joystick.radius);
  this.joyGraphic.endFill();
  this.joyGraphic.beginFill(0xffffff);
  this.joyGraphic.drawCircle(state.joystick.x, state.joystick.y, 10);
  this.joyGraphic.endFill();

  this.renderer.render(this.stage);
};
