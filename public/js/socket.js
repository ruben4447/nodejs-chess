const socket = {
  _: undefined,

  main() {
    this._ = io();

    globalThis.urlParams = new URLSearchParams(location.search);
    globalThis.T = urlParams.get('t');
    this._.emit('send-token', globalThis.T);
    this._.emit('req-pieces-obj');
    this._.emit('req-game-info');
    this._.emit('req-game-stats');
    this._.emit('req-game-data');
    this._.emit('req-whos-go');

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

    this._.on('pieces-obj', obj => pieces = obj);

    // GAME INFO
    this._.on('game-info', x => {
      game.setName(atob(x.name));
      game._singleplayer = !!x.s;
      game._first = !!x.first;
      if (!x.first) dom.div_restricted.remove();
      game.amSpectator(x.spec);
      game._colour = x.col;

      if (x.s) {
        dom.p_colour.setAttribute('hidden', 'hidden');
        game._me = '*';
      } else {
        dom.p_colour.removeAttribute('hidden');
        dom.p_colour.innerHTML = 'Colour: ' + (x.col == 'w' ? 'white' : 'black') + '<br/>';
        game.me = x.col;
      }
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

    this._.on('validated-data', obj => {
      if (obj.valid) {
        console.log('Data is valid.');
      } else {
        console.warn(`Data is not valid\nBad char: "${obj.val}"`);
      }
    });

    // GAME DATA
    // arg = { d: data, m: moved, t: taken }
    this._.on('game-data', ({ d, m, t }) => {
      game.board = chessBoard(
        dataToArray(d, game.renderOpts.cols),
        dataToArray(m, game.renderOpts.cols)
      );
      game.board.admin(game._admin);
      game.taken = t;
      sketch.rerender = true;
    });

    // WHO'S GO
    this._.on('whos-go', a => {
      game._go = a;
      dom.p_go.innerText = a == 'w' ? 'white' : 'black';
    });

    this._.on('moved', arg => {
      console.log(arg);
    });

    // Server granted admin rights to client
    this._.on('grant-admin', () => {
      console.log('%cAdministrator rights granted.', 'font-style: italic;');
      game._admin = true;
      game.board.admin(true);
    });

    this._.on('highlight-positions', x => {
      sketch.highlighted = x;
      sketch.rerender = true;
    });
  }
};

window.addEventListener('load', () => {
  socket.main();
});