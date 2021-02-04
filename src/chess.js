const fs = require('fs');
const btoa = require('btoa'), atob = require('atob');
const chess_fns = require('../public/js/chess_fns');
const colStr = chess_fns.colStr;

const saves_path = "data/games/";
const rows = 8, cols = 8;

class ChessInstance {
  constructor(name, singleplayer, passwd) {
    this._singleplayer = !!singleplayer;
    this._name = name;
    this._passwd = passwd;

    /**
     * Whose go is it?
     * @type {"w" | "b"}
     */
    this.go = 'w';

    this._data = "";
    this._moved = "";
    this._taken = "";
    all[name] = this;

    /** @type {"" | "w" | "b"} */
    this.winner = "";

    /**
     * Array of all connected Connection objects that are players
     * @type {Connection[]}
     */
    this.conns = [];

    /**
     * Array of all connected Connection objects that are spectators
     * @type {Connection[]}
     */
    this.conns_s = [];
  }

  declareWinner(winner) {
    this.winner = winner;
    if (winner != "") {
      let loser = winner == 'w' ? 'b' : 'w';

      // "Kill" all of black's pieces
      let new_data = "";
      for (let i = 0; i < this._data.length; i++) {
        const piece = this._data[i];
        if (piece != pieces.empty && chess_fns.getPieceColour(piece) == loser) {
          let name = chess_fns.getPieceName(piece);
          new_data += pieces[winner][name];
        } else {
          new_data += piece;
        }
      }
      this._data = new_data;
      // this._moved = "1".repeat(rows * cols);
    }
  }

  /**
   * Attempt to move piece from src to dst
   * @param {Connection} conn - COnnection object requesting move
   * @param {[number, number]} src - Source
   * @param {[number, number]} dst - Destination
   * @return {{code: number, msg: string }} Response object (code: (0) OK (1) error (2) illegal move)
   */
  attempt_move(conn, src, dst) {
    // Game already won?
    if (this.winner != "") return { code: 1, msg: `This game has been won by ${colStr(this.winner)}` };

    // Is spectator?
    if (conn.spectator) return { code: 1, msg: 'Spectators cannot move pieces' };

    // Generate chess board analysis object
    const chessBoard = chess_fns.chessBoard(
      chess_fns.dataToArray(this._data, cols),
      chess_fns.dataToArray(this._moved, cols)
    );

    // Moving to same location?
    if (src[0] == dst[0] && src[1] == dst[1]) return { code: 1, msg: 'Must move to a different location' };

    const piece_src = chessBoard.getAt(...src), piece_dst = chessBoard.getAt(...dst);

    // Piece locations exist?
    if (piece_src == undefined || piece_dst == undefined) return { code: 1, msg: 'Invalid piece locations (out of bounds)' };

    // Moving a piece?
    if (!isPiece(piece_src)) return { code: 1, msg: 'Must be moving a piece' };

    // Are we allowed to be moving this piece? (are colours OK?)
    let src_colour = getPieceColour(piece_src);
    if (src_colour != this.go) return { code: 2, msg: `Trying to move ${colStr(src_colour)} piece on ${colStr(this.go)}'s go` };
    if (conn.colour != '*' && src_colour != conn.colour) return { code: 2, msg: `${colStr(conn.colour)} player trying to move ${colStr(src_colour)} piece` };

    // Cannot move onto self!
    let dst_colour = getPieceColour(piece_dst);
    if (src_colour == dst_colour) return { code: 2, msg: `Cannot take own piece (${colStr(dst_colour)})<br>(Castling not supported)` };

    // Check if dst is valid spot
    // let validSpots = chessBoard.getMoves(...src);
    let valid = conn.admin || chessBoard.isValidMove(src, dst);

    let movStr = `${colStr(src_colour)} ${chess_fns.getPieceName(piece_src)} from ${chessBoard.lbl(...src)} to ${chessBoard.lbl(...dst)}`;
    if (valid) {
      chessBoard.replace(...dst, piece_src);
      chessBoard.replace(...src, pieces.empty);
      this._data = chessBoard.getData();
      this._moved = chessBoard.getMoved();
      movStr = colStr(this.go) + ": " + movStr;

      if (piece_dst != pieces.empty) {
        movStr += `, taking ${colStr(dst_colour)}'s ${chess_fns.getPieceName(piece_dst)}`;
        this._taken += piece_dst;
      }

      if (chess_fns.isPieceA(piece_dst, 'king')) {
        this.declareWinner(this.go);
        this.saveToFile();
      }

      // Toggle turn
      this.go = this.go == 'b' ? 'w' : 'b';

      return { code: 0, msg: movStr };
    } else {
      movStr = "Cannot move " + movStr;
      return { code: 2, msg: movStr };
    }
  }

  /**
   * Get moved for a piece in location provided
   * @param {number} row
   * @param {number} col
   * @return {number[][]}
   */
  getPieceMoves() {
    let obj = chess_fns.chessBoard(
      chess_fns.dataToArray(this.chess._data, chess.cols),
      chess_fns.dataToArray(this.chess._moved, chess.cols)
    );
    let spots = obj.getMoves(row, col);
    return spots;
  }

  /**
   * Return object which can be sent to clients, to represent this game's data
   */
  getGameData() {
    return {
      d: this._data,
      m: this._moved,
      t: this._taken,
      w: this.winner,
    };
  }

  /**
   * Return objects which can be sent to clients, to represent this game's stats
   */
  getGameStats() {
    return {
      ppl: this.conns.length,
      full: +this.isFull(),
      spec: this.conns_s.length,
    };
  }

