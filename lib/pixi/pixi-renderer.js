function PixiRenderer(container) {
  this.viewport = new PixiViewport(container);              // Centers and scales contents across device resolutions based on 1080p
  this.camera = new PixiCamera(this.viewport.normalized);   // Contains world so it moves relative to the camera position
  this.world = new PixiWorld(this.camera);                  // Contains 3 layers of rendered game visuals - Ground, Actors, & Overlay

  this.spriteConstructor = {
    'fireball': PixiFireball
  };

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
    this.player = new PixiPlayer(this.world.actors);
    this.joystick = new PixiJoystick(this.viewport.raw);
    this.magic = new PixiMagic(this.viewport.raw);
    this.spells = [];

    done();
  }
};

PixiRenderer.prototype.render = function(seconds, state) {
  this.camera.leadTarget(seconds, state.player);
  this.camera.update(seconds);

  var viewRect = this.viewport.getRectFor(this.world.ground);

  this.terrain.render(seconds, state.level, viewRect);
  this.player.render(seconds, state.player);
  this.renderSpells(seconds, state);
  this.world.render(seconds);

  this.joystick.render(seconds, state.joystick);
  this.magic.render(seconds, state.magic);

  this.viewport.render();
};

// Convert device coordinates into world coordinates
PixiRenderer.prototype.pick = function(x, y) {
  var mapped = this.world.actors.toLocal(new PIXI.Point(x, y), this.stage);
  console.log('mapped x:', x, 'y:', y, 'to:', JSON.stringify(mapped));
  return {
    x: -mapped.x,
    y: -mapped.y
  };
};

PixiRenderer.prototype.renderSpells = function(seconds, state) {
  state.spells.forEach(render.bind(this));
  this.spells = this.spells.filter(cull.bind(this));

  function render(spellState) {
    var sprite = _.find(this.spells, { id: spellState.id });
    if (!sprite) {
      var SpriteConstructor = this.spriteConstructor[spellState.name];
      sprite = new SpriteConstructor(spellState.id, this.world.actors);
      this.spells.push(sprite);
    }
    sprite.render(seconds, state, spellState);
  }

  function cull(spellSprite) {
    var spellState = _.find(state.spells, { id: spellSprite.id });
    if (spellState) return true;
    spellSprite.parent.removeChild(spellSprite);
  }
};
