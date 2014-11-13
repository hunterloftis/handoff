function PixiCamera(container) {
  PIXI.DisplayObjectContainer.call(this);

  this.baseZoom = 2;
  this.trail = 0.3;
  this.lift = 50;
  this.zoomOut = 0.002;
  this.drag = 0.1;

  this.zoom = 1;
  this.targetX = 0;
  this.targetY = 0;
  this.lastTargetX = 0;
  this.lastTargetY = 0;

  this.scaler = new PIXI.DisplayObjectContainer();

  container.addChild(this.scaler);
  this.scaler.addChild(this);
}

PixiCamera.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);

PixiCamera.prototype.followTarget = function(seconds, target) {
  var dx = target.x - this.targetX;
  var dy = target.y - this.targetY - this.lift;
  var wantedZoom = this.baseZoom / (target.speed * this.zoomOut + 1);
  var dZoom = wantedZoom - this.zoom;
  var correction = Math.min(seconds / this.trail, 1);

  this.zoom += dZoom * correction;
  this.targetX += dx * correction;
  this.targetY += dy * correction;

  this.position.set(-this.targetX, -this.targetY);
  this.scaler.scale.set(this.zoom);
};

PixiCamera.prototype.update = function(seconds) {
  var efficiency = 1 - this.drag;
  var vx = (this.targetX - this.lastTargetX) * efficiency;
  var vy = (this.targetY - this.lastTargetY) * efficiency;

  this.targetX += vx * seconds;
  this.targetY += vy * seconds;
  this.lastTargetX = this.targetX;
  this.lastTargetY = this.targetY;

  this.position.set(-this.targetX, -this.targetY);
  this.scaler.scale.set(this.zoom);
}

PixiCamera.prototype.leadTarget = function(seconds, target) {
  var projectedX = target.x + target.vx * 0.7;
  var projectedY = target.y + target.vy * 0.7;
  var dx = projectedX - this.targetX;
  var dy = projectedY - this.targetY - this.lift;
  var wantedZoom = this.baseZoom / (target.speed * this.zoomOut + 1);
  var dZoom = wantedZoom - this.zoom;
  var correction = Math.min(seconds / this.trail, 1);

  this.zoom += dZoom * correction;
  this.targetX += dx * correction;
  this.targetY += dy * correction;
};
