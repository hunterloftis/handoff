function Remote(renderer) {
  this.renderer = renderer;
}

Remote.prototype.broadcast = function(seconds, state) {
  //this.ws.send({ seconds: seconds, state: state });
};

Remote.prototype.start = function() {
  var seconds, state;

  this.ws.on('data', onData);
  requestAnimationFrame(frame.bind(this));

  function onData(data) {
    seconds = data.seconds;
    state = data.state;
  }

  function frame() {
    if (seconds && state) {
      this.renderer.render(seconds, state);
    }
    requestAnimationFrame(frame.bind(this));
  }
};
