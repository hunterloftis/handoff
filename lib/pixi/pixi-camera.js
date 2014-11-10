function PixiCameraContainer(zoomContainer) {
  PIXI.DisplayObjectContainer.call(this);

  this.zoom = 1;
  this.trail = 0.3;
  this.lift = 50;

  this.zoomContainer = zoomContainer;
  this.targetX = 0;
  this.targetY = 0;
}

PixiCameraContainer.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);

PixiCameraContainer.prototype.followTarget = function(seconds, scale, target) {
  var dx = target.x - this.targetX;
  var dy = target.y - this.targetY - this.lift;
  var wantedZoom = 1 / (target.speed * 0.001 + 1);
  var dZoom = wantedZoom - this.zoom;
  var correction = Math.min(seconds / this.trail, 1);

  this.zoom += dZoom * correction;
  this.targetX += dx * correction;
  this.targetY += dy * correction;

  this.position.set(-this.targetX, -this.targetY);
  this.zoomContainer.scale.set(scale * this.zoom);
};
