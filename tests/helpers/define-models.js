/* global define, requirejs */
import Copyable from 'ember-data-copyable';
import Model, { attr, belongsTo, hasMany } from '@ember-data/model';
import config from '../../config/environment';
import { fragment, fragmentArray } from 'ember-data-model-fragments/attributes';
import Fragment from 'ember-data-model-fragments/fragment';

const CopyableModel = Model.extend(Copyable);

export default function defineModels(options, owner) {
  const Models = {
    foo: CopyableModel.extend({
      property: attr('string'),
    }),

    bar: CopyableModel.extend({
      foo: belongsTo('foo', options),
    }),

    baz: CopyableModel.extend({
      foos: hasMany('foo', options),
      bar: belongsTo('bar', options),
    }),

    multi: CopyableModel.extend({
      bars: hasMany('bar', options),
      baz: belongsTo('baz', options),
    }),

    'foo-fix': CopyableModel.extend({
      property: attr('string'),
    }),

    'foo-bar': CopyableModel.extend({
      fooFix: belongsTo('fooFix', options),
    }),

    'foo-empty': CopyableModel.extend({
      property: attr('string'),
      foo: belongsTo('foo', options),
    }),

    'foo-cycle': CopyableModel.extend({
      property: attr('string'),
      fooCycle: belongsTo(
        'foo-cycle',
        Object.assign({ inverse: 'fooCycle' }, options)
      ),
      fooCycles: hasMany(
        'foo-cycle',
        Object.assign({ inverse: null }, options)
      ),
    }),

    'foo-transform': CopyableModel.extend({
      property: attr('string'),
      object: attr('object'),
    }),

    'foo-fragment': Fragment.extend({
      name: attr('string'),
    }),

    'foo-fragment-holder': CopyableModel.extend({
      foos: fragmentArray('fooFragment'),
      bar: fragment('fooFragment'),
    }),
  };

  Object.keys(Models).forEach((name) => {
    let moduleName = `${config.modulePrefix}/models/${name}`;
    if (requirejs.has(moduleName)) {
      requirejs.unsee(moduleName);
    }

    // we register the model for ember-cli-mirage to picket it up
    define(moduleName, [], () => ({ default: Models[name] }));

    // we register the model on the app for ember-data to see the latest model definitions
    owner.register(`model:${name}`, Models[name]);
  });

  return Models;
}
