import getTransform from 'ember-data-copyable/utils/get-transform';
import isUndefined from 'ember-data-copyable/utils/is-undefined';
import {
  COPY_TASK,
  COPY_TASK_RUNNER,
  IS_COPYABLE
} from 'ember-data-copyable/-private/symbols';
import { task, all } from 'ember-concurrency';
import { assign } from '@ember/polyfills';
import { guidFor } from '@ember/object/internals';
import { Copyable } from 'ember-copy';
import { isEmpty } from '@ember/utils';
import { runInDebug } from '@ember/debug';
import Mixin from '@ember/object/mixin';

const { keys } = Object;

const PRIMITIVE_TYPES = ['string', 'number', 'boolean'];

const DEFAULT_OPTIONS = {
  // List of all attributes to ignore
  ignoreAttributes: [],

  // List of other attributes to copy
  otherAttributes: [],

  // List of all attributes to copy by reference
  copyByReference: [],

  // Overwrite specific keys with a given value
  overwrite: {},

  // Relationship options
  relationships: {}
};

export default Mixin.create({
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
  [COPY_TASK_RUNNER]: task(function*(deep, options) {
    const _meta = { copies: {}, transforms: {} };
    const store = this.get('store');
    let isSuccessful = false;

    try {
      const model = yield this.get(COPY_TASK).perform(deep, options, _meta);
      isSuccessful = true;

      return model;
    } catch (e) {
      // eslint-disable-next-line no-console
      runInDebug(() => console.error('[ember-data-copyable]', e));

      // Throw so the task promise will be rejected
      throw new Error(e);
    } finally {
      if (!isSuccessful) {
        const copiesKeys = keys(_meta.copies);

        // Display the error
        runInDebug(() =>
          // eslint-disable-next-line no-console
          console.error(
            `[ember-data-copyable] Failed to copy model '${this}'. Cleaning up ${
              copiesKeys.length
            } created copies...`
          )
        );

        // Unload all created records
        copiesKeys.forEach(key => store.unloadRecord(_meta.copies[key]));
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
  [COPY_TASK]: task(function*(deep, options, _meta) {
    options = assign({}, DEFAULT_OPTIONS, this.get('copyableOptions'), options);

    const {
      ignoreAttributes,
      otherAttributes,
      copyByReference,
      overwrite
    } = options;
    const { copies } = _meta;
    const { modelName } = this.constructor;
    const store = this.get('store');
    const guid = guidFor(this);
    const relationships = [];
    let attrs = {};

    // Handle cyclic relationships: If the model has already been copied,
    // just return that model
    if (copies[guid]) {
      return copies[guid];
    }

    const model = store.createRecord(modelName);
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

        if (Copyable && Copyable.detect(value)) {
          // "value" is an Ember.Object using the ember-copy addon
          // (ie. old deprecated Ember.Copyable API - if you use
          // the "Ember Data Model Fragments" addon and "value" is a fragment or
          // if use your own serializer where you deserialize a value to an
          // Ember.Object using this Ember.Copyable API)
          value = value.copy(deep);
        } else {
          const transform = getTransform(this, type, _meta);

          // Run the transform on the value. This should guarantee that we get
          // a new instance.
          value = transform.serialize(value, attributeOptions);
          value = transform.deserialize(value, attributeOptions);
        }

        attrs[name] = value;
      } else {
        attrs[name] = this.get(name);
      }
    });

    // Get all the relationship data
    this.eachRelationship((name, meta) => {
      if (!ignoreAttributes.includes(name)) {
        relationships.push({ name, meta });
      }
    });

    // Copy all the relationships
    for (let i = 0; i < relationships.length; i++) {
      const { name, meta } = relationships[i];

      if (!isUndefined(overwrite[name])) {
        attrs[name] = overwrite[name];
        continue;
      }

      // We dont need to yield for a value if it's just copied by ref
      // or if we are doing a shallow copy
      if (!deep || copyByReference.includes(name)) {
        try {
          const ref = this[meta.kind](name);
          const copyRef = model[meta.kind](name);

          copyRef[`${meta.kind}Relationship`].addRecordDatas(
            ref[`${meta.kind}Relationship`].members
          );
        } catch (e) {
          attrs[name] = yield this.get(name);
        }

        continue;
      }

      const value = yield this.get(name);
      const relOptions = options.relationships[name];
      const deepRel =
        relOptions && typeof relOptions.deep === 'boolean'
          ? relOptions.deep
          : deep;

      if (meta.kind === 'belongsTo') {
        if (value && value.get(IS_COPYABLE)) {
          attrs[name] = yield value
            .get(COPY_TASK)
            .perform(deepRel, relOptions, _meta);
        } else {
          attrs[name] = value;
        }
      } else if (meta.kind === 'hasMany') {
        const firstObject = value.get('firstObject');

        if (firstObject && firstObject.get(IS_COPYABLE)) {
          attrs[name] = yield all(
            value
              .getEach(COPY_TASK)
              .invoke('perform', deepRel, relOptions, _meta)
          );
        } else {
          attrs[name] = value;
        }
      }
    }

    // Build the final attrs pojo by merging otherAttributes, the copied
    // attributes, and ant overwrites specified.
    attrs = assign(this.getProperties(otherAttributes), attrs, overwrite);

    // Set the properties on the model
    model.setProperties(attrs);

    return model;
  })
});
