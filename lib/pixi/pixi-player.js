function PixiPlayer() {
  this.scale = 2.25;
  this.walkingSpeedLimit = 10;
  this.strideLength = 25;

  this.leanX = 0;
  this.leanY = 0;

  this.mc = PIXI.MovieClip.fromFrames(this.listCharacterFrames());
  this.mc.scale.set(this.scale);
  this.mc.anchor.set(0.5, 0.8);
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
  var direction = this.getDirection(state.vx, state.vy);
  var pose = state.speed > this.walkingSpeedLimit
    ? 8 - Math.floor(state.distance / this.strideLength) % 9
    : 8;
  var frame = pose + 9 * (direction - 1);

  var stretchX = this.scale + Math.abs(state.ax * 0.01 + state.vx * 0.0001);
  var leanX = (state.ax * 0.006 + state.vx * 0.0001) * Math.PI;
  var stretchY = this.scale - (state.ay * 0.02 + state.vy * 0.0001);
  var correction = Math.min(seconds / 0.1, 1);

  this.mc.gotoAndStop(frame);
  this.mc.position.set(state.x, state.y);
  this.mc.scale.x += (stretchX - this.mc.scale.x) * correction;
  this.mc.scale.y += (stretchY - this.mc.scale.y) * correction;
  this.mc.rotation += (leanX - this.mc.rotation) * correction;
};
