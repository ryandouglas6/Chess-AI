import React, { useState, useEffect, useCallback, useRef } from "react";
import "./BoardPage.css";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";
import * as chessLogic1 from "./chess-logic1.js";
import * as chessLogic2 from "./chess-logic2.js";
import * as chessLogic3 from "./chess-logic3.js";
import Header from "../Header/Header";
import OpenAI from 'openai';

const bots = [
  { name: 'Training Bot', photo: require('./bot_pics/bot1.png'), logic: chessLogic3, label: 'Personalized Training Bot' },
  { name: 'Rookinator', photo: require('./bot_pics/bot1.png'), logic: chessLogic1, label: 'Strategic Bot (Sicilian)' },
  { name: 'Pawnstar', photo: require('./bot_pics/bot2.png'), logic: chessLogic2, label: 'Random Moves Bot' },
  { name: 'Knight Fury', photo: require('./bot_pics/bot3.png'), logic: chessLogic3, label: 'Stockfish 500' },
  { name: 'Bishop Blitz', photo: require('./bot_pics/bot4.png'), logic: chessLogic3, label: 'Stockfish 1000' },
  { name: 'Queen Quest', photo: require('./bot_pics/bot5.png'), logic: chessLogic3, label: 'Stockfish 1250' },
  { name: 'King Crusher', photo: require('./bot_pics/bot6.png'), logic: chessLogic3, label: 'Stockfish 1500' },
  { name: 'Castling Conqueror', photo: require('./bot_pics/bot7.png'), logic: chessLogic3, label: 'Stockfish 1750' },
  { name: 'Pawnstorm', photo: require('./bot_pics/bot8.png'), logic: chessLogic3, label: 'Stockfish 2000' },
  { name: 'Checkmate Champ', photo: require('./bot_pics/bot9.png'), logic: chessLogic3, label: 'Stockfish 2250' },
  { name: 'Endgame Expert', photo: require('./bot_pics/bot10.png'), logic: chessLogic3, label: 'Stockfish 2500' },
];

