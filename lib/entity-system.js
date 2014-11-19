function EntitySystem(components) {
  this.components = components;
  this.entities = [];
  this.lookup = {};
}

EntitySystem.prototype.create = function(id) {
  var entity = { id: id };
  this.entities.push(entity);
  this.lookup[id] = {
    entity: entity,
    components: {}
  };
  return {
    add: this.add.bind(this, entity)
  };
};


EntitySystem.prototype.add = function(entity, componentName, props) {
  var id = entity.id;
  var component = this.components[componentName];

  if (!component) throw new Error('No component with name:' + componentName);

  _.extend(entity, component, props);
  delete entity.get;
  this.lookup[id].components[componentName] = true;

  return {
    add: this.add.bind(this, entity)
  };
};

// TODO: Make fast.

EntitySystem.prototype.with = function(components) {
  var len = components.length;
  var lookup = this.lookup;

  return this.entities.filter(hasComponents);

  function hasComponents(entity) {
    var id = entity.id;
    for (var i = 0; i < len; i++) {
      if (!lookup[id].components[components[i]]) {
        return false;
      }
    }
    return true;
  }
}

EntitySystem.prototype.getState = function() {
  var lookup = this.lookup;
  var components = this.components;

  return this.entities.map(getEntityState);

  function getEntityState(entity) {
    var componentNames = Object.keys(lookup[entity.id].components);
    return componentNames.reduce(getComponentState, {
      id: entity.id,
      components: componentNames
    });
  }

  function getComponentState(state, componentName) {
    return _.extend(state, components[componentName].get());
  }
};
