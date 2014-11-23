function System(definition) {
  this.name = definition.name;
  this.definition = definition;
  this.members = [];
  this.getter = definition.getState || defaultGetter(definition.props || {});

  function defaultGetter(props) {
    return function copyProps() {
      return Object.keys(props).reduce(function addProp(state, key) {
        state[key] = this[key];
        return state;
      }.bind(this), {});
    }
  }
}

System.prototype.register = function(entity) {
  this.members.push(entity);
};

System.prototype.setInitialState = function(obj, overrides) {
  var setter = this.definition.setState;
  if (setter) overrides = setter(overrides);
  _.extend(obj, _.cloneDeep(this.definition.props), overrides);
};

System.prototype.update = function(args) {
  var update = this.definition.update;
  this.members.forEach(updateMember);

  function updateMember(entity) {
    update.apply(entity.state, args);
  }
};

System.prototype.getState = function(entity) {
  return this.getter.call(entity.state);
};


function Entity(id, group) {
  this.id = id;
  this.group = group;
  this.state = {};
  this.systems = [];
}

Entity.prototype.add = function(systemName, overrides) {
  var system = this.group.getSystem(systemName);
  system.register(this);
  system.setInitialState(this.state, overrides);
  this.systems.push(system);
  return this;
};

Entity.prototype.getState = function() {
  var entity = this;
  return this.systems.reduce(getSystemState, { id: this.id, systems: [] });

  function getSystemState(state, system) {
    _.extend(state, system.getState(entity));
    state.systems.push(system.name);
    return state;
  }
};


function EntityGroup(definitions) {
  this.entities = [];
  this.systems = Object.keys(definitions).reduce(toObject, {});

  function toObject(obj, key) {
    var name = definitions[key].name;
    var def = definitions[key];
    obj[name] = new System(def);
    return obj;
  }
}

EntityGroup.prototype.create = function(id) {
  var entity = new Entity(id, this);
  this.entities.push(entity);
  return entity;
};

EntityGroup.prototype.getSystem = function(name) {
  return this.systems[name];
};

EntityGroup.prototype.update = function(name) {
  var system = this.systems[name];
  var args = Array.prototype.slice.call(arguments, 1);

  if (!system) throw new Error('No such system: ' + name);

  system.update(args);
};

EntityGroup.prototype.getState = function() {
  return this.entities.map(getEntityState);

  function getEntityState(entity) {
    return entity.getState();
  }
};
