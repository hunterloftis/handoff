function PixiWorld(container) {
  this.ground = new PIXI.DisplayObjectContainer();
  this.actors = new PIXI.DisplayObjectContainer();
  this.overlay = new PIXI.DisplayObjectContainer();

  container.addChild(this.ground);
  container.addChild(this.actors);
  container.addChild(this.overlay);
}
