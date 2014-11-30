!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.Handoff=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/hloftis/code/handoff/index.js":[function(require,module,exports){
module.exports = {
  Renderer: require('./lib/blit-renderer'),
  Joystick: require('./lib/touch/joystick'),
  Game: require('./lib/game')
};

},{"./lib/blit-renderer":"/Users/hloftis/code/handoff/lib/blit-renderer/index.js","./lib/game":"/Users/hloftis/code/handoff/lib/game.js","./lib/touch/joystick":"/Users/hloftis/code/handoff/lib/touch/joystick.js"}],"/Users/hloftis/code/handoff/lib/blit-renderer/camera.js":[function(require,module,exports){
module.exports = Camera;

function Camera(container) {
  this.x = 0;
  this.y = 0;

  this.baseZoom = 2;
  this.trail = 0.3;
  this.lift = 50;
  this.zoomOut = 0.002;
  this.drag = 0.1;
  this.projection = 0.67;
  this.offsetX = 0;
  this.offsetY = 0;

  this.zoom = 1;
  this.targetX = 0;
  this.targetY = 0;
  this.lastTargetX = 0;
  this.lastTargetY = 0;
}

Camera.prototype.leadTarget = function(seconds, target) {
  var projectedX = target.px + target.vx * this.projection;
  var projectedY = target.py + target.vy * this.projection;
  var dx = projectedX - this.targetX;
  var dy = projectedY - this.targetY - this.lift;
  var wantedZoom = this.baseZoom / (target.speed * this.zoomOut + 1);
  var dZoom = wantedZoom - this.zoom;
  var correction = Math.min(seconds / this.trail, 1);

  this.zoom += dZoom * correction;
  this.targetX += dx * correction;
  this.targetY += dy * correction;
};

Camera.prototype.update = function(seconds, target) {
  this.leadTarget(seconds, target);

  var efficiency = 1 - this.drag;
  var vx = (this.targetX - this.lastTargetX) * efficiency;
  var vy = (this.targetY - this.lastTargetY) * efficiency;

  this.targetX += vx * seconds;
  this.targetY += vy * seconds;
  this.lastTargetX = this.targetX;
  this.lastTargetY = this.targetY;

  this.x = this.targetX - this.offsetX;
  this.y = this.targetY - this.offsetY;
};

},{}],"/Users/hloftis/code/handoff/lib/blit-renderer/index.js":[function(require,module,exports){
var Blit = require('../blit');

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
  this.joystick = new Joystick(this.surface);

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
  surface.scale(1 / this.scale);                                            // scale to 1080p
  surface.scale(camera.zoom);                                          // scale to camera zoom
  surface.translate(-camera.x, -camera.y);                        // align over camera position

  // Determine the visible rectangle
  var viewRect = surface.getRect();

  // Draw the visible parts of the terrain
  this.terrain.render(seconds, level, viewRect);

  // Draw the characters
  dudes.push(player)
  dudes.sort(byPY);
  dudes.forEach(function drawShadow(character) {
    if (character === player) return;
    this.renderShadow(character);
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

Renderer.prototype.renderPlayer = function(state) {
  var sprite = this.playerSprite;

  var x = state.px - sprite.width * 0.5;
  var y = state.py - sprite.height;

  var direction = getDirection(state.vx, state.vy, Math.PI * 0.5);
  var frame = direction - 1;

  sprite.blit(x, y, frame);
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

},{"../blit":"/Users/hloftis/code/handoff/lib/blit/index.js","./camera":"/Users/hloftis/code/handoff/lib/blit-renderer/camera.js","./joystick":"/Users/hloftis/code/handoff/lib/blit-renderer/joystick.js","./terrain":"/Users/hloftis/code/handoff/lib/blit-renderer/terrain.js"}],"/Users/hloftis/code/handoff/lib/blit-renderer/joystick.js":[function(require,module,exports){
var Blit = require('../blit');

module.exports = Joystick;

function Joystick(surface) {
  this.surface = surface;
  this.radius = 0;
  this.sprite = undefined;
}

Joystick.prototype.render = function(seconds, joystick) {
  if (joystick.radius !== this.radius) {
    this.sprite = undefined;
    this.radius = joystick.radius;
  }
  if (!this.sprite) {
    this.sprite = this.generateSprite(this.radius);
  }
  this.sprite.blit(joystick.x - this.sprite.width * 0.5, joystick.y - this.sprite.height * 0.5);
};

Joystick.prototype.generateSprite = function(radius) {
  var size = radius * 2;
  var sprite = new Blit.Sprite(this.surface, size, size);
  sprite.canvasFrame(0, function drawCircle(ctx, width, height) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.arc(width * 0.5, height * 0.5, width * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  return sprite;
}

},{"../blit":"/Users/hloftis/code/handoff/lib/blit/index.js"}],"/Users/hloftis/code/handoff/lib/blit-renderer/terrain.js":[function(require,module,exports){
var Blit = require('../blit');

module.exports = Terrain;

function Terrain(surface) {
  this.surface = surface;
  this.sprite = new Blit.Sprite(this.surface, 128, 128, 'images/dirt.jpg');
}

Terrain.prototype.render = function(seconds, map, rect) {
  var width = this.sprite.width;
  var height = this.sprite.height;

  var ox = Math.floor(rect.left / width) * width;
  var oy = Math.floor(rect.top / height) * height;

  for (var y = oy; y < rect.bottom; y += width) {
    for (var x = ox; x < rect.right; x += height) {
      this.sprite.blit(x, y, 0);
    }
  }
};

},{"../blit":"/Users/hloftis/code/handoff/lib/blit/index.js"}],"/Users/hloftis/code/handoff/lib/blit/index.js":[function(require,module,exports){
module.exports = {
  Surface: require('./surface'),
  Sprite: require('./sprite')
};

},{"./sprite":"/Users/hloftis/code/handoff/lib/blit/sprite.js","./surface":"/Users/hloftis/code/handoff/lib/blit/surface.js"}],"/Users/hloftis/code/handoff/lib/blit/sprite.js":[function(require,module,exports){
var WebGL = require('./web-gl');

module.exports = Sprite;

function Sprite(surface, width, height, url) {
  this.surface = surface;
  this.textures = [];       // TODO: instead of an array, store as a large texture and select frames with UV coords
  this.width = width;
  this.height = height;
  this.image = new Image();

  // Buffers
  this.vertexBuffer = surface.gl.createBuffer();
  this.textureBuffer = surface.gl.createBuffer();

  // Texture coords
  this.textureCoords = new Float32Array([
    0.0, 0.0,
    1.0, 0.0,
    0.0, 1.0,
    0.0, 1.0,
    1.0, 0.0,
    1.0, 1.0
  ]);

  this.image.onload = this._onLoad.bind(this);
  if (url) this.loadUrl(url);
}

// TODO: allow you to render on a non-power-of-two and then convert to a power-of-two
Sprite.prototype.canvasFrame = function(frame, drawFn) {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var size = WebGL.nextPowerOfTwo(Math.max(this.width, this.height));

  canvas.width = size;
  canvas.height = size;

  drawFn(ctx, canvas.width, canvas.height);

  this._createTexture(canvas, frame);
};

Sprite.prototype.loadUrl = function(url) {
  this.image.src = url;
};

Sprite.prototype._onLoad = function() {
  var gl = this.surface.gl;
  var image = this.image;

  // Create a square power-of-two canvas to resize the texture onto
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('2d');
  var size = WebGL.nextPowerOfTwo(Math.max(this.width, this.height));
  canvas.width = size;
  canvas.height = size;

  // Loop through each frame in the image
  for (var y = 0; y < image.height; y += this.height) {
    for (var x = 0; x < image.width; x += this.width) {
      ctx.clearRect(0, 0, size, size);
      ctx.drawImage(image, x, y, this.width, this.height, 0, 0, size, size);
      this._createTexture(canvas);
    }
  }
};

Sprite.prototype._createTexture = function(canvas, index) {
  var gl = this.surface.gl;
  var texture = gl.createTexture();

  index = index || this.textures.length;

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);

  // Setup scaling properties (only works with power-of-2 textures)
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  // gl.generateMipmap(gl.TEXTURE_2D);

  // Makes non-power-of-2 textures ok:
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); //gl.NEAREST is also allowed, instead of gl.LINEAR, as neither mipmap.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating).
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating).

  // Unbind the texture
  gl.bindTexture(gl.TEXTURE_2D, null);

  // Store the texture
  this.textures[index] = texture;
};

Sprite.prototype.blit = function(x, y, frame) {
  frame = frame || 0;

  if (!this.textures[frame]) return;

  var surface = this.surface;
  var gl = surface.gl;
  var vertexPosition = surface.locations.position;
  var vertexTexture = surface.locations.texture;
  var matrixLocation = surface.locations.matrix;
  var matrix = surface.getMatrix();

  // Bind the vertex buffer as the current buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

  // Fill it with the vertex data
  var x1 = x;
  var x2 = x + this.width;
  var y1 = y;
  var y2 = y + this.height;
  var vertices = new Float32Array([
    x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Connect vertex buffer to shader's vertex position attribute
  gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);

  // Bind the shader buffer as the current buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, this.textureBuffer);

  // Fill it with the texture data
  gl.bufferData(gl.ARRAY_BUFFER, this.textureCoords, gl.STATIC_DRAW);

  // Connect texture buffer to shader's texture attribute
  gl.vertexAttribPointer(vertexTexture, 2, gl.FLOAT, false, 0, 0);

  // Set slot 0 as active texture
  //gl.activeTexture(this.GL.TEXTURE0); // TODO: necessary?
  //gl.activeTexture(gl['TEXTURE' + frame]);

  // Load texture into memory
  gl.bindTexture(gl.TEXTURE_2D, this.textures[frame]);

  // Apply the transformation matrix
  gl.uniformMatrix3fv(matrixLocation, false, matrix);

  // Draw triangles that make up a rectangle
  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // Unbind everything
  gl.bindBuffer(gl.ARRAY_BUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
};

},{"./web-gl":"/Users/hloftis/code/handoff/lib/blit/web-gl.js"}],"/Users/hloftis/code/handoff/lib/blit/surface.js":[function(require,module,exports){
var mat3 = require('gl-matrix-mat3');
var vec2 = require('gl-matrix-vec2');

var WebGL = require('./web-gl');

module.exports = Surface;

function Surface(canvas) {
  this.canvas = canvas;
  this.matrixStack = [ mat3.create() ];
  this.width = 0;
  this.height = 0;

  this.gl = WebGL.getGLContext(canvas, { alpha: false, premultipliedAlpha: false });
  this.locations = WebGL.initGL(this.gl, this.width, this.height);
  this.resize();
}

Surface.prototype.resize = function() {
  var width = this.canvas.clientWidth;
  var height = this.canvas.clientHeight;

  this.width = this.canvas.width = width;
  this.height = this.canvas.height = height;
  this.gl.viewport(0, 0, width, height);
  this.gl.uniform2f(this.locations.resolution, width, height);

  return {
    width: width,
    height: height
  };
};

Surface.prototype.clear = function(color) {
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);
};

Surface.prototype.push = function() {
  this.matrixStack.push( mat3.clone(this.getMatrix()) );
};

Surface.prototype.pop = function() {
  return this.matrixStack.pop();
};

Surface.prototype.getMatrix = function() {
  return this.matrixStack[this.matrixStack.length - 1];
};

Surface.prototype.translate = function(tx, ty) {
  var m = this.getMatrix();
  var v = vec2.set(vec2.create(), tx, ty);
  mat3.translate(m, m, v);
};

Surface.prototype.scale = function(scale) {
  var m = this.getMatrix();
  var v = vec2.set(vec2.create(), scale, scale);
  mat3.scale(m, m, v);
};

Surface.prototype.getRect = function() {
  var m = mat3.clone(this.getMatrix());
  var ul = vec2.set(vec2.create(), 0, 0);
  var lr = vec2.set(vec2.create(), this.width, this.height);
  mat3.invert(m, m);
  vec2.transformMat3(ul, ul, m);
  vec2.transformMat3(lr, lr, m);
  return {
    left: ul[0],
    top: ul[1],
    right: lr[0],
    bottom: lr[1]
  };
};

},{"./web-gl":"/Users/hloftis/code/handoff/lib/blit/web-gl.js","gl-matrix-mat3":"/Users/hloftis/code/handoff/node_modules/gl-matrix-mat3/index.js","gl-matrix-vec2":"/Users/hloftis/code/handoff/node_modules/gl-matrix-vec2/index.js"}],"/Users/hloftis/code/handoff/lib/blit/web-gl.js":[function(require,module,exports){
var VERTEX_SHADER = [
  'attribute vec2 a_position;',
  'attribute vec2 a_texture;',
  'varying vec2 v_texture;',
  'uniform vec2 u_resolution;',
  'uniform mat3 u_matrix;',

  'void main() {',

  // apply the transformation matrix
  'vec2 position = (u_matrix * vec3(a_position, 1)).xy;',

  // convert the rectangle from pixels to 0.0 to 1.0
  'vec2 zeroToOne = position / u_resolution;',

  // convert from 0->1 to 0->2
  'vec2 zeroToTwo = zeroToOne * 2.0;',

  // convert from 0->2 to -1->+1 (clipspace)
  'vec2 clipSpace = zeroToTwo - 1.0;',

  // invert y axis and assign position
  'gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);',

  // pass the texture coordinate to the fragment shader
  'v_texture = a_texture;',
  '}'
].join('\n');

var FRAGMENT_SHADER = [
  'precision mediump float;',
  'uniform sampler2D u_image;',   // the texture
  'varying vec2 v_texture;',      // the texture coords passed in from the vertex shader

  'void main(void) {',
  'gl_FragColor = texture2D(u_image, v_texture);',
  '}'
].join('\n');

module.exports = {
  initGL: initGL,
  getGLContext: getGLContext,
  nextPowerOfTwo: nextPowerOfTwo
};

function initGL(gl, width, height) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.depthFunc(gl.LEQUAL);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.CULL_FACE);
  gl.enable(gl.BLEND);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Load and compile fragment shader
  var fShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fShader, FRAGMENT_SHADER);
  gl.compileShader(fShader);
  var compiled = gl.getShaderParameter(fShader, gl.COMPILE_STATUS);
  if (!compiled) {
    throw new Error('fragment shader error: ' + gl.getShaderInfoLog(fShader));
  }

  // Load and compile vertex shader
  var vShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vShader, VERTEX_SHADER);
  gl.compileShader(vShader);
  var compiled = gl.getShaderParameter(vShader, gl.COMPILE_STATUS);
  if (!compiled) {
    throw new Error('vertex shader error: ' + gl.getShaderInfoLog(vShader));
  }

  // Create the shader program
  var program = gl.createProgram();
  gl.attachShader(program, fShader);
  gl.attachShader(program, vShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  // Link vertex position attribute from shader
  var vertexPosition = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(vertexPosition);

  // Link texture coordinate attribute from shader
  var vertexTexture = gl.getAttribLocation(program, "a_texture");
  gl.enableVertexAttribArray(vertexTexture);

  // Provide the resolution location
  var resolutionLocation = gl.getUniformLocation(program, 'u_resolution');

  // Provide the transformation matrix
  var transformationMatrix = gl.getUniformLocation(program, 'u_matrix');

  return {
    position: vertexPosition,
    texture: vertexTexture,
    resolution: resolutionLocation,
    matrix: transformationMatrix
  };
}

function getGLContext(canvas, opts) {
  return canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
}

function nextPowerOfTwo(n) {
  var i = Math.floor(n / 2);
  while (i < n) i *= 2;
  return i;
}

},{}],"/Users/hloftis/code/handoff/lib/esystem/entity.js":[function(require,module,exports){
module.exports = Entity;

function Entity(id, group) {
  this.id = id;
  this.group = group;
  this.systems = [];
  this.state = { id: id, systems: [] };
}

Entity.prototype.add = function(systemName, overrides) {
  var system = this.group.getSystem(systemName);
  system.register(this);
  system.setInitialState(this.state, overrides);
  this.systems.push(system);
  this.state.systems.push(systemName);
  return this;
};

Entity.prototype.getState = function() {
  var state = this.state;
  this.systems.forEach(getSystemState);
  return this.state;

  function getSystemState(system) {
    if (system.definition.getState) {
      var systemState = system.definition.getState.call(state);
      _.extend(state, systemState);
    }
  }
};

},{}],"/Users/hloftis/code/handoff/lib/esystem/group.js":[function(require,module,exports){
var Entity = require('./entity');
var System = require('./system');

module.exports = Group;

function Group(definitions) {
  this.entities = [];
  this.systems = Object.keys(definitions).reduce(toObject, {});

  function toObject(obj, key) {
    var name = definitions[key].name;
    var def = definitions[key];
    obj[name] = new System(def);
    return obj;
  }
}

Group.prototype.create = function(id) {
  var entity = new Entity(id, this);
  this.entities.push(entity);
  return entity;
};

Group.prototype.getSystem = function(name) {
  return this.systems[name];
};

Group.prototype.update = function(name) {
  var system = this.systems[name];
  var args = Array.prototype.slice.call(arguments, 1);

  if (!system) throw new Error('No such system: ' + name);

  system.update(args);
};

Group.prototype.getState = function() {
  return this.entities.map(getEntityState);

  function getEntityState(entity) {
    return entity.getState();
  }
};

},{"./entity":"/Users/hloftis/code/handoff/lib/esystem/entity.js","./system":"/Users/hloftis/code/handoff/lib/esystem/system.js"}],"/Users/hloftis/code/handoff/lib/esystem/index.js":[function(require,module,exports){
module.exports = {
  Entity: require('./entity'),
  EntityGroup: require('./group'),
  EntitySystem: require('./system')
};

},{"./entity":"/Users/hloftis/code/handoff/lib/esystem/entity.js","./group":"/Users/hloftis/code/handoff/lib/esystem/group.js","./system":"/Users/hloftis/code/handoff/lib/esystem/system.js"}],"/Users/hloftis/code/handoff/lib/esystem/system.js":[function(require,module,exports){
module.exports = System;

function System(definition) {
  this.name = definition.name;
  this.definition = definition;
  this.members = [];
}

System.prototype.register = function(entity) {
  this.members.push(entity);
};

System.prototype.setInitialState = function(obj, overrides) {
  var setter = this.definition.setState;
  if (setter) overrides = setter(overrides);
  _.extend(obj, _.cloneDeep(this.definition.props), overrides);
};

System.prototype.update = function(args) {
  var update = this.definition.update;
  this.members.forEach(updateMember);

  function updateMember(entity) {
    update.apply(entity.state, args);
  }
};

System.prototype.getState = function(entity) {
  return this.definition.getState.call(entity.state);
};

},{}],"/Users/hloftis/code/handoff/lib/game.js":[function(require,module,exports){
var Loop = require('./loop/loop');
var EntityGroup = require('./esystem').EntityGroup;

var SYSTEMS = [
  require('./systems/position'),
  require('./systems/walking'),
  require('./systems/controllable'),
  require('./systems/wandering'),
  require('./systems/player'),
  require('./systems/level'),
  require('./systems/joystick'),
  require('./systems/dude')
];

module.exports = Game;

function Game(renderer, joystick, raf) {
  this.renderer = renderer;
  this.joystick = joystick;
  this.loop = new Loop(raf || requestAnimationFrame, 180);

  this.entities = new EntityGroup(SYSTEMS);

  this.entities.create('player')
    .add('position')
    .add('walking')
    .add('controllable')
    .add('player');

  var i = 50;
  while (i-- > 0) {
    this.entities.create()    // Will automatically generate an ID for you if not specified
      .add('position', { x: Math.random() * 500 - 250, y: Math.random() * 500 - 250 })
      .add('walking', { maxSpeed: 150 })
      .add('wandering')
      .add('dude');
  }

  this.entities.create('level')
    .add('level');

  this.entities.create('joystick')
    .add('joystick');
}

Game.prototype.start = function() {
  var entities = this.entities;
  var joystick = this.joystick;
  var renderer = this.renderer;

  this.loop.start(simulate.bind(this), render.bind(this));

  function simulate(seconds) {
    entities.update('controllable', seconds, joystick.getXY());
    entities.update('wandering', seconds);
    entities.update('walking', seconds);
    entities.update('joystick', seconds, joystick.getState());
  }

  function render(seconds) {
    renderer.render(seconds, entities.getState());
  }
};

},{"./esystem":"/Users/hloftis/code/handoff/lib/esystem/index.js","./loop/loop":"/Users/hloftis/code/handoff/lib/loop/loop.js","./systems/controllable":"/Users/hloftis/code/handoff/lib/systems/controllable.js","./systems/dude":"/Users/hloftis/code/handoff/lib/systems/dude.js","./systems/joystick":"/Users/hloftis/code/handoff/lib/systems/joystick.js","./systems/level":"/Users/hloftis/code/handoff/lib/systems/level.js","./systems/player":"/Users/hloftis/code/handoff/lib/systems/player.js","./systems/position":"/Users/hloftis/code/handoff/lib/systems/position.js","./systems/walking":"/Users/hloftis/code/handoff/lib/systems/walking.js","./systems/wandering":"/Users/hloftis/code/handoff/lib/systems/wandering.js"}],"/Users/hloftis/code/handoff/lib/loop/loop.js":[function(require,module,exports){
module.exports = Loop;

function Loop(requestAnimationFrame, fps) {
  this.raf = requestAnimationFrame;
  this.fps = fps;
  this.simTicks = 1000 / fps;
}

Loop.prototype.start = function(simulateFn, renderFn) {
  var timeBuffer = 0;
  var lastTime = 0;
  var simTicks = this.simTicks;
  var simSeconds = simTicks / 1000;
  var requestAnimationFrame = this.raf;

  var perfNow = window.performance && window.performance.now
    ? window.performance.now.bind(window.performance)
    : Date.now.bind(Date);

  requestAnimationFrame(frame);

  function frame() {
    var now = perfNow();
    var ticks = now - lastTime;

    if (ticks > 100) ticks = 0;
    timeBuffer += ticks;

    if (timeBuffer >= simTicks) {
      while (timeBuffer >= simTicks) {
        simulateFn(simSeconds);
        timeBuffer -= simTicks;
      }
      renderFn(ticks / 1000);
    }

    lastTime = now;
    requestAnimationFrame(frame);
  }
};

},{}],"/Users/hloftis/code/handoff/lib/systems/controllable.js":[function(require,module,exports){
module.exports = {
  name: 'controllable',
  props: {
    dirX: 0,
    dirY: 0
  },
  update: function(seconds, joystick) {
    this.dirX = joystick.x;
    this.dirY = joystick.y;
  }
};

},{}],"/Users/hloftis/code/handoff/lib/systems/dude.js":[function(require,module,exports){
module.exports = {
  name: 'dude'
};

},{}],"/Users/hloftis/code/handoff/lib/systems/joystick.js":[function(require,module,exports){
module.exports = {
  name: 'joystick',
  props: {
    x: 0,
    y: 0,
    radius: 0
  },
  update: function(seconds, joystick) {
    this.x = joystick.x;
    this.y = joystick.y;
    this.radius = joystick.radius;
  }
};

},{}],"/Users/hloftis/code/handoff/lib/systems/level.js":[function(require,module,exports){
module.exports = {
  name: 'level',
  props: {
    mapWidth: 100,
    mapHeight: 100
  }
};

},{}],"/Users/hloftis/code/handoff/lib/systems/player.js":[function(require,module,exports){
module.exports = {
  name: 'player'
};

},{}],"/Users/hloftis/code/handoff/lib/systems/position.js":[function(require,module,exports){
module.exports = {
  name: 'position',
  props: {
    x: [0, 0, 0],
    y: [0, 0, 0],
    interval: [1, 1, 1],
    moveTo: function(x, y, seconds) {
      this.x.unshift(x);
      this.x.pop();

      this.y.unshift(y);
      this.y.pop();

      this.interval.unshift(seconds);
      this.interval.pop();
    }
  },
  setState: function(props) {
    if (!props) return;

    var x = props.x;
    var y = props.y;
    return {
      x: [x, x, x],
      y: [y, y, y]
    };
  },
  getState: function() {
    var vx0 = (this.x[0] - this.x[1]) / this.interval[1];
    var vx1 = (this.x[1] - this.x[2]) / this.interval[2];

    var vy0 = (this.y[0] - this.y[1]) / this.interval[1];
    var vy1 = (this.y[1] - this.y[2]) / this.interval[2];

    return {
      px: this.x[0],
      py: this.y[0],
      vx: vx0,
      vy: vy0,
      ax: vx0 - vx1,
      ay: vy0 - vy1,
      speed: Math.sqrt(vx0 * vx0 + vy0 * vy0)
    };
  }
};

},{}],"/Users/hloftis/code/handoff/lib/systems/walking.js":[function(require,module,exports){
module.exports = {
  name: 'walking',
  props: {
    power: 13,
    maxSpeed: 220,
    slowDown: 0.96,
    distance: 0
  },
  update: function(seconds) {
    var dirX = this.dirX || 0;
    var dirY = this.dirY || 0;

    var impulseX = this.power * dirX;
    var impulseY = this.power * dirY;

    var vx = (this.x[0] - this.x[1]) / this.interval[1];
    var vy = (this.y[0] - this.y[1]) / this.interval[1];

    var dx = vx * this.slowDown + impulseX;
    var dy = vy * this.slowDown + impulseY;
    var speed = Math.sqrt(dx * dx + dy * dy);

    if (speed > this.maxSpeed) {
      dx *= this.maxSpeed / speed;
      dy *= this.maxSpeed / speed;
    }

    var newX = this.x[0] + dx * seconds;
    var newY = this.y[0] + dy * seconds;

    this.distance += speed * seconds;
    this.moveTo(newX, newY, seconds);
  }
};

},{}],"/Users/hloftis/code/handoff/lib/systems/wandering.js":[function(require,module,exports){
module.exports = {
  name: 'wandering',
  props: {
    goalX: 0,
    goalY: 0
  },
  update: function(seconds) {
    var x = this.x[0];
    var y = this.y[0];

    var dx = this.goalX - x;
    var dy = this.goalY - y;

    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      this.goalX = x + Math.random() * 300 - 150;
      this.goalY = y + Math.random() * 300 - 150;
      return;
    }

    var distance = Math.sqrt(dx * dx + dy * dy);
    var ratio = 1 / distance;

    this.dirX = dx * ratio;
    this.dirY = dy * ratio;
  }
};

},{}],"/Users/hloftis/code/handoff/lib/touch/joystick.js":[function(require,module,exports){
HANDJS.doNotProcessCSS = true;

module.exports = Joystick;

function Joystick(container) {
  this.resize = _.debounce(this.resize.bind(this), 500, { leading: true });

  this.container = container;
  this.deadzone = 0.1;
  this.resize();

  container.addEventListener('pointerdown', this.onDown.bind(this), false);
  container.addEventListener('pointermove', this.onMove.bind(this), false);
  container.addEventListener('pointerup', this.onCancel.bind(this), false);
  container.addEventListener('pointerout', this.onCancel.bind(this), false);

  window.addEventListener('resize', this.resize);
}

Joystick.prototype.resize = function() {
  var width = this.width = this.container.clientWidth;
  var height = this.height = this.container.clientHeight
  var portrait = width < height;
  var margin = 32;

  this.radius = Math.min(100, (portrait ? width : height) * 0.3);
  this.cx = portrait ? width * 0.5 : margin + this.radius;
  this.cy = portrait ? height - margin - this.radius : height * 0.5;
  this.angle = 0;
  this.magnitude = 0;
  this.current = undefined;
};

Joystick.prototype.onDown = function(e) {
  if (this.current) return;

  var pointer = this.pointerFromEvent(e);

  var dx = pointer.x - this.cx;
  var dy = pointer.y - this.cy;
  var distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > this.radius) return;

  e.preventDefault();
  this.updatePointer(pointer);
};

Joystick.prototype.onMove = function(e) {
  if (!this.current) return;

  var pointer = this.pointerFromEvent(e);

  if (pointer.id !== this.current.id) return;

  e.preventDefault();
  this.updatePointer(pointer);
};

Joystick.prototype.onCancel = function(e) {
  if (!this.current) return;
  if (this.pointerFromEvent(e).id === this.current.id) {
    e.preventDefault();
    this.clearPointer();
  }
};

Joystick.prototype.updatePointer = function(pointer) {
  var dx = pointer.x - this.cx;
  var dy = pointer.y - this.cy;
  var distance = Math.sqrt(dx * dx + dy * dy);

  this.angle = Math.atan2(dy, dx);
  this.magnitude = Math.min(1, distance / this.radius);
  this.current = pointer;
};

Joystick.prototype.clearPointer = function() {
  this.current = undefined;
  this.angle = 0;
  this.magnitude = 0;
};

Joystick.prototype.getState = function() {
  return {
    x: this.cx,
    y: this.cy,
    radius: this.radius
  };
}

Joystick.prototype.getXY = function() {
  var magnitude = this.magnitude > this.deadzone ? this.magnitude : 0;
  return {
    x: Math.cos(this.angle) * magnitude,
    y: Math.sin(this.angle) * magnitude
  };
};

Joystick.prototype.pointerFromEvent = function(event) {
  return {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY
  };
};

},{}],"/Users/hloftis/code/handoff/node_modules/gl-matrix-mat3/index.js":[function(require,module,exports){
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 3x3 Matrix
 * @name mat3
 */
var mat3 = {};

var GLMAT_ARRAY_TYPE = require('common').GLMAT_ARRAY_TYPE;

/**
 * Creates a new identity mat3
 *
 * @returns {mat3} a new 3x3 matrix
 */
mat3.create = function() {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Copies the upper-left 3x3 values into the given mat3.
 *
 * @param {mat3} out the receiving 3x3 matrix
 * @param {mat4} a   the source 4x4 matrix
 * @returns {mat3} out
 */
mat3.fromMat4 = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
};

/**
 * Creates a new mat3 initialized with values from an existing matrix
 *
 * @param {mat3} a matrix to clone
 * @returns {mat3} a new 3x3 matrix
 */
mat3.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(9);
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copy the values from one mat3 to another
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[3];
    out[4] = a[4];
    out[5] = a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Set a mat3 to the identity matrix
 *
 * @param {mat3} out the receiving matrix
 * @returns {mat3} out
 */
mat3.identity = function(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 1;
    out[5] = 0;
    out[6] = 0;
    out[7] = 0;
    out[8] = 1;
    return out;
};

/**
 * Transpose the values of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.transpose = function(out, a) {
    // If we are transposing ourselves we can skip a few steps but have to cache some values
    if (out === a) {
        var a01 = a[1], a02 = a[2], a12 = a[5];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a01;
        out[5] = a[7];
        out[6] = a02;
        out[7] = a12;
    } else {
        out[0] = a[0];
        out[1] = a[3];
        out[2] = a[6];
        out[3] = a[1];
        out[4] = a[4];
        out[5] = a[7];
        out[6] = a[2];
        out[7] = a[5];
        out[8] = a[8];
    }
    
    return out;
};

/**
 * Inverts a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.invert = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b01 = a22 * a11 - a12 * a21,
        b11 = -a22 * a10 + a12 * a20,
        b21 = a21 * a10 - a11 * a20,

        // Calculate the determinant
        det = a00 * b01 + a01 * b11 + a02 * b21;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = b01 * det;
    out[1] = (-a22 * a01 + a02 * a21) * det;
    out[2] = (a12 * a01 - a02 * a11) * det;
    out[3] = b11 * det;
    out[4] = (a22 * a00 - a02 * a20) * det;
    out[5] = (-a12 * a00 + a02 * a10) * det;
    out[6] = b21 * det;
    out[7] = (-a21 * a00 + a01 * a20) * det;
    out[8] = (a11 * a00 - a01 * a10) * det;
    return out;
};

/**
 * Calculates the adjugate of a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the source matrix
 * @returns {mat3} out
 */
mat3.adjoint = function(out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    out[0] = (a11 * a22 - a12 * a21);
    out[1] = (a02 * a21 - a01 * a22);
    out[2] = (a01 * a12 - a02 * a11);
    out[3] = (a12 * a20 - a10 * a22);
    out[4] = (a00 * a22 - a02 * a20);
    out[5] = (a02 * a10 - a00 * a12);
    out[6] = (a10 * a21 - a11 * a20);
    out[7] = (a01 * a20 - a00 * a21);
    out[8] = (a00 * a11 - a01 * a10);
    return out;
};

/**
 * Calculates the determinant of a mat3
 *
 * @param {mat3} a the source matrix
 * @returns {Number} determinant of a
 */
mat3.determinant = function (a) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8];

    return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
};

