const dom = {
  btn_disconnect: document.getElementById('btn-disconnect'),
  btn_delete: document.getElementById('btn-delete'),
  btn_reset: document.getElementById('btn-reset'),

  div_canvas_wrapper: document.getElementById('canvas-wrapper'),
  div_restricted: document.getElementById('restricted'),

  p_game_full: document.getElementById('game-full'),
  p_players: document.getElementById('game-players'),
  p_spectators: document.getElementById('game-spectators'),
  p_am_spectator: document.getElementById('am-spectator'),
  p_colour: document.getElementById('me-colour'),
  p_go_wrapper: document.getElementById('whos-go-wrapper'),
  p_go: document.getElementById('whos-go'),
  p_winner_wrapper: document.getElementById('game-winner-wrapper'),
  p_winner: document.getElementById('game-winner'),

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

dom.btn_reset.addEventListener('click', () => {
  bootbox.confirm('Reset the game?', bool => {
    if (bool) socket._.emit('req-reset-game');
  });
});