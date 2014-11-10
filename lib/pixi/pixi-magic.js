function PixiMagic() {
  // TODO: blur breaks pixi on my phone
  var blur = new PIXI.BlurFilter();
  blur.blur = 10;

  this.group = new PIXI.DisplayObjectContainer();

  // this.glow = new PIXI.Graphics();
  // this.glow.blendMode = PIXI.blendModes.ADD;
  // this.glow.alpha = 0.8;

  this.lines = new PIXI.Graphics();
  this.lines.blendMode = PIXI.blendModes.ADD;
  this.lines.alpha = 1;

  //this.group.addChild(this.glow);
  this.group.addChild(this.lines);
  this.group.filters = [blur];

  this.pulse = 0;
}

PixiMagic.prototype.render = function(seconds, state) {
  this.pulse += seconds * 4;

  //renderTo(this.glow, 30, (Math.sin(this.pulse) + 9) / 10);
  renderTo(this.lines, 25, (Math.sin(this.pulse) + 7) / 8);

  function renderTo(target, size, alpha) {
    target.clear();
    target.lineStyle(size, 0x00ffff, alpha);

    state.paths.forEach(drawPath);

    function drawPath(path) {
      target.moveTo(path[0].x, path[0].y);
      if (path.length === 1) {
        target.lineTo(path[0].x, path[0].y + 10);
      }
      for (var i = 0; i < path.length; i++) {
        target.lineTo(path[i].x, path[i].y);
      }
    }
  }
};
