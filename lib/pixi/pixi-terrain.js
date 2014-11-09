function PixiTerrain(camera) {
  this.overflow = 2;    // Multiplier for size so zooming out doesn't show edges

  this.camera = camera;

  var texture = PIXI.Texture.fromImage('images/grass_tile.jpg');
  this.sprite = new PIXI.TilingSprite(texture, 0, 0);

  this.dustTexture = this.createDustTexture();
  this.dustSprites = [];

  this.stepHandler = PubSub.subscribe('/player/step', this.onStep.bind(this));
}

PixiTerrain.prototype.createDustTexture = function() {
  var gfx = new PIXI.Graphics();
  gfx.beginFill(0xffffff);
  gfx.drawCircle(0, 0, 16);
  gfx.endFill();
  return gfx.generateTexture();
};

PixiTerrain.prototype.createDustSprite = function(x, y, scale) {
  var sprite = new PIXI.Sprite(this.dustTexture);
  sprite.anchor.set(0.5, 0.5);
  sprite.scale.set(scale);
  sprite.cacheAsBitmap = true;
  sprite.position.x = x;
  sprite.position.y = y;
  return sprite;
};

PixiTerrain.prototype.onStep = function(x, y, force, index) {
  var power = force / 20;
  if (power > 0.25) {
    this.camera.addChildAt(this.createDustSprite(x, y, power), index);
  }
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
