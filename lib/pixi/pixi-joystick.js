function PixiJoystick(container) {
  this.gfx = new PIXI.Graphics();
  this.gfx.alpha = 0.1;

  container.addChild(this.gfx);
}

PixiJoystick.prototype.render = function(seconds, state) {
  this.gfx.clear();
  this.gfx.lineStyle(10, 0xffffff)
  this.gfx.beginFill(0x000000);
  this.gfx.drawCircle(state.x, state.y, state.radius);
  this.gfx.endFill();
  this.gfx.beginFill(0xffffff);
  this.gfx.drawCircle(state.x, state.y, 10);
  this.gfx.endFill();
};
