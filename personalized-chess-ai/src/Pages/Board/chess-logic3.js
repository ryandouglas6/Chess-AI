// Using dynamic import for Stockfish
let stockfish = null;
let engineReady = false;

export async function initializeEngine() {
    if (stockfish) {
        stockfish.terminate();
    }
    try {
        // Load Stockfish from the public folder
        stockfish = new Worker('/stockfish/stockfish.js');
        
        stockfish.onmessage = (event) => {
            const line = event.data;
            if (line === 'uciok') {
                engineReady = true;
                // Configure Stockfish for ~1500 ELO rating
                stockfish.postMessage('setoption name Skill Level value 10');
                stockfish.postMessage('setoption name UCI_LimitStrength value true');
                stockfish.postMessage('setoption name UCI_Elo value 1500');
                stockfish.postMessage('isready');
            }
        };
        
        stockfish.postMessage('uci');
    } catch (error) {
        console.error('Error initializing Stockfish:', error);
    }
}

export function getBestMove(fen, callback) {
    if (!stockfish) {
        initializeEngine();
    }

    const listener = (e) => {
        const line = e.data;
        if (line.startsWith('bestmove')) {
            const move = line.split(' ')[1];
            stockfish.removeEventListener('message', listener);
            callback(move);
        }
    };

    stockfish.addEventListener('message', listener);
    stockfish.postMessage('position fen ' + fen);
    stockfish.postMessage('go movetime 2000'); // 2 seconds think time
}

export function stopEngine() {
    if (stockfish) {
        stockfish.postMessage('quit');
        stockfish.terminate();
        stockfish = null;
        engineReady = false;
    }
}

// Function to evaluate position (returns score in centipawns)
export function evaluatePosition(fen, callback) {
    if (!stockfish) {
        initializeEngine();
    }

    const listener = (e) => {
        const line = e.data;
        if (line.includes('score cp')) {
            const score = parseInt(line.split('score cp ')[1].split(' ')[0]);
            stockfish.removeEventListener('message', listener);
            callback(score);
        }
    };

    stockfish.addEventListener('message', listener);
    stockfish.postMessage('position fen ' + fen);
    stockfish.postMessage('go depth 10');
}

// Function to match the interface expected by BoardPage.jsx
export function findBestMove(chess) {
    return new Promise((resolve) => {
        getBestMove(chess.fen(), (move) => {
            resolve(move);
        });
    });
}

// Clean up when component unmounts
export function cleanup() {
    stopEngine();
}