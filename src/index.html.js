/**
 * Event listeners for index.html.js
 */

const chess = require('./chess.js');
const access_token = require('./access_token.js');
const atob = require('atob');

/**
 * Request to connect to a game
 * @param {Connection} conn - Connection requesting
 * @param {string} name - Name of the game
 * @param {string} password - Password to game
 * @param {boolean} spec - Joined as spectator?
 */
function request_connect_game(conn, name, passwd, spec) {
  const title = 'Unable to connect to game';
  if (chess.all[name]) {
    let obj = chess.all[name];
    if (obj.conns.length !== obj.maxConnections || spec) {
      if (spec && obj.conns.length == 0) {
        conn._.emit('alert', { title, msg: 'Cannot spectate empty game' });
      } else if (spec && !obj._allowSpectators) {
        conn._.emit('alert', { title, msg: `Spectators are disabled for this game` });
      } else {
        if (passwd == obj._passwd) {
          // Generate unique access token
          const token = new access_token.Token(obj, spec, conn.getName());
          conn._.emit('connect-game', token.get());
        } else {
          conn._.emit('alert', { title, msg: `Password is incorrect` });
        }
      }
    } else {
      conn._.emit('alert', { title, msg: `Game '${name}' is full. You can join as a spectator to watch.` });
    }
  } else {
    conn._.emit('alert', { title, msg: `Game '${name}' does not exist.` });
  }
}

/**
 * Request to create a game
 * @param {Connection} conn - Requetsing connection
 * @param {string} name - Name of the game
 * @param {string} password - Password to game
 * @param {boolean} singleplayer - Is game singleplayer?
 */
function request_create_game(conn, name, passwd, singleplayer) {
  if (typeof name != 'string' || name.length == 0) return conn._.emit('alert', { title: 'Cannot create game', msg: `Name is required` });
  if (typeof passwd != 'string' || passwd.length == 0) return conn._.emit('alert', { title: 'Cannot create game', msg: `Password is required` });
  if (chess.all[name]) return conn._.emit('alert', { title: 'Cannot create game', msg: `Game with name '${name}' already exists` });

  let x = chess.ChessInstance.createNew(name, singleplayer, passwd);
  conn._.emit('alert', { title: 'Created game', msg: `Created new game '${x._name}'` });
  conn._.emit('game-count', Object.keys(chess.all).length);
}

/** Connection from index.html */
class Connection {
  constructor(socket) {
    this._ = socket;
    this._name = undefined;
    socket.emit('my-name', this.getName());

    socket.on('req-game-count', () => socket.emit('game-count', Object.keys(chess.all).length));
    socket.on('req-connect-game', ({ name, passwd, spec }) => this.requestConnectGame(name, atob(passwd), !!spec));
    socket.on('req-create-game', ({ name, passwd, s }) => this.requestCreateGame(name, atob(passwd), s == 1));
    socket.on('change-name', name => {
      if (typeof name !== 'string' || name.length == 0) return socket.emit('_error', 'Invalid name provided.');
      if (this._name != undefined) return socket.emit('_error', 'Name already been set.');
      let r = this.setName(name);
      if (!r) {
        return socket.emit('_error', 'Name is already taken.');
      }
    });
    socket.on('send-msg', text => chat.write(this.getName(), text));
    socket.on('disconnect', () => {
      let i = Connection.all.indexOf(this);
      if (i != -1) Connection.all.splice(i, 1);
    });

    Connection.all.push(this);
  }

  getName() { return this._name == undefined ? "(anonymous)" : this._name; }
  setName(name) {
    if (Connection.names.indexOf(name) == -1) {
      this._name = name;
      this._.emit('my-name', name);
      return true;
    } else {
      return false;
    }
  }

  updateChat() { chat.updateSocket(this._); }

  requestConnectGame(name, passwd, spectator) {
    return request_connect_game(this, name, passwd, spectator);
  }

  requestCreateGame(name, passwd, singleplayer) {
    return request_create_game(this, name, passwd, singleplayer);
  }
}

Connection.names = [];
Connection.all = [];

const chat = (function () {
  /** @type {{ from: string, text:string }[]} */
  const lines = [];

  const MAX_LENGTH = 100;

  const flush = () => {
    while (lines.length > MAX_LENGTH) lines.shift();
  };

  const write = (from, text, doUpdate = true) => {
    lines.push({ from, text });
    if (doUpdate) Connection.all.forEach(conn => conn._.emit('new-msg', { from, text }));
    flush();
  };

  const length = () => lines.length;

  const updateSocket = (socket) => {
    socket.emit('entire-chat', lines);
  };

  return Object.freeze({ write, length, updateSocket, MAX_LENGTH });
})();

module.exports = { Connection, chat };