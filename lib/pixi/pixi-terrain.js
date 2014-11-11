function PixiTerrain(ground, actors) {
  this.groundContainer = ground;
  this.actorContainer = actors;

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
  sprite.anchor.set(0.5, 0.8);
  sprite.position.x = Math.random() * range - range/2;
  sprite.position.y = Math.random() * range - range/2;
  this.actorContainer.addChild(sprite);
};

PixiTerrain.prototype.createDustTexture = function() {
  var gfx = new PIXI.Graphics();
  gfx.beginFill(0xffffff);
  gfx.drawCircle(0, 0, 8);
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
  sprite.xDrift = Math.random() * 40 - 20;
  sprite.yDrift = -25;

  this.actorContainer.addChild(sprite);

  this.dustSprites.push(sprite);
};

PixiTerrain.prototype.onStep = function(x, y, force) {
  while (force-- > 0) {
    this.createDustSprite(x, y, 1);
  }
};

PixiTerrain.prototype.render = function(seconds, state) {
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
