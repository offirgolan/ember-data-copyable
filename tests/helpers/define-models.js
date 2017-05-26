/* global define */
import Copyable from 'ember-data-copyable';
import DS from 'ember-data';
import config from '../../config/environment';

const {
  attr,
  Model,
  belongsTo,
  hasMany
} = DS;

const CopyableModel = Model.extend(Copyable);

export default function registerModels(application, options) {
  const Models = {
    'foo': CopyableModel.extend({
      property: attr('string')
    }),

    'bar': CopyableModel.extend({
      foo: belongsTo('foo', options)
    }),

    'baz': CopyableModel.extend({
      foos: hasMany('foo', options),
      bar: belongsTo('bar', options)
    }),

    'nested-list': CopyableModel.extend({
      baz: hasMany('baz', options)
    }),

    'multi': CopyableModel.extend({
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
    })
  };

  Object.keys(Models).forEach(name => {
    define(`${config.modulePrefix}/models/${name}`, [], () => ({ default: Models[name] }));
  });

  return Models;
}
