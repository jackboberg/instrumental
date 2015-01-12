var util = require('util');
var os   = require('os');
var net  = require('net');

var socket;
var client    = {};
var stack     = [];
var connected = false;
var config    = {
  apiKey      : false,
  host        : 'collector.instrumentalapp.com',
  port        : 80,
  bufferLimit : 0
};

/**
 * handshake
 *
 * send hello message and client details
 *
 * @param   {object}    socket    socket to write to
 */
function handshake() {
  var data = util.format('hello version 1.0%s', os.EOL);
  client.socket.write(data);
}

/**
 * authenticate
 *
 * send API key
 *
 * @param   {object}    socket    socket to write to
 * @param   {string}    apiKey    instrumental API key
 */
function authenticate() {
  var data = util.format("authenticate %s%s", config.apiKey, os.EOL);
  client.socket.write(data);
}

/**
 * connect
 *
 * ensure connection to Instrumental API
 *
 * @param   {function}    fn    (optional) callback
 */
function connect(fn) {
  if (connected) {
    return fn && fn();
  }

  // create a new connection
  client.socket = net.createConnection(config.port, config.host, function () {
    connected = true;
    handshake();
    authenticate();
    fn && fn();
  });

  // track connection
  client.socket.on('close', function() {
    connected = false;
  });
}

/**
 * buffer
 *
 * add formatted datapoint to stack
 *
 * @param   {array}     data      command, metric, value, and time
 */
function buffer(args) {
  // pop callback, if present
  var fn;
  if (typeof args[args.length -1] === 'function') {
    fn = args.pop();
  }
  // require command, metric, and value
  if (args.length < 3) {
    throw new Error('not enough information to create datapoint');
  }
  // default to now if time omitted
  if (args.length === 3) {
    args.push(new Date().getTime());
  }
  stack.push(args.join(' '));
  if (stack.length >= config.bufferLimit) {
    // 
    return process.nextTick(flush.bind(null, fn));
  }
  fn && fn();
}

/**
 * flush
 *
 * send stack to Instrumental
 *
 * @param   {function}  fn      (optional) callback
 */
function flush(fn) {
  if (stack.length === 0) {
    return fn && fn();
  }
  var data = stack.join('\n') + '\n';
  // empty the stack
  stack.length = 0;
  connect(function () {
    client.socket.write(data, 'utf8', fn);
  });
}

/**
 * increment
 *
 * add increment datapoint to buffer
 *
 * @param   {string}    metric    name of the metric
 * @param   {number}    value     value to be recorded
 * @param   {number}    time      (optional) when the data should be recorded
 * @param   {function}  fn        (optional) callback
 */
function increment() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('increment');
  buffer(args);
}

/**
 * gauge
 *
 * add gauge datapoint to buffer
 *
 * @param   {string}    metric    name of the metric
 * @param   {number}    value     value to be recorded
 * @param   {number}    time      (optional) when the data should be recorded
 * @param   {function}  fn        (optional) callback
 */
function gauge() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('gauge');
  buffer(args);
}

/**
 * gauge_absolute
 *
 * add gauge_absolute datapoint to buffer
 *
 * @param   {string}    metric    name of the metric
 * @param   {number}    value     value to be recorded
 * @param   {number}    time      (optional) when the data should be recorded
 * @param   {function}  fn        (optional) callback
 */
function gauge_absolute() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('gauge_absolute');
  buffer(args);
}

/**
 * notice
 *
 * add notice datapoint to buffer
 *
 * @param   {string}    message   description of the event
 * @param   {number}    value     (optional) duration of the event
 * @param   {number}    time      (optional) when the data should be recorded
 * @param   {function}  fn        (optional) callback
 */
function notice() {
  var args = Array.prototype.slice.call(arguments);

  // capture callback, if present
  var fn;
  if (typeof args[args.length -1] === 'function') {
    fn = args.pop();
  }

  // notice takes args in reverse order
  args.reverse();

  // allow calling without timestamp
  if (args.length === 2) {
    args.push(new Date().getTime());
  }

  // allow calling without duration
  if (args.length === 2) {
    args.push(0);
  }

  args.unshift('notice');
  if (fn) {
    args.push(fn);
  }
  buffer(args);
}

/**
 * createClient
 *
 * create singleton client to connect to Instrumental API
 *
 * @param   {object}    options   config for Intrumental client
 */
function createClient(options) {
  if (client.socket) {
    return client;
  }

  // normalize options
  options = options || {};
  if (typeof options === 'string') {
    options = { apiKey: options };
  }

  // set defaults
  Object.keys(config).forEach(function (key) {
    if (options[key]) {
      config[key] = options[key];
    }
  });

  // require API key
  if ( ! config.apiKey) {
    throw new Error('API KEY is required');
  }

  // attempt to connect and return client
  connect();
  return client;
}

client = {
  flush          : flush,
  increment      : increment,
  gauge          : gauge,
  gauge_absolute : gauge_absolute,
  notice         : notice,
  socket         : socket
};

module.exports = {
  createClient: createClient
};
