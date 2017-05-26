# Ember Data Copyable

[![Build Status](https://travis-ci.org/offirgolan/ember-data-copyable.svg?branch=master)](https://travis-ci.org/offirgolan/ember-data-copyable)
[![npm version](https://badge.fury.io/js/ember-data-copyable.svg)](http://badge.fury.io/js/ember-data-copyable)

Intelligently copy an Ember Data model and all of its relationships

## Features

- Shallow & deep copy an Ember Data model
- Shallow & deep copy model relationships
- Handles cyclical relationships
- Handles custom transforms to create true copies
- Overwrite, ignore attributes, and copy objects by reference
- Intelligent failure and cleanup

## Installation

```
ember install ember-data-copyable
```

## Helpful Links

- ### [Changelog](CHANGELOG.md)

## Looking for help?
If it is a bug [please open an issue on GitHub](http://github.com/offirgolan/ember-data-copyable/issues).

## Setup

This addon provides a `Copyable` mixin which allows you to copy a model. To get started,
just import the mixin and add it to your model.

```js
// models/user.js

import DS from 'ember-data';
import Copyable from 'ember-data-copyable';

export default DS.Model.extend(Copyable, {
  firstName: DS.attr('string'),
  lastName: DS.attr('string'),
  address: DS.belongsTo('address'),
  friends: DS.hasMany('user'),

  // Specific copy options for the model
  copyableOptions: {}
});
```

## Usage

Once the model is setup, we can use the `copy` method on an instance to duplicate it.

### Copy Method Signature

```js
async function copy(deep = false, options = {}) {};
```

- `deep`

    If __false__ a shallow copy of only the model's attributes will be created.

    If __true__, a deep copy of the model and it's realtionships will be created.

- `options`:

    Copy options. See [options](#options) for more details.

### Example

```js
const model = this.get('store').peekRecord('user', 1);

model.copy(true, {
  ignoreAttributes: ['lastName'],
  overwrite: {
    id: 42,
    firstName: 'Offir'
  }
}).then((copy) => {
  return copy.save();
}, (e) => {
  // Handle error
})
```

In your model you can specify default options via the `copyableOptions` object.
A similar options object can be passed into the `copy` method to override model specific options.
Please see [options](#options) for more details.

## Copying Relationships

To copy a model's relationship, that relational model **must** have the `Copyable` mixin or else it will just
be copied by reference.

```js
// models/address.js

import DS from 'ember-data';
import Copyable from 'ember-data-copyable';

export default DS.Model.extend(Copyable, {
  streetName: DS.attr('string'),
  country: DS.attr('string'),
  state: DS.attr('string')
});
```

If the __Address__ does not have the `Copyable` mixin, a true copy will be not
be created when copying the __User__ model.

## Options

These options can either be specified via the `copyableOptions` object on the DS.Model class or
passed into the `copy` method.

### `ignoreAttributes`

Attributes to ignore when copying.

```js
ignoreAttributes: ['firstName', 'address']
```

### `copyByReference`

Attributes to copy only by reference. If the attribute has the `Copyable` mixin, it will
be ignored and not be copied, just copied by reference.

```js
copyByReference: ['friends']
```

### `overwrite`

Overwrite attributes with the specified values. This will also add properties
that are not found on the model.

```js
overwrite: {
  id: 42,
  firstName: 'Offir - Copy',
  address: this.get('store').createRecord('address', { /* ... */ }),
  unknownProperty: 'Foo Bar'
}
```

### `relationships`

Specify options to nested models.

```js
relationships: {
  address: {
    ignoreAttributes: ['streetName'],
    overwrite: {
      state: 'CA'
    }
  },
  friends: {
    copyByReference: ['address']
  }
}
```
