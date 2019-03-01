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
- Uses [ember-concurrency](https://github.com/machty/ember-concurrency) to allow cancelling a copy task

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
  guid: DS.attr('number'),
  firstName: DS.attr('string'),
  lastName: DS.attr('string'),
  address: DS.belongsTo('address'),
  friends: DS.hasMany('user'),

  // Specific copy options for the model
  copyableOptions: {}
});
```

In your model you can specify default options via the `copyableOptions` object.
Please see [options](#options) for more details.

### Copying Relationships

To copy a model's relationship, that relational model **must** have the `Copyable` mixin or else it will just
be copied by reference.

## Usage

Once the model is setup, we can use the `copy` method on an instance to duplicate it.

### Copy Method Signature

```js
async function copy(deep = false, options = {}) {}
```

- `deep` : _Boolean_

  If **false** a shallow copy of the model's attributes will be created.
  All relationships will be copied over by reference.

  If **true**, a deep copy of the model and it's relationships will be created.
  If a relational model has the Copyable mixin, it will also be deep copied.

- `options` : _Object_

  Copy options. See [options](#options) for more details.

  **NOTE:** Options passed into the copy method take precedence over those specified on the model.

Returns a cancelable promise like [ember-concurrency](https://github.com/machty/ember-concurrency) TaskInstance.

### Examples

#### Normal Usage

```js
const model = this.get('store').peekRecord('user', 1);

model
  .copy(true, {
    ignoreAttributes: ['guid'],
    copyByReference: ['address'],
    overwrite: {
      id: 2,
      firstName: 'Offir'
    }
  })
  .then(
    copy => {
      // Handle success
      return copy.save();
    },
    e => {
      // Handle error or cancellation
    }
  );
```

#### Task Cancellation

Since the `copy` method returns an [ember-concurrency](https://github.com/machty/ember-concurrency) TaskInstance,
we have the ability to cancel a running copy task at any time.

```js
const model = this.get('store').peekRecord('user', 1);
const copyTaskInstance = model.copy(true);

// Cancel our copy task
copyTaskInstance.cancel();
```

## Options

These options can either be specified via the `copyableOptions` object on the DS.Model class or
passed into the `copy` method.

### `ignoreAttributes`

Attributes to ignore when copying.

```js
ignoreAttributes: ['guid', 'address'];
```

### `otherAttributes`

Other attributes to copy over that are not defined via DS.attr, DS.belongsTo,
or DS.hasMany.

```js
otherAttributes: ['timestamp', 'someFlag'];
```

### `copyByReference`

Attributes to copy only by reference. If the attribute has the `Copyable` mixin, it will
be ignored and not be copied, just copied by reference.

```js
copyByReference: ['friends'];
```

### `overwrite`

Overwrite attributes with the specified values. This will also add properties
that are not found on the model.

```js
overwrite: {
  id: 2,
  firstName: 'Offir - Copy',
  address: this.get('store').createRecord('address', { /* ... */ }),
  unknownProperty: 'Foo Bar'
}
```

### `relationships`

Specify options to nested models.
Nested relationships options can also include a `deep` option. If set to false,
the relationship will be shallow copied.

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
  },
  profile: {
    deep: false
  }
}
```
