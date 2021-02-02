const game = {
  _ppl: undefined, // How many people are connected to the game?
  _spectators: undefined, // How many spectators are connected to the game?
  _name: undefined, // Game name
  _singleplayer: undefined, // Is this singleplayer (true) or not
  _first: undefined, // First player to join game?

  renderOpts: {
    swidth: 100,
    sheight: 100,
    rows: 8,
    cols: 8,
    start_white: true, // Start with white square?
    col_w: [118, 127, 144], // White
    col_b: [43, 49, 61], // Black
    col_o: [115, 144, 83], // Colour when cell is hovered over
    col_s: [115, 83, 144], // Colour when cell is selected
  },
  pieces: undefined, // Object of piece data (contents of /data/pieces.json)

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

  data: undefined,

  /** Get vertical index from row, col */
  getVertIndex(r, c) { return (r * this.renderOpts.cols) + c; },

  /**
   * Return colour of piece
   * @param {string} piece
   * @return {"w" | "b"} White or black?
  */
  pieceColour(piece) {
    return Object.values(this.pieces.w).indexOf(piece) === -1 ? 'b' : 'w';
  },

  /**
   * Given mouse coords, retern vertical index of position over or -1
   * @param {number} x - x coord
   * @param {number} y - y coord
   * @return {number} Vertical index (-1 is invalid)
  */
  cellOver(x, y) {
    const c = Math.floor(x / game.renderOpts.swidth);
    const r = Math.floor(y / game.renderOpts.sheight);
    return (c < 0 || c >= game.renderOpts.cols || r < 0 || r > game.renderOpts.rows) ? -1 : game.getVertIndex(r, c);
  },
};