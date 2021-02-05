const { io, addClient, removeClient } = require('./server.js');

const fs = require('fs');

const indexhtml = require('./index.html.js');
const { loadFiles } = require('./chess.js');
const access_token = require('./access_token.js');
const connection = require('./connection.js');

io.on('connection', (socket) => {
  addClient(socket);

  // Load listeners used in index.html
  socket.on('from-index.html', () => {
    indexhtml.init(socket);
    // * TEMPORARY * //
    indexhtml.request_connect_game(socket, "test1", "123");
  });

  // Token from play.html. Only allow one request per connection.
  socket.once('send-token', t => {
    let v = access_token.is_valid(t, socket);
    if (v) {
      let _ = new connection.Connection(t);
    } else {
      socket.emit('invalid-token');
    }
  });

  // Rebound event from client back to client
  socket.on('rebound-event', o => socket.emit(o[0], o[1]));

  socket.on('disconnect', () => removeClient(socket));
});

// Load chess save files
loadFiles();