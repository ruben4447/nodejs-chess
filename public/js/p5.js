let sketch = {
  indexOver: -1,
  indexSelected: -1,

  rerender: false, // Render the board?
};

function setup() {
  let p5_canvas = createCanvas(game.renderOpts.swidth * game.renderOpts.cols, game.renderOpts.sheight * game.renderOpts.rows);
  p5_canvas.parent(dom.div_canvas_wrapper);
  dom.canvas = p5_canvas.elt;
  sketch._ = p5_canvas;
}

function draw() {
  if (sketch.rerender) {
    strokeWeight(1);
    textSize(50);
    textAlign(CENTER);

    let index = 0, isWhite = game.renderOpts.start_white;
    for (let y = 0; y < game.renderOpts.cols; y++) {
      const py = y * game.renderOpts.sheight;
      for (let x = 0; x < game.renderOpts.rows; x++) {
        const px = x * game.renderOpts.swidth;

        stroke(255);
        if (index === sketch.indexSelected) {
          fill(...game.renderOpts.col_s);
        } else if (index === sketch.indexOver) {
          fill(...game.renderOpts.col_o);
        } else {
          fill(...game.renderOpts['col_' + (isWhite ? 'w' : 'b')]);
        }
        rect(px, py, game.renderOpts.swidth, game.renderOpts.sheight);

        fill(0);
        let colour = game.renderOpts['col_' + game.pieceColour(game.data[index])]
        stroke(...colour);
        // stroke(...game.renderOpts['col_' + (isWhite ? 'white' : 'black')]);
        // noFill();
        text(game.data[index], px + game.renderOpts.swidth / 2, py + game.renderOpts.sheight / 1.5);

        index++;
        isWhite ^= 1;
      }
      isWhite ^= 1;
    }

    game.rerender = false;
  }
}

function mouseMoved() {
  if (game.data) {
    const cellOver = game.cellOver(mouseX, mouseY);
    if (sketch.indexOver !== cellOver) {
      sketch.indexOver = cellOver;
      sketch.rerender = true;
    }
  }
}

function mouseClicked() {
  if (game.data) {
    const cellOn = game.cellOver(mouseX, mouseY);
    if (sketch.indexSelected !== cellOn) {
      sketch.indexSelected = cellOn;
      sketch.rerender = true;
    }
  }
}