const access_token = require('./access_token.js');
const { io } = require('./server.js');
const chess = require('./chess.js');
const chess_fns = require('../public/js/chess_fns.js')
const btoa = require('btoa');

chess_fns.loadPieces(chess.pieces);

const ADMIN_PASSWD = btoa("root");

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
    this.colour = undefined; // Colour 'w' or 'b'. Assigned by ChessInstance object (by add_conn)
    this.admin = undefined; // Requires request

    console.log(`${t}: created connection (SID: ${this.socket.id})`);
    this.chess.add_conn(this);
    this.socket.to(this.chess.room_name).emit('msg', `A new ${this.spectator ? 'spectator' : 'player'} joined.`);

    this._initListeners();
  }

  _initListeners() {
    this.socket.on('disconnect', () => {
      this.broadcast_game_stats(); // Update everyone on status
      this.socket.to(this.chess.room_name).emit('msg', `A ${this.spectator ? 'spectator' : 'player'} left.`);
      this.remove_token();
      this.chess.remove_conn(this);
      console.log(`Socket ${this.socket.id}: closing connection.`);
    });

    this.socket.on('req-leave-game', () => {
      this.chess.remove_conn(this);
      this.remove_token();
    });

    // Request to be admin
    // Can only try once per connection
    this.socket.on('req-admin', passwd => {
      if (this.admin == undefined && passwd == ADMIN_PASSWD) {
        this.admin = true;
        this.socket.emit('grant-admin');
      } else {
        this.admin = false;
      }
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
        col: this.colour, // Our colour
      });
    });

    this.socket.on('req-game-stats', () => this.broadcast_game_stats());

    this.socket.on('req-game-data', () => {
      this.socket.emit('game-data', this.getGameData());
    });

    this.socket.on('req-whos-go', () => {
      this.socket.emit('whos-go', this.chess.go);
    });

    this.socket.on('req-reset-game', () => {
      if (this.chess.conns[0] === this) {
        chess.ChessInstance.newData(this.chess);
        this.chess.saveToFile();
        io.in(this.chess.room_name).emit('game-data', this.getGameData());
        io.in(this.chess.room_name).emit('msg', '[!] Reset game');
      } else {
        this.socket.emit('alert', { title: 'Unable to reset game', msg: 'You do not have the permissions required to carry out this action.' });
      }
    });

    this.socket.on('req-save', ({ d, m, t }) => {
      if (this.chess.conns[0] === this) {
        let v = chess.ChessInstance.isValidData(d);
        if (v === true) {
          v = chess.ChessInstance.isValidMovedData(m);
          if (v === true) {
            v = chess.ChessInstance.isValidData(t);
            if (v === true) {
              this.chess._data = d;
              this.chess._moved = m;
              this.chess._taken = taken;
              this.chess.saveToFile();
              io.in(this.chess.room_name).emit('msg', `[${Date.now()}] Saved game data`);
              io.in(this.chess.room_name).emit('game-data', this.getGameData());
            } else {
              this.socket.emit('alert', { title: 'Unable to save game', msg: 'Game data is invalid (t, "' + v + '")' });
            }
          } else {
            this.socket.emit('alert', { title: 'Unable to save game', msg: 'Game data is invalid (m, "' + v + '")' });
          }
        } else {
          this.socket.emit('alert', { title: 'Unable to save game', msg: 'Game data is invalid (d, "' + v + '")' });
        }
      } else {
        this.socket.emit('alert', { title: 'Unable to save game', msg: 'You do not have the permissions required to carry out this action.' });
      }
    });

    // Highlight possible moves for piece
    this.socket.on('req-highlight-moves', ([row, col]) => {
      let spots = this.chess.getPieceMoves(row, col);
      if (spots) this.socket.emit('highlight-positions', spots);
    });

    // Request to move
    this.socket.on('req-move', data => {
      if (!Array.isArray(data.dst) || typeof data.dst[0] != 'number' || typeof data.dst[1] != 'number' ||
        !Array.isArray(data.src) || typeof data.src[0] != 'number' || typeof data.src[1] != 'number') {
        this.socket.emit('_error', 'Bad Request (req-move)');
      } else {
        let resp = this.chess.attempt_move(this, data.src, data.dst);
        if (resp.code === 0) {
          io.in(this.chess.room_name).emit('game-data', this.getGameData()); // Update all clients
          this.socket.emit('moved', resp.msg);
        } else {
          let title = "Unable to move piece";
          if (resp.code == 2) title = "Illegal Move";
          this.socket.emit('alert', { title, msg: resp.msg });
        }
      }
    });
  }

  /**
   * Send game-stats event to all players/spectators
   */
  broadcast_game_stats() {
    io.in(this.chess.room_name).emit('game-stats', {
      ppl: this.chess.conns.length,
      full: +this.chess.isFull(),
      spec: this.chess.conns_s.length,
    });
  }

  /** Broadcast whose go it is */
  broadcast_go() {
    io.in(this.chess.room_name).emit('whos-go', this.chess.go);
  }

  /**
   * Remove access token from connection
   */
  remove_token() {
    console.log(`Connection.remove_token: removing token ${this.t}`);
    access_token.remove(this.t);
  }

  getGameData() {
    return { d: this.chess._data, m: this.chess._moved, t: this.chess._taken };
  }
}

module.exports = { Connection };