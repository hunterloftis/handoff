function PixiMagic(container) {
  // TODO: blur breaks pixi on my phone, but looked cool

  this.group = new PIXI.DisplayObjectContainer();

  this.lines = new PIXI.Graphics();
  this.lines.blendMode = PIXI.blendModes.ADD;
  this.lines.alpha = 1;

  this.group.addChild(this.lines);
  this.pulse = 0;

  container.addChild(this.group);
}

PixiMagic.prototype.render = function(seconds, state) {
  this.pulse += seconds * 4;

  renderTo(this.lines, 15, (Math.sin(this.pulse) + 7) / 8);

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
