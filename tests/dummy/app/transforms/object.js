import Transform from '@ember-data/serializer/transform';

export default class ObjectTransform extends Transform {
  deserialize(serialized) {
    return JSON.parse(serialized);
  }

  serialize(deserialized) {
    return JSON.stringify(deserialized);
  }
}
