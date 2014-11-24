var wanderingSystem = {
  name: 'wandering',
  props: {
    goalX: 0,
    goalY: 0
  },
  update: function(seconds) {
    var x = this.x[0];
    var y = this.y[0];

    var dx = this.goalX - x;
    var dy = this.goalY - y;

    if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
      this.goalX = x + Math.random() * 300 - 150;
      this.goalY = y + Math.random() * 300 - 150;
      return;
    }

    var distance = Math.sqrt(dx * dx + dy * dy);
    var ratio = 1 / distance;

    this.dirX = dx * ratio;
    this.dirY = dy * ratio;
  },
  getState: function() {
    return {
      goalX: this.goalX,
      goalY: this.goalY
    };
  }
};
