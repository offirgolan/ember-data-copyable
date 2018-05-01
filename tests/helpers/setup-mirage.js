import RSVP from 'rsvp';
import defineModels from './define-models';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';

export default function setupMirage(hooks, options) {
  hooks.before(function() {
    // Register our models
    this.Models = defineModels(options);
  });

  hooks.beforeEach(function() {
    // Register our models
    // const Models = defineModels(options);

    // Setup Mirage Server
    this.server = startMirage();

    // Setup the store
    this.store = this.owner.lookup('service:store');

    if (!options.async && this.Models) {
      // Pre-fetch all models and add them to the store if its not async
      return RSVP.all(
        Object.keys(this.Models).map(name => this.store.findAll(name))
      );
    }
  });

  hooks.afterEach(function() {
    this.server.shutdown();
  });
}
