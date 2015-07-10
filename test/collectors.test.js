var util = require('util')

var test = require('tape')

var server = require('./mock-server')
var instrumental = require('..')

var client = instrumental.createClient('secret')

var time = new Date(0).getTime()
var metric
var expected
var len

test('gauge accepts 4 function signatures', function (t) {
  t.plan(1)

  len = server.data.length

  client.gauge('metric.gauge', 1)
  client.gauge('metric.gauge', 2, time)
  client.gauge('metric.gauge', 3, function () {
    client.gauge('metric.gauge', 4, time, function () {
      t.equal(server.data.length, len + 4)
    })
  })
})

test('gauge formats the line correctly', function (t) {
  t.plan(1)

  expected = util.format('gauge metric.gauge 1 %s', time)

  client.gauge('metric.gauge', 1, time, function () {
    metric = server.data.pop()
    t.equal(metric, expected)
  })
})

test('gauge_absolute accepts 4 function signatures', function (t) {
  t.plan(1)

  len = server.data.length

  client.gauge_absolute('metric.absolute', 1)
  client.gauge_absolute('metric.absolute', 2, time)
  client.gauge_absolute('metric.absolute', 3, function () {
    client.gauge_absolute('metric.absolute', 4, time, function () {
      t.equal(server.data.length, len + 4)
    })
  })
})

test('gauge_absolute formats the line correctly', function (t) {
  t.plan(1)

  expected = util.format('gauge_absolute metric.absolute 1 %s', time)

  client.gauge_absolute('metric.absolute', 1, time, function () {
    metric = server.data.pop()
    t.equal(metric, expected)
  })
})

test('increment accepts 4 function signatures', function (t) {
  t.plan(1)

  len = server.data.length

  client.increment('metric.increment', 1)
  client.increment('metric.increment', 2, time)
  client.increment('metric.increment', 3, function () {
    client.increment('metric.increment', 4, time, function () {
      t.equal(server.data.length, len + 4)
    })
  })
})

test('increment formats the line correctly', function (t) {
  t.plan(1)

  expected = util.format('increment metric.increment 1 %s', time)

  client.increment('metric.increment', 1, time, function () {
    metric = server.data.pop()
    t.equal(metric, expected)
  })
})

test('notice accepts 4 function signatures', function (t) {
  t.plan(1)

  len = server.data.length

  client.notice('message', 1)
  client.notice('message', 2, time)
  client.notice('message', 3, function () {
    client.notice('message', 4, time, function () {
      t.equal(server.data.length, len + 4)
    })
  })
})

test('increment formats the line correctly', function (t) {
  t.plan(1)

  expected = util.format('notice %s 1 message', time)

  client.notice('message', 1, time, function () {
    metric = server.data.pop()
    t.equal(metric, expected)
  })
})

