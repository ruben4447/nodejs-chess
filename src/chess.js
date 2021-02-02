const fs = require('fs');
const btoa = require('btoa'), atob = require('atob');
const uuid = require('uuid');

const saves_path = "data/games/";

class ChessInstance {
  constructor(name, singleplayer, passwd) {
    this._singleplayer = !!singleplayer;
    this._name = name;
    this._passwd = passwd;

    this._data = "";
    all[name] = this;
  }

  get filepath() { return saves_path + btoa(this._name) + '.json'; }

  // Is game full? (can we connect to it?)
  isFull() { return false; }

  saveToFile() {
    const data = JSON.stringify({
      s: this._singleplayer ? 1 : 0,
      p: btoa(this._passwd),
      d: btoa(this._data),
    });
    fs.writeFileSync(this.filepath, data);
  }
}

/**
 * Populate ChessInstance::_data property
 */
ChessInstance.newData = (obj) => {
  obj._data = "";
  obj._data += pieces.black.rook + pieces.black.knight + pieces.black.bishop + pieces.black.queen + pieces.black.king + pieces.black.bishop + pieces.black.knight + pieces.black.rook;
  for (let i = 0; i < 4; i++) obj._data += ' '.repeat(8);
  obj._data += pieces.white.rook + pieces.white.knight + pieces.white.bishop + pieces.white.queen + pieces.white.king + pieces.white.bishop + pieces.white.knight + pieces.white.rook;
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
  obj._data = atob(data.d);
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