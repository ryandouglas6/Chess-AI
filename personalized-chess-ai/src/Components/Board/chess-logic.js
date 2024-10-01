import { Chess } from 'chess.js';

export const sicilianOpeningBook = {
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b': ['c5'],
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w': {
        'Nf3': ['d6', 'Nc6', 'e6'],
        'Nc3': ['Nc6', 'd6', 'e6'],
        'c3': ['Nf6', 'd5', 'Nc6'],
        'c4': ['Nc6', 'e6', 'g6'],
    },
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b': ['d6', 'Nc6', 'e6'],
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/2N5/PPPP1PPP/R1BQKBNR b': ['Nc6', 'd6', 'e6'],
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/2P5/PP1P1PPP/RNBQKBNR b': ['Nf6', 'd5', 'Nc6'],
    'rnbqkbnr/pp1ppppp/8/2p5/2P1P3/8/PP1P1PPP/RNBQKBNR b': ['Nc6', 'e6', 'g6'],
};

const pieceValues = {
    p: 100,
    n: 320,
    b: 330,
    r: 500,
    q: 900,
    k: 20000
};

export const findBestMove = (game) => {
    const maxDepth = 8;
    const timeLimit = 10000; // 5 seconds
    const startTime = Date.now();
    let bestMove = null;
    let bestScore = game.turn() === 'w' ? -Infinity : Infinity;
    
    for (let depth = 1; depth <= maxDepth; depth++) {
        const [move, score] = iterativeDeepeningSearch(game, depth, startTime, timeLimit);
        
        if (game.turn() === 'w' && score > bestScore) {
            bestScore = score;
            bestMove = move;
        } else if (game.turn() === 'b' && score < bestScore) {
            bestScore = score;
            bestMove = move;
        }
        
        // Break if we're out of time or found a winning move
        if (Date.now() - startTime > timeLimit || Math.abs(score) > 9000) break;
    }

    return bestMove;
};

const iterativeDeepeningSearch = (game, depth, startTime, timeLimit) => {
    let bestMove = null;
    let bestScore = game.turn() === 'w' ? -Infinity : Infinity;
    const moves = orderMoves(game, game.moves({ verbose: true }));

    for (const move of moves) {
        game.move(move);
        const score = -negamax(game, depth - 1, -Infinity, Infinity, -1, startTime, timeLimit);
        game.undo();

        if (Date.now() - startTime > timeLimit) break;

        if (game.turn() === 'w' && score > bestScore) {
            bestScore = score;
            bestMove = move;
        } else if (game.turn() === 'b' && score < bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    return [bestMove, bestScore];
};

const negamax = (game, depth, alpha, beta, color, startTime, timeLimit) => {
    if (Date.now() - startTime > timeLimit) return 0;
    if (depth === 0) return color * quiescenceSearch(game, alpha, beta, startTime, timeLimit);
    if (isGameOver(game)) return color * evaluateBoard(game);

    const moves = orderMoves(game, game.moves({ verbose: true }));
    let bestScore = -Infinity;

    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];
        game.move(move);

        let score;
        if (i >= 4 && depth >= 3 && !game.isCheck()) {
            // Late Move Reduction
            score = -negamax(game, depth - 2, -beta, -alpha, -color, startTime, timeLimit);
            if (score > alpha) {
                // Re-search at full depth if the reduced search was promising
                score = -negamax(game, depth - 1, -beta, -alpha, -color, startTime, timeLimit);
            }
        } else {
            score = -negamax(game, depth - 1, -beta, -alpha, -color, startTime, timeLimit);
        }

        game.undo();

        bestScore = Math.max(bestScore, score);
        alpha = Math.max(alpha, score);
        if (alpha >= beta) break; // Beta cutoff
    }

    return bestScore;
};

const quiescenceSearch = (game, alpha, beta, startTime, timeLimit) => {
    if (Date.now() - startTime > timeLimit) return 0;
    const standPat = evaluateBoard(game);
    if (standPat >= beta) return beta;
    if (alpha < standPat) alpha = standPat;

    const captureMoves = orderMoves(game, game.moves({ verbose: true }).filter(move => move.captured));
    for (const move of captureMoves) {
        game.move(move);
        const score = -quiescenceSearch(game, -beta, -alpha, startTime, timeLimit);
        game.undo();

        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
    }

    return alpha;
};

const orderMoves = (game, moves) => {
    return moves.sort((a, b) => {
        // Prioritize captures
        if (a.captured && !b.captured) return -1;
        if (!a.captured && b.captured) return 1;
        
        // Prioritize promotions
        if (a.promotion && !b.promotion) return -1;
        if (!a.promotion && b.promotion) return 1;
        
        // Prioritize checks
        const aCheck = isCheck(game, a);
        const bCheck = isCheck(game, b);
        if (aCheck && !bCheck) return -1;
        if (!aCheck && bCheck) return 1;
        
        return 0;
    });
};

const isCheck = (game, move) => {
    const newGame = new Chess(game.fen());
    newGame.move(move);
    return newGame.isCheck();
};

