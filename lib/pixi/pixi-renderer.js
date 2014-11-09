function PixiRenderer(container) {
  this.resize = _.debounce(this.resize.bind(this), 1000, { leading: true });

  this.x = 0;
  this.y = 0;
  this.scale = 1;
  this.trail = 0.3;    // Catch up to the target in (trail) seconds

  this.container = container;
  this.pixelRatio = Math.floor(window.devicePixelRatio || 1);
  this.renderer = PIXI.autoDetectRenderer(1, 1, {
    antialias: true,
    resolution: this.pixelRatio,
    view: container
  });

  this.stage = new PIXI.Stage(0x97c56e, true);
  this.centered = new PIXI.DisplayObjectContainer();
  this.camera = new PIXI.DisplayObjectContainer();

  this.centered.addChild(this.camera);
  this.stage.addChild(this.centered);

  window.addEventListener('resize', this.resize);
}

PixiRenderer.prototype.load = function(done) {
  var loader = new PIXI.AssetLoader([
    'images/general_spritesheet.json',
    'images/grass_tile.jpg'
  ]);
  loader.onComplete = onLoad.bind(this);
  loader.load();

  function onLoad() {
    this.floorTexture = PIXI.Texture.fromImage('images/grass_tile.jpg');
    this.floorSprite = new PIXI.TilingSprite(this.floorTexture, this.width, this.height);

    this.player = new PixiPlayer();

    this.joyGraphic = new PIXI.Graphics();
    this.joyGraphic.alpha = 0.1;

    this.centered.addChild(this.floorSprite);
    this.camera.addChild(this.player.mc);
    this.stage.addChild(this.joyGraphic);

    this.resize();
    done();
  }
};

PixiRenderer.prototype.resize = function() {
  var width = this.container.clientWidth
  var height = this.container.clientHeight;

  this.width = width;
  this.height = height;
  this.centered.position.set(width * 0.5, height * 0.5);
  this.centered.scale.set(this.getScale() * this.zoom);
  this.zoom = 1;

  // Tell Pixi to resize the canvas
  this.renderer.resize(width, height);

  // Hack to resize a TilingSprite
  this.centered.removeChild(this.floorSprite);
  this.floorSprite.width = (width / this.getScale()) * 2;
  this.floorSprite.height = (height / this.getScale()) * 2;
  this.centered.addChildAt(this.floorSprite, 0);
};

// Base our scaling on a 1080p screen size
PixiRenderer.prototype.getScale = function() {
  return Math.max(this.width, this.height) / 1080;
};

PixiRenderer.prototype.followTarget = function(seconds, target) {
  var dx = target.x - this.x;
  var dy = target.y - this.y;
  var wantedZoom = 1 / (target.speed * 0.001 + 1);
  var dZoom = wantedZoom - this.zoom;
  var camCorrection = Math.min(seconds / this.trail, 1);

  this.zoom += dZoom * camCorrection;
  this.x += dx * camCorrection;
  this.y += dy * camCorrection;

  this.camera.position.set(-this.x, -this.y);
  this.centered.scale.set(this.getScale() * this.zoom);
};

PixiRenderer.prototype.render = function(seconds, state) {
  var floor = this.floorSprite;
  var scale = this.getScale();

  this.followTarget(seconds, state.player);
  this.player.render(seconds, state.player);

  floor.position.x = this.centered.position.x / -(scale * 0.5);
  floor.position.y = this.centered.position.y / -(scale * 0.5);
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
