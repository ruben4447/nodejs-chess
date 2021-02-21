const { io, addClient, removeClient } = require('./server.js');

const indexhtml = require('./index.html.js');
const { loadFiles } = require('./chess.js');
const access_token = require('./access_token.js');
const connection = require('./connection.js');

indexhtml.chat.writeServer(`Server Restarted (${new Date(Date.now()).toString()})`);

io.on('connection', (socket) => {
  addClient(socket);

  // Load listeners used in index.html
  let indexhtml_conn = false;
  socket.on('from-index.html', () => {
    if (!indexhtml_conn) {
      indexhtml_conn = true;
      let conn = new indexhtml.Connection(socket);
      conn.updateChat();
      conn.setName("Ruben");
      conn.requestConnectGame("test1", "123");
    }
  });

  // Token from play.html. Only allow one request per connection.
  socket.once('send-token', t => {
    let obj = access_token.Token.get(t);
    if (obj) {
      if (obj.consume(socket)) {
        let conn = new connection.Connection(obj);
      } else {
        socket.emit('invalid-token', 2);
      }
    } else {
      socket.emit('invalid-token', 1);
    }
  });

  // Rebound event from client back to client
  socket.on('rebound-event', o => socket.emit(o[0], o[1]));

  socket.on('disconnect', () => removeClient(socket));
});

// Load chess save files
loadFiles();