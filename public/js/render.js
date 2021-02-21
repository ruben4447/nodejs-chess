let render = {
  opts: {
    swidth: 85, // Width of cell
    sheight: 85, // Height of cell
    psize: 43, // Font size of pieces
    col_w: [118, 127, 144], // White stroke
    fill_w: 51, // White fill
    col_b: [53, 59, 71], // Black stroke
    fill_b: 12, // Black fill
    col_o: [115, 144, 83], // Colour when cell is hovered over
    col_s: [115, 83, 144], // Colour when cell is selected
    col_h: [52, 207, 46], // Colour when cell is highlighted
    lblsize: 17, // Font size of labels
    pad: 30,
    takenw: 40, // Width of "taken" section
    taken_size: 30, // Font size of taken pieces
    dev: true, // Render developer stuff
    giveup_size: 22,
  },

  ctx: undefined,
  posNull: [-1, -1],
  over: undefined,
  selected: undefined,
  highlighted: [], // Array of highlighted indexes
  /**
   * Location of give-up "button"
   * - [x, y]
   * @type {number[]} */
  giveupLocation: undefined,
  giveupd: 11,
};

/**
 * Init function for canvas
 */
render.init = function () {
  let pad = this.opts.pad * 2;
  this.canvas = dom.canvas;
  this.canvas.width = this.opts.swidth * game.cols + pad + 2 * this.opts.takenw;
  this.canvas.height = this.opts.sheight * game.rows + pad;
  this.ctx = this.canvas.getContext('2d');

  this.over = this.posNull;
  this.selected = this.posNull;
  this.giveupLocation = this.posNull;

  this.canvas.addEventListener('mousemove', (e) => render.onMouseMove(...getPosFromEvent(e)));
  this.canvas.addEventListener('mouseup', (e) => render.onMouseDown(...getPosFromEvent(e)));
};

/**
 * Change font size of canvas
 * @param {number} size - New font size
 */
render.setFontSize = function (size) {
  this.ctx.font = setFontSize(this.ctx.font, size);
};

/**
 * Render board as-is to canvas
 */
render.render = function () {
  this.giveupLocation = this.posNull;

  this.ctx.fillStyle = rgb(230);
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  this.ctx.textAlign = 'center';

  let isWhite = 1;
  for (let y = 0; y < game.cols; y++) {
    const py = y * this.opts.sheight + this.opts.pad;

    // Y label
    this.ctx.fillStyle = rgb(51);
    this.setFontSize(this.opts.lblsize);
    this.ctx.fillText(game.rows - y, this.opts.takenw + this.opts.pad / 2, py + this.opts.sheight / 2);

    for (let x = 0; x < game.rows; x++) {
      const px = x * this.opts.swidth + this.opts.pad + this.opts.takenw;

      // X Labels
      if (y === 0) {
        this.ctx.fillStyle = rgb(51);
        this.setFontSize(this.opts.lblsize);
        this.ctx.fillText(String.fromCharCode(65 + x), px + this.opts.swidth / 2, this.opts.pad / 1.5);
      }

      if (render.selected[0] == y && render.selected[1] == x) {
        this.ctx.fillStyle = rgb(...this.opts.col_s);
      } else if (render.over[0] == y && render.over[1] == x) {
        this.ctx.fillStyle = rgb(...this.opts.col_o);
      } else {
        let highlighted = false;
        for (let h of render.highlighted) {
          if (h[0] == y && h[1] == x) {
            highlighted = true;
            break;
          }
        }
        if (highlighted) {
          this.ctx.fillStyle = rgb(...this.opts.col_h);
        } else {
          this.ctx.fillStyle = rgb(...this.opts['col_' + (isWhite ? 'w' : 'b')]);
        }
      }
      let args = [px, py, this.opts.swidth, this.opts.sheight];
      this.ctx.fillRect(...args);
      this.ctx.strokeStyle = rgb(200);
      this.ctx.strokeRect(...args);

      let piece = game.board.getAt(y, x);
      if (isPiece(piece)) {
        let c = getPieceColour(piece);
        this.ctx.fillStyle = rgb(this.opts['fill_' + c]);
        this.ctx.strokeStyle = rgb(...this.opts['col_' + c]);
        this.setFontSize(this.opts.psize);
        let args = [piece, px + this.opts.swidth / 2, py + this.opts.sheight / 1.7];
        this.ctx.strokeText(...args);
        this.ctx.fillText(...args);

        // forfeit option for king
        if (game._winner == "" && (game._me == '*' || game._me == c) && c == game._go && piece == pieces[c].king) {
          this.giveupLocation = [px + this.opts.swidth / 1.9, py + this.opts.sheight / 1.15];
          this.ctx.fillStyle = rgb(250, 20, 30);
          this.setFontSize(this.opts.giveup_size);
          this.ctx.fillText('🗡', ...this.giveupLocation);
          this.giveupLocation[1] -= 6;

          this.ctx.beginPath();
          this.ctx.arc(...this.giveupLocation, this.giveupd, 0, 2 * Math.PI);
          this.ctx.strokeStyle = rgb(250, 20, 30);
          this.ctx.lineWidth = 0.8;
          this.ctx.stroke();
        }
      }

      if (this.opts.dev) {
        // Show index
        this.setFontSize(11);
        this.ctx.fillStyle = rgb(255, 255, 0);
        this.ctx.fillText(`r${y} c${x}`, px + 15, py + 10);

        // Has this piece moved?
        let r = 4;
        this.ctx.beginPath();
        this.ctx.fillStyle = game.board.hasMoved(y, x) ? rgb(20, 210, 20) : rgb(220, 20, 20);
        this.ctx.arc(px + this.opts.swidth - r * 1.5, py + r * 1.4, r, 0, 2 * Math.PI);
        this.ctx.fill();
      }

      isWhite ^= 1;
    }
    isWhite ^= 1;
  }

  // Render taken pieces
  this.setFontSize(this.opts.taken_size);
  const taken = { w: "", b: "" };
  for (let p of game.taken) {
    taken[getPieceColour(p)] += p;
  }

  if (taken.b.length > 0) {
    this.ctx.strokeStyle = rgb(...this.opts.col_b);
    this.ctx.fillStyle = rgb(this.opts.fill_b);
    let inc = (canvas.height - 2 * this.opts.pad) / (taken.b.length + 1);
    let x = this.opts.takenw / 2, y = this.opts.pad;
    for (let piece of taken.b) {
      y += inc;
      this.ctx.fillText(piece, x, y);
    }
  }
  if (taken.w.length > 0) {
    this.ctx.strokeStyle = rgb(...this.opts.col_w);
    this.ctx.fillStyle = rgb(this.opts.fill_w);
    let inc = (canvas.height - 2 * this.opts.pad) / (taken.w.length + 1);
    let x = canvas.width - this.opts.takenw / 2, y = this.opts.pad;
    for (let piece of taken.w) {
      y += inc;
      this.ctx.fillText(piece, x, y);
    }
  }
};

