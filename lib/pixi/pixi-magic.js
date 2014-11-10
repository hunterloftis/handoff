function PixiMagic() {
  this.gfx = new PIXI.Graphics();
}

PixiMagic.prototype.render = function(seconds, state) {
  var gfx = this.gfx;

  gfx.clear();
  gfx.lineStyle(20, 0x00ffff, 0.7);

  state.paths.forEach(drawPath);

  function drawPath(path) {
    gfx.moveTo(path[0].x, path[0].y);
    for (var i = 0; i < path.length; i++) {
      gfx.lineTo(path[i].x, path[i].y);
    }
  }
};
