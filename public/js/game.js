const game = {
  _name: undefined, // Game name
  _singleplayer: undefined, // Is this singleplayer (true) or not
  host: false, // Are we host of the game?
  _ai: false,
  aiPlayDelay: 0,
  aiColour: 'b', // Colour of AI ("w", "b", "*")

  /** Row count of chess board */
  rows: 8,
  /** Columns count of chess board */
  cols: 8,

  /** @type {"" | "w" | "b"} */
  _winner: "",

  /** @type {"w" | "b"} */
  _go: undefined, // Whose go is it?

  /** @type {"w" | "b" | "*"} */
  _me: undefined, // What colour am i?

  /** Contains chess board (result of chess_fns.chessBoard(...)) */
  board: undefined,

  /** Contains string of taken pieces */
  taken: "",

  /** Update name of game */
  setName(name) {
    document.title = `Chess | ${name}`;
    this._name = name;
    dom.h2_gname.innerText = name;
    dom.h2_gname.setAttribute('title', `Game: ${name}`);
  },

  /** Get name of game */
  getName() { return this._name; },

  /** Update game stats. Called by game-stats event. */
  updateStats(obj) {
    let full = +obj.ppl == +obj.max;
    dom.p_players.innerHTML = `&#128372; ${obj.ppl} / ${obj.max}`;
    dom.p_players.classList[full ? 'add' : 'remove']('info-alert');
    dom.p_players.setAttribute('title', `${obj.ppl} Players ${full ? '(Full)' : ''}`);

    dom.p_spectators.innerHTML = `&#128065; ${obj.spec}`;
    dom.p_spectators.setAttribute('title', `${obj.spec} Watching`);
  },

  /** Is client a spectator? */
  amSpectator(bool) {
    if (bool) {
      mouseMoved = () => { };
      mouseClicked = () => { };

      document.title += ' (spectating)';
      dom.p_above_log.innerHTML = '&#128065; You are a spectator';
      dom.p_above_log.classList.add('small-info');
    }
    delete game.amSpectator;
  },

  /** Attempt to save game data */
  save() {
    socket._.emit('req-save', {
      d: game.board.getData(),
      m: game.board.getMoved(),
      t: game.taken
    });
  },

  giveUp() {
    let colour = this._go;
    bootbox.confirm({
      title: 'Give Up?',
      message: 'Sacrifice your king and forfeit the game?',
      buttons: {
        confirm: {
          label: 'Forfeit',
          className: 'btn btn-danger',
        },
      },
      callback: bool => {
        if (bool) {
          socket._.emit('req-forfeit', colour);
        }
      }
    });
  },

  // choosePawnTransform(for_colour) {
  //   let inputOptions = pieces[for_colour].pawnInto.map(p => ({ text: `${getPieceName(p)} (${p})`, value: p }));
  //   let _default = pieces[for_colour].pawnInto[0];
  //   inputOptions.unshift({ text: `Default: ${_default}`, value: '' });
  //   bootbox.prompt({
  //     title: 'Choose Piece',
  //     message: `Turn ${colStr(for_colour)} pawn into... `,
  //     inputType: 'select',
  //     inputOptions,
  //     callback: result => {
  //       if (result == '' || result == null) result = _default;
  //       socket._.emit('chose-pawn-transform', result);
  //     },
  //   });
  // },

  aiPlay() {
    if (this.aiColour == '*' || this._go == this.aiColour) {
      setTimeout(() => {
        let move = AI.getBestMove(this.board, this._go);
        AI.move(move);
      }, this.aiPlayDelay);
    }
  },

  /** Set winner of game */
  winner(w) {
    this._winner = w;
    if (w != '') {
      let winner = colStr(w);
      dom.p_go_wrapper.setAttribute('hidden', 'hidden');
      dom.p_winner_wrapper.removeAttribute('hidden');
      dom.p_winner.innerText = winner;
      bootbox.alert({ title: 'Game Winner', message: `${winner} won the game!` });
    } else {
      dom.p_winner_wrapper.setAttribute('hidden', 'hidden');
      dom.p_go_wrapper.removeAttribute('hidden');
    }
  }
};

let pieces; // Pieces object
let piece_values; // Piece values object