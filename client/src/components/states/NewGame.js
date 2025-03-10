import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import Swal from 'sweetalert2';
import '../../App.css'; 

import Header from "../helpers/Header";

const NewGame = () => {
    const [input, setInput] = useState(""); 
    const [nickname, setNickname] = useState("");
    const [lives, setLives] = useState(3); 
    const [time, setTime] = useState(30); 

    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        console.log(input);
    }, [input])

    const handleJoin = async () => {
        if (!nickname.trim()) {
            Swal.fire(getAlertBody("Enter a nickname", "warning"));
            return;
        }
     
        if (input.trim()) {
            console.log("sldjflsfs");
            try {
                // Check if the room exists
                const response = await fetch(`https://geochain-backend-00df5e12a638.herokuapp.com/api/check-room/api/check-room/${input}`);
                const data = await response.json();
                
                console.log("data");
                console.log(data);
                if (data.exists) {
                    // Navigate to the GameRoom with the nickname
                    navigate(`/game/${input}`, { state: { nickname } });
                } else {
                    Swal.fire(getAlertBody("Room does not exist. Please try again.", "question")); 
                }
            } catch (error) {
                console.error("Error checking room:", error);
                Swal.fire(getAlertBody("An error occurred while checking the room. Please try again.", "error"));
            }
        } else {
            // Create a new game
            try {
                // Fetch a new game ID
                const response = await fetch(`https://geochain-backend-00df5e12a638.herokuapp.com/api/create_game`);
                const data = await response.json();
                const gameId = data.gameId;
    
                // Navigate to the GameRoom with the nickname, timeLimit, and lives
                navigate(`/game/${gameId}`, { state: { nickname, timeLimit: time, lives } });
            } catch (error) {
                console.error("Error creating game:", error);
                Swal.fire(getAlertBody("An error occurred while creating the game", "error")); 
            }
        }
    };

    const handleTimeChange = (e) => {
        const newValue = parseInt(e.target.value, 10);
        setTime(Number.isNaN(newValue) || newValue < 1 ? 1 : newValue);
    };

    const handleLivesChange = (e) => {
        const newValue = parseInt(e.target.value, 10);
        setLives(Number.isNaN(newValue) ? 0 : newValue);
    }

    const getAlertBody = (title, icon) => {
        return (
            {
                title,
                icon,
                customClass: {
                    popup: 'swal-custom-popup',
                },
                confirmButtonText: 'OK',
                heightAuto: false, 
                position: "top"
            }
        )
    }

    return (
        <div className="game-wrapper-container">
            <Header />
            <div className="main-container">

                <div className="main-left">
                    <div>
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
                        </div>
                        
                        <h3>
                            {input.trim()? "" : "OR"}
                        </h3>

                        <button className="btn color-btn" id="create-btn" onClick={handleJoin}>
                            {!input.trim()? "Create a game" : "Join existing game"}
                        </button>
                    </div>
                </div>
                <div className="main-right">
                    <div className="join-container">
                        <p>Time per turn (secs)</p>
                        <input 
                            type="number"
                            value={time}
                            onChange={handleTimeChange}
                            className="join-input number-input"
                            step="30"
                            min="0"
                        />

                    </div>

                    <div className="join-container">
                        <p>Lives</p>
                        <input 
                            type="number"
                            value={lives}
                            onChange={handleLivesChange}
                            className="join-input number-input"
                            min="0"
                        />

                    </div>
                </div>
            </div>
            <div className="landing-footer">
                <a href="https://github.com/ldang04/CCS-Game">Source Code</a>
            </div>
        </div>
    );
};

export default NewGame;