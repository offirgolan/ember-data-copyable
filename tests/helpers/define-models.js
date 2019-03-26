/* global define, requirejs */
import Copyable from 'ember-data-copyable';
import DS from 'ember-data';
import config from '../../config/environment';
import { assign } from '@ember/polyfills';
import { fragment, fragmentArray } from 'ember-data-model-fragments/attributes';
import Fragment from 'ember-data-model-fragments/fragment';

const { attr, Model, belongsTo, hasMany } = DS;

const CopyableModel = Model.extend(Copyable);

export default function registerModels(application, options) {
  const Models = {
    foo: CopyableModel.extend({
      property: attr('string')
    }),

    bar: CopyableModel.extend({
      foo: belongsTo('foo', options)
    }),

    baz: CopyableModel.extend({
      foos: hasMany('foo', options),
      bar: belongsTo('bar', options)
    }),

    multi: CopyableModel.extend({
      bars: hasMany('bar', options),
      baz: belongsTo('baz', options)
    }),

    'foo-fix': CopyableModel.extend({
      property: attr('string')
    }),

    'foo-bar': CopyableModel.extend({
      fooFix: belongsTo('fooFix', options)
    }),

    'foo-empty': CopyableModel.extend({
      property: attr('string'),
      foo: belongsTo('foo', options)
    }),

    'foo-cycle': CopyableModel.extend({
      property: attr('string'),
      fooCycle: belongsTo(
        'foo-cycle',
        assign({ inverse: 'fooCycle' }, options)
      ),
      fooCycles: hasMany('foo-cycle', assign({ inverse: null }, options))
    }),

    'foo-transform': CopyableModel.extend({
      property: attr('string'),
      object: attr('object')
    }),

    'foo-fragment': Fragment.extend({
      name: attr('string')
    }),

    'foo-fragment-holder': CopyableModel.extend({
      foos: fragmentArray('fooFragment'),
      bar: fragment('fooFragment')
    }),
  };

  Object.keys(Models).forEach(name => {
    let moduleName = `${config.modulePrefix}/models/${name}`;

    if (requirejs.entries[moduleName]) {
      requirejs.unsee(moduleName);
    }

    define(moduleName, [], () => ({ default: Models[name] }));
  });

  return Models;
}
