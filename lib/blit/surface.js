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
