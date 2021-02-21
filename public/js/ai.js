const AI = {
  maxDepth: 2,
  _minimaxMovesScanned: 0,

  /** 
   * Get simple move - Chooses move with highest take value
   * @param {"w" | "b"} colour - Colour we are playing as
   * @return {{ src: number[], dst: number[] }}
  */
  getBestMove(board, colour = 'w') {
    // Get all moves
    const allMoves = board.getAllMoves(colour);
    let bestMove = { val: Infinity };

    // Find move with greatest "take" value
    for (let move of allMoves) {
      let value = board.getPieceValue(...move.dst, colour);
      // console.log(`${move.src} to ${move.dst} = ${value}`);
      if (value < bestMove.val) { // We want the WORST score, as this means the greatest loss on !colour side
        bestMove.src = move.src;
        bestMove.dst = move.dst;
        bestMove.val = value;
      }
    }

    return bestMove;
  },

  getComplex(colour = 'w') {
    this._minimaxMovesScanned = 0;
    return this.minimax(colour, 0, game.board);
  },

  minimax(colour, depth, board) {
    if (depth >= this.maxDepth) return board.evaluate(colour);
    this._minimaxMovesScanned++;

    let allMoves = board.getAllMoves(colour);
    for (let move of allMoves) {
      let newBoard = board.clone();
      // newBoard.replace(move.);
      this.minimax();
    }
  },

  /**
   * Actually make a mov
   * @param {{ src: number[], dst: number[] }} obj - Move object
   */
  move(obj) {
    if (obj.src && obj.dst) {
      socket._.emit('req-move', { src: obj.src, dst: obj.dst, ai: true, });
    } else {
      socket._.emit('rebound', ['_alert', 'AI cannot move: no valid moves left']);
    }
  },
};

const generate_ai_options_dialog = () => {
  const WRAPPER_ID = 'ai-options-wrapper';
  const DELAY_MIN = 0, DELAY_MAX = 10000, DELAY_ID = 'ai-options--delay';
  const COLOUR_ID = 'ai-options--colour';
  return {
    title: 'Configure AI',
    message: `<table id='${WRAPPER_ID}'>
      <tr><th><abbr title='Which colour should the AI play for?'>Colour</abbr></th><td><select class='bootbox-input bootbox-input-select form-control' id='${COLOUR_ID}'><option value='${game.aiColour}'>Current (${game.aiColour})</option ><option value='b'>Black</option><option value='w'>White</option><option value='*'>Both (AI vs AI)</option></select ></td ></tr >
      <tr><th><abbr title='Delay (ms) before AI responds'>Delay</abbr></th><td><input class='bootbox-input form-control bootbox-input-number' id='${DELAY_ID}' type='number' min='${DELAY_MIN}' max='${DELAY_MAX}' value='${game.aiPlayDelay}' /></td></tr>
      </table > `,
    buttons: {
      cancel: { label: 'Close', className: 'btn btn-secondary' },
      save: {
        label: 'Save Options',
        className: 'btn btn-success',
        callback: () => {
          const delay = +document.querySelector(`#${WRAPPER_ID} #${DELAY_ID} `).value;
          if (isNaN(delay) || delay < DELAY_MIN || delay > DELAY_MAX) return bootbox.alert(`Invalid delay value.Must satisfy ${DELAY_MIN} < t < ${DELAY_MAX}`) && false;

          const colour = document.querySelector(`#${WRAPPER_ID} #${COLOUR_ID} `).value;

          game.aiPlayDelay = delay;
          game.aiColour = colour;
        }
      }
    }
  };
};