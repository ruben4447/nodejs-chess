const dom = {
  btn_disconnect: document.getElementById('btn-disconnect'),
  btn_delete: document.getElementById('btn-delete'),
  btn_reset: document.getElementById('btn-reset'),
  btn_restore: document.getElementById('btn-restore'),
  btn_mode: document.getElementById('btn-mode'),

  input_allow_spectators: document.getElementById('allow-spectators'),
  input_ai: document.getElementById('against-ai'),

  canvas: document.getElementById('canvas'),
  div_canvas_wrapper: document.getElementById('canvas-wrapper'),
  div_restricted: document.getElementById('restricted'),
  div_log: document.getElementById('game-log'),

  p_above_log: document.getElementById('above-log'),
  p_players: document.getElementById('game-players'),
  p_spectators: document.getElementById('game-spectators'),
  p_colour: document.getElementById('me-colour'),
  p_go_wrapper: document.getElementById('whos-go-wrapper'),
  p_go: document.getElementById('whos-go'),
  p_winner_wrapper: document.getElementById('game-winner-wrapper'),
  p_winner: document.getElementById('game-winner'),
  p_p1name: document.getElementById('player-1-name'),
  p_p2name: document.getElementById('player-2-name'),
  p_ai_wrapper: document.getElementById('game-ai-wrapper'),
  p_ai_icon: document.getElementById('game-ai-icon'),

  h2_gname: document.getElementById('game-name'),
};

dom.btn_disconnect.addEventListener('click', () => {
  bootbox.confirm('Are you sure you want to leave the game?', bool => {
    if (bool) {
      socket._.emit('leave-game');
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

dom.btn_restore.addEventListener('click', () => {
  bootbox.confirm('Restore game to latest recorded state?', bool => {
    if (bool) socket._.emit('req-restore');
  });
});

dom.input_allow_spectators.addEventListener('change', function () {
  socket._.emit('req-allow-spectators', this.checked);
});

dom.btn_mode.addEventListener('click', () => {
  const current = game._singleplayer ? "singleplayer" : "multiplayer";
  const other = game._singleplayer ? "multiplayer" : "singleplayer";

  bootbox.dialog({
    title: 'Game Mode',
    message: `Change game mode from ${current} to ${other}? (all players will be kicked)`,
    buttons: {
      cancel: {
        label: 'Cancel',
        className: 'btn btn-secondary'
      },
      confirm: {
        label: `Change to ${other}`,
        className: 'btn btn-primary',
        callback: () => socket._.emit('change-gamemode', !game._singleplayer)
      }
    }
  });
});

dom.input_ai.addEventListener('change', ev => socket._.emit('against-ai', +ev.target.checked));

dom.p_ai_icon.addEventListener('click', () => bootbox.dialog(generate_ai_options_dialog()));