import { Chess } from 'chess.js';

// Function to get a random item from an array
const getRandomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Main function to find a random legal move
export const findBestMove = (game) => {
  const moves = game.moves({ verbose: true });
  if (moves.length === 0) return null;
  
  const randomMove = getRandomItem(moves);
  return {
    from: randomMove.from,
    to: randomMove.to,
    promotion: randomMove.promotion
  };
};

// Helper function to make a random move directly
export const makeRandomMove = (game) => {
  const moves = game.moves();
  if (moves.length === 0) return null;
  
  const move = getRandomItem(moves);
  return move;
};

// Utility functions
export const createChessInstance = () => new Chess();

export const isGameOver = (game) => {
  return game.isGameOver() || game.isDraw();
};

export const getGameOverReason = (game) => {
  if (game.isCheckmate()) return 'Checkmate';
  if (game.isDraw()) return 'Draw';
  if (game.isStalemate()) return 'Stalemate';
  if (game.isThreefoldRepetition()) return 'Threefold Repetition';
  if (game.isInsufficientMaterial()) return 'Insufficient Material';
  return 'Unknown';
};

export const makeMove = (game, move) => {
  return game.move(move);
};

export const loadFen = (game, fen) => {
  try {
    return game.load(fen);
  } catch (error) {
    console.error("Error loading FEN:", error);
    return false;
  }
};