/**
 * Multiplies two mat3's
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the first operand
 * @param {mat3} b the second operand
 * @returns {mat3} out
 */
mat3.multiply = function (out, a, b) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        b00 = b[0], b01 = b[1], b02 = b[2],
        b10 = b[3], b11 = b[4], b12 = b[5],
        b20 = b[6], b21 = b[7], b22 = b[8];

    out[0] = b00 * a00 + b01 * a10 + b02 * a20;
    out[1] = b00 * a01 + b01 * a11 + b02 * a21;
    out[2] = b00 * a02 + b01 * a12 + b02 * a22;

    out[3] = b10 * a00 + b11 * a10 + b12 * a20;
    out[4] = b10 * a01 + b11 * a11 + b12 * a21;
    out[5] = b10 * a02 + b11 * a12 + b12 * a22;

    out[6] = b20 * a00 + b21 * a10 + b22 * a20;
    out[7] = b20 * a01 + b21 * a11 + b22 * a21;
    out[8] = b20 * a02 + b21 * a12 + b22 * a22;
    return out;
};

/**
 * Alias for {@link mat3.multiply}
 * @function
 */
mat3.mul = mat3.multiply;

/**
 * Translate a mat3 by the given vector
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to translate
 * @param {vec2} v vector to translate by
 * @returns {mat3} out
 */
mat3.translate = function(out, a, v) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],
        x = v[0], y = v[1];

    out[0] = a00;
    out[1] = a01;
    out[2] = a02;

    out[3] = a10;
    out[4] = a11;
    out[5] = a12;

    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
};

/**
 * Rotates a mat3 by the given angle
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {Number} rad the angle to rotate the matrix by
 * @returns {mat3} out
 */
mat3.rotate = function (out, a, rad) {
    var a00 = a[0], a01 = a[1], a02 = a[2],
        a10 = a[3], a11 = a[4], a12 = a[5],
        a20 = a[6], a21 = a[7], a22 = a[8],

        s = Math.sin(rad),
        c = Math.cos(rad);

    out[0] = c * a00 + s * a10;
    out[1] = c * a01 + s * a11;
    out[2] = c * a02 + s * a12;

    out[3] = c * a10 - s * a00;
    out[4] = c * a11 - s * a01;
    out[5] = c * a12 - s * a02;

    out[6] = a20;
    out[7] = a21;
    out[8] = a22;
    return out;
};

/**
 * Scales the mat3 by the dimensions in the given vec2
 *
 * @param {mat3} out the receiving matrix
 * @param {mat3} a the matrix to rotate
 * @param {vec2} v the vec2 to scale the matrix by
 * @returns {mat3} out
 **/
mat3.scale = function(out, a, v) {
    var x = v[0], y = v[1];

    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];

    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];

    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
};

/**
 * Copies the values from a mat2d into a mat3
 *
 * @param {mat3} out the receiving matrix
 * @param {mat2d} a the matrix to copy
 * @returns {mat3} out
 **/
mat3.fromMat2d = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = 0;

    out[3] = a[2];
    out[4] = a[3];
    out[5] = 0;

    out[6] = a[4];
    out[7] = a[5];
    out[8] = 1;
    return out;
};

/**
* Calculates a 3x3 matrix from the given quaternion
*
* @param {mat3} out mat3 receiving operation result
* @param {quat} q Quaternion to create matrix from
*
* @returns {mat3} out
*/
mat3.fromQuat = function (out, q) {
    var x = q[0], y = q[1], z = q[2], w = q[3],
        x2 = x + x,
        y2 = y + y,
        z2 = z + z,

        xx = x * x2,
        yx = y * x2,
        yy = y * y2,
        zx = z * x2,
        zy = z * y2,
        zz = z * z2,
        wx = w * x2,
        wy = w * y2,
        wz = w * z2;

    out[0] = 1 - yy - zz;
    out[3] = yx - wz;
    out[6] = zx + wy;

    out[1] = yx + wz;
    out[4] = 1 - xx - zz;
    out[7] = zy - wx;

    out[2] = zx - wy;
    out[5] = zy + wx;
    out[8] = 1 - xx - yy;

    return out;
};

/**
* Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
*
* @param {mat3} out mat3 receiving operation result
* @param {mat4} a Mat4 to derive the normal matrix from
*
* @returns {mat3} out
*/
mat3.normalFromMat4 = function (out, a) {
    var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
        a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
        a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
        a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        // Calculate the determinant
        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) { 
        return null; 
    }
    det = 1.0 / det;

    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

    out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

    out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

    return out;
};

/**
 * Returns a string representation of a mat3
 *
 * @param {mat3} mat matrix to represent as a string
 * @returns {String} string representation of the matrix
 */
mat3.str = function (a) {
    return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + 
                    a[3] + ', ' + a[4] + ', ' + a[5] + ', ' + 
                    a[6] + ', ' + a[7] + ', ' + a[8] + ')';
};

/**
 * Returns Frobenius norm of a mat3
 *
 * @param {mat3} a the matrix to calculate Frobenius norm of
 * @returns {Number} Frobenius norm
 */
mat3.frob = function (a) {
    return(Math.sqrt(Math.pow(a[0], 2) + Math.pow(a[1], 2) + Math.pow(a[2], 2) + Math.pow(a[3], 2) + Math.pow(a[4], 2) + Math.pow(a[5], 2) + Math.pow(a[6], 2) + Math.pow(a[7], 2) + Math.pow(a[8], 2)))
};

module.exports = mat3;
},{"common":"/Users/hloftis/code/handoff/node_modules/gl-matrix-mat3/node_modules/gl-matrix-common/index.js"}],"/Users/hloftis/code/handoff/node_modules/gl-matrix-mat3/node_modules/gl-matrix-common/index.js":[function(require,module,exports){
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

if(!GLMAT_EPSILON) {
    var GLMAT_EPSILON = 0.000001;
}

if(!GLMAT_ARRAY_TYPE) {
    var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
}

if(!GLMAT_RANDOM) {
    var GLMAT_RANDOM = Math.random;
}

/**
 * @class Common utilities
 * @name glMatrix
 */
var glMatrix = {};

/**
 * Sets the type of array used when creating new vectors and matricies
 *
 * @param {Type} type Array type, such as Float32Array or Array
 */
glMatrix.setMatrixArrayType = function(type) {
    GLMAT_ARRAY_TYPE = type;
}


var degree = Math.PI / 180;

/**
* Convert Degree To Radian
*
* @param {Number} Angle in Degrees
*/
glMatrix.toRadian = function(a){
     return a * degree;
}

module.exports = {
  GLMAT_EPSILON : GLMAT_EPSILON,
  GLMAT_ARRAY_TYPE : GLMAT_ARRAY_TYPE,
  GLMAT_RANDOM : GLMAT_RANDOM,
  glMatrix : glMatrix
};

},{}],"/Users/hloftis/code/handoff/node_modules/gl-matrix-vec2/index.js":[function(require,module,exports){
/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

  * Redistributions of source code must retain the above copyright notice, this
    list of conditions and the following disclaimer.
  * Redistributions in binary form must reproduce the above copyright notice,
    this list of conditions and the following disclaimer in the documentation 
    and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

/**
 * @class 2 Dimensional Vector
 * @name vec2
 */
var vec2 = {};

var GLMAT_ARRAY_TYPE = require('common').GLMAT_ARRAY_TYPE;
var GLMAT_RANDOM = require('common').GLMAT_RANDOM;

/**
 * Creates a new, empty vec2
 *
 * @returns {vec2} a new 2D vector
 */
vec2.create = function() {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = 0;
    out[1] = 0;
    return out;
};

/**
 * Creates a new vec2 initialized with values from an existing vector
 *
 * @param {vec2} a vector to clone
 * @returns {vec2} a new 2D vector
 */
vec2.clone = function(a) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Creates a new vec2 initialized with the given values
 *
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} a new 2D vector
 */
vec2.fromValues = function(x, y) {
    var out = new GLMAT_ARRAY_TYPE(2);
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the source vector
 * @returns {vec2} out
 */
vec2.copy = function(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    return out;
};

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
vec2.set = function(out, x, y) {
    out[0] = x;
    out[1] = y;
    return out;
};

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.add = function(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    return out;
};

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.subtract = function(out, a, b) {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    return out;
};

/**
 * Alias for {@link vec2.subtract}
 * @function
 */
vec2.sub = vec2.subtract;

/**
 * Multiplies two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.multiply = function(out, a, b) {
    out[0] = a[0] * b[0];
    out[1] = a[1] * b[1];
    return out;
};

/**
 * Alias for {@link vec2.multiply}
 * @function
 */
vec2.mul = vec2.multiply;

/**
 * Divides two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.divide = function(out, a, b) {
    out[0] = a[0] / b[0];
    out[1] = a[1] / b[1];
    return out;
};

/**
 * Alias for {@link vec2.divide}
 * @function
 */
vec2.div = vec2.divide;

/**
 * Returns the minimum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.min = function(out, a, b) {
    out[0] = Math.min(a[0], b[0]);
    out[1] = Math.min(a[1], b[1]);
    return out;
};

/**
 * Returns the maximum of two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
vec2.max = function(out, a, b) {
    out[0] = Math.max(a[0], b[0]);
    out[1] = Math.max(a[1], b[1]);
    return out;
};

/**
 * Scales a vec2 by a scalar number
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to scale
 * @param {Number} b amount to scale the vector by
 * @returns {vec2} out
 */
vec2.scale = function(out, a, b) {
    out[0] = a[0] * b;
    out[1] = a[1] * b;
    return out;
};

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
vec2.scaleAndAdd = function(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale);
    out[1] = a[1] + (b[1] * scale);
    return out;
};

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} distance between a and b
 */
vec2.distance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.distance}
 * @function
 */
vec2.dist = vec2.distance;

/**
 * Calculates the squared euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} squared distance between a and b
 */
vec2.squaredDistance = function(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredDistance}
 * @function
 */
vec2.sqrDist = vec2.squaredDistance;

/**
 * Calculates the length of a vec2
 *
 * @param {vec2} a vector to calculate length of
 * @returns {Number} length of a
 */
vec2.length = function (a) {
    var x = a[0],
        y = a[1];
    return Math.sqrt(x*x + y*y);
};

/**
 * Alias for {@link vec2.length}
 * @function
 */
vec2.len = vec2.length;

/**
 * Calculates the squared length of a vec2
 *
 * @param {vec2} a vector to calculate squared length of
 * @returns {Number} squared length of a
 */
vec2.squaredLength = function (a) {
    var x = a[0],
        y = a[1];
    return x*x + y*y;
};

/**
 * Alias for {@link vec2.squaredLength}
 * @function
 */
vec2.sqrLen = vec2.squaredLength;

/**
 * Negates the components of a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to negate
 * @returns {vec2} out
 */
vec2.negate = function(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    return out;
};

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
vec2.normalize = function(out, a) {
    var x = a[0],
        y = a[1];
    var len = x*x + y*y;
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len);
        out[0] = a[0] * len;
        out[1] = a[1] * len;
    }
    return out;
};

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
vec2.dot = function (a, b) {
    return a[0] * b[0] + a[1] * b[1];
};

/**
 * Computes the cross product of two vec2's
 * Note that the cross product must by definition produce a 3D vector
 *
 * @param {vec3} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec3} out
 */
vec2.cross = function(out, a, b) {
    var z = a[0] * b[1] - a[1] * b[0];
    out[0] = out[1] = 0;
    out[2] = z;
    return out;
};

/**
 * Performs a linear interpolation between two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} t interpolation amount between the two inputs
 * @returns {vec2} out
 */
vec2.lerp = function (out, a, b, t) {
    var ax = a[0],
        ay = a[1];
    out[0] = ax + t * (b[0] - ax);
    out[1] = ay + t * (b[1] - ay);
    return out;
};

/**
 * Generates a random vector with the given scale
 *
 * @param {vec2} out the receiving vector
 * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
 * @returns {vec2} out
 */
vec2.random = function (out, scale) {
    scale = scale || 1.0;
    var r = GLMAT_RANDOM() * 2.0 * Math.PI;
    out[0] = Math.cos(r) * scale;
    out[1] = Math.sin(r) * scale;
    return out;
};

/**
 * Transforms the vec2 with a mat2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y;
    out[1] = m[1] * x + m[3] * y;
    return out;
};

/**
 * Transforms the vec2 with a mat2d
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat2d} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat2d = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[2] * y + m[4];
    out[1] = m[1] * x + m[3] * y + m[5];
    return out;
};

/**
 * Transforms the vec2 with a mat3
 * 3rd vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat3} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat3 = function(out, a, m) {
    var x = a[0],
        y = a[1];
    out[0] = m[0] * x + m[3] * y + m[6];
    out[1] = m[1] * x + m[4] * y + m[7];
    return out;
};

/**
 * Transforms the vec2 with a mat4
 * 3rd vector component is implicitly '0'
 * 4th vector component is implicitly '1'
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the vector to transform
 * @param {mat4} m matrix to transform with
 * @returns {vec2} out
 */
vec2.transformMat4 = function(out, a, m) {
    var x = a[0], 
        y = a[1];
    out[0] = m[0] * x + m[4] * y + m[12];
    out[1] = m[1] * x + m[5] * y + m[13];
    return out;
};

/**
 * Perform some operation over an array of vec2s.
 *
 * @param {Array} a the array of vectors to iterate over
 * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
 * @param {Number} offset Number of elements to skip at the beginning of the array
 * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
 * @param {Function} fn Function to call for each vector in the array
 * @param {Object} [arg] additional argument to pass to fn
 * @returns {Array} a
 * @function
 */
vec2.forEach = (function() {
    var vec = vec2.create();

    return function(a, stride, offset, count, fn, arg) {
        var i, l;
        if(!stride) {
            stride = 2;
        }

        if(!offset) {
            offset = 0;
        }
        
        if(count) {
            l = Math.min((count * stride) + offset, a.length);
        } else {
            l = a.length;
        }

        for(i = offset; i < l; i += stride) {
            vec[0] = a[i]; vec[1] = a[i+1];
            fn(vec, vec, arg);
            a[i] = vec[0]; a[i+1] = vec[1];
        }
        
        return a;
    };
})();

/**
 * Returns a string representation of a vector
 *
 * @param {vec2} vec vector to represent as a string
 * @returns {String} string representation of the vector
 */
vec2.str = function (a) {
    return 'vec2(' + a[0] + ', ' + a[1] + ')';
};