/**
 * Given mouse coords, return cell index [row, col] or render.posNull
 * @param {number} x - x coord
 * @param {number} y - y coord
 * @return {[number, number]} Coordinates
*/
render.cellOver = function (x, y) {
  const c = Math.floor((x - this.opts.pad - this.opts.takenw) / this.opts.swidth);
  const r = Math.floor((y - this.opts.pad) / this.opts.sheight);
  return (c < 0 || c >= game.cols || r < 0 || r > game.rows) ? this.posNull : [r, c];
};

render.onMouseMove = function (mouseX, mouseY) {
  if (game.board) {
    const array = this.cellOver(mouseX, mouseY);
    if (this.over[0] != array[0] || this.over[1] != array[1]) {
      this.over = array;
      this.render();
    }
  }
};

render.onMouseDown = function (mouseX, mouseY) {
  if (game.board && game._winner == "") {
    if (mouseX >= this.giveupLocation[0] - this.giveupd && mouseX <= this.giveupLocation[0] + this.giveupd && mouseY >= this.giveupLocation[1] - this.giveupd && mouseY <= this.giveupLocation[1] + this.giveupd) {
      game.giveUp();
    }

    // If a cell is not selected
    else if (this.selected == this.posNull) {
      const cellOn = this.cellOver(mouseX, mouseY);
      // Only move if (1) new piece and (2) the piece's go and (3) we can move that piece
      let pcol = getPieceColour(game.board.getAt(...cellOn));
      if ((this.selected[0] != cellOn[0] || this.selected[1] != cellOn[1]) && pcol === game._go && (game._me == '*' || pcol == game._me)) {
        this.selected = cellOn;

        // Find possible moves
        let spots = game.board.getMoves(...cellOn);
        if (spots) this.highlighted = spots;
        this.render();
      }
    } else {
      const cellOn = this.cellOver(mouseX, mouseY);
      if (cellOn != this.posNull && !(this.selected[0] == cellOn[0] && this.selected[1] == cellOn[1])) {
        socket._.emit('req-move', {
          src: this.selected,
          dst: cellOn,
        });
      }
      this.selected = this.posNull;
      this.highlighted.length = 0;
      this.render();
    }
  }
};