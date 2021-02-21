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
      this._.emit('req-whos-go');
      this._.emit('req-game-data');
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
    this._.on('invalid-token', (n) => {
      console.error("INVALID GAME TOKEN. Stage " + n);
      document.body.innerHTML = '';
      window.location.href = '/index.html?e=invalid_t';
    });

    this._.on('player-name', ({ n, name }) => {
      let el = dom[`p_p${n}name`];
      if (el) el.innerText = name;
    });

    this._.on('pieces-obj', obj => pieces = obj);
    this._.on('piece-value-obj', obj => piece_values = obj);

    // GAME INFO
    this._.on('game-info', x => {
      game.setName(atob(x.name));
      game._singleplayer = !!x.s;
      game._host = !!x.host;
      game._ai = !!x.ai;
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
        dom.p_ai_wrapper.removeAttribute('hidden'); // Option to switch to AI
      } else {
        dom.p_colour.removeAttribute('hidden');
        dom.p_colour.innerHTML = 'Colour: ' + (x.col == 'w' ? 'white' : 'black') + '<br/>';
        game.me = x.col;
        dom.p_ai_wrapper.setAttribute('hidden', 'hidden'); // Cannot play against AI in multiplayer
      }

      dom.input_ai.checked = game._ai;
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
        dataToArray(d, game.cols),
        dataToArray(m, game.cols)
      );
      game.taken = t;
      game.winner(w);
      render.render();
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
    this._.on('move-done', () => game._ai && game.aiPlay());
    this._.on('against-ai', val => {
      // console.log("Against AI = %c" + (!!val), "font-weight:bold;color:" + (val ? 'green' : 'red'));
      dom.input_ai.checked = val;
      game._ai = !!val;
    });
  }
};

window.addEventListener('load', () => {
  socket.main();
  render.init();
});