module.exports = vec2;


},{"common":"/Users/hloftis/code/handoff/node_modules/gl-matrix-vec2/node_modules/gl-matrix-common/index.js"}],"/Users/hloftis/code/handoff/node_modules/gl-matrix-vec2/node_modules/gl-matrix-common/index.js":[function(require,module,exports){
module.exports=require("/Users/hloftis/code/handoff/node_modules/gl-matrix-mat3/node_modules/gl-matrix-common/index.js")
},{"/Users/hloftis/code/handoff/node_modules/gl-matrix-mat3/node_modules/gl-matrix-common/index.js":"/Users/hloftis/code/handoff/node_modules/gl-matrix-mat3/node_modules/gl-matrix-common/index.js"}]},{},["/Users/hloftis/code/handoff/index.js"])("/Users/hloftis/code/handoff/index.js")
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9ibGl0LXJlbmRlcmVyL2NhbWVyYS5qcyIsImxpYi9ibGl0LXJlbmRlcmVyL2luZGV4LmpzIiwibGliL2JsaXQtcmVuZGVyZXIvam95c3RpY2suanMiLCJsaWIvYmxpdC1yZW5kZXJlci90ZXJyYWluLmpzIiwibGliL2JsaXQvaW5kZXguanMiLCJsaWIvYmxpdC9zcHJpdGUuanMiLCJsaWIvYmxpdC9zdXJmYWNlLmpzIiwibGliL2JsaXQvd2ViLWdsLmpzIiwibGliL2VzeXN0ZW0vZW50aXR5LmpzIiwibGliL2VzeXN0ZW0vZ3JvdXAuanMiLCJsaWIvZXN5c3RlbS9pbmRleC5qcyIsImxpYi9lc3lzdGVtL3N5c3RlbS5qcyIsImxpYi9nYW1lLmpzIiwibGliL2xvb3AvbG9vcC5qcyIsImxpYi9zeXN0ZW1zL2NvbnRyb2xsYWJsZS5qcyIsImxpYi9zeXN0ZW1zL2R1ZGUuanMiLCJsaWIvc3lzdGVtcy9qb3lzdGljay5qcyIsImxpYi9zeXN0ZW1zL2xldmVsLmpzIiwibGliL3N5c3RlbXMvcGxheWVyLmpzIiwibGliL3N5c3RlbXMvcG9zaXRpb24uanMiLCJsaWIvc3lzdGVtcy93YWxraW5nLmpzIiwibGliL3N5c3RlbXMvd2FuZGVyaW5nLmpzIiwibGliL3RvdWNoL2pveXN0aWNrLmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdHJpeC1tYXQzL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdHJpeC1tYXQzL25vZGVfbW9kdWxlcy9nbC1tYXRyaXgtY29tbW9uL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2dsLW1hdHJpeC12ZWMyL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBSZW5kZXJlcjogcmVxdWlyZSgnLi9saWIvYmxpdC1yZW5kZXJlcicpLFxuICBKb3lzdGljazogcmVxdWlyZSgnLi9saWIvdG91Y2gvam95c3RpY2snKSxcbiAgR2FtZTogcmVxdWlyZSgnLi9saWIvZ2FtZScpXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7XG5cbmZ1bmN0aW9uIENhbWVyYShjb250YWluZXIpIHtcbiAgdGhpcy54ID0gMDtcbiAgdGhpcy55ID0gMDtcblxuICB0aGlzLmJhc2Vab29tID0gMjtcbiAgdGhpcy50cmFpbCA9IDAuMztcbiAgdGhpcy5saWZ0ID0gNTA7XG4gIHRoaXMuem9vbU91dCA9IDAuMDAyO1xuICB0aGlzLmRyYWcgPSAwLjE7XG4gIHRoaXMucHJvamVjdGlvbiA9IDAuNjc7XG4gIHRoaXMub2Zmc2V0WCA9IDA7XG4gIHRoaXMub2Zmc2V0WSA9IDA7XG5cbiAgdGhpcy56b29tID0gMTtcbiAgdGhpcy50YXJnZXRYID0gMDtcbiAgdGhpcy50YXJnZXRZID0gMDtcbiAgdGhpcy5sYXN0VGFyZ2V0WCA9IDA7XG4gIHRoaXMubGFzdFRhcmdldFkgPSAwO1xufVxuXG5DYW1lcmEucHJvdG90eXBlLmxlYWRUYXJnZXQgPSBmdW5jdGlvbihzZWNvbmRzLCB0YXJnZXQpIHtcbiAgdmFyIHByb2plY3RlZFggPSB0YXJnZXQucHggKyB0YXJnZXQudnggKiB0aGlzLnByb2plY3Rpb247XG4gIHZhciBwcm9qZWN0ZWRZID0gdGFyZ2V0LnB5ICsgdGFyZ2V0LnZ5ICogdGhpcy5wcm9qZWN0aW9uO1xuICB2YXIgZHggPSBwcm9qZWN0ZWRYIC0gdGhpcy50YXJnZXRYO1xuICB2YXIgZHkgPSBwcm9qZWN0ZWRZIC0gdGhpcy50YXJnZXRZIC0gdGhpcy5saWZ0O1xuICB2YXIgd2FudGVkWm9vbSA9IHRoaXMuYmFzZVpvb20gLyAodGFyZ2V0LnNwZWVkICogdGhpcy56b29tT3V0ICsgMSk7XG4gIHZhciBkWm9vbSA9IHdhbnRlZFpvb20gLSB0aGlzLnpvb207XG4gIHZhciBjb3JyZWN0aW9uID0gTWF0aC5taW4oc2Vjb25kcyAvIHRoaXMudHJhaWwsIDEpO1xuXG4gIHRoaXMuem9vbSArPSBkWm9vbSAqIGNvcnJlY3Rpb247XG4gIHRoaXMudGFyZ2V0WCArPSBkeCAqIGNvcnJlY3Rpb247XG4gIHRoaXMudGFyZ2V0WSArPSBkeSAqIGNvcnJlY3Rpb247XG59O1xuXG5DYW1lcmEucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKHNlY29uZHMsIHRhcmdldCkge1xuICB0aGlzLmxlYWRUYXJnZXQoc2Vjb25kcywgdGFyZ2V0KTtcblxuICB2YXIgZWZmaWNpZW5jeSA9IDEgLSB0aGlzLmRyYWc7XG4gIHZhciB2eCA9ICh0aGlzLnRhcmdldFggLSB0aGlzLmxhc3RUYXJnZXRYKSAqIGVmZmljaWVuY3k7XG4gIHZhciB2eSA9ICh0aGlzLnRhcmdldFkgLSB0aGlzLmxhc3RUYXJnZXRZKSAqIGVmZmljaWVuY3k7XG5cbiAgdGhpcy50YXJnZXRYICs9IHZ4ICogc2Vjb25kcztcbiAgdGhpcy50YXJnZXRZICs9IHZ5ICogc2Vjb25kcztcbiAgdGhpcy5sYXN0VGFyZ2V0WCA9IHRoaXMudGFyZ2V0WDtcbiAgdGhpcy5sYXN0VGFyZ2V0WSA9IHRoaXMudGFyZ2V0WTtcblxuICB0aGlzLnggPSB0aGlzLnRhcmdldFggLSB0aGlzLm9mZnNldFg7XG4gIHRoaXMueSA9IHRoaXMudGFyZ2V0WSAtIHRoaXMub2Zmc2V0WTtcbn07XG4iLCJ2YXIgQmxpdCA9IHJlcXVpcmUoJy4uL2JsaXQnKTtcblxudmFyIENhbWVyYSA9IHJlcXVpcmUoJy4vY2FtZXJhJyk7XG52YXIgVGVycmFpbiA9IHJlcXVpcmUoJy4vdGVycmFpbicpO1xudmFyIEpveXN0aWNrID0gcmVxdWlyZSgnLi9qb3lzdGljaycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyO1xuXG5mdW5jdGlvbiBSZW5kZXJlcihjb250YWluZXIpIHtcbiAgdGhpcy5yZXNpemUgPSBfLmRlYm91bmNlKHRoaXMucmVzaXplLmJpbmQodGhpcyksIDEwMDAsIHsgbGVhZGluZzogdHJ1ZSB9KTtcblxuICB0aGlzLmNhbWVyYSA9IG5ldyBDYW1lcmEoKTtcbiAgdGhpcy5zdXJmYWNlID0gbmV3IEJsaXQuU3VyZmFjZShjb250YWluZXIpO1xuICB0aGlzLnRlcnJhaW4gPSBuZXcgVGVycmFpbih0aGlzLnN1cmZhY2UpO1xuICB0aGlzLmR1ZGVTcHJpdGUgPSBuZXcgQmxpdC5TcHJpdGUodGhpcy5zdXJmYWNlLCA1NiwgNjUsICdpbWFnZXMvY2hhcmFjdGVyX3Nwcml0ZXMucG5nJyk7XG4gIHRoaXMuc2hhZG93U3ByaXRlID0gbmV3IEJsaXQuU3ByaXRlKHRoaXMuc3VyZmFjZSwgMzIsIDE2KTtcbiAgdGhpcy5wbGF5ZXJTcHJpdGUgPSBuZXcgQmxpdC5TcHJpdGUodGhpcy5zdXJmYWNlLCA1NiwgNjUsICdpbWFnZXMvaG92ZXJib2FyZF9zcHJpdGVzLnBuZycpO1xuICB0aGlzLmpveXN0aWNrID0gbmV3IEpveXN0aWNrKHRoaXMuc3VyZmFjZSk7XG5cbiAgdGhpcy5zaGFkb3dTcHJpdGUuY2FudmFzRnJhbWUoMCwgZnVuY3Rpb24gZHJhd1NoYWRvdyhjdHgsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICBjdHguZmlsbFN0eWxlID0gJ3JnYmEoMCwgMCwgMCwgMC40KSc7XG4gICAgZHJhd0VsbGlwc2UoY3R4LCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICBjdHguZmlsbCgpO1xuICB9KTtcblxuICB0aGlzLnJlc2l6ZSgpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5yZXNpemUpO1xufVxuXG5mdW5jdGlvbiBkcmF3RWxsaXBzZShjdHgsIHgsIHksIHcsIGgpIHtcbiAgdmFyIGthcHBhID0gLjU1MjI4NDgsXG4gIG94ID0gKHcgLyAyKSAqIGthcHBhLCAvLyBjb250cm9sIHBvaW50IG9mZnNldCBob3Jpem9udGFsXG4gIG95ID0gKGggLyAyKSAqIGthcHBhLCAvLyBjb250cm9sIHBvaW50IG9mZnNldCB2ZXJ0aWNhbFxuICB4ZSA9IHggKyB3LCAgICAgICAgICAgLy8geC1lbmRcbiAgeWUgPSB5ICsgaCwgICAgICAgICAgIC8vIHktZW5kXG4gIHhtID0geCArIHcgLyAyLCAgICAgICAvLyB4LW1pZGRsZVxuICB5bSA9IHkgKyBoIC8gMjsgICAgICAgLy8geS1taWRkbGVcblxuICBjdHguYmVnaW5QYXRoKCk7XG4gIGN0eC5tb3ZlVG8oeCwgeW0pO1xuICBjdHguYmV6aWVyQ3VydmVUbyh4LCB5bSAtIG95LCB4bSAtIG94LCB5LCB4bSwgeSk7XG4gIGN0eC5iZXppZXJDdXJ2ZVRvKHhtICsgb3gsIHksIHhlLCB5bSAtIG95LCB4ZSwgeW0pO1xuICBjdHguYmV6aWVyQ3VydmVUbyh4ZSwgeW0gKyBveSwgeG0gKyBveCwgeWUsIHhtLCB5ZSk7XG4gIGN0eC5iZXppZXJDdXJ2ZVRvKHhtIC0gb3gsIHllLCB4LCB5bSArIG95LCB4LCB5bSk7XG59XG5cblJlbmRlcmVyLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRpbXMgPSB0aGlzLnN1cmZhY2UucmVzaXplKCk7XG4gIHRoaXMuc2NhbGUgPSAxMDgwIC8gTWF0aC5tYXgoZGltcy53aWR0aCwgZGltcy5oZWlnaHQpO1xufTtcblxuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKHNlY29uZHMsIGVudGl0aWVzKSB7XG4gIHZhciBzdXJmYWNlID0gdGhpcy5zdXJmYWNlO1xuICB2YXIgY2FtZXJhID0gdGhpcy5jYW1lcmE7XG4gIHZhciBkdWRlcyA9IGZpbmRBbGwoJ2R1ZGUnKTtcbiAgdmFyIHBsYXllciA9IF8uZmluZChlbnRpdGllcywgeyBpZDogJ3BsYXllcicgfSk7XG4gIHZhciBsZXZlbCA9IF8uZmluZChlbnRpdGllcywgeyBpZDogJ2xldmVsJyB9KTtcbiAgdmFyIGpveXN0aWNrID0gXy5maW5kKGVudGl0aWVzLCB7IGlkOiAnam95c3RpY2snIH0pO1xuXG4gIC8vIFRyYWNrIHBsYXllciB3aXRoIGNhbWVyYVxuICBjYW1lcmEudXBkYXRlKHNlY29uZHMsIHBsYXllcik7XG5cbiAgLy8gQ2xlYXIgdGhlIHN1cmZhY2VcbiAgc3VyZmFjZS5jbGVhcigpO1xuXG4gIC8vIFpvb20gYW5kIHRyYW5zbGF0ZVxuICBzdXJmYWNlLnB1c2goKTtcbiAgc3VyZmFjZS50cmFuc2xhdGUoc3VyZmFjZS53aWR0aCAqIDAuNSwgc3VyZmFjZS5oZWlnaHQgKiAwLjUpOyAgICAgICAgICAgICAvLyBjZW50ZXJcbiAgc3VyZmFjZS5zY2FsZSgxIC8gdGhpcy5zY2FsZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzY2FsZSB0byAxMDgwcFxuICBzdXJmYWNlLnNjYWxlKGNhbWVyYS56b29tKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzY2FsZSB0byBjYW1lcmEgem9vbVxuICBzdXJmYWNlLnRyYW5zbGF0ZSgtY2FtZXJhLngsIC1jYW1lcmEueSk7ICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWxpZ24gb3ZlciBjYW1lcmEgcG9zaXRpb25cblxuICAvLyBEZXRlcm1pbmUgdGhlIHZpc2libGUgcmVjdGFuZ2xlXG4gIHZhciB2aWV3UmVjdCA9IHN1cmZhY2UuZ2V0UmVjdCgpO1xuXG4gIC8vIERyYXcgdGhlIHZpc2libGUgcGFydHMgb2YgdGhlIHRlcnJhaW5cbiAgdGhpcy50ZXJyYWluLnJlbmRlcihzZWNvbmRzLCBsZXZlbCwgdmlld1JlY3QpO1xuXG4gIC8vIERyYXcgdGhlIGNoYXJhY3RlcnNcbiAgZHVkZXMucHVzaChwbGF5ZXIpXG4gIGR1ZGVzLnNvcnQoYnlQWSk7XG4gIGR1ZGVzLmZvckVhY2goZnVuY3Rpb24gZHJhd1NoYWRvdyhjaGFyYWN0ZXIpIHtcbiAgICBpZiAoY2hhcmFjdGVyID09PSBwbGF5ZXIpIHJldHVybjtcbiAgICB0aGlzLnJlbmRlclNoYWRvdyhjaGFyYWN0ZXIpO1xuICB9LmJpbmQodGhpcykpO1xuICBkdWRlcy5mb3JFYWNoKGZ1bmN0aW9uIGRyYXdDaGFyYWN0ZXIoY2hhcmFjdGVyKSB7XG4gICAgaWYgKGNoYXJhY3RlciA9PT0gcGxheWVyKSB0aGlzLnJlbmRlclBsYXllcihjaGFyYWN0ZXIpO1xuICAgIGVsc2UgdGhpcy5yZW5kZXJEdWRlKGNoYXJhY3Rlcik7XG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgLy8gVW56b29tIGFuZCB1bnRyYW5zbGF0ZVxuICBzdXJmYWNlLnBvcCgpO1xuXG4gIC8vIERyYXcgdGhlIGpveXN0aWNrIG92ZXJsYXlcbiAgdGhpcy5qb3lzdGljay5yZW5kZXIoc2Vjb25kcywgam95c3RpY2spO1xuXG4gIGZ1bmN0aW9uIGZpbmRBbGwobmFtZSkge1xuICAgIHJldHVybiBfLmZpbHRlcihlbnRpdGllcywgZnVuY3Rpb24gaGFzU3lzdGVtKGVudGl0eSkge1xuICAgICAgcmV0dXJuIGVudGl0eS5zeXN0ZW1zLmluZGV4T2YobmFtZSkgIT09IC0xO1xuICAgIH0pO1xuICB9XG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyU2hhZG93ID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHNwcml0ZSA9IHRoaXMuc2hhZG93U3ByaXRlO1xuXG4gIHZhciB4ID0gc3RhdGUucHggLSBzcHJpdGUud2lkdGggKiAwLjUgLSAzO1xuICB2YXIgeSA9IHN0YXRlLnB5IC0gc3ByaXRlLmhlaWdodCAqIDAuNSAtIDU7XG5cbiAgc3ByaXRlLmJsaXQoeCwgeSwgMCk7XG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyUGxheWVyID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHNwcml0ZSA9IHRoaXMucGxheWVyU3ByaXRlO1xuXG4gIHZhciB4ID0gc3RhdGUucHggLSBzcHJpdGUud2lkdGggKiAwLjU7XG4gIHZhciB5ID0gc3RhdGUucHkgLSBzcHJpdGUuaGVpZ2h0O1xuXG4gIHZhciBkaXJlY3Rpb24gPSBnZXREaXJlY3Rpb24oc3RhdGUudngsIHN0YXRlLnZ5LCBNYXRoLlBJICogMC41KTtcbiAgdmFyIGZyYW1lID0gZGlyZWN0aW9uIC0gMTtcblxuICBzcHJpdGUuYmxpdCh4LCB5LCBmcmFtZSk7XG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyRHVkZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzcHJpdGUgPSB0aGlzLmR1ZGVTcHJpdGU7XG5cbiAgdmFyIHggPSBzdGF0ZS5weCAtIHNwcml0ZS53aWR0aCAqIDAuNTtcbiAgdmFyIHkgPSBzdGF0ZS5weSAtIHNwcml0ZS5oZWlnaHQ7XG5cbiAgdmFyIGRpcmVjdGlvbiA9IGdldERpcmVjdGlvbihzdGF0ZS52eCwgc3RhdGUudnkpO1xuICB2YXIgcG9zZSA9IHN0YXRlLnNwZWVkID4gNVxuICAgID8gOCAtIE1hdGguZmxvb3Ioc3RhdGUuZGlzdGFuY2UgLyAxMCkgJSA5XG4gICAgOiA4O1xuICB2YXIgZnJhbWUgPSBwb3NlICsgOSAqIChkaXJlY3Rpb24gLSAxKTtcblxuICBzcHJpdGUuYmxpdCh4LCB5LCBmcmFtZSk7XG59O1xuXG5mdW5jdGlvbiBnZXREaXJlY3Rpb24oeCwgeSwgb2Zmc2V0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8fCAwO1xuICB2YXIgYW5nbGUgPSAoTWF0aC5hdGFuMih5LCB4KSArIE1hdGguUEkgKiAyICsgb2Zmc2V0KSAlIChNYXRoLlBJICogMik7XG5cbiAgaWYgKGJldHdlZW4oMTIuNSwgMzcuNSkpIHJldHVybiA4O1xuICBlbHNlIGlmIChiZXR3ZWVuKDM3LjUsIDYyLjUpKSByZXR1cm4gNztcbiAgZWxzZSBpZiAoYmV0d2Vlbig2Mi41LCA4Ny41KSkgcmV0dXJuIDY7XG4gIGVsc2UgaWYgKGJldHdlZW4oODcuNSwgMTEyLjUpKSByZXR1cm4gNTtcbiAgZWxzZSBpZiAoYmV0d2VlbigxMTIuNSwgMTM3LjUpKSByZXR1cm4gMTtcbiAgZWxzZSBpZiAoYmV0d2VlbigxMzcuNSwgMTYyLjUpKSByZXR1cm4gMjtcbiAgZWxzZSBpZiAoYmV0d2VlbigxNjIuNSwgMTg3LjUpKSByZXR1cm4gMztcbiAgZWxzZSByZXR1cm4gNDtcblxuICBmdW5jdGlvbiBiZXR3ZWVuKGEsIGIpIHtcbiAgICByZXR1cm4gYW5nbGUgPj0gTWF0aC5QSSAqIChhIC8gMTAwKSAmJiBhbmdsZSA8PSBNYXRoLlBJICogKGIgLyAxMDApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ5UFkoYSwgYikge1xuICByZXR1cm4gYS5weSAtIGIucHk7XG59XG4iLCJ2YXIgQmxpdCA9IHJlcXVpcmUoJy4uL2JsaXQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBKb3lzdGljaztcblxuZnVuY3Rpb24gSm95c3RpY2soc3VyZmFjZSkge1xuICB0aGlzLnN1cmZhY2UgPSBzdXJmYWNlO1xuICB0aGlzLnJhZGl1cyA9IDA7XG4gIHRoaXMuc3ByaXRlID0gdW5kZWZpbmVkO1xufVxuXG5Kb3lzdGljay5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oc2Vjb25kcywgam95c3RpY2spIHtcbiAgaWYgKGpveXN0aWNrLnJhZGl1cyAhPT0gdGhpcy5yYWRpdXMpIHtcbiAgICB0aGlzLnNwcml0ZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnJhZGl1cyA9IGpveXN0aWNrLnJhZGl1cztcbiAgfVxuICBpZiAoIXRoaXMuc3ByaXRlKSB7XG4gICAgdGhpcy5zcHJpdGUgPSB0aGlzLmdlbmVyYXRlU3ByaXRlKHRoaXMucmFkaXVzKTtcbiAgfVxuICB0aGlzLnNwcml0ZS5ibGl0KGpveXN0aWNrLnggLSB0aGlzLnNwcml0ZS53aWR0aCAqIDAuNSwgam95c3RpY2sueSAtIHRoaXMuc3ByaXRlLmhlaWdodCAqIDAuNSk7XG59O1xuXG5Kb3lzdGljay5wcm90b3R5cGUuZ2VuZXJhdGVTcHJpdGUgPSBmdW5jdGlvbihyYWRpdXMpIHtcbiAgdmFyIHNpemUgPSByYWRpdXMgKiAyO1xuICB2YXIgc3ByaXRlID0gbmV3IEJsaXQuU3ByaXRlKHRoaXMuc3VyZmFjZSwgc2l6ZSwgc2l6ZSk7XG4gIHNwcml0ZS5jYW52YXNGcmFtZSgwLCBmdW5jdGlvbiBkcmF3Q2lyY2xlKGN0eCwgd2lkdGgsIGhlaWdodCkge1xuICAgIGN0eC5maWxsU3R5bGUgPSAncmdiYSgwLCAwLCAwLCAwLjIpJztcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpJztcbiAgICBjdHguYXJjKHdpZHRoICogMC41LCBoZWlnaHQgKiAwLjUsIHdpZHRoICogMC41LCAwLCBNYXRoLlBJICogMik7XG4gICAgY3R4LmZpbGwoKTtcbiAgICBjdHguc3Ryb2tlKCk7XG4gIH0pO1xuICByZXR1cm4gc3ByaXRlO1xufVxuIiwidmFyIEJsaXQgPSByZXF1aXJlKCcuLi9ibGl0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGVycmFpbjtcblxuZnVuY3Rpb24gVGVycmFpbihzdXJmYWNlKSB7XG4gIHRoaXMuc3VyZmFjZSA9IHN1cmZhY2U7XG4gIHRoaXMuc3ByaXRlID0gbmV3IEJsaXQuU3ByaXRlKHRoaXMuc3VyZmFjZSwgMTI4LCAxMjgsICdpbWFnZXMvZGlydC5qcGcnKTtcbn1cblxuVGVycmFpbi5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oc2Vjb25kcywgbWFwLCByZWN0KSB7XG4gIHZhciB3aWR0aCA9IHRoaXMuc3ByaXRlLndpZHRoO1xuICB2YXIgaGVpZ2h0ID0gdGhpcy5zcHJpdGUuaGVpZ2h0O1xuXG4gIHZhciBveCA9IE1hdGguZmxvb3IocmVjdC5sZWZ0IC8gd2lkdGgpICogd2lkdGg7XG4gIHZhciBveSA9IE1hdGguZmxvb3IocmVjdC50b3AgLyBoZWlnaHQpICogaGVpZ2h0O1xuXG4gIGZvciAodmFyIHkgPSBveTsgeSA8IHJlY3QuYm90dG9tOyB5ICs9IHdpZHRoKSB7XG4gICAgZm9yICh2YXIgeCA9IG94OyB4IDwgcmVjdC5yaWdodDsgeCArPSBoZWlnaHQpIHtcbiAgICAgIHRoaXMuc3ByaXRlLmJsaXQoeCwgeSwgMCk7XG4gICAgfVxuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIFN1cmZhY2U6IHJlcXVpcmUoJy4vc3VyZmFjZScpLFxuICBTcHJpdGU6IHJlcXVpcmUoJy4vc3ByaXRlJylcbn07XG4iLCJ2YXIgV2ViR0wgPSByZXF1aXJlKCcuL3dlYi1nbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNwcml0ZTtcblxuZnVuY3Rpb24gU3ByaXRlKHN1cmZhY2UsIHdpZHRoLCBoZWlnaHQsIHVybCkge1xuICB0aGlzLnN1cmZhY2UgPSBzdXJmYWNlO1xuICB0aGlzLnRleHR1cmVzID0gW107ICAgICAgIC8vIFRPRE86IGluc3RlYWQgb2YgYW4gYXJyYXksIHN0b3JlIGFzIGEgbGFyZ2UgdGV4dHVyZSBhbmQgc2VsZWN0IGZyYW1lcyB3aXRoIFVWIGNvb3Jkc1xuICB0aGlzLndpZHRoID0gd2lkdGg7XG4gIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICB0aGlzLmltYWdlID0gbmV3IEltYWdlKCk7XG5cbiAgLy8gQnVmZmVyc1xuICB0aGlzLnZlcnRleEJ1ZmZlciA9IHN1cmZhY2UuZ2wuY3JlYXRlQnVmZmVyKCk7XG4gIHRoaXMudGV4dHVyZUJ1ZmZlciA9IHN1cmZhY2UuZ2wuY3JlYXRlQnVmZmVyKCk7XG5cbiAgLy8gVGV4dHVyZSBjb29yZHNcbiAgdGhpcy50ZXh0dXJlQ29vcmRzID0gbmV3IEZsb2F0MzJBcnJheShbXG4gICAgMC4wLCAwLjAsXG4gICAgMS4wLCAwLjAsXG4gICAgMC4wLCAxLjAsXG4gICAgMC4wLCAxLjAsXG4gICAgMS4wLCAwLjAsXG4gICAgMS4wLCAxLjBcbiAgXSk7XG5cbiAgdGhpcy5pbWFnZS5vbmxvYWQgPSB0aGlzLl9vbkxvYWQuYmluZCh0aGlzKTtcbiAgaWYgKHVybCkgdGhpcy5sb2FkVXJsKHVybCk7XG59XG5cbi8vIFRPRE86IGFsbG93IHlvdSB0byByZW5kZXIgb24gYSBub24tcG93ZXItb2YtdHdvIGFuZCB0aGVuIGNvbnZlcnQgdG8gYSBwb3dlci1vZi10d29cblNwcml0ZS5wcm90b3R5cGUuY2FudmFzRnJhbWUgPSBmdW5jdGlvbihmcmFtZSwgZHJhd0ZuKSB7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICB2YXIgc2l6ZSA9IFdlYkdMLm5leHRQb3dlck9mVHdvKE1hdGgubWF4KHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KSk7XG5cbiAgY2FudmFzLndpZHRoID0gc2l6ZTtcbiAgY2FudmFzLmhlaWdodCA9IHNpemU7XG5cbiAgZHJhd0ZuKGN0eCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuICB0aGlzLl9jcmVhdGVUZXh0dXJlKGNhbnZhcywgZnJhbWUpO1xufTtcblxuU3ByaXRlLnByb3RvdHlwZS5sb2FkVXJsID0gZnVuY3Rpb24odXJsKSB7XG4gIHRoaXMuaW1hZ2Uuc3JjID0gdXJsO1xufTtcblxuU3ByaXRlLnByb3RvdHlwZS5fb25Mb2FkID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuc3VyZmFjZS5nbDtcbiAgdmFyIGltYWdlID0gdGhpcy5pbWFnZTtcblxuICAvLyBDcmVhdGUgYSBzcXVhcmUgcG93ZXItb2YtdHdvIGNhbnZhcyB0byByZXNpemUgdGhlIHRleHR1cmUgb250b1xuICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgdmFyIHNpemUgPSBXZWJHTC5uZXh0UG93ZXJPZlR3byhNYXRoLm1heCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCkpO1xuICBjYW52YXMud2lkdGggPSBzaXplO1xuICBjYW52YXMuaGVpZ2h0ID0gc2l6ZTtcblxuICAvLyBMb29wIHRocm91Z2ggZWFjaCBmcmFtZSBpbiB0aGUgaW1hZ2VcbiAgZm9yICh2YXIgeSA9IDA7IHkgPCBpbWFnZS5oZWlnaHQ7IHkgKz0gdGhpcy5oZWlnaHQpIHtcbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4ICs9IHRoaXMud2lkdGgpIHtcbiAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgc2l6ZSwgc2l6ZSk7XG4gICAgICBjdHguZHJhd0ltYWdlKGltYWdlLCB4LCB5LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgMCwgMCwgc2l6ZSwgc2l6ZSk7XG4gICAgICB0aGlzLl9jcmVhdGVUZXh0dXJlKGNhbnZhcyk7XG4gICAgfVxuICB9XG59O1xuXG5TcHJpdGUucHJvdG90eXBlLl9jcmVhdGVUZXh0dXJlID0gZnVuY3Rpb24oY2FudmFzLCBpbmRleCkge1xuICB2YXIgZ2wgPSB0aGlzLnN1cmZhY2UuZ2w7XG4gIHZhciB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuXG4gIGluZGV4ID0gaW5kZXggfHwgdGhpcy50ZXh0dXJlcy5sZW5ndGg7XG5cbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSk7XG4gIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgY2FudmFzKTtcblxuICAvLyBTZXR1cCBzY2FsaW5nIHByb3BlcnRpZXMgKG9ubHkgd29ya3Mgd2l0aCBwb3dlci1vZi0yIHRleHR1cmVzKVxuICAvLyBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcbiAgLy8gZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLkxJTkVBUl9NSVBNQVBfTkVBUkVTVCk7XG4gIC8vIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLlJFUEVBVCk7XG4gIC8vIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLlJFUEVBVCk7XG4gIC8vIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfMkQpO1xuXG4gIC8vIE1ha2VzIG5vbi1wb3dlci1vZi0yIHRleHR1cmVzIG9rOlxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSKTsgLy9nbC5ORUFSRVNUIGlzIGFsc28gYWxsb3dlZCwgaW5zdGVhZCBvZiBnbC5MSU5FQVIsIGFzIG5laXRoZXIgbWlwbWFwLlxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTsgLy9QcmV2ZW50cyBzLWNvb3JkaW5hdGUgd3JhcHBpbmcgKHJlcGVhdGluZykuXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpOyAvL1ByZXZlbnRzIHQtY29vcmRpbmF0ZSB3cmFwcGluZyAocmVwZWF0aW5nKS5cblxuICAvLyBVbmJpbmQgdGhlIHRleHR1cmVcbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG5cbiAgLy8gU3RvcmUgdGhlIHRleHR1cmVcbiAgdGhpcy50ZXh0dXJlc1tpbmRleF0gPSB0ZXh0dXJlO1xufTtcblxuU3ByaXRlLnByb3RvdHlwZS5ibGl0ID0gZnVuY3Rpb24oeCwgeSwgZnJhbWUpIHtcbiAgZnJhbWUgPSBmcmFtZSB8fCAwO1xuXG4gIGlmICghdGhpcy50ZXh0dXJlc1tmcmFtZV0pIHJldHVybjtcblxuICB2YXIgc3VyZmFjZSA9IHRoaXMuc3VyZmFjZTtcbiAgdmFyIGdsID0gc3VyZmFjZS5nbDtcbiAgdmFyIHZlcnRleFBvc2l0aW9uID0gc3VyZmFjZS5sb2NhdGlvbnMucG9zaXRpb247XG4gIHZhciB2ZXJ0ZXhUZXh0dXJlID0gc3VyZmFjZS5sb2NhdGlvbnMudGV4dHVyZTtcbiAgdmFyIG1hdHJpeExvY2F0aW9uID0gc3VyZmFjZS5sb2NhdGlvbnMubWF0cml4O1xuICB2YXIgbWF0cml4ID0gc3VyZmFjZS5nZXRNYXRyaXgoKTtcblxuICAvLyBCaW5kIHRoZSB2ZXJ0ZXggYnVmZmVyIGFzIHRoZSBjdXJyZW50IGJ1ZmZlclxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXIpO1xuXG4gIC8vIEZpbGwgaXQgd2l0aCB0aGUgdmVydGV4IGRhdGFcbiAgdmFyIHgxID0geDtcbiAgdmFyIHgyID0geCArIHRoaXMud2lkdGg7XG4gIHZhciB5MSA9IHk7XG4gIHZhciB5MiA9IHkgKyB0aGlzLmhlaWdodDtcbiAgdmFyIHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShbXG4gICAgeDEsIHkxLCB4MiwgeTEsIHgxLCB5MiwgeDEsIHkyLCB4MiwgeTEsIHgyLCB5MlxuICBdKTtcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHZlcnRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgLy8gQ29ubmVjdCB2ZXJ0ZXggYnVmZmVyIHRvIHNoYWRlcidzIHZlcnRleCBwb3NpdGlvbiBhdHRyaWJ1dGVcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcih2ZXJ0ZXhQb3NpdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAvLyBCaW5kIHRoZSBzaGFkZXIgYnVmZmVyIGFzIHRoZSBjdXJyZW50IGJ1ZmZlclxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy50ZXh0dXJlQnVmZmVyKTtcblxuICAvLyBGaWxsIGl0IHdpdGggdGhlIHRleHR1cmUgZGF0YVxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy50ZXh0dXJlQ29vcmRzLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgLy8gQ29ubmVjdCB0ZXh0dXJlIGJ1ZmZlciB0byBzaGFkZXIncyB0ZXh0dXJlIGF0dHJpYnV0ZVxuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHZlcnRleFRleHR1cmUsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgLy8gU2V0IHNsb3QgMCBhcyBhY3RpdmUgdGV4dHVyZVxuICAvL2dsLmFjdGl2ZVRleHR1cmUodGhpcy5HTC5URVhUVVJFMCk7IC8vIFRPRE86IG5lY2Vzc2FyeT9cbiAgLy9nbC5hY3RpdmVUZXh0dXJlKGdsWydURVhUVVJFJyArIGZyYW1lXSk7XG5cbiAgLy8gTG9hZCB0ZXh0dXJlIGludG8gbWVtb3J5XG4gIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZXNbZnJhbWVdKTtcblxuICAvLyBBcHBseSB0aGUgdHJhbnNmb3JtYXRpb24gbWF0cml4XG4gIGdsLnVuaWZvcm1NYXRyaXgzZnYobWF0cml4TG9jYXRpb24sIGZhbHNlLCBtYXRyaXgpO1xuXG4gIC8vIERyYXcgdHJpYW5nbGVzIHRoYXQgbWFrZSB1cCBhIHJlY3RhbmdsZVxuICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgNik7XG5cbiAgLy8gVW5iaW5kIGV2ZXJ5dGhpbmdcbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcbn07XG4iLCJ2YXIgbWF0MyA9IHJlcXVpcmUoJ2dsLW1hdHJpeC1tYXQzJyk7XG52YXIgdmVjMiA9IHJlcXVpcmUoJ2dsLW1hdHJpeC12ZWMyJyk7XG5cbnZhciBXZWJHTCA9IHJlcXVpcmUoJy4vd2ViLWdsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3VyZmFjZTtcblxuZnVuY3Rpb24gU3VyZmFjZShjYW52YXMpIHtcbiAgdGhpcy5jYW52YXMgPSBjYW52YXM7XG4gIHRoaXMubWF0cml4U3RhY2sgPSBbIG1hdDMuY3JlYXRlKCkgXTtcbiAgdGhpcy53aWR0aCA9IDA7XG4gIHRoaXMuaGVpZ2h0ID0gMDtcblxuICB0aGlzLmdsID0gV2ViR0wuZ2V0R0xDb250ZXh0KGNhbnZhcywgeyBhbHBoYTogZmFsc2UsIHByZW11bHRpcGxpZWRBbHBoYTogZmFsc2UgfSk7XG4gIHRoaXMubG9jYXRpb25zID0gV2ViR0wuaW5pdEdMKHRoaXMuZ2wsIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgdGhpcy5yZXNpemUoKTtcbn1cblxuU3VyZmFjZS5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24oKSB7XG4gIHZhciB3aWR0aCA9IHRoaXMuY2FudmFzLmNsaWVudFdpZHRoO1xuICB2YXIgaGVpZ2h0ID0gdGhpcy5jYW52YXMuY2xpZW50SGVpZ2h0O1xuXG4gIHRoaXMud2lkdGggPSB0aGlzLmNhbnZhcy53aWR0aCA9IHdpZHRoO1xuICB0aGlzLmhlaWdodCA9IHRoaXMuY2FudmFzLmhlaWdodCA9IGhlaWdodDtcbiAgdGhpcy5nbC52aWV3cG9ydCgwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgdGhpcy5nbC51bmlmb3JtMmYodGhpcy5sb2NhdGlvbnMucmVzb2x1dGlvbiwgd2lkdGgsIGhlaWdodCk7XG5cbiAgcmV0dXJuIHtcbiAgICB3aWR0aDogd2lkdGgsXG4gICAgaGVpZ2h0OiBoZWlnaHRcbiAgfTtcbn07XG5cblN1cmZhY2UucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24oY29sb3IpIHtcbiAgdGhpcy5nbC5jbGVhcih0aGlzLmdsLkNPTE9SX0JVRkZFUl9CSVQpO1xufTtcblxuU3VyZmFjZS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLm1hdHJpeFN0YWNrLnB1c2goIG1hdDMuY2xvbmUodGhpcy5nZXRNYXRyaXgoKSkgKTtcbn07XG5cblN1cmZhY2UucHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5tYXRyaXhTdGFjay5wb3AoKTtcbn07XG5cblN1cmZhY2UucHJvdG90eXBlLmdldE1hdHJpeCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5tYXRyaXhTdGFja1t0aGlzLm1hdHJpeFN0YWNrLmxlbmd0aCAtIDFdO1xufTtcblxuU3VyZmFjZS5wcm90b3R5cGUudHJhbnNsYXRlID0gZnVuY3Rpb24odHgsIHR5KSB7XG4gIHZhciBtID0gdGhpcy5nZXRNYXRyaXgoKTtcbiAgdmFyIHYgPSB2ZWMyLnNldCh2ZWMyLmNyZWF0ZSgpLCB0eCwgdHkpO1xuICBtYXQzLnRyYW5zbGF0ZShtLCBtLCB2KTtcbn07XG5cblN1cmZhY2UucHJvdG90eXBlLnNjYWxlID0gZnVuY3Rpb24oc2NhbGUpIHtcbiAgdmFyIG0gPSB0aGlzLmdldE1hdHJpeCgpO1xuICB2YXIgdiA9IHZlYzIuc2V0KHZlYzIuY3JlYXRlKCksIHNjYWxlLCBzY2FsZSk7XG4gIG1hdDMuc2NhbGUobSwgbSwgdik7XG59O1xuXG5TdXJmYWNlLnByb3RvdHlwZS5nZXRSZWN0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBtID0gbWF0My5jbG9uZSh0aGlzLmdldE1hdHJpeCgpKTtcbiAgdmFyIHVsID0gdmVjMi5zZXQodmVjMi5jcmVhdGUoKSwgMCwgMCk7XG4gIHZhciBsciA9IHZlYzIuc2V0KHZlYzIuY3JlYXRlKCksIHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KTtcbiAgbWF0My5pbnZlcnQobSwgbSk7XG4gIHZlYzIudHJhbnNmb3JtTWF0Myh1bCwgdWwsIG0pO1xuICB2ZWMyLnRyYW5zZm9ybU1hdDMobHIsIGxyLCBtKTtcbiAgcmV0dXJuIHtcbiAgICBsZWZ0OiB1bFswXSxcbiAgICB0b3A6IHVsWzFdLFxuICAgIHJpZ2h0OiBsclswXSxcbiAgICBib3R0b206IGxyWzFdXG4gIH07XG59O1xuIiwidmFyIFZFUlRFWF9TSEFERVIgPSBbXG4gICdhdHRyaWJ1dGUgdmVjMiBhX3Bvc2l0aW9uOycsXG4gICdhdHRyaWJ1dGUgdmVjMiBhX3RleHR1cmU7JyxcbiAgJ3ZhcnlpbmcgdmVjMiB2X3RleHR1cmU7JyxcbiAgJ3VuaWZvcm0gdmVjMiB1X3Jlc29sdXRpb247JyxcbiAgJ3VuaWZvcm0gbWF0MyB1X21hdHJpeDsnLFxuXG4gICd2b2lkIG1haW4oKSB7JyxcblxuICAvLyBhcHBseSB0aGUgdHJhbnNmb3JtYXRpb24gbWF0cml4XG4gICd2ZWMyIHBvc2l0aW9uID0gKHVfbWF0cml4ICogdmVjMyhhX3Bvc2l0aW9uLCAxKSkueHk7JyxcblxuICAvLyBjb252ZXJ0IHRoZSByZWN0YW5nbGUgZnJvbSBwaXhlbHMgdG8gMC4wIHRvIDEuMFxuICAndmVjMiB6ZXJvVG9PbmUgPSBwb3NpdGlvbiAvIHVfcmVzb2x1dGlvbjsnLFxuXG4gIC8vIGNvbnZlcnQgZnJvbSAwLT4xIHRvIDAtPjJcbiAgJ3ZlYzIgemVyb1RvVHdvID0gemVyb1RvT25lICogMi4wOycsXG5cbiAgLy8gY29udmVydCBmcm9tIDAtPjIgdG8gLTEtPisxIChjbGlwc3BhY2UpXG4gICd2ZWMyIGNsaXBTcGFjZSA9IHplcm9Ub1R3byAtIDEuMDsnLFxuXG4gIC8vIGludmVydCB5IGF4aXMgYW5kIGFzc2lnbiBwb3NpdGlvblxuICAnZ2xfUG9zaXRpb24gPSB2ZWM0KGNsaXBTcGFjZSAqIHZlYzIoMSwgLTEpLCAwLCAxKTsnLFxuXG4gIC8vIHBhc3MgdGhlIHRleHR1cmUgY29vcmRpbmF0ZSB0byB0aGUgZnJhZ21lbnQgc2hhZGVyXG4gICd2X3RleHR1cmUgPSBhX3RleHR1cmU7JyxcbiAgJ30nXG5dLmpvaW4oJ1xcbicpO1xuXG52YXIgRlJBR01FTlRfU0hBREVSID0gW1xuICAncHJlY2lzaW9uIG1lZGl1bXAgZmxvYXQ7JyxcbiAgJ3VuaWZvcm0gc2FtcGxlcjJEIHVfaW1hZ2U7JywgICAvLyB0aGUgdGV4dHVyZVxuICAndmFyeWluZyB2ZWMyIHZfdGV4dHVyZTsnLCAgICAgIC8vIHRoZSB0ZXh0dXJlIGNvb3JkcyBwYXNzZWQgaW4gZnJvbSB0aGUgdmVydGV4IHNoYWRlclxuXG4gICd2b2lkIG1haW4odm9pZCkgeycsXG4gICdnbF9GcmFnQ29sb3IgPSB0ZXh0dXJlMkQodV9pbWFnZSwgdl90ZXh0dXJlKTsnLFxuICAnfSdcbl0uam9pbignXFxuJyk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBpbml0R0w6IGluaXRHTCxcbiAgZ2V0R0xDb250ZXh0OiBnZXRHTENvbnRleHQsXG4gIG5leHRQb3dlck9mVHdvOiBuZXh0UG93ZXJPZlR3b1xufTtcblxuZnVuY3Rpb24gaW5pdEdMKGdsLCB3aWR0aCwgaGVpZ2h0KSB7XG4gIGdsLmNsZWFyQ29sb3IoMC4wLCAwLjAsIDAuMCwgMS4wKTtcbiAgZ2wuY2xlYXIoZ2wuQ09MT1JfQlVGRkVSX0JJVCB8IGdsLkRFUFRIX0JVRkZFUl9CSVQpO1xuICBnbC5kZXB0aEZ1bmMoZ2wuTEVRVUFMKTtcbiAgZ2wuZGlzYWJsZShnbC5ERVBUSF9URVNUKTtcbiAgZ2wuZGlzYWJsZShnbC5DVUxMX0ZBQ0UpO1xuICBnbC5lbmFibGUoZ2wuQkxFTkQpO1xuICBnbC5waXhlbFN0b3JlaShnbC5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEFfV0VCR0wsIGZhbHNlKTtcbiAgZ2wuYmxlbmRGdW5jKGdsLlNSQ19BTFBIQSwgZ2wuT05FX01JTlVTX1NSQ19BTFBIQSk7XG5cbiAgLy8gTG9hZCBhbmQgY29tcGlsZSBmcmFnbWVudCBzaGFkZXJcbiAgdmFyIGZTaGFkZXIgPSBnbC5jcmVhdGVTaGFkZXIoZ2wuRlJBR01FTlRfU0hBREVSKTtcbiAgZ2wuc2hhZGVyU291cmNlKGZTaGFkZXIsIEZSQUdNRU5UX1NIQURFUik7XG4gIGdsLmNvbXBpbGVTaGFkZXIoZlNoYWRlcik7XG4gIHZhciBjb21waWxlZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcihmU2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUyk7XG4gIGlmICghY29tcGlsZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZyYWdtZW50IHNoYWRlciBlcnJvcjogJyArIGdsLmdldFNoYWRlckluZm9Mb2coZlNoYWRlcikpO1xuICB9XG5cbiAgLy8gTG9hZCBhbmQgY29tcGlsZSB2ZXJ0ZXggc2hhZGVyXG4gIHZhciB2U2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLlZFUlRFWF9TSEFERVIpO1xuICBnbC5zaGFkZXJTb3VyY2UodlNoYWRlciwgVkVSVEVYX1NIQURFUik7XG4gIGdsLmNvbXBpbGVTaGFkZXIodlNoYWRlcik7XG4gIHZhciBjb21waWxlZCA9IGdsLmdldFNoYWRlclBhcmFtZXRlcih2U2hhZGVyLCBnbC5DT01QSUxFX1NUQVRVUyk7XG4gIGlmICghY29tcGlsZWQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3ZlcnRleCBzaGFkZXIgZXJyb3I6ICcgKyBnbC5nZXRTaGFkZXJJbmZvTG9nKHZTaGFkZXIpKTtcbiAgfVxuXG4gIC8vIENyZWF0ZSB0aGUgc2hhZGVyIHByb2dyYW1cbiAgdmFyIHByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCBmU2hhZGVyKTtcbiAgZ2wuYXR0YWNoU2hhZGVyKHByb2dyYW0sIHZTaGFkZXIpO1xuICBnbC5saW5rUHJvZ3JhbShwcm9ncmFtKTtcbiAgZ2wudXNlUHJvZ3JhbShwcm9ncmFtKTtcblxuICAvLyBMaW5rIHZlcnRleCBwb3NpdGlvbiBhdHRyaWJ1dGUgZnJvbSBzaGFkZXJcbiAgdmFyIHZlcnRleFBvc2l0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24ocHJvZ3JhbSwgJ2FfcG9zaXRpb24nKTtcbiAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodmVydGV4UG9zaXRpb24pO1xuXG4gIC8vIExpbmsgdGV4dHVyZSBjb29yZGluYXRlIGF0dHJpYnV0ZSBmcm9tIHNoYWRlclxuICB2YXIgdmVydGV4VGV4dHVyZSA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sIFwiYV90ZXh0dXJlXCIpO1xuICBnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheSh2ZXJ0ZXhUZXh0dXJlKTtcblxuICAvLyBQcm92aWRlIHRoZSByZXNvbHV0aW9uIGxvY2F0aW9uXG4gIHZhciByZXNvbHV0aW9uTG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgJ3VfcmVzb2x1dGlvbicpO1xuXG4gIC8vIFByb3ZpZGUgdGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeFxuICB2YXIgdHJhbnNmb3JtYXRpb25NYXRyaXggPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24ocHJvZ3JhbSwgJ3VfbWF0cml4Jyk7XG5cbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbjogdmVydGV4UG9zaXRpb24sXG4gICAgdGV4dHVyZTogdmVydGV4VGV4dHVyZSxcbiAgICByZXNvbHV0aW9uOiByZXNvbHV0aW9uTG9jYXRpb24sXG4gICAgbWF0cml4OiB0cmFuc2Zvcm1hdGlvbk1hdHJpeFxuICB9O1xufVxuXG5mdW5jdGlvbiBnZXRHTENvbnRleHQoY2FudmFzLCBvcHRzKSB7XG4gIHJldHVybiBjYW52YXMuZ2V0Q29udGV4dCgnd2ViZ2wnLCBvcHRzKSB8fCBjYW52YXMuZ2V0Q29udGV4dCgnZXhwZXJpbWVudGFsLXdlYmdsJywgb3B0cyk7XG59XG5cbmZ1bmN0aW9uIG5leHRQb3dlck9mVHdvKG4pIHtcbiAgdmFyIGkgPSBNYXRoLmZsb29yKG4gLyAyKTtcbiAgd2hpbGUgKGkgPCBuKSBpICo9IDI7XG4gIHJldHVybiBpO1xufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBFbnRpdHk7XG5cbmZ1bmN0aW9uIEVudGl0eShpZCwgZ3JvdXApIHtcbiAgdGhpcy5pZCA9IGlkO1xuICB0aGlzLmdyb3VwID0gZ3JvdXA7XG4gIHRoaXMuc3lzdGVtcyA9IFtdO1xuICB0aGlzLnN0YXRlID0geyBpZDogaWQsIHN5c3RlbXM6IFtdIH07XG59XG5cbkVudGl0eS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oc3lzdGVtTmFtZSwgb3ZlcnJpZGVzKSB7XG4gIHZhciBzeXN0ZW0gPSB0aGlzLmdyb3VwLmdldFN5c3RlbShzeXN0ZW1OYW1lKTtcbiAgc3lzdGVtLnJlZ2lzdGVyKHRoaXMpO1xuICBzeXN0ZW0uc2V0SW5pdGlhbFN0YXRlKHRoaXMuc3RhdGUsIG92ZXJyaWRlcyk7XG4gIHRoaXMuc3lzdGVtcy5wdXNoKHN5c3RlbSk7XG4gIHRoaXMuc3RhdGUuc3lzdGVtcy5wdXNoKHN5c3RlbU5hbWUpO1xuICByZXR1cm4gdGhpcztcbn07XG5cbkVudGl0eS5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHN0YXRlID0gdGhpcy5zdGF0ZTtcbiAgdGhpcy5zeXN0ZW1zLmZvckVhY2goZ2V0U3lzdGVtU3RhdGUpO1xuICByZXR1cm4gdGhpcy5zdGF0ZTtcblxuICBmdW5jdGlvbiBnZXRTeXN0ZW1TdGF0ZShzeXN0ZW0pIHtcbiAgICBpZiAoc3lzdGVtLmRlZmluaXRpb24uZ2V0U3RhdGUpIHtcbiAgICAgIHZhciBzeXN0ZW1TdGF0ZSA9IHN5c3RlbS5kZWZpbml0aW9uLmdldFN0YXRlLmNhbGwoc3RhdGUpO1xuICAgICAgXy5leHRlbmQoc3RhdGUsIHN5c3RlbVN0YXRlKTtcbiAgICB9XG4gIH1cbn07XG4iLCJ2YXIgRW50aXR5ID0gcmVxdWlyZSgnLi9lbnRpdHknKTtcbnZhciBTeXN0ZW0gPSByZXF1aXJlKCcuL3N5c3RlbScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdyb3VwO1xuXG5mdW5jdGlvbiBHcm91cChkZWZpbml0aW9ucykge1xuICB0aGlzLmVudGl0aWVzID0gW107XG4gIHRoaXMuc3lzdGVtcyA9IE9iamVjdC5rZXlzKGRlZmluaXRpb25zKS5yZWR1Y2UodG9PYmplY3QsIHt9KTtcblxuICBmdW5jdGlvbiB0b09iamVjdChvYmosIGtleSkge1xuICAgIHZhciBuYW1lID0gZGVmaW5pdGlvbnNba2V5XS5uYW1lO1xuICAgIHZhciBkZWYgPSBkZWZpbml0aW9uc1trZXldO1xuICAgIG9ialtuYW1lXSA9IG5ldyBTeXN0ZW0oZGVmKTtcbiAgICByZXR1cm4gb2JqO1xuICB9XG59XG5cbkdyb3VwLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbihpZCkge1xuICB2YXIgZW50aXR5ID0gbmV3IEVudGl0eShpZCwgdGhpcyk7XG4gIHRoaXMuZW50aXRpZXMucHVzaChlbnRpdHkpO1xuICByZXR1cm4gZW50aXR5O1xufTtcblxuR3JvdXAucHJvdG90eXBlLmdldFN5c3RlbSA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgcmV0dXJuIHRoaXMuc3lzdGVtc1tuYW1lXTtcbn07XG5cbkdyb3VwLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihuYW1lKSB7XG4gIHZhciBzeXN0ZW0gPSB0aGlzLnN5c3RlbXNbbmFtZV07XG4gIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcblxuICBpZiAoIXN5c3RlbSkgdGhyb3cgbmV3IEVycm9yKCdObyBzdWNoIHN5c3RlbTogJyArIG5hbWUpO1xuXG4gIHN5c3RlbS51cGRhdGUoYXJncyk7XG59O1xuXG5Hcm91cC5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZW50aXRpZXMubWFwKGdldEVudGl0eVN0YXRlKTtcblxuICBmdW5jdGlvbiBnZXRFbnRpdHlTdGF0ZShlbnRpdHkpIHtcbiAgICByZXR1cm4gZW50aXR5LmdldFN0YXRlKCk7XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgRW50aXR5OiByZXF1aXJlKCcuL2VudGl0eScpLFxuICBFbnRpdHlHcm91cDogcmVxdWlyZSgnLi9ncm91cCcpLFxuICBFbnRpdHlTeXN0ZW06IHJlcXVpcmUoJy4vc3lzdGVtJylcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IFN5c3RlbTtcblxuZnVuY3Rpb24gU3lzdGVtKGRlZmluaXRpb24pIHtcbiAgdGhpcy5uYW1lID0gZGVmaW5pdGlvbi5uYW1lO1xuICB0aGlzLmRlZmluaXRpb24gPSBkZWZpbml0aW9uO1xuICB0aGlzLm1lbWJlcnMgPSBbXTtcbn1cblxuU3lzdGVtLnByb3RvdHlwZS5yZWdpc3RlciA9IGZ1bmN0aW9uKGVudGl0eSkge1xuICB0aGlzLm1lbWJlcnMucHVzaChlbnRpdHkpO1xufTtcblxuU3lzdGVtLnByb3RvdHlwZS5zZXRJbml0aWFsU3RhdGUgPSBmdW5jdGlvbihvYmosIG92ZXJyaWRlcykge1xuICB2YXIgc2V0dGVyID0gdGhpcy5kZWZpbml0aW9uLnNldFN0YXRlO1xuICBpZiAoc2V0dGVyKSBvdmVycmlkZXMgPSBzZXR0ZXIob3ZlcnJpZGVzKTtcbiAgXy5leHRlbmQob2JqLCBfLmNsb25lRGVlcCh0aGlzLmRlZmluaXRpb24ucHJvcHMpLCBvdmVycmlkZXMpO1xufTtcblxuU3lzdGVtLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihhcmdzKSB7XG4gIHZhciB1cGRhdGUgPSB0aGlzLmRlZmluaXRpb24udXBkYXRlO1xuICB0aGlzLm1lbWJlcnMuZm9yRWFjaCh1cGRhdGVNZW1iZXIpO1xuXG4gIGZ1bmN0aW9uIHVwZGF0ZU1lbWJlcihlbnRpdHkpIHtcbiAgICB1cGRhdGUuYXBwbHkoZW50aXR5LnN0YXRlLCBhcmdzKTtcbiAgfVxufTtcblxuU3lzdGVtLnByb3RvdHlwZS5nZXRTdGF0ZSA9IGZ1bmN0aW9uKGVudGl0eSkge1xuICByZXR1cm4gdGhpcy5kZWZpbml0aW9uLmdldFN0YXRlLmNhbGwoZW50aXR5LnN0YXRlKTtcbn07XG4iLCJ2YXIgTG9vcCA9IHJlcXVpcmUoJy4vbG9vcC9sb29wJyk7XG52YXIgRW50aXR5R3JvdXAgPSByZXF1aXJlKCcuL2VzeXN0ZW0nKS5FbnRpdHlHcm91cDtcblxudmFyIFNZU1RFTVMgPSBbXG4gIHJlcXVpcmUoJy4vc3lzdGVtcy9wb3NpdGlvbicpLFxuICByZXF1aXJlKCcuL3N5c3RlbXMvd2Fsa2luZycpLFxuICByZXF1aXJlKCcuL3N5c3RlbXMvY29udHJvbGxhYmxlJyksXG4gIHJlcXVpcmUoJy4vc3lzdGVtcy93YW5kZXJpbmcnKSxcbiAgcmVxdWlyZSgnLi9zeXN0ZW1zL3BsYXllcicpLFxuICByZXF1aXJlKCcuL3N5c3RlbXMvbGV2ZWwnKSxcbiAgcmVxdWlyZSgnLi9zeXN0ZW1zL2pveXN0aWNrJyksXG4gIHJlcXVpcmUoJy4vc3lzdGVtcy9kdWRlJylcbl07XG5cbm1vZHVsZS5leHBvcnRzID0gR2FtZTtcblxuZnVuY3Rpb24gR2FtZShyZW5kZXJlciwgam95c3RpY2ssIHJhZikge1xuICB0aGlzLnJlbmRlcmVyID0gcmVuZGVyZXI7XG4gIHRoaXMuam95c3RpY2sgPSBqb3lzdGljaztcbiAgdGhpcy5sb29wID0gbmV3IExvb3AocmFmIHx8IHJlcXVlc3RBbmltYXRpb25GcmFtZSwgMTgwKTtcblxuICB0aGlzLmVudGl0aWVzID0gbmV3IEVudGl0eUdyb3VwKFNZU1RFTVMpO1xuXG4gIHRoaXMuZW50aXRpZXMuY3JlYXRlKCdwbGF5ZXInKVxuICAgIC5hZGQoJ3Bvc2l0aW9uJylcbiAgICAuYWRkKCd3YWxraW5nJylcbiAgICAuYWRkKCdjb250cm9sbGFibGUnKVxuICAgIC5hZGQoJ3BsYXllcicpO1xuXG4gIHZhciBpID0gNTA7XG4gIHdoaWxlIChpLS0gPiAwKSB7XG4gICAgdGhpcy5lbnRpdGllcy5jcmVhdGUoKSAgICAvLyBXaWxsIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGUgYW4gSUQgZm9yIHlvdSBpZiBub3Qgc3BlY2lmaWVkXG4gICAgICAuYWRkKCdwb3NpdGlvbicsIHsgeDogTWF0aC5yYW5kb20oKSAqIDUwMCAtIDI1MCwgeTogTWF0aC5yYW5kb20oKSAqIDUwMCAtIDI1MCB9KVxuICAgICAgLmFkZCgnd2Fsa2luZycsIHsgbWF4U3BlZWQ6IDE1MCB9KVxuICAgICAgLmFkZCgnd2FuZGVyaW5nJylcbiAgICAgIC5hZGQoJ2R1ZGUnKTtcbiAgfVxuXG4gIHRoaXMuZW50aXRpZXMuY3JlYXRlKCdsZXZlbCcpXG4gICAgLmFkZCgnbGV2ZWwnKTtcblxuICB0aGlzLmVudGl0aWVzLmNyZWF0ZSgnam95c3RpY2snKVxuICAgIC5hZGQoJ2pveXN0aWNrJyk7XG59XG5cbkdhbWUucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBlbnRpdGllcyA9IHRoaXMuZW50aXRpZXM7XG4gIHZhciBqb3lzdGljayA9IHRoaXMuam95c3RpY2s7XG4gIHZhciByZW5kZXJlciA9IHRoaXMucmVuZGVyZXI7XG5cbiAgdGhpcy5sb29wLnN0YXJ0KHNpbXVsYXRlLmJpbmQodGhpcyksIHJlbmRlci5iaW5kKHRoaXMpKTtcblxuICBmdW5jdGlvbiBzaW11bGF0ZShzZWNvbmRzKSB7XG4gICAgZW50aXRpZXMudXBkYXRlKCdjb250cm9sbGFibGUnLCBzZWNvbmRzLCBqb3lzdGljay5nZXRYWSgpKTtcbiAgICBlbnRpdGllcy51cGRhdGUoJ3dhbmRlcmluZycsIHNlY29uZHMpO1xuICAgIGVudGl0aWVzLnVwZGF0ZSgnd2Fsa2luZycsIHNlY29uZHMpO1xuICAgIGVudGl0aWVzLnVwZGF0ZSgnam95c3RpY2snLCBzZWNvbmRzLCBqb3lzdGljay5nZXRTdGF0ZSgpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlbmRlcihzZWNvbmRzKSB7XG4gICAgcmVuZGVyZXIucmVuZGVyKHNlY29uZHMsIGVudGl0aWVzLmdldFN0YXRlKCkpO1xuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBMb29wO1xuXG5mdW5jdGlvbiBMb29wKHJlcXVlc3RBbmltYXRpb25GcmFtZSwgZnBzKSB7XG4gIHRoaXMucmFmID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuICB0aGlzLmZwcyA9IGZwcztcbiAgdGhpcy5zaW1UaWNrcyA9IDEwMDAgLyBmcHM7XG59XG5cbkxvb3AucHJvdG90eXBlLnN0YXJ0ID0gZnVuY3Rpb24oc2ltdWxhdGVGbiwgcmVuZGVyRm4pIHtcbiAgdmFyIHRpbWVCdWZmZXIgPSAwO1xuICB2YXIgbGFzdFRpbWUgPSAwO1xuICB2YXIgc2ltVGlja3MgPSB0aGlzLnNpbVRpY2tzO1xuICB2YXIgc2ltU2Vjb25kcyA9IHNpbVRpY2tzIC8gMTAwMDtcbiAgdmFyIHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHRoaXMucmFmO1xuXG4gIHZhciBwZXJmTm93ID0gd2luZG93LnBlcmZvcm1hbmNlICYmIHdpbmRvdy5wZXJmb3JtYW5jZS5ub3dcbiAgICA/IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3cuYmluZCh3aW5kb3cucGVyZm9ybWFuY2UpXG4gICAgOiBEYXRlLm5vdy5iaW5kKERhdGUpO1xuXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShmcmFtZSk7XG5cbiAgZnVuY3Rpb24gZnJhbWUoKSB7XG4gICAgdmFyIG5vdyA9IHBlcmZOb3coKTtcbiAgICB2YXIgdGlja3MgPSBub3cgLSBsYXN0VGltZTtcblxuICAgIGlmICh0aWNrcyA+IDEwMCkgdGlja3MgPSAwO1xuICAgIHRpbWVCdWZmZXIgKz0gdGlja3M7XG5cbiAgICBpZiAodGltZUJ1ZmZlciA+PSBzaW1UaWNrcykge1xuICAgICAgd2hpbGUgKHRpbWVCdWZmZXIgPj0gc2ltVGlja3MpIHtcbiAgICAgICAgc2ltdWxhdGVGbihzaW1TZWNvbmRzKTtcbiAgICAgICAgdGltZUJ1ZmZlciAtPSBzaW1UaWNrcztcbiAgICAgIH1cbiAgICAgIHJlbmRlckZuKHRpY2tzIC8gMTAwMCk7XG4gICAgfVxuXG4gICAgbGFzdFRpbWUgPSBub3c7XG4gICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZyYW1lKTtcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBuYW1lOiAnY29udHJvbGxhYmxlJyxcbiAgcHJvcHM6IHtcbiAgICBkaXJYOiAwLFxuICAgIGRpclk6IDBcbiAgfSxcbiAgdXBkYXRlOiBmdW5jdGlvbihzZWNvbmRzLCBqb3lzdGljaykge1xuICAgIHRoaXMuZGlyWCA9IGpveXN0aWNrLng7XG4gICAgdGhpcy5kaXJZID0gam95c3RpY2sueTtcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBuYW1lOiAnZHVkZSdcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgbmFtZTogJ2pveXN0aWNrJyxcbiAgcHJvcHM6IHtcbiAgICB4OiAwLFxuICAgIHk6IDAsXG4gICAgcmFkaXVzOiAwXG4gIH0sXG4gIHVwZGF0ZTogZnVuY3Rpb24oc2Vjb25kcywgam95c3RpY2spIHtcbiAgICB0aGlzLnggPSBqb3lzdGljay54O1xuICAgIHRoaXMueSA9IGpveXN0aWNrLnk7XG4gICAgdGhpcy5yYWRpdXMgPSBqb3lzdGljay5yYWRpdXM7XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgbmFtZTogJ2xldmVsJyxcbiAgcHJvcHM6IHtcbiAgICBtYXBXaWR0aDogMTAwLFxuICAgIG1hcEhlaWdodDogMTAwXG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgbmFtZTogJ3BsYXllcidcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgbmFtZTogJ3Bvc2l0aW9uJyxcbiAgcHJvcHM6IHtcbiAgICB4OiBbMCwgMCwgMF0sXG4gICAgeTogWzAsIDAsIDBdLFxuICAgIGludGVydmFsOiBbMSwgMSwgMV0sXG4gICAgbW92ZVRvOiBmdW5jdGlvbih4LCB5LCBzZWNvbmRzKSB7XG4gICAgICB0aGlzLngudW5zaGlmdCh4KTtcbiAgICAgIHRoaXMueC5wb3AoKTtcblxuICAgICAgdGhpcy55LnVuc2hpZnQoeSk7XG4gICAgICB0aGlzLnkucG9wKCk7XG5cbiAgICAgIHRoaXMuaW50ZXJ2YWwudW5zaGlmdChzZWNvbmRzKTtcbiAgICAgIHRoaXMuaW50ZXJ2YWwucG9wKCk7XG4gICAgfVxuICB9LFxuICBzZXRTdGF0ZTogZnVuY3Rpb24ocHJvcHMpIHtcbiAgICBpZiAoIXByb3BzKSByZXR1cm47XG5cbiAgICB2YXIgeCA9IHByb3BzLng7XG4gICAgdmFyIHkgPSBwcm9wcy55O1xuICAgIHJldHVybiB7XG4gICAgICB4OiBbeCwgeCwgeF0sXG4gICAgICB5OiBbeSwgeSwgeV1cbiAgICB9O1xuICB9LFxuICBnZXRTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZ4MCA9ICh0aGlzLnhbMF0gLSB0aGlzLnhbMV0pIC8gdGhpcy5pbnRlcnZhbFsxXTtcbiAgICB2YXIgdngxID0gKHRoaXMueFsxXSAtIHRoaXMueFsyXSkgLyB0aGlzLmludGVydmFsWzJdO1xuXG4gICAgdmFyIHZ5MCA9ICh0aGlzLnlbMF0gLSB0aGlzLnlbMV0pIC8gdGhpcy5pbnRlcnZhbFsxXTtcbiAgICB2YXIgdnkxID0gKHRoaXMueVsxXSAtIHRoaXMueVsyXSkgLyB0aGlzLmludGVydmFsWzJdO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHB4OiB0aGlzLnhbMF0sXG4gICAgICBweTogdGhpcy55WzBdLFxuICAgICAgdng6IHZ4MCxcbiAgICAgIHZ5OiB2eTAsXG4gICAgICBheDogdngwIC0gdngxLFxuICAgICAgYXk6IHZ5MCAtIHZ5MSxcbiAgICAgIHNwZWVkOiBNYXRoLnNxcnQodngwICogdngwICsgdnkwICogdnkwKVxuICAgIH07XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgbmFtZTogJ3dhbGtpbmcnLFxuICBwcm9wczoge1xuICAgIHBvd2VyOiAxMyxcbiAgICBtYXhTcGVlZDogMjIwLFxuICAgIHNsb3dEb3duOiAwLjk2LFxuICAgIGRpc3RhbmNlOiAwXG4gIH0sXG4gIHVwZGF0ZTogZnVuY3Rpb24oc2Vjb25kcykge1xuICAgIHZhciBkaXJYID0gdGhpcy5kaXJYIHx8IDA7XG4gICAgdmFyIGRpclkgPSB0aGlzLmRpclkgfHwgMDtcblxuICAgIHZhciBpbXB1bHNlWCA9IHRoaXMucG93ZXIgKiBkaXJYO1xuICAgIHZhciBpbXB1bHNlWSA9IHRoaXMucG93ZXIgKiBkaXJZO1xuXG4gICAgdmFyIHZ4ID0gKHRoaXMueFswXSAtIHRoaXMueFsxXSkgLyB0aGlzLmludGVydmFsWzFdO1xuICAgIHZhciB2eSA9ICh0aGlzLnlbMF0gLSB0aGlzLnlbMV0pIC8gdGhpcy5pbnRlcnZhbFsxXTtcblxuICAgIHZhciBkeCA9IHZ4ICogdGhpcy5zbG93RG93biArIGltcHVsc2VYO1xuICAgIHZhciBkeSA9IHZ5ICogdGhpcy5zbG93RG93biArIGltcHVsc2VZO1xuICAgIHZhciBzcGVlZCA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG5cbiAgICBpZiAoc3BlZWQgPiB0aGlzLm1heFNwZWVkKSB7XG4gICAgICBkeCAqPSB0aGlzLm1heFNwZWVkIC8gc3BlZWQ7XG4gICAgICBkeSAqPSB0aGlzLm1heFNwZWVkIC8gc3BlZWQ7XG4gICAgfVxuXG4gICAgdmFyIG5ld1ggPSB0aGlzLnhbMF0gKyBkeCAqIHNlY29uZHM7XG4gICAgdmFyIG5ld1kgPSB0aGlzLnlbMF0gKyBkeSAqIHNlY29uZHM7XG5cbiAgICB0aGlzLmRpc3RhbmNlICs9IHNwZWVkICogc2Vjb25kcztcbiAgICB0aGlzLm1vdmVUbyhuZXdYLCBuZXdZLCBzZWNvbmRzKTtcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBuYW1lOiAnd2FuZGVyaW5nJyxcbiAgcHJvcHM6IHtcbiAgICBnb2FsWDogMCxcbiAgICBnb2FsWTogMFxuICB9LFxuICB1cGRhdGU6IGZ1bmN0aW9uKHNlY29uZHMpIHtcbiAgICB2YXIgeCA9IHRoaXMueFswXTtcbiAgICB2YXIgeSA9IHRoaXMueVswXTtcblxuICAgIHZhciBkeCA9IHRoaXMuZ29hbFggLSB4O1xuICAgIHZhciBkeSA9IHRoaXMuZ29hbFkgLSB5O1xuXG4gICAgaWYgKE1hdGguYWJzKGR4KSA8IDEgJiYgTWF0aC5hYnMoZHkpIDwgMSkge1xuICAgICAgdGhpcy5nb2FsWCA9IHggKyBNYXRoLnJhbmRvbSgpICogMzAwIC0gMTUwO1xuICAgICAgdGhpcy5nb2FsWSA9IHkgKyBNYXRoLnJhbmRvbSgpICogMzAwIC0gMTUwO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBkaXN0YW5jZSA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG4gICAgdmFyIHJhdGlvID0gMSAvIGRpc3RhbmNlO1xuXG4gICAgdGhpcy5kaXJYID0gZHggKiByYXRpbztcbiAgICB0aGlzLmRpclkgPSBkeSAqIHJhdGlvO1xuICB9XG59O1xuIiwiSEFOREpTLmRvTm90UHJvY2Vzc0NTUyA9IHRydWU7XG5cbm1vZHVsZS5leHBvcnRzID0gSm95c3RpY2s7XG5cbmZ1bmN0aW9uIEpveXN0aWNrKGNvbnRhaW5lcikge1xuICB0aGlzLnJlc2l6ZSA9IF8uZGVib3VuY2UodGhpcy5yZXNpemUuYmluZCh0aGlzKSwgNTAwLCB7IGxlYWRpbmc6IHRydWUgfSk7XG5cbiAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gIHRoaXMuZGVhZHpvbmUgPSAwLjE7XG4gIHRoaXMucmVzaXplKCk7XG5cbiAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgdGhpcy5vbkRvd24uYmluZCh0aGlzKSwgZmFsc2UpO1xuICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCB0aGlzLm9uTW92ZS5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCB0aGlzLm9uQ2FuY2VsLmJpbmQodGhpcyksIGZhbHNlKTtcbiAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJvdXQnLCB0aGlzLm9uQ2FuY2VsLmJpbmQodGhpcyksIGZhbHNlKTtcblxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5yZXNpemUpO1xufVxuXG5Kb3lzdGljay5wcm90b3R5cGUucmVzaXplID0gZnVuY3Rpb24oKSB7XG4gIHZhciB3aWR0aCA9IHRoaXMud2lkdGggPSB0aGlzLmNvbnRhaW5lci5jbGllbnRXaWR0aDtcbiAgdmFyIGhlaWdodCA9IHRoaXMuaGVpZ2h0ID0gdGhpcy5jb250YWluZXIuY2xpZW50SGVpZ2h0XG4gIHZhciBwb3J0cmFpdCA9IHdpZHRoIDwgaGVpZ2h0O1xuICB2YXIgbWFyZ2luID0gMzI7XG5cbiAgdGhpcy5yYWRpdXMgPSBNYXRoLm1pbigxMDAsIChwb3J0cmFpdCA/IHdpZHRoIDogaGVpZ2h0KSAqIDAuMyk7XG4gIHRoaXMuY3ggPSBwb3J0cmFpdCA/IHdpZHRoICogMC41IDogbWFyZ2luICsgdGhpcy5yYWRpdXM7XG4gIHRoaXMuY3kgPSBwb3J0cmFpdCA/IGhlaWdodCAtIG1hcmdpbiAtIHRoaXMucmFkaXVzIDogaGVpZ2h0ICogMC41O1xuICB0aGlzLmFuZ2xlID0gMDtcbiAgdGhpcy5tYWduaXR1ZGUgPSAwO1xuICB0aGlzLmN1cnJlbnQgPSB1bmRlZmluZWQ7XG59O1xuXG5Kb3lzdGljay5wcm90b3R5cGUub25Eb3duID0gZnVuY3Rpb24oZSkge1xuICBpZiAodGhpcy5jdXJyZW50KSByZXR1cm47XG5cbiAgdmFyIHBvaW50ZXIgPSB0aGlzLnBvaW50ZXJGcm9tRXZlbnQoZSk7XG5cbiAgdmFyIGR4ID0gcG9pbnRlci54IC0gdGhpcy5jeDtcbiAgdmFyIGR5ID0gcG9pbnRlci55IC0gdGhpcy5jeTtcbiAgdmFyIGRpc3RhbmNlID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcblxuICBpZiAoZGlzdGFuY2UgPiB0aGlzLnJhZGl1cykgcmV0dXJuO1xuXG4gIGUucHJldmVudERlZmF1bHQoKTtcbiAgdGhpcy51cGRhdGVQb2ludGVyKHBvaW50ZXIpO1xufTtcblxuSm95c3RpY2sucHJvdG90eXBlLm9uTW92ZSA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYgKCF0aGlzLmN1cnJlbnQpIHJldHVybjtcblxuICB2YXIgcG9pbnRlciA9IHRoaXMucG9pbnRlckZyb21FdmVudChlKTtcblxuICBpZiAocG9pbnRlci5pZCAhPT0gdGhpcy5jdXJyZW50LmlkKSByZXR1cm47XG5cbiAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICB0aGlzLnVwZGF0ZVBvaW50ZXIocG9pbnRlcik7XG59O1xuXG5Kb3lzdGljay5wcm90b3R5cGUub25DYW5jZWwgPSBmdW5jdGlvbihlKSB7XG4gIGlmICghdGhpcy5jdXJyZW50KSByZXR1cm47XG4gIGlmICh0aGlzLnBvaW50ZXJGcm9tRXZlbnQoZSkuaWQgPT09IHRoaXMuY3VycmVudC5pZCkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICB0aGlzLmNsZWFyUG9pbnRlcigpO1xuICB9XG59O1xuXG5Kb3lzdGljay5wcm90b3R5cGUudXBkYXRlUG9pbnRlciA9IGZ1bmN0aW9uKHBvaW50ZXIpIHtcbiAgdmFyIGR4ID0gcG9pbnRlci54IC0gdGhpcy5jeDtcbiAgdmFyIGR5ID0gcG9pbnRlci55IC0gdGhpcy5jeTtcbiAgdmFyIGRpc3RhbmNlID0gTWF0aC5zcXJ0KGR4ICogZHggKyBkeSAqIGR5KTtcblxuICB0aGlzLmFuZ2xlID0gTWF0aC5hdGFuMihkeSwgZHgpO1xuICB0aGlzLm1hZ25pdHVkZSA9IE1hdGgubWluKDEsIGRpc3RhbmNlIC8gdGhpcy5yYWRpdXMpO1xuICB0aGlzLmN1cnJlbnQgPSBwb2ludGVyO1xufTtcblxuSm95c3RpY2sucHJvdG90eXBlLmNsZWFyUG9pbnRlciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmN1cnJlbnQgPSB1bmRlZmluZWQ7XG4gIHRoaXMuYW5nbGUgPSAwO1xuICB0aGlzLm1hZ25pdHVkZSA9IDA7XG59O1xuXG5Kb3lzdGljay5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICB4OiB0aGlzLmN4LFxuICAgIHk6IHRoaXMuY3ksXG4gICAgcmFkaXVzOiB0aGlzLnJhZGl1c1xuICB9O1xufVxuXG5Kb3lzdGljay5wcm90b3R5cGUuZ2V0WFkgPSBmdW5jdGlvbigpIHtcbiAgdmFyIG1hZ25pdHVkZSA9IHRoaXMubWFnbml0dWRlID4gdGhpcy5kZWFkem9uZSA/IHRoaXMubWFnbml0dWRlIDogMDtcbiAgcmV0dXJuIHtcbiAgICB4OiBNYXRoLmNvcyh0aGlzLmFuZ2xlKSAqIG1hZ25pdHVkZSxcbiAgICB5OiBNYXRoLnNpbih0aGlzLmFuZ2xlKSAqIG1hZ25pdHVkZVxuICB9O1xufTtcblxuSm95c3RpY2sucHJvdG90eXBlLnBvaW50ZXJGcm9tRXZlbnQgPSBmdW5jdGlvbihldmVudCkge1xuICByZXR1cm4ge1xuICAgIGlkOiBldmVudC5wb2ludGVySWQsXG4gICAgeDogZXZlbnQuY2xpZW50WCxcbiAgICB5OiBldmVudC5jbGllbnRZXG4gIH07XG59O1xuIiwiLyogQ29weXJpZ2h0IChjKSAyMDEzLCBCcmFuZG9uIEpvbmVzLCBDb2xpbiBNYWNLZW56aWUgSVYuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG5cblJlZGlzdHJpYnV0aW9uIGFuZCB1c2UgaW4gc291cmNlIGFuZCBiaW5hcnkgZm9ybXMsIHdpdGggb3Igd2l0aG91dCBtb2RpZmljYXRpb24sXG5hcmUgcGVybWl0dGVkIHByb3ZpZGVkIHRoYXQgdGhlIGZvbGxvd2luZyBjb25kaXRpb25zIGFyZSBtZXQ6XG5cbiAgKiBSZWRpc3RyaWJ1dGlvbnMgb2Ygc291cmNlIGNvZGUgbXVzdCByZXRhaW4gdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsIHRoaXNcbiAgICBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lci5cbiAgKiBSZWRpc3RyaWJ1dGlvbnMgaW4gYmluYXJ5IGZvcm0gbXVzdCByZXByb2R1Y2UgdGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UsXG4gICAgdGhpcyBsaXN0IG9mIGNvbmRpdGlvbnMgYW5kIHRoZSBmb2xsb3dpbmcgZGlzY2xhaW1lciBpbiB0aGUgZG9jdW1lbnRhdGlvbiBcbiAgICBhbmQvb3Igb3RoZXIgbWF0ZXJpYWxzIHByb3ZpZGVkIHdpdGggdGhlIGRpc3RyaWJ1dGlvbi5cblxuVEhJUyBTT0ZUV0FSRSBJUyBQUk9WSURFRCBCWSBUSEUgQ09QWVJJR0hUIEhPTERFUlMgQU5EIENPTlRSSUJVVE9SUyBcIkFTIElTXCIgQU5EXG5BTlkgRVhQUkVTUyBPUiBJTVBMSUVEIFdBUlJBTlRJRVMsIElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBUSEUgSU1QTElFRFxuV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFkgQU5EIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFSRSBcbkRJU0NMQUlNRUQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBDT1BZUklHSFQgSE9MREVSIE9SIENPTlRSSUJVVE9SUyBCRSBMSUFCTEUgRk9SXG5BTlkgRElSRUNULCBJTkRJUkVDVCwgSU5DSURFTlRBTCwgU1BFQ0lBTCwgRVhFTVBMQVJZLCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVNcbihJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgUFJPQ1VSRU1FTlQgT0YgU1VCU1RJVFVURSBHT09EUyBPUiBTRVJWSUNFUztcbkxPU1MgT0YgVVNFLCBEQVRBLCBPUiBQUk9GSVRTOyBPUiBCVVNJTkVTUyBJTlRFUlJVUFRJT04pIEhPV0VWRVIgQ0FVU0VEIEFORCBPTlxuQU5ZIFRIRU9SWSBPRiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQ09OVFJBQ1QsIFNUUklDVCBMSUFCSUxJVFksIE9SIFRPUlRcbihJTkNMVURJTkcgTkVHTElHRU5DRSBPUiBPVEhFUldJU0UpIEFSSVNJTkcgSU4gQU5ZIFdBWSBPVVQgT0YgVEhFIFVTRSBPRiBUSElTXG5TT0ZUV0FSRSwgRVZFTiBJRiBBRFZJU0VEIE9GIFRIRSBQT1NTSUJJTElUWSBPRiBTVUNIIERBTUFHRS4gKi9cblxuLyoqXG4gKiBAY2xhc3MgM3gzIE1hdHJpeFxuICogQG5hbWUgbWF0M1xuICovXG52YXIgbWF0MyA9IHt9O1xuXG52YXIgR0xNQVRfQVJSQVlfVFlQRSA9IHJlcXVpcmUoJ2NvbW1vbicpLkdMTUFUX0FSUkFZX1RZUEU7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpZGVudGl0eSBtYXQzXG4gKlxuICogQHJldHVybnMge21hdDN9IGEgbmV3IDN4MyBtYXRyaXhcbiAqL1xubWF0My5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0ID0gbmV3IEdMTUFUX0FSUkFZX1RZUEUoOSk7XG4gICAgb3V0WzBdID0gMTtcbiAgICBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IDA7XG4gICAgb3V0WzNdID0gMDtcbiAgICBvdXRbNF0gPSAxO1xuICAgIG91dFs1XSA9IDA7XG4gICAgb3V0WzZdID0gMDtcbiAgICBvdXRbN10gPSAwO1xuICAgIG91dFs4XSA9IDE7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29waWVzIHRoZSB1cHBlci1sZWZ0IDN4MyB2YWx1ZXMgaW50byB0aGUgZ2l2ZW4gbWF0My5cbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIDN4MyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0NH0gYSAgIHRoZSBzb3VyY2UgNHg0IG1hdHJpeFxuICogQHJldHVybnMge21hdDN9IG91dFxuICovXG5tYXQzLmZyb21NYXQ0ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IGFbMl07XG4gICAgb3V0WzNdID0gYVs0XTtcbiAgICBvdXRbNF0gPSBhWzVdO1xuICAgIG91dFs1XSA9IGFbNl07XG4gICAgb3V0WzZdID0gYVs4XTtcbiAgICBvdXRbN10gPSBhWzldO1xuICAgIG91dFs4XSA9IGFbMTBdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgbWF0MyBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0M30gYSBtYXRyaXggdG8gY2xvbmVcbiAqIEByZXR1cm5zIHttYXQzfSBhIG5ldyAzeDMgbWF0cml4XG4gKi9cbm1hdDMuY2xvbmUgPSBmdW5jdGlvbihhKSB7XG4gICAgdmFyIG91dCA9IG5ldyBHTE1BVF9BUlJBWV9UWVBFKDkpO1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgb3V0WzRdID0gYVs0XTtcbiAgICBvdXRbNV0gPSBhWzVdO1xuICAgIG91dFs2XSA9IGFbNl07XG4gICAgb3V0WzddID0gYVs3XTtcbiAgICBvdXRbOF0gPSBhWzhdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENvcHkgdGhlIHZhbHVlcyBmcm9tIG9uZSBtYXQzIHRvIGFub3RoZXJcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuY29weSA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIG91dFswXSA9IGFbMF07XG4gICAgb3V0WzFdID0gYVsxXTtcbiAgICBvdXRbMl0gPSBhWzJdO1xuICAgIG91dFszXSA9IGFbM107XG4gICAgb3V0WzRdID0gYVs0XTtcbiAgICBvdXRbNV0gPSBhWzVdO1xuICAgIG91dFs2XSA9IGFbNl07XG4gICAgb3V0WzddID0gYVs3XTtcbiAgICBvdXRbOF0gPSBhWzhdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldCBhIG1hdDMgdG8gdGhlIGlkZW50aXR5IG1hdHJpeFxuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuaWRlbnRpdHkgPSBmdW5jdGlvbihvdXQpIHtcbiAgICBvdXRbMF0gPSAxO1xuICAgIG91dFsxXSA9IDA7XG4gICAgb3V0WzJdID0gMDtcbiAgICBvdXRbM10gPSAwO1xuICAgIG91dFs0XSA9IDE7XG4gICAgb3V0WzVdID0gMDtcbiAgICBvdXRbNl0gPSAwO1xuICAgIG91dFs3XSA9IDA7XG4gICAgb3V0WzhdID0gMTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc3Bvc2UgdGhlIHZhbHVlcyBvZiBhIG1hdDNcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMudHJhbnNwb3NlID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgLy8gSWYgd2UgYXJlIHRyYW5zcG9zaW5nIG91cnNlbHZlcyB3ZSBjYW4gc2tpcCBhIGZldyBzdGVwcyBidXQgaGF2ZSB0byBjYWNoZSBzb21lIHZhbHVlc1xuICAgIGlmIChvdXQgPT09IGEpIHtcbiAgICAgICAgdmFyIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sIGExMiA9IGFbNV07XG4gICAgICAgIG91dFsxXSA9IGFbM107XG4gICAgICAgIG91dFsyXSA9IGFbNl07XG4gICAgICAgIG91dFszXSA9IGEwMTtcbiAgICAgICAgb3V0WzVdID0gYVs3XTtcbiAgICAgICAgb3V0WzZdID0gYTAyO1xuICAgICAgICBvdXRbN10gPSBhMTI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgb3V0WzBdID0gYVswXTtcbiAgICAgICAgb3V0WzFdID0gYVszXTtcbiAgICAgICAgb3V0WzJdID0gYVs2XTtcbiAgICAgICAgb3V0WzNdID0gYVsxXTtcbiAgICAgICAgb3V0WzRdID0gYVs0XTtcbiAgICAgICAgb3V0WzVdID0gYVs3XTtcbiAgICAgICAgb3V0WzZdID0gYVsyXTtcbiAgICAgICAgb3V0WzddID0gYVs1XTtcbiAgICAgICAgb3V0WzhdID0gYVs4XTtcbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogSW52ZXJ0cyBhIG1hdDNcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuaW52ZXJ0ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sXG4gICAgICAgIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV0sXG4gICAgICAgIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF0sXG5cbiAgICAgICAgYjAxID0gYTIyICogYTExIC0gYTEyICogYTIxLFxuICAgICAgICBiMTEgPSAtYTIyICogYTEwICsgYTEyICogYTIwLFxuICAgICAgICBiMjEgPSBhMjEgKiBhMTAgLSBhMTEgKiBhMjAsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICAgICAgICBkZXQgPSBhMDAgKiBiMDEgKyBhMDEgKiBiMTEgKyBhMDIgKiBiMjE7XG5cbiAgICBpZiAoIWRldCkgeyBcbiAgICAgICAgcmV0dXJuIG51bGw7IFxuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRbMF0gPSBiMDEgKiBkZXQ7XG4gICAgb3V0WzFdID0gKC1hMjIgKiBhMDEgKyBhMDIgKiBhMjEpICogZGV0O1xuICAgIG91dFsyXSA9IChhMTIgKiBhMDEgLSBhMDIgKiBhMTEpICogZGV0O1xuICAgIG91dFszXSA9IGIxMSAqIGRldDtcbiAgICBvdXRbNF0gPSAoYTIyICogYTAwIC0gYTAyICogYTIwKSAqIGRldDtcbiAgICBvdXRbNV0gPSAoLWExMiAqIGEwMCArIGEwMiAqIGExMCkgKiBkZXQ7XG4gICAgb3V0WzZdID0gYjIxICogZGV0O1xuICAgIG91dFs3XSA9ICgtYTIxICogYTAwICsgYTAxICogYTIwKSAqIGRldDtcbiAgICBvdXRbOF0gPSAoYTExICogYTAwIC0gYTAxICogYTEwKSAqIGRldDtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBhZGp1Z2F0ZSBvZiBhIG1hdDNcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMuYWRqb2ludCA9IGZ1bmN0aW9uKG91dCwgYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLFxuICAgICAgICBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdLFxuICAgICAgICBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdO1xuXG4gICAgb3V0WzBdID0gKGExMSAqIGEyMiAtIGExMiAqIGEyMSk7XG4gICAgb3V0WzFdID0gKGEwMiAqIGEyMSAtIGEwMSAqIGEyMik7XG4gICAgb3V0WzJdID0gKGEwMSAqIGExMiAtIGEwMiAqIGExMSk7XG4gICAgb3V0WzNdID0gKGExMiAqIGEyMCAtIGExMCAqIGEyMik7XG4gICAgb3V0WzRdID0gKGEwMCAqIGEyMiAtIGEwMiAqIGEyMCk7XG4gICAgb3V0WzVdID0gKGEwMiAqIGExMCAtIGEwMCAqIGExMik7XG4gICAgb3V0WzZdID0gKGExMCAqIGEyMSAtIGExMSAqIGEyMCk7XG4gICAgb3V0WzddID0gKGEwMSAqIGEyMCAtIGEwMCAqIGEyMSk7XG4gICAgb3V0WzhdID0gKGEwMCAqIGExMSAtIGEwMSAqIGExMCk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZGV0ZXJtaW5hbnQgb2YgYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBzb3VyY2UgbWF0cml4XG4gKiBAcmV0dXJucyB7TnVtYmVyfSBkZXRlcm1pbmFudCBvZiBhXG4gKi9cbm1hdDMuZGV0ZXJtaW5hbnQgPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLFxuICAgICAgICBhMTAgPSBhWzNdLCBhMTEgPSBhWzRdLCBhMTIgPSBhWzVdLFxuICAgICAgICBhMjAgPSBhWzZdLCBhMjEgPSBhWzddLCBhMjIgPSBhWzhdO1xuXG4gICAgcmV0dXJuIGEwMCAqIChhMjIgKiBhMTEgLSBhMTIgKiBhMjEpICsgYTAxICogKC1hMjIgKiBhMTAgKyBhMTIgKiBhMjApICsgYTAyICogKGEyMSAqIGExMCAtIGExMSAqIGEyMCk7XG59O1xuXG4vKipcbiAqIE11bHRpcGxpZXMgdHdvIG1hdDMnc1xuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7bWF0M30gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My5tdWx0aXBseSA9IGZ1bmN0aW9uIChvdXQsIGEsIGIpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSxcbiAgICAgICAgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XSxcbiAgICAgICAgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XSxcblxuICAgICAgICBiMDAgPSBiWzBdLCBiMDEgPSBiWzFdLCBiMDIgPSBiWzJdLFxuICAgICAgICBiMTAgPSBiWzNdLCBiMTEgPSBiWzRdLCBiMTIgPSBiWzVdLFxuICAgICAgICBiMjAgPSBiWzZdLCBiMjEgPSBiWzddLCBiMjIgPSBiWzhdO1xuXG4gICAgb3V0WzBdID0gYjAwICogYTAwICsgYjAxICogYTEwICsgYjAyICogYTIwO1xuICAgIG91dFsxXSA9IGIwMCAqIGEwMSArIGIwMSAqIGExMSArIGIwMiAqIGEyMTtcbiAgICBvdXRbMl0gPSBiMDAgKiBhMDIgKyBiMDEgKiBhMTIgKyBiMDIgKiBhMjI7XG5cbiAgICBvdXRbM10gPSBiMTAgKiBhMDAgKyBiMTEgKiBhMTAgKyBiMTIgKiBhMjA7XG4gICAgb3V0WzRdID0gYjEwICogYTAxICsgYjExICogYTExICsgYjEyICogYTIxO1xuICAgIG91dFs1XSA9IGIxMCAqIGEwMiArIGIxMSAqIGExMiArIGIxMiAqIGEyMjtcblxuICAgIG91dFs2XSA9IGIyMCAqIGEwMCArIGIyMSAqIGExMCArIGIyMiAqIGEyMDtcbiAgICBvdXRbN10gPSBiMjAgKiBhMDEgKyBiMjEgKiBhMTEgKyBiMjIgKiBhMjE7XG4gICAgb3V0WzhdID0gYjIwICogYTAyICsgYjIxICogYTEyICsgYjIyICogYTIyO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgbWF0My5tdWx0aXBseX1cbiAqIEBmdW5jdGlvblxuICovXG5tYXQzLm11bCA9IG1hdDMubXVsdGlwbHk7XG5cbi8qKlxuICogVHJhbnNsYXRlIGEgbWF0MyBieSB0aGUgZ2l2ZW4gdmVjdG9yXG4gKlxuICogQHBhcmFtIHttYXQzfSBvdXQgdGhlIHJlY2VpdmluZyBtYXRyaXhcbiAqIEBwYXJhbSB7bWF0M30gYSB0aGUgbWF0cml4IHRvIHRyYW5zbGF0ZVxuICogQHBhcmFtIHt2ZWMyfSB2IHZlY3RvciB0byB0cmFuc2xhdGUgYnlcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqL1xubWF0My50cmFuc2xhdGUgPSBmdW5jdGlvbihvdXQsIGEsIHYpIHtcbiAgICB2YXIgYTAwID0gYVswXSwgYTAxID0gYVsxXSwgYTAyID0gYVsyXSxcbiAgICAgICAgYTEwID0gYVszXSwgYTExID0gYVs0XSwgYTEyID0gYVs1XSxcbiAgICAgICAgYTIwID0gYVs2XSwgYTIxID0gYVs3XSwgYTIyID0gYVs4XSxcbiAgICAgICAgeCA9IHZbMF0sIHkgPSB2WzFdO1xuXG4gICAgb3V0WzBdID0gYTAwO1xuICAgIG91dFsxXSA9IGEwMTtcbiAgICBvdXRbMl0gPSBhMDI7XG5cbiAgICBvdXRbM10gPSBhMTA7XG4gICAgb3V0WzRdID0gYTExO1xuICAgIG91dFs1XSA9IGExMjtcblxuICAgIG91dFs2XSA9IHggKiBhMDAgKyB5ICogYTEwICsgYTIwO1xuICAgIG91dFs3XSA9IHggKiBhMDEgKyB5ICogYTExICsgYTIxO1xuICAgIG91dFs4XSA9IHggKiBhMDIgKyB5ICogYTEyICsgYTIyO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJvdGF0ZXMgYSBtYXQzIGJ5IHRoZSBnaXZlbiBhbmdsZVxuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7TnVtYmVyfSByYWQgdGhlIGFuZ2xlIHRvIHJvdGF0ZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKi9cbm1hdDMucm90YXRlID0gZnVuY3Rpb24gKG91dCwgYSwgcmFkKSB7XG4gICAgdmFyIGEwMCA9IGFbMF0sIGEwMSA9IGFbMV0sIGEwMiA9IGFbMl0sXG4gICAgICAgIGExMCA9IGFbM10sIGExMSA9IGFbNF0sIGExMiA9IGFbNV0sXG4gICAgICAgIGEyMCA9IGFbNl0sIGEyMSA9IGFbN10sIGEyMiA9IGFbOF0sXG5cbiAgICAgICAgcyA9IE1hdGguc2luKHJhZCksXG4gICAgICAgIGMgPSBNYXRoLmNvcyhyYWQpO1xuXG4gICAgb3V0WzBdID0gYyAqIGEwMCArIHMgKiBhMTA7XG4gICAgb3V0WzFdID0gYyAqIGEwMSArIHMgKiBhMTE7XG4gICAgb3V0WzJdID0gYyAqIGEwMiArIHMgKiBhMTI7XG5cbiAgICBvdXRbM10gPSBjICogYTEwIC0gcyAqIGEwMDtcbiAgICBvdXRbNF0gPSBjICogYTExIC0gcyAqIGEwMTtcbiAgICBvdXRbNV0gPSBjICogYTEyIC0gcyAqIGEwMjtcblxuICAgIG91dFs2XSA9IGEyMDtcbiAgICBvdXRbN10gPSBhMjE7XG4gICAgb3V0WzhdID0gYTIyO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNjYWxlcyB0aGUgbWF0MyBieSB0aGUgZGltZW5zaW9ucyBpbiB0aGUgZ2l2ZW4gdmVjMlxuICpcbiAqIEBwYXJhbSB7bWF0M30gb3V0IHRoZSByZWNlaXZpbmcgbWF0cml4XG4gKiBAcGFyYW0ge21hdDN9IGEgdGhlIG1hdHJpeCB0byByb3RhdGVcbiAqIEBwYXJhbSB7dmVjMn0gdiB0aGUgdmVjMiB0byBzY2FsZSB0aGUgbWF0cml4IGJ5XG4gKiBAcmV0dXJucyB7bWF0M30gb3V0XG4gKiovXG5tYXQzLnNjYWxlID0gZnVuY3Rpb24ob3V0LCBhLCB2KSB7XG4gICAgdmFyIHggPSB2WzBdLCB5ID0gdlsxXTtcblxuICAgIG91dFswXSA9IHggKiBhWzBdO1xuICAgIG91dFsxXSA9IHggKiBhWzFdO1xuICAgIG91dFsyXSA9IHggKiBhWzJdO1xuXG4gICAgb3V0WzNdID0geSAqIGFbM107XG4gICAgb3V0WzRdID0geSAqIGFbNF07XG4gICAgb3V0WzVdID0geSAqIGFbNV07XG5cbiAgICBvdXRbNl0gPSBhWzZdO1xuICAgIG91dFs3XSA9IGFbN107XG4gICAgb3V0WzhdID0gYVs4XTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBDb3BpZXMgdGhlIHZhbHVlcyBmcm9tIGEgbWF0MmQgaW50byBhIG1hdDNcbiAqXG4gKiBAcGFyYW0ge21hdDN9IG91dCB0aGUgcmVjZWl2aW5nIG1hdHJpeFxuICogQHBhcmFtIHttYXQyZH0gYSB0aGUgbWF0cml4IHRvIGNvcHlcbiAqIEByZXR1cm5zIHttYXQzfSBvdXRcbiAqKi9cbm1hdDMuZnJvbU1hdDJkID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIG91dFsyXSA9IDA7XG5cbiAgICBvdXRbM10gPSBhWzJdO1xuICAgIG91dFs0XSA9IGFbM107XG4gICAgb3V0WzVdID0gMDtcblxuICAgIG91dFs2XSA9IGFbNF07XG4gICAgb3V0WzddID0gYVs1XTtcbiAgICBvdXRbOF0gPSAxO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiogQ2FsY3VsYXRlcyBhIDN4MyBtYXRyaXggZnJvbSB0aGUgZ2l2ZW4gcXVhdGVybmlvblxuKlxuKiBAcGFyYW0ge21hdDN9IG91dCBtYXQzIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4qIEBwYXJhbSB7cXVhdH0gcSBRdWF0ZXJuaW9uIHRvIGNyZWF0ZSBtYXRyaXggZnJvbVxuKlxuKiBAcmV0dXJucyB7bWF0M30gb3V0XG4qL1xubWF0My5mcm9tUXVhdCA9IGZ1bmN0aW9uIChvdXQsIHEpIHtcbiAgICB2YXIgeCA9IHFbMF0sIHkgPSBxWzFdLCB6ID0gcVsyXSwgdyA9IHFbM10sXG4gICAgICAgIHgyID0geCArIHgsXG4gICAgICAgIHkyID0geSArIHksXG4gICAgICAgIHoyID0geiArIHosXG5cbiAgICAgICAgeHggPSB4ICogeDIsXG4gICAgICAgIHl4ID0geSAqIHgyLFxuICAgICAgICB5eSA9IHkgKiB5MixcbiAgICAgICAgenggPSB6ICogeDIsXG4gICAgICAgIHp5ID0geiAqIHkyLFxuICAgICAgICB6eiA9IHogKiB6MixcbiAgICAgICAgd3ggPSB3ICogeDIsXG4gICAgICAgIHd5ID0gdyAqIHkyLFxuICAgICAgICB3eiA9IHcgKiB6MjtcblxuICAgIG91dFswXSA9IDEgLSB5eSAtIHp6O1xuICAgIG91dFszXSA9IHl4IC0gd3o7XG4gICAgb3V0WzZdID0genggKyB3eTtcblxuICAgIG91dFsxXSA9IHl4ICsgd3o7XG4gICAgb3V0WzRdID0gMSAtIHh4IC0geno7XG4gICAgb3V0WzddID0genkgLSB3eDtcblxuICAgIG91dFsyXSA9IHp4IC0gd3k7XG4gICAgb3V0WzVdID0genkgKyB3eDtcbiAgICBvdXRbOF0gPSAxIC0geHggLSB5eTtcblxuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiogQ2FsY3VsYXRlcyBhIDN4MyBub3JtYWwgbWF0cml4ICh0cmFuc3Bvc2UgaW52ZXJzZSkgZnJvbSB0aGUgNHg0IG1hdHJpeFxuKlxuKiBAcGFyYW0ge21hdDN9IG91dCBtYXQzIHJlY2VpdmluZyBvcGVyYXRpb24gcmVzdWx0XG4qIEBwYXJhbSB7bWF0NH0gYSBNYXQ0IHRvIGRlcml2ZSB0aGUgbm9ybWFsIG1hdHJpeCBmcm9tXG4qXG4qIEByZXR1cm5zIHttYXQzfSBvdXRcbiovXG5tYXQzLm5vcm1hbEZyb21NYXQ0ID0gZnVuY3Rpb24gKG91dCwgYSkge1xuICAgIHZhciBhMDAgPSBhWzBdLCBhMDEgPSBhWzFdLCBhMDIgPSBhWzJdLCBhMDMgPSBhWzNdLFxuICAgICAgICBhMTAgPSBhWzRdLCBhMTEgPSBhWzVdLCBhMTIgPSBhWzZdLCBhMTMgPSBhWzddLFxuICAgICAgICBhMjAgPSBhWzhdLCBhMjEgPSBhWzldLCBhMjIgPSBhWzEwXSwgYTIzID0gYVsxMV0sXG4gICAgICAgIGEzMCA9IGFbMTJdLCBhMzEgPSBhWzEzXSwgYTMyID0gYVsxNF0sIGEzMyA9IGFbMTVdLFxuXG4gICAgICAgIGIwMCA9IGEwMCAqIGExMSAtIGEwMSAqIGExMCxcbiAgICAgICAgYjAxID0gYTAwICogYTEyIC0gYTAyICogYTEwLFxuICAgICAgICBiMDIgPSBhMDAgKiBhMTMgLSBhMDMgKiBhMTAsXG4gICAgICAgIGIwMyA9IGEwMSAqIGExMiAtIGEwMiAqIGExMSxcbiAgICAgICAgYjA0ID0gYTAxICogYTEzIC0gYTAzICogYTExLFxuICAgICAgICBiMDUgPSBhMDIgKiBhMTMgLSBhMDMgKiBhMTIsXG4gICAgICAgIGIwNiA9IGEyMCAqIGEzMSAtIGEyMSAqIGEzMCxcbiAgICAgICAgYjA3ID0gYTIwICogYTMyIC0gYTIyICogYTMwLFxuICAgICAgICBiMDggPSBhMjAgKiBhMzMgLSBhMjMgKiBhMzAsXG4gICAgICAgIGIwOSA9IGEyMSAqIGEzMiAtIGEyMiAqIGEzMSxcbiAgICAgICAgYjEwID0gYTIxICogYTMzIC0gYTIzICogYTMxLFxuICAgICAgICBiMTEgPSBhMjIgKiBhMzMgLSBhMjMgKiBhMzIsXG5cbiAgICAgICAgLy8gQ2FsY3VsYXRlIHRoZSBkZXRlcm1pbmFudFxuICAgICAgICBkZXQgPSBiMDAgKiBiMTEgLSBiMDEgKiBiMTAgKyBiMDIgKiBiMDkgKyBiMDMgKiBiMDggLSBiMDQgKiBiMDcgKyBiMDUgKiBiMDY7XG5cbiAgICBpZiAoIWRldCkgeyBcbiAgICAgICAgcmV0dXJuIG51bGw7IFxuICAgIH1cbiAgICBkZXQgPSAxLjAgLyBkZXQ7XG5cbiAgICBvdXRbMF0gPSAoYTExICogYjExIC0gYTEyICogYjEwICsgYTEzICogYjA5KSAqIGRldDtcbiAgICBvdXRbMV0gPSAoYTEyICogYjA4IC0gYTEwICogYjExIC0gYTEzICogYjA3KSAqIGRldDtcbiAgICBvdXRbMl0gPSAoYTEwICogYjEwIC0gYTExICogYjA4ICsgYTEzICogYjA2KSAqIGRldDtcblxuICAgIG91dFszXSA9IChhMDIgKiBiMTAgLSBhMDEgKiBiMTEgLSBhMDMgKiBiMDkpICogZGV0O1xuICAgIG91dFs0XSA9IChhMDAgKiBiMTEgLSBhMDIgKiBiMDggKyBhMDMgKiBiMDcpICogZGV0O1xuICAgIG91dFs1XSA9IChhMDEgKiBiMDggLSBhMDAgKiBiMTAgLSBhMDMgKiBiMDYpICogZGV0O1xuXG4gICAgb3V0WzZdID0gKGEzMSAqIGIwNSAtIGEzMiAqIGIwNCArIGEzMyAqIGIwMykgKiBkZXQ7XG4gICAgb3V0WzddID0gKGEzMiAqIGIwMiAtIGEzMCAqIGIwNSAtIGEzMyAqIGIwMSkgKiBkZXQ7XG4gICAgb3V0WzhdID0gKGEzMCAqIGIwNCAtIGEzMSAqIGIwMiArIGEzMyAqIGIwMCkgKiBkZXQ7XG5cbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBSZXR1cm5zIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgbWF0M1xuICpcbiAqIEBwYXJhbSB7bWF0M30gbWF0IG1hdHJpeCB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgbWF0cml4XG4gKi9cbm1hdDMuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ21hdDMoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcsICcgKyBhWzJdICsgJywgJyArIFxuICAgICAgICAgICAgICAgICAgICBhWzNdICsgJywgJyArIGFbNF0gKyAnLCAnICsgYVs1XSArICcsICcgKyBcbiAgICAgICAgICAgICAgICAgICAgYVs2XSArICcsICcgKyBhWzddICsgJywgJyArIGFbOF0gKyAnKSc7XG59O1xuXG4vKipcbiAqIFJldHVybnMgRnJvYmVuaXVzIG5vcm0gb2YgYSBtYXQzXG4gKlxuICogQHBhcmFtIHttYXQzfSBhIHRoZSBtYXRyaXggdG8gY2FsY3VsYXRlIEZyb2Jlbml1cyBub3JtIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBGcm9iZW5pdXMgbm9ybVxuICovXG5tYXQzLmZyb2IgPSBmdW5jdGlvbiAoYSkge1xuICAgIHJldHVybihNYXRoLnNxcnQoTWF0aC5wb3coYVswXSwgMikgKyBNYXRoLnBvdyhhWzFdLCAyKSArIE1hdGgucG93KGFbMl0sIDIpICsgTWF0aC5wb3coYVszXSwgMikgKyBNYXRoLnBvdyhhWzRdLCAyKSArIE1hdGgucG93KGFbNV0sIDIpICsgTWF0aC5wb3coYVs2XSwgMikgKyBNYXRoLnBvdyhhWzddLCAyKSArIE1hdGgucG93KGFbOF0sIDIpKSlcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gbWF0MzsiLCIvKiBDb3B5cmlnaHQgKGMpIDIwMTMsIEJyYW5kb24gSm9uZXMsIENvbGluIE1hY0tlbnppZSBJVi4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cblxuUmVkaXN0cmlidXRpb24gYW5kIHVzZSBpbiBzb3VyY2UgYW5kIGJpbmFyeSBmb3Jtcywgd2l0aCBvciB3aXRob3V0IG1vZGlmaWNhdGlvbixcbmFyZSBwZXJtaXR0ZWQgcHJvdmlkZWQgdGhhdCB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgYXJlIG1ldDpcblxuICAqIFJlZGlzdHJpYnV0aW9ucyBvZiBzb3VyY2UgY29kZSBtdXN0IHJldGFpbiB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSwgdGhpc1xuICAgIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyLlxuICAqIFJlZGlzdHJpYnV0aW9ucyBpbiBiaW5hcnkgZm9ybSBtdXN0IHJlcHJvZHVjZSB0aGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSxcbiAgICB0aGlzIGxpc3Qgb2YgY29uZGl0aW9ucyBhbmQgdGhlIGZvbGxvd2luZyBkaXNjbGFpbWVyIGluIHRoZSBkb2N1bWVudGF0aW9uIFxuICAgIGFuZC9vciBvdGhlciBtYXRlcmlhbHMgcHJvdmlkZWQgd2l0aCB0aGUgZGlzdHJpYnV0aW9uLlxuXG5USElTIFNPRlRXQVJFIElTIFBST1ZJREVEIEJZIFRIRSBDT1BZUklHSFQgSE9MREVSUyBBTkQgQ09OVFJJQlVUT1JTIFwiQVMgSVNcIiBBTkRcbkFOWSBFWFBSRVNTIE9SIElNUExJRUQgV0FSUkFOVElFUywgSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFRIRSBJTVBMSUVEXG5XQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSBBTkQgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQVJFIFxuRElTQ0xBSU1FRC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIENPUFlSSUdIVCBIT0xERVIgT1IgQ09OVFJJQlVUT1JTIEJFIExJQUJMRSBGT1JcbkFOWSBESVJFQ1QsIElORElSRUNULCBJTkNJREVOVEFMLCBTUEVDSUFMLCBFWEVNUExBUlksIE9SIENPTlNFUVVFTlRJQUwgREFNQUdFU1xuKElOQ0xVRElORywgQlVUIE5PVCBMSU1JVEVEIFRPLCBQUk9DVVJFTUVOVCBPRiBTVUJTVElUVVRFIEdPT0RTIE9SIFNFUlZJQ0VTO1xuTE9TUyBPRiBVU0UsIERBVEEsIE9SIFBST0ZJVFM7IE9SIEJVU0lORVNTIElOVEVSUlVQVElPTikgSE9XRVZFUiBDQVVTRUQgQU5EIE9OXG5BTlkgVEhFT1JZIE9GIExJQUJJTElUWSwgV0hFVEhFUiBJTiBDT05UUkFDVCwgU1RSSUNUIExJQUJJTElUWSwgT1IgVE9SVFxuKElOQ0xVRElORyBORUdMSUdFTkNFIE9SIE9USEVSV0lTRSkgQVJJU0lORyBJTiBBTlkgV0FZIE9VVCBPRiBUSEUgVVNFIE9GIFRISVNcblNPRlRXQVJFLCBFVkVOIElGIEFEVklTRUQgT0YgVEhFIFBPU1NJQklMSVRZIE9GIFNVQ0ggREFNQUdFLiAqL1xuXG5pZighR0xNQVRfRVBTSUxPTikge1xuICAgIHZhciBHTE1BVF9FUFNJTE9OID0gMC4wMDAwMDE7XG59XG5cbmlmKCFHTE1BVF9BUlJBWV9UWVBFKSB7XG4gICAgdmFyIEdMTUFUX0FSUkFZX1RZUEUgPSAodHlwZW9mIEZsb2F0MzJBcnJheSAhPT0gJ3VuZGVmaW5lZCcpID8gRmxvYXQzMkFycmF5IDogQXJyYXk7XG59XG5cbmlmKCFHTE1BVF9SQU5ET00pIHtcbiAgICB2YXIgR0xNQVRfUkFORE9NID0gTWF0aC5yYW5kb207XG59XG5cbi8qKlxuICogQGNsYXNzIENvbW1vbiB1dGlsaXRpZXNcbiAqIEBuYW1lIGdsTWF0cml4XG4gKi9cbnZhciBnbE1hdHJpeCA9IHt9O1xuXG4vKipcbiAqIFNldHMgdGhlIHR5cGUgb2YgYXJyYXkgdXNlZCB3aGVuIGNyZWF0aW5nIG5ldyB2ZWN0b3JzIGFuZCBtYXRyaWNpZXNcbiAqXG4gKiBAcGFyYW0ge1R5cGV9IHR5cGUgQXJyYXkgdHlwZSwgc3VjaCBhcyBGbG9hdDMyQXJyYXkgb3IgQXJyYXlcbiAqL1xuZ2xNYXRyaXguc2V0TWF0cml4QXJyYXlUeXBlID0gZnVuY3Rpb24odHlwZSkge1xuICAgIEdMTUFUX0FSUkFZX1RZUEUgPSB0eXBlO1xufVxuXG5cbnZhciBkZWdyZWUgPSBNYXRoLlBJIC8gMTgwO1xuXG4vKipcbiogQ29udmVydCBEZWdyZWUgVG8gUmFkaWFuXG4qXG4qIEBwYXJhbSB7TnVtYmVyfSBBbmdsZSBpbiBEZWdyZWVzXG4qL1xuZ2xNYXRyaXgudG9SYWRpYW4gPSBmdW5jdGlvbihhKXtcbiAgICAgcmV0dXJuIGEgKiBkZWdyZWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBHTE1BVF9FUFNJTE9OIDogR0xNQVRfRVBTSUxPTixcbiAgR0xNQVRfQVJSQVlfVFlQRSA6IEdMTUFUX0FSUkFZX1RZUEUsXG4gIEdMTUFUX1JBTkRPTSA6IEdMTUFUX1JBTkRPTSxcbiAgZ2xNYXRyaXggOiBnbE1hdHJpeFxufTtcbiIsIi8qIENvcHlyaWdodCAoYykgMjAxMywgQnJhbmRvbiBKb25lcywgQ29saW4gTWFjS2VuemllIElWLiBBbGwgcmlnaHRzIHJlc2VydmVkLlxuXG5SZWRpc3RyaWJ1dGlvbiBhbmQgdXNlIGluIHNvdXJjZSBhbmQgYmluYXJ5IGZvcm1zLCB3aXRoIG9yIHdpdGhvdXQgbW9kaWZpY2F0aW9uLFxuYXJlIHBlcm1pdHRlZCBwcm92aWRlZCB0aGF0IHRoZSBmb2xsb3dpbmcgY29uZGl0aW9ucyBhcmUgbWV0OlxuXG4gICogUmVkaXN0cmlidXRpb25zIG9mIHNvdXJjZSBjb2RlIG11c3QgcmV0YWluIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLCB0aGlzXG4gICAgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIuXG4gICogUmVkaXN0cmlidXRpb25zIGluIGJpbmFyeSBmb3JtIG11c3QgcmVwcm9kdWNlIHRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlLFxuICAgIHRoaXMgbGlzdCBvZiBjb25kaXRpb25zIGFuZCB0aGUgZm9sbG93aW5nIGRpc2NsYWltZXIgaW4gdGhlIGRvY3VtZW50YXRpb24gXG4gICAgYW5kL29yIG90aGVyIG1hdGVyaWFscyBwcm92aWRlZCB3aXRoIHRoZSBkaXN0cmlidXRpb24uXG5cblRISVMgU09GVFdBUkUgSVMgUFJPVklERUQgQlkgVEhFIENPUFlSSUdIVCBIT0xERVJTIEFORCBDT05UUklCVVRPUlMgXCJBUyBJU1wiIEFORFxuQU5ZIEVYUFJFU1MgT1IgSU1QTElFRCBXQVJSQU5USUVTLCBJTkNMVURJTkcsIEJVVCBOT1QgTElNSVRFRCBUTywgVEhFIElNUExJRURcbldBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZIEFORCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBUkUgXG5ESVNDTEFJTUVELiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQ09QWVJJR0hUIEhPTERFUiBPUiBDT05UUklCVVRPUlMgQkUgTElBQkxFIEZPUlxuQU5ZIERJUkVDVCwgSU5ESVJFQ1QsIElOQ0lERU5UQUwsIFNQRUNJQUwsIEVYRU1QTEFSWSwgT1IgQ09OU0VRVUVOVElBTCBEQU1BR0VTXG4oSU5DTFVESU5HLCBCVVQgTk9UIExJTUlURUQgVE8sIFBST0NVUkVNRU5UIE9GIFNVQlNUSVRVVEUgR09PRFMgT1IgU0VSVklDRVM7XG5MT1NTIE9GIFVTRSwgREFUQSwgT1IgUFJPRklUUzsgT1IgQlVTSU5FU1MgSU5URVJSVVBUSU9OKSBIT1dFVkVSIENBVVNFRCBBTkQgT05cbkFOWSBUSEVPUlkgT0YgTElBQklMSVRZLCBXSEVUSEVSIElOIENPTlRSQUNULCBTVFJJQ1QgTElBQklMSVRZLCBPUiBUT1JUXG4oSU5DTFVESU5HIE5FR0xJR0VOQ0UgT1IgT1RIRVJXSVNFKSBBUklTSU5HIElOIEFOWSBXQVkgT1VUIE9GIFRIRSBVU0UgT0YgVEhJU1xuU09GVFdBUkUsIEVWRU4gSUYgQURWSVNFRCBPRiBUSEUgUE9TU0lCSUxJVFkgT0YgU1VDSCBEQU1BR0UuICovXG5cbi8qKlxuICogQGNsYXNzIDIgRGltZW5zaW9uYWwgVmVjdG9yXG4gKiBAbmFtZSB2ZWMyXG4gKi9cbnZhciB2ZWMyID0ge307XG5cbnZhciBHTE1BVF9BUlJBWV9UWVBFID0gcmVxdWlyZSgnY29tbW9uJykuR0xNQVRfQVJSQVlfVFlQRTtcbnZhciBHTE1BVF9SQU5ET00gPSByZXF1aXJlKCdjb21tb24nKS5HTE1BVF9SQU5ET007XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldywgZW1wdHkgdmVjMlxuICpcbiAqIEByZXR1cm5zIHt2ZWMyfSBhIG5ldyAyRCB2ZWN0b3JcbiAqL1xudmVjMi5jcmVhdGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgb3V0ID0gbmV3IEdMTUFUX0FSUkFZX1RZUEUoMik7XG4gICAgb3V0WzBdID0gMDtcbiAgICBvdXRbMV0gPSAwO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdmVjMiBpbml0aWFsaXplZCB3aXRoIHZhbHVlcyBmcm9tIGFuIGV4aXN0aW5nIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gY2xvbmVcbiAqIEByZXR1cm5zIHt2ZWMyfSBhIG5ldyAyRCB2ZWN0b3JcbiAqL1xudmVjMi5jbG9uZSA9IGZ1bmN0aW9uKGEpIHtcbiAgICB2YXIgb3V0ID0gbmV3IEdMTUFUX0FSUkFZX1RZUEUoMik7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBuZXcgdmVjMiBpbml0aWFsaXplZCB3aXRoIHRoZSBnaXZlbiB2YWx1ZXNcbiAqXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEByZXR1cm5zIHt2ZWMyfSBhIG5ldyAyRCB2ZWN0b3JcbiAqL1xudmVjMi5mcm9tVmFsdWVzID0gZnVuY3Rpb24oeCwgeSkge1xuICAgIHZhciBvdXQgPSBuZXcgR0xNQVRfQVJSQVlfVFlQRSgyKTtcbiAgICBvdXRbMF0gPSB4O1xuICAgIG91dFsxXSA9IHk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ29weSB0aGUgdmFsdWVzIGZyb20gb25lIHZlYzIgdG8gYW5vdGhlclxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHNvdXJjZSB2ZWN0b3JcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5jb3B5ID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgb3V0WzBdID0gYVswXTtcbiAgICBvdXRbMV0gPSBhWzFdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFNldCB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzIgdG8gdGhlIGdpdmVuIHZhbHVlc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge051bWJlcn0geCBYIGNvbXBvbmVudFxuICogQHBhcmFtIHtOdW1iZXJ9IHkgWSBjb21wb25lbnRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5zZXQgPSBmdW5jdGlvbihvdXQsIHgsIHkpIHtcbiAgICBvdXRbMF0gPSB4O1xuICAgIG91dFsxXSA9IHk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWRkcyB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLmFkZCA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKyBiWzBdO1xuICAgIG91dFsxXSA9IGFbMV0gKyBiWzFdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFN1YnRyYWN0cyB2ZWN0b3IgYiBmcm9tIHZlY3RvciBhXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnN1YnRyYWN0ID0gZnVuY3Rpb24ob3V0LCBhLCBiKSB7XG4gICAgb3V0WzBdID0gYVswXSAtIGJbMF07XG4gICAgb3V0WzFdID0gYVsxXSAtIGJbMV07XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLnN1YnRyYWN0fVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIuc3ViID0gdmVjMi5zdWJ0cmFjdDtcblxuLyoqXG4gKiBNdWx0aXBsaWVzIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIubXVsdGlwbHkgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdICogYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdICogYlsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIubXVsdGlwbHl9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMi5tdWwgPSB2ZWMyLm11bHRpcGx5O1xuXG4vKipcbiAqIERpdmlkZXMgdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5kaXZpZGUgPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBhWzBdIC8gYlswXTtcbiAgICBvdXRbMV0gPSBhWzFdIC8gYlsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBBbGlhcyBmb3Ige0BsaW5rIHZlYzIuZGl2aWRlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIuZGl2ID0gdmVjMi5kaXZpZGU7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbWluaW11bSBvZiB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLm1pbiA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IE1hdGgubWluKGFbMF0sIGJbMF0pO1xuICAgIG91dFsxXSA9IE1hdGgubWluKGFbMV0sIGJbMV0pO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIG1heGltdW0gb2YgdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5tYXggPSBmdW5jdGlvbihvdXQsIGEsIGIpIHtcbiAgICBvdXRbMF0gPSBNYXRoLm1heChhWzBdLCBiWzBdKTtcbiAgICBvdXRbMV0gPSBNYXRoLm1heChhWzFdLCBiWzFdKTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBTY2FsZXMgYSB2ZWMyIGJ5IGEgc2NhbGFyIG51bWJlclxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byBzY2FsZVxuICogQHBhcmFtIHtOdW1iZXJ9IGIgYW1vdW50IHRvIHNjYWxlIHRoZSB2ZWN0b3IgYnlcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5zY2FsZSA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIG91dFswXSA9IGFbMF0gKiBiO1xuICAgIG91dFsxXSA9IGFbMV0gKiBiO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIEFkZHMgdHdvIHZlYzIncyBhZnRlciBzY2FsaW5nIHRoZSBzZWNvbmQgb3BlcmFuZCBieSBhIHNjYWxhciB2YWx1ZVxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEBwYXJhbSB7TnVtYmVyfSBzY2FsZSB0aGUgYW1vdW50IHRvIHNjYWxlIGIgYnkgYmVmb3JlIGFkZGluZ1xuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnNjYWxlQW5kQWRkID0gZnVuY3Rpb24ob3V0LCBhLCBiLCBzY2FsZSkge1xuICAgIG91dFswXSA9IGFbMF0gKyAoYlswXSAqIHNjYWxlKTtcbiAgICBvdXRbMV0gPSBhWzFdICsgKGJbMV0gKiBzY2FsZSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZXVjbGlkaWFuIGRpc3RhbmNlIGJldHdlZW4gdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gZGlzdGFuY2UgYmV0d2VlbiBhIGFuZCBiXG4gKi9cbnZlYzIuZGlzdGFuY2UgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgdmFyIHggPSBiWzBdIC0gYVswXSxcbiAgICAgICAgeSA9IGJbMV0gLSBhWzFdO1xuICAgIHJldHVybiBNYXRoLnNxcnQoeCp4ICsgeSp5KTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLmRpc3RhbmNlfVxuICogQGZ1bmN0aW9uXG4gKi9cbnZlYzIuZGlzdCA9IHZlYzIuZGlzdGFuY2U7XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgc3F1YXJlZCBldWNsaWRpYW4gZGlzdGFuY2UgYmV0d2VlbiB0d28gdmVjMidzXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBzcXVhcmVkIGRpc3RhbmNlIGJldHdlZW4gYSBhbmQgYlxuICovXG52ZWMyLnNxdWFyZWREaXN0YW5jZSA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICB2YXIgeCA9IGJbMF0gLSBhWzBdLFxuICAgICAgICB5ID0gYlsxXSAtIGFbMV07XG4gICAgcmV0dXJuIHgqeCArIHkqeTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLnNxdWFyZWREaXN0YW5jZX1cbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLnNxckRpc3QgPSB2ZWMyLnNxdWFyZWREaXN0YW5jZTtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBsZW5ndGggb2YgYSB2ZWMyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBhIHZlY3RvciB0byBjYWxjdWxhdGUgbGVuZ3RoIG9mXG4gKiBAcmV0dXJucyB7TnVtYmVyfSBsZW5ndGggb2YgYVxuICovXG52ZWMyLmxlbmd0aCA9IGZ1bmN0aW9uIChhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXTtcbiAgICByZXR1cm4gTWF0aC5zcXJ0KHgqeCArIHkqeSk7XG59O1xuXG4vKipcbiAqIEFsaWFzIGZvciB7QGxpbmsgdmVjMi5sZW5ndGh9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMi5sZW4gPSB2ZWMyLmxlbmd0aDtcblxuLyoqXG4gKiBDYWxjdWxhdGVzIHRoZSBzcXVhcmVkIGxlbmd0aCBvZiBhIHZlYzJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdmVjdG9yIHRvIGNhbGN1bGF0ZSBzcXVhcmVkIGxlbmd0aCBvZlxuICogQHJldHVybnMge051bWJlcn0gc3F1YXJlZCBsZW5ndGggb2YgYVxuICovXG52ZWMyLnNxdWFyZWRMZW5ndGggPSBmdW5jdGlvbiAoYSkge1xuICAgIHZhciB4ID0gYVswXSxcbiAgICAgICAgeSA9IGFbMV07XG4gICAgcmV0dXJuIHgqeCArIHkqeTtcbn07XG5cbi8qKlxuICogQWxpYXMgZm9yIHtAbGluayB2ZWMyLnNxdWFyZWRMZW5ndGh9XG4gKiBAZnVuY3Rpb25cbiAqL1xudmVjMi5zcXJMZW4gPSB2ZWMyLnNxdWFyZWRMZW5ndGg7XG5cbi8qKlxuICogTmVnYXRlcyB0aGUgY29tcG9uZW50cyBvZiBhIHZlYzJcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHZlY3RvciB0byBuZWdhdGVcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5uZWdhdGUgPSBmdW5jdGlvbihvdXQsIGEpIHtcbiAgICBvdXRbMF0gPSAtYVswXTtcbiAgICBvdXRbMV0gPSAtYVsxXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBOb3JtYWxpemUgYSB2ZWMyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB2ZWN0b3IgdG8gbm9ybWFsaXplXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIubm9ybWFsaXplID0gZnVuY3Rpb24ob3V0LCBhKSB7XG4gICAgdmFyIHggPSBhWzBdLFxuICAgICAgICB5ID0gYVsxXTtcbiAgICB2YXIgbGVuID0geCp4ICsgeSp5O1xuICAgIGlmIChsZW4gPiAwKSB7XG4gICAgICAgIC8vVE9ETzogZXZhbHVhdGUgdXNlIG9mIGdsbV9pbnZzcXJ0IGhlcmU/XG4gICAgICAgIGxlbiA9IDEgLyBNYXRoLnNxcnQobGVuKTtcbiAgICAgICAgb3V0WzBdID0gYVswXSAqIGxlbjtcbiAgICAgICAgb3V0WzFdID0gYVsxXSAqIGxlbjtcbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogQ2FsY3VsYXRlcyB0aGUgZG90IHByb2R1Y3Qgb2YgdHdvIHZlYzInc1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgZmlyc3Qgb3BlcmFuZFxuICogQHBhcmFtIHt2ZWMyfSBiIHRoZSBzZWNvbmQgb3BlcmFuZFxuICogQHJldHVybnMge051bWJlcn0gZG90IHByb2R1Y3Qgb2YgYSBhbmQgYlxuICovXG52ZWMyLmRvdCA9IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgcmV0dXJuIGFbMF0gKiBiWzBdICsgYVsxXSAqIGJbMV07XG59O1xuXG4vKipcbiAqIENvbXB1dGVzIHRoZSBjcm9zcyBwcm9kdWN0IG9mIHR3byB2ZWMyJ3NcbiAqIE5vdGUgdGhhdCB0aGUgY3Jvc3MgcHJvZHVjdCBtdXN0IGJ5IGRlZmluaXRpb24gcHJvZHVjZSBhIDNEIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7dmVjM30gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIGZpcnN0IG9wZXJhbmRcbiAqIEBwYXJhbSB7dmVjMn0gYiB0aGUgc2Vjb25kIG9wZXJhbmRcbiAqIEByZXR1cm5zIHt2ZWMzfSBvdXRcbiAqL1xudmVjMi5jcm9zcyA9IGZ1bmN0aW9uKG91dCwgYSwgYikge1xuICAgIHZhciB6ID0gYVswXSAqIGJbMV0gLSBhWzFdICogYlswXTtcbiAgICBvdXRbMF0gPSBvdXRbMV0gPSAwO1xuICAgIG91dFsyXSA9IHo7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogUGVyZm9ybXMgYSBsaW5lYXIgaW50ZXJwb2xhdGlvbiBiZXR3ZWVuIHR3byB2ZWMyJ3NcbiAqXG4gKiBAcGFyYW0ge3ZlYzJ9IG91dCB0aGUgcmVjZWl2aW5nIHZlY3RvclxuICogQHBhcmFtIHt2ZWMyfSBhIHRoZSBmaXJzdCBvcGVyYW5kXG4gKiBAcGFyYW0ge3ZlYzJ9IGIgdGhlIHNlY29uZCBvcGVyYW5kXG4gKiBAcGFyYW0ge051bWJlcn0gdCBpbnRlcnBvbGF0aW9uIGFtb3VudCBiZXR3ZWVuIHRoZSB0d28gaW5wdXRzXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIubGVycCA9IGZ1bmN0aW9uIChvdXQsIGEsIGIsIHQpIHtcbiAgICB2YXIgYXggPSBhWzBdLFxuICAgICAgICBheSA9IGFbMV07XG4gICAgb3V0WzBdID0gYXggKyB0ICogKGJbMF0gLSBheCk7XG4gICAgb3V0WzFdID0gYXkgKyB0ICogKGJbMV0gLSBheSk7XG4gICAgcmV0dXJuIG91dDtcbn07XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgcmFuZG9tIHZlY3RvciB3aXRoIHRoZSBnaXZlbiBzY2FsZVxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge051bWJlcn0gW3NjYWxlXSBMZW5ndGggb2YgdGhlIHJlc3VsdGluZyB2ZWN0b3IuIElmIG9tbWl0dGVkLCBhIHVuaXQgdmVjdG9yIHdpbGwgYmUgcmV0dXJuZWRcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi5yYW5kb20gPSBmdW5jdGlvbiAob3V0LCBzY2FsZSkge1xuICAgIHNjYWxlID0gc2NhbGUgfHwgMS4wO1xuICAgIHZhciByID0gR0xNQVRfUkFORE9NKCkgKiAyLjAgKiBNYXRoLlBJO1xuICAgIG91dFswXSA9IE1hdGguY29zKHIpICogc2NhbGU7XG4gICAgb3V0WzFdID0gTWF0aC5zaW4ocikgKiBzY2FsZTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMyIHdpdGggYSBtYXQyXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHttYXQyfSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnRyYW5zZm9ybU1hdDIgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIG91dFswXSA9IG1bMF0gKiB4ICsgbVsyXSAqIHk7XG4gICAgb3V0WzFdID0gbVsxXSAqIHggKyBtWzNdICogeTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBUcmFuc2Zvcm1zIHRoZSB2ZWMyIHdpdGggYSBtYXQyZFxuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0MmR9IG0gbWF0cml4IHRvIHRyYW5zZm9ybSB3aXRoXG4gKiBAcmV0dXJucyB7dmVjMn0gb3V0XG4gKi9cbnZlYzIudHJhbnNmb3JtTWF0MmQgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIG91dFswXSA9IG1bMF0gKiB4ICsgbVsyXSAqIHkgKyBtWzRdO1xuICAgIG91dFsxXSA9IG1bMV0gKiB4ICsgbVszXSAqIHkgKyBtWzVdO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzIgd2l0aCBhIG1hdDNcbiAqIDNyZCB2ZWN0b3IgY29tcG9uZW50IGlzIGltcGxpY2l0bHkgJzEnXG4gKlxuICogQHBhcmFtIHt2ZWMyfSBvdXQgdGhlIHJlY2VpdmluZyB2ZWN0b3JcbiAqIEBwYXJhbSB7dmVjMn0gYSB0aGUgdmVjdG9yIHRvIHRyYW5zZm9ybVxuICogQHBhcmFtIHttYXQzfSBtIG1hdHJpeCB0byB0cmFuc2Zvcm0gd2l0aFxuICogQHJldHVybnMge3ZlYzJ9IG91dFxuICovXG52ZWMyLnRyYW5zZm9ybU1hdDMgPSBmdW5jdGlvbihvdXQsIGEsIG0pIHtcbiAgICB2YXIgeCA9IGFbMF0sXG4gICAgICAgIHkgPSBhWzFdO1xuICAgIG91dFswXSA9IG1bMF0gKiB4ICsgbVszXSAqIHkgKyBtWzZdO1xuICAgIG91dFsxXSA9IG1bMV0gKiB4ICsgbVs0XSAqIHkgKyBtWzddO1xuICAgIHJldHVybiBvdXQ7XG59O1xuXG4vKipcbiAqIFRyYW5zZm9ybXMgdGhlIHZlYzIgd2l0aCBhIG1hdDRcbiAqIDNyZCB2ZWN0b3IgY29tcG9uZW50IGlzIGltcGxpY2l0bHkgJzAnXG4gKiA0dGggdmVjdG9yIGNvbXBvbmVudCBpcyBpbXBsaWNpdGx5ICcxJ1xuICpcbiAqIEBwYXJhbSB7dmVjMn0gb3V0IHRoZSByZWNlaXZpbmcgdmVjdG9yXG4gKiBAcGFyYW0ge3ZlYzJ9IGEgdGhlIHZlY3RvciB0byB0cmFuc2Zvcm1cbiAqIEBwYXJhbSB7bWF0NH0gbSBtYXRyaXggdG8gdHJhbnNmb3JtIHdpdGhcbiAqIEByZXR1cm5zIHt2ZWMyfSBvdXRcbiAqL1xudmVjMi50cmFuc2Zvcm1NYXQ0ID0gZnVuY3Rpb24ob3V0LCBhLCBtKSB7XG4gICAgdmFyIHggPSBhWzBdLCBcbiAgICAgICAgeSA9IGFbMV07XG4gICAgb3V0WzBdID0gbVswXSAqIHggKyBtWzRdICogeSArIG1bMTJdO1xuICAgIG91dFsxXSA9IG1bMV0gKiB4ICsgbVs1XSAqIHkgKyBtWzEzXTtcbiAgICByZXR1cm4gb3V0O1xufTtcblxuLyoqXG4gKiBQZXJmb3JtIHNvbWUgb3BlcmF0aW9uIG92ZXIgYW4gYXJyYXkgb2YgdmVjMnMuXG4gKlxuICogQHBhcmFtIHtBcnJheX0gYSB0aGUgYXJyYXkgb2YgdmVjdG9ycyB0byBpdGVyYXRlIG92ZXJcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdHJpZGUgTnVtYmVyIG9mIGVsZW1lbnRzIGJldHdlZW4gdGhlIHN0YXJ0IG9mIGVhY2ggdmVjMi4gSWYgMCBhc3N1bWVzIHRpZ2h0bHkgcGFja2VkXG4gKiBAcGFyYW0ge051bWJlcn0gb2Zmc2V0IE51bWJlciBvZiBlbGVtZW50cyB0byBza2lwIGF0IHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFycmF5XG4gKiBAcGFyYW0ge051bWJlcn0gY291bnQgTnVtYmVyIG9mIHZlYzJzIHRvIGl0ZXJhdGUgb3Zlci4gSWYgMCBpdGVyYXRlcyBvdmVyIGVudGlyZSBhcnJheVxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRnVuY3Rpb24gdG8gY2FsbCBmb3IgZWFjaCB2ZWN0b3IgaW4gdGhlIGFycmF5XG4gKiBAcGFyYW0ge09iamVjdH0gW2FyZ10gYWRkaXRpb25hbCBhcmd1bWVudCB0byBwYXNzIHRvIGZuXG4gKiBAcmV0dXJucyB7QXJyYXl9IGFcbiAqIEBmdW5jdGlvblxuICovXG52ZWMyLmZvckVhY2ggPSAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZlYyA9IHZlYzIuY3JlYXRlKCk7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oYSwgc3RyaWRlLCBvZmZzZXQsIGNvdW50LCBmbiwgYXJnKSB7XG4gICAgICAgIHZhciBpLCBsO1xuICAgICAgICBpZighc3RyaWRlKSB7XG4gICAgICAgICAgICBzdHJpZGUgPSAyO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIW9mZnNldCkge1xuICAgICAgICAgICAgb2Zmc2V0ID0gMDtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYoY291bnQpIHtcbiAgICAgICAgICAgIGwgPSBNYXRoLm1pbigoY291bnQgKiBzdHJpZGUpICsgb2Zmc2V0LCBhLmxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsID0gYS5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IoaSA9IG9mZnNldDsgaSA8IGw7IGkgKz0gc3RyaWRlKSB7XG4gICAgICAgICAgICB2ZWNbMF0gPSBhW2ldOyB2ZWNbMV0gPSBhW2krMV07XG4gICAgICAgICAgICBmbih2ZWMsIHZlYywgYXJnKTtcbiAgICAgICAgICAgIGFbaV0gPSB2ZWNbMF07IGFbaSsxXSA9IHZlY1sxXTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGE7XG4gICAgfTtcbn0pKCk7XG5cbi8qKlxuICogUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBhIHZlY3RvclxuICpcbiAqIEBwYXJhbSB7dmVjMn0gdmVjIHZlY3RvciB0byByZXByZXNlbnQgYXMgYSBzdHJpbmdcbiAqIEByZXR1cm5zIHtTdHJpbmd9IHN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgdmVjdG9yXG4gKi9cbnZlYzIuc3RyID0gZnVuY3Rpb24gKGEpIHtcbiAgICByZXR1cm4gJ3ZlYzIoJyArIGFbMF0gKyAnLCAnICsgYVsxXSArICcpJztcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gdmVjMjtcblxuIl19
