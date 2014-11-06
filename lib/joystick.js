HANDJS.doNotProcessCSS = true;

function Joystick(container) {
  this.resize = _.debounce(this.resize.bind(this), 500, { leading: true });

  this.container = container;
  this.deadzone = 0.2;
  this.resize();

  container.addEventListener('pointerdown', this.onDown.bind(this), false);
  container.addEventListener('pointermove', this.onMove.bind(this), false);
  container.addEventListener('pointerup', this.onCancel.bind(this), false);
  container.addEventListener('pointerout', this.onCancel.bind(this), false);

  window.addEventListener('resize', this.resize);
}

Joystick.prototype.resize = function() {
  var width = this.width = this.container.clientWidth;
  var height = this.height = this.container.clientHeight
  var portrait = width < height;
  var margin = 20;

  this.radius = 150;
  this.cx = portrait ? 0 : -500 + margin + this.radius;
  this.cy = portrait ? 500 - this.radius - margin : 0;
  this.angle = 0;
  this.magnitude = 0;
  this.current = undefined;
  this.scale = portrait ? width / 1000 : height / 1000;
};

Joystick.prototype.onDown = function(e) {
  if (this.current) return;

  var pointer = this.scaledPointer(e);

  console.log('pointer:', pointer);

  var dx = pointer.x - this.cx;
  var dy = pointer.y - this.cy;
  var distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > this.radius) return;

  e.preventDefault();
  this.updatePointer(pointer);
};

Joystick.prototype.onMove = function(e) {
  if (!this.current) return;

  var pointer = this.scaledPointer(e);

  if (pointer.id !== this.current.id) return;

  e.preventDefault();
  this.updatePointer(pointer);
};

Joystick.prototype.onCancel = function(e) {
  if (!this.current) return;
  if (this.scaledPointer(e).id === this.current.id) {
    e.preventDefault();
    this.clearPointer();
  }
};

Joystick.prototype.updatePointer = function(pointer) {
  var dx = pointer.x - this.cx;
  var dy = pointer.y - this.cy;
  var distance = Math.sqrt(dx * dx + dy * dy);

  this.angle = Math.atan2(dy, dx);
  this.magnitude = Math.min(1, distance / this.radius);
  this.current = pointer;
};

Joystick.prototype.clearPointer = function() {
  this.current = undefined;
  this.angle = 0;
  this.magnitude = 0;
};

Joystick.prototype.getCircle = function() {
  return {
    x: this.cx,
    y: this.cy,
    radius: this.radius
  };
}

Joystick.prototype.getXY = function() {
  var magnitude = this.magnitude > this.deadzone ? this.magnitude : 0;
  return {
    x: Math.cos(this.angle) * magnitude,
    y: Math.sin(this.angle) * magnitude
  };
};

Joystick.prototype.scaledPointer = function(event) {
  console.log('clientX:', event.clientX, 'clientY:', event.clientY, 'scale:', this.scale);
  console.log('cx:', this.width * 0.5, 'cy:', this.height * 0.5);
  return {
    id: event.pointerId,
    x: (event.clientX - this.width * 0.5) / this.scale,
    y: (event.clientY - this.width * 0.5) / this.scale
  };
};
