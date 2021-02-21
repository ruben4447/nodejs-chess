/**
 * Event listeners for index.html.js
 */

const chess = require('./chess.js');
const access_token = require('./access_token.js');
const atob = require('atob');
const { clientCount } = require('./server.js');

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

let r_name_invalid = /[^A-Za-z0-9\-_]/;
function is_name_valid(name) {
  return typeof name == 'string' && name.length > 0 && !r_name_invalid.test(name);
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
      if (!is_name_valid(name)) return socket.emit('_error', 'Invalid name provided.');
      if (this._name != undefined) return socket.emit('_error', 'Name already been set.');
      let r = this.setName(name);
      if (!r) {
        return socket.emit('_error', 'Name is already taken.');
      }
    });
    socket.on('send-msg', text => chat.write(this, text));
    socket.on('disconnect', () => {
      let i = Connection.all.indexOf(this);
      if (i != -1) Connection.all.splice(i, 1);
    });

    Connection.all.push(this);
  }

  getName() { return this._name == undefined ? Connection.defaultName : this._name; }
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

Connection.defaultName = "(anonymous)";
Connection.names = [];
Connection.all = [];

const chat = (function () {
  /** @type {{ from: string, text:string }[]} */
  const lines = [];

  const MAX_LENGTH = 100;

  const flush = () => {
    while (lines.length > MAX_LENGTH) lines.shift();
  };

  const getMessageDestination = text => {
    if (text[0] == '@') {
      let i = 0;
      let to = [];
      while (text[i] == '@') {
        i++;
        let name = text.substr(i).split(' ')[0];
        if (is_name_valid(name)) {
          to.push(name);
        }
        i += name.length;
        while (text[i] == ' ') i++;
      }
      return to;
    } else {
      return '*';
    }
  };

  /**
   * Send message
   * @param {Connection} from 
   * @param {string} text 
   * @param {boolean} doUpdate - Trigger message update?
   */
  const write = (from, text, doUpdate = true) => {
    if (text[0] == '!') {
      let msg = '';
      if (text == "!online") {
        msg = `There are ${clientCount()} users online`;
      } else if (text == '!available') {
        let available = Connection.all.map(c => c.getName()).filter(n => n != Connection.defaultName);
        msg = `There are ${available.length} users which are available (${available.join(', ')})`;
      } else if (text == "!whoami") {
        msg = `Your name is "${from.getName()}"`;
      } else {
        msg = `Unknown Command`;
      }
      from._.emit('new-msg', { from: '[COMMAND]', text: msg });
    } else {
      let msg_object = { from: from.getName(), text };
      lines.push(msg_object);
      flush();

      if (doUpdate) {
        let to = getMessageDestination(text);
        if (to == '*') {
          to = Connection.all;
        } else {
          to = Connection.all.filter(conn => conn.getName() != Connection.defaultName && to.indexOf(conn.getName()) !== -1);
          from._.emit('new-msg', { from: '[SERVER]', text: `Sending addressed message to ${to.length} users (${to.map(c => c.getName()).join(', ')})` });
        }
        to.forEach(conn => conn._.emit('new-msg', msg_object));
      }
    }
  };

  /** Server emit a message */
  const writeServer = msg => {
    let obj = { from: '[SERVER]', text: msg };
    lines.push(obj);
    Connection.all.forEach(conn => conn._.emit('new-msg', obj));
  };

  const length = () => lines.length;

  const updateSocket = (socket) => {
    socket.emit('entire-chat', lines);
  };

  return Object.freeze({ write, writeServer, length, updateSocket, MAX_LENGTH });
})();

module.exports = { Connection, chat };