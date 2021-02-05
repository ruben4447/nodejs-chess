const uuid = require('uuid');
const colour = require('./colour.js');

/**
 * Store access tokens which allow access to certain games
 * - access_token: [chess_game, expire_timer_id, socket_used_by, is_spectator]
 * @type {{[t: string]: [chess.ChessInstance, number, null | socket, boolean]}}
 */
const access_tokens = {};

/**
 * Create new access token
 * @param {chess.ChessInstance} game - Game instance to create token for
 * @param {boolean} spec - Join game as spectator?
 * @return {string} access token
 */
const create = (game, spec) => {
  const token = uuid.v4();
  let timer = setTimeout(() => {
    delete access_tokens[token];
    // console.log(`${colour.fgRed} Access token for game ${colour.fgYellow}'${game._name}'${colour.fgRed} expired : ${colour.fgYellow}${token}${colour.reset}`);
  }, 1500);

  access_tokens[token] = [game, timer, null, spec];

  // console.log(`${colour.fgGreen}Created access token for game ${colour.fgYellow}'${game._name}'${colour.fgGreen} : ${colour.fgYellow}${token}${colour.reset}`);
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
      // console.log(`Access token for game '${info[0]._name}' consumed : ${token}`);
      return true;
    } else {
      return info[2].id === socket.id;
    }
  } else {
    // console.log(`access_token.is_valid: ${colour.fgRed}token ${colour.fgYellow}${token}${colour.fgRed} does not exist${colour.reset}`);
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
