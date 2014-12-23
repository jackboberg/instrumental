var test = require('tape');
var instrumental = require('..');

var client;
var config = { apiKey: 'secret' };

test('create a client', function (t) {
  t.plan(1);
  client = instrumental.createClient(config);
  t.equal(typeof client, 'object');
});
