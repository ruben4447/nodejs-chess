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
  let isAdmin = false;

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
   * @return {null | number[]} Null if invalid, or array of indexes that are valid to move to 
   */
  const getMoves = (row, col) => {
    if (isAdmin) {
      const spots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          spots.push([r, c]);
        }
      }
      return spots;
    }

    const src_piece = getAt(row, col);
    if (typeof src_piece != 'string') return null;
    const src_colour = getPieceColour(src_piece);
    const validSpots = [];

    /** Attempt to insert new position to validSpots */
    //here != pieces.empty && src_col == getPieceColour(here)
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
      addPos(...pos);
      if (!has_moved && getAt(...pos) == pieces.empty) addPos(row + 2 * dir, col); // Can move two ahead if not moved

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
      checkAfter = true;
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
    } else {
      return null;
    }

    return validSpots;
  };

  /**
   * Is this move a valid mvoe?
   * @param {[number, number]} src - Source position
   * @param {[number, number]} dst - Destination position
   * @return {boolean}
   */
  const isValidMove = (src, dst) => {
    if (isAdmin) return true;
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

  return {
    getAt, rows, cols, getMoves, isValidMove, lbl, hasMoved, replace,
    getData: () => data.flat().join(''),
    getMoved: () => moved.flat().join(''),
    admin: bool => isAdmin = !!bool,
  };
}

if (typeof module !== 'undefined' && module.exports) {
  const loadPieces = _pieces => typeof pieces == "undefined" && (pieces = _pieces);
  module.exports = { loadPieces, getPieceColour, isPieceA, chessBoard, dataToArray, getPieceName };
}