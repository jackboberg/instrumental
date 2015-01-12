var test = require('tape');

var server = require('./mock-server');
var instrumental = require('..');

var client = instrumental.createClient('secret');

var metric;

test('creating a client returns a singleton', function (t) {
  t.plan(1);

  var client2 = instrumental.createClient('ignored');
  t.equal(client, client2);
});

test('handshake and authentication are automatic', function (t) {
  t.plan(2);

  client.flush(function () {
    t.equal(server.data[0].indexOf('hello'), 0);
    t.equal(server.data[1].indexOf('authenticate'), 0);
  });
});

test('client automatically reconnects', function (t) {
  t.plan(1);

  server.connection.end();

  // FIXME there is a timing issue here
  setTimeout(function () {
    client.gauge('metric.reconnect', 1, function () {
      metric = server.data.pop();
      t.not(metric.indexOf('metric.reconnect'), -1);
    });
  }, 0);
});

