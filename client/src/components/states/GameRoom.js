import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import "../../App.css";

import Map from "../helpers/Map";
import Header from "../helpers/Header";

const GameRoom = () => {
    const { gameId } = useParams();
    const { state } = useLocation();

    // State and Refs
    const [nickname, setNickname] = useState("");
    const [socket, setSocket] = useState(null);
    const [locations, setLocations] = useState([]);
    const [currentLetter, setCurrentLetter] = useState("A");
    const [input, setInput] = useState("");
    const [isJoined, setIsJoined] = useState(false);
    const [users, setUsers] = useState([]); // List of users in the room
    const [currentTurn, setCurrentTurn] = useState(null); // User whose turn it is
    const [copyLinkSuccess, setCopyLinkSuccess] = useState(false); // Track copy status
    const [copyIdSuccess, setCopyIdSuccess] = useState(false); // Track copy status
    const [markers, setMarkers] = useState([]); // Track Map markers

    const nicknameRef = useRef(state?.nickname || ""); // Use ref to handle immediate nickname logic
    const navigate = useNavigate(); 

    const handleCopyGameId = () => {
        navigator.clipboard.writeText(gameId)
            .then(() => setCopyIdSuccess(true))
            .catch(() => setCopyIdSuccess(false));
    };

    const handleCopyLink = () => {
        const gameLink = `http://localhost:3000/game/${gameId}`;
        navigator.clipboard.writeText(gameLink)
            .then(() => setCopyLinkSuccess(true))
            .catch(() => setCopyLinkSuccess(false));
    };

    useEffect(() => {
        if (socket) {
            socket.on("location-error", (message) => {
                alert(message); // Show the error message
            });

            socket.on("game-started-error",() => {
                alert("Game is already in session."); 
                navigate('/'); 
            })
        }
    
        return () => {
            if (socket) {
                socket.off("location-error");
            }
        };
    }, [socket]);

    // Listen for any new markers, and update the Map component using the incoming markers. 
    useEffect(() => {
        if (!socket) return;

        socket.on("add-marker", (markerData) => {
            console.log("Adding marker to map:", markerData);

            // Add the marker to the state. 
            setMarkers((prevMarkers) => [...prevMarkers, markerData]);
        });

        return () => {
            socket.off("add-marker"); // Cleanup listener on component unmount
        };
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
    
        // Handle initialization for a new user
        socket.on("initialize-game", ({ locations, markers, currentLetter, users, currentTurn }) => {
            console.log("Initializing game with data:", { locations, markers, currentLetter, users, currentTurn });
            setLocations(locations); // Set previous locations
            setMarkers(markers); // Set previous markers
            setCurrentLetter(currentLetter); // Set the current letter
            setUsers(users); // Set the user list
            setCurrentTurn(currentTurn); // Set the current turn
        });
    
        return () => {
            socket.off("initialize-game");
        };
    }, [socket]);

    useEffect(() => {
        // Prompt for nickname only once
        if (!nicknameRef.current.trim()) {
            let userNickname = "";
            do {
                userNickname = prompt("Please enter your nickname:").trim();
            } while (!userNickname);
            nicknameRef.current = userNickname; // Set ref value
            setNickname(userNickname); // Update state for reactivity
        }
    }, []);

    useEffect(() => {
        if (!nicknameRef.current) return; // Ensure nickname is set

        const socket = io("http://localhost:3001"); // Connect to WebSocket server
        setSocket(socket);

        // Join specific room
        socket.emit("join-room", { gameId, nickname: nicknameRef.current });

        setIsJoined(true);

        // Listen for updates
        socket.on("update-locations", (updatedLocations) => {
            setLocations(updatedLocations);
        });

        socket.on("update-users", (updatedUsers) => {
            setUsers(updatedUsers);
        });

        socket.on("update-current-letter", (newLetter) => {
            setCurrentLetter(newLetter);
        });

        socket.on("update-turn", (turnUser) => {
            setCurrentTurn(turnUser);
        });

        return () => {
            socket.disconnect();
        };
    }, [gameId]);

    const handleLocationEnter = () => {
        if (!input.trim()) return;
    
        if (input[0].toUpperCase() !== currentLetter) {
            alert(`Your answer must start with the letter "${currentLetter}"`);
            return;
        }
    
        // Emit the new location to the server
        socket.emit("add-location", { gameId, location: input });
    
        // Clear the input field immediately
        setInput("");
    };
    

    const validateLocation = async (gameId, location) => {
        try {
            const response = await fetch("http://localhost:3001/validate_location", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ gameId, location }), // Send gameId and location as the payload
            });
            
            const data = await response.json(); 
            
            return data;
        } catch (error) {
            console.error("Error validating location:", error);
            return null;
        }
    };

    return (
        <div className="game-wrapper-container">
            <Header />

            {!isJoined ? (
                <p>Loading...</p>
            ) : (
                <>
                    <div className="mid-container">
                        <div className="users-list-container">
                            <ul>
                                <li className="li-header">Players</li>
                                {users.map((user) => (
                                    <li className="user-li" key={user.id} style={{ fontWeight: user.id === currentTurn?.id ? "bold" : "normal" }}>
                                        {user.name}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Map markers={markers} /> {/* Pass markers to Map */}
                        <div className="places-list-container">
                            <ul id="previous-ul">
                                <li className="li-header">Previous:</li>
                                {locations.map((location, index) => (
                                    <li key={index}>{location}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    
                    <p className="current-p">
                        Current letter: {currentLetter},{" "}
                        {currentTurn?.id === socket?.id ? "Your turn" : `${currentTurn?.name}'s turn`}
                    </p>

                    <div className="input-container">
                        <input
                            className="main-input"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === "Enter"){
                                    handleLocationEnter()
                                }
                            }}
                            placeholder={`Enter a location starting with "${currentLetter}"`}
                            disabled={currentTurn?.id !== socket?.id} // Disable input if not user's turn
                        />
                    </div>

                    <p>
                    Join code: {gameId}{" "}
                    <button onClick={handleCopyGameId} className="copy-btn">{copyIdSuccess ? "✅" : "🔗"}</button>
                </p>

                <p>
                    Share this link to invite others: {`http://localhost:3000/game/${gameId}`}{" "}
                    <button onClick={handleCopyLink} className="copy-btn">{copyLinkSuccess ? "✅" : "🔗"}</button>
                </p>
                </>
            )}
        </div>
    );
    
};



export default GameRoom;
