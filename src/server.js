const express = require('express');
const socketio = require('socket.io');
const colour = require('./colour.js');

const port = 3030;

const app = express();
const server = app.listen(port, () => console.log(`Server listening on port ${port} ...`));
const io = socketio(server);

app.use(express.static('public/'));

/** Array of all connected sockets */
const connected_clients = [];

const clientCount = () => connected_clients.length;
const addClient = client => {
  connected_clients.push(client);
  console.log(`${colour.fgGreen}${client.id} connected.${colour.reset} ${colour.fgYellow}Clients: ${connected_clients.length}${colour.reset}`);
  io.sockets.emit('ppl-online', connected_clients.length);
};
const removeClient = client => {
  let i = connected_clients.indexOf(client);
  if (i != -1) {
    connected_clients.splice(i, 1);
    console.log(`${colour.fgRed}${client.id} disconnected.${colour.reset} ${colour.fgYellow}Clients: ${connected_clients.length}${colour.reset}`);
    io.sockets.emit('ppl-online', connected_clients.length);
  }
};

module.exports = { app, server, port, io, clientCount, addClient, removeClient };