import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import '../../App.css'; 

import Header from "../helpers/Header";

const NewGame = () => {
    const [input, setInput] = useState(""); 
    const [nickname, setNickname] = useState("");
    const navigate = useNavigate(); // Initialize useNavigate

    const handleCreateGame = async () => {
        if (!nickname.trim()) {
            alert("Enter a nickname");
            return;
        }
    
        // Fetch a new game ID
        const response = await fetch("http://localhost:3001/create_game");
        const data = await response.json();
        const gameId = data.gameId;
    
        // Navigate to the GameRoom with the nickname
        navigate(`/game/${gameId}`, { state: { nickname } });
    };

    const handleJoin = async () => {
        if (!nickname.trim()) {
            alert("Enter a nickname");
            return;
        }
    
        // Check if the room exists
        try {
            const response = await fetch(`http://localhost:3001/check-room/${input}`);
            const data = await response.json();
    
            if (data.exists) {
                navigate(`/game/${input}`, { state: { nickname } });
            } else {
                alert("Room does not exist. Please try again.");
            }
        } catch (error) {
            console.error("Error checking room:", error);
            alert("An error occurred while checking the room. Please try again.");
        }
    };

    return (
        <div className="main-container">
            <Header />

            <div className="join-container">
                <p>Nickname:</p>
                <input
                        className="join-input"
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === "Enter"){
                                setNickname(nickname)
                            }
                        }}
                    />
            </div>

            <div className="join-container">
                <p>Join code:</p>
                <input
                        className="join-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if(e.key === "Enter"){
                                handleJoin()
                            }
                        }}
                    />

                {/* @todo: room validation function  */}
            </div>
            
            <h3> OR </h3>
            <button className="btn" id="create-btn" onClick={handleCreateGame}>
                Create a new game
            </button>
        </div>
    );
};

export default NewGame;