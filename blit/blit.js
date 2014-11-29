(function() {

  var VERTEX_SHADER = [
    'attribute vec2 a_position;',

    'attribute vec2 a_texture;',
    'varying vec2 v_texture;',

    'uniform vec2 u_resolution;',

    'void main() {',
      // convert the rectangle from pixels to 0.0 to 1.0
      'vec2 zeroToOne = a_position / u_resolution;',

      // convert from 0->1 to 0->2
      'vec2 zeroToTwo = zeroToOne * 2.0;',

      // convert from 0->2 to -1->+1 (clipspace)
      'vec2 clipSpace = zeroToTwo - 1.0;',

      'gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);',

      // pass the texture coordinate to the fragment shader
      'v_texture = a_texture;',
    '}'
  ].join('\n');

  var FRAGMENT_SHADER =[
    'precision mediump float;',

    // our texture
    'uniform sampler2D u_image;',

    // the texture coords passed in from the vertex shader
    'varying vec2 v_texture;',

    'void main(void) {',
      'gl_FragColor = texture2D(u_image, v_texture);',
    '}'
  ].join('\n');

  // GL Utils

  function initGL(gl, width, height) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.depthFunc(gl.LEQUAL);
    gl.disable(gl.DEPTH_TEST);  // TODO: use this instead of y-sorting?
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

    // Provide the resolution (TODO: update on resize?)
    var resolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(resolutionLocation, width, height);

    return {
      position: vertexPosition,
      texture: vertexTexture
    };
  }

  function getGLContext(canvas, opts) {
    return canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
  }

  // Surface

  function Surface(canvas) {
    this.canvas = canvas;
    this.width = 0;
    this.height = 0;
    this.gl = getGLContext(canvas, { alpha: false, premultipliedAlpha: false });

    this.resize();
    this.attrs = initGL(this.gl, this.width, this.height);
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

  // Sprite

  function Sprite(surface, width, height, url) {
    this.surface = surface;
    this.loaded = false;
    this.width = width;
    this.height = height;
    this.image = new Image();
    this.image.onload = this._onLoad.bind(this);
    this.image.src = url;
  }

  Sprite.prototype._onLoad = function() {
    var gl = this.surface.gl;
    var image = this.image;

    this.loaded = true;

    // Create a new texture and assign it as the active one
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    // Load in the image
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

    // Setup scaling properties
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    // Unbind the texture
    gl.bindTexture(gl.TEXTURE_2D, null);
  };

  // TODO: enable depth sorting so you don't have to sort by y every frame?
  Sprite.prototype.blit = function(surface, x, y, frame) {
    var gl = surface.gl;
    var vertexPosition = surface.attrs.position;
    var vertexTexture = surface.attrs.texture;

    // Create a new buffer for the vertices
    var vertexBuffer = gl.createBuffer();

    // Bind it as the current buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);   // How is this working? what's this for?

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

    // Create a new buffer for the texture
    var textureBuffer = gl.createBuffer();

    // Bind it as the current buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);

    // Fill it with the texture data
    var textureCoords = new Float32Array([
      0.0, 0.0,
      1.0, 0.0,
      0.0, 1.0,
      0.0, 1.0,
      1.0, 0.0,
      1.0, 1.0
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, textureCoords, gl.STATIC_DRAW);

    // Connect texture buffer to shader's texture attribute
    gl.vertexAttribPointer(vertexTexture, 2, gl.FLOAT, false, 0, 0);

    // Set slot 0 as active texture
    //gl.activeTexture(this.GL.TEXTURE0); // TODO: necessary?

    // Load texture into memory
    gl.bindTexture(gl.TEXTURE_2D, this.texture);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  };

  // Export

  window.Blit = {
    Surface: Surface,
    Sprite: Sprite
  };

})();
