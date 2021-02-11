/**
 * Event listeners for index.html.js
 */

const chess = require('./chess.js');
const access_token = require('./access_token.js');
const atob = require('atob');

/**
 * Request to connect to a game
 * @param {socketio.Socket} socket - Requesting socket object
 * @param {string} name - Name of the game
 * @param {string} password - Password to game
 * @param {boolean} spec - Joined as spectator?
 */
function request_connect_game(socket, name, passwd, spec) {
  const title = 'Unable to connect to game';
  if (chess.all[name]) {
    let obj = chess.all[name];
    if (obj.conns.length !== obj.maxConnections || spec) {
      if (spec && obj.conns.length == 0) {
        socket.emit('alert', { title, msg: 'Cannot spectate empty game' });
      } else if (spec && !obj._allowSpectators) {
        socket.emit('alert', { title, msg: `Spectators are disabled for this game` });
      } else {
        if (passwd == obj._passwd) {
          // Generate unique access token
          const token = access_token.create(obj, spec);
          socket.emit('connect-game', token);
        } else {
          socket.emit('alert', { title, msg: `Password is incorrect` });
        }
      }
    } else {
      socket.emit('alert', { title, msg: `Game '${name}' is full` });
    }
  } else {
    socket.emit('alert', { title, msg: `Game '${name}' does not exist.` });
  }
}

/**
 * Request to create a game
 * @param {socketio.Socket} socket - Requesting socket object
 * @param {string} name - Name of the game
 * @param {string} password - Password to game
 * @param {boolean} singleplayer - Is game singleplayer?
 */
function request_create_game(socket, name, passwd, singleplayer) {
  if (typeof name != 'string' || name.length == 0) return socket.emit('alert', { title: 'Cannot create game', msg: `Name is required` });
  if (typeof passwd != 'string' || passwd.length == 0) return socket.emit('alert', { title: 'Cannot create game', msg: `Password is required` });
  if (chess.all[name]) return socket.emit('alert', { title: 'Cannot create game', msg: `Game with name '${name}' already exists` });

  let x = chess.ChessInstance.createNew(name, singleplayer, passwd);
  socket.emit('alert', { title: 'Created game', msg: `Created new game '${x._name}'` });
  socket.emit('game-count', Object.keys(chess.all).length);
}

/**
 * Initiate listeners for a certain socket
 * @param {socketio.Socket} socket 
 */
const init = socket => {
  socket.on('req-game-count', () => socket.emit('game-count', Object.keys(chess.all).length));
  socket.on('req-connect-game', ({ name, passwd, spec }) => request_connect_game(socket, name, atob(passwd), !!spec));
  socket.on('req-create-game', ({ name, passwd, s }) => request_create_game(socket, name, atob(passwd), s == 1));
};

module.exports = { init, request_connect_game, request_create_game };