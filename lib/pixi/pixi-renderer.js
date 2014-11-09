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
    this.player = new PixiPlayer();
    this.terrain = new PixiTerrain();
    this.joystick = new PixiJoystick();

    this.centered.addChild(this.terrain.sprite);
    this.camera.addChild(this.player.mc);
    this.stage.addChild(this.joystick.gfx);

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

  // Rebuild our terrain for the new size
  this.terrain.resize(width, height, this.getScale());
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
  this.followTarget(seconds, state.player);
  this.player.render(seconds, state.player);
  this.terrain.render(seconds, state.level, this, this.getScale());
  this.joystick.render(seconds, state.joystick);
  
  this.renderer.render(this.stage);
};
