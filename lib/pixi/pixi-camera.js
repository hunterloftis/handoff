function PixiCameraContainer() {
  PIXI.DisplayObjectContainer.call(this);
}

PixiCameraContainer.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);

PixiCameraContainer.prototype.render = function(seconds, state) {

};
