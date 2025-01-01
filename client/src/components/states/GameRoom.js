import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import "../../App.css";

import Map from "../helpers/Map";
import Header from "../helpers/Header";
import Timer from "../helpers/Timer";
import Lives from "../helpers/Lives";

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
    const [isSolo, setIsSolo] = useState(false); // Check if the game is solo
    const [currentTurn, setCurrentTurn] = useState(null); // User whose turn it is
    const [copyLinkSuccess, setCopyLinkSuccess] = useState(false); // Track copy status
    const [copyIdSuccess, setCopyIdSuccess] = useState(false); // Track copy status
    const [markers, setMarkers] = useState([]); // Track Map markers
    const [timeLimit, setTimeLimit] = useState(null); // Initially null, to be set by server
    const [isStarted, setIsStarted] = useState(false); 

    const nicknameRef = useRef(state?.nickname || ""); // Use ref to handle immediate nickname logic
    const hasCheckedRoom = useRef(false); // Declare useRef at the top level of the component

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

    const handleStartGame = () => {
        console.log("clicked start game");
        console.log(isStarted);
        if (socket) {
            socket.emit("start-game-pressed", { gameId });
        }
    };    

    // handle room not existing
    useEffect(() => {    
        console.log("from initialize room");
        const initializeRoom = async () => {
            if (hasCheckedRoom.current) return; // Skip if already checked
            hasCheckedRoom.current = true; // Mark as checked
            
            try {
                // Fetch room existence status from the server
                const response = await fetch(`http://localhost:3001/check-room/${gameId}`);
                const data = await response.json();
    
                if (!data.exists) {
                    console.log("does not exist identified");
                    alert("Room does not exist. Redirecting to the home page.");
                    navigate("/"); // Redirect to home if the room doesn't exist
                    return; // Exit early to prevent nickname prompt
                }
    
                // Room exists, prompt for nickname
                if (!nicknameRef.current.trim()) {
                    let userNickname = "";
                    do {
                        userNickname = prompt("Please enter your nickname:").trim();
                    } while (!userNickname);
    
                    nicknameRef.current = userNickname; // Set ref value
                    setNickname(userNickname); // Update state for reactivity
                }
            } catch (error) {
                console.error("Error checking room existence:", error);
                alert("An error occurred while checking the room. Please try again later.");
                navigate("/"); // Redirect to home on error
            }
        };
        
        if(!nicknameRef.current || !nicknameRef.current.trim()){
            console.log("no nickname ref");
            initializeRoom();
        } else {
            console.log("from return");
            return;
        }
    }, [gameId, navigate]);
    
    
    useEffect(() => {
        if (!socket) return;
    
        // Handle initialization for a new user
        socket.on("initialize-game", ({ locations, markers, currentLetter, users, currentTurn, timeLimit, isStarted }) => {
            console.log("Initializing game with data:", { locations, markers, currentLetter, users, currentTurn, timeLimit, isStarted });
            setLocations(locations);
            setMarkers(markers);
            setCurrentLetter(currentLetter);
            setUsers(users);
            setCurrentTurn(currentTurn);
            setTimeLimit(timeLimit); // Set timeLimit from server
            setIsStarted(isStarted);
        });
    
        // Listen for any new markers, and update the Map component using the incoming markers. 
        socket.on("add-marker", (markerData) => {
            console.log("Adding marker to map:", markerData);

            // Add the marker to the state. 
            setMarkers((prevMarkers) => [...prevMarkers, markerData]);
        });

        socket.on("location-error", (message) => {
            alert(message); // Show the error message
        });

        socket.on("update-users", (updatedUsers) => {
            setUsers(updatedUsers);
        });

        socket.on("game-started-error",() => {
            alert("Game is already in session."); 
            navigate('/'); 
        })

        // Handle initialization for a new user
        socket.on("game-started", ({ currentLetter, currentTurn, timeLimit, users, locations, isSolo}) => {
            setIsStarted(true);
            setCurrentLetter(currentLetter);
            setCurrentTurn(currentTurn);
            setTimeLimit(timeLimit);
            setIsSolo(isSolo); // Solo / multi can only be determined after game starts
        });

        socket.on("end-game", () => {
            alert("Game has ended.");
        });

        return () => {
            socket.off("initialize-game");
            socket.off("add-marker"); 
            socket.off("location-error");
            socket.off("game-started");
        };
    }, [socket]);

    useEffect(() => {
        if (!nicknameRef.current) return; // Ensure nickname is set

        const socket = io("http://localhost:3001"); // Connect to WebSocket server
        setSocket(socket);

        // Join specific room
        socket.emit("join-room", { 
            gameId, 
            nickname: nicknameRef.current, 
            time: state?.timeLimit || 60, // Fallback to default if state is null
            lives: state?.lives || 3 // Fallback to default if state is null
        });

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

    // Need to first get the current user's life, then update it at TimeOut. 
    // currentTurn is only a reference to the object of the current user. 
    const getCurrentUser = () => {
        const currentUserId = socket.id;
        return users.find(user => user.id === currentUserId);
    };

    const handleTimeOut = () => {
        if (currentTurn?.id === socket?.id) {
            // If the time is out, check and update the current player's life. 
            const currentUser = getCurrentUser();
            if (currentUser.lives > 0) {
                socket.emit("update-life", { gameId, userId: socket.id, newLives: currentUser.lives - 1 }); 
                socket.emit("pass-turn", { gameId });
            }
            else { // player has lost
                alert("You have no more lives left. You're out...");
                // 1. Solo: End the game
                if (isSolo) {
                    socket.emit("end-game", { gameId });
                }
                // 2. Multi: End only if one player with non-zero lives is left
                else {
                    const remainingPlayers = users.filter(user => user.lives > 0);
                    if (remainingPlayers.length <= 1) {
                        socket.emit("end-game", { gameId });
                    } else {
                        socket.emit("pass-turn", { gameId });
                    }
                }
                
            }

        }
    };

    return (
        <div className="game-wrapper-container">
            <Header />

            {!isJoined ? (
                <p>Loading...</p>
            ) : (
                <>
                {isStarted ? (
                    <Timer key={currentTurn?.id} timeLimit={timeLimit} onTimeOut={handleTimeOut} />
                ) : (
                    <>
                    </>
                )}
                    <div className="mid-container">
                        <div className="users-list-container">
                            <ul>
                                <li className="li-header">Players</li>
                                {users.map((user) => (
                                    <li className="user-li" 
                                        key={user.id} 
                                        style={{ fontWeight: user.id === currentTurn?.id ? "bold" : "normal",
                                        display: "flex",
                                        alignItems: "center",
                                        color: user.isActive ? "black" : "gray",
                                        textDecorationLine: user.active ? "none" : "lineThrough",
                                    }}
                                    >
                                        <Lives numLives={user.lives} />
                                        <span>{user.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <Map markers={markers} /> {/* Pass markers to Map */}
                        <div className="places-list-container hide">
                            <p className="li-header">Previous:</p>
                            
                            <ul id="previous-ul">
                                {locations.map((location, index) => (
                                    <li key={index}>{location}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    
                    
                    {!isStarted ? (
                        <button onClick={handleStartGame} className="btn color-btn">
                            Start Game
                        </button>
                    ) : (
                        <>
                            <p className="current-p">
                                Current letter: {currentLetter},{" "}
                                {currentTurn?.id === socket?.id ? "Your turn" : `${currentTurn?.name}'s turn`}
                            </p>
                        </>
                    )}

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
                        disabled={(currentTurn?.id !== socket?.id) || !isStarted} // Disable input if not user's turn
                    />
                </div>

                <div className="places-list-container-compact show">
                        <p className="li-header">Previous:</p>
                        
                        <ul id="previous-ul">
                            {locations.map((location, index) => (
                                <li key={index}>{location}</li>
                            ))}
                        </ul>
                    </div>

                <div className="footer-container">
                    <p>
                        Join code: {gameId}{" "}
                        <button onClick={handleCopyGameId} className="copy-btn">{copyIdSuccess ? "✅" : "🔗"}</button>
                    </p>

                    <p>
                        Share this link to invite others: {`http://localhost:3000/game/${gameId}`}{" "}
                        <button onClick={handleCopyLink} className="copy-btn">{copyLinkSuccess ? "✅" : "🔗"}</button>
                    </p>
                </div>
                
                </>
            )}
        </div>
    );
    
};



export default GameRoom;
