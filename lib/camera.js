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

  this.floorTexture = PIXI.Texture.fromImage('images/tile.jpg');
  this.floorSprite = new PIXI.TilingSprite(this.floorTexture, this.width, this.height);

  this.renderer.view.style.position = 'absolute';
  this.renderer.view.style.top = '0px';
  this.renderer.view.style.left = '0px';
  // this.renderer.view.style.width = '100%';
  // this.renderer.view.style.height = '100%';
  this.container.appendChild(this.renderer.view);

  this.robotSprite = PIXI.Sprite.fromImage('images/robot.jpg');
  this.robotSprite.scale.set(0.2);

  this.joyGraphic = new PIXI.Graphics();
  this.joyGraphic.alpha = 0.1;

  this.stage.addChild(this.floorSprite);
  this.stage.addChild(this.robotSprite);
  this.stage.addChild(this.joyGraphic);

  window.addEventListener('resize', this.resize);
}

Camera.prototype.resize = function() {
  this.width = this.container.clientWidth;
  this.height = this.container.clientHeight;
  this.renderer.resize(this.width, this.height);
  this.stage.removeChild(this.floorSprite);
  this.floorSprite.width = this.width;
  this.floorSprite.height = this.height;
  this.stage.addChildAt(this.floorSprite, 0);
};

Camera.prototype.render = function(seconds, state) {
  var ox = this.width * 0.5;
  var oy = this.height * 0.5;
  var robot = this.robotSprite;
  var floor = this.floorSprite.tilePosition;

  var dx = state.player.x - this.x;
  var dy = state.player.y - this.y;
  var correction = Math.min(seconds / this.trail, 1);

  this.x += dx * correction;
  this.y += dy * correction;

  robot.position.x = ox + state.player.x - this.x - robot.width / 2;
  robot.position.y = oy + state.player.y - this.y - robot.height / 2;

  floor.x = ox + state.level.x - this.x;
  floor.y = oy + state.level.y - this.y;

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
