import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const EndScreen = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Destructure data passed from GameRoom.js
    const { reason, winner, totalLocations, isSolo } = location.state || {};

    return (
        <div className="end-screen-container">
            <h1>Game Over!</h1>
            <p>{reason}</p>

            {/* Display winner if it's a multiplayer game */}
            {!isSolo && winner && (
                <p>The winner is: <strong>{winner}</strong></p>
            )}

            {/* Display total locations named */}
            <p>Total locations named: <strong>{totalLocations}</strong></p>

            {/* Button to redirect back to newGame.js */}
            <button 
                onClick={() => navigate("/")} // Navigate to the home page
                className="btn color-btn"
            >
                Play Again
            </button>
        </div>
    );
};

export default EndScreen;