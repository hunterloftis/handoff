(function() {

  window.Magic = Magic;

  function Magic(container) {
    this.successThreshold = 0.1;
    this.delay = 1500;

    this.container = container;
    this.timeout = undefined;
    this.recognizer = new PDollarRecognizer();
    this.active = [];
    this.completed = [];

    container.addEventListener('pointerdown', this.onDown.bind(this), false);
    container.addEventListener('pointermove', this.onMove.bind(this), false);
    container.addEventListener('pointerup', this.onEnd.bind(this), false);
    container.addEventListener('pointerout', this.onEnd.bind(this), false);
  }

  Magic.prototype.getState = function() {
    var active = _.pluck(this.active, 'history');
    var completed = _.pluck(this.completed, 'history');
    return {
      paths: active.concat(completed)
    };
  };

  Magic.prototype.onDown = function(e) {
    var pointer = pointerFromEvent(e);
    this.active.push(pointer);
    clearTimeout(this.timeout);
  };

  Magic.prototype.onMove = function(e) {
    var pointer = pointerFromEvent(e);
    var match = _.find(this.active, { id: pointer.id });
    if (!match) return;

    match.history.push({
      x: pointer.x,
      y: pointer.y
    });
  };

  Magic.prototype.onEnd = function(e) {
    var pointer = pointerFromEvent(e);
    var match = _.find(this.active, { id: pointer.id });
    if (!match) return;

    this.active = _.without(this.active, match);
    this.completed.push(match);

    clearTimeout(this.timeout);
    if (this.active.length === 0) {
      this.timeout = setTimeout(this.recognize.bind(this), this.delay);
    }
  };

  Magic.prototype.recognize = function() {
    var points = [];
    for (var i = 0; i < this.completed.length; i++) {
      for (var j = 0; j < this.completed[i].history.length; j++) {
        points.push({
          X: this.completed[i].history[j].x,
          Y: this.completed[i].history[j].y,
          ID: i
        });
      }
    }

    var result = this.recognizer.Recognize(points)

    if (result.score > this.successThreshold) {
      console.log('cast:', JSON.stringify(result));
      PubSub.publish('magic/cast', result.name);
    }
    else {
      console.log('fizzled:', JSON.stringify(result));
      PubSub.publish('magic/fizzle', result.name);
    }

    this.active = [];
    this.completed = [];
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
