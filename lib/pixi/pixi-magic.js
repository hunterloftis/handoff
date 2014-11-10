function PixiMagic() {
  var blur = new PIXI.BlurFilter();
  blur.blur = 20;

  this.container = new PIXI.DisplayObjectContainer();

  this.glow = new PIXI.Graphics();
  this.glow.blendMode = PIXI.blendModes.ADD;
  this.glow.alpha = 1;
  this.glow.filters = [blur];

  this.lines = new PIXI.Graphics();
  this.lines.blendMode = PIXI.blendModes.ADD;
  this.lines.alpha = 0.5;

  this.container.addChild(this.glow);
  this.container.addChild(this.lines);

  this.pulse = 0;
}

PixiMagic.prototype.render = function(seconds, state) {
  this.pulse += seconds * 2;

  renderTo(this.glow, 30, (Math.sin(this.pulse) + 9) / 10);
  renderTo(this.lines, 10, 0.5);

  function renderTo(target, size, alpha) {
    target.alpha = alpha;
    target.clear();
    target.lineStyle(size, 0x00ffff, 1);

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
