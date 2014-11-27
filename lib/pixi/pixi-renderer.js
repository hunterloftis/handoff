function PixiRenderer(container) {
  this.viewport = new PixiViewport(container);              // Centers and scales contents across device resolutions based on 1080p
  this.camera = new PixiCamera(this.viewport.normalized);   // Contains world so it moves relative to the camera position
  this.world = new PixiWorld(this.camera);                  // Contains 3 layers of rendered game visuals - Ground, Actors, & Overlay

  this.fullScreenHandler = this.requestFullScreen.bind(this, container);
}

PixiRenderer.prototype.requestFullScreen = function(el) {
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
    'images/general_spritesheet.json'
  ]);
  loader.onComplete = onLoad.bind(this);
  loader.load();

  function onLoad() {
    this.terrain = new PixiTerrain(this.world.ground, this.world.actors);
    this.players = [];
    this.joystick = new PixiJoystick(this.viewport.raw);

    done();
  }
};

PixiRenderer.prototype.render = function(seconds, entities) {
  var players = find('player');
  var level = _.find(entities, { id: 'level' });
  var joystick = _.find(entities, { id: 'joystick' });

  this.camera.leadTarget(seconds, players[0]);
  this.camera.update(seconds);

  var viewRect = this.viewport.getRectFor(this.world.ground);

  this.renderPlayers(seconds, find('player').slice(0, 1));

  this.terrain.render(seconds, level, viewRect);
  this.world.render(seconds);

  this.joystick.render(seconds, joystick);

  this.viewport.render();

  function find(name) {
    return _.filter(entities, function hasSystem(entity) {
      return entity.systems.indexOf(name) !== -1;
    });
  }
};

PixiRenderer.prototype.renderPlayers = function(seconds, players) {
  players.forEach(function renderPlayer(player, i) {
    if (!this.players[i]) this.players[i] = new PixiPlayer(this.world.actors);
    this.players[i].render(seconds, player);
  }.bind(this));
};
