(function() {

  var VERTEX_SHADER = [
    'attribute vec2 a_position;',
    'uniform vec2 u_resolution;',

    'void main() {',
      // convert the rectangle from pixels to 0.0 to 1.0
      'vec2 zeroToOne = a_position / u_resolution;',

      // convert from 0->1 to 0->2
      'vec2 zeroToTwo = zeroToOne * 2.0;',

      // convert from 0->2 to -1->+1 (clipspace)
      'vec2 clipSpace = zeroToTwo - 1.0;',

      'gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);',
    '}'
  ].join('\n');

  var FRAGMENT_SHADER =[
    'void main(void) {',
      'gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);',
    '}'
  ].join('\n');

  function createShader(gl, type, source) {
    var shader = gl.createShader(gl[type]);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  function initShaders(gl, vShader, fShader, width, height) {
    var program = gl.createProgram();
    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    var resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, width, height);

    return gl.getAttribLocation(program, 'a_position');
  }

  function initBuffers(gl, posAttr) {
    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    // var vertices = [
    //   10, 20,
    //   80, 20,
    //   10, 30,
    //   10, 30,
    //   80, 20,
    //   80, 30
    // ];

    gl.enableVertexAttribArray(posAttr);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
  }

  function Surface(canvas) {
    this.canvas = canvas;
    this.width = 0;
    this.height = 0;
    this.gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

    initGL(this.gl);

    this.resize();

    this.vShader = createShader(this.gl, 'VERTEX_SHADER', VERTEX_SHADER);
    this.fShader = createShader(this.gl, 'FRAGMENT_SHADER', FRAGMENT_SHADER);

    var posAttr = initShaders(this.gl, this.vShader, this.fShader, this.width, this.height);
    initBuffers(this.gl, posAttr);
  }

  Surface.prototype.resize = function() {
    this.width = this.canvas.width = this.canvas.clientWidth;
    this.height = this.canvas.height = this.canvas.clientHeight;
    this.gl.viewport(0, 0, this.width, this.height);

    return {
      width: this.width,
      height: this.height
    };
  };

  Surface.prototype.clear = function(color) {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  };

  Surface.prototype.push = function() {

  };

  Surface.prototype.pop = function() {

  };

  Surface.prototype.translate = function(tx, ty) {

  };

  Surface.prototype.scale = function(scale) {

  };

  Surface.prototype.getRect = function() {
    return {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    };
  };

  function initGL(gl) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.DEPTH_TEST);  // TODO: use this instead of y-sorting?
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
  }

  function Sprite(url, width, height) {
    this.loaded = false;
    this.width = width;
    this.height = height;
    this.image = new Image();
    this.image.onload = this._onLoad.bind(this);
    this.image.src = url;
  }

  Sprite.prototype._onLoad = function() {
    this.loaded = true;
  };

  // TODO: enable depth sorting so you don't have to sort by y every frame
  Sprite.prototype.blit = function(surface, x, y, frame) {
    //surface.ctx.drawImage(this.image, x, y);
    var gl = surface.gl;
    var x1 = x;
    var x2 = x + this.width;
    var y1 = y;
    var y2 = y + this.height;

    var vertices = new Float32Array([
      x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2
    ]);

    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };


  window.Blit = {
    Surface: Surface,
    Sprite: Sprite
  };

})();
