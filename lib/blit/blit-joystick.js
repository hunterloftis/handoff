function BlitJoystick(surface) {
  this.surface = surface;
  this.radius = 0;
  this.sprite = undefined;
}

BlitJoystick.prototype.render = function(seconds, joystick) {
  if (joystick.radius !== this.radius) {
    this.sprite = undefined;
    this.radius = joystick.radius;
  }
  if (!this.sprite) {
    this.sprite = this.generateSprite(this.radius);
  }
  this.sprite.blit(joystick.x - this.sprite.width * 0.5, joystick.y - this.sprite.height * 0.5);
};

BlitJoystick.prototype.generateSprite = function(radius) {
  var size = radius * 2;
  var sprite = new Blit.Sprite(this.surface, size, size);
  sprite.canvasFrame(0, function drawCircle(ctx, width, height) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.arc(radius, radius, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  return sprite;
}
