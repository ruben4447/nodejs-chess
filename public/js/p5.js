let sketch = {
  posNull: [-1, -1],
  over: undefined,
  selected: undefined,
  highlighted: [], // Array of highlighted indexes
  rerender: false, // Render the board?
};

const deg90 = 90 * (Math.PI / 180);

function setup() {
  let pad = game.renderOpts.pad * 2;
  let p5_canvas = createCanvas(
    game.renderOpts.swidth * game.renderOpts.cols + pad + 2 * game.renderOpts.takenw,
    game.renderOpts.sheight * game.renderOpts.rows + pad
  );
  p5_canvas.parent(dom.div_canvas_wrapper);
  dom.canvas = p5_canvas.elt;
  sketch._ = p5_canvas;

  sketch.over = sketch.posNull;
  sketch.selected = sketch.posNull;
}

function draw() {
  if (sketch.rerender) {
    background(230);
    strokeWeight(1);
    textAlign(CENTER, CENTER);

    let isWhite = game.renderOpts.start_white;
    for (let y = 0; y < game.renderOpts.cols; y++) {
      const py = y * game.renderOpts.sheight + game.renderOpts.pad;

      // Y label
      noStroke();
      fill(51);
      textSize(game.renderOpts.lblsize);
      text(game.renderOpts.rows - y, game.renderOpts.takenw + game.renderOpts.pad / 2, py + game.renderOpts.sheight / 2);

      for (let x = 0; x < game.renderOpts.rows; x++) {
        const px = x * game.renderOpts.swidth + game.renderOpts.pad + game.renderOpts.takenw;

        // X Labels
        if (y === 0) {
          noStroke();
          fill(51);
          textSize(game.renderOpts.lblsize);
          text(String.fromCharCode(65 + x), px + game.renderOpts.swidth / 2, game.renderOpts.pad / 2);
        }

        stroke(255);
        if (sketch.selected[0] == y && sketch.selected[1] == x) {
          fill(...game.renderOpts.col_s);
        } else if (sketch.over[0] == y && sketch.over[1] == x) {
          fill(...game.renderOpts.col_o);
        } else {
          let highlighted = false;
          for (let h of sketch.highlighted) {
            if (h[0] == y && h[1] == x) {
              highlighted = true;
              break;
            }
          }
          if (highlighted) {
            fill(...game.renderOpts.col_h);
          } else {
            fill(...game.renderOpts['col_' + (isWhite ? 'w' : 'b')]);
          }
        }
        rect(px, py, game.renderOpts.swidth, game.renderOpts.sheight);

        let piece = game.board.getAt(y, x);
        if (isPiece(piece)) {
          let c = getPieceColour(piece);
          fill(game.renderOpts['fill_' + c]);
          let colour = game.renderOpts['col_' + c];
          stroke(...colour);
          textSize(game.renderOpts.psize);
          text(piece, px + game.renderOpts.swidth / 2, py + game.renderOpts.sheight / 2);
        }

        if (game.renderOpts.dev) {
          // Show index
          textSize(11);
          fill(255, 255, 0);
          noStroke();
          text(`r${y} c${x}`, px + 15, py + 10);

          // Has this piece moved?
          let r = 7;
          if (game.board.hasMoved(y, x)) fill(20, 210, 20); else fill(220, 20, 20);
          circle(px + game.renderOpts.swidth - r * 1.4, py + r * 1.4, r);
        }

        isWhite ^= 1;
      }
      isWhite ^= 1;
    }

    // Render taken pieces
    textSize(game.renderOpts.taken_size);
    const taken = { w: "", b: "" };
    for (let p of game.taken) {
      taken[getPieceColour(p)] += p;
    }

    if (taken.b.length > 0) {
      stroke(...game.renderOpts.col_b);
      fill(game.renderOpts.fill_b);
      let inc = (height - 2 * game.renderOpts.pad) / (taken.b.length + 1);
      let x = game.renderOpts.takenw / 2, y = game.renderOpts.pad;
      for (let piece of taken.b) {
        y += inc;
        text(piece, x, y);
      }
    }
    if (taken.w.length > 0) {
      stroke(...game.renderOpts.col_w);
      fill(game.renderOpts.fill_w);
      let inc = (height - 2 * game.renderOpts.pad) / (taken.w.length + 1);
      let x = width - game.renderOpts.takenw / 2, y = game.renderOpts.pad;
      for (let piece of taken.w) {
        y += inc;
        text(piece, x, y);
      }
    }

    sketch.rerender = false;
  }
}

function mouseMoved() {
  if (game.board) {
    const array = game.cellOver(mouseX, mouseY);
    if (sketch.over[0] != array[0] || sketch.over[1] != array[1]) {
      sketch.over = array;
      sketch.rerender = true;
    }
  }
}

function mouseClicked() {
  if (game.board && game._winner == "") {
    // If a cell is not selected
    if (sketch.selected == sketch.posNull) {
      const cellOn = game.cellOver(mouseX, mouseY);
      // Only move if (1) new piece and (2) the piece's go and (3) we can move that piece
      let pcol = getPieceColour(game.board.getAt(...cellOn));
      if ((sketch.selected[0] != cellOn[0] || sketch.selected[1] != cellOn[1]) && pcol === game._go && (game._me == '*' || pcol == game._me)) {
        sketch.selected = cellOn;

        // Find possible moves
        let spots = game.board.getMoves(...cellOn);
        if (spots) sketch.highlighted = spots;
        sketch.rerender = true;
      }
    } else {
      const cellOn = game.cellOver(mouseX, mouseY);
      if (cellOn != sketch.posNull && !(sketch.selected[0] == cellOn[0] && sketch.selected[1] == cellOn[1])) {
        socket._.emit('req-move', {
          src: sketch.selected,
          dst: cellOn,
        });
      }
      sketch.selected = sketch.posNull;
      sketch.highlighted.length = 0;
      sketch.rerender = true;
    }
  }
}