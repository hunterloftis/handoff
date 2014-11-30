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
  var ul = vec3.set(vec3.create(), 0, 0, 1);
  var lr = vec3.set(vec3.create(), this.width, this.height, 1);
  mat3.invert(m, m);
  vec3.transformMat3(ul, ul, m);
  vec3.transformMat3(lr, lr, m);
  return {
    left: ul[0],
    top: ul[1],
    right: lr[0],
    bottom: lr[1]
  };
};

},{"./web-gl":"/Users/hloftis/code/handoff/lib/blit/web-gl.js"}],"/Users/hloftis/code/handoff/lib/blit/web-gl.js":[function(require,module,exports){
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

},{}]},{},["/Users/hloftis/code/handoff/index.js"])("/Users/hloftis/code/handoff/index.js")
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9ibGl0LXJlbmRlcmVyL2NhbWVyYS5qcyIsImxpYi9ibGl0LXJlbmRlcmVyL2luZGV4LmpzIiwibGliL2JsaXQtcmVuZGVyZXIvam95c3RpY2suanMiLCJsaWIvYmxpdC1yZW5kZXJlci90ZXJyYWluLmpzIiwibGliL2JsaXQvaW5kZXguanMiLCJsaWIvYmxpdC9zcHJpdGUuanMiLCJsaWIvYmxpdC9zdXJmYWNlLmpzIiwibGliL2JsaXQvd2ViLWdsLmpzIiwibGliL2VzeXN0ZW0vZW50aXR5LmpzIiwibGliL2VzeXN0ZW0vZ3JvdXAuanMiLCJsaWIvZXN5c3RlbS9pbmRleC5qcyIsImxpYi9lc3lzdGVtL3N5c3RlbS5qcyIsImxpYi9nYW1lLmpzIiwibGliL2xvb3AvbG9vcC5qcyIsImxpYi9zeXN0ZW1zL2NvbnRyb2xsYWJsZS5qcyIsImxpYi9zeXN0ZW1zL2R1ZGUuanMiLCJsaWIvc3lzdGVtcy9qb3lzdGljay5qcyIsImxpYi9zeXN0ZW1zL2xldmVsLmpzIiwibGliL3N5c3RlbXMvcGxheWVyLmpzIiwibGliL3N5c3RlbXMvcG9zaXRpb24uanMiLCJsaWIvc3lzdGVtcy93YWxraW5nLmpzIiwibGliL3N5c3RlbXMvd2FuZGVyaW5nLmpzIiwibGliL3RvdWNoL2pveXN0aWNrLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9HQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBSZW5kZXJlcjogcmVxdWlyZSgnLi9saWIvYmxpdC1yZW5kZXJlcicpLFxuICBKb3lzdGljazogcmVxdWlyZSgnLi9saWIvdG91Y2gvam95c3RpY2snKSxcbiAgR2FtZTogcmVxdWlyZSgnLi9saWIvZ2FtZScpXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBDYW1lcmE7XG5cbmZ1bmN0aW9uIENhbWVyYShjb250YWluZXIpIHtcbiAgdGhpcy54ID0gMDtcbiAgdGhpcy55ID0gMDtcblxuICB0aGlzLmJhc2Vab29tID0gMjtcbiAgdGhpcy50cmFpbCA9IDAuMztcbiAgdGhpcy5saWZ0ID0gNTA7XG4gIHRoaXMuem9vbU91dCA9IDAuMDAyO1xuICB0aGlzLmRyYWcgPSAwLjE7XG4gIHRoaXMucHJvamVjdGlvbiA9IDAuNjc7XG4gIHRoaXMub2Zmc2V0WCA9IDA7XG4gIHRoaXMub2Zmc2V0WSA9IDA7XG5cbiAgdGhpcy56b29tID0gMTtcbiAgdGhpcy50YXJnZXRYID0gMDtcbiAgdGhpcy50YXJnZXRZID0gMDtcbiAgdGhpcy5sYXN0VGFyZ2V0WCA9IDA7XG4gIHRoaXMubGFzdFRhcmdldFkgPSAwO1xufVxuXG5DYW1lcmEucHJvdG90eXBlLmxlYWRUYXJnZXQgPSBmdW5jdGlvbihzZWNvbmRzLCB0YXJnZXQpIHtcbiAgdmFyIHByb2plY3RlZFggPSB0YXJnZXQucHggKyB0YXJnZXQudnggKiB0aGlzLnByb2plY3Rpb247XG4gIHZhciBwcm9qZWN0ZWRZID0gdGFyZ2V0LnB5ICsgdGFyZ2V0LnZ5ICogdGhpcy5wcm9qZWN0aW9uO1xuICB2YXIgZHggPSBwcm9qZWN0ZWRYIC0gdGhpcy50YXJnZXRYO1xuICB2YXIgZHkgPSBwcm9qZWN0ZWRZIC0gdGhpcy50YXJnZXRZIC0gdGhpcy5saWZ0O1xuICB2YXIgd2FudGVkWm9vbSA9IHRoaXMuYmFzZVpvb20gLyAodGFyZ2V0LnNwZWVkICogdGhpcy56b29tT3V0ICsgMSk7XG4gIHZhciBkWm9vbSA9IHdhbnRlZFpvb20gLSB0aGlzLnpvb207XG4gIHZhciBjb3JyZWN0aW9uID0gTWF0aC5taW4oc2Vjb25kcyAvIHRoaXMudHJhaWwsIDEpO1xuXG4gIHRoaXMuem9vbSArPSBkWm9vbSAqIGNvcnJlY3Rpb247XG4gIHRoaXMudGFyZ2V0WCArPSBkeCAqIGNvcnJlY3Rpb247XG4gIHRoaXMudGFyZ2V0WSArPSBkeSAqIGNvcnJlY3Rpb247XG59O1xuXG5DYW1lcmEucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uKHNlY29uZHMsIHRhcmdldCkge1xuICB0aGlzLmxlYWRUYXJnZXQoc2Vjb25kcywgdGFyZ2V0KTtcblxuICB2YXIgZWZmaWNpZW5jeSA9IDEgLSB0aGlzLmRyYWc7XG4gIHZhciB2eCA9ICh0aGlzLnRhcmdldFggLSB0aGlzLmxhc3RUYXJnZXRYKSAqIGVmZmljaWVuY3k7XG4gIHZhciB2eSA9ICh0aGlzLnRhcmdldFkgLSB0aGlzLmxhc3RUYXJnZXRZKSAqIGVmZmljaWVuY3k7XG5cbiAgdGhpcy50YXJnZXRYICs9IHZ4ICogc2Vjb25kcztcbiAgdGhpcy50YXJnZXRZICs9IHZ5ICogc2Vjb25kcztcbiAgdGhpcy5sYXN0VGFyZ2V0WCA9IHRoaXMudGFyZ2V0WDtcbiAgdGhpcy5sYXN0VGFyZ2V0WSA9IHRoaXMudGFyZ2V0WTtcblxuICB0aGlzLnggPSB0aGlzLnRhcmdldFggLSB0aGlzLm9mZnNldFg7XG4gIHRoaXMueSA9IHRoaXMudGFyZ2V0WSAtIHRoaXMub2Zmc2V0WTtcbn07XG4iLCJ2YXIgQmxpdCA9IHJlcXVpcmUoJy4uL2JsaXQnKTtcblxudmFyIENhbWVyYSA9IHJlcXVpcmUoJy4vY2FtZXJhJyk7XG52YXIgVGVycmFpbiA9IHJlcXVpcmUoJy4vdGVycmFpbicpO1xudmFyIEpveXN0aWNrID0gcmVxdWlyZSgnLi9qb3lzdGljaycpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlbmRlcmVyO1xuXG5mdW5jdGlvbiBSZW5kZXJlcihjb250YWluZXIpIHtcbiAgdGhpcy5yZXNpemUgPSBfLmRlYm91bmNlKHRoaXMucmVzaXplLmJpbmQodGhpcyksIDEwMDAsIHsgbGVhZGluZzogdHJ1ZSB9KTtcblxuICB0aGlzLmNhbWVyYSA9IG5ldyBDYW1lcmEoKTtcbiAgdGhpcy5zdXJmYWNlID0gbmV3IEJsaXQuU3VyZmFjZShjb250YWluZXIpO1xuICB0aGlzLnRlcnJhaW4gPSBuZXcgVGVycmFpbih0aGlzLnN1cmZhY2UpO1xuICB0aGlzLmR1ZGVTcHJpdGUgPSBuZXcgQmxpdC5TcHJpdGUodGhpcy5zdXJmYWNlLCA1NiwgNjUsICdpbWFnZXMvY2hhcmFjdGVyX3Nwcml0ZXMucG5nJyk7XG4gIHRoaXMuc2hhZG93U3ByaXRlID0gbmV3IEJsaXQuU3ByaXRlKHRoaXMuc3VyZmFjZSwgMzIsIDE2KTtcbiAgdGhpcy5wbGF5ZXJTcHJpdGUgPSBuZXcgQmxpdC5TcHJpdGUodGhpcy5zdXJmYWNlLCA1NiwgNjUsICdpbWFnZXMvaG92ZXJib2FyZF9zcHJpdGVzLnBuZycpO1xuICB0aGlzLmpveXN0aWNrID0gbmV3IEpveXN0aWNrKHRoaXMuc3VyZmFjZSk7XG5cbiAgdGhpcy5zaGFkb3dTcHJpdGUuY2FudmFzRnJhbWUoMCwgZnVuY3Rpb24gZHJhd1NoYWRvdyhjdHgsIHdpZHRoLCBoZWlnaHQpIHtcbiAgICBjdHguZmlsbFN0eWxlID0gJ3JnYmEoMCwgMCwgMCwgMC40KSc7XG4gICAgZHJhd0VsbGlwc2UoY3R4LCAwLCAwLCB3aWR0aCwgaGVpZ2h0KTtcbiAgICBjdHguZmlsbCgpO1xuICB9KTtcblxuICB0aGlzLnJlc2l6ZSgpO1xuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgdGhpcy5yZXNpemUpO1xufVxuXG5mdW5jdGlvbiBkcmF3RWxsaXBzZShjdHgsIHgsIHksIHcsIGgpIHtcbiAgdmFyIGthcHBhID0gLjU1MjI4NDgsXG4gIG94ID0gKHcgLyAyKSAqIGthcHBhLCAvLyBjb250cm9sIHBvaW50IG9mZnNldCBob3Jpem9udGFsXG4gIG95ID0gKGggLyAyKSAqIGthcHBhLCAvLyBjb250cm9sIHBvaW50IG9mZnNldCB2ZXJ0aWNhbFxuICB4ZSA9IHggKyB3LCAgICAgICAgICAgLy8geC1lbmRcbiAgeWUgPSB5ICsgaCwgICAgICAgICAgIC8vIHktZW5kXG4gIHhtID0geCArIHcgLyAyLCAgICAgICAvLyB4LW1pZGRsZVxuICB5bSA9IHkgKyBoIC8gMjsgICAgICAgLy8geS1taWRkbGVcblxuICBjdHguYmVnaW5QYXRoKCk7XG4gIGN0eC5tb3ZlVG8oeCwgeW0pO1xuICBjdHguYmV6aWVyQ3VydmVUbyh4LCB5bSAtIG95LCB4bSAtIG94LCB5LCB4bSwgeSk7XG4gIGN0eC5iZXppZXJDdXJ2ZVRvKHhtICsgb3gsIHksIHhlLCB5bSAtIG95LCB4ZSwgeW0pO1xuICBjdHguYmV6aWVyQ3VydmVUbyh4ZSwgeW0gKyBveSwgeG0gKyBveCwgeWUsIHhtLCB5ZSk7XG4gIGN0eC5iZXppZXJDdXJ2ZVRvKHhtIC0gb3gsIHllLCB4LCB5bSArIG95LCB4LCB5bSk7XG59XG5cblJlbmRlcmVyLnByb3RvdHlwZS5yZXNpemUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRpbXMgPSB0aGlzLnN1cmZhY2UucmVzaXplKCk7XG4gIHRoaXMuc2NhbGUgPSAxMDgwIC8gTWF0aC5tYXgoZGltcy53aWR0aCwgZGltcy5oZWlnaHQpO1xufTtcblxuUmVuZGVyZXIucHJvdG90eXBlLnJlbmRlciA9IGZ1bmN0aW9uKHNlY29uZHMsIGVudGl0aWVzKSB7XG4gIHZhciBzdXJmYWNlID0gdGhpcy5zdXJmYWNlO1xuICB2YXIgY2FtZXJhID0gdGhpcy5jYW1lcmE7XG4gIHZhciBkdWRlcyA9IGZpbmRBbGwoJ2R1ZGUnKTtcbiAgdmFyIHBsYXllciA9IF8uZmluZChlbnRpdGllcywgeyBpZDogJ3BsYXllcicgfSk7XG4gIHZhciBsZXZlbCA9IF8uZmluZChlbnRpdGllcywgeyBpZDogJ2xldmVsJyB9KTtcbiAgdmFyIGpveXN0aWNrID0gXy5maW5kKGVudGl0aWVzLCB7IGlkOiAnam95c3RpY2snIH0pO1xuXG4gIC8vIFRyYWNrIHBsYXllciB3aXRoIGNhbWVyYVxuICBjYW1lcmEudXBkYXRlKHNlY29uZHMsIHBsYXllcik7XG5cbiAgLy8gQ2xlYXIgdGhlIHN1cmZhY2VcbiAgc3VyZmFjZS5jbGVhcigpO1xuXG4gIC8vIFpvb20gYW5kIHRyYW5zbGF0ZVxuICBzdXJmYWNlLnB1c2goKTtcbiAgc3VyZmFjZS50cmFuc2xhdGUoc3VyZmFjZS53aWR0aCAqIDAuNSwgc3VyZmFjZS5oZWlnaHQgKiAwLjUpOyAgICAgICAgICAgICAvLyBjZW50ZXJcbiAgc3VyZmFjZS5zY2FsZSgxIC8gdGhpcy5zY2FsZSk7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzY2FsZSB0byAxMDgwcFxuICBzdXJmYWNlLnNjYWxlKGNhbWVyYS56b29tKTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzY2FsZSB0byBjYW1lcmEgem9vbVxuICBzdXJmYWNlLnRyYW5zbGF0ZSgtY2FtZXJhLngsIC1jYW1lcmEueSk7ICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWxpZ24gb3ZlciBjYW1lcmEgcG9zaXRpb25cblxuICAvLyBEZXRlcm1pbmUgdGhlIHZpc2libGUgcmVjdGFuZ2xlXG4gIHZhciB2aWV3UmVjdCA9IHN1cmZhY2UuZ2V0UmVjdCgpO1xuXG4gIC8vIERyYXcgdGhlIHZpc2libGUgcGFydHMgb2YgdGhlIHRlcnJhaW5cbiAgdGhpcy50ZXJyYWluLnJlbmRlcihzZWNvbmRzLCBsZXZlbCwgdmlld1JlY3QpO1xuXG4gIC8vIERyYXcgdGhlIGNoYXJhY3RlcnNcbiAgZHVkZXMucHVzaChwbGF5ZXIpXG4gIGR1ZGVzLnNvcnQoYnlQWSk7XG4gIGR1ZGVzLmZvckVhY2goZnVuY3Rpb24gZHJhd1NoYWRvdyhjaGFyYWN0ZXIpIHtcbiAgICBpZiAoY2hhcmFjdGVyID09PSBwbGF5ZXIpIHJldHVybjtcbiAgICB0aGlzLnJlbmRlclNoYWRvdyhjaGFyYWN0ZXIpO1xuICB9LmJpbmQodGhpcykpO1xuICBkdWRlcy5mb3JFYWNoKGZ1bmN0aW9uIGRyYXdDaGFyYWN0ZXIoY2hhcmFjdGVyKSB7XG4gICAgaWYgKGNoYXJhY3RlciA9PT0gcGxheWVyKSB0aGlzLnJlbmRlclBsYXllcihjaGFyYWN0ZXIpO1xuICAgIGVsc2UgdGhpcy5yZW5kZXJEdWRlKGNoYXJhY3Rlcik7XG4gIH0uYmluZCh0aGlzKSk7XG5cbiAgLy8gVW56b29tIGFuZCB1bnRyYW5zbGF0ZVxuICBzdXJmYWNlLnBvcCgpO1xuXG4gIC8vIERyYXcgdGhlIGpveXN0aWNrIG92ZXJsYXlcbiAgdGhpcy5qb3lzdGljay5yZW5kZXIoc2Vjb25kcywgam95c3RpY2spO1xuXG4gIGZ1bmN0aW9uIGZpbmRBbGwobmFtZSkge1xuICAgIHJldHVybiBfLmZpbHRlcihlbnRpdGllcywgZnVuY3Rpb24gaGFzU3lzdGVtKGVudGl0eSkge1xuICAgICAgcmV0dXJuIGVudGl0eS5zeXN0ZW1zLmluZGV4T2YobmFtZSkgIT09IC0xO1xuICAgIH0pO1xuICB9XG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyU2hhZG93ID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHNwcml0ZSA9IHRoaXMuc2hhZG93U3ByaXRlO1xuXG4gIHZhciB4ID0gc3RhdGUucHggLSBzcHJpdGUud2lkdGggKiAwLjUgLSAzO1xuICB2YXIgeSA9IHN0YXRlLnB5IC0gc3ByaXRlLmhlaWdodCAqIDAuNSAtIDU7XG5cbiAgc3ByaXRlLmJsaXQoeCwgeSwgMCk7XG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyUGxheWVyID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgdmFyIHNwcml0ZSA9IHRoaXMucGxheWVyU3ByaXRlO1xuXG4gIHZhciB4ID0gc3RhdGUucHggLSBzcHJpdGUud2lkdGggKiAwLjU7XG4gIHZhciB5ID0gc3RhdGUucHkgLSBzcHJpdGUuaGVpZ2h0O1xuXG4gIHZhciBkaXJlY3Rpb24gPSBnZXREaXJlY3Rpb24oc3RhdGUudngsIHN0YXRlLnZ5LCBNYXRoLlBJICogMC41KTtcbiAgdmFyIGZyYW1lID0gZGlyZWN0aW9uIC0gMTtcblxuICBzcHJpdGUuYmxpdCh4LCB5LCBmcmFtZSk7XG59O1xuXG5SZW5kZXJlci5wcm90b3R5cGUucmVuZGVyRHVkZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG4gIHZhciBzcHJpdGUgPSB0aGlzLmR1ZGVTcHJpdGU7XG5cbiAgdmFyIHggPSBzdGF0ZS5weCAtIHNwcml0ZS53aWR0aCAqIDAuNTtcbiAgdmFyIHkgPSBzdGF0ZS5weSAtIHNwcml0ZS5oZWlnaHQ7XG5cbiAgdmFyIGRpcmVjdGlvbiA9IGdldERpcmVjdGlvbihzdGF0ZS52eCwgc3RhdGUudnkpO1xuICB2YXIgcG9zZSA9IHN0YXRlLnNwZWVkID4gNVxuICAgID8gOCAtIE1hdGguZmxvb3Ioc3RhdGUuZGlzdGFuY2UgLyAxMCkgJSA5XG4gICAgOiA4O1xuICB2YXIgZnJhbWUgPSBwb3NlICsgOSAqIChkaXJlY3Rpb24gLSAxKTtcblxuICBzcHJpdGUuYmxpdCh4LCB5LCBmcmFtZSk7XG59O1xuXG5mdW5jdGlvbiBnZXREaXJlY3Rpb24oeCwgeSwgb2Zmc2V0KSB7XG4gIG9mZnNldCA9IG9mZnNldCB8fCAwO1xuICB2YXIgYW5nbGUgPSAoTWF0aC5hdGFuMih5LCB4KSArIE1hdGguUEkgKiAyICsgb2Zmc2V0KSAlIChNYXRoLlBJICogMik7XG5cbiAgaWYgKGJldHdlZW4oMTIuNSwgMzcuNSkpIHJldHVybiA4O1xuICBlbHNlIGlmIChiZXR3ZWVuKDM3LjUsIDYyLjUpKSByZXR1cm4gNztcbiAgZWxzZSBpZiAoYmV0d2Vlbig2Mi41LCA4Ny41KSkgcmV0dXJuIDY7XG4gIGVsc2UgaWYgKGJldHdlZW4oODcuNSwgMTEyLjUpKSByZXR1cm4gNTtcbiAgZWxzZSBpZiAoYmV0d2VlbigxMTIuNSwgMTM3LjUpKSByZXR1cm4gMTtcbiAgZWxzZSBpZiAoYmV0d2VlbigxMzcuNSwgMTYyLjUpKSByZXR1cm4gMjtcbiAgZWxzZSBpZiAoYmV0d2VlbigxNjIuNSwgMTg3LjUpKSByZXR1cm4gMztcbiAgZWxzZSByZXR1cm4gNDtcblxuICBmdW5jdGlvbiBiZXR3ZWVuKGEsIGIpIHtcbiAgICByZXR1cm4gYW5nbGUgPj0gTWF0aC5QSSAqIChhIC8gMTAwKSAmJiBhbmdsZSA8PSBNYXRoLlBJICogKGIgLyAxMDApO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ5UFkoYSwgYikge1xuICByZXR1cm4gYS5weSAtIGIucHk7XG59XG4iLCJ2YXIgQmxpdCA9IHJlcXVpcmUoJy4uL2JsaXQnKTtcblxubW9kdWxlLmV4cG9ydHMgPSBKb3lzdGljaztcblxuZnVuY3Rpb24gSm95c3RpY2soc3VyZmFjZSkge1xuICB0aGlzLnN1cmZhY2UgPSBzdXJmYWNlO1xuICB0aGlzLnJhZGl1cyA9IDA7XG4gIHRoaXMuc3ByaXRlID0gdW5kZWZpbmVkO1xufVxuXG5Kb3lzdGljay5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oc2Vjb25kcywgam95c3RpY2spIHtcbiAgaWYgKGpveXN0aWNrLnJhZGl1cyAhPT0gdGhpcy5yYWRpdXMpIHtcbiAgICB0aGlzLnNwcml0ZSA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnJhZGl1cyA9IGpveXN0aWNrLnJhZGl1cztcbiAgfVxuICBpZiAoIXRoaXMuc3ByaXRlKSB7XG4gICAgdGhpcy5zcHJpdGUgPSB0aGlzLmdlbmVyYXRlU3ByaXRlKHRoaXMucmFkaXVzKTtcbiAgfVxuICB0aGlzLnNwcml0ZS5ibGl0KGpveXN0aWNrLnggLSB0aGlzLnNwcml0ZS53aWR0aCAqIDAuNSwgam95c3RpY2sueSAtIHRoaXMuc3ByaXRlLmhlaWdodCAqIDAuNSk7XG59O1xuXG5Kb3lzdGljay5wcm90b3R5cGUuZ2VuZXJhdGVTcHJpdGUgPSBmdW5jdGlvbihyYWRpdXMpIHtcbiAgdmFyIHNpemUgPSByYWRpdXMgKiAyO1xuICB2YXIgc3ByaXRlID0gbmV3IEJsaXQuU3ByaXRlKHRoaXMuc3VyZmFjZSwgc2l6ZSwgc2l6ZSk7XG4gIHNwcml0ZS5jYW52YXNGcmFtZSgwLCBmdW5jdGlvbiBkcmF3Q2lyY2xlKGN0eCwgd2lkdGgsIGhlaWdodCkge1xuICAgIGN0eC5maWxsU3R5bGUgPSAncmdiYSgwLCAwLCAwLCAwLjIpJztcbiAgICBjdHguc3Ryb2tlU3R5bGUgPSAncmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpJztcbiAgICBjdHguYXJjKHdpZHRoICogMC41LCBoZWlnaHQgKiAwLjUsIHdpZHRoICogMC41LCAwLCBNYXRoLlBJICogMik7XG4gICAgY3R4LmZpbGwoKTtcbiAgICBjdHguc3Ryb2tlKCk7XG4gIH0pO1xuICByZXR1cm4gc3ByaXRlO1xufVxuIiwidmFyIEJsaXQgPSByZXF1aXJlKCcuLi9ibGl0Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gVGVycmFpbjtcblxuZnVuY3Rpb24gVGVycmFpbihzdXJmYWNlKSB7XG4gIHRoaXMuc3VyZmFjZSA9IHN1cmZhY2U7XG4gIHRoaXMuc3ByaXRlID0gbmV3IEJsaXQuU3ByaXRlKHRoaXMuc3VyZmFjZSwgMTI4LCAxMjgsICdpbWFnZXMvZGlydC5qcGcnKTtcbn1cblxuVGVycmFpbi5wcm90b3R5cGUucmVuZGVyID0gZnVuY3Rpb24oc2Vjb25kcywgbWFwLCByZWN0KSB7XG4gIHZhciB3aWR0aCA9IHRoaXMuc3ByaXRlLndpZHRoO1xuICB2YXIgaGVpZ2h0ID0gdGhpcy5zcHJpdGUuaGVpZ2h0O1xuXG4gIHZhciBveCA9IE1hdGguZmxvb3IocmVjdC5sZWZ0IC8gd2lkdGgpICogd2lkdGg7XG4gIHZhciBveSA9IE1hdGguZmxvb3IocmVjdC50b3AgLyBoZWlnaHQpICogaGVpZ2h0O1xuXG4gIGZvciAodmFyIHkgPSBveTsgeSA8IHJlY3QuYm90dG9tOyB5ICs9IHdpZHRoKSB7XG4gICAgZm9yICh2YXIgeCA9IG94OyB4IDwgcmVjdC5yaWdodDsgeCArPSBoZWlnaHQpIHtcbiAgICAgIHRoaXMuc3ByaXRlLmJsaXQoeCwgeSwgMCk7XG4gICAgfVxuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIFN1cmZhY2U6IHJlcXVpcmUoJy4vc3VyZmFjZScpLFxuICBTcHJpdGU6IHJlcXVpcmUoJy4vc3ByaXRlJylcbn07XG4iLCJ2YXIgV2ViR0wgPSByZXF1aXJlKCcuL3dlYi1nbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNwcml0ZTtcblxuZnVuY3Rpb24gU3ByaXRlKHN1cmZhY2UsIHdpZHRoLCBoZWlnaHQsIHVybCkge1xuICB0aGlzLnN1cmZhY2UgPSBzdXJmYWNlO1xuICB0aGlzLnRleHR1cmVzID0gW107ICAgICAgIC8vIFRPRE86IGluc3RlYWQgb2YgYW4gYXJyYXksIHN0b3JlIGFzIGEgbGFyZ2UgdGV4dHVyZSBhbmQgc2VsZWN0IGZyYW1lcyB3aXRoIFVWIGNvb3Jkc1xuICB0aGlzLndpZHRoID0gd2lkdGg7XG4gIHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuICB0aGlzLmltYWdlID0gbmV3IEltYWdlKCk7XG5cbiAgLy8gQnVmZmVyc1xuICB0aGlzLnZlcnRleEJ1ZmZlciA9IHN1cmZhY2UuZ2wuY3JlYXRlQnVmZmVyKCk7XG4gIHRoaXMudGV4dHVyZUJ1ZmZlciA9IHN1cmZhY2UuZ2wuY3JlYXRlQnVmZmVyKCk7XG5cbiAgLy8gVGV4dHVyZSBjb29yZHNcbiAgdGhpcy50ZXh0dXJlQ29vcmRzID0gbmV3IEZsb2F0MzJBcnJheShbXG4gICAgMC4wLCAwLjAsXG4gICAgMS4wLCAwLjAsXG4gICAgMC4wLCAxLjAsXG4gICAgMC4wLCAxLjAsXG4gICAgMS4wLCAwLjAsXG4gICAgMS4wLCAxLjBcbiAgXSk7XG5cbiAgdGhpcy5pbWFnZS5vbmxvYWQgPSB0aGlzLl9vbkxvYWQuYmluZCh0aGlzKTtcbiAgaWYgKHVybCkgdGhpcy5sb2FkVXJsKHVybCk7XG59XG5cbi8vIFRPRE86IGFsbG93IHlvdSB0byByZW5kZXIgb24gYSBub24tcG93ZXItb2YtdHdvIGFuZCB0aGVuIGNvbnZlcnQgdG8gYSBwb3dlci1vZi10d29cblNwcml0ZS5wcm90b3R5cGUuY2FudmFzRnJhbWUgPSBmdW5jdGlvbihmcmFtZSwgZHJhd0ZuKSB7XG4gIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcbiAgdmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xuICB2YXIgc2l6ZSA9IFdlYkdMLm5leHRQb3dlck9mVHdvKE1hdGgubWF4KHRoaXMud2lkdGgsIHRoaXMuaGVpZ2h0KSk7XG5cbiAgY2FudmFzLndpZHRoID0gc2l6ZTtcbiAgY2FudmFzLmhlaWdodCA9IHNpemU7XG5cbiAgZHJhd0ZuKGN0eCwgY2FudmFzLndpZHRoLCBjYW52YXMuaGVpZ2h0KTtcblxuICB0aGlzLl9jcmVhdGVUZXh0dXJlKGNhbnZhcywgZnJhbWUpO1xufTtcblxuU3ByaXRlLnByb3RvdHlwZS5sb2FkVXJsID0gZnVuY3Rpb24odXJsKSB7XG4gIHRoaXMuaW1hZ2Uuc3JjID0gdXJsO1xufTtcblxuU3ByaXRlLnByb3RvdHlwZS5fb25Mb2FkID0gZnVuY3Rpb24oKSB7XG4gIHZhciBnbCA9IHRoaXMuc3VyZmFjZS5nbDtcbiAgdmFyIGltYWdlID0gdGhpcy5pbWFnZTtcblxuICAvLyBDcmVhdGUgYSBzcXVhcmUgcG93ZXItb2YtdHdvIGNhbnZhcyB0byByZXNpemUgdGhlIHRleHR1cmUgb250b1xuICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnY2FudmFzJyk7XG4gIHZhciBjdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcbiAgdmFyIHNpemUgPSBXZWJHTC5uZXh0UG93ZXJPZlR3byhNYXRoLm1heCh0aGlzLndpZHRoLCB0aGlzLmhlaWdodCkpO1xuICBjYW52YXMud2lkdGggPSBzaXplO1xuICBjYW52YXMuaGVpZ2h0ID0gc2l6ZTtcblxuICAvLyBMb29wIHRocm91Z2ggZWFjaCBmcmFtZSBpbiB0aGUgaW1hZ2VcbiAgZm9yICh2YXIgeSA9IDA7IHkgPCBpbWFnZS5oZWlnaHQ7IHkgKz0gdGhpcy5oZWlnaHQpIHtcbiAgICBmb3IgKHZhciB4ID0gMDsgeCA8IGltYWdlLndpZHRoOyB4ICs9IHRoaXMud2lkdGgpIHtcbiAgICAgIGN0eC5jbGVhclJlY3QoMCwgMCwgc2l6ZSwgc2l6ZSk7XG4gICAgICBjdHguZHJhd0ltYWdlKGltYWdlLCB4LCB5LCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgMCwgMCwgc2l6ZSwgc2l6ZSk7XG4gICAgICB0aGlzLl9jcmVhdGVUZXh0dXJlKGNhbnZhcyk7XG4gICAgfVxuICB9XG59O1xuXG5TcHJpdGUucHJvdG90eXBlLl9jcmVhdGVUZXh0dXJlID0gZnVuY3Rpb24oY2FudmFzLCBpbmRleCkge1xuICB2YXIgZ2wgPSB0aGlzLnN1cmZhY2UuZ2w7XG4gIHZhciB0ZXh0dXJlID0gZ2wuY3JlYXRlVGV4dHVyZSgpO1xuXG4gIGluZGV4ID0gaW5kZXggfHwgdGhpcy50ZXh0dXJlcy5sZW5ndGg7XG5cbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgdGV4dHVyZSk7XG4gIGdsLnRleEltYWdlMkQoZ2wuVEVYVFVSRV8yRCwgMCwgZ2wuUkdCQSwgZ2wuUkdCQSwgZ2wuVU5TSUdORURfQllURSwgY2FudmFzKTtcblxuICAvLyBTZXR1cCBzY2FsaW5nIHByb3BlcnRpZXMgKG9ubHkgd29ya3Mgd2l0aCBwb3dlci1vZi0yIHRleHR1cmVzKVxuICAvLyBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgZ2wuTElORUFSKTtcbiAgLy8gZ2wudGV4UGFyYW1ldGVyaShnbC5URVhUVVJFXzJELCBnbC5URVhUVVJFX01JTl9GSUxURVIsIGdsLkxJTkVBUl9NSVBNQVBfTkVBUkVTVCk7XG4gIC8vIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1MsIGdsLlJFUEVBVCk7XG4gIC8vIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLlJFUEVBVCk7XG4gIC8vIGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfMkQpO1xuXG4gIC8vIE1ha2VzIG5vbi1wb3dlci1vZi0yIHRleHR1cmVzIG9rOlxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgZ2wuTElORUFSKTsgLy9nbC5ORUFSRVNUIGlzIGFsc28gYWxsb3dlZCwgaW5zdGVhZCBvZiBnbC5MSU5FQVIsIGFzIG5laXRoZXIgbWlwbWFwLlxuICBnbC50ZXhQYXJhbWV0ZXJpKGdsLlRFWFRVUkVfMkQsIGdsLlRFWFRVUkVfV1JBUF9TLCBnbC5DTEFNUF9UT19FREdFKTsgLy9QcmV2ZW50cyBzLWNvb3JkaW5hdGUgd3JhcHBpbmcgKHJlcGVhdGluZykuXG4gIGdsLnRleFBhcmFtZXRlcmkoZ2wuVEVYVFVSRV8yRCwgZ2wuVEVYVFVSRV9XUkFQX1QsIGdsLkNMQU1QX1RPX0VER0UpOyAvL1ByZXZlbnRzIHQtY29vcmRpbmF0ZSB3cmFwcGluZyAocmVwZWF0aW5nKS5cblxuICAvLyBVbmJpbmQgdGhlIHRleHR1cmVcbiAgZ2wuYmluZFRleHR1cmUoZ2wuVEVYVFVSRV8yRCwgbnVsbCk7XG5cbiAgLy8gU3RvcmUgdGhlIHRleHR1cmVcbiAgdGhpcy50ZXh0dXJlc1tpbmRleF0gPSB0ZXh0dXJlO1xufTtcblxuU3ByaXRlLnByb3RvdHlwZS5ibGl0ID0gZnVuY3Rpb24oeCwgeSwgZnJhbWUpIHtcbiAgZnJhbWUgPSBmcmFtZSB8fCAwO1xuXG4gIGlmICghdGhpcy50ZXh0dXJlc1tmcmFtZV0pIHJldHVybjtcblxuICB2YXIgc3VyZmFjZSA9IHRoaXMuc3VyZmFjZTtcbiAgdmFyIGdsID0gc3VyZmFjZS5nbDtcbiAgdmFyIHZlcnRleFBvc2l0aW9uID0gc3VyZmFjZS5sb2NhdGlvbnMucG9zaXRpb247XG4gIHZhciB2ZXJ0ZXhUZXh0dXJlID0gc3VyZmFjZS5sb2NhdGlvbnMudGV4dHVyZTtcbiAgdmFyIG1hdHJpeExvY2F0aW9uID0gc3VyZmFjZS5sb2NhdGlvbnMubWF0cml4O1xuICB2YXIgbWF0cml4ID0gc3VyZmFjZS5nZXRNYXRyaXgoKTtcblxuICAvLyBCaW5kIHRoZSB2ZXJ0ZXggYnVmZmVyIGFzIHRoZSBjdXJyZW50IGJ1ZmZlclxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0ZXhCdWZmZXIpO1xuXG4gIC8vIEZpbGwgaXQgd2l0aCB0aGUgdmVydGV4IGRhdGFcbiAgdmFyIHgxID0geDtcbiAgdmFyIHgyID0geCArIHRoaXMud2lkdGg7XG4gIHZhciB5MSA9IHk7XG4gIHZhciB5MiA9IHkgKyB0aGlzLmhlaWdodDtcbiAgdmFyIHZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShbXG4gICAgeDEsIHkxLCB4MiwgeTEsIHgxLCB5MiwgeDEsIHkyLCB4MiwgeTEsIHgyLCB5MlxuICBdKTtcbiAgZ2wuYnVmZmVyRGF0YShnbC5BUlJBWV9CVUZGRVIsIHZlcnRpY2VzLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgLy8gQ29ubmVjdCB2ZXJ0ZXggYnVmZmVyIHRvIHNoYWRlcidzIHZlcnRleCBwb3NpdGlvbiBhdHRyaWJ1dGVcbiAgZ2wudmVydGV4QXR0cmliUG9pbnRlcih2ZXJ0ZXhQb3NpdGlvbiwgMiwgZ2wuRkxPQVQsIGZhbHNlLCAwLCAwKTtcblxuICAvLyBCaW5kIHRoZSBzaGFkZXIgYnVmZmVyIGFzIHRoZSBjdXJyZW50IGJ1ZmZlclxuICBnbC5iaW5kQnVmZmVyKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy50ZXh0dXJlQnVmZmVyKTtcblxuICAvLyBGaWxsIGl0IHdpdGggdGhlIHRleHR1cmUgZGF0YVxuICBnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy50ZXh0dXJlQ29vcmRzLCBnbC5TVEFUSUNfRFJBVyk7XG5cbiAgLy8gQ29ubmVjdCB0ZXh0dXJlIGJ1ZmZlciB0byBzaGFkZXIncyB0ZXh0dXJlIGF0dHJpYnV0ZVxuICBnbC52ZXJ0ZXhBdHRyaWJQb2ludGVyKHZlcnRleFRleHR1cmUsIDIsIGdsLkZMT0FULCBmYWxzZSwgMCwgMCk7XG5cbiAgLy8gU2V0IHNsb3QgMCBhcyBhY3RpdmUgdGV4dHVyZVxuICAvL2dsLmFjdGl2ZVRleHR1cmUodGhpcy5HTC5URVhUVVJFMCk7IC8vIFRPRE86IG5lY2Vzc2FyeT9cbiAgLy9nbC5hY3RpdmVUZXh0dXJlKGdsWydURVhUVVJFJyArIGZyYW1lXSk7XG5cbiAgLy8gTG9hZCB0ZXh0dXJlIGludG8gbWVtb3J5XG4gIGdsLmJpbmRUZXh0dXJlKGdsLlRFWFRVUkVfMkQsIHRoaXMudGV4dHVyZXNbZnJhbWVdKTtcblxuICAvLyBBcHBseSB0aGUgdHJhbnNmb3JtYXRpb24gbWF0cml4XG4gIGdsLnVuaWZvcm1NYXRyaXgzZnYobWF0cml4TG9jYXRpb24sIGZhbHNlLCBtYXRyaXgpO1xuXG4gIC8vIERyYXcgdHJpYW5nbGVzIHRoYXQgbWFrZSB1cCBhIHJlY3RhbmdsZVxuICBnbC5kcmF3QXJyYXlzKGdsLlRSSUFOR0xFUywgMCwgNik7XG5cbiAgLy8gVW5iaW5kIGV2ZXJ5dGhpbmdcbiAgZ2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIG51bGwpO1xuICBnbC5iaW5kVGV4dHVyZShnbC5URVhUVVJFXzJELCBudWxsKTtcbn07XG4iLCJ2YXIgV2ViR0wgPSByZXF1aXJlKCcuL3dlYi1nbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN1cmZhY2U7XG5cbmZ1bmN0aW9uIFN1cmZhY2UoY2FudmFzKSB7XG4gIHRoaXMuY2FudmFzID0gY2FudmFzO1xuICB0aGlzLm1hdHJpeFN0YWNrID0gWyBtYXQzLmNyZWF0ZSgpIF07XG4gIHRoaXMud2lkdGggPSAwO1xuICB0aGlzLmhlaWdodCA9IDA7XG5cbiAgdGhpcy5nbCA9IFdlYkdMLmdldEdMQ29udGV4dChjYW52YXMsIHsgYWxwaGE6IGZhbHNlLCBwcmVtdWx0aXBsaWVkQWxwaGE6IGZhbHNlIH0pO1xuICB0aGlzLmxvY2F0aW9ucyA9IFdlYkdMLmluaXRHTCh0aGlzLmdsLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCk7XG4gIHRoaXMucmVzaXplKCk7XG59XG5cblN1cmZhY2UucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd2lkdGggPSB0aGlzLmNhbnZhcy5jbGllbnRXaWR0aDtcbiAgdmFyIGhlaWdodCA9IHRoaXMuY2FudmFzLmNsaWVudEhlaWdodDtcblxuICB0aGlzLndpZHRoID0gdGhpcy5jYW52YXMud2lkdGggPSB3aWR0aDtcbiAgdGhpcy5oZWlnaHQgPSB0aGlzLmNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XG4gIHRoaXMuZ2wudmlld3BvcnQoMCwgMCwgd2lkdGgsIGhlaWdodCk7XG4gIHRoaXMuZ2wudW5pZm9ybTJmKHRoaXMubG9jYXRpb25zLnJlc29sdXRpb24sIHdpZHRoLCBoZWlnaHQpO1xuXG4gIHJldHVybiB7XG4gICAgd2lkdGg6IHdpZHRoLFxuICAgIGhlaWdodDogaGVpZ2h0XG4gIH07XG59O1xuXG5TdXJmYWNlLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKGNvbG9yKSB7XG4gIHRoaXMuZ2wuY2xlYXIodGhpcy5nbC5DT0xPUl9CVUZGRVJfQklUKTtcbn07XG5cblN1cmZhY2UucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5tYXRyaXhTdGFjay5wdXNoKCBtYXQzLmNsb25lKHRoaXMuZ2V0TWF0cml4KCkpICk7XG59O1xuXG5TdXJmYWNlLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMubWF0cml4U3RhY2sucG9wKCk7XG59O1xuXG5TdXJmYWNlLnByb3RvdHlwZS5nZXRNYXRyaXggPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMubWF0cml4U3RhY2tbdGhpcy5tYXRyaXhTdGFjay5sZW5ndGggLSAxXTtcbn07XG5cblN1cmZhY2UucHJvdG90eXBlLnRyYW5zbGF0ZSA9IGZ1bmN0aW9uKHR4LCB0eSkge1xuICB2YXIgbSA9IHRoaXMuZ2V0TWF0cml4KCk7XG4gIHZhciB2ID0gdmVjMi5zZXQodmVjMi5jcmVhdGUoKSwgdHgsIHR5KTtcbiAgbWF0My50cmFuc2xhdGUobSwgbSwgdik7XG59O1xuXG5TdXJmYWNlLnByb3RvdHlwZS5zY2FsZSA9IGZ1bmN0aW9uKHNjYWxlKSB7XG4gIHZhciBtID0gdGhpcy5nZXRNYXRyaXgoKTtcbiAgdmFyIHYgPSB2ZWMyLnNldCh2ZWMyLmNyZWF0ZSgpLCBzY2FsZSwgc2NhbGUpO1xuICBtYXQzLnNjYWxlKG0sIG0sIHYpO1xufTtcblxuU3VyZmFjZS5wcm90b3R5cGUuZ2V0UmVjdCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgbSA9IG1hdDMuY2xvbmUodGhpcy5nZXRNYXRyaXgoKSk7XG4gIHZhciB1bCA9IHZlYzMuc2V0KHZlYzMuY3JlYXRlKCksIDAsIDAsIDEpO1xuICB2YXIgbHIgPSB2ZWMzLnNldCh2ZWMzLmNyZWF0ZSgpLCB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgMSk7XG4gIG1hdDMuaW52ZXJ0KG0sIG0pO1xuICB2ZWMzLnRyYW5zZm9ybU1hdDModWwsIHVsLCBtKTtcbiAgdmVjMy50cmFuc2Zvcm1NYXQzKGxyLCBsciwgbSk7XG4gIHJldHVybiB7XG4gICAgbGVmdDogdWxbMF0sXG4gICAgdG9wOiB1bFsxXSxcbiAgICByaWdodDogbHJbMF0sXG4gICAgYm90dG9tOiBsclsxXVxuICB9O1xufTtcbiIsInZhciBWRVJURVhfU0hBREVSID0gW1xuICAnYXR0cmlidXRlIHZlYzIgYV9wb3NpdGlvbjsnLFxuICAnYXR0cmlidXRlIHZlYzIgYV90ZXh0dXJlOycsXG4gICd2YXJ5aW5nIHZlYzIgdl90ZXh0dXJlOycsXG4gICd1bmlmb3JtIHZlYzIgdV9yZXNvbHV0aW9uOycsXG4gICd1bmlmb3JtIG1hdDMgdV9tYXRyaXg7JyxcblxuICAndm9pZCBtYWluKCkgeycsXG5cbiAgLy8gYXBwbHkgdGhlIHRyYW5zZm9ybWF0aW9uIG1hdHJpeFxuICAndmVjMiBwb3NpdGlvbiA9ICh1X21hdHJpeCAqIHZlYzMoYV9wb3NpdGlvbiwgMSkpLnh5OycsXG5cbiAgLy8gY29udmVydCB0aGUgcmVjdGFuZ2xlIGZyb20gcGl4ZWxzIHRvIDAuMCB0byAxLjBcbiAgJ3ZlYzIgemVyb1RvT25lID0gcG9zaXRpb24gLyB1X3Jlc29sdXRpb247JyxcblxuICAvLyBjb252ZXJ0IGZyb20gMC0+MSB0byAwLT4yXG4gICd2ZWMyIHplcm9Ub1R3byA9IHplcm9Ub09uZSAqIDIuMDsnLFxuXG4gIC8vIGNvbnZlcnQgZnJvbSAwLT4yIHRvIC0xLT4rMSAoY2xpcHNwYWNlKVxuICAndmVjMiBjbGlwU3BhY2UgPSB6ZXJvVG9Ud28gLSAxLjA7JyxcblxuICAvLyBpbnZlcnQgeSBheGlzIGFuZCBhc3NpZ24gcG9zaXRpb25cbiAgJ2dsX1Bvc2l0aW9uID0gdmVjNChjbGlwU3BhY2UgKiB2ZWMyKDEsIC0xKSwgMCwgMSk7JyxcblxuICAvLyBwYXNzIHRoZSB0ZXh0dXJlIGNvb3JkaW5hdGUgdG8gdGhlIGZyYWdtZW50IHNoYWRlclxuICAndl90ZXh0dXJlID0gYV90ZXh0dXJlOycsXG4gICd9J1xuXS5qb2luKCdcXG4nKTtcblxudmFyIEZSQUdNRU5UX1NIQURFUiA9IFtcbiAgJ3ByZWNpc2lvbiBtZWRpdW1wIGZsb2F0OycsXG4gICd1bmlmb3JtIHNhbXBsZXIyRCB1X2ltYWdlOycsICAgLy8gdGhlIHRleHR1cmVcbiAgJ3ZhcnlpbmcgdmVjMiB2X3RleHR1cmU7JywgICAgICAvLyB0aGUgdGV4dHVyZSBjb29yZHMgcGFzc2VkIGluIGZyb20gdGhlIHZlcnRleCBzaGFkZXJcblxuICAndm9pZCBtYWluKHZvaWQpIHsnLFxuICAnZ2xfRnJhZ0NvbG9yID0gdGV4dHVyZTJEKHVfaW1hZ2UsIHZfdGV4dHVyZSk7JyxcbiAgJ30nXG5dLmpvaW4oJ1xcbicpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5pdEdMOiBpbml0R0wsXG4gIGdldEdMQ29udGV4dDogZ2V0R0xDb250ZXh0LFxuICBuZXh0UG93ZXJPZlR3bzogbmV4dFBvd2VyT2ZUd29cbn07XG5cbmZ1bmN0aW9uIGluaXRHTChnbCwgd2lkdGgsIGhlaWdodCkge1xuICBnbC5jbGVhckNvbG9yKDAuMCwgMC4wLCAwLjAsIDEuMCk7XG4gIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQgfCBnbC5ERVBUSF9CVUZGRVJfQklUKTtcbiAgZ2wuZGVwdGhGdW5jKGdsLkxFUVVBTCk7XG4gIGdsLmRpc2FibGUoZ2wuREVQVEhfVEVTVCk7XG4gIGdsLmRpc2FibGUoZ2wuQ1VMTF9GQUNFKTtcbiAgZ2wuZW5hYmxlKGdsLkJMRU5EKTtcbiAgZ2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBX1dFQkdMLCBmYWxzZSk7XG4gIGdsLmJsZW5kRnVuYyhnbC5TUkNfQUxQSEEsIGdsLk9ORV9NSU5VU19TUkNfQUxQSEEpO1xuXG4gIC8vIExvYWQgYW5kIGNvbXBpbGUgZnJhZ21lbnQgc2hhZGVyXG4gIHZhciBmU2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKGdsLkZSQUdNRU5UX1NIQURFUik7XG4gIGdsLnNoYWRlclNvdXJjZShmU2hhZGVyLCBGUkFHTUVOVF9TSEFERVIpO1xuICBnbC5jb21waWxlU2hhZGVyKGZTaGFkZXIpO1xuICB2YXIgY29tcGlsZWQgPSBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIoZlNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpO1xuICBpZiAoIWNvbXBpbGVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdmcmFnbWVudCBzaGFkZXIgZXJyb3I6ICcgKyBnbC5nZXRTaGFkZXJJbmZvTG9nKGZTaGFkZXIpKTtcbiAgfVxuXG4gIC8vIExvYWQgYW5kIGNvbXBpbGUgdmVydGV4IHNoYWRlclxuICB2YXIgdlNoYWRlciA9IGdsLmNyZWF0ZVNoYWRlcihnbC5WRVJURVhfU0hBREVSKTtcbiAgZ2wuc2hhZGVyU291cmNlKHZTaGFkZXIsIFZFUlRFWF9TSEFERVIpO1xuICBnbC5jb21waWxlU2hhZGVyKHZTaGFkZXIpO1xuICB2YXIgY29tcGlsZWQgPSBnbC5nZXRTaGFkZXJQYXJhbWV0ZXIodlNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpO1xuICBpZiAoIWNvbXBpbGVkKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCd2ZXJ0ZXggc2hhZGVyIGVycm9yOiAnICsgZ2wuZ2V0U2hhZGVySW5mb0xvZyh2U2hhZGVyKSk7XG4gIH1cblxuICAvLyBDcmVhdGUgdGhlIHNoYWRlciBwcm9ncmFtXG4gIHZhciBwcm9ncmFtID0gZ2wuY3JlYXRlUHJvZ3JhbSgpO1xuICBnbC5hdHRhY2hTaGFkZXIocHJvZ3JhbSwgZlNoYWRlcik7XG4gIGdsLmF0dGFjaFNoYWRlcihwcm9ncmFtLCB2U2hhZGVyKTtcbiAgZ2wubGlua1Byb2dyYW0ocHJvZ3JhbSk7XG4gIGdsLnVzZVByb2dyYW0ocHJvZ3JhbSk7XG5cbiAgLy8gTGluayB2ZXJ0ZXggcG9zaXRpb24gYXR0cmlidXRlIGZyb20gc2hhZGVyXG4gIHZhciB2ZXJ0ZXhQb3NpdGlvbiA9IGdsLmdldEF0dHJpYkxvY2F0aW9uKHByb2dyYW0sICdhX3Bvc2l0aW9uJyk7XG4gIGdsLmVuYWJsZVZlcnRleEF0dHJpYkFycmF5KHZlcnRleFBvc2l0aW9uKTtcblxuICAvLyBMaW5rIHRleHR1cmUgY29vcmRpbmF0ZSBhdHRyaWJ1dGUgZnJvbSBzaGFkZXJcbiAgdmFyIHZlcnRleFRleHR1cmUgPSBnbC5nZXRBdHRyaWJMb2NhdGlvbihwcm9ncmFtLCBcImFfdGV4dHVyZVwiKTtcbiAgZ2wuZW5hYmxlVmVydGV4QXR0cmliQXJyYXkodmVydGV4VGV4dHVyZSk7XG5cbiAgLy8gUHJvdmlkZSB0aGUgcmVzb2x1dGlvbiBsb2NhdGlvblxuICB2YXIgcmVzb2x1dGlvbkxvY2F0aW9uID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sICd1X3Jlc29sdXRpb24nKTtcblxuICAvLyBQcm92aWRlIHRoZSB0cmFuc2Zvcm1hdGlvbiBtYXRyaXhcbiAgdmFyIHRyYW5zZm9ybWF0aW9uTWF0cml4ID0gZ2wuZ2V0VW5pZm9ybUxvY2F0aW9uKHByb2dyYW0sICd1X21hdHJpeCcpO1xuXG4gIHJldHVybiB7XG4gICAgcG9zaXRpb246IHZlcnRleFBvc2l0aW9uLFxuICAgIHRleHR1cmU6IHZlcnRleFRleHR1cmUsXG4gICAgcmVzb2x1dGlvbjogcmVzb2x1dGlvbkxvY2F0aW9uLFxuICAgIG1hdHJpeDogdHJhbnNmb3JtYXRpb25NYXRyaXhcbiAgfTtcbn1cblxuZnVuY3Rpb24gZ2V0R0xDb250ZXh0KGNhbnZhcywgb3B0cykge1xuICByZXR1cm4gY2FudmFzLmdldENvbnRleHQoJ3dlYmdsJywgb3B0cykgfHwgY2FudmFzLmdldENvbnRleHQoJ2V4cGVyaW1lbnRhbC13ZWJnbCcsIG9wdHMpO1xufVxuXG5mdW5jdGlvbiBuZXh0UG93ZXJPZlR3byhuKSB7XG4gIHZhciBpID0gTWF0aC5mbG9vcihuIC8gMik7XG4gIHdoaWxlIChpIDwgbikgaSAqPSAyO1xuICByZXR1cm4gaTtcbn1cbiIsIm1vZHVsZS5leHBvcnRzID0gRW50aXR5O1xuXG5mdW5jdGlvbiBFbnRpdHkoaWQsIGdyb3VwKSB7XG4gIHRoaXMuaWQgPSBpZDtcbiAgdGhpcy5ncm91cCA9IGdyb3VwO1xuICB0aGlzLnN5c3RlbXMgPSBbXTtcbiAgdGhpcy5zdGF0ZSA9IHsgaWQ6IGlkLCBzeXN0ZW1zOiBbXSB9O1xufVxuXG5FbnRpdHkucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHN5c3RlbU5hbWUsIG92ZXJyaWRlcykge1xuICB2YXIgc3lzdGVtID0gdGhpcy5ncm91cC5nZXRTeXN0ZW0oc3lzdGVtTmFtZSk7XG4gIHN5c3RlbS5yZWdpc3Rlcih0aGlzKTtcbiAgc3lzdGVtLnNldEluaXRpYWxTdGF0ZSh0aGlzLnN0YXRlLCBvdmVycmlkZXMpO1xuICB0aGlzLnN5c3RlbXMucHVzaChzeXN0ZW0pO1xuICB0aGlzLnN0YXRlLnN5c3RlbXMucHVzaChzeXN0ZW1OYW1lKTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FbnRpdHkucHJvdG90eXBlLmdldFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gIHZhciBzdGF0ZSA9IHRoaXMuc3RhdGU7XG4gIHRoaXMuc3lzdGVtcy5mb3JFYWNoKGdldFN5c3RlbVN0YXRlKTtcbiAgcmV0dXJuIHRoaXMuc3RhdGU7XG5cbiAgZnVuY3Rpb24gZ2V0U3lzdGVtU3RhdGUoc3lzdGVtKSB7XG4gICAgaWYgKHN5c3RlbS5kZWZpbml0aW9uLmdldFN0YXRlKSB7XG4gICAgICB2YXIgc3lzdGVtU3RhdGUgPSBzeXN0ZW0uZGVmaW5pdGlvbi5nZXRTdGF0ZS5jYWxsKHN0YXRlKTtcbiAgICAgIF8uZXh0ZW5kKHN0YXRlLCBzeXN0ZW1TdGF0ZSk7XG4gICAgfVxuICB9XG59O1xuIiwidmFyIEVudGl0eSA9IHJlcXVpcmUoJy4vZW50aXR5Jyk7XG52YXIgU3lzdGVtID0gcmVxdWlyZSgnLi9zeXN0ZW0nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cDtcblxuZnVuY3Rpb24gR3JvdXAoZGVmaW5pdGlvbnMpIHtcbiAgdGhpcy5lbnRpdGllcyA9IFtdO1xuICB0aGlzLnN5c3RlbXMgPSBPYmplY3Qua2V5cyhkZWZpbml0aW9ucykucmVkdWNlKHRvT2JqZWN0LCB7fSk7XG5cbiAgZnVuY3Rpb24gdG9PYmplY3Qob2JqLCBrZXkpIHtcbiAgICB2YXIgbmFtZSA9IGRlZmluaXRpb25zW2tleV0ubmFtZTtcbiAgICB2YXIgZGVmID0gZGVmaW5pdGlvbnNba2V5XTtcbiAgICBvYmpbbmFtZV0gPSBuZXcgU3lzdGVtKGRlZik7XG4gICAgcmV0dXJuIG9iajtcbiAgfVxufVxuXG5Hcm91cC5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oaWQpIHtcbiAgdmFyIGVudGl0eSA9IG5ldyBFbnRpdHkoaWQsIHRoaXMpO1xuICB0aGlzLmVudGl0aWVzLnB1c2goZW50aXR5KTtcbiAgcmV0dXJuIGVudGl0eTtcbn07XG5cbkdyb3VwLnByb3RvdHlwZS5nZXRTeXN0ZW0gPSBmdW5jdGlvbihuYW1lKSB7XG4gIHJldHVybiB0aGlzLnN5c3RlbXNbbmFtZV07XG59O1xuXG5Hcm91cC5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24obmFtZSkge1xuICB2YXIgc3lzdGVtID0gdGhpcy5zeXN0ZW1zW25hbWVdO1xuICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgaWYgKCFzeXN0ZW0pIHRocm93IG5ldyBFcnJvcignTm8gc3VjaCBzeXN0ZW06ICcgKyBuYW1lKTtcblxuICBzeXN0ZW0udXBkYXRlKGFyZ3MpO1xufTtcblxuR3JvdXAucHJvdG90eXBlLmdldFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLmVudGl0aWVzLm1hcChnZXRFbnRpdHlTdGF0ZSk7XG5cbiAgZnVuY3Rpb24gZ2V0RW50aXR5U3RhdGUoZW50aXR5KSB7XG4gICAgcmV0dXJuIGVudGl0eS5nZXRTdGF0ZSgpO1xuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIEVudGl0eTogcmVxdWlyZSgnLi9lbnRpdHknKSxcbiAgRW50aXR5R3JvdXA6IHJlcXVpcmUoJy4vZ3JvdXAnKSxcbiAgRW50aXR5U3lzdGVtOiByZXF1aXJlKCcuL3N5c3RlbScpXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSBTeXN0ZW07XG5cbmZ1bmN0aW9uIFN5c3RlbShkZWZpbml0aW9uKSB7XG4gIHRoaXMubmFtZSA9IGRlZmluaXRpb24ubmFtZTtcbiAgdGhpcy5kZWZpbml0aW9uID0gZGVmaW5pdGlvbjtcbiAgdGhpcy5tZW1iZXJzID0gW107XG59XG5cblN5c3RlbS5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbihlbnRpdHkpIHtcbiAgdGhpcy5tZW1iZXJzLnB1c2goZW50aXR5KTtcbn07XG5cblN5c3RlbS5wcm90b3R5cGUuc2V0SW5pdGlhbFN0YXRlID0gZnVuY3Rpb24ob2JqLCBvdmVycmlkZXMpIHtcbiAgdmFyIHNldHRlciA9IHRoaXMuZGVmaW5pdGlvbi5zZXRTdGF0ZTtcbiAgaWYgKHNldHRlcikgb3ZlcnJpZGVzID0gc2V0dGVyKG92ZXJyaWRlcyk7XG4gIF8uZXh0ZW5kKG9iaiwgXy5jbG9uZURlZXAodGhpcy5kZWZpbml0aW9uLnByb3BzKSwgb3ZlcnJpZGVzKTtcbn07XG5cblN5c3RlbS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24oYXJncykge1xuICB2YXIgdXBkYXRlID0gdGhpcy5kZWZpbml0aW9uLnVwZGF0ZTtcbiAgdGhpcy5tZW1iZXJzLmZvckVhY2godXBkYXRlTWVtYmVyKTtcblxuICBmdW5jdGlvbiB1cGRhdGVNZW1iZXIoZW50aXR5KSB7XG4gICAgdXBkYXRlLmFwcGx5KGVudGl0eS5zdGF0ZSwgYXJncyk7XG4gIH1cbn07XG5cblN5c3RlbS5wcm90b3R5cGUuZ2V0U3RhdGUgPSBmdW5jdGlvbihlbnRpdHkpIHtcbiAgcmV0dXJuIHRoaXMuZGVmaW5pdGlvbi5nZXRTdGF0ZS5jYWxsKGVudGl0eS5zdGF0ZSk7XG59O1xuIiwidmFyIExvb3AgPSByZXF1aXJlKCcuL2xvb3AvbG9vcCcpO1xudmFyIEVudGl0eUdyb3VwID0gcmVxdWlyZSgnLi9lc3lzdGVtJykuRW50aXR5R3JvdXA7XG5cbnZhciBTWVNURU1TID0gW1xuICByZXF1aXJlKCcuL3N5c3RlbXMvcG9zaXRpb24nKSxcbiAgcmVxdWlyZSgnLi9zeXN0ZW1zL3dhbGtpbmcnKSxcbiAgcmVxdWlyZSgnLi9zeXN0ZW1zL2NvbnRyb2xsYWJsZScpLFxuICByZXF1aXJlKCcuL3N5c3RlbXMvd2FuZGVyaW5nJyksXG4gIHJlcXVpcmUoJy4vc3lzdGVtcy9wbGF5ZXInKSxcbiAgcmVxdWlyZSgnLi9zeXN0ZW1zL2xldmVsJyksXG4gIHJlcXVpcmUoJy4vc3lzdGVtcy9qb3lzdGljaycpLFxuICByZXF1aXJlKCcuL3N5c3RlbXMvZHVkZScpXG5dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEdhbWU7XG5cbmZ1bmN0aW9uIEdhbWUocmVuZGVyZXIsIGpveXN0aWNrLCByYWYpIHtcbiAgdGhpcy5yZW5kZXJlciA9IHJlbmRlcmVyO1xuICB0aGlzLmpveXN0aWNrID0gam95c3RpY2s7XG4gIHRoaXMubG9vcCA9IG5ldyBMb29wKHJhZiB8fCByZXF1ZXN0QW5pbWF0aW9uRnJhbWUsIDE4MCk7XG5cbiAgdGhpcy5lbnRpdGllcyA9IG5ldyBFbnRpdHlHcm91cChTWVNURU1TKTtcblxuICB0aGlzLmVudGl0aWVzLmNyZWF0ZSgncGxheWVyJylcbiAgICAuYWRkKCdwb3NpdGlvbicpXG4gICAgLmFkZCgnd2Fsa2luZycpXG4gICAgLmFkZCgnY29udHJvbGxhYmxlJylcbiAgICAuYWRkKCdwbGF5ZXInKTtcblxuICB2YXIgaSA9IDUwO1xuICB3aGlsZSAoaS0tID4gMCkge1xuICAgIHRoaXMuZW50aXRpZXMuY3JlYXRlKCkgICAgLy8gV2lsbCBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlIGFuIElEIGZvciB5b3UgaWYgbm90IHNwZWNpZmllZFxuICAgICAgLmFkZCgncG9zaXRpb24nLCB7IHg6IE1hdGgucmFuZG9tKCkgKiA1MDAgLSAyNTAsIHk6IE1hdGgucmFuZG9tKCkgKiA1MDAgLSAyNTAgfSlcbiAgICAgIC5hZGQoJ3dhbGtpbmcnLCB7IG1heFNwZWVkOiAxNTAgfSlcbiAgICAgIC5hZGQoJ3dhbmRlcmluZycpXG4gICAgICAuYWRkKCdkdWRlJyk7XG4gIH1cblxuICB0aGlzLmVudGl0aWVzLmNyZWF0ZSgnbGV2ZWwnKVxuICAgIC5hZGQoJ2xldmVsJyk7XG5cbiAgdGhpcy5lbnRpdGllcy5jcmVhdGUoJ2pveXN0aWNrJylcbiAgICAuYWRkKCdqb3lzdGljaycpO1xufVxuXG5HYW1lLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKCkge1xuICB2YXIgZW50aXRpZXMgPSB0aGlzLmVudGl0aWVzO1xuICB2YXIgam95c3RpY2sgPSB0aGlzLmpveXN0aWNrO1xuICB2YXIgcmVuZGVyZXIgPSB0aGlzLnJlbmRlcmVyO1xuXG4gIHRoaXMubG9vcC5zdGFydChzaW11bGF0ZS5iaW5kKHRoaXMpLCByZW5kZXIuYmluZCh0aGlzKSk7XG5cbiAgZnVuY3Rpb24gc2ltdWxhdGUoc2Vjb25kcykge1xuICAgIGVudGl0aWVzLnVwZGF0ZSgnY29udHJvbGxhYmxlJywgc2Vjb25kcywgam95c3RpY2suZ2V0WFkoKSk7XG4gICAgZW50aXRpZXMudXBkYXRlKCd3YW5kZXJpbmcnLCBzZWNvbmRzKTtcbiAgICBlbnRpdGllcy51cGRhdGUoJ3dhbGtpbmcnLCBzZWNvbmRzKTtcbiAgICBlbnRpdGllcy51cGRhdGUoJ2pveXN0aWNrJywgc2Vjb25kcywgam95c3RpY2suZ2V0U3RhdGUoKSk7XG4gIH1cblxuICBmdW5jdGlvbiByZW5kZXIoc2Vjb25kcykge1xuICAgIHJlbmRlcmVyLnJlbmRlcihzZWNvbmRzLCBlbnRpdGllcy5nZXRTdGF0ZSgpKTtcbiAgfVxufTtcbiIsIm1vZHVsZS5leHBvcnRzID0gTG9vcDtcblxuZnVuY3Rpb24gTG9vcChyZXF1ZXN0QW5pbWF0aW9uRnJhbWUsIGZwcykge1xuICB0aGlzLnJhZiA9IHJlcXVlc3RBbmltYXRpb25GcmFtZTtcbiAgdGhpcy5mcHMgPSBmcHM7XG4gIHRoaXMuc2ltVGlja3MgPSAxMDAwIC8gZnBzO1xufVxuXG5Mb29wLnByb3RvdHlwZS5zdGFydCA9IGZ1bmN0aW9uKHNpbXVsYXRlRm4sIHJlbmRlckZuKSB7XG4gIHZhciB0aW1lQnVmZmVyID0gMDtcbiAgdmFyIGxhc3RUaW1lID0gMDtcbiAgdmFyIHNpbVRpY2tzID0gdGhpcy5zaW1UaWNrcztcbiAgdmFyIHNpbVNlY29uZHMgPSBzaW1UaWNrcyAvIDEwMDA7XG4gIHZhciByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB0aGlzLnJhZjtcblxuICB2YXIgcGVyZk5vdyA9IHdpbmRvdy5wZXJmb3JtYW5jZSAmJiB3aW5kb3cucGVyZm9ybWFuY2Uubm93XG4gICAgPyB3aW5kb3cucGVyZm9ybWFuY2Uubm93LmJpbmQod2luZG93LnBlcmZvcm1hbmNlKVxuICAgIDogRGF0ZS5ub3cuYmluZChEYXRlKTtcblxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnJhbWUpO1xuXG4gIGZ1bmN0aW9uIGZyYW1lKCkge1xuICAgIHZhciBub3cgPSBwZXJmTm93KCk7XG4gICAgdmFyIHRpY2tzID0gbm93IC0gbGFzdFRpbWU7XG5cbiAgICBpZiAodGlja3MgPiAxMDApIHRpY2tzID0gMDtcbiAgICB0aW1lQnVmZmVyICs9IHRpY2tzO1xuXG4gICAgaWYgKHRpbWVCdWZmZXIgPj0gc2ltVGlja3MpIHtcbiAgICAgIHdoaWxlICh0aW1lQnVmZmVyID49IHNpbVRpY2tzKSB7XG4gICAgICAgIHNpbXVsYXRlRm4oc2ltU2Vjb25kcyk7XG4gICAgICAgIHRpbWVCdWZmZXIgLT0gc2ltVGlja3M7XG4gICAgICB9XG4gICAgICByZW5kZXJGbih0aWNrcyAvIDEwMDApO1xuICAgIH1cblxuICAgIGxhc3RUaW1lID0gbm93O1xuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShmcmFtZSk7XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgbmFtZTogJ2NvbnRyb2xsYWJsZScsXG4gIHByb3BzOiB7XG4gICAgZGlyWDogMCxcbiAgICBkaXJZOiAwXG4gIH0sXG4gIHVwZGF0ZTogZnVuY3Rpb24oc2Vjb25kcywgam95c3RpY2spIHtcbiAgICB0aGlzLmRpclggPSBqb3lzdGljay54O1xuICAgIHRoaXMuZGlyWSA9IGpveXN0aWNrLnk7XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgbmFtZTogJ2R1ZGUnXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIG5hbWU6ICdqb3lzdGljaycsXG4gIHByb3BzOiB7XG4gICAgeDogMCxcbiAgICB5OiAwLFxuICAgIHJhZGl1czogMFxuICB9LFxuICB1cGRhdGU6IGZ1bmN0aW9uKHNlY29uZHMsIGpveXN0aWNrKSB7XG4gICAgdGhpcy54ID0gam95c3RpY2sueDtcbiAgICB0aGlzLnkgPSBqb3lzdGljay55O1xuICAgIHRoaXMucmFkaXVzID0gam95c3RpY2sucmFkaXVzO1xuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIG5hbWU6ICdsZXZlbCcsXG4gIHByb3BzOiB7XG4gICAgbWFwV2lkdGg6IDEwMCxcbiAgICBtYXBIZWlnaHQ6IDEwMFxuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIG5hbWU6ICdwbGF5ZXInXG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIG5hbWU6ICdwb3NpdGlvbicsXG4gIHByb3BzOiB7XG4gICAgeDogWzAsIDAsIDBdLFxuICAgIHk6IFswLCAwLCAwXSxcbiAgICBpbnRlcnZhbDogWzEsIDEsIDFdLFxuICAgIG1vdmVUbzogZnVuY3Rpb24oeCwgeSwgc2Vjb25kcykge1xuICAgICAgdGhpcy54LnVuc2hpZnQoeCk7XG4gICAgICB0aGlzLngucG9wKCk7XG5cbiAgICAgIHRoaXMueS51bnNoaWZ0KHkpO1xuICAgICAgdGhpcy55LnBvcCgpO1xuXG4gICAgICB0aGlzLmludGVydmFsLnVuc2hpZnQoc2Vjb25kcyk7XG4gICAgICB0aGlzLmludGVydmFsLnBvcCgpO1xuICAgIH1cbiAgfSxcbiAgc2V0U3RhdGU6IGZ1bmN0aW9uKHByb3BzKSB7XG4gICAgaWYgKCFwcm9wcykgcmV0dXJuO1xuXG4gICAgdmFyIHggPSBwcm9wcy54O1xuICAgIHZhciB5ID0gcHJvcHMueTtcbiAgICByZXR1cm4ge1xuICAgICAgeDogW3gsIHgsIHhdLFxuICAgICAgeTogW3ksIHksIHldXG4gICAgfTtcbiAgfSxcbiAgZ2V0U3RhdGU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciB2eDAgPSAodGhpcy54WzBdIC0gdGhpcy54WzFdKSAvIHRoaXMuaW50ZXJ2YWxbMV07XG4gICAgdmFyIHZ4MSA9ICh0aGlzLnhbMV0gLSB0aGlzLnhbMl0pIC8gdGhpcy5pbnRlcnZhbFsyXTtcblxuICAgIHZhciB2eTAgPSAodGhpcy55WzBdIC0gdGhpcy55WzFdKSAvIHRoaXMuaW50ZXJ2YWxbMV07XG4gICAgdmFyIHZ5MSA9ICh0aGlzLnlbMV0gLSB0aGlzLnlbMl0pIC8gdGhpcy5pbnRlcnZhbFsyXTtcblxuICAgIHJldHVybiB7XG4gICAgICBweDogdGhpcy54WzBdLFxuICAgICAgcHk6IHRoaXMueVswXSxcbiAgICAgIHZ4OiB2eDAsXG4gICAgICB2eTogdnkwLFxuICAgICAgYXg6IHZ4MCAtIHZ4MSxcbiAgICAgIGF5OiB2eTAgLSB2eTEsXG4gICAgICBzcGVlZDogTWF0aC5zcXJ0KHZ4MCAqIHZ4MCArIHZ5MCAqIHZ5MClcbiAgICB9O1xuICB9XG59O1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIG5hbWU6ICd3YWxraW5nJyxcbiAgcHJvcHM6IHtcbiAgICBwb3dlcjogMTMsXG4gICAgbWF4U3BlZWQ6IDIyMCxcbiAgICBzbG93RG93bjogMC45NixcbiAgICBkaXN0YW5jZTogMFxuICB9LFxuICB1cGRhdGU6IGZ1bmN0aW9uKHNlY29uZHMpIHtcbiAgICB2YXIgZGlyWCA9IHRoaXMuZGlyWCB8fCAwO1xuICAgIHZhciBkaXJZID0gdGhpcy5kaXJZIHx8IDA7XG5cbiAgICB2YXIgaW1wdWxzZVggPSB0aGlzLnBvd2VyICogZGlyWDtcbiAgICB2YXIgaW1wdWxzZVkgPSB0aGlzLnBvd2VyICogZGlyWTtcblxuICAgIHZhciB2eCA9ICh0aGlzLnhbMF0gLSB0aGlzLnhbMV0pIC8gdGhpcy5pbnRlcnZhbFsxXTtcbiAgICB2YXIgdnkgPSAodGhpcy55WzBdIC0gdGhpcy55WzFdKSAvIHRoaXMuaW50ZXJ2YWxbMV07XG5cbiAgICB2YXIgZHggPSB2eCAqIHRoaXMuc2xvd0Rvd24gKyBpbXB1bHNlWDtcbiAgICB2YXIgZHkgPSB2eSAqIHRoaXMuc2xvd0Rvd24gKyBpbXB1bHNlWTtcbiAgICB2YXIgc3BlZWQgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuXG4gICAgaWYgKHNwZWVkID4gdGhpcy5tYXhTcGVlZCkge1xuICAgICAgZHggKj0gdGhpcy5tYXhTcGVlZCAvIHNwZWVkO1xuICAgICAgZHkgKj0gdGhpcy5tYXhTcGVlZCAvIHNwZWVkO1xuICAgIH1cblxuICAgIHZhciBuZXdYID0gdGhpcy54WzBdICsgZHggKiBzZWNvbmRzO1xuICAgIHZhciBuZXdZID0gdGhpcy55WzBdICsgZHkgKiBzZWNvbmRzO1xuXG4gICAgdGhpcy5kaXN0YW5jZSArPSBzcGVlZCAqIHNlY29uZHM7XG4gICAgdGhpcy5tb3ZlVG8obmV3WCwgbmV3WSwgc2Vjb25kcyk7XG4gIH1cbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgbmFtZTogJ3dhbmRlcmluZycsXG4gIHByb3BzOiB7XG4gICAgZ29hbFg6IDAsXG4gICAgZ29hbFk6IDBcbiAgfSxcbiAgdXBkYXRlOiBmdW5jdGlvbihzZWNvbmRzKSB7XG4gICAgdmFyIHggPSB0aGlzLnhbMF07XG4gICAgdmFyIHkgPSB0aGlzLnlbMF07XG5cbiAgICB2YXIgZHggPSB0aGlzLmdvYWxYIC0geDtcbiAgICB2YXIgZHkgPSB0aGlzLmdvYWxZIC0geTtcblxuICAgIGlmIChNYXRoLmFicyhkeCkgPCAxICYmIE1hdGguYWJzKGR5KSA8IDEpIHtcbiAgICAgIHRoaXMuZ29hbFggPSB4ICsgTWF0aC5yYW5kb20oKSAqIDMwMCAtIDE1MDtcbiAgICAgIHRoaXMuZ29hbFkgPSB5ICsgTWF0aC5yYW5kb20oKSAqIDMwMCAtIDE1MDtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZHggKiBkeCArIGR5ICogZHkpO1xuICAgIHZhciByYXRpbyA9IDEgLyBkaXN0YW5jZTtcblxuICAgIHRoaXMuZGlyWCA9IGR4ICogcmF0aW87XG4gICAgdGhpcy5kaXJZID0gZHkgKiByYXRpbztcbiAgfVxufTtcbiIsIkhBTkRKUy5kb05vdFByb2Nlc3NDU1MgPSB0cnVlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEpveXN0aWNrO1xuXG5mdW5jdGlvbiBKb3lzdGljayhjb250YWluZXIpIHtcbiAgdGhpcy5yZXNpemUgPSBfLmRlYm91bmNlKHRoaXMucmVzaXplLmJpbmQodGhpcyksIDUwMCwgeyBsZWFkaW5nOiB0cnVlIH0pO1xuXG4gIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICB0aGlzLmRlYWR6b25lID0gMC4xO1xuICB0aGlzLnJlc2l6ZSgpO1xuXG4gIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIHRoaXMub25Eb3duLmJpbmQodGhpcyksIGZhbHNlKTtcbiAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgdGhpcy5vbk1vdmUuYmluZCh0aGlzKSwgZmFsc2UpO1xuICBjb250YWluZXIuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgdGhpcy5vbkNhbmNlbC5iaW5kKHRoaXMpLCBmYWxzZSk7XG4gIGNvbnRhaW5lci5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyb3V0JywgdGhpcy5vbkNhbmNlbC5iaW5kKHRoaXMpLCBmYWxzZSk7XG5cbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIHRoaXMucmVzaXplKTtcbn1cblxuSm95c3RpY2sucHJvdG90eXBlLnJlc2l6ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgd2lkdGggPSB0aGlzLndpZHRoID0gdGhpcy5jb250YWluZXIuY2xpZW50V2lkdGg7XG4gIHZhciBoZWlnaHQgPSB0aGlzLmhlaWdodCA9IHRoaXMuY29udGFpbmVyLmNsaWVudEhlaWdodFxuICB2YXIgcG9ydHJhaXQgPSB3aWR0aCA8IGhlaWdodDtcbiAgdmFyIG1hcmdpbiA9IDMyO1xuXG4gIHRoaXMucmFkaXVzID0gTWF0aC5taW4oMTAwLCAocG9ydHJhaXQgPyB3aWR0aCA6IGhlaWdodCkgKiAwLjMpO1xuICB0aGlzLmN4ID0gcG9ydHJhaXQgPyB3aWR0aCAqIDAuNSA6IG1hcmdpbiArIHRoaXMucmFkaXVzO1xuICB0aGlzLmN5ID0gcG9ydHJhaXQgPyBoZWlnaHQgLSBtYXJnaW4gLSB0aGlzLnJhZGl1cyA6IGhlaWdodCAqIDAuNTtcbiAgdGhpcy5hbmdsZSA9IDA7XG4gIHRoaXMubWFnbml0dWRlID0gMDtcbiAgdGhpcy5jdXJyZW50ID0gdW5kZWZpbmVkO1xufTtcblxuSm95c3RpY2sucHJvdG90eXBlLm9uRG93biA9IGZ1bmN0aW9uKGUpIHtcbiAgaWYgKHRoaXMuY3VycmVudCkgcmV0dXJuO1xuXG4gIHZhciBwb2ludGVyID0gdGhpcy5wb2ludGVyRnJvbUV2ZW50KGUpO1xuXG4gIHZhciBkeCA9IHBvaW50ZXIueCAtIHRoaXMuY3g7XG4gIHZhciBkeSA9IHBvaW50ZXIueSAtIHRoaXMuY3k7XG4gIHZhciBkaXN0YW5jZSA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG5cbiAgaWYgKGRpc3RhbmNlID4gdGhpcy5yYWRpdXMpIHJldHVybjtcblxuICBlLnByZXZlbnREZWZhdWx0KCk7XG4gIHRoaXMudXBkYXRlUG9pbnRlcihwb2ludGVyKTtcbn07XG5cbkpveXN0aWNrLnByb3RvdHlwZS5vbk1vdmUgPSBmdW5jdGlvbihlKSB7XG4gIGlmICghdGhpcy5jdXJyZW50KSByZXR1cm47XG5cbiAgdmFyIHBvaW50ZXIgPSB0aGlzLnBvaW50ZXJGcm9tRXZlbnQoZSk7XG5cbiAgaWYgKHBvaW50ZXIuaWQgIT09IHRoaXMuY3VycmVudC5pZCkgcmV0dXJuO1xuXG4gIGUucHJldmVudERlZmF1bHQoKTtcbiAgdGhpcy51cGRhdGVQb2ludGVyKHBvaW50ZXIpO1xufTtcblxuSm95c3RpY2sucHJvdG90eXBlLm9uQ2FuY2VsID0gZnVuY3Rpb24oZSkge1xuICBpZiAoIXRoaXMuY3VycmVudCkgcmV0dXJuO1xuICBpZiAodGhpcy5wb2ludGVyRnJvbUV2ZW50KGUpLmlkID09PSB0aGlzLmN1cnJlbnQuaWQpIHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgdGhpcy5jbGVhclBvaW50ZXIoKTtcbiAgfVxufTtcblxuSm95c3RpY2sucHJvdG90eXBlLnVwZGF0ZVBvaW50ZXIgPSBmdW5jdGlvbihwb2ludGVyKSB7XG4gIHZhciBkeCA9IHBvaW50ZXIueCAtIHRoaXMuY3g7XG4gIHZhciBkeSA9IHBvaW50ZXIueSAtIHRoaXMuY3k7XG4gIHZhciBkaXN0YW5jZSA9IE1hdGguc3FydChkeCAqIGR4ICsgZHkgKiBkeSk7XG5cbiAgdGhpcy5hbmdsZSA9IE1hdGguYXRhbjIoZHksIGR4KTtcbiAgdGhpcy5tYWduaXR1ZGUgPSBNYXRoLm1pbigxLCBkaXN0YW5jZSAvIHRoaXMucmFkaXVzKTtcbiAgdGhpcy5jdXJyZW50ID0gcG9pbnRlcjtcbn07XG5cbkpveXN0aWNrLnByb3RvdHlwZS5jbGVhclBvaW50ZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5jdXJyZW50ID0gdW5kZWZpbmVkO1xuICB0aGlzLmFuZ2xlID0gMDtcbiAgdGhpcy5tYWduaXR1ZGUgPSAwO1xufTtcblxuSm95c3RpY2sucHJvdG90eXBlLmdldFN0YXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgeDogdGhpcy5jeCxcbiAgICB5OiB0aGlzLmN5LFxuICAgIHJhZGl1czogdGhpcy5yYWRpdXNcbiAgfTtcbn1cblxuSm95c3RpY2sucHJvdG90eXBlLmdldFhZID0gZnVuY3Rpb24oKSB7XG4gIHZhciBtYWduaXR1ZGUgPSB0aGlzLm1hZ25pdHVkZSA+IHRoaXMuZGVhZHpvbmUgPyB0aGlzLm1hZ25pdHVkZSA6IDA7XG4gIHJldHVybiB7XG4gICAgeDogTWF0aC5jb3ModGhpcy5hbmdsZSkgKiBtYWduaXR1ZGUsXG4gICAgeTogTWF0aC5zaW4odGhpcy5hbmdsZSkgKiBtYWduaXR1ZGVcbiAgfTtcbn07XG5cbkpveXN0aWNrLnByb3RvdHlwZS5wb2ludGVyRnJvbUV2ZW50ID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgcmV0dXJuIHtcbiAgICBpZDogZXZlbnQucG9pbnRlcklkLFxuICAgIHg6IGV2ZW50LmNsaWVudFgsXG4gICAgeTogZXZlbnQuY2xpZW50WVxuICB9O1xufTtcbiJdfQ==
