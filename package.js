Package.describe({
  summary: "Provides validation for objects, builds on the rules package."
  , version: '0.1.0'
  , name: "cwohlman:schema"
});

Package.on_use(function (api, where) {
  api.versionsFrom('0.9.0');

  api.use('cwohlman:rules@0.1.0');
  api.use('underscore');

  api.add_files('schema.js', ['client', 'server']);

  api.export('Schema');
});

Package.on_test(function (api) {
  api.use(['cwohlman:schema', 'cwohlman:rules', 'tinytest', 'test-helpers']);

  api.add_files('schema_tests.js', ['client', 'server']);
});
