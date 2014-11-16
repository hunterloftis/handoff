function Remote() {

}

Remote.prototype.broadcast = function(seconds, state) {
  this.ws.send({ seconds: seconds, state: state });
}
