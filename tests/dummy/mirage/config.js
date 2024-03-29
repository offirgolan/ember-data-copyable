import { discoverEmberDataModels } from 'ember-cli-mirage';
import { createServer } from 'miragejs';

export default function (config) {
  let finalConfig = {
    ...config,
    models: { ...discoverEmberDataModels(), ...config.models },
    routes() {
      this.namespace = '/api';

      this.get('/foos');
      this.get('/foos/:id');

      this.get('/bars');
      this.get('/bars/:id');

      this.get('/bazs');
      this.get('/bazs/:id');

      this.get('/multis');
      this.get('/multis/:id');

      this.get('/foo-fixes');
      this.get('/foo-fixes/:id');

      this.get('/foo-bars');
      this.get('/foo-bars/:id');

      this.get('/foo-empties');
      this.get('/foo-empties/:id');

      this.get('/foo-cycles');
      this.get('/foo-cycles/:id');

      this.get('/foo-transforms');
      this.get('/foo-transforms/:id');

      this.get('/foo-fragment-holders');
      this.get('/foo-fragment-holders/:id');

      this.get('/override-options-parents');
      this.get('/override-options-parents/:id');

      this.get('/override-options-children');
      this.get('/override-options-children/:id');
    },
  };

  return createServer(finalConfig);
}
