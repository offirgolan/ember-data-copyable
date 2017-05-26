import DS from 'ember-data';

export default DS.Transform.extend({
  deserialize(serialized) {
    return JSON.parse(serialized);
  },

  serialize(deserialized) {
    return JSON.stringify(deserialized);
  }
});
