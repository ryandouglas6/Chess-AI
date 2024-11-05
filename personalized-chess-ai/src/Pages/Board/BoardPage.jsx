import React, { useState, useEffect, useCallback, useRef } from "react";
import "./BoardPage.css";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";
import {
  findBestMove,
  getSicilianBookMove,
  makeRandomMove,
} from "./chess-logic";
import Header from "../Header/Header";

const BoardPage = () => {
  const [chess, setChess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [moveHistory, setMoveHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const [selectedBot, setSelectedBot] = useState(null);

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
      console.log(
        "No Sicilian opening book move found, calculating best move..."
      );
      bestMove = findBestMove(newChess);
    }

    if (bestMove) {
      try {
        const result = newChess.move(bestMove);
        if (result) {
          setChess(newChess);
          setFen(newChess.fen());
          setMoveHistory((prev) => [...prev, newChess.fen()]);
          console.log("Bot moved:", bestMove);
          setIsPlayerTurn(true);
        } else {
          console.error("Move returned null:", bestMove);
        }
      } catch (error) {
        console.error("Invalid bot move:", error, bestMove);
        const randomMove = makeRandomMove(newChess);
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
      const randomMove = makeRandomMove(newChess);
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
        setMoveHistory((prev) => [...prev, newChess.fen()]);
        console.log("Player moved:", move);
        setIsPlayerTurn(false);
      }
    } catch (error) {
      console.error("Invalid player move:", error);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      setMessages([...messages, { sender: "User", text: input }]);
      setInput("");
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // List of bots
  const bots = [
    { name: 'Bot 1', photo: require('./bot_pics/bot1.png') },
    { name: 'Bot 2', photo: require('./bot_pics/bot2.png') },
    { name: 'Bot 3', photo: require('./bot_pics/bot3.png') },
    { name: 'Bot 4', photo: require('./bot_pics/bot4.png') },
    { name: 'Bot 5', photo: require('./bot_pics/bot5.png') },
    { name: 'Bot 6', photo: require('./bot_pics/bot6.png') },
    { name: 'Bot 7', photo: require('./bot_pics/bot7.png') },
    { name: 'Bot 8', photo: require('./bot_pics/bot8.png') },
    { name: 'Bot 9', photo: require('./bot_pics/bot9.png') },
    { name: 'Bot 10', photo: require('./bot_pics/bot10.png')},
  ];

  const handleSelect = (bot) => {
      setSelectedBot(bot.name);
  };

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
                  promotion: "q",
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
            {bots.map((bot, index) => (
                <div
                  key={index}
                  className={`bot-item ${selectedBot === bot.name ? 'selected' : ''}`}
                  onClick={() => handleSelect(bot)}
                >
                  <div className="bot-info">
                    <img src={bot.photo} alt={bot.name} className="bot-image" />
                    <p>{bot.name}</p>
                  </div>
                </div>
            ))}
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
            <form
              onSubmit={handleSendMessage}
              style={{
                display: "flex",
                border: "1px solid #000000",
                backgroundColor: "white",
              }}
            >
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Type your message..."
                style={{ flex: 1, padding: "10px", border: "1px solid #ddd" }}
              />
              <button
                type="submit"
                style={{
                  padding: "10px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                }}
              >
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
