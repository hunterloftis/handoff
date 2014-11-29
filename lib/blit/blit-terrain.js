function BlitTerrain(surface) {
  this.surface = surface;
  this.sprite = new Blit.Sprite(this.surface, 128, 128, 'images/dirt.jpg');
}

BlitTerrain.prototype.render = function(seconds, map, rect) {
  var width = this.sprite.width;
  var height = this.sprite.height;

  var ox = Math.floor(rect.left / width) * width;
  var oy = Math.floor(rect.top / height) * height;

  for (var y = oy; y < rect.bottom; y += width) {
    for (var x = ox; x < rect.right; x += height) {
      this.sprite.blit(x, y, 0);
    }
  }
};
