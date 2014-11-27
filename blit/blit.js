(function() {

  function Surface(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 0;
    this.height = 0;

    this.resize();
  }

  Surface.prototype.resize = function() {
    this.width = this.canvas.width = this.canvas.clientWidth;
    this.height = this.canvas.height = this.canvas.clientHeight;
    return {
      width: this.width,
      height: this.height
    };
  };

  Surface.prototype.clear = function(color) {
    this.ctx.clearRect(0, 0, this.width, this.height);
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

  Sprite.prototype.blit = function(surface, x, y, frame) {
    surface.ctx.drawImage(this.image, x, y);
  };


  window.Blit = {
    Surface: Surface,
    Sprite: Sprite
  };

})();
