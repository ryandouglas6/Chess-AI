// Using dynamic import for Stockfish
let stockfish = null;
let engineReady = false;

export async function initializeEngine(botName = 'Bot 3', customElo = null) {
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
                // Configure Stockfish based on bot name or custom ELO
                let elo;
                if (customElo !== null) {
                    elo = customElo;
                } else {
                    const eloRatings = {
                        'Bot 3': 500,
                        'Bot 4': 1000,
                        'Bot 5': 1250,
                        'Bot 6': 1500,
                        'Bot 7': 1750,
                        'Bot 8': 2000,
                        'Bot 9': 2250,
                        'Bot 10': 2500
                    };
                    elo = eloRatings[botName] || 1500;
                }
                
                const skillLevel = Math.min(20, Math.floor((elo - 500) / 100)); // Scale skill level with ELO
                
                stockfish.postMessage(`setoption name Skill Level value ${skillLevel}`);
                stockfish.postMessage('setoption name UCI_LimitStrength value true');
                stockfish.postMessage(`setoption name UCI_Elo value ${elo}`);
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