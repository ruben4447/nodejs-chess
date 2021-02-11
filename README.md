# Chess

Chess application made in node.js

This is a remake of a vanilla javascript/PHP version I made a few months ago

N.B. This game does not have users or accounts.

## Games
A new game may be created by anyone. (no info is stored about who created the game)
When a game is created, a password may be set.
Anyone may join a game, given they provided the correct password.
The first person to join a game isknown as the "host" and has control over the game, such as undo, reset and deletion.

## Features
- Singleplayer (single computer) or Multiplayer (two computer) game options
- Spectators (unlimited clients may watch a match)
- Basic move validation
  - Supports castling
  - No check/checkmate validation (i.e. may move into check)
- Game history (undo moves)
