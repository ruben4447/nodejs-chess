/***
 * All listeners for index.html.js
 */

const chess = require('./chess.js');
const access_token = require('./access_token.js');

module.exports = (socket) => {
  socket.on('req-game-count', () => {
    socket.emit('game-count', Object.keys(chess.all).length);
  });

  socket.on('req-game-list', () => {
    socket.emit('game-list', Object.keys(chess.all));
  });

  const gameInfoObj = obj => ({
    game: obj._name,
    full: +obj.isFull(),
    s: +obj._singleplayer,
  });
  socket.on('req-game-info', game_name => {
    if (chess.all[game_name]) {
      let obj = chess.all[game_name];
      socket.emit('game-info', gameInfoObj(obj));
    } else {
      socket.emit('_error', `Game '${game_name}' does not exist.`);
    }
  });

  socket.on('req-conn-game', data => {
    if (chess.all[data.game]) {
      let obj = chess.all[data.game];
      if (data.passwd == obj._passwd) {
        // Generate unique access token
        const token = access_token.create(obj);
        socket.emit('conn-game', token);
      } else {
        socket.emit('_error', `Cannot join game; password is incorrect.`);
      }
    } else {
      socket.emit('_error', `Game '${data.game}' does not exist.`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[${socket.id}] Connection closed.`);
  });
};