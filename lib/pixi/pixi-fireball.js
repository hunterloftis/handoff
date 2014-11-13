function PixiFireball(id, container) {
  PIXI.DisplayObjectContainer.call(this);

  this.id = id;

  this.circle = new PIXI.Graphics();
  this.circle.beginFill(0xffff00);
  this.circle.drawCircle(0, 0, 10);
  this.circle.endFill();
  this.circle.alpha = 0.9;
  this.circle.blendMode = PIXI.blendModes.ADD;

  this.addChild(this.circle);
  container.addChild(this);
}

PixiFireball.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);

PixiFireball.prototype.render = function(seconds, state, spellState) {
  if (spellState.bound) {
    this.circle.position.set(0, -64);
    this.position.set(state.player.x, state.player.y + 1);
  }
  else {
    this.circle.position.set(0, -32);
    this.position.set(spellState.x, spellState.y);
  }
};
