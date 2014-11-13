function Fireball(x, y) {
  this.speed = 30;

  this.bound = true;
  this.x = undefined;
  this.y = undefined;
  this.id = Math.random();

  PubSub.publish('target/request');
  PubSub.subscribe('target/select', this.onTarget.bind(this));
}

Fireball.prototype.getState = function() {
  return {
    name: 'fireball',
    bound: this.bound,
    x: this.x,
    y: this.y,
    id: this.id
  };
};

// TODO: passing 'game' in here and making calls through it seems wonky
// better ideas?
Fireball.prototype.update = function(seconds, game) {
  if (!this.bound && this.x === void(0)) {
    var pos = game.player.getPosition();
    this.x = pos.x;
    this.y = pos.y;
  }

  var dx = this.targetX - this.x;
  var dy = this.targetY - this.y;
  var xRatio = dx / (dx + dy);
  var yRatio = dy / (dx + dy);
  var distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 5) return false;

  var speed = Math.min(this.speed, distance);

  this.x += speed * xRatio * seconds;
  this.y += speed * yRatio * seconds;
  return true;
};

Fireball.prototype.onTarget = function(x, y) {
  this.targetX = x;
  this.targetY = y;
  this.bound = false;
};
