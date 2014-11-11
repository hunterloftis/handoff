function PixiWorld(container) {
  this.ground = new PIXI.SpriteBatch();
  this.actors = new PIXI.SpriteBatch();
  this.overlay = new PIXI.SpriteBatch();

  container.addChild(this.ground);
  container.addChild(this.actors);
  container.addChild(this.overlay);

  this.checkIndex = 0;
}

PixiWorld.prototype.render = function(seconds, target) {
  this.actors.children.sort(byY);

  function byY(a, b) {
    return a.position.y - b.position.y;
  }
};
