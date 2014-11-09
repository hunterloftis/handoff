function PixiTerrain() {
  this.overflow = 2;    // Multiplier for size so zooming out doesn't show edges

  var texture = PIXI.Texture.fromImage('images/grass_tile.jpg');
  this.sprite = new PIXI.TilingSprite(texture, 0, 0);
  this.dust = new PIXI.SpriteBatch();
  this.dustSprites = [];

  this.stepHandler = PubSub.subscribe('/player/step', this.onStep.bind(this));
}

PixiTerrain.prototype.createDustSprite = function(x, y) {
  var gfx = new PIXI.Graphics();
  gfx.beginFill(0xffffff);
  gfx.drawCircle(0, 0, 16);
  gfx.endFill();

  var sprite = new PIXI.Sprite(gfx.generateTexture());
  sprite.anchor.set(0.5, 0.5);
  sprite.cacheAsBitmap = true;
  sprite.position.x = x;
  sprite.position.y = y;

  return sprite;
};

PixiTerrain.prototype.onStep = function(x, y, force) {
  this.dust.addChild(this.createDustSprite(x, y));
};

PixiTerrain.prototype.render = function(seconds, state, camera, scale) {
  var sprite = this.sprite;
  var parent = sprite.parent;
  sprite.position.x = parent.position.x / -(scale * 0.5);
  sprite.position.y = parent.position.y / -(scale * 0.5);
  sprite.tilePosition.x = state.x + camera.position.x;
  sprite.tilePosition.y = state.y + camera.position.y;
};

PixiTerrain.prototype.resize = function(width, height, scale) {
  var parent = this.sprite.parent;
  if (!parent) return;

  // Hack to resize a tiling sprite
  parent.removeChild(this.sprite);
  this.sprite.width = (width / scale) * this.overflow;
  this.sprite.height = (height / scale) * this.overflow;
  parent.addChildAt(this.sprite, 0);
};
