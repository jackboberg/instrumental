var os   = require('os');
var util = require('util');

var split = require('split');
var mitm = require("mitm")();

var server = { data: [] };

const API_KEY = 'secret';

function checkHandshake(socket) {
  if (server.data[0].indexOf('hello version') === 0) {
    server.connection.write(util.format('ok%s', os.EOL));
  } else {
    server.connection.end();
  }
}

function checkAuth(socket) {
  if (server.data[1] === util.format('authenticate %s', API_KEY)) {
    server.connection.write(util.format('ok%s', os.EOL));
  } else {
    server.connection.end();
  }
}

function handleNewLine(line) {
  server.data.push(line);

  switch (server.data.length) {
    case 1:
      checkHandshake();
      break;
    case 2:
      checkAuth();
      break;
  }
}

mitm.on("connection", function (socket, options) {
  server.connection = socket;
  server.options    = options;

  // reset data on connection
  server.data.length = 0;

  // send new lines to handler
  var lineStream = socket.pipe(split());
  lineStream.on('data', handleNewLine);
});

module.exports = server;
