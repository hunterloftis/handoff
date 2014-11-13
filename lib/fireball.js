function Fireball(x, y) {
  this.bound = true;
  this.x = undefined;
  this.y = undefined;
  this.id = Math.random();
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

Fireball.prototype.update = function(seconds) {

};
