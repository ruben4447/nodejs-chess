const access_token = require('./access_token.js');
const { io } = require('./server.js');
const btoa = require('btoa');

/***
 * Manages connection from play.html
 * Links front-end to a chess game
 */
class Connection {
  /**
   * Attempt to create new connection
   * @param {string} t - connection token (GET var 't' in play.html)
   */
  constructor(t) {
    this.t = t;
    this.chess = access_token.get_data(t, 0);
    this.socket = access_token.get_data(t, 2);
    this.spectator = access_token.get_data(t, 3);

    console.log(`${t}: created connection (SID: ${this.socket.id})`);
    this.chess.add_conn(this);
    this.socket.emit('msg', `Welcome, ${this.t} [${this.socket.id}]`);
    this.socket.to(this.chess.room_name).emit('msg', `A new ${this.spectator ? 'spectator' : 'player'} joined.`);

    this._initListeners();
  }

  _initListeners() {
    this.socket.on('disconnect', () => {
      this.send_game_stats(); // Update everyone on status
      this.socket.to(this.chess.room_name).emit('msg', `A ${this.spectator ? 'spectator' : 'player'} left.`);
      this.remove_token();
      this.chess.remove_conn(this);
      console.log(`Socket ${this.socket.id}: closing connection.`);
    });

    this.socket.on('req-leave-game', () => {
      this.chess.remove_conn(this);
      this.remove_token();
    });

    this.socket.on('req-delete-game', () => {
      if (this.chess.conns[0] === this) {
        io.in(this.chess.room_name).emit('deleted-game');
        this.chess.del();
        io.emit('req-game-count');
      } else {
        this.socket.emit('alert', { title: 'Unable to delete game', msg: 'You do not have the permissions required to carry out this action.' });
      }
    });

    this.socket.on('req-game-info', () => {
      this.socket.emit('game-info', {
        name: btoa(this.chess._name),
        s: +this.chess._singleplayer,
        first: +(this === this.chess.conns[0]),
        spec: +this.spectator, // Am spectator?
      });
    });

    this.socket.on('req-game-stats', () => this.send_game_stats());

    this.socket.on('req-game-data', () => {
      this.socket.emit('game-data', this.chess._data);
    });
  }

  /**
   * Send game-stats event to all players/spectators
   */
  send_game_stats() {
    io.in(this.chess.room_name).emit('game-stats', {
      ppl: this.chess.conns.length,
      full: +this.chess.isFull(),
      spec: this.chess.conns_s.length,
    });
  }

  /**
   * Remove access token from connection
   */
  remove_token() {
    console.log(`Connection.remove_token: removing token ${this.t}`);
    access_token.remove(this.t);
  }
}

module.exports = { Connection };