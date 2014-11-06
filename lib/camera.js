function Camera(container) {
  this.x = 0;
  this.y = 0;

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
  this.container.appendChild(this.renderer.view);

  this.robotSprite = PIXI.Sprite.fromImage('images/robot.jpg');
  this.robotSprite.scale.set(0.2);

  this.stage.addChild(this.floorSprite);
  this.stage.addChild(this.robotSprite);
}

Camera.prototype.render = function(seconds, state) {
  var ox = this.width * 0.5;
  var oy = this.height * 0.5;
  var robot = this.robotSprite;
  var floor = this.floorSprite.tilePosition;

  var dx = state.player.x - this.x;
  var dy = state.player.y - this.y;

  this.x += dx * seconds;
  this.y += dy * seconds;

  robot.position.x = ox + state.player.x - this.x - robot.width / 2;
  robot.position.y = oy + state.player.y - this.y - robot.height / 2;

  floor.x = ox + state.level.x - this.x;
  floor.y = oy + state.level.y - this.y;

  this.renderer.render(this.stage);
};
