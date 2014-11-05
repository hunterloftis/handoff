function Touch(container) {
  this.x = 0;
  this.y = 0;

  this.radius = 100;
  this.container = container;
  this.current = undefined;

  container.addEventListener('pointerdown', this.onDown.bind(this), false);
  container.addEventListener('pointermove', this.onMove.bind(this), false);
  container.addEventListener('pointerup', this.onCancel.bind(this), false);
  container.addEventListener('pointerout', this.onCancel.bind(this), false);
}

Touch.prototype.onDown = function(e) {
  if (this.current) return;

  this.current = pointerObjFromEvent(e);
};

Touch.prototype.onMove = function(e) {
  if (!this.current) return;

  var pointer = pointerObjFromEvent(e);
  if (pointer.id !== this.current.id) return;

  var dx = (pointer.x - this.current.x) / this.radius;
  var dy = (pointer.y - this.current.y) / this.radius;

  if (dx < -1) dx = -1;
  else if (dx > 1) dx = 1;
  if (dy < -1) dy = -1;
  else if (dy > 1) dy = 1;

  this.x = dx;
  this.y = dy;
};

Touch.prototype.onCancel = function(e) {
  if (!this.current) return;

  var pointer = pointerObjFromEvent(e);
  if (pointer.id === this.current.id) {
    this.current = undefined;
    this.x = 0;
    this.y = 0;
  }
};

function pointerObjFromEvent(event) {
  return {
    id: event.pointerId,
    x: event.clientX,
    y: event.clientY
  };
}
