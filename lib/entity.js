function Entity(id, system) {
  this.system = system;
  this.id = id;
  this.components = {};
  this.state = {};
}

Entity.prototype.add = function(name) {
  var component = this.system.getComponent(name);
  var keys = Object.keys(component.props);

  _.extend(this.state, component.props);
  this.components[name] = component.get || this.defaultGetter(keys);

  return this;
};

Entity.prototype.defaultGetter = function(keys) {
  return function get(state) {
    return keys.reduce(addKey, {});

    function addKey(transformedState, key) {
      transformedState[key] = state[key];
      return transformedState;
    }
  };
};

Entity.prototype.getState = function() {
  var state = this.state;
  var getters = this.components;
  var componentNames = Object.keys(getters);

  return componentNames.reduce(getComponentState, {
    id: this.id,
    components: Object.keys(this.components)
  });

  function getComponentState(transformedState, componentName) {
    var get = getters[componentName];
    _.extend(transformedState, get(state));
    return transformedState;
  }
};

Entity.prototype.has = function(names) {
  var len = names.length;
  for (var i = 0; i < len; i++) {
    if (!this.components[names[i]]) return false;
  }
  return true;
};
