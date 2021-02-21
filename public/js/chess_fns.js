/**
 * Get piece colour from piece
 * @param {string} piece
 * @return {"w" | "b" | null}
 */
const getPieceColour = piece => {
  if (pieces.w.all.indexOf(piece) !== -1) return 'w';
  if (pieces.b.all.indexOf(piece) !== -1) return 'b';
  return null;
};

/**
 * Return full colour name for letter
 * @param {"w" | "b"} col - Abbreviated colour
 * @return {"white" | "black"} Colour name
 */
const colStr = col => col == 'w' ? 'white' : 'black';

/**
 * Get piece's name
 * @param {string} piece
 * @return {null | string} piece's name
 */
const getPieceName = piece => {
  for (let type of ["pawn", "rook", "knight", "bishop", "queen", "king"]) {
    if (isPieceA(piece, type)) return type;
  }
  return null;
};

/**
 * Is given string a chess piece?
 * @param {string} piece 
 * @return {boolean}
 */
const isPiece = piece => pieces.w.all.indexOf(piece) !== -1 || pieces.b.all.indexOf(piece) !== -1;

/**
 * Is given chess piece a <type> ?
 * @param {string} piece
 * @param {string} type
 */
const isPieceA = (piece, type) => piece == pieces.w[type] || piece == pieces.b[type];

/**
 * 1-d data string to 2-d array
 * @param {string} data
 * @param {number} cols - Column in data
 * @return {string[][]}
 */
const dataToArray = (data, cols) => {
  const rows = Math.floor(data.length / cols);
  let array = [];
  for (let i = 0, r = 0; r < rows; r++) {
    array[r] = [];
    for (let c = 0; c < cols; c++, i++) {
      array[r][c] = data[i];
    }
  }
  return array;
};

/**
 * Define a chess board, with various utility functions
 * @param {string[][]} data - Chess board data (2d array)
 * @param {number[][]} moved - Moved data for {data}
 * @return {object}
 */
