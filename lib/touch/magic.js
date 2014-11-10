(function() {

  window.Magic = Magic;

  function Magic(container) {
    this.container = container;
    this.pointers = [];
    this.delay = 1000;
    this.timeout = undefined;
    this.actives = [];

    container.addEventListener('pointerdown', this.onDown.bind(this), false);
    container.addEventListener('pointermove', this.onMove.bind(this), false);
    container.addEventListener('pointerup', this.onEnd.bind(this), false);
    container.addEventListener('pointerout', this.onEnd.bind(this), false);
  }

  Magic.prototype.onDown = function(e) {
    var pointer = pointerFromEvent(e);
    this.pointers.push(pointer);
    this.actives.push(pointer.id);
    clearTimeout(this.timeout);
  };

  Magic.prototype.onMove = function(e) {
    var pointer = pointerFromEvent(e);
    var match = _.find(this.pointers, { id: pointer.id });
    if (!match) return;
    match.history.push({
      x: pointer.x,
      y: pointer.y
    });
  };

  Magic.prototype.onEnd = function(e) {
    var pointer = pointerFromEvent(e);
    var match = this.actives.indexOf(pointer.id);
    if (match === -1) return;

    this.actives.splice(match, 1);
    clearTimeout(this.timeout);
    if (this.actives.length === 0) {
      this.timeout = setTimeout(this.recognize.bind(this), this.delay);
    }
  };

  Magic.prototype.recognize = function() {
    alert('recognizing!');
  };

  function pointerFromEvent(event) {
    return {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      history: [{ x: event.clientX, y: event.clientY }]
    };
  };

})();