const BoardPage = () => {
  const [chess, setChess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [moveHistory, setMoveHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const [selectedBot, setSelectedBot] = useState(bots[0]?.name);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [playerColor, setPlayerColor] = useState(Math.random() < 0.5 ? 'white' : 'black');
  const [isTraining, setIsTraining] = useState(false);
  const [trainingGames, setTrainingGames] = useState(0);
  const [trainingResults, setTrainingResults] = useState([]);
  const [predictedElo, setPredictedElo] = useState(null);
  const [eloRange, setEloRange] = useState({ min: 0, max: 3000, current: 1500 });

  // Initialize OpenAI with configuration
  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });

  const generateCoachResponse = async (userMessage, isAnalysis = false) => {
    if (isAnalysis) {
      setIsAnalyzing(true);
    } else {
      setIsSendingMessage(true);
      // Immediately show the user's message
      setMessages(prev => [...prev, { sender: "User", text: userMessage }]);
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a chess coach. Analyze positions and provide helpful advice. Be concise and specific."
          },
          {
            role: "user",
            content: `Current chess position (FEN): ${chess.fen()}\nUser message: ${userMessage}`
          }
        ],
        max_tokens: 150
      });

      // Testing
      
      const coachResponse = response.choices[0].message.content;
      setMessages(prev => [
        ...prev,
        ...(isAnalysis ? [{ sender: "User", text: "Please analyze the current position." }] : []),
        { sender: "Coach", text: coachResponse }
      ]);
    } catch (error) {
      console.error("Error getting coach response:", error);
      setMessages(prev => [...prev,
        { sender: "Coach", text: "Sorry, I'm having trouble responding right now. Please try again." }
      ]);
    } finally {
      if (isAnalysis) {
        setIsAnalyzing(false);
      } else {
        setIsSendingMessage(false);
      }
    }
  };

  const handleAnalyzePosition = async () => {
    await generateCoachResponse("Please analyze the current position.", true);
  };

  const makeBotMove = useCallback(async () => {
    console.log("Bot is thinking...");
    const startTime = performance.now();
    const newChess = new Chess(chess.fen());
    console.log("Current FEN:", newChess.fen());
    console.log("Valid moves:", newChess.moves({ verbose: true }));

    // Get the selected bot's logic
    const selectedBotLogic = bots.find(bot => bot.name === selectedBot)?.logic || chessLogic1;

    try {
      let bestMove;
      
      if (selectedBotLogic.getSicilianBookMove) {
        bestMove = selectedBotLogic.getSicilianBookMove(newChess);
      }
      
      if (!bestMove) {
        console.log("Calculating best move...");
        bestMove = await selectedBotLogic.findBestMove(newChess);
      }

      if (bestMove) {
        const result = newChess.move(bestMove);
        if (result) {
          setChess(newChess);
          setFen(newChess.fen());
          setMoveHistory((prev) => [...prev, newChess.fen()]);
          console.log("Bot moved:", bestMove);

          // Check for game over after bot's move
          if (newChess.isGameOver()) {
            setGameOver(true);
            if (newChess.isCheckmate()) {
              setWinner('bot');
            } else {
              setWinner('draw');
            }
            return;
          }

          setIsPlayerTurn(true);
        } else {
          console.error("Move returned null:", bestMove);
          throw new Error("Invalid move");
        }
      }
    } catch (error) {
      console.error("Error making bot move:", error);
      // Fallback to random move only for non-Stockfish bots
      if (selectedBotLogic !== chessLogic3) {
        const randomMove = selectedBotLogic.makeRandomMove?.(newChess);
        if (randomMove) {
          newChess.move(randomMove);
          setChess(newChess);
          setFen(newChess.fen());
          setMoveHistory((prev) => [...prev, newChess.fen()]);
          console.log("Bot made random move:", randomMove);
          setIsPlayerTurn(true);
        }
      }
    }
    const endTime = performance.now();
    console.log(`Bot thinking time: ${endTime - startTime} ms`);
  }, [chess, moveHistory, selectedBot]);

  useEffect(() => {
    if (!isPlayerTurn) {
      const timerId = setTimeout(() => {
        makeBotMove();
      }, 500);
      return () => clearTimeout(timerId);
    }
  }, [isPlayerTurn, makeBotMove]);

  useEffect(() => {
    // Initialize Stockfish when component mounts
    if (selectedBot === 'Bot 3') {
      const initEngine = async () => {
        await chessLogic3.initializeEngine();
      };
      initEngine();
    }
    return () => {
      // Cleanup Stockfish when component unmounts
      chessLogic3.cleanup();
    };
  }, [selectedBot]);

  useEffect(() => {
    // If player is black, bot (white) makes the first move
    if (playerColor === 'black' && !gameOver) {
      makeBotMove();
    }
  }, []);  // Run once when component mounts

  useEffect(() => {
    if (gameOver && isTraining && trainingGames < 5) {
      // Update ELO range based on game result
      const newRange = { ...eloRange };
      if (winner === 'player') {
        newRange.min = eloRange.current;
      } else {
        newRange.max = eloRange.current;
      }
      newRange.current = Math.floor((newRange.min + newRange.max) / 2);
      
      setEloRange(newRange);
      setTrainingResults([...trainingResults, { elo: eloRange.current, result: winner === 'player' ? 'win' : 'loss' }]);
      setTrainingGames(trainingGames + 1);

      if (trainingGames === 4) {
        // Training complete, calculate predicted ELO
        const finalElo = Math.floor((newRange.min + newRange.max) / 2);
        setPredictedElo(finalElo);
        setIsTraining(false);
      } else {
        // Start next training game
        setTimeout(() => {
          resetGame();
          chessLogic3.initializeEngine('Training Bot', newRange.current);
        }, 1000);
      }
    }
  }, [gameOver, isTraining, trainingGames]);

  const startTraining = () => {
    setIsTraining(true);
    setTrainingGames(0);
    setTrainingResults([]);
    setPredictedElo(null);
    setEloRange({ min: 0, max: 3000, current: 1500 });
    resetGame();
    chessLogic3.initializeEngine('Training Bot', 1500);
  };

  const handleMove = (move) => {
    const newChess = new Chess(chess.fen());
    
    // Only allow moves if it's the player's turn and the piece color matches player's color
    const piece = newChess.get(move.from);
    if (!piece || piece.color !== playerColor.charAt(0) || !isPlayerTurn) {
      return;
    }

    try {
      const result = newChess.move(move);
      if (result) {
        setChess(newChess);
        setFen(newChess.fen());
        setMoveHistory((prev) => [...prev, newChess.fen()]);
        console.log("Player moved:", move);

        // Check for game over after player's move
        if (newChess.isGameOver()) {
          setGameOver(true);
          if (newChess.isCheckmate()) {
            setWinner('player');
          } else {
            setWinner('draw');
          }
          return;
        }

        setIsPlayerTurn(false);
      }
    } catch (error) {
      console.error("Invalid player move:", error);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      await generateCoachResponse(input);
      setInput("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelect = (bot) => {
    setSelectedBot(bot.name);
    // Reset the game
    const newGame = new Chess();
    setChess(newGame);
    setFen(newGame.fen());
    setMoveHistory([]);
    setGameOver(false);
    setWinner(null);
    setMessages([]);
    // If it's the Sicilian bot (Bot 1), player is always white, otherwise random
    setPlayerColor(bot.name === 'Bot 1' ? 'white' : (Math.random() < 0.5 ? 'white' : 'black'));
    setIsPlayerTurn(true);
  };

  const resetGame = () => {
    const newGame = new Chess();
    setChess(newGame);
    setFen(newGame.fen());
    setMoveHistory([]);
    setGameOver(false);
    setWinner(null);
    setIsPlayerTurn(true);
  };

  return (
    <div>
      <Header />

      <div className="page-container">
        <div className="chess-game">
          <div className="board-container">
            <div className="player-name opponent">
              <span>Bot ({playerColor === 'white' ? 'black' : 'white'})</span>
            </div>
            <div className="board">
              <Chessboard
                position={fen}
                orientation={playerColor}
                onDrop={(move) =>
                  handleMove({
                    from: move.sourceSquare,
                    to: move.targetSquare,
                    promotion: "q",
                  })
                }
              />
              {gameOver && (
                <div className="game-over-overlay">
                  <div className="game-over-message">
                    {winner === 'player' && <h2>You Win! 🎉</h2>}
                    {winner === 'bot' && <h2>Bot Wins! 🤖</h2>}
                    {winner === 'draw' && <h2>Game Draw! 🤝</h2>}
                  </div>
                </div>
              )}
            </div>
            <div className="player-name player">
              <span>You ({playerColor})</span>
            </div>
          </div>
        </div>

        <div className="rightside-parts">
          <div className="bot-list">
            {bots.map((bot, index) => (
                <div
                  key={index}
                  className={`bot-item ${selectedBot === bot.name ? 'selected' : ''}`}
                  onClick={() => handleSelect(bot)}
                >
                  <div className="bot-info">
                    <img src={bot.photo} alt={bot.name} className="bot-image" />
                    <div>
                      <p>{bot.name}</p>
                      <p className="bot-label">{bot.label}</p>
                    </div>
                  </div>
                </div>
            ))}
          </div>

          <div className="chatbot">
            <div className="chatbot-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender.toLowerCase()}`}>
                  <strong>{msg.sender}:</strong> {msg.text}
                </div>
              ))}
              {isSendingMessage && (
                <div className="message coach typing">
                  <span className="typing-indicator">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="chat-controls">
              <form
                onSubmit={handleSendMessage}
                className="message-form"
              >
                <input
                  type="text"
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="message-input"
                  disabled={isSendingMessage}
                />
                <button
                  type="submit"
                  className={`send-button ${isSendingMessage ? 'disabled' : ''}`}
                  disabled={isSendingMessage}
                >
                  Send
                </button>
              </form>
              <button
                onClick={handleAnalyzePosition}
                className={`analyze-button ${isAnalyzing ? 'disabled' : ''}`}
                disabled={isAnalyzing || isSendingMessage}
              >
                {isAnalyzing ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Analyzing Position...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <svg className="h-5 w-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Analyze Position
                  </span>
                )}
              </button>
              <button
                onClick={startTraining}
                className="train-button"
              >
                Start Training
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p>Current turn: {isPlayerTurn ? `Your turn (${playerColor})` : `Bot's turn (${playerColor === 'white' ? 'black' : 'white'})`}</p>
        <p>FEN: {fen}</p>
        {isTraining && (
          <div>
            <p>Training in progress...</p>
            <p>Games played: {trainingGames}</p>
            <p>Predicted ELO: {predictedElo}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardPage;
