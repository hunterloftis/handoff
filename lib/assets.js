function Assets() {
  this.assets = [
    'images/grass_tile.jpg',
    'images/robot.png'
  ];
  this.loader = new PIXI.AssetLoader(this.assets);
}

Assets.prototype.load = function(loaded) {
  this.loader.onComplete = loaded.bind(this);
  this.loader.load();
};

