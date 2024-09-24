import React from "react";
import $ from 'jquery';
import "./BoardPage.css";
import Chessboard from "chessboardjsx";

const BoardPage = () => {

    return (
        <div>
            <header className="page-header">
                <span className="header-page">Profile</span>
                <span className="header-page">Board</span>
                <span className="header-logout">Log Out</span>
            </header>
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
                        CHATBOT WIP
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BoardPage;
