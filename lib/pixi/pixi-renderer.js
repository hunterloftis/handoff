function PixiRenderer(container) {
  this.viewport = new PixiViewport(container);              // Centers and scales contents across device resolutions based on 1080p
  this.camera = new PixiCamera(this.viewport.normalized);   // Contains world so it moves relative to the camera position
  this.world = new PixiWorld(this.camera);                  // Contains 3 layers of rendered game visuals - Ground, Actors, & Overlay
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

  this.player.render(seconds, state.player);
  this.terrain.render(seconds, state.level);
  this.world.render(seconds, state.player);

  this.joystick.render(seconds, state.joystick);

  this.viewport.render();
};
