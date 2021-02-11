const uuid = require('uuid');

/** Create new access token */
class Token {
  /**
   * @param {chess.ChessInstance} game - Game instance to create token for
   * @param {boolean} spec - Join game as spectator?
   * @param {string} name - Users' name
   */
  constructor(game, spectator, name) {
    this._game = game;
    this._spectator = !!spectator;
    this._name = name;
    this._ = uuid.v4();
    this._socket = null;
    this._expire = setTimeout(() => this.del(), Token.expireTime);
    Token.all[this._] = this;
  }

  /** Get actual token (uuid v4) */
  get() { return this._; }

  /** Return the connected socket */
  getConnectedSocket() { return this._socket; }

  /** Return the reference game */
  getRefGame() { return this._game; }

  /** Are we a spectator? */
  isSpectator() { return this._spectator; }

  /** Get name of user who created this token */
  getCreatorName() { return this._name; }

  /**
   * Link thie token to a socket
   * @param {object} socket - Socket attempting to connect via token
   * @return {boolean} Return false is already consumed
   */
  consume(socket) {
    if (this._socket == null) {
      this._socket = socket;
      clearTimeout(this._expire); // Cancel timer
      this._expire = NaN;
      return true;
    } else {
      return false;
    }
  }

  /** Remove from lookup dictionary */
  del() {
    if (!isNaN(this._expire)) clearTimeout(this._expire);
    delete Token.all[this._];
  }
}

/**
 * Attempt to return the Token object that contains info about the token
 * @param {string} token - String token
 * @return {Token | null} Token object, or null if doesn't exist
*/
Token.get = function (token) {
  return Token.all[token] ? Token.all[token] : null;
};

Token.expireTime = 3000;

/**
 * Stores all access tokens
 * @type {{[t: string]: Token}}
 */
Token.all = {};

module.exports = { Token };
