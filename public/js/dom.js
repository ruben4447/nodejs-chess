const dom = {
  btn_disconnect: document.getElementById('btn-disconnect'),
  btn_delete: document.getElementById('btn-delete'),
  div_canvas_wrapper: document.getElementById('canvas-wrapper'),
  p_game_full: document.getElementById('game-full'),
  p_players: document.getElementById('game-players'),
  p_spectators: document.getElementById('game-spectators'),
  p_am_spectator: document.getElementById('am-spectator'),

  h2_gname: document.getElementById('game--name'),
};

dom.btn_disconnect.addEventListener('click', () => {
  bootbox.confirm('Are you sure you want to leave the game?', bool => {
    if (bool) {
      socket._.emit('req-leave-game');
      window.location.href = '/index.html?e=left';
    }
  });
});

dom.btn_delete.addEventListener('click', () => {
  bootbox.confirm('Delete this game?', bool => {
    if (bool) socket._.emit('req-delete-game', globalThis.T);
  });
});