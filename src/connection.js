const access_token = require('./access_token.js');
const { io } = require('./server.js');
const chess = require('./chess.js');
const btoa = require('btoa');

const ADMIN_PASSWD = "password";

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

    this._initListeners();
    this.open();
  }

  _initListeners() {
    this.socket.on('disconnect', () => this.close());

    // Request to be admin
    // Can only try once per connection
    this.socket.on('req-admin', passwd => {
      let granted = this.grantAdminRight(passwd);
      if (granted) this.socket.emit('msg', 'Administrator right granted.');
    });

    // ! HOST ONLY
    this.socket.on('req-delete-game', () => {
      if (this.isHost) {
        this.chess.del();
        io.in(this.chess.room_name).emit('redirect', '/index.html?e=deleted');
      } else {
        this.socket.emit('alert', { title: 'Unable to delete game', msg: 'You do not have the permissions required to carry out this action [host].' });
      }
    });

    this.socket.on('req-game-info', () => {
      const obj = {
        name: btoa(this.chess._name),
        s: +this.chess._singleplayer,
        host: +this.isHost,
        spec: +this.spectator, // Am spectator?
        col: this.colour, // Our colour
      };
      if (this.isHost) obj.aspec = +this.chess._allowSpectators;
      this.socket.emit('game-info', obj);
    });

    this.socket.on('req-game-stats', () => this.socket.emit('game-stats', this.chess.getGameStats()));

    this.socket.on('req-game-data', () => this.socket.emit('game-data', this.chess.getGameData()));

    this.socket.on('req-whos-go', () => this.socket.emit('whos-go', this.chess.go));

    // ! HOST ONLY
    this.socket.on('req-reset-game', () => {
      if (this.isHost) {
        this.chess.reset();
        this.chess._log.length = 0;
        this.chess.writeLog('<i>Game Reset</i>', 'Host reset the game');
        this.chess.saveToFile();

        io.in(this.chess.room_name).emit('game-data', this.chess.getGameData());
        io.in(this.chess.room_name).emit('log', this.chess._log);
        this.socket.emit('msg', '[!] Reset game');
        this.socket.to(this.chess.room_name).emit('alert', { title: 'Reset Game', msg: 'Host reset the game' });
      } else {
        this.socket.emit('alert', { title: 'Unable to reset game', msg: 'You do not have the permissions required to carry out this action [host].' });
      }
    });

    // ! ADMINISTRATOR ONLY
    this.socket.on('req-save', ({ d, m, t }) => {
      if (this.admin) {
        let v = chess.ChessInstance.isValidData(d);
        if (v === true) {
          v = chess.ChessInstance.isValidMovedData(m);
          if (v === true) {
            v = chess.ChessInstance.isValidData(t);
            if (v === true) {
              this.chess._data = d;
              this.chess._moved = m;
              this.chess._taken = t;
              this.chess.saveToFile();
              io.in(this.chess.room_name).emit('msg', `[${Date.now()}] Saved game data`);
              io.in(this.chess.room_name).emit('game-data', this.chess.getGameData());
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
        this.socket.emit('alert', { title: 'Unable to save game', msg: 'You do not have the permissions required to carry out this action [admin].' });
      }
    });

    // Request to move
    this.socket.on('req-move', data => {
      if (!Array.isArray(data.dst) || typeof data.dst[0] != 'number' || typeof data.dst[1] != 'number' ||
        !Array.isArray(data.src) || typeof data.src[0] != 'number' || typeof data.src[1] != 'number') {
        this.socket.emit('_error', 'Bad Request (request to move)');
      } else {
        let resp = this.chess.attempt_move(this, data.src, data.dst);
        if (resp.code === 0) {
          this.chess.toggleGo(); // Toggle go
          this.chess.saveToFile();

          // Update clients
          const room = io.in(this.chess.room_name);
          room.emit('game-data', this.chess.getGameData());
          room.emit('whos-go', this.chess.go);
        } else {
          let title = "Unable to move piece";
          if (resp.code == 2) title = "Illegal Move";
          this.socket.emit('alert', { title, msg: resp.msg });
        }
      }
    });

    // Restore game to last state
    // ! HOST ONLY
    this.socket.on('req-restore', () => {
      if (this.isHost) {
        let bool = this.chess.restore();
        if (bool) {
          this.chess.toggleGo();
          this.chess.writeLog('<i>Undid latest move</i>', 'Host restored game to last recoreded state');
          this.chess.saveToFile();

          // Update clients
          this.socket.emit('msg', `[!] Restored game to last recorded state. ${this.chess._history.length} recorded states left.`);
          this.socket.to(this.chess.room_name).emit('alert', { title: 'Restored Game', msg: 'Host restored the game to the last recorded state' });
          const room = io.in(this.chess.room_name);
          room.emit('game-data', this.chess.getGameData());
          room.emit('whos-go', this.chess.go);
        } else {
          this.socket.emit('alert', { title: 'Unable to restore game', msg: 'Game is at latest recorded state.' });
        }
      } else {
        this.socket.emit('alert', { title: 'Unable to restore game', msg: 'You do not have the permissions required to carry out this action [host].' });
      }
    });

    this.socket.on('req-clear-history', () => {
      let length = this.chess._history.length;
      this.chess._history.length = 0;
      this.chess.saveToFile();
      this.socket.emit('msg', `Cleared game history (removed ${length} items)`);
    });

    // ! HOST ONLY
    this.socket.on('req-allow-spectators', bool => {
      this.chess._allowSpectators = !!bool;
      this.chess.saveToFile();
      let msg;
      if (this.chess._allowSpectators) {
        msg = 'Allowed spectators into match.';
      } else {
        msg = 'Disallowed spectators from entering match.';
        if (this.chess.conns_s.length > 0) {
          this.socket.emit('alert', { title: 'Removed Spectators', msg: 'Removed ' + (this.chess.conns_s.length) + ' active spectators from match' });
          this.chess.conns_s.forEach(conn => conn.socket.emit('redirect', '/index.html?e=no_spectator'));
        }
      }
      this.socket.emit('msg', msg);
    });
  }

  /** Open connection to client-side */
  open() {
    // console.log(`Connection.open: called using token ${this.t} with socket ${this.socket.id}`);
    this.chess.add_conn(this);
    this.socket.join(this.chess.room_name); // Join socket communication room for game
    this.socket.to(this.chess.room_name).emit('msg', `A new ${this.spectator ? 'spectator' : 'player'} joined.`); // Alert everyone of new connection
    this.socket.to(this.chess.room_name).emit('game-stats', this.chess.getGameStats()); // Update stats for everyone else

    // Let client know that they're connected, and send some base information
    this.socket.emit('token-ok');
    this.socket.emit('pieces-obj', chess.pieces);
  }

  /**
   * Update game-log for connection
   */
  updateLog() {
    this.socket.emit('log', this.chess._log);
  }

  /**
   * Request to have administrator (super user) rights
   * @param {string} passwd - Administrator password
   * @return {boolean} Granted?
   */
  grantAdminRight(passwd) {
    if (!this.spectator && this.admin == undefined && passwd == ADMIN_PASSWD) {
      this.admin = true;
      return true;
    } else {
      this.admin = false;
      return false;
    }
  }

  /**
   * Remove access token from connection
   */
  remove_token() {
    // console.log(`Connection.remove_token: removing token ${this.t}`);
    access_token.remove(this.t);
  }

  /** Called when about to disconnect; cut loose ends */
  close() {
    this.socket.to(this.chess.room_name).emit('msg', `A ${this.spectator ? 'spectator' : 'player'} left.`); // Leaving message
    this.remove_token(); // Remove game access token
    this.chess.remove_conn(this); // Remove connection to ChessInstance
    this.socket.to(this.chess.room_name).emit('game-stats', this.chess.getGameStats()); // Update clients on stats

    // If host, kick out everyone else as well
    if (this.isHost) {
      this.socket.to(this.chess.room_name).emit('redirect', '/index.html?e=host_left');
    }

    this.socket.leave(this.chess.room_name); // Leave room for chess game
  }
}

module.exports = { Connection };