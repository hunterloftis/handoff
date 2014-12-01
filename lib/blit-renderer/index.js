var Blit = require('../blit');
var _ = require('lodash');

var Camera = require('./camera');
var Terrain = require('./terrain');
var Joystick = require('./joystick');

module.exports = Renderer;

function Renderer(container) {
  this.resize = _.debounce(this.resize.bind(this), 1000, { leading: true });

  this.camera = new Camera();
  this.surface = new Blit.Surface(container);
  this.terrain = new Terrain(this.surface);
  this.dudeSprite = new Blit.Sprite(this.surface, 56, 65, 'images/character_sprites.png');
  this.shadowSprite = new Blit.Sprite(this.surface, 32, 16);

  this.playerSprite = new Blit.Sprite(this.surface, 56, 65, 'images/hoverboard_sprites.png');
  this.boardSprite = new Blit.Sprite(this.surface, 64, 32);
  this.playerShadowSprite = new Blit.Sprite(this.surface, 64, 32);

  this.joystick = new Joystick(this.surface);

  this.shadowSprite.canvasFrame(0, function drawShadow(ctx, width, height) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    drawEllipse(ctx, 0, 0, width, height);
    ctx.fill();
  });

  this.boardSprite.canvasFrame(0, function drawBoard(ctx, width, height) {
    ctx.fillStyle = 'rgba(180, 180, 180, 1)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 1)';
    ctx.lineWidth = 2;
    drawEllipse(ctx, 0, 0, width, height);
    ctx.fill();
    ctx.stroke();
  });

  this.playerShadowSprite.canvasFrame(0, function drawShadow(ctx, width, height) {
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

Renderer.prototype.resize = function() {
  var dims = this.surface.resize();
  this.scale = 1080 / Math.max(dims.width, dims.height);
};

Renderer.prototype.render = function(seconds, entities) {
  var surface = this.surface;
  var camera = this.camera;
  var dudes = findAll('dude');
  var player = _.find(entities, { id: 'player' });
  var level = _.find(entities, { id: 'level' });
  var joystick = _.find(entities, { id: 'joystick' });

  // Track player with camera
  camera.update(seconds, player);

  // Clear the surface
  surface.clear();

  // Zoom and translate
  surface.push();
  surface.translate(surface.width * 0.5, surface.height * 0.5);             // center
  surface.scale(1 / this.scale, 1 / this.scale);                                            // scale to 1080p
  surface.scale(camera.zoom, camera.zoom);                                          // scale to camera zoom
  surface.translate(-camera.x, -camera.y);                        // align over camera position

  // Determine the visible rectangle
  var viewRect = surface.getRect();

  // Draw the visible parts of the terrain
  this.terrain.render(seconds, level, viewRect);

  // Draw the characters
  dudes.push(player)
  dudes.sort(byPY);
  dudes.forEach(function drawShadow(character) {
    if (character === player) this.renderPlayerShadow(character);
    else this.renderShadow(character);
  }.bind(this));
  dudes.forEach(function drawCharacter(character) {
    if (character === player) this.renderPlayer(character);
    else this.renderDude(character);
  }.bind(this));

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

Renderer.prototype.renderShadow = function(state) {
  var sprite = this.shadowSprite;

  var x = state.px - sprite.width * 0.5 - 3;
  var y = state.py - sprite.height * 0.5 - 5;

  sprite.blit(x, y, 0);
};

Renderer.prototype.renderPlayerShadow = function(state) {
  var sprite = this.playerShadowSprite;
  var surface = this.surface;

  var angle = (Math.atan2(state.vy, state.vx) + Math.PI * 2) % (Math.PI * 2);
  var tilt = state.ax / 50 + state.vx / 1000;
  var boardWidth = Math.max(Math.abs(angle - Math.PI * 0.5), Math.abs(angle - Math.PI * 1.5)) / Math.PI * 0.5 + 0.3;

  surface.push();

  surface.translate(state.px, state.py + 12);
  surface.scale(1.2, boardWidth);
  surface.rotate(angle);
  //surface.rotate(tilt);
  sprite.blit(sprite.width * -0.5, sprite.height * -0.5, 0);

  surface.pop();
};

Renderer.prototype.renderPlayer = function(state) {
  var surface = this.surface;
  var sprite = this.playerSprite;
  var board = this.boardSprite;

  var angle = (Math.atan2(state.vy, state.vx) + Math.PI * 2) % (Math.PI * 2);
  var direction = getDirection(state.vx, state.vy, Math.PI * 0.5);
  var frame = direction - 1;

  var tilt = state.ax / 50 + state.vx / 2000;

  var boardWidth = Math.max(Math.abs(angle - Math.PI * 0.5), Math.abs(angle - Math.PI * 1.5)) / Math.PI * 0.5 + 0.3;

  surface.push();
  surface.translate(state.px, state.py);

  surface.push();
  surface.translate(0, -2);
  surface.scale(1.2, boardWidth);
  surface.rotate(angle);
  surface.rotate(tilt * 2);
  board.blit(board.width * -0.5, board.height * -0.5, 0);
  surface.pop();

  surface.rotate(tilt);
  sprite.blit(sprite.width * -0.5, -sprite.height, frame);

  surface.pop();
};

Renderer.prototype.renderDude = function(state) {
  var sprite = this.dudeSprite;

  var x = state.px - sprite.width * 0.5;
  var y = state.py - sprite.height;

  var direction = getDirection(state.vx, state.vy);
  var pose = state.speed > 5
    ? 8 - Math.floor(state.distance / 10) % 9
    : 8;
  var frame = pose + 9 * (direction - 1);

  sprite.blit(x, y, frame);
};

function getDirection(x, y, offset) {
  offset = offset || 0;
  var angle = (Math.atan2(y, x) + Math.PI * 2 + offset) % (Math.PI * 2);

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
