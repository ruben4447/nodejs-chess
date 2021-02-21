/**
 * Generate data for "data/pieces.json"
*/
const fs = require("fs");

const pieces_w = {
  king: "\u2654",
  queen: "\u2655",
  rook: "\u2656",
  bishop: "\u2657",
  knight: "\u2658",
  pawn: "\u2659",
};

const pieces_b = {
  king: "\u265A",
  queen: "\u265B",
  rook: "\u265C",
  bishop: "\u265D",
  knight: "\u265E",
  pawn: "\u265F",
};

const object = {
  w: pieces_w,
  b: pieces_b,
  empty: ' ',
};

object.w.all = Object.values(object.w);
object.b.all = Object.values(object.b);

// What options can the pawn turn into?
// [0] -> default option
object.w.pawnInto = [object.w.queen, object.w.rook, object.w.bishop, object.w.knight];
object.b.pawnInto = [object.b.queen, object.b.rook, object.b.bishop, object.b.knight];

const json = JSON.stringify(object);
const PATH = "data/pieces.json";
fs.writeFileSync(PATH, json);
console.log(`Write JSON to file '${PATH}'`);