function chessBoard(data, moved) {
  const rows = data.length;
  const cols = data[0].length;

  /**
   * Get item at [row, col]
   * @param {number} row - Row
   * @param {number} col - Column
   * @return {string | null} Return item, or null if invalid position 
   */
  const getAt = (row, col) => {
    if (data[row] != undefined && data[row][col] != undefined) return data[row][col];
    return null;
  };

  /**
   * Has piece at given position moved?
   * @param {number} row
   * @param {number} col
   * @return {boolean | null}
   */
  const hasMoved = (row, col) => {
    if (getAt(row, col)) return !!+moved[row][col];
    return null;
  };

  /**
   * Traverse the same column that {pos} is in
   * @param {number} row - Current row
   * @param {number} col - Current column
   * @return {number[][]} [[row, col], ...]
   */
  const traverseCol = (row, col) => {
    let piece = getAt(row, col);
    if (piece == null) return [];

    const arr = [];
    let colour = getPieceColour(piece);

    // Backward
    for (let r = row - 1; r >= 0; r--) {
      if (data[r][col] != pieces.empty) {
        if (colour != getPieceColour(data[r][col])) arr.push([r, col]);
        break;
      }
      arr.push([r, col]);
    }

    // Forward
    for (let r = row + 1; r < rows; r++) {
      if (data[r][col] != pieces.empty) {
        if (colour != getPieceColour(data[r][col])) arr.push([r, col]);
        break;
      }
      arr.push([r, col]);
    }

    return arr;
  };

  /**
   * Traverse the same row that {pos} is in
   * @param {number} row - Current row
   * @param {number} col - Current column
   * @return {number[][]} [[row, col], ...]
   */
  const traverseRow = (row, col) => {
    let piece = getAt(row, col);
    if (piece == null) return [];

    const arr = [];
    let colour = getPieceColour(piece);

    // Backward
    for (let c = col - 1; col >= 0; c--) {
      if (data[row][c] != pieces.empty) {
        if (colour != getPieceColour(data[row][c])) arr.push([row, c]);
        break;
      }
      arr.push([row, c]);
    }

    // Forward
    for (let c = col + 1; c < cols; c++) {
      if (data[row][c] != pieces.empty) {
        if (colour != getPieceColour(data[row][c])) arr.push([row, c]);
        break;
      }
      arr.push([row, c]);
    }

    return arr;
  };

  /**
   * Traverse the diagonals originating from {pos}
   * @param {number} row - Current row
   * @param {number} col - Current column
   * @return {number[]} Indexes
   */
  const traverseDiagonals = (row, col) => {
    let piece = getAt(row, col);
    if (piece == null) return [];

    const arr = [];
    let colour = getPieceColour(piece);

    // pos to top-left
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0; r--, c--) {
      if (data[r][c] != pieces.empty) {
        if (colour != getPieceColour(data[r][c])) arr.push([r, c]);
        break;
      }
      arr.push([r, c]);
    }

    // pos to top-right
    for (let r = row - 1, c = col + 1; r >= 0 && c < cols; r--, c++) {
      if (data[r][c] != pieces.empty) {
        if (colour != getPieceColour(data[r][c])) arr.push([r, c]);
        break;
      }
      arr.push([r, c]);
    }

    // pos to bottom-left
    for (let r = row + 1, c = col - 1; r < rows && c >= 0; r++, c--) {
      if (data[r][c] != pieces.empty) {
        if (colour != getPieceColour(data[r][c])) arr.push([r, c]);
        break;
      }
      arr.push([r, c]);
    }

    // pos to bottom-right
    for (let r = row + 1, c = col + 1; r < rows && c < cols; r++, c++) {
      if (data[r][c] != pieces.empty) {
        if (colour != getPieceColour(data[r][c])) arr.push([r, c]);
        break;
      }
      arr.push([r, c]);
    }

    return arr;
  };

  /**
   * Get valid positions for a certain piece
   * @param {number} row - Current row
   * @param {number} col - Current colum
   * @return {null | number[]} Null if invalid, or array of [row, col] that are valid to move to
   */
  const getMoves = (row, col) => {
    const src_piece = getAt(row, col);
    if (typeof src_piece != 'string') return null;
    const src_colour = getPieceColour(src_piece);
    const validSpots = [];

    /** Attempt to insert new position to validSpots */
    const addPos = (row, col) => {
      const p = getAt(row, col);
      if (p == null || (p != pieces.empty && src_colour == getPieceColour(p))) return false;
      validSpots.push([row, col]);
      return true;
    };

    if (isPieceA(src_piece, 'pawn')) {
      const has_moved = +moved[row][col];
      const dir = src_colour == 'b' ? 1 : -1;

      let pos = [row + dir, col];
      if (getAt(...pos) == pieces.empty) {
        validSpots.push(pos);
        if (!has_moved) addPos(row + 2 * dir, col); // Can move two ahead if not moved
      }

      // Move diagonally is can take piece
      // addPos(...) will check for colour confliction :P
      pos = [row + dir, col - 1];
      if (getAt(...pos) != pieces.empty) addPos(...pos);
      pos[1] += 2;
      if (getAt(...pos) != pieces.empty) addPos(...pos);
    } else if (isPieceA(src_piece, 'rook')) {
      validSpots.push(...traverseCol(row, col));
      validSpots.push(...traverseRow(row, col));
    } else if (isPieceA(src_piece, 'knight')) {
      addPos(row - 2, col - 1);
      addPos(row - 2, col + 1);
      addPos(row - 1, col - 2);
      addPos(row + 1, col - 2);
      addPos(row - 1, col + 2);
      addPos(row + 1, col + 2);
      addPos(row + 2, col - 1);
      addPos(row + 2, col + 1);
    } else if (isPieceA(src_piece, 'bishop')) {
      validSpots.push(...traverseDiagonals(row, col));
    } else if (isPieceA(src_piece, 'queen')) {
      validSpots.push(...traverseCol(row, col));
      validSpots.push(...traverseRow(row, col));
      validSpots.push(...traverseDiagonals(row, col));
    } else if (isPieceA(src_piece, 'king')) {
      addPos(row, col + 1);
      addPos(row, col - 1);
      addPos(row + 1, col);
      addPos(row - 1, col);

      // Can he castle?
      if (moved[row][col] == "0") {
        let column = 0;
        if (moved[row][column] == "0") {
          let mov = true;
          for (let c = col - 1; c > 0; c--) {
            if (data[row][c] != pieces.empty) {
              mov = false;
              break;
            }
          }
          if (mov) validSpots.push([row, column]);
        }
        column = cols - 1;
        if (moved[row][column] == "0") {
          let mov = true;
          for (let c = col + 1; c < column; c++) {
            if (data[row][c] != pieces.empty) {
              mov = false;
              break;
            }
          }
          if (mov) validSpots.push([row, column]);
        }
      }
    } else {
      return null;
    }

    return validSpots;
  };

  /**
   * Get array of ALL moves
   * - Executes getMoves(r, c) on every piece
   * @param {"w" | "b"} colour
   * @return {{ src: number[], dst: number[] }[]}
   */
  const getAllMoves = colour => {
    let allMoves = [], moves, src;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (data[r][c] != pieces.empty && getPieceColour(data[r][c]) == colour) {
          moves = getMoves(r, c);
          if (moves != null) {
            src = [r, c];
            for (let move of moves) {
              allMoves.push({ src, dst: move });
            }
          }
        }
      }
    }
    return allMoves;
  };

  /**
   * Is this move a valid mvoe?
   * @param {[number, number]} src - Source position
   * @param {[number, number]} dst - Destination position
   * @return {boolean}
   */
  const isValidMove = (src, dst) => {
    let validSpots = getMoves(...src);
    for (let validSpot of validSpots) {
      if (validSpot[0] == dst[0] && validSpot[1] == dst[1]) return true;
    }
    return false;
  };

  /**
 * Given numerical row, col, convert to fancy label e.g. [7, 0] -> "A0"
 * @param {number} row
 * @param {number} col
 * @return {string}
 */
  const lbl = (row, col) => String.fromCharCode(65 + col) + (rows - row).toString();

  /**
   * Replace piece in pos {row, col} with new piece
   * @param {number} row
   * @param {number} col
   * @param {string} piece
   */
  const replace = (row, col, piece) => {
    if (getAt(row, col) != null) {
      data[row][col] = piece;
      moved[row][col] = "1";
      return piece;
    } else {
      return null;
    }
  };

  /** Get piece value at position */
  const pieceValue = (r, c, colour) => getPieceValue(data[r][c], r, c, colour);

  /**
   * Evaluate board in terms of colour <colour>
   * @param {"w" | "b"} colour
   * @return {number}
   */
  const evaluate = colour => {
    let score = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        score += getPieceValue(data[r][c], r, c, colour);
    return score;
  };

  /**
   * Move src to dst (assume it was validated already)
   * @param {number[]} src - Source position
   * @param {number[]} dst - Destination position
   * @return {object}
   */
  const move = (src, dst) => {
    let returnObject = { src: { pos: src }, dst: { pos: dst }, };

    let piece_src = data[src[0]][src[1]], piece_dst = data[dst[0]][dst[1]];
    let src_colour = getPieceColour(piece_src), dst_colour = getPieceColour(piece_dst);
    returnObject.src.colour = src_colour;
    returnObject.src.piece = piece_src;
    returnObject.dst.colour = dst_colour;
    returnObject.dst.piece = piece_dst;

    let logTitle = `${colStr(src_colour)} ${getPieceName(piece_src)} from ${lbl(...src)} to ${lbl(...dst)}`;
    let logLine = `${piece_src} ${lbl(...src)} &rarr; ${lbl(...dst)}`;

    let replaceWith = pieces.empty;

    // Are we castling
    if (src_colour == dst_colour && piece_src == pieces[src_colour].king && piece_dst == pieces[dst_colour].rook && !hasMoved(...src) && !hasMoved(...dst)) {
      replaceWith = pieces[dst_colour].rook;
      logTitle += ' (castled)';
    } else {
      // ==== NORMAL MOVE

      // Taken a piece?
      if (piece_dst != pieces.empty) {
        logTitle += `, taking ${colStr(dst_colour)}'s ${getPieceName(piece_dst)}`;
        logLine += ' &#128369; ' + piece_dst;
      }

      // Won game?
      let enemy_colour = src_colour == 'w' ? 'b' : 'w';
      if (piece_dst == pieces[enemy_colour].king) {
        returnObject.winner = src_colour;
      }

      // Pawn reached end?
      if ((piece_src == pieces.w.pawn && dst[0] == 0) || (piece_src == pieces.b.pawn && dst[0] == rows - 1)) {
        let pawnInto = pieces[src_colour].pawnInto[0];
        piece_src = pawnInto;
        logTitle += `, turned into ${pawnInto}`;
        logLine += ` (${pawnInto})`;
      }
    }

    // Actually move pieces
    replace(...dst, piece_src);
    replace(...src, replaceWith);
    returnObject.log = { title: logTitle, line: logLine };

    return returnObject;
  };

  return {
    getAt, rows, cols, getMoves, getAllMoves, isValidMove, lbl, hasMoved, replace, evaluate, move,
    getPieceValue: pieceValue,
    getData: () => data.flat().join(''),
    getMoved: () => moved.flat().join(''),
    clone: () => chessBoard(data.map(a => ([...a])), moved.map(a => ([...a]))),
  };
}

