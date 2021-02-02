const fs = require('fs');
const btoa = require('btoa'), atob = require('atob');

const saves_path = "data/games/";

class ChessInstance {
  constructor(name, singleplayer, passwd) {
    this._singleplayer = !!singleplayer;
    this._name = name;
    this._passwd = passwd;

    this._data = "";
    all[name] = this;

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

  get filepath() { return saves_path + btoa(this._name) + '.json'; }
  get room_name() { return "game:" + this._name; }

  /**
   * Add Connection object
   * @param {Connection} conn
   */
  add_conn(conn) {
    if (this.isFull() && !conn.spectator) throw `Chess.add_conn: Chess game '${this._name}' is full`;
    let arr = conn.spectator ? this.conns_s : this.conns;
    arr.push(conn);
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
    const data = JSON.stringify({
      s: this._singleplayer ? 1 : 0,
      p: btoa(this._passwd),
      d: this._data,
    });
    fs.writeFileSync(this.filepath, data);
  }

  /**
   * Delete game
   */
  del() {
    fs.unlink(this.filepath, () => console.log(`Chess.del: deleted file ${this.filepath}`));
    delete all[this._name];
  }
}

/**
 * Populate ChessInstance::_data property
 */
ChessInstance.newData = (obj) => {
  obj._data = "";
  obj._data += pieces.b.rook + pieces.b.knight + pieces.b.bishop + pieces.b.queen + pieces.b.king + pieces.b.bishop + pieces.b.knight + pieces.b.rook;
  obj._data += pieces.b.pawn.repeat(8);
  for (let i = 0; i < 4; i++) obj._data += ' '.repeat(8);
  obj._data += pieces.w.pawn.repeat(8);
  obj._data += pieces.w.rook + pieces.w.knight + pieces.w.bishop + pieces.w.queen + pieces.w.king + pieces.w.bishop + pieces.w.knight + pieces.w.rook;
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
  obj._data = data.d;
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
 * Object containing all chess games
 * @type {{[name: string]: ChessInstance}}
 */
const all = {};

const pieces = JSON.parse(fs.readFileSync('data/pieces.json'));


module.exports = { ChessInstance, saves_path, all, pieces };