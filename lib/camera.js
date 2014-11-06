function Camera(container, trail) {
  this.resize = _.debounce(this.resize.bind(this), 500, { leading: true });

  this.x = 0;
  this.y = 0;

  this.trail = trail || 0.5;    // Catch up to the target in (trail) seconds
  this.container = container;
  this.width = container.clientWidth;
  this.height = container.clientHeight;
  this.stage = new PIXI.Stage(0x97c56e, true);
  this.renderer = PIXI.autoDetectRenderer(this.width, this.height, null);

  this.world = new PIXI.DisplayObjectContainer();
  this.world.scale.set(0.5);

  this.floorTexture = PIXI.Texture.fromImage('images/tile.jpg');
  this.floorSprite = new PIXI.TilingSprite(this.floorTexture, this.width, this.height);
  this.floorSprite.position.set(-500, -500);
  this.floorSprite.width = 1000;
  this.floorSprite.height = 1000;

  this.renderer.view.style.position = 'absolute';
  this.renderer.view.style.top = '0px';
  this.renderer.view.style.left = '0px';
  this.container.appendChild(this.renderer.view);

  this.robotSprite = PIXI.Sprite.fromImage('images/robot.jpg');
  this.robotSprite.scale.set(0.2);

  this.joyGraphic = new PIXI.Graphics();
  this.joyGraphic.alpha = 0.1;

  this.world.addChild(this.floorSprite);
  this.world.addChild(this.robotSprite);
  this.world.addChild(this.joyGraphic);

  this.stage.addChild(this.world);

  window.addEventListener('resize', this.resize);
}

Camera.prototype.resize = function() {
  this.width = this.container.clientWidth;
  this.height = this.container.clientHeight;
  this.renderer.resize(this.width, this.height);
};

Camera.prototype.render = function(seconds, state) {
  this.world.position.set(this.width * 0.5, this.height * 0.5);

  var robot = this.robotSprite;
  var floor = this.floorSprite;

  var dx = state.player.x - this.x;
  var dy = state.player.y - this.y;
  var correction = Math.min(seconds / this.trail, 1);

  this.x += dx * correction;
  this.y += dy * correction;

  robot.position.x = state.player.x - this.x - robot.width / 2;
  robot.position.y = state.player.y - this.y - robot.height / 2;

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