  /**
   * =================================================================
   * = MANAGMENT
   */

  get filepath() { return saves_path + btoa(this._name) + '.json'; }
  get room_name() { return "game:" + this._name; }

  /**
   * Add Connection object
   * @param {Connection} conn
   */
  add_conn(conn) {
    if (this.isFull() && !conn.spectator) throw `Chess.add_conn: Chess game '${this._name}' is full`;
    if (this.spectator) {
      this.conns_s.push(conn);
    } else {
      this.conns.push(conn);
      conn.colour = this._singleplayer ? '*' : (this.conns.length == 1 ? 'w' : 'b'); // Multiplayer: First player is white
    }
    conn.socket.join(this.room_name);
  }

  /**
   * Remove connection object
   */
  remove_conn(conn) {
    let arr = conn.spectator ? this.conns_s : this.conns;
    const i = arr.indexOf(conn);
    if (i !== -1) {
      arr.splice(i, 1);
      conn.socket.leave(this.room_name);
    }
  }

  // Is game full? (can we connect to it?)
  isFull() {
    return this._singleplayer ? (this.conns.length == 1) : true;
  }

  saveToFile() {
    // Merge this._data and this._moved
    let board = "";
    for (let i = 0; i < this._data.length; i++) board += this._moved[i].toString() + this._data[i];

    const data = JSON.stringify({
      s: this._singleplayer ? 1 : 0,
      p: btoa(this._passwd),
      wg: +(this.go == 'w'),
      d: board,
      t: this._taken,
      w: this.winner,
    });
    fs.writeFileSync(this.filepath, data);
  }

  /** Delete game */
  del() {
    fs.unlink(this.filepath, () => console.log(`Chess.del: deleted file ${this.filepath} `));
    delete all[this._name];
  }
}

/**
 * Populate ChessInstance::_data property
 */
ChessInstance.newData = (obj) => {
  obj._data = "";
  obj._moved = "";
  obj.winner = "";
  obj._taken = "";

  obj._data += pieces.b.rook + pieces.b.knight + pieces.b.bishop + pieces.b.queen + pieces.b.king + pieces.b.bishop + pieces.b.knight + pieces.b.rook;
  obj._data += pieces.b.pawn.repeat(cols);
  obj._moved += '0'.repeat(cols * 2);
  for (let i = 0; i < 4; i++) {
    obj._data += pieces.empty.repeat(cols);
    obj._moved += '0'.repeat(cols);
  }
  obj._data += pieces.w.pawn.repeat(cols);
  obj._data += pieces.w.rook + pieces.w.knight + pieces.w.bishop + pieces.w.queen + pieces.w.king + pieces.w.bishop + pieces.w.knight + pieces.w.rook;
  obj._moved += '0'.repeat(cols * 2);
};

/**
 * Validate data - valid chess data?
 * @param {string} data - Data to validate
 * @return {true | string} Return true if valid, else return the bad character
 */
ChessInstance.isValidData = data => {
  if (typeof data != 'string') return false;
  const good = Object.values(pieces.w).concat(Object.values(pieces.b), pieces.empty);
  for (const c of data) {
    if (good.indexOf(c) === -1) return c;
  }
  return true;
};

/**
 * Validate data - valid moved data?
 * @param {string} data - Data to validate
 * @return {true | string} Return true if valid, else return the bad character
 */
ChessInstance.isValidMovedData = data => {
  if (typeof data != 'string') return false;
  for (const c of data) {
    if (c != "0" && c != "1") return c;
  }
  return true;
};

/**
 * Instantiate CheccInstance from data file
 * @param {string} name - data file path.
 * @param {boolean} b64 - is name in base64?
 * @return {ChessInstance}
 */
ChessInstance.fromFile = (name, b64) => {
  let filepath = saves_path + name + '.json';
  let data = JSON.parse(fs.readFileSync(filepath));

  let obj = new ChessInstance(b64 ? atob(name) : name, !!data.s, atob(data.p));
  for (let i = 0; i < data.d.length; i += 2) {
    obj._moved += data.d[i];
    obj._data += data.d[i + 1];
  }
  obj._taken = data.t;
  obj.go = data.wg ? 'w' : 'b';
  obj.declareWinner(data.w);
  return obj;
};

ChessInstance.createNew = (name, singleplayer, passwd) => {
  if (name in all) throw `Game ${name} already exists`;

  let obj = new ChessInstance(name, singleplayer, passwd);
  ChessInstance.newData(obj);
  obj.saveToFile();
  return obj;
};

/**
 * Is given string a chess piece?
 * @param {string} piece
 */
const isPiece = piece => pieces.w.all.indexOf(piece) !== -1 || pieces.b.all.indexOf(piece) !== -1;

/**
 * Get piece colour from piece
 * @param {string} piece
 * @return {"w" | "b" | null}
 */
const getPieceColour = piece => {
  if (pieces.w.all.indexOf(piece) !== -1) return 'w';
  if (pieces.b.all.indexOf(piece) !== -1) return 'b';
  return null;
};

/**
 * Object containing all chess games
 * @type {{[name: string]: ChessInstance}}
 */
const all = {};

const pieces = JSON.parse(fs.readFileSync('data/pieces.json'));
pieces.w.all = Object.values(pieces.w);
pieces.b.all = Object.values(pieces.b);
chess_fns.loadPieces(pieces);


module.exports = { ChessInstance, saves_path, all, pieces, rows, cols, };