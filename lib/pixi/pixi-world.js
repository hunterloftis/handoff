function PixiWorld(container) {
  this.ground = new PIXI.DisplayObjectContainer();
  this.actors = new PIXI.DisplayObjectContainer();
  this.overlay = new PIXI.DisplayObjectContainer();

  container.addChild(this.ground);
  container.addChild(this.actors);
  container.addChild(this.overlay);

  this.checkIndex = 0;
}

PixiWorld.prototype.render = function(seconds) {
  this.actors.children.sort(byY);

  function byY(a, b) {
    return a.position.y - b.position.y;
  }
};