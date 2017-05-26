import Ember from 'ember';
import getTransform from 'ember-data-copyable/utils/get-transform';
import isUndefined from 'ember-data-copyable/utils/is-undefined';
import { task, all } from 'ember-concurrency';

const {
  assign,
  Logger,
  guidFor,
  isEmpty,
  canInvoke,
} = Ember;

const {
  keys
} = Object;

const COPY_TASK = '__COPY_TASK__';
const PRIMITIVE_TYPES = ['string', 'number', 'boolean'];

const DEFAULT_OPTIONS = {
  // List of all attributes to ignore
  ignoreAttributes: [],

  // List of all attributes to copy by reference
  copyByReference: [],

  // Overwrite specific keys with a given value
  overwrite: {},

  // Relationship options
  relationships: {}
};

export default Ember.Mixin.create({
  /**
   * Copyable options for the specific model. See DEFAULT_OPTIONS for details
   *
   * @type {Object}
   * @public
   */
  copyableOptions: null,

  /**
   * Entry point for copying the model
   *
   * @method copy
   * @public
   * @async
   * @param  {Boolean} deep If `true`, a deep copy of the model will be made
   * @param  {Object} options Options for the copy which will override model
   *                               specified options. See DEFAULT_OPTIONS.
   * @param  {Object} _meta PRIVATE. Copy meta data
   * @return {TaskInstance} A promise like TaskInstance
   */
  copy(deep, options, _meta) {
    options = assign({}, DEFAULT_OPTIONS, this.get('copyableOptions'), options);
    _meta = _meta || { copies: {}, transforms: {} };

    return this.get(COPY_TASK).perform(deep, options, _meta);
  },

  /**
   * The copy task that gets called from `copy`. Does all the grunt work.
   *
   * @type {Task}
   * @private
   */
  [COPY_TASK]: task(function *(deep, options, _meta) {
    let { ignoreAttributes, copyByReference, overwrite } = options;
    let { copies } = _meta;
    let { modelName } = this.constructor;
    let store = this.get('store');
    let guid = guidFor(this);
    let attrs = {};

    // Handle cyclic relationships: If the model has already been copied,
    // just return that model
    if (copies[guid]) {
      return copies[guid];
    }

    try {
      let model  = store.createRecord(modelName);
      copies[guid] = model;

      // Copy all the attributes
      this.eachAttribute((name, { type, options }) => {
        if (ignoreAttributes.includes(name)) {
          return;
        } else if (!isUndefined(overwrite[name])) {
          attrs[name] = overwrite[name];
        } else if (
            !isEmpty(type) &&
            !copyByReference.includes(name) &&
            !PRIMITIVE_TYPES.includes(type)
        ) {
          let value = this.get(name);
          let transform = getTransform(this, type, _meta);

          // Run the transform on the value. This should guarantee that we get
          // a new instance.
          value = transform.serialize(value, options);
          value = transform.deserialize(value, options);

          attrs[name] = value;
        } else {
          attrs[name] = this.get(name);
        }
      });

      if (deep) {
        let relationships = [];

        // Get all the relationship data
        this.eachRelationship((name, meta) => {
          if (!ignoreAttributes.includes(name)) {
            relationships.push({ name, meta });
          }
        });

        // Copy all the relationships
        for (let { name, meta } of relationships) {
          if (!isUndefined(overwrite[name])) {
            attrs[name] = overwrite[name];
            continue;
          }

          // We dont need to yield for a value if it's just copied by ref.
          if (copyByReference.includes(name)) {
            attrs[name] = this.get(name);
            continue;
          }

          let value = yield this.get(name);

          if (meta.kind === 'belongsTo') {
            if (canInvoke(value, 'copy')) {
              attrs[name] = yield value.copy(true, options.relationships[name], _meta);
            } else {
              attrs[name] = value;
            }
          } else if (meta.kind === 'hasMany') {
            if (canInvoke(value.get('firstObject'), 'copy')) {
              attrs[name] = yield all(value.invoke('copy', true, options.relationships[name], _meta));
            } else {
              attrs[name] = value;
            }
          }
        }
      }

      // Since overwrite can include `id` or other properties that have not been touched
      // we want to still include them.
      assign(attrs, overwrite);

      // Set the properties on the model
      model.setProperties(attrs);

      return model;
    } catch (e) {
      let copiesKeys = keys(copies);

      // Display the error
      Logger.error(`[ember-data-copyable] Failed to copy model '${this}'. Cleaning up ${copiesKeys.length} created copies...`, e);

      // Unload all created records
      copiesKeys.forEach((key) => store.unloadRecord(copies[key]));

      // Throw so the task promise will not resolve
      throw new Error(e);
    }
  })
});
