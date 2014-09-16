Package.describe({
  summary: "Provides validation for objects, builds on the rules package."
  , version: '0.0.1'
});

Package.on_use(function (api, where) {
  api.use('rules');
  api.use('underscore');

  api.add_files('schema.js', ['client', 'server']);

  api.export('Schema');
});

Package.on_test(function (api) {
  api.use(['schema', 'rules', 'tinytest', 'test-helpers']);

  api.add_files('schema_tests.js', ['client', 'server']);
});
