import defineModels from './define-models';
import { setupMirage } from 'ember-cli-mirage/test-support';

let Models;

export default function setupMirageAndModels(hooks, options) {
  hooks.beforeEach(function () {
    // Register our models
    Models = defineModels(options, this.owner);
  });

  setupMirage(hooks);

  hooks.beforeEach(async function () {
    this.store = this.owner.lookup('service:store');

    if (!options.async) {
      // Pre-fetch all models and add them to the store if its not async
      await Promise.all(
        Object.keys(Models)
          .filter((name) => name !== 'foo-fragment')
          .map((name) => this.store.findAll(name, { reload: true }))
      );
    }
  });
}
