function PixiTerrain(camera) {
  this.overflow = 2;    // Multiplier for size so zooming out doesn't show edges

  this.camera = camera;

  var texture = PIXI.Texture.fromImage('images/ground.png');
  this.sprite = new PIXI.TilingSprite(texture, 0, 0);

  this.groundItems = new PIXI.SpriteBatch();
  this.createGroundItems();

  this.dustTexture = this.createDustTexture();
  this.dustSprites = [];

  this.stepHandler = PubSub.subscribe('/player/step', this.onStep.bind(this));
}

PixiTerrain.prototype.createGroundItems = function() {
  var groundItemMix = [
    { name: 'rock_01', scaleMin: 0.25, scaleMax: 1.0, num: 2000},
    { name: 'rock_02', scaleMin: 0.5, scaleMax: 1.0, num: 750},
    { name: 'tree_01', scaleMin: 1.5, scaleMax: 3.0, num: 50},
    { name: 'tree_02', scaleMin: 0.8, scaleMax: 1.2, num: 100}
  ];

  groundItemMix.forEach(function(item) {
    for (var i = 0; i < item.num; i++) {
      this.createGroundItemSprite(item, 10000);
    }
  }, this);

};

PixiTerrain.prototype.createGroundItemSprite = function(item, range) {
  var sprite = PIXI.Sprite.fromFrame('environment/' + item.name);
  sprite.scale.set(Math.max(Math.random() * item.scaleMax, item.scaleMin));
  sprite.anchor.set(0.5, 0.5);
  sprite.position.x = Math.random() * range - range/2;
  sprite.position.y = Math.random() * range - range/2;
  this.groundItems.addChild(sprite);
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

  this.groundItems.children.map(renderGroundItem);

  function renderGroundItem(sprite) {
    // TODO: handle movement to match camera?
  }

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
