import setupMirage from '../helpers/setup-mirage';
import { moduleFor, test } from 'ember-qunit';
import { run } from '@ember/runloop';

moduleFor('copyable', 'Integration | Copyable | transforms', {
  integration: true,

  beforeEach() {
    return setupMirage(this, { async: false });
  },

  afterEach() {
   this.server.shutdown();
 }
});

test('it handles object transform', async function(assert) {
  assert.expect(3);

  let model = this.store.peekRecord('foo-transform', 1);

  await run(async () => {
    let copy = await model.copy(true);

    assert.equal(model.get('object.foo'), 'bar');
    assert.equal(copy.get('object.foo'), 'bar');
    assert.notEqual(copy.get('object'), model.get('object.foo'));
  });
});
