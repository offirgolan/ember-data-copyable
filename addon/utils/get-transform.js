import { getOwner } from '@ember/application';

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
  _meta.transforms[type] =
    _meta.transforms[type] || getOwner(model).lookup(`transform:${type}`);
  return _meta.transforms[type];
}
