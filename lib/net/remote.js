function Remote(renderer) {
  this.renderer = renderer;

  var host = location.origin.replace(/^http/, 'ws')
  this.ws = new WebSocket(host);
}

Remote.prototype.broadcast = function(seconds, state) {
  if (this.ws.readyState !== WebSocket.OPEN) return;
  this.ws.send(JSON.stringify({ seconds: seconds, state: state }));
};

Remote.prototype.start = function() {
  var seconds, state;

  this.ws.onmessage = function onMessage(event) {
    var data = JSON.parse(event.data);
    seconds = data.seconds;
    state = data.state;
  };

  requestAnimationFrame(frame.bind(this));

  function frame() {
    if (seconds && state) {
      this.renderer.render(seconds, state);
    }
    requestAnimationFrame(frame.bind(this));
  }
};
