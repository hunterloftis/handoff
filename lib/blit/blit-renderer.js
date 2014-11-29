function BlitRenderer(container) {
  this.resize = _.debounce(this.resize.bind(this), 1000, { leading: true });

  this.camera = new BlitCamera();
  this.surface = new Blit.Surface(container);
  this.terrain = new BlitTerrain(this.surface);
  this.playerSprite = new Blit.Sprite(this.surface, 56, 65, 'images/character_sprites.png');
  this.shadowSprite = new Blit.Sprite(this.surface, 32, 16);
  this.joystick = new BlitJoystick(this.surface);

  this.shadowSprite.canvasFrame(0, function drawShadow(ctx, width, height) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    drawEllipse(ctx, 0, 0, width, height);
    ctx.fill();
  });

  this.resize();
  window.addEventListener('resize', this.resize);
}

function drawEllipse(ctx, x, y, w, h) {
  var kappa = .5522848,
  ox = (w / 2) * kappa, // control point offset horizontal
  oy = (h / 2) * kappa, // control point offset vertical
  xe = x + w,           // x-end
  ye = y + h,           // y-end
  xm = x + w / 2,       // x-middle
  ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
}

BlitRenderer.prototype.resize = function() {
  var dims = this.surface.resize();
  this.scale = 1080 / Math.max(dims.width, dims.height);
};

BlitRenderer.prototype.render = function(seconds, entities) {
  var surface = this.surface;
  var camera = this.camera;
  var players = findAll('player');
  var level = _.find(entities, { id: 'level' });
  var joystick = _.find(entities, { id: 'joystick' });

  // Track player with camera
  camera.update(seconds, players[0]);

  // Clear the surface
  surface.clear();

  // Zoom and translate
  surface.push();
  surface.translate(surface.width * 0.5, surface.height * 0.5);             // center
  surface.scale(1 / this.scale);                                            // scale to 1080p
  surface.scale(camera.zoom);                                          // scale to camera zoom
  surface.translate(-camera.x, -camera.y);                        // align over camera position

  // Determine the visible rectangle
  var viewRect = surface.getRect();

  // Draw the visible parts of the terrain
  this.terrain.render(seconds, level, viewRect);

  // Draw the players
  players.sort(byPY)
  players.forEach(this.renderShadow.bind(this));
  players.forEach(this.renderPlayer.bind(this));

  // Unzoom and untranslate
  surface.pop();

  // Draw the joystick overlay
  this.joystick.render(seconds, joystick);

  function findAll(name) {
    return _.filter(entities, function hasSystem(entity) {
      return entity.systems.indexOf(name) !== -1;
    });
  }
};

BlitRenderer.prototype.renderShadow = function(player) {
  var sprite = this.shadowSprite;

  var x = player.px - sprite.width * 0.5 - 3;
  var y = player.py - sprite.height * 0.5 - 5;

  sprite.blit(x, y, 0);
};

BlitRenderer.prototype.renderPlayer = function(player) {
  var playerSprite = this.playerSprite;

  var x = player.px - playerSprite.width * 0.5;
  var y = player.py - playerSprite.height;

  var direction = getDirection(player.vx, player.vy);
  var pose = player.speed > 5
    ? 8 - Math.floor(player.distance / 10) % 9
    : 8;
  var frame = pose + 9 * (direction - 1);

  playerSprite.blit(x, y, frame);
};

function getDirection(x, y) {
  var angle = (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2);

  if (between(12.5, 37.5)) return 8;
  else if (between(37.5, 62.5)) return 7;
  else if (between(62.5, 87.5)) return 6;
  else if (between(87.5, 112.5)) return 5;
  else if (between(112.5, 137.5)) return 1;
  else if (between(137.5, 162.5)) return 2;
  else if (between(162.5, 187.5)) return 3;
  else return 4;

  function between(a, b) {
    return angle >= Math.PI * (a / 100) && angle <= Math.PI * (b / 100);
  }
}

function byPY(a, b) {
  return a.py - b.py;
}
