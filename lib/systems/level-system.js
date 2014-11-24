var levelSystem = {
  name: 'level',
  props: {
    mapWidth: 100,
    mapHeight: 100
  },
  getState: function() {
    return {
      mapWidth: this.mapWidth,
      mapHeight: this.mapHeight
    };
  }
};
