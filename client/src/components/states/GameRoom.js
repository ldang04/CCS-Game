import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import Swal from "sweetalert2";

import "../../App.css";

import Map from "../helpers/Map";
import Header from "../helpers/Header";
import Timer from "../helpers/Timer";
import Lives from "../helpers/Lives";

const GameRoom = () => {
    const { gameId } = useParams();
    const { state } = useLocation();
    const [audio] = useState(new Audio("/assets/time-passing.mp3")); 

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
    const [timeLeft, setTimeLeft] = useState(null); // Initially null, to be set by server
    const [isStarted, setIsStarted] = useState(false); 
    const [isFlashing, setIsFlashing] = useState(false); 
    const [isGameEnded, setIsGameEnded] = useState(false);


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

    const handleStartGame = () => {
        if (socket) {
            socket.emit("start-game-pressed", { gameId });
        }
    };

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

    useEffect(() => {
        console.log(state);
    }, [])
    
    useEffect(() => {
        if (!socket) return;
    
        // Handle initialization for a new user
        socket.on("initialize-game", ({ locations, markers, currentLetter, users, currentTurn, timeLimit, timeLeft, timer}) => {
            console.log("GAME INITIALIZED")
            console.log("Initializing game with data:", { locations, markers, currentLetter, users, currentTurn, timeLimit });
            setLocations(locations);
            setMarkers(markers);
            setCurrentLetter(currentLetter);
            setUsers(users);
            setCurrentTurn(currentTurn);
            setTimeLeft(timeLeft); // Set timeLeft from server
        });
    
        // Listen for any new markers, and update the Map component using the incoming markers. 
        socket.on("add-marker", (markerData) => {
            console.log("Adding marker to map:", markerData);

            // Add the marker to the state. 
            setMarkers((prevMarkers) => [...prevMarkers, markerData]);
        });

        socket.on("location-error", (message) => {
            Swal.fire(getAlertBody(message, "warning")); 
        });

        socket.on("update-users", (updatedUsers) => {
            console.log("USERS UPDATED"); 
            setUsers(updatedUsers);
        });

        socket.on("game-started-error",() => {
            console.log("game started error"); 
            Swal.fire(getAlertBody("Game is already in session.", "warning"));
            navigate('/'); 
        })

        // Handle initialization for a new user
        socket.on("game-started", ({ currentLetter, currentTurn, timeLimit, timeLeft, timer, users, locations, isSolo}) => {
            console.log("GAME STARTED"); 
            setIsStarted(true);
            setCurrentLetter(currentLetter);
            setCurrentTurn(currentTurn);
            setTimeLimit(timeLimit);
            setTimeLeft(timeLeft);
            setIsSolo(isSolo); // Solo / multi can only be determined after game starts
        });

        socket.on("end-game", ({ reason, winner, totalLocations, isSolo }) => {
            setIsGameEnded(true);
            console.log("ENDING GAME");
            // navigate to the endScreen with appropriate payloads to display.
            console.log("End-game event received:", { reason, winner, totalLocations, isSolo });
            navigate("/endScreen", { 
                state: { 
                    reason, 
                    winner, 
                    totalLocations, 
                    isSolo,
                    markers // list of map markers
                } 
            });
        });

        socket.on("disconnect", () => {
            if (isGameEnded) return; // Do not navigate if game has ended
            let timestamp = new Date().toISOString(); // Get current time in ISO format
            console.log(`[${timestamp}] DISCONNECTED`);
            navigate("/"); 
            Swal.fire(getAlertBody("You disconnected", "error")); 
        }); 
        
        socket.on("update-locations", (updatedLocations) => {
            console.log("UPDATE LOCATIONS"); 
            setLocations(updatedLocations);
        });

        socket.on("update-users", (updatedUsers) => {
            console.log("UPDATE USERS"); 
            setUsers(updatedUsers);
        });

        socket.on("update-current-letter", (newLetter) => {
            console.log("UPDATE CURRENT LETTER"); 
            setCurrentLetter(newLetter);
        });

        socket.on("update-turn", (user) => {
            console.log("UPDATE TURN"); 
            setCurrentTurn(user);
        });

        socket.on("update-timeLeft", (updatedTimeLeft) => {
            console.log("time hit"); 
            setTimeLeft(updatedTimeLeft);
        });

        return () => {
            socket.off("initialize-game");
            socket.off("add-marker"); 
            socket.off("location-error");
            socket.off("game-started");
            socket.off("timer-notification");
            socket.off("update-locations");
            socket.off("update-users");
            socket.off("update-current-letter");
            socket.off("update-turn");
            socket.off("update-timeLeft");
            socket.off("end-game");
            socket.off("disconnect");
        };
    }, [socket, navigate]);

    // handle flashing red on timer countdown 
   
    useEffect(() => {
        if (timeLeft <= 5 && timeLeft > 0 && isStarted) {
            // Play sound in the last 5 seconds
            audio.loop = true;
            audio.play().catch((error) => console.error("Audio play error:", error));
        } else {
            // Stop sound when timer is no longer in the last 5 seconds
            audio.pause();
            audio.currentTime = 0;
        }

        return () => {
            // Cleanup: Ensure sound stops when component unmounts
            audio.pause();
            audio.currentTime = 0;
        };
    }, [timeLeft, audio]);


    useEffect(() => {
        // Prompt for nickname only once
        while (!nicknameRef.current.trim()) {
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

        const socket = io(`${process.env.REACT_APP_API_BASE_URL}`); // Connect to WebSocket server
        setSocket(socket);
        
        // Join specific room
        socket.emit("join-room", { 
            gameId, 
            nickname: nicknameRef.current, 
            timeLimit: state?.timeLimit || 60, // Fallback to default if state is null
            lives: state?.lives || 3 // Fallback to default if state is null
        });

        setIsJoined(true);

        return () => {
            let timestamp = new Date().toISOString(); // Get current time in ISO format
            console.log(`[${timestamp}] DISCONNECTING`);
            socket.disconnect();
        };
    }, [gameId]);

    const handleLocationEnter = () => {
        if (!input.trim()) return;
    
        if (input[0].toUpperCase() !== currentLetter) {
            Swal.fire(getAlertBody(`Your answer must start with the letter "${currentLetter}"`, "warning")); 

            return false;
        }
    
        // Emit the new location to the server
        socket.emit("add-location", { gameId, location: input });
    
        // Clear the input field immediately
        setInput("");
    };

    return (
        <div className={`game-wrapper-container`}>
            <Header />

            {!isJoined ? (
                <p>Loading...</p>
            ) : (
                <>
                {isStarted ? (
                    <Timer key={currentTurn?.id} timeLeft={timeLeft} />
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
                                        alignItems: "center",}}
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
                            <p className={`current-p ${isFlashing ? "flash-red" : ""}`}>
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
                                e.preventDefault();
                                handleLocationEnter()
                            }
                        }}
                        placeholder={`Enter a location starting with "${currentLetter}"`}
                        disabled={(currentTurn?.id !== socket?.id) || (!isStarted)} // Disable input if not user's turn
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
