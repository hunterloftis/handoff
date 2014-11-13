function PixiTerrain(ground, actors) {
  this.tileSize = 128;

  this.groundContainer = ground;
  this.actorContainer = actors;

  this.createGroundItems();


  // parse available environment textures and organize in nested groupings
  var envTexturesMap = {};
  Object.keys(PIXI.TextureCache).forEach(function(textureName) {
    var textureDetails = textureName.match(/environment\/(\w\w)(\w\w)(\w)(\w)(\w)(\w)/i);
    if (textureDetails) {

      // B0-B1 = Blob
      // D0-D1 = Dirt
      // D0 = Grass
      // R0 = Ramp
      // S0-S2 = Stone
      // S3 = Stone (Squiggle Rock)
      // S4 = Stone (Hex Pavement)
      var textureGroup = textureDetails[1];
      if (!envTexturesMap[textureGroup]) {
        envTexturesMap[textureGroup] = {};
      }

      // edge pieces, which texture group they transition into
      var textureTransitionToType = textureDetails[2];

      // M = main tile
      // N = single detail tile
      // S = large detail tiles
      var textureTileType = textureDetails[3];
      if (!envTexturesMap[textureGroup][textureTileType]) {
        envTexturesMap[textureGroup][textureTileType] = [];
      }

      envTexturesMap[textureGroup][textureTileType].push(PIXI.TextureCache[textureName]);
      console.log("adding: " + textureName );
    }
  }, this);
  var tileGroupNames = Object.keys(envTexturesMap);
  var numGroups = tileGroupNames.length;
  var baseEnvTexture = tileGroupNames[Math.floor(Math.random() * numGroups)];
  this.availableBaseTextures = envTexturesMap[baseEnvTexture].M;


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
  gfx.beginFill(0xa2895C);
  for (var i = 0; i < 10; i++) {
    gfx.drawCircle(Math.random() * 10, Math.random() * 10, 2);
  }
  gfx.endFill();
  return gfx.generateTexture();
};

PixiTerrain.prototype.createDustSprite = function(x, y, vx, vy) {
  if (Math.random() < 0.7) return;

  var sprite = new PIXI.Sprite(this.dustTexture);
  sprite.anchor.set(0.5, 1);
  sprite.scale.set(0.5);
  sprite.position.x = x + Math.random() * 30 - 15;
  sprite.position.y = y + Math.random() * 10 - 5;
  sprite.alpha = 0.5;
  sprite.xDrift = vx * 5 + Math.random() * 4 - 2;
  sprite.yDrift = vy * 5 - 2;

  this.actorContainer.addChild(sprite);

  this.dustSprites.push(sprite);
};

PixiTerrain.prototype.onStep = function(step, footDown) {
  var force = Math.sqrt(step.ax * step.ax + step.ay * step.ay) - 3;
  if (step.speed > 100 && footDown && force < 2) force = 2;
  while (force-- > 0) {
    this.createDustSprite(step.x, step.y, -step.ax, -step.ay);
  }
};

PixiTerrain.prototype.createTile = function(x, y, type, timestamp) {
  var sprite = new PIXI.Sprite(this.availableBaseTextures[type]);
  sprite.timestamp = timestamp;
  sprite.position.set(x, y);
  sprite.width = this.tileSize + 1;
  sprite.height = this.tileSize + 1;
  this.groundContainer.addChild(sprite);
  return sprite;
};

PixiTerrain.prototype.destroyTile = function(tile) {
  tile.parent.removeChild(tile);
};

PixiTerrain.prototype.render = function(seconds, state, rect) {
  this.dustSprites = this.dustSprites.filter(renderDust);

  var tileSize = this.tileSize;
  var left = Math.floor(rect.left / tileSize);
  var top = Math.floor(rect.top / tileSize);
  var right = Math.floor(rect.right / tileSize);
  var bottom = Math.floor(rect.bottom / tileSize);
  var now = Date.now();

  for (var row = top; row <= bottom; row++) {
    for (var col = left; col <= right; col++) {
      var index = col + row * state.mapWidth;
      var tileType = Math.floor(Math.random() * this.availableBaseTextures.length); //state.map[index];
      var exists = this.tiles[index];
      if (exists) {
        this.tiles[index].timestamp = now;
      }
      else {
        this.tiles[index] = this.createTile(col * tileSize, row * tileSize, tileType, now);
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