const evaluateBoard = (game) => {
    if (game.isCheckmate()) return game.turn() === 'w' ? -Infinity : Infinity;
    if (game.isDraw()) return 0;

    let score = 0;

    // Material and position evaluation
    game.board().forEach((row, y) => {
        row.forEach((piece, x) => {
            if (piece) {
                const pieceValue = pieceValues[piece.type];
                score += pieceValue * (piece.color === 'w' ? 1 : -1);
                score += getPiecePositionBonus(piece, x, y) * (piece.color === 'w' ? 1 : -1);
            }
        });
    });

    // Mobility (number of legal moves)
    const whiteMobility = game.moves().length;
    const tempGame = createChessInstance();
    const fenParts = game.fen().split(' ');
    fenParts[1] = fenParts[1] === 'w' ? 'b' : 'w'; // Switch the side to move
    fenParts[3] = '-'; // Reset en passant square
    const newFen = fenParts.join(' ');
    tempGame.load(newFen);
    const blackMobility = tempGame.moves().length;
    score += (whiteMobility - blackMobility) * 10;

    // Pawn structure
    score += evaluatePawnStructure(game);

    // King safety
    score += evaluateKingSafety(game);

    // Piece activity
    score += evaluatePieceActivity(game);

    return score;
};

const evaluateKingSafety = (game) => {
    let whiteKingSafety = 0;
    let blackKingSafety = 0;

    const whiteKingSquare = game.board().findIndex(row => row.find(piece => piece && piece.type === 'k' && piece.color === 'w'));
    const blackKingSquare = game.board().findIndex(row => row.find(piece => piece && piece.type === 'k' && piece.color === 'b'));

    // Penalize if kings are not castled or not protected
    if (whiteKingSquare > 5) whiteKingSafety -= 50;
    if (blackKingSquare < 2) blackKingSafety -= 50;

    // Check pawn shield
    whiteKingSafety += countPawnShield(game, 'w');
    blackKingSafety += countPawnShield(game, 'b');

    return whiteKingSafety - blackKingSafety;
};

const countPawnShield = (game, color) => {
    const rank = color === 'w' ? 6 : 1;
    const pawns = game.board()[rank].filter(piece => piece && piece.type === 'p' && piece.color === color).length;
    return pawns * 10;
};

const evaluatePieceActivity = (game) => {
    let whiteActivity = 0;
    let blackActivity = 0;

    game.board().forEach((row, y) => {
        row.forEach((piece, x) => {
            if (piece) {
                const activity = getPieceActivity(piece, x, y);
                if (piece.color === 'w') {
                    whiteActivity += activity;
                } else {
                    blackActivity += activity;
                }
            }
        });
    });

    return whiteActivity - blackActivity;
};

const getPieceActivity = (piece, x, y) => {
    switch (piece.type) {
        case 'n':
        case 'b':
            return centerDistance(x, y) * -5; // Encourage knights and bishops to be near the center
        case 'r':
            return y === 3 || y === 4 ? 20 : 0; // Bonus for rooks on 7th rank (or 2nd for black)
        case 'q':
            return centerDistance(x, y) * -2; // Slight encouragement for queen to be near center
        default:
            return 0;
    }
};

const centerDistance = (x, y) => {
    const centerX = 3.5;
    const centerY = 3.5;
    return Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
};

const getPiecePositionBonus = (piece, x, y) => {
    const pawnTable = [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5,  5, 10, 25, 25, 10,  5,  5],
        [0,  0,  0, 20, 20,  0,  0,  0],
        [5, -5,-10,  0,  0,-10, -5,  5],
        [5, 10, 10,-20,-20, 10, 10,  5],
        [0,  0,  0,  0,  0,  0,  0,  0]
    ];

    const knightTable = [
        [-50,-40,-30,-30,-30,-30,-40,-50],
        [-40,-20,  0,  0,  0,  0,-20,-40],
        [-30,  0, 10, 15, 15, 10,  0,-30],
        [-30,  5, 15, 20, 20, 15,  5,-30],
        [-30,  0, 15, 20, 20, 15,  0,-30],
        [-30,  5, 10, 15, 15, 10,  5,-30],
        [-40,-20,  0,  5,  5,  0,-20,-40],
        [-50,-40,-30,-30,-30,-30,-40,-50]
    ];

    const bishopTable = [
        [-20,-10,-10,-10,-10,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5, 10, 10,  5,  0,-10],
        [-10,  5,  5, 10, 10,  5,  5,-10],
        [-10,  0, 10, 10, 10, 10,  0,-10],
        [-10, 10, 10, 10, 10, 10, 10,-10],
        [-10,  5,  0,  0,  0,  0,  5,-10],
        [-20,-10,-10,-10,-10,-10,-10,-20]
    ];

    const rookTable = [
        [0,  0,  0,  0,  0,  0,  0,  0],
        [5, 10, 10, 10, 10, 10, 10,  5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [-5,  0,  0,  0,  0,  0,  0, -5],
        [0,  0,  0,  5,  5,  0,  0,  0]
    ];

    const queenTable = [
        [-20,-10,-10, -5, -5,-10,-10,-20],
        [-10,  0,  0,  0,  0,  0,  0,-10],
        [-10,  0,  5,  5,  5,  5,  0,-10],
        [-5,  0,  5,  5,  5,  5,  0, -5],
        [0,  0,  5,  5,  5,  5,  0, -5],
        [-10,  5,  5,  5,  5,  5,  0,-10],
        [-10,  0,  5,  0,  0,  0,  0,-10],
        [-20,-10,-10, -5, -5,-10,-10,-20]
    ];

    const kingTable = [
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-30,-40,-40,-50,-50,-40,-40,-30],
        [-20,-30,-30,-40,-40,-30,-30,-20],
        [-10,-20,-20,-20,-20,-20,-20,-10],
        [20, 20,  0,  0,  0,  0, 20, 20],
        [20, 30, 10,  0,  0, 10, 30, 20]
    ];

    const pieceTypeToTable = {
        p: pawnTable,
        n: knightTable,
        b: bishopTable,
        r: rookTable,
        q: queenTable,
        k: kingTable
    };

    const table = pieceTypeToTable[piece.type];
    return table[piece.color === 'w' ? y : 7 - y][x];
};

