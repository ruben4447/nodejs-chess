/**
 * Populate file "data/piece_values.json"
 * - Info from https://js.plainenglish.io/build-a-simple-chess-ai-in-javascript-22b350abb31
 */

const fs = require("fs");

/** Duplicate given array and return reversed */
const array_reverse = array => array.slice().reverse();

// Get pieces values
const piece_weights = {
  king: 60000,
  king_endgame: 60000,
  queen: 929,
  rook: 479,
  bishop: 320,
  knight: 280,
  pawn: 100,
};

// Position matrix for WHITE
const mov_matrix_w = {
  pawn: [
    [100, 100, 100, 100, 105, 100, 100, 100],
    [78, 83, 86, 73, 102, 82, 85, 90],
    [7, 29, 21, 44, 40, 31, 44, 7],
    [-17, 16, -2, 15, 14, 0, 15, -13],
    [-26, 3, 10, 9, 6, 1, 0, -23],
    [-22, 9, 5, -11, -10, -2, 3, -19],
    [-31, 8, -7, -37, -36, -14, 3, -31],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ],
  knight: [
    [-66, -53, -75, -75, -10, -55, -58, -70],
    [-3, -6, 100, -36, 4, 62, -4, -14],
    [10, 67, 1, 74, 73, 27, 62, -2],
    [24, 24, 45, 37, 33, 41, 25, 17],
    [-1, 5, 31, 21, 22, 35, 2, 0],
    [-18, 10, 13, 22, 18, 15, 11, -14],
    [-23, -15, 2, 0, 2, 0, -23, -20],
    [-74, -23, -26, -24, -19, -35, -22, -69]
  ],
  bishop: [
    [-59, -78, -82, -76, -23, -107, -37, -50],
    [-11, 20, 35, -42, -39, 31, 2, -22],
    [-9, 39, -32, 41, 52, -10, 28, -14],
    [25, 17, 20, 34, 26, 25, 15, 10],
    [13, 10, 17, 23, 17, 16, 0, 7],
    [14, 25, 24, 15, 8, 25, 20, 15],
    [19, 20, 11, 6, 7, 6, 20, 16],
    [-7, 2, -15, -12, -14, -15, -10, -10]
  ],
  rook: [
    [35, 29, 33, 4, 37, 33, 56, 50],
    [55, 29, 56, 67, 55, 62, 34, 60],
    [19, 35, 28, 33, 45, 27, 25, 15],
    [0, 5, 16, 13, 18, -4, -9, -6],
    [-28, -35, -16, -21, -13, -29, -46, -30],
    [-42, -28, -42, -25, -25, -35, -26, -46],
    [-53, -38, -31, -26, -29, -43, -44, -53],
    [-30, -24, -18, 5, -2, -18, -31, -32]
  ],
  queen: [
    [6, 1, -8, -104, 69, 24, 88, 26],
    [14, 32, 60, -10, 20, 76, 57, 24],
    [-2, 43, 32, 60, 72, 63, 43, 2],
    [1, -16, 22, 17, 25, 20, -13, -6],
    [-14, -15, -2, -5, -1, -10, -20, -22],
    [-30, -6, -13, -11, -16, -11, -16, -27],
    [-36, -18, 0, -19, -15, -15, -21, -38],
    [-39, -30, -31, -13, -31, -36, -34, -42]
  ],
  king: [
    [4, 54, 47, -99, -99, 60, 83, -62],
    [-32, 10, 55, 56, 56, 55, 10, 3],
    [-62, 12, -57, 44, -67, 28, 37, -31],
    [-55, 50, 11, -4, -19, 13, 0, -49],
    [-55, -43, -52, -28, -51, -47, -8, -50],
    [-47, -42, -43, -79, -64, -32, -29, -32],
    [-4, 3, -14, -50, -57, -18, 13, 4],
    [17, 30, -3, -14, 6, -1, 40, 18]
  ],
  king_endgame: [
    [-50, -40, -30, -20, -20, -30, -40, -50],
    [-30, -20, -10, 0, 0, -10, -20, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 30, 40, 40, 30, -10, -30],
    [-30, -10, 20, 30, 30, 20, -10, -30],
    [-30, -30, 0, 0, 0, 0, -30, -30],
    [-50, -30, -30, -30, -30, -30, -30, -50]
  ]
};

// Position matrix for BLACK
const mov_matrix_b = {};
for (let key in mov_matrix_w) {
  if (mov_matrix_w.hasOwnProperty(key)) {
    mov_matrix_b[key] = array_reverse(mov_matrix_w[key]);
  }
}

// Assemble into one object
const object = {
  weights: piece_weights,
  move: {
    w: mov_matrix_w,
    b: mov_matrix_b,
  },
};

// Serialise
const json = JSON.stringify(object);

const PATH = "data/piece_values.json";
fs.writeFileSync(PATH, json);
console.log(`Written JSON to file '${PATH}'`);