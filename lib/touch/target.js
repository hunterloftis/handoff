(function() {

  window.Target = Target;

  function Target(container, renderer) {
    this.down = [];
    this.active = false;
    this.renderer = renderer;
    
    container.addEventListener('pointerdown', this.onDown.bind(this), false);
    container.addEventListener('pointerup', this.onUp.bind(this), false);

    PubSub.subscribe('target/request', this.setActive.bind(this, true));
  }

  Target.prototype.setActive = function(active) {
    this.active = active;
    this.down = [];
  };

  Target.prototype.onDown = function(e) {
    if (!this.active) return;

    this.down.push(pointerFromEvent(e));
    e.preventDefault();
    e.stopImmediatePropagation();
  };

  Target.prototype.onUp = function(e) {
    if (!this.active) return;

    var pointer = pointerFromEvent(e);
    var start = _.find(this.down, { id: pointer.id });
    if (!start) return;

    this.down.splice(start, 1);
    var dt = pointer.time - start.time;
    if (dt > 500) return;

    var dx = pointer.x - start.x;
    var dy = pointer.y - start.y;
    var distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 5) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    var mapped = this.renderer.pick(pointer.x, pointer.y);
    PubSub.publish('target/select', mapped.x, mapped.y);
    this.setActive(false);
  };

  function pointerFromEvent(event) {
    return {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      time: Date.now()
    };
  };

})();
