function PixiPlayer(container) {
  this.scale = 1;
  this.walkingSpeedLimit = 5;
  this.strideLength = 10;
  this.squashStretch = 1;

  this.mc = PIXI.MovieClip.fromFrames(this.listCharacterFrames());
  this.mc.scale.set(this.scale);
  this.mc.anchor.set(0.5, 0.9);

  // var blur = new PIXI.BlurFilter();
  // blur.blur = 1;
  // blur.blurX = 3;
  // blur.blurY = 2;

  this.shadow = new PIXI.Graphics();
  this.shadow.beginFill(0x000000);
  this.shadow.drawEllipse(0, 0, 16, 8);
  this.shadow.endFill();
  this.shadow.position.set(2, 2);
  this.shadow.alpha = 0.25;
  // this.shadow.filters = [blur];    // TODO: why doesn't this work?
  // this.shadow.cacheAsBitmap = true;   // TODO: this never seems to work
  this.shadow.blendMode = PIXI.blendModes.MULTIPLY;

  this.group = new PIXI.DisplayObjectContainer();

  this.group.addChild(this.shadow);
  this.group.addChild(this.mc);
  container.addChild(this.group);
}

// TODO: Does Pixi have something like this out of the box?
PixiPlayer.prototype.listCharacterFrames = function() {
  var charFrames = [];
  for (var i = 1; i <= 72; i++) {
    charFrames.push('character/character_' + (i < 10 ? '0' + i : i));
  }
  return charFrames;
};

PixiPlayer.prototype.getDirection = function(x, y) {
  var angle = (Math.atan2(y, x) + Math.PI * 2) % (Math.PI * 2);

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
};

PixiPlayer.prototype.render = function(seconds, state) {
  var correction = Math.min(seconds / 0.1, 1);
  var direction = this.getDirection(state.vx, state.vy);
  var pose = state.speed > this.walkingSpeedLimit
    ? 8 - Math.floor(state.distance / this.strideLength) % 9
    : 8;
  var frame = pose + 9 * (direction - 1);

  var ss = this.squashStretch;
  var stretchX = this.scale + Math.abs(state.ax * 0.01 + state.vx * 0.0001) * ss;
  var leanX = (state.ax * 0.01 + state.vx * 0.0002) * Math.PI * ss;
  var stretchY = this.scale - (state.ay * 0.02 + state.vy * 0.0001) * ss;

  this.mc.gotoAndStop(frame);
  this.group.position.set(state.x, state.y);
  this.group.scale.x += (stretchX - this.group.scale.x) * correction;
  this.group.scale.y += (stretchY - this.group.scale.y) * correction;
  this.mc.rotation += (leanX - this.mc.rotation) * correction;

  // Publish downward steps into the event stream
  var stepForce = Math.sqrt(state.ax * state.ax + state.ay * state.ay);
  if (stepForce > 0.5 || (state.speed > this.walkingSpeedLimit && pose % 4 === 0)) {
    PubSub.publish('/player/step', state.x, state.y, stepForce);
  }
};
