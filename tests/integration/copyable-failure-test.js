import Ember from 'ember';
import setupMirage from '../helpers/setup-mirage';
import { moduleFor, test } from 'ember-qunit';

const {
  run
} = Ember;

moduleFor('copyable', 'Integration | Copyable | failure', {
  integration: true,

  beforeEach() {
    return setupMirage(this, { async: true });
  },

  afterEach() {
   this.server.shutdown();
 }
});

test('it handles async failures', async function(assert) {
  assert.expect(2);

  this.server.get('/foos/1', { errors: ['There was an error'] }, 500);

  let model;

  await run(async () => {
    model = await this.store.findRecord('bar', 1);
  });

  await run(async () => {
    try {
      await model.copy(true);
    } catch (e) {
      let models = this.store.peekAll('bar');

      assert.ok(e);
      assert.equal(models.get('length'), 1, 'All created copies were cleaned up');
    }
  });
});

test('it handles task cancellation', async function(assert) {
  assert.expect(2);

  let model;

  await run(async () => {
    model = await this.store.findRecord('bar', 1);
  });

  await run(async () => {
    try {
      let taskInstance = model.copy(true);
      taskInstance.cancel();

      await taskInstance;
    } catch (e) {
      let models = this.store.peekAll('bar');

      assert.ok(e);
      assert.equal(models.get('length'), 1, 'All created copies were cleaned up');
    }
  });
});
