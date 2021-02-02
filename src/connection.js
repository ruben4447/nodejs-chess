const access_token = require('./access_token.js');

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
    this._t = t;
    this.chess = access_token.get_data(t, 0);
    this.socket = access_token.get_data(t, 2);

    console.log(`${t}: created connection (SID: ${this.socket.id})`);

    this._initListeners();
  }

  _initListeners() {
    this.socket.on('disconnect', () => {
      this.remove_token();
      console.log(`Socket ${this.socket.id}: closing connection.`);
    });

    this.socket.on('req-leave-game', () => this.remove_token());
  }

  /**
   * Remove access token from connection
   */
  remove_token() {
    console.log(`Connection.remove_token: removing token ${this._t}`);
    access_token.remove(this._t);
  }
}

module.exports = { Connection };