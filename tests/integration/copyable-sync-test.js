import Ember from 'ember';
import setupMirage from '../helpers/setup-mirage';
import { moduleFor, test } from 'ember-qunit';

const {
  run
} = Ember;

moduleFor('copyable', 'Integration | Copyable | sync', {
  integration: true,

  beforeEach() {
    return setupMirage(this, { async: false });
  },

  afterEach() {
   this.server.shutdown();
 }
});

test('it shallow copies attributes', function(assert) {
  let model = this.store.peekRecord('foo', 1);

  return run(() => {
    return model.copy().then((copy) => {
      assert.equal(model.get('property'), copy.get('property'));
      assert.notOk(copy.get('id'));
    })
  })
});
