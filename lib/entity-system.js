function EntitySystem(components) {
  this.components = components;
  this.entities = [];
}

EntitySystem.prototype.create = function(id) {
  var newEntity = new Entity(id, this);
  this.entities.push(newEntity);
  return newEntity;
};

// TODO: Make fast.

EntitySystem.prototype.with = function(componentNames) {
  return this.entities.filter(hasComponents);

  function hasComponents(entity) {
    return entity.has(componentNames);
  }
};

EntitySystem.prototype.getComponent = function(name) {
  return this.components[name];
};

EntitySystem.prototype.getState = function() {
  return this.entities.map(function getEntityState(entity) {
    return entity.getState();
  });
};
