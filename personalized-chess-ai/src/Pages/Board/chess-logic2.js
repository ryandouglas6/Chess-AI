import { Chess } from 'chess.js';

let stockfish = null;

const initializeStockfish = () => {
    if (!stockfish) {
        stockfish = new Worker('/stockfish.js');
    }
    stockfish.postMessage('uci');
    stockfish.postMessage('setoption name Skill Level value 10');
    stockfish.postMessage('isready');
};

export const findBestMove = (game) => {
    return new Promise((resolve) => {
        if (!stockfish) {
            initializeStockfish();
        }

        const handleMessage = (e) => {
            const message = e.data;
            
            // Look for "bestmove" in Stockfish output
            if (message.startsWith('bestmove')) {
                const moveStr = message.split(' ')[1];
                stockfish.removeEventListener('message', handleMessage);
                
                // Convert UCI move format to chess.js move object
                const from = moveStr.slice(0, 2);
                const to = moveStr.slice(2, 4);
                const promotion = moveStr.length > 4 ? moveStr[4] : undefined;
                
                resolve({ from, to, promotion });
            }
        };

        stockfish.addEventListener('message', handleMessage);

        // Set position and start searching
        stockfish.postMessage('position fen ' + game.fen());
        stockfish.postMessage('go movetime 1000'); // Search for 1 second
    });
};

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

// Cleanup function to terminate Stockfish when needed
export const cleanup = () => {
    if (stockfish) {
        stockfish.postMessage('quit');
        stockfish = null;
    }
};
