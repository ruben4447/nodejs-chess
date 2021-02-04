const { io } = require('./server.js');

const fs = require('fs');

const indexhtml_listeners = require('./index.html.js');
const chess = require('./chess.js');
const access_token = require('./access_token.js');
const connection = require('./connection.js');

io.on('connection', (socket) => {
  console.log(`Connection made: ${socket.id}`);

  // Load listeners used in index.html
  socket.on('from-index.html', () => {
    indexhtml_listeners.init(socket);
    indexhtml_listeners.request_connect_game(socket, "test1", "123");
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

  socket.on('req-pieces-obj', () => socket.emit('pieces-obj', chess.pieces));

  // Rebound event from client back to client
  socket.on('rebound-event', o => socket.emit(o[0], o[1]));
});

// Load all files from chess.saves_data
let files = fs.readdirSync(chess.saves_path);
files.forEach(file => {
  let name = file.split('.')[0];
  chess.ChessInstance.fromFile(name, true);
});