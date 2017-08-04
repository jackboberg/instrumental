Instrumental
============

[![Greenkeeper badge](https://badges.greenkeeper.io/jackboberg/instrumental.svg)](https://greenkeeper.io/)

A client for the Instrumental collector API

## Install

`npm install instrumental`

## Usage

```
var instrumental = require('instrumental');
var client = instrumental.createClient(API_KEY);

client.gauge(metric, value);
```

You can set additional options by passing an object to the client constructor.

```
var config    = {
  apiKey      : 'secret',
  host        : 'collector.instrumentalapp.com',
  port        : 80,
  bufferLimit : 0
};

var client = instrumental.createClient(config);
```

Setting the `bufferLimit` will send metrics in batches, instead of streaming
them directly to the collector. Metrics are sent over a socket that reconnects,
so this option is probably not useful for most cases.

## Client

Calls to `createClient` return a singleton, so only the first call needs to
provide configuration. Any options passed on subsequent is ignored.

### socket

The socket used to connect to instrumental is exposed so you can attach event
handlers as needed.

```
client.socket.on('error', errorHandler);
```

### collectors

All collector methods accept optional timestamps and callbacks. Timestamp will
default to now if not provided.

**NOTE: If you are using a `bufferLimit`, you should not pass callbacks to your
collector calls.**

#### gauge

Sends `gauge test.gauge_metric 75.8232 1326735451`

```
client.gauge(metric, value);
client.gauge(metric, value, timestamp);
client.gauge(metric, value, timestamp, done);
```

#### gauge_absolute

Sends `gauge_absolute test.gauge_metric_90th_percentile 89.232 1326735451`

```
client.gauge_absolute(metric, value);
client.gauge_absolute(metric, value, timestamp);
client.gauge_absolute(metric, value, timestamp, done);
```

#### increment

Sends `increment test.increment_metric 1 1326735451`

```
client.increment(metric, increment);
client.increment(metric, increment, timestamp);
client.increment(metric, increment, timestamp, done);
```

#### notice

Sends `notice 1326735451 0 Deployed revision 038ade4 to production`. Notice can
be called with just a message, which will default to a duration of `0`.

```
client.notice(message);
client.notice(message, done);
client.notice(message, duration);
client.notice(message, duration, done);
client.notice(message, duration, timestamp);
client.notice(message, duration, timestamp, done);
```

##### flush

As a convenience, `flush` will send any data in the buffer instead of waiting
for the `bufferLimit`. It can also be useful if you want to attach a callback after
making several collector calls.

```
client.gauge(metric, value);
client.gauge(metric, value);

client.flush(done);
```
