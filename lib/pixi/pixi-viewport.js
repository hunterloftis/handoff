function PixiViewport(container) {
  this.resize = _.debounce(this.resize.bind(this), 1000, { leading: true });

  this.container = container;

  this.pixelRatio = Math.floor(window.devicePixelRatio || 1);
  this.renderer = PIXI.autoDetectRenderer(1, 1, {
    antialias: true,
    resolution: this.pixelRatio,  // TODO: can this be a non-integer?
    view: container
  });

  this.stage = new PIXI.Stage(0x97c56e);
  this.normalized = new PIXI.DisplayObjectContainer();
  this.raw = new PIXI.DisplayObjectContainer();

  this.stage.addChild(this.normalized);
  this.stage.addChild(this.raw);
  this.resize();

  window.addEventListener('resize', this.resize);
}

PixiViewport.prototype.resize = function() {
  var width = this.container.clientWidth
  var height = this.container.clientHeight;
  var scale = Math.max(width, height) / 1080;

  // Store width & height
  this.width = width;
  this.height = height;

  // Center normalized view
  // & scale normalized view to 1080p-equivalent
  this.normalized.position.set(width * 0.5, height * 0.5);
  this.normalized.scale.set(scale);

  // Resize the Pixi renderer
  this.renderer.resize(width, height);
};

PixiViewport.prototype.render = function() {
  this.renderer.render(this.stage);
};
