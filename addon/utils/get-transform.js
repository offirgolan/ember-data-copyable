import Ember from 'ember';

/**
 * Get the transform for a given type. Uses the private `_meta` cache.
 *
 * @method getTransform
 * @private
 * @param  {DS.Model} model
 * @param  {String} type
 * @param  {Object} _meta Copy task meta object
 * @return {DS.Transform}
 */
export default function getTransform(model, type, _meta) {
  _meta.transforms[type] = _meta.transforms[type] || model.store.serializerFor(model.constructor.modelName).transformFor(type);
  return _meta.transforms[type];
}
