function Camera(container, trail) {
  this.resize = _.debounce(this.resize.bind(this), 1000, { leading: true });

  this.x = 0;
  this.y = 0;
  this.scale = 1;
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

  this.floorTexture = PIXI.Texture.fromImage('images/grass_tile.jpg');
  this.floorSprite = new PIXI.TilingSprite(this.floorTexture, this.width, this.height);

  this.robotSprite = PIXI.Sprite.fromImage('images/robot.png');
  this.robotSprite.scale.set(1);
  this.robotSprite.anchor.set(0.5, 0.8);
  this.robotSprite.leanX = 0;
  this.robotSprite.leanY = 0;

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

  this.centerX = width * 0.5;
  this.centerY = height * 0.5;

  this.scale = Math.max(width, height) / 1080;
  this.zoom = 1;

  this.renderer.resize(width, height);

  this.world.scale.set(this.scale);

  this.world.removeChild(this.floorSprite);
  this.floorSprite.width = (width / this.scale) * 2;
  this.floorSprite.height = (height / this.scale) * 2;
  this.world.addChildAt(this.floorSprite, 0);
};

Camera.prototype.render = function(seconds, state) {
  var robot = this.robotSprite;
  var floor = this.floorSprite;
  var player = state.player.getPhysics();
  var playerSpeed = 0;

  var dx = player.x - this.x;
  var dy = player.y - this.y;
  var dZoom = 1 / (playerSpeed * 0.001 + 1) - this.zoom;
  var correction = Math.min(seconds / this.trail, 1);

  this.zoom += dZoom * correction;
  this.x += dx * correction;
  this.y += dy * correction;

  this.world.position.x = this.centerX;
  this.world.position.y = this.centerY;
  this.world.scale.set(this.scale * this.zoom);

  floor.position.x = this.world.position.x / -(this.scale * 0.5);
  floor.position.y = this.world.position.y / -(this.scale * 0.5);
  floor.tilePosition.x = state.level.x - this.x;
  floor.tilePosition.y = state.level.y - this.y;

  robot.position.x = player.x - this.x;
  robot.position.y = player.y - this.y;

  // robot.scale.x = 1 + Math.abs(robot.leanX) * 0.1;
  // robot.scale.y = 1 + Math.abs(robot.leanY) * 0.2;
  // robot.rotation = robot.leanX * Math.PI * 0.07;

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
