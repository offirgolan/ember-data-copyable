import defineModels from './define-models';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';
import RSVP from 'rsvp';
import { getOwner } from '@ember/application';

export default function setupMirage(application, options) {
  // Register our models
  const Models = defineModels(application, options);

  // Setup Mirage Server
  application.server = startMirage();

  // Setup the store
  application.store = getOwner(application).lookup('service:store');

  if (!options.async) {
    // Pre-fetch all models and add them to the store if its not async
    return RSVP.all(
      Object.keys(Models)
        .filter(name => name !== 'foo-fragment')
        .map(name => application.store.findAll(name))
    );
  }
}
