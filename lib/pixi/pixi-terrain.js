function PixiTerrain(camera) {
  this.overflow = 2;    // Multiplier for size so zooming out doesn't show edges

  this.camera = camera;

  var texture = PIXI.Texture.fromImage('images/dirt.png');
  this.sprite = new PIXI.TilingSprite(texture, 0, 0);

  this.groundItems = [];
  this.createGroundItems();

  this.dustTexture = this.createDustTexture();
  this.dustSprites = [];

  this.stepHandler = PubSub.subscribe('/player/step', this.onStep.bind(this));
}

PixiTerrain.prototype.createGroundItems = function() {
  for (var i = 0; i < 5000; i++) {
    this.createGrassSprite();
  }
};

PixiTerrain.prototype.createGrassSprite = function() {
  var grassSprite = PIXI.Sprite.fromFrame('grass_clump');
  grassSprite.scale.set(Math.max(Math.random(), 0.5));
  grassSprite.anchor.set(0.5, 0.5);
  grassSprite.x = Math.random() * 10000 - 5000;
  grassSprite.y = Math.random() * 10000 - 5000;
  this.groundItems.push(grassSprite);
};

PixiTerrain.prototype.createDustTexture = function() {
  var gfx = new PIXI.Graphics();
  gfx.beginFill(0x7C5037);
  gfx.drawCircle(0, 0, 8);
  gfx.endFill();
  return gfx.generateTexture();
};

PixiTerrain.prototype.createDustSprite = function(x, y, scale) {
  if (Math.random() < 0.7) return;

  var sprite = new PIXI.Sprite(this.dustTexture);
  sprite.anchor.set(0.5, 0.5);
  sprite.scale.set(scale);
  // sprite.cacheAsBitmap = true;
  sprite.position.x = x + Math.random() * 40 - 20;
  sprite.position.y = y + Math.random() * 10 - 5;
  sprite.alpha = 0.5;
  sprite.xDrift = Math.random() * 40 - 20;
  sprite.yDrift = -25;

  this.camera.addChildAt(sprite, 0);

  this.dustSprites.push(sprite);
};

PixiTerrain.prototype.onStep = function(x, y, force) {
  while (force-- > 0) {
    this.createDustSprite(x, y, 1);
  }
};

PixiTerrain.prototype.render = function(seconds, state, camera, scale) {
  var sprite = this.sprite;
  var parent = sprite.parent;
  sprite.position.x = parent.position.x / -(scale * 0.5);
  sprite.position.y = parent.position.y / -(scale * 0.5);
  sprite.tilePosition.x = state.x + camera.position.x;
  sprite.tilePosition.y = state.y + camera.position.y;

  this.dustSprites = this.dustSprites.filter(renderDust);

  function renderDust(sprite) {
    sprite.position.y += sprite.yDrift * seconds;
    sprite.position.x += sprite.xDrift * seconds;
    sprite.scale.set(sprite.scale.x + seconds);
    sprite.alpha = Math.max(0, sprite.alpha - seconds * 0.5);
    if (sprite.alpha <= 0) {
      sprite.parent.removeChild(sprite);
      return false;
    }
    return true;
  }
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
