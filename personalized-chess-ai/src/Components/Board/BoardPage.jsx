import React, { useState, useRef, useEffect, useCallback } from "react";
import $ from 'jquery';
import "./BoardPage.css";
import Header from "../Header/Header";
import Chessboard from "chessboardjsx";
import { Chess } from 'chess.js';

const BoardPage = () => {
    // CHESSBOT CODE vvv
    // CHESSBOT CODE vvv
    // CHESSBOT CODE vvv
    const [chess, setChess] = useState(new Chess());
    const [fen, setFen] = useState(chess.fen());
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [moveHistory, setMoveHistory] = useState([]);
    const sicilianOpeningBook = {
        // Black's first move in response to 1.e4
        'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b': ['c5'],

        // Black's responses to common White second moves
        'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w': {
            'Nf3': ['d6', 'Nc6', 'e6'],  // Open Sicilian
            'Nc3': ['Nc6', 'd6', 'e6'],  // Closed Sicilian
            'c3': ['Nf6', 'd5', 'Nc6'],  // Alapin Variation
            'c4': ['Nc6', 'e6', 'g6'],   // Grand Prix Attack
        },

        // Some common Sicilian variations
        'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b': ['d6', 'Nc6', 'e6'], // Open Sicilian
        'rnbqkbnr/pp1ppppp/8/2p5/4P3/2N5/PPPP1PPP/R1BQKBNR b': ['Nc6', 'd6', 'e6'], // Closed Sicilian
        'rnbqkbnr/pp1ppppp/8/2p5/4P3/2P5/PP1P1PPP/RNBQKBNR b': ['Nf6', 'd5', 'Nc6'], // Alapin Variation
        'rnbqkbnr/pp1ppppp/8/2p5/2P1P3/8/PP1P1PPP/RNBQKBNR b': ['Nc6', 'e6', 'g6'], // Grand Prix Attack
    };
    const makeBotMove = useCallback(() => {
        console.log("Bot is thinking...");
        const startTime = performance.now();
        const newChess = new Chess(chess.fen());
        console.log("Current FEN:", newChess.fen());
        console.log("Valid moves:", newChess.moves({ verbose: true }));

        const bookMove = getSicilianBookMove(newChess);
        let bestMove;

        if (bookMove) {
            console.log("Using Sicilian opening book move:", bookMove);
            bestMove = bookMove;
        } else {
            console.log("No Sicilian opening book move found, calculating best move...");
            bestMove = findBestMove(newChess);
        }
        if (bestMove) {
            try {
                const result = newChess.move(bestMove);
                if (result) {
                    setChess(newChess);
                    setFen(newChess.fen());
                    setMoveHistory(prev => [...prev, newChess.fen()]);
                    console.log("Bot moved:", bestMove);
                    setIsPlayerTurn(true);
                } else {
                    console.error("Move returned null:", bestMove);
                }
            } catch (error) {
                console.error("Invalid bot move:", error, bestMove);
                makeRandomMove(newChess);
            }
        } else {
            console.log("No valid moves for bot");
            makeRandomMove(newChess);
        }
        const endTime = performance.now();
        console.log(`Bot thinking time: ${endTime - startTime} ms`);
    }, [chess, moveHistory]);
    useEffect(() => {
        if (!isPlayerTurn) {
            const timerId = setTimeout(() => {
                makeBotMove();
            }, 500);
            return () => clearTimeout(timerId);
        }
    }, [isPlayerTurn, makeBotMove]);
    const handleMove = (move) => {
        try {
            const newChess = new Chess(chess.fen());
            const result = newChess.move(move);
            if (result) {
                setChess(newChess);
                setFen(newChess.fen());
                setMoveHistory(prev => [...prev, newChess.fen()]);
                console.log("Player moved:", move);
                setIsPlayerTurn(false);
            }
        } catch (error) {
            console.error("Invalid player move:", error);
        }
    };
    const makeRandomMove = (game) => {
        const legalMoves = game.moves({ verbose: true });
        if (legalMoves.length > 0) {
            const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
            game.move(randomMove);
            setChess(game);
            setFen(game.fen());
            setMoveHistory(prev => [...prev, game.fen()]);
            console.log("Bot made random move:", randomMove);
            setIsPlayerTurn(true);
        } else {
            console.error("No legal moves available");
        }
    };
    const findBestMove = (game) => {
        const depth = 4;
        const moves = game.moves({ verbose: true });
        let bestMove = null;
        let bestScore = game.turn() === 'w' ? -Infinity : Infinity;
        for (const move of moves) {
            try {
                game.move(move);
                const score = negamax(new Chess(game.fen()), depth - 1, -Infinity, Infinity, game.turn() === 'w' ? 1 : -1);
                game.undo();
                const newFen = game.fen();
                const repetitionPenalty = moveHistory.filter(fen => fen === newFen).length * 1000;
                const adjustedScore = game.turn() === 'w' ? score - repetitionPenalty : score + repetitionPenalty;
                if (game.turn() === 'w' && adjustedScore > bestScore) {
                    bestScore = adjustedScore;
                    bestMove = move;
                } else if (game.turn() === 'b' && adjustedScore < bestScore) {
                    bestScore = adjustedScore;
                    bestMove = move;
                }
            } catch (error) {
                console.error("Error in findBestMove:", error, move);
            }
        }
        return bestMove;
    };
    const negamax = (game, depth, alpha, beta, color) => {
        if (depth === 0 || isGameOver(game)) {
            return color * evaluateBoard(game);
        }
        const moves = game.moves({ verbose: true });
        let bestScore = -Infinity;
        for (const move of moves) {
            try {
                game.move(move);
                const score = -negamax(game, depth - 1, -beta, -alpha, -color);
                game.undo();
                bestScore = Math.max(bestScore, score);
                alpha = Math.max(alpha, score);
                if (alpha >= beta) break;
            } catch (error) {
                console.error("Error in negamax:", error, move, game.fen());
                game.undo();
            }
        }
        return bestScore;
    };
    const isGameOver = (game) => {
        return game.isCheckmate() || game.isDraw() || game.isStalemate() || game.isThreefoldRepetition();
    };
    const evaluateBoard = (game) => {
        if (game.isCheckmate()) return game.turn() === 'w' ? -Infinity : Infinity;
        if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) return 0;
        let score = 0;
        const pieces = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
        game.board().forEach((row, y) => {
            row.forEach((piece, x) => {
                if (piece) {
                    score += pieces[piece.type] * (piece.color === 'w' ? 1 : -1);
                    score += getPiecePositionBonus(piece, x, y);
                }
            });
        });
        return score;
    };
    const getPiecePositionBonus = (piece, x, y) => {
        // Implement piece-square tables here if desired
        return 0;
    };
    const getSicilianBookMove = (game) => {
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
                    // This is for responding to White's second move
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



    // CHATBOX CODE vvv
    // CHATBOX CODE vvv
    // CHATBOX CODE vvv
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // handles user input from chatbox
    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    // Updates the displayed messages in chatbox
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (input.trim()) {
            setMessages([...messages, { sender: 'User', text: input }]);

            setInput('');
        }

        // use message as input for chatbot
    };

    // Scrolls to bottom of chatbox when messages is updated (new message)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div>
            <Header />

            <div className="page-container">

                <div className="chess-game">
                    <div className="player-name opponent">
                        <span>Bot (Black - Sicilian Defense)</span>
                    </div>
                    <div className="board">
                        <Chessboard
                            position={fen}
                            orientation="white"
                            onDrop={(move) =>
                                handleMove({
                                    from: move.sourceSquare,
                                    to: move.targetSquare,
                                    promotion: 'q',
                                })
                            }
                        />
                    </div>
                    <div className="player-name player">
                        <span>You (White)</span>
                    </div>
                </div>

                <div className="rightside-parts">
                    <div className="bot-list">
                        Bot (Black) is using Sicilian Defense Opening Book and Negamax algorithm with depth 4
                    </div>

                    <div className="chatbot">
                        <div className="chatbot-messages">
                            {messages.map((msg, index) => (
                                <div key={index}>
                                    <strong>{msg.sender}:</strong> {msg.text}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} style={{ display: 'flex', border: '1px solid #000000', backgroundColor: 'white' }}>
                            <input
                                type="text"
                                value={input}
                                onChange={handleInputChange}
                                placeholder="Type your message..."
                                style={{ flex: 1, padding: '10px', border: '1px solid #ddd' }}
                            />
                            <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                                Send
                            </button>
                        </form>
                    </div>
                </div>

            </div>
            
            <div>
                <p>Current turn: {isPlayerTurn ? "Player (White)" : "Bot (Black)"}</p>
                <p>FEN: {fen}</p>
            </div>
        </div>
    );
};

export default BoardPage;