/**
 * Get piece information
 * @param {string} piece 
 * @return {{ colour: string, type: string, piece: string }} Information object
 */
const getPieceInfo = piece => {
  for (const colour of 'wb') {
    for (const key in pieces[colour]) {
      if (piece == pieces[colour][key]) return { piece, colour, type: key, };
    }
  }
  return { piece, colour: undefined, type: undefined };
};

/**
 * Get value of a piece
 * @param {string} piece - Piece to get value of
 * @param {number} row - Row position of piece
 * @param {number} col - Column position of piece
 * @param {"w" | "b"} colourAs - Colour we are playing as
 * @return {number} Score
 */
const getPieceValue = (piece, row, col, colourAs = 'w') => {
  if (piece == pieces.empty) return 0;

  const info = getPieceInfo(piece);
  if (info.type && info.colour) {
    let base = piece_values.weights[info.type];
    let pos = piece_values.move[info.colour][info.type][row][col];
    let coeff = info.colour == colourAs ? 1 : -1; // 1 for if our piece, -1 if enemy's piece
    return coeff * (base + pos);
  } else {
    return NaN;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  const loadPieces = _pieces => typeof pieces == "undefined" && (pieces = _pieces);
  module.exports = { loadPieces, getPieceColour, colStr, isPiece, isPieceA, chessBoard, dataToArray, getPieceName, getPieceValue, getPieceInfo };
}