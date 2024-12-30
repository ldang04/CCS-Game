import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import '../../App.css'; 

import Header from "../helpers/Header";

const NewGame = () => {
    const [input, setInput] = useState(""); 
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

    const handleJoin = () => {
        navigate(`/game/${input}`)
    }

    return (
        <div className="main-container">
            <Header />

            <button className="btn create-btn" onClick={handleCreateGame}>
                Create a new game
            </button>

            <div className="join-container">
                <input
                        className="join-input"
                        placeholder="Game code"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />

                {/* @todo: room validation function  */}
                <button className="btn" onClick={handleJoin}>Join</button>
            </div>
        </div>
    );
};

export default NewGame;