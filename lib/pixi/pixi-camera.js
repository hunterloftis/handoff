function PixiCamera(container) {
  PIXI.DisplayObjectContainer.call(this);

  this.baseZoom = 1.5;
  this.trail = 0.3;
  this.lift = 50;

  this.zoom = 1;
  this.targetX = 0;
  this.targetY = 0;

  this.scaler = new PIXI.DisplayObjectContainer();

  container.addChild(this.scaler);
  this.scaler.addChild(this);
}

PixiCamera.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);

PixiCamera.prototype.followTarget = function(seconds, target) {
  var dx = target.x - this.targetX;
  var dy = target.y - this.targetY - this.lift;
  var wantedZoom = this.baseZoom / (target.speed * 0.001 + 1);
  var dZoom = wantedZoom - this.zoom;
  var correction = Math.min(seconds / this.trail, 1);

  this.zoom += dZoom * correction;
  this.targetX += dx * correction;
  this.targetY += dy * correction;

  this.position.set(-this.targetX, -this.targetY);
  this.scaler.scale.set(this.zoom);
};
