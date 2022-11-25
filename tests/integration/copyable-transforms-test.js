import setupMirage from '../helpers/setup-mirage';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Integration | Copyable | transforms', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks, { async: false });

  test('it handles object transform', async function (assert) {
    assert.expect(3);

    let model = this.store.peekRecord('foo-transform', 1);

    let copy = await model.copy(true);

    assert.equal(model.get('object.foo'), 'bar');
    assert.equal(copy.get('object.foo'), 'bar');
    assert.notEqual(copy.get('object'), model.get('object.foo'));
  });
});
