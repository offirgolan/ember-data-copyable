import generateTests from './copyable-tests';
import setupMirage from '../helpers/setup-mirage';
import { moduleFor } from 'ember-qunit';

moduleFor('copyable', 'Integration | Copyable | async', {
  integration: true,

  beforeEach() {
    return setupMirage(this, { async: true });
  },

  afterEach() {
   this.server.shutdown();
 }
});

generateTests({ async: true });
