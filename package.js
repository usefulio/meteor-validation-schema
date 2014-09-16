Package.describe({
  summary: "REPLACEME - What does this package (or the original one you're wrapping) do?"
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
