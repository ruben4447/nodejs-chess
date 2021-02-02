const express = require('express');
const socketio = require('socket.io');
const fs = require('fs');

const port = 3030;

const app = express();
const server = app.listen(port, () => console.log(`Server listening on port ${port} ...`));
const io = socketio(server);

const indexhtml_listeners = require('./index.html.js');
const chess = require('./chess.js');
const access_token = require('./access_token.js');
const connection = require('./connection.js');

app.use(express.static('public/'));

io.on('connection', (socket) => {
  console.log(`Connection made: ${socket.id}`);

  // Load listeners used in index.html
  socket.on('from-index.html', () => indexhtml_listeners(socket));

  // Token from play.html
  let conn; // Connection object for play.html
  socket.on('send-token', t => {
    let v = access_token.is_valid(t, socket);
    if (v) {
      if (conn == undefined) {
        conn = new connection.Connection(t);
      }
    } else {
      socket.emit('invalid-token');
    }
  });

  // Rebound event from client back to client
  socket.on('rebound-event', o => socket.emit(o[0], o[1]));
});

// Load all files from chess.saves_data
let files = fs.readdirSync(chess.saves_path);
files.forEach(file => {
  let name = file.split('.')[0];
  chess.ChessInstance.fromFile(name, true);
});