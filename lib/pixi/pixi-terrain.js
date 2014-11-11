function PixiTerrain(ground, actors) {
  this.groundContainer = ground;
  this.actorContainer = actors;

  this.createGroundItems();

  this.grassTexture = PIXI.Texture.fromImage('images/ground.png');
  this.dustTexture = this.createDustTexture();

  this.dustSprites = [];
  this.tiles = {};

  this.stepHandler = PubSub.subscribe('/player/step', this.onStep.bind(this));
}

PixiTerrain.prototype.createGroundItems = function() {
  var groundItemMix = [
    { name: 'rock_01', scaleMin: 0.5, scaleMax: 1, num: 30},
    { name: 'rock_02', scaleMin: 0.5, scaleMax: 1, num: 30},
    { name: 'tree_01', scaleMin: 1, scaleMax: 2, num: 30},
    { name: 'tree_02', scaleMin: 1, scaleMax: 2, num: 30}
  ];

  groundItemMix.forEach(function(item) {
    for (var i = 0; i < item.num; i++) {
      this.createGroundItemSprite(item, 2000);
    }
  }, this);

};

PixiTerrain.prototype.createGroundItemSprite = function(item, range) {
  var sprite = PIXI.Sprite.fromFrame('environment/' + item.name);
  sprite.scale.set(Math.max(Math.random() * item.scaleMax, item.scaleMin));
  sprite.anchor.set(0.5, 0.8);
  sprite.position.x = Math.random() * range - range/2;
  sprite.position.y = Math.random() * range - range/2;
  this.actorContainer.addChild(sprite);
};

PixiTerrain.prototype.createDustTexture = function() {
  var gfx = new PIXI.Graphics();
  gfx.beginFill(0xffffff);
  gfx.drawCircle(0, 0, 4);
  gfx.endFill();
  return gfx.generateTexture();
};

PixiTerrain.prototype.createDustSprite = function(x, y, scale) {
  if (Math.random() < 0.7) return;

  var sprite = new PIXI.Sprite(this.dustTexture);
  sprite.anchor.set(0.5, 0.5);
  sprite.scale.set(scale);
  sprite.position.x = x + Math.random() * 40 - 20;
  sprite.position.y = y + Math.random() * 10 - 5;
  sprite.alpha = 0.5;
  sprite.xDrift = Math.random() * 20 - 10;
  sprite.yDrift = -15;

  this.actorContainer.addChild(sprite);

  this.dustSprites.push(sprite);
};

PixiTerrain.prototype.onStep = function(x, y, force) {
  while (force-- > 0) {
    this.createDustSprite(x, y + 5, 1);
  }
};

PixiTerrain.prototype.createTile = function(x, y, type, timestamp) {
  var sprite = new PIXI.Sprite(this.grassTexture);
  sprite.timestamp = timestamp;
  sprite.position.set(x, y);
  sprite.width = 128;
  sprite.height = 128;
  this.actorContainer.addChild(sprite);
  return sprite;
};

PixiTerrain.prototype.destroyTile = function(tile) {
  tile.parent.removeChild(tile);
};

PixiTerrain.prototype.render = function(seconds, state, rect) {
  this.dustSprites = this.dustSprites.filter(renderDust);

  var tileWidth = 128;
  var tileHeight = 128;
  var left = Math.floor(rect.left / tileWidth);
  var top = Math.floor(rect.top / tileHeight);
  var right = Math.floor(rect.right / tileWidth);
  var bottom = Math.floor(rect.bottom / tileHeight);
  var now = Date.now();

  for (var row = top; row <= bottom; row++) {
    for (var col = left; col <= right; col++) {
      var index = col + row * state.mapWidth;
      var tileType = 1; //state.map[index];
      var exists = this.tiles[index];
      if (exists) {
        this.tiles[index].timestamp = now;
      }
      else {
        this.tiles[index] = this.createTile(col * tileWidth, row * tileWidth, tileType, now);
      }
    }
  }

  Object.keys(this.tiles).forEach(cullOffscreenTiles.bind(this));

  function cullOffscreenTiles(index) {
    if (this.tiles[index].timestamp < now) {
      this.destroyTile(this.tiles[index]);
      delete this.tiles[index];
    }
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
