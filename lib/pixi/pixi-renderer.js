function PixiRenderer(container) {
  this.resize = _.debounce(this.resize.bind(this), 1000, { leading: true });

  this.container = container;
  this.pixelRatio = Math.floor(window.devicePixelRatio || 1);
  this.renderer = PIXI.autoDetectRenderer(1, 1, {
    antialias: true,
    resolution: this.pixelRatio,
    view: container
  });

  this.stage = new PIXI.Stage(0x97c56e, true);
  this.centered = new PIXI.DisplayObjectContainer();
  this.camera = new PixiCameraContainer(this.centered);

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
    this.magic = new PixiMagic();

    this.centered.addChild(this.terrain.sprite);
    this.camera.addChild(this.player.mc);
    this.stage.addChild(this.joystick.gfx);
    this.stage.addChild(this.magic.group);

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

  // Tell Pixi to resize the canvas
  this.renderer.resize(width, height);

  // Rebuild our terrain for the new size
  this.terrain.resize(width, height, this.getScale());
};

// Base our scaling on a 1080p screen size
PixiRenderer.prototype.getScale = function() {
  return Math.max(this.width, this.height) / 1080;
};

PixiRenderer.prototype.render = function(seconds, state) {
  this.camera.followTarget(seconds, this.getScale(), state.player);
  this.player.render(seconds, state.player);
  this.terrain.render(seconds, state.level, this.camera, this.getScale());
  this.joystick.render(seconds, state.joystick);
  this.magic.render(seconds, state.magic);

  this.renderer.render(this.stage);
};
