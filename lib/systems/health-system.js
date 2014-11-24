var healthSystem = {
  name: 'health',
  props: {
    hunger: 0,
    thirst: 0,
    injury: 0,
    fatigue: 0
  },
  getState: function() {
    return {
      hunger: this.hunger,
      thirst: this.thirst,
      injurty: this.injury,
      fatigue: this.fatigue
    };
  }
};
