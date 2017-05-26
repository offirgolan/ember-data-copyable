export default function() {
  this.namespace = '/api';
}

export function testConfig() {
  this.get('/foos');
  this.get('/foos/:id');

  this.get('/bars');
  this.get('/bars/:id');

  this.get('/bazs');
  this.get('/bazs/:id');

  this.get('/nested-lists');
  this.get('/nested-lists/:id');

  this.get('/multis');
  this.get('/multis/:id');

  this.get('/foo-fixes');
  this.get('/foo-fixes/:id');

  this.get('/foo-bars');
  this.get('/foo-bars/:id');

  this.get('/foo-empties');
  this.get('/foo-empties/:id');
}
