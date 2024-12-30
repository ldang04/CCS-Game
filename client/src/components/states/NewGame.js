import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import '../../App.css'; 

import Header from "../helpers/Header";

const NewGame = () => {
    const [gameLink, setGameLink] = useState(null); 
    const navigate = useNavigate(); // Initialize useNavigate

    const handleCreateGame = async () => {
        // get new game link
        const response = await fetch('http://localhost:3001/create_game');
        const data = await response.json();
        const link = `http://localhost:3000/game/${data.gameId}`;

        // Create a new game ID and navigate to the corresponding game link
        const gameId = link.split('/').pop(); // Extract the gameId from the link

        console.log(link); 
        console.log(gameId); 
        navigate(`/game/${gameId}`); // Navigate to the /game/:gameId route
    };

    return (
        <div className="main-container">
            <Header />

            <button className="btn create-btn" onClick={handleCreateGame}>
                Create a new game
            </button>

            {/* Optionally display the game link */}
            {gameLink && (
                <p>
                    Share this link:{" "}
                    <a href={gameLink} target="_blank" rel="noopener noreferrer">
                        {gameLink}
                    </a>
                </p>
            )}

            {/* @todo: Create a join option */}
        </div>
    );
};

export default NewGame;