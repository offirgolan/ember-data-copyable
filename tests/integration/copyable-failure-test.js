import setupMirage from '../helpers/setup-mirage';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Integration | Copyable | failure', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks, { async: true });

  test('it handles async failures', async function (assert) {
    assert.expect(2);

    this.server.get('/foos/1', { errors: ['There was an error'] }, 500);

    let model = await this.store.findRecord('bar', 1);

    try {
      await model.copy(true);
    } catch (e) {
      let models = this.store.peekAll('bar');

      assert.ok(e);
      assert.equal(
        models.get('length'),
        1,
        'All created copies were cleaned up'
      );
    }
  });

  test('it handles task cancellation', async function (assert) {
    assert.expect(2);

    let model = await this.store.findRecord('bar', 1);

    try {
      let taskInstance = model.copy(true);
      taskInstance.cancel();

      await taskInstance;
    } catch (e) {
      let models = this.store.peekAll('bar');

      assert.ok(e);
      assert.equal(
        models.get('length'),
        1,
        'All created copies were cleaned up'
      );
    }
  });
});
