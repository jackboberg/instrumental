var util = require('util');
var net  = require('net');

var socket;
var client    = {};
var stack     = [];
var connected = false;
var config    = {
  apiKey      : false,
  host        : 'instrumentalapp.com',
  port        : 8000,
  bufferLimit : 100
};

/**
 * connect
 *
 * ensure connection to Instrumental API
 *
 * @param   {function}    fn    (optional) callback
 */
function connect(fn) {
  if (connected) {
    fn && fn();
  }
  socket = net.connect({
    host: config.host,
    port: config.port
  });
  socket.setEncoding('utf8');
  socket.on('close', function() {
    connected = false;
  });
  socket.on('connect', function() {
    connected = true;
    var auth = [
      "hello version 1.0",
      "authenticate " + config.apiKey
    ].join('\n') + '\n';
    socket.write(auth);
    fn && fn();
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
    flush();
  }
}

/**
 * flush
 *
 * send stack to Instrumental
 */
function flush() {
  if (stack.length === 0) {
    return;
  }
  var data = stack.join('\n') + '\n';
  stack = [];
  connect(function () {
    socket.write(data);
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
 */
function increment() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('increment');
  buffer.apply(null, args);
}

/**
 * gauge
 *
 * add gauge datapoint to buffer
 *
 * @param   {string}    metric    name of the metric
 * @param   {number}    value     value to be recorded
 * @param   {number}    time      (optional) when the data should be recorded
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
 */
function notice() {
  var args = Array.prototype.slice.call(arguments);
  args.unshift('notice');
  if (args.length === 2) {
    args.push(0);
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
  if (socket) {
    return client;
  }
  options = options || {};
  Object.key(settings).forEach(function (key) {
    if (options[key]) {
      settings[key] = options[key];
    }
  });
  if ( ! config.apiKey) {
    throw new Error('API KEY is required');
  }
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
