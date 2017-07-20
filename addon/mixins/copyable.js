import Ember from 'ember';
import getTransform from 'ember-data-copyable/utils/get-transform';
import isUndefined from 'ember-data-copyable/utils/is-undefined';
import { COPY_TASK, COPY_TASK_RUNNER, IS_COPYABLE } from 'ember-data-copyable/-private/symbols';
import { task, all } from 'ember-concurrency';

const {
  assign,
  Logger,
  guidFor,
  isEmpty,
  runInDebug
} = Ember;

const {
  keys
} = Object;

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
   * @type {Boolean}
   * @private
   */
  [IS_COPYABLE]: true,

  /**
   * Entry point for copying the model
   *
   * @method copy
   * @public
   * @async
   * @param  {Boolean} deep If `true`, a deep copy of the model will be made
   * @param  {Object} options Options for the copy which will override model
   *                          specified options. See DEFAULT_OPTIONS.
   * @return {TaskInstance} A promise like TaskInstance
   */
  copy(/* deep, options */) {
    return this.get(COPY_TASK_RUNNER).perform(...arguments);
  },

  /**
   * The copy task runner. Allows our copy task to have a drop
   * concurrency policy
   *
   * @type {Task}
   * @private
   */
  [COPY_TASK_RUNNER]: task(function *(deep, options) {
    let _meta = { copies: {}, transforms: {} };
    let store = this.get('store');
    let isSuccessful = false;

    try {
      let model = yield this.get(COPY_TASK).perform(deep, options, _meta);
      isSuccessful = true;

      return model;
    } catch (e) {
      runInDebug(() => Logger.error('[ember-data-copyable]', e));

      // Throw so the task promise will be rejected
      throw new Error(e);
    } finally {
      if (!isSuccessful) {
        let copiesKeys = keys(_meta.copies);

        // Display the error
        runInDebug(() => Logger.error(`[ember-data-copyable] Failed to copy model '${this}'. Cleaning up ${copiesKeys.length} created copies...`));

        // Unload all created records
        copiesKeys.forEach((key) => store.unloadRecord(_meta.copies[key]));
      }
    }
  }).drop(),

  /**
   * The copy task that gets called from `copy`. Does all the grunt work.
   *
   * NOTE: This task cannot have a concurrency policy since it breaks cyclical
   *       relationships.
   *
   * @type {Task}
   * @private
   */
  [COPY_TASK]: task(function *(deep, options, _meta) {
    options = assign({}, DEFAULT_OPTIONS, this.get('copyableOptions'), options);

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

    let model  = store.createRecord(modelName);
    copies[guid] = model;

    // Copy all the attributes
    this.eachAttribute((name, { type, options: attributeOptions }) => {
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
        value = transform.serialize(value, attributeOptions);
        value = transform.deserialize(value, attributeOptions);

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
      for (let i = 0; i < relationships.length; i++) {
        let { name, meta } = relationships[i];

        if (!isUndefined(overwrite[name])) {
          attrs[name] = overwrite[name];
          continue;
        }

        // We dont need to yield for a value if it's just copied by ref.
        if (copyByReference.includes(name)) {
          try {
            let ref = this[meta.kind](name);
            let copyRef = model[meta.kind](name);

            /*
              NOTE: This is currently private API but has been approved @igorT.
                    Supports Ember Data 2.5+
             */
            if (meta.kind === 'hasMany') {
              copyRef.hasManyRelationship.addRecords(ref.hasManyRelationship.members);
            } else if (meta.kind === 'belongsTo') {
              copyRef.belongsToRelationship.addRecords(ref.belongsToRelationship.members);
            }
          } catch (e) {
            attrs[name] = this.get(name);
          }

          continue;
        }

        let value = yield this.get(name);

        if (meta.kind === 'belongsTo') {
          if (value && value.get(IS_COPYABLE)) {
            attrs[name] = yield value.get(COPY_TASK).perform(true, options.relationships[name], _meta);
          } else {
            attrs[name] = value;
          }
        } else if (meta.kind === 'hasMany') {
          let firstObject = value.get('firstObject');

          if (firstObject && firstObject.get(IS_COPYABLE)) {
            attrs[name] = yield all(
              value.getEach(COPY_TASK).invoke('perform', true, options.relationships[name], _meta)
            );
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
  })
});
