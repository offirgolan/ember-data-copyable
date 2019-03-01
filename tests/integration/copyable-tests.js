import { test } from 'ember-qunit';
import { run } from '@ember/runloop';
import { allSettled } from 'rsvp';

export async function getRecord(context, options, modelName, ...args) {
  if (options.async) {
    return await context.store.findRecord(modelName, ...args);
  }

  return context.store.peekRecord(modelName, ...args);
}

export default function generateTests(options = { async: false }) {
  test('it shallow copies attributes', async function(assert) {
    assert.expect(2);

    let model;

    await run(async () => {
      model = await getRecord(this, options, 'foo', 1);
    });

    await run(async () => {
      let copy = await model.copy();

      assert.equal(model.get('property'), copy.get('property'));
      assert.notEqual(copy.get('id'), 1);
    });
  });

  test('it shallow copies relationships', async function(assert) {
    assert.expect(2);

    let model, copy;

    await run(async () => {
      model = await getRecord(this, options, 'baz', 1);
    });

    await run(async () => {
      copy = await model.copy(false);
    });

    await run(async () => {
      if (options.async) {
        await allSettled([model.get('foos'), model.get('bar')]);
      }

      assert.equal(model.get('bar.id'), copy.get('bar.id'));
      assert.deepEqual(
        model.get('foos').getEach('id'),
        copy.get('foos').getEach('id')
      );
    });
  });

  test('it copies belongsTo relationship', async function(assert) {
    assert.expect(4);

    let model;

    await run(async () => {
      model = await getRecord(this, options, 'bar', 1);
    });

    await run(async () => {
      let copy = await model.copy(true);

      assert.equal(model.get('foo.property'), copy.get('foo.property'));
      assert.notEqual(copy.get('id'), 1);
      assert.notOk(copy.get('foo.id'));
      assert.notEqual(model.get('foo'), copy.get('foo'));
    });
  });

  test('it copies belongsTo relationship by reference', async function(assert) {
    assert.expect(5);

    let model, copy;

    await run(async () => {
      model = await getRecord(this, options, 'bar', 1);
    });

    await run(async () => {
      copy = await model.copy(true, {
        copyByReference: ['foo']
      });
    });

    await run(async () => {
      assert.equal(model.belongsTo('foo').id(), copy.belongsTo('foo').id());

      if (options.async) {
        assert.equal(await model.get('foo'), await copy.get('foo'));
      } else {
        assert.equal(model.get('foo'), copy.get('foo'));
      }

      assert.equal(model.get('foo.property'), copy.get('foo.property'));
      assert.notEqual(copy.get('id'), 1);
      assert.ok(copy.get('foo.id'));
    });
  });

  test('it copies empty belongsTo relationship', async function(assert) {
    assert.expect(3);

    let model;

    await run(async () => {
      model = await getRecord(this, options, 'fooEmpty', 1);
    });

    await run(async () => {
      let copy = await model.copy(true);

      assert.equal(model.get('property'), copy.get('property'));
      assert.notEqual(copy.get('id'), 1);

      if (options.async) {
        assert.notOk(await copy.get('foo'));
      } else {
        assert.notOk(copy.get('foo'));
      }
    });
  });

  test('it copies hasMany relationship', async function(assert) {
    assert.expect(3);

    let model;

    await run(async () => {
      model = await getRecord(this, options, 'baz', 1);
    });

    await run(async () => {
      let copy = await model.copy(true);

      assert.notEqual(model.get('foos'), copy.get('foos'));
      assert.equal(model.get('foos.length'), copy.get('foos.length'));
      assert.deepEqual(
        model.get('foos').getEach('property'),
        copy.get('foos').getEach('property')
      );
    });
  });

  test('it copies hasMany relationship by reference', async function(assert) {
    assert.expect(3);

    let model, copy;

    await run(async () => {
      model = await getRecord(this, options, 'baz', 1);
    });

    await run(async () => {
      copy = await model.copy(true, {
        copyByReference: ['foos']
      });
    });

    await run(async () => {
      assert.deepEqual(model.hasMany('foos').ids(), copy.hasMany('foos').ids());

      if (options.async) {
        await model.get('foos');
      }

      assert.equal(model.get('foos.length'), copy.get('foos.length'));
      assert.deepEqual(
        model.get('foos').getEach('id'),
        copy.get('foos').getEach('id')
      );
    });
  });

  test('it copies complex objects', async function(assert) {
    assert.expect(6);

    let model;

    await run(async () => {
      model = await getRecord(this, options, 'multi', 1);
    });

    await run(async function() {
      let copy = await model.copy(true);

      assert.notEqual(copy.get('bars.firstObject.id'), 1);
      assert.notEqual(copy.get('bars.firstObject.foo.id'), 1);
      assert.equal(copy.get('bars.firstObject.foo.property'), 'prop1');
      assert.notEqual(copy.get('baz.id'), 1);
      assert.notEqual(copy.get('baz.foos.lastObject.id'), 2);
      assert.equal(copy.get('baz.foos.lastObject.property'), 'prop2');
    });
  });

  test('it copies empty objects', async function(assert) {
    assert.expect(3);

    let model;

    await run(async () => {
      model = await getRecord(this, options, 'multi', 2);
    });

    await run(async () => {
      let copy = await model.copy(true);

      assert.notEqual(copy.get('id'), 2);
      assert.equal(copy.get('bars.length'), 0);
      assert.equal(copy.get('baz.foos.firstObject.property'), 'prop1');
    });
  });

  test('it copies cyclical relationship', async function(assert) {
    assert.expect(6);

    let model;

    await run(async () => {
      model = await getRecord(this, options, 'fooCycle', 1);
    });

    await run(async () => {
      let copy = await model.copy(true);

      assert.equal(copy.get('property'), '1');
      assert.equal(copy.get('fooCycle.property'), '1');
      assert.notEqual(model.get('fooCycle.id'), copy.get('fooCycle.id'));
      assert.equal(copy.get('fooCycles.firstObject.property'), '1');
      assert.equal(copy.get('fooCycles.lastObject.property'), '2');

      if (options.async) {
        assert.equal(
          await copy.get('fooCycles.firstObject'),
          await copy.get('fooCycle')
        );
      } else {
        assert.equal(copy.get('fooCycles.firstObject'), copy.get('fooCycle'));
      }
    });
  });
}
