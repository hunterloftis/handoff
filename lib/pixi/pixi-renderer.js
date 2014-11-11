function PixiRenderer(container) {
  this.viewport = new PixiViewport(container);              // Centers and scales contents across device resolutions based on 1080p
  this.camera = new PixiCamera(this.viewport.normalized);   // Contains world so it moves relative to the camera position
  this.world = new PixiWorld(this.camera);                  // Contains 3 layers of rendered game visuals - Ground, Actors, & Overlay

  this.fullScreenHandler = this.requestFullScreen.bind(this, container);
  container.addEventListener('click', this.fullScreenHandler, false);
}

PixiRenderer.prototype.requestFullScreen = function(el) {
  el.removeEventListener('pointerdown', this.fullScreenHandler);
  if (el.requestFullscreen) {
    el.requestFullscreen();
  } else if (el.msRequestFullscreen) {
    el.msRequestFullscreen();
  } else if (el.mozRequestFullScreen) {
    el.mozRequestFullScreen();
  } else if (el.webkitRequestFullscreen) {
    el.webkitRequestFullscreen();
  }
}

PixiRenderer.prototype.load = function(done) {
  var loader = new PIXI.AssetLoader([
    'images/general_spritesheet.json',
    'images/dirt.png',
    'images/grass.png',
    'images/ground.png'
  ]);
  loader.onComplete = onLoad.bind(this);
  loader.load();

  function onLoad() {
    this.terrain = new PixiTerrain(this.world.ground, this.world.actors);
    this.player = new PixiPlayer(this.world.actors);
    this.joystick = new PixiJoystick(this.viewport.raw);

    done();
  }
};

PixiRenderer.prototype.render = function(seconds, state) {
  this.camera.followTarget(seconds, state.player);

  var viewRect = this.viewport.getRectFor(this.world.ground);

  this.player.render(seconds, state.player);
  this.terrain.render(seconds, state.level, viewRect);
  this.world.render(seconds);

  this.joystick.render(seconds, state.joystick);

  this.viewport.render();
};
