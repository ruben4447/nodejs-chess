const express = require('express');
const socketio = require('socket.io');

const port = 3030;

const app = express();
const server = app.listen(port, () => console.log(`Server listening on port ${port} ...`));
const io = socketio(server);

app.use(express.static('public/'));

/** Array of all connected sockets */
const connected_clients = [];

module.exports = { app, server, port, io, connected_clients };