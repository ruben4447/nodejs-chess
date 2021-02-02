const uuid = require('uuid');
const chess = require('./chess.js');

/**
 * Store access tokens which allow access to certain games
 * - access_token: [chess_game, expire_timer_id, socket_used_by, is_spectator]
 * @type {{[t: string]: [chess.ChessInstance, number, null | socket, boolean]}}
 */
const access_tokens = {};

/**
 * Create new access token
 * @param {ChessInstance} game - Game instance to create token for
 * @param {boolean} spec - Join game as spectator?
 * @return {string} access token
 */
const create = (game, spec) => {
  const token = uuid.v4();
  let timer = setTimeout(() => {
    delete access_tokens[token];
    console.log(`Removed access token for game '${game._name}' : ${token} (spectator: ${spec})`);
  }, 1500);

  access_tokens[token] = [game, timer, null, spec];

  console.log(`Added access token for game '${game._name}' : ${token} (spectator: ${spec})`);
  return token;
};

/**
 * Does this token exist?
 * @param {string} token
 * @return {boolean}
*/
const exists = token => access_tokens[token] == undefined;

/**
 * Is token valid for given socket?
 * - Cancels timer if is valid
 * @param {string} token
 * @param {socketil.Socket} socket - Socket.Io socket Object
 * @return {boolean}
 */
const is_valid = (token, socket) => {
  let info = access_tokens[token];
  if (info) {
    if (info[2] == null) {
      info[2] = socket;
      clearTimeout(info[1]); // Cancel timer
      console.log(`Access token for game '${info[0]._name}' consumed : ${token}`);
      return true;
    } else {
      return info[2].id === socket.id;
    }
  } else {
    console.log(`access_token.is_valid: token ${token} does not exist`);
    return false;
  }
};

/**
 * Get info from stored token cache
 * @param {string} token
 * @param {number} index
 * @return {any} Data at access_token[t][index]
 */
const get_data = (token, index) => {
  if (access_tokens[token]) {
    return access_tokens[token][index];
  } else {
    return undefined;
  }
};

/**
 * Delete a token
 * @param {string} token
 */
const remove = token => {
  delete access_tokens[token];
};


module.exports = { create, exists, is_valid, get_data, remove };
