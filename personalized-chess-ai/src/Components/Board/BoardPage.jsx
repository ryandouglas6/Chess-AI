import React, { useState, useRef, useEffect } from "react";
import $ from 'jquery';
import "./BoardPage.css";
import Header from "../Header/Header";
import Chessboard from "chessboardjsx";

const BoardPage = () => {

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const handleInputChange = (e) => {
        setInput(e.target.value);
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (input.trim()) {
            setMessages([...messages, { sender: 'User', text: input }]);

            setInput(''); // Clear input after sending
        }

        // vvv use message as input for chatbot vvv
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, [messages]); // Runs whenever messages change
    
    return (
        <div>
            <Header />
            
            <div className="page-container">

                <div className="chess-game">
                    <div className="player-name opponent">
                        <span>Opponent's Name</span>
                    </div>
                    <div className="board">
                        <Chessboard position="start" draggable={true} width={800} />
                    </div>
                    <div className="player-name player">
                        <span>Your Name</span>
                    </div>
                </div>

                <div className="rightside-parts">
                    <div className="bot-list">
                        BOT WIP
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
            
        </div>
    );
};

export default BoardPage;
