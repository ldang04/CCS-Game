import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Map from "../helpers/Map";
import "../../App.css";
import "leaflet/dist/leaflet.css"; // Ensure Leaflet CSS is imported


const EndScreen = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Destructure data passed from GameRoom.js
    const { winner, totalLocations, isSolo, markers = [] } = location.state || {};

    return (
        <div className="end-screen-container">
            <h1>Game Over!</h1>
            {/* <p>{reason}</p> <-- Dev note: personally don't think this is too important*/}
            
            <Map markers={markers} customZoom={0} /> {/* Pass markers to Map */}

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