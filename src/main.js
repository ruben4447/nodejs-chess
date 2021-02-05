const { io, connected_clients } = require('./server.js');

const fs = require('fs');

const indexhtml_listeners = require('./index.html.js');
const chess = require('./chess.js');
const access_token = require('./access_token.js');
const connection = require('./connection.js');

io.on('connection', (socket) => {
  console.log(`Connection made: ${socket.id}`);
  connected_clients.push(socket);
  io.sockets.emit('ppl-online', connected_clients.length);

  // Load listeners used in index.html
  socket.on('from-index.html', () => {
    indexhtml_listeners.init(socket);
    // * TEMPORARY * //
    // indexhtml_listeners.request_connect_game(socket, "test1", "123");
  });

  // Token from play.html
  let conn; // undefined (not defined), COnnection (connection secured), false (socket has already tried)
  socket.on('send-token', t => {
    let v = access_token.is_valid(t, socket);
    if (v) {
      if (conn == undefined) conn = new connection.Connection(t);
    } else {
      if (conn === false) {
        console.log(`[!] Socket ${socket.id} already tried verifying a token.`);
        socket.emit('redirect', 'https://google.com/');
      } else {
        conn = false;
      }
      socket.emit('invalid-token');
    }
  });

  // Rebound event from client back to client
  socket.on('rebound-event', o => socket.emit(o[0], o[1]));

  socket.on('disconnect', () => {
    let i = connected_clients.indexOf(socket);
    if (i != -1) connected_clients.splice(i, 1);
    io.sockets.emit('ppl-online', connected_clients.length);
  });
});

// Load all files from chess.saves_data
let files = fs.readdirSync(chess.saves_path);
files.forEach(file => {
  let name = file.split('.')[0];
  chess.ChessInstance.fromFile(name, true);
});