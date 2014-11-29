function BlitRenderer(container) {
  this.resize = _.debounce(this.resize.bind(this), 1000, { leading: true });

  this.surface = new Blit.Surface(container);
  this.camera = new BlitCamera();
  //this.terrain = new BlitTerrain();
  this.playerSprite = new Blit.Sprite(this.surface, 56, 65, 'images/character_62.png');
  //this.playerSprite = new Blit.Sprite(this.surface, 128, 128, 'images/dirt.jpg');
  //this.joystick = new BlitJoystick();

  this.resize();
  window.addEventListener('resize', this.resize);
}

BlitRenderer.prototype.resize = function() {
  var dims = this.surface.resize();
  this.scale = Math.max(dims.width, dims.height) / 1080;
};

BlitRenderer.prototype.render = function(seconds, entities) {
  var surface = this.surface;
  var playerSprite = this.playerSprite;

  var players = findAll('player');
  var level = _.find(entities, { id: 'level' });
  var joystick = _.find(entities, { id: 'joystick' });

  // Track player with camera
  this.camera.update(seconds, players[0]);

  // Clear the surface
  surface.clear();

  // Zoom and translate
  surface.push();
  surface.translate(surface.width * 0.5, surface.height * 0.5);             // center
  surface.scale(1 / this.scale);                                            // scale to 1080p
  surface.scale(this.camera.zoom);                                          // scale to camera zoom
  surface.translate(-this.camera.x, -this.camera.y);                        // align over camera position

  // Determine the visible rectangle
  var viewRect = surface.getRect();

  // Draw the visible parts of the terrain
  //this.terrain.render(seconds, level, viewRect);

  // Draw the players
  players.sort(byPY).forEach(renderPlayer);

  // Unzoom and untranslate
  surface.pop();

  // Draw the joystick overlay
  //this.joystick.render(seconds, joystick);


  function findAll(name) {
    return _.filter(entities, function hasSystem(entity) {
      return entity.systems.indexOf(name) !== -1;
    });
  }

  function renderPlayer(player) {
    var x = player.px - playerSprite.width * 0.5;
    var y = player.py - playerSprite.height;
    playerSprite.blit(surface, x, y, 0);
  }
};

function byPY(a, b) {
  return a.py - b.py;
}
