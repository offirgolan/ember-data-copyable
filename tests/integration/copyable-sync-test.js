import generateTests from './copyable-tests';
import setupMirage from '../helpers/setup-mirage';
import { module } from 'qunit';
import { setupTest } from 'ember-qunit';

module('Integration | Copyable | sync', function (hooks) {
  setupTest(hooks);
  setupMirage(hooks, { async: false });

  generateTests({ async: false });
});
