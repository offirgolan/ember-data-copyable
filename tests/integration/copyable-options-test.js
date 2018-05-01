import { run } from '@ember/runloop';
import setupMirage from '../helpers/setup-mirage';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Integration | Copyable | options', function(hooks) {
  setupTest(hooks);
  setupMirage(hooks, { async: false });

  test('it overwrites attributes', async function(assert) {
    assert.expect(4);

    let model = this.store.peekRecord('bar', 1);

    await run(async () => {
      let copy = await model.copy(true, {
        overwrite: {
          id: 42,
          property: null,
          unknownProp: '_bar_',
          foo: this.store.createRecord('foo', { property: '_foo_' })
        }
      });

      assert.equal(copy.get('id'), 42);
      assert.equal(copy.get('property'), null);
      assert.equal(copy.get('unknownProp'), '_bar_');
      assert.equal(copy.get('foo.property'), '_foo_');
    });
  });

  test('it ignores attributes', async function(assert) {
    assert.expect(2);

    let model = this.store.peekRecord('bar', 1);

    await run(async () => {
      let copy = await model.copy(true, {
        ignoreAttributes: ['property', 'foo']
      });

      assert.notOk(copy.get('property'));
      assert.notOk(copy.get('foo'));
    });
  });

  test('it copes other attributes', async function(assert) {
    assert.expect(2);

    let model = this.store.peekRecord('bar', 1);

    model.setProperties({
      one: 1,
      two: 2
    });

    await run(async () => {
      let copy = await model.copy(true, {
        otherAttributes: ['one', 'two']
      });

      assert.equal(copy.get('one'), 1);
      assert.equal(copy.get('two'), 2);
    });
  });

  test('it copies with nested options', async function(assert) {
    assert.expect(3);

    let model = this.store.peekRecord('bar', 1);

    await run(async () => {
      let copy = await model.copy(true, {
        overwrite: { id: 42 },
        relationships: {
          foo: {
            overwrite: { id: 22 },
            ignoreAttributes: ['property']
          }
        }
      });

      assert.equal(copy.get('id'), 42);
      assert.equal(copy.get('foo.id'), 22);
      assert.notOk(copy.get('foo.property'));
    });
  });

  test('it handles relational deep copy overrides', async function(assert) {
    assert.expect(1);

    let model = this.store.peekRecord('baz', 1);

    await run(async () => {
      let copy = await model.copy(true, {
        relationships: {
          bar: { deep: false }
        }
      });

      assert.equal(copy.get('bar.foo.id'), 1);
    });
  });
});
