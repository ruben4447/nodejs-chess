const socket = {
  _: undefined,

  main() {
    this._ = io();

    globalThis.urlParams = new URLSearchParams(location.search);
    globalThis.T = urlParams.get('t')
    this._.emit('send-token', globalThis.T);
    this._.emit('req-pieces-obj');
    this._.emit('req-game-info');
    this._.emit('req-game-stats');
    this._.emit('req-game-data');

    this._addListeners();
  },

  _addListeners() {
    this._.on('msg', msg => console.log(msg));
    this._.on('alert', arg => {
      console.log(arg);
      if (typeof arg == 'string') {
        bootbox.alert(arg);
      } else {
        bootbox.alert({ title: arg.title, message: arg.msg, });
      }
    });
    this._.on('_error', message => {
      console.error(message);
      bootbox.alert({ title: 'Error', message });
    });

    // Token is not valid...
    this._.on('invalid-token', () => {
      console.error("INVALID GAME TOKEN");
      document.body.innerHTML = '';
      window.location.href = '/index.html?e=invalid_t';
    });

    this._.on('deleted-game', () => window.location.href = '/index.html?e=deleted');

    this._.on('pieces-obj', obj => game.pieces = obj);

    // GAME INFO
    this._.on('game-info', x => {
      game.setName(atob(x.name));
      game._singleplayer = !!x.s;
      game._first = !!x.first;
      if (!x.first) dom.btn_delete.remove();
      game.amSpectator(x.spec);
    });

    // GAME STATS
    this._.on('game-stats', x => {
      if (x.full) {
        dom.p_game_full.removeAttribute('hidden');
      } else {
        dom.p_game_full.setAttribute('hidden', 'hidden');
      }
      game._ppl = +x.ppl;
      dom.p_players.innerText = x.ppl;
      game._spectators = +x.spec;
      dom.p_spectators.innerText = x.spec;
    });

    this._.on('game-data', d => {
      game.data = d;
      sketch.rerender = true;
    });
  }
};

window.addEventListener('load', () => {
  socket.main();
});