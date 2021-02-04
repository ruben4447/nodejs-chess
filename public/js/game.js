const game = {
  _ppl: undefined, // How many people are connected to the game?
  _spectators: undefined, // How many spectators are connected to the game?
  _name: undefined, // Game name
  _singleplayer: undefined, // Is this singleplayer (true) or not
  _first: undefined, // First player to join game?
  _admin: false, // Are we an administrator (set via event grant-admin)

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


  renderOpts: {
    swidth: 85, // Width of cell
    sheight: 85, // Height of cell
    psize: 43, // Font size of pieces
    rows: 8,
    cols: 8,
    start_white: true, // Start with white square?
    col_w: [118, 127, 144], // White stroke
    fill_w: 51, // White fill
    col_b: [53, 59, 71], // Black stroke
    fill_b: 12, // Black fill
    col_o: [115, 144, 83], // Colour when cell is hovered over
    col_s: [115, 83, 144], // Colour when cell is selected
    col_h: [52, 207, 46], // Colour when cell is highlighted
    lblsize: 17, // Font size of labels
    pad: 30,
    takenh: 40, // Height of "taken" section
    taken_size: 30, // Font size of taken pieces
    dev: true, // Render developer stuff
  },

  /** Update name of game */
  setName(name) {
    document.title = `Chess | ${name}`;
    this._name = name;
    dom.h2_gname.innerText = name;
    dom.h2_gname.setAttribute('title', `Game: ${name}`);
  },

  /** Get name of game */
  getName() { return this._name; },

  /** Is client a spectator? */
  amSpectator(bool) {
    if (bool) {
      mouseMoved = () => { };
      mouseClicked = () => { };

      document.title += ' (spectating)';
    } else {
      dom.p_am_spectator.remove();
    }
    delete game.amSpectator;
  },

  /**
   * Given mouse coords, retern vertical index of position over or -1
   * @param {number} x - x coord
   * @param {number} y - y coord
   * @return {[number, number] | null} Coordinates or [NaN, NaN]
  */
  cellOver(x, y) {
    const c = Math.floor((x - this.renderOpts.pad) / game.renderOpts.swidth);
    const r = Math.floor((y - this.renderOpts.pad - this.renderOpts.takenh) / game.renderOpts.sheight);
    return (c < 0 || c >= game.renderOpts.cols || r < 0 || r > game.renderOpts.rows) ? sketch.posNull : [r, c];
  },

  /** Attempt to save game data */
  save() {
    let d = game.data.flat().join('');
    let m = game.moved.flat().join('');
    socket._.emit('req-save', { d, m, t: game.taken });
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