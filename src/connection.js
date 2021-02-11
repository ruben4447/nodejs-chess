const access_token = require('./access_token.js');
const { io } = require('./server.js');
const chess = require('./chess.js');
const btoa = require('btoa');

const ADMIN_PASSWD = btoa("root");

/***
 * Manages connection from play.html
 * Links front-end to a chess game
 */
class Connection {
  /**
   * Attempt to create new connection
   * @param {indexhtml.Token} t - connection token
   */
  constructor(t) {
    this.t = t;
    this.chess = t.getRefGame();
    this.socket = t.getConnectedSocket();
    this.spectator = t.isSpectator();
    this.name = t.getCreatorName();
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
      this.socket.emit('msg', granted ? 'Administrator right granted.' : 'Incorrect details for administrative rights.');
    });

    // ! HOST ONLY
    this.socket.on('req-delete-game', () => {
      if (!this.isHost) return this.permissionError("host");

      this.chess.del();
      io.in(this.chess.room_name).emit('redirect', '/index.html?e=deleted');
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
      if (!this.isHost) return this.permissionError("host");

      this.chess.reset();
      this.chess._log.length = 0;
      this.chess.writeLog('<i>Game Reset</i>', 'Host reset the game');
      this.chess.saveToFile();

      io.in(this.chess.room_name).emit('game-data', this.chess.getGameData());
      io.in(this.chess.room_name).emit('log', this.chess._log);
      this.socket.emit('msg', '[!] Reset game');
    });

    // ! ADMINISTRATOR ONLY
    this.socket.on('req-save', ({ d, m, t }) => {
      if (!this.isHost) return this.permissionError("admin");

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
    });

    // Request to move
    this.socket.on('req-move', data => {
      if (!Array.isArray(data.dst) || typeof data.dst[0] != 'number' || typeof data.dst[1] != 'number' ||
        !Array.isArray(data.src) || typeof data.src[0] != 'number' || typeof data.src[1] != 'number') {
        this.socket.emit('_error', 'Bad Request (request to move)');
      } else {
        let resp = this.chess.attempt_move(this, data.src, data.dst);
        if (resp.code === 0) {
          this.postMove();
        } else if (resp.code === 3) {
          this.socket.emit('choose-pawn-transform', this.chess.go);
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
      if (!this.isHost) return this.permissionError("host");

      let bool = this.chess.restore();
      if (bool) {
        this.chess.toggleGo();
        this.chess.writeLog('<i>Undid latest move</i>', 'Host restored game to last recoreded state');
        this.chess.saveToFile();

        // Update clients
        this.socket.emit('msg', `[!] Restored game to last recorded state. ${this.chess._history.length} recorded states left.`);
        this.socket.to(this.chess.room_name).emit('alert', { title: 'Restored Game', msg: 'Host restored the game to the last recorded state' });
        const room = io.in(this.chess.room_name);
        room.emit('whos-go', this.chess.go);
        room.emit('game-data', this.chess.getGameData());
      } else {
        this.socket.emit('alert', { title: 'Unable to restore game', msg: 'Game is at latest recorded state.' });
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
      if (!this.isHost) return this.permissionError("host");

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

    this.socket.on('req-forfeit', colour => {
      const title = "Unable to forfeit";
      if (colour == 'w' || colour == 'b') {
        if ((this.colour == '*' || this.colour == colour) && this.chess.go == colour) {
          this.chess.recordState();
          this.chess.forfeit(colour);

          this.postMove();
        } else {
          this.socket.emit('alert', { title, msg: `Must request to forfeit on ones go (request from invalid source)` });
        }
      } else {
        this.socket.emit('alert', { title, msg: `400 Bad Request (unknown colour ${colour})` });
      }
    });

    this.socket.on('chose-pawn-transform', piece => {
      if (this.chess._movArgs) {
        if (typeof piece === 'string' && piece.length === 1) {
          const possible = pieces[this.chess.go].pawnInto;
          if (possible.indexOf(piece) !== -1) {
            this.chess.move(...this.chess._movArgs, piece);
            this.postMove();
          } else {
            this.socket.emit('choose-pawn-transform', this.chess.go);
            this.socket.emit('alert', { title: 'Invalid Piece', msg: 'Cannot transform pawn into an invalid piece (' + piece + ')' });
          }
        } else {
          this.socket.emit('_error', `Bad Request: invalid argument (event:choose-pawn-transform)`);
        }
      } else {
        this.socket.emit('_error', `Not expecting pawn transform selection at this time`);
      }
    });

    // ! HOST ONLY
    this.socket.on('change-gamemode', singleplayer => {
      if (!this.isHost) return this.permissionError("host");
      singleplayer = !!singleplayer;

      if (this.chess._singleplayer == singleplayer) {
        this.socket.emit('msg', `Game is already ${singleplayer ? 'singleplayer' : 'multiplayer'}`);
      } else {
        this.chess._singleplayer = singleplayer;
        this.chess.saveToFile();
        io.in(this.chess.room_name).emit('redirect', '/index.html?e=change_mode'); // Kick all players
      }
    });
  }

  /** Open connection to client-side */
  open() {
    this.chess.add_conn(this);
    this.socket.join(this.chess.room_name); // Join socket communication room for game
    this.socket.to(this.chess.room_name).emit('msg', `A new ${this.spectator ? 'spectator' : 'player'} joined.`); // Alert everyone of new connection
    this.socket.to(this.chess.room_name).emit('game-stats', this.chess.getGameStats()); // Update stats for everyone else

    // Let client know that they're connected, and send some base information
    this.updateLog();
    this.socket.emit('token-ok');
    this.socket.emit('pieces-obj', chess.pieces);
    this.updateMemberNames();
  }

  /**
   * Permission Error!
   * @param {"host" | "admin"} req - String permissions required
   */
  permissionError(req) {
    this.socket.emit('alert', { title: 'Invalid Permissions', msg: 'You do not have the permissions required to carry out this action [' + req + '].' });
  }

  /**
   * Update game-log for connection
   */
  updateLog() {
    this.socket.emit('log', this.chess._log);
  }

  /** Post-move. Toggle to and update clients. */
  postMove() {
    this.chess.toggleGo();
    this.chess.saveToFile();

    // Update clients
    const room = io.in(this.chess.room_name);
    room.emit('whos-go', this.chess.go);
    room.emit('game-data', this.chess.getGameData());
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

  /** Update names of everyone in game */
  updateMemberNames(roomName = null) {
    if (roomName == null) roomName = this.chess.room_name;
    let room = io.in(roomName);
    if (this.chess._singleplayer) {
      room.emit('player-name', { n: 1, name: this.name });
      room.emit('player-name', { n: 2, name: this.name });
    } else {
      room.emit('player-name', { n: 1, name: (this.chess.conns.length > 0 ? this.chess.conns[0].name : '?') });
      room.emit('player-name', { n: 2, name: (this.chess.conns.length > 1 ? this.chess.conns[1].name : '?') });
    }
  }

  /** Called when about to disconnect; cut loose ends */
  close() {
    let roomName = this.chess.room_name;
    this.t.del(); // Delete token
    this.chess.remove_conn(this); // Remove connection to ChessInstance

    this.socket.to(roomName).emit('msg', `A ${this.spectator ? 'spectator' : 'player'} left.`); // Leaving message
    this.socket.to(roomName).emit('game-stats', this.chess.getGameStats()); // Update clients on stats
    this.updateMemberNames(roomName);

    // If host, kick out everyone else as well
    if (this.isHost) {
      this.socket.to(this.chess.room_name).emit('redirect', '/index.html?e=host_left');
    }

    this.socket.leave(this.chess.room_name); // Leave room for chess game
  }
}

module.exports = { Connection };