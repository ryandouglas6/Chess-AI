import React, { useState, useEffect, useCallback, useRef } from "react";
import "./BoardPage.css";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";
import * as chessLogic1 from "./chess-logic1.js";
import * as chessLogic2 from "./chess-logic2.js";
import Header from "../Header/Header";
import OpenAI from 'openai';

const bots = [
  { name: 'Bot 1', photo: require('./bot_pics/bot1.png'), logic: chessLogic1, label: 'Strategic Bot (Sicilian)' },
  { name: 'Bot 2', photo: require('./bot_pics/bot2.png'), logic: chessLogic2, label: 'Random Moves Bot' },
  { name: 'Bot 3', photo: require('./bot_pics/bot3.png'), logic: chessLogic2, label: 'Random Moves Bot' },
  { name: 'Bot 4', photo: require('./bot_pics/bot4.png'), logic: chessLogic2, label: 'Random Moves Bot' },
  { name: 'Bot 5', photo: require('./bot_pics/bot5.png'), logic: chessLogic2, label: 'Random Moves Bot' },
  { name: 'Bot 6', photo: require('./bot_pics/bot6.png'), logic: chessLogic2, label: 'Random Moves Bot' },
  { name: 'Bot 7', photo: require('./bot_pics/bot7.png'), logic: chessLogic2, label: 'Random Moves Bot' },
  { name: 'Bot 8', photo: require('./bot_pics/bot8.png'), logic: chessLogic2, label: 'Random Moves Bot' },
  { name: 'Bot 9', photo: require('./bot_pics/bot9.png'), logic: chessLogic2, label: 'Random Moves Bot' },
  { name: 'Bot 10', photo: require('./bot_pics/bot10.png'), logic: chessLogic2, label: 'Random Moves Bot' },
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

  const makeBotMove = useCallback(() => {
    console.log("Bot is thinking...");
    const startTime = performance.now();
    const newChess = new Chess(chess.fen());
    console.log("Current FEN:", newChess.fen());
    console.log("Valid moves:", newChess.moves({ verbose: true }));

    // Get the selected bot's logic
    const selectedBotLogic = bots.find(bot => bot.name === selectedBot)?.logic || chessLogic1;

    const bookMove = selectedBotLogic.getSicilianBookMove?.(newChess);
    let bestMove;

    if (bookMove) {
      console.log("Using Sicilian opening book move:", bookMove);
      bestMove = bookMove;
    } else {
      console.log(
        "No Sicilian opening book move found, calculating best move..."
      );
      bestMove = selectedBotLogic.findBestMove(newChess);
    }

    if (bestMove) {
      try {
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
        }
      } catch (error) {
        console.error("Invalid bot move:", error, bestMove);
        const randomMove = selectedBotLogic.makeRandomMove(newChess);
        if (randomMove) {
          newChess.move(randomMove);
          setChess(newChess);
          setFen(newChess.fen());
          setMoveHistory((prev) => [...prev, newChess.fen()]);
          console.log("Bot made random move:", randomMove);
          setIsPlayerTurn(true);
        }
      }
    } else {
      console.log("No valid moves for bot");
      const randomMove = selectedBotLogic.makeRandomMove(newChess);
      if (randomMove) {
        newChess.move(randomMove);
        setChess(newChess);
        setFen(newChess.fen());
        setMoveHistory((prev) => [...prev, newChess.fen()]);
        console.log("Bot made random move:", randomMove);
        setIsPlayerTurn(true);
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
    // If player is black, bot (white) makes the first move
    if (playerColor === 'black' && !gameOver) {
      makeBotMove();
    }
  }, []);  // Run once when component mounts

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
            </div>
          </div>
        </div>
      </div>

      <div>
        <p>Current turn: {isPlayerTurn ? `Your turn (${playerColor})` : `Bot's turn (${playerColor === 'white' ? 'black' : 'white'})`}</p>
        <p>FEN: {fen}</p>
      </div>
    </div>
  );
};

export default BoardPage;