const evaluatePawnStructure = (game) => {
    let score = 0;
    const board = game.board();

    // Evaluate doubled pawns
    for (let x = 0; x < 8; x++) {
        let whitePawnsInFile = 0;
        let blackPawnsInFile = 0;
        for (let y = 0; y < 8; y++) {
            const piece = board[y][x];
            if (piece && piece.type === 'p') {
                if (piece.color === 'w') whitePawnsInFile++;
                else blackPawnsInFile++;
            }
        }
        if (whitePawnsInFile > 1) score -= 10;
        if (blackPawnsInFile > 1) score += 10;
    }

    // Evaluate isolated pawns
    for (let x = 0; x < 8; x++) {
        let whitePawnInFile = false;
        let blackPawnInFile = false;
        for (let y = 0; y < 8; y++) {
            const piece = board[y][x];
            if (piece && piece.type === 'p') {
                if (piece.color === 'w') whitePawnInFile = true;
                else blackPawnInFile = true;
            }
        }
        if (whitePawnInFile) {
            let isolated = true;
            if (x > 0) {
                for (let y = 0; y < 8; y++) {
                    if (board[y][x-1] && board[y][x-1].type === 'p' && board[y][x-1].color === 'w') {
                        isolated = false;
                        break;
                    }
                }
            }
            if (isolated && x < 7) {
                for (let y = 0; y < 8; y++) {
                    if (board[y][x+1] && board[y][x+1].type === 'p' && board[y][x+1].color === 'w') {
                        isolated = false;
                        break;
                    }
                }
            }
            if (isolated) score -= 20;
        }
        if (blackPawnInFile) {
            let isolated = true;
            if (x > 0) {
                for (let y = 0; y < 8; y++) {
                    if (board[y][x-1] && board[y][x-1].type === 'p' && board[y][x-1].color === 'b') {
                        isolated = false;
                        break;
                    }
                }
            }
            if (isolated && x < 7) {
                for (let y = 0; y < 8; y++) {
                    if (board[y][x+1] && board[y][x+1].type === 'p' && board[y][x+1].color === 'b') {
                        isolated = false;
                        break;
                    }
                }
            }
            if (isolated) score += 20;
        }
    }

    return score;
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
        const fenParts = fen.split(' ');
        fenParts[3] = '-'; // Reset en passant square
        const newFen = fenParts.join(' ');
        return game.load(newFen);
    } catch (error) {
        console.error("Error loading FEN:", error);
        return false;
    }
};

export const getSicilianBookMove = (game) => {
    const fen = game.fen();
    const relevantPart = fen.split(' ').slice(0, 3).join(' ');
    
    for (let key in sicilianOpeningBook) {
        if (relevantPart.startsWith(key)) {
            const moves = sicilianOpeningBook[key];
            if (Array.isArray(moves)) {
                const move = moves[Math.floor(Math.random() * moves.length)];
                console.log("Sicilian opening book suggests:", move);
                return move;
            } else if (typeof moves === 'object') {
                const lastMove = game.history().slice(-1)[0];
                const responses = moves[lastMove];
                if (responses) {
                    const move = responses[Math.floor(Math.random() * responses.length)];
                    console.log("Sicilian opening book suggests:", move);
                    return move;
                }
            }
        }
    }
    
    console.log("No Sicilian opening book move found for position:", relevantPart);
    return null;
};

export const makeRandomMove = (game) => {
    const legalMoves = game.moves({ verbose: true });
    if (legalMoves.length > 0) {
        return legalMoves[Math.floor(Math.random() * legalMoves.length)];
    } else {
        console.error("No legal moves available");
        return null;
    }
};