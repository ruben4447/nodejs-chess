const socket = {
  _: undefined,

  main() {
    this._ = io();

    let urlParams = new URLSearchParams(location.search);
    globalThis.T = urlParams.get('t');
    this._.emit('send-token', globalThis.T);

    this._addListeners();
  },

  _addListeners() {
    this._.on('token-ok', () => {
      console.log('%cToken Authorised', 'color:forestgreen;');

      // Request game information
      this._.emit('req-game-info');
      this._.emit('req-game-stats');
      this._.emit('req-game-data');
      this._.emit('req-whos-go');

      this._.emit('req-admin', 'password');
    });

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

    this._.on('pieces-obj', obj => pieces = obj);

    // GAME INFO
    this._.on('game-info', x => {
      game.setName(atob(x.name));
      game._singleplayer = !!x.s;
      game._host = !!x.host;
      if (x.host) {
        document.title += ' (host)';
        dom.input_allow_spectators.checked = x.aspec;
      } else {
        dom.div_restricted.remove();
        dom.input_allow_spectators.remove();
      }
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
    this._.on('game-stats', x => game.updateStats(x));

    this._.on('validated-data', obj => {
      if (obj.valid) {
        console.log('Data is valid.');
      } else {
        console.warn(`Data is not valid\nBad char: "${obj.val}"`);
      }
    });

    // GAME DATA
    // arg = { d: data, m: moved, t: taken, w: winner }
    this._.on('game-data', ({ d, m, t, w }) => {
      game.board = chessBoard(
        dataToArray(d, game.renderOpts.cols),
        dataToArray(m, game.renderOpts.cols)
      );
      game.taken = t;
      game.winner(w);
      sketch.rerender = true;
    });

    // WHO'S GO
    this._.on('whos-go', a => {
      game._go = a;
      dom.p_go.innerText = a == 'w' ? 'white' : 'black';
    });

    this._.on('log', lines => {
      let content = '';
      for (let line of lines) {
        let at = formatDate(line[2]);
        content = `<span class="log-line" title="${line[1]} @ ${at}">${line[0]}</span><br>` + content;
      }
      dom.div_log.innerHTML = content;
    });

    this._.on('redirect', url => window.location.href = url);
  }
};

window.addEventListener('load', () => {
  socket.main();
});