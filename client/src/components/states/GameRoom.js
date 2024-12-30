import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

import "../../App.css";

import Map from "../helpers/Map";
import Header from "../helpers/Header";

const GameRoom = () => {
    const { gameId } = useParams();
    const [socket, setSocket] = useState(null);
    const [locations, setLocations] = useState([]);
    const [currentLetter, setCurrentLetter] = useState("A");
    const [input, setInput] = useState("");
    const [userName, setUserName] = useState("");
    const [isJoined, setIsJoined] = useState(false);
    const [users, setUsers] = useState([]); // List of users in the room
    const [currentTurn, setCurrentTurn] = useState(null); // User whose turn it is

    useEffect(() => {
        const socket = io("http://localhost:3001"); // Connect to WebSocket server
        setSocket(socket);

        // Listen for updates to the locations list
        socket.on("update-locations", (updatedLocations) => {
            setLocations(updatedLocations);
        });

        // Listen for updates to the user list
        socket.on("update-users", (updatedUsers) => {
            setUsers(updatedUsers);
        });

        // Listen for changes to the current letter
        socket.on("update-current-letter", (newLetter) => {
            setCurrentLetter(newLetter);
        });

        // Listen for turn updates
        socket.on("update-turn", (turnUser) => {
            setCurrentTurn(turnUser);
        });

        return () => {
            socket.disconnect();
        };
    }, [gameId]);

    const handleJoinRoom = () => {
        if (!userName.trim()) {
            alert("Please enter your name.");
            return;
        }

        // Emit the join-room event with the gameId and userName
        socket.emit("join-room", { gameId, userName });

        // Set the joined status to true
        setIsJoined(true);
    };

    const handleLocationEnter = () => {
        if (!input.trim()) return;

        if (input[0].toUpperCase() !== currentLetter) {
            alert(`Your answer must start with the letter "${currentLetter}"`);
            return;
        }

        // Emit the new location to the server
        socket.emit("add-location", { gameId, location: input });

        // Emit the new current letter to the server
        const lastLetter = input[input.length - 1].toUpperCase();
        socket.emit("change-current", { gameId, letter: lastLetter });

        setInput("");
    };

    return (
        <div className="main-container">
            <Header />

            {!isJoined ? (
                <div className="join-container input">
                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                    />
                    <button onClick={handleJoinRoom}>Join Room</button>
                </div>
            ) : (
                <>
                    <div className="users-container">
                        <h3>Players:</h3>
                        <ul>
                            {users.map((user) => (
                                <li key={user.id} style={{ fontWeight: user.id === currentTurn?.id ? "bold" : "normal" }}>
                                    {user.name}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mid-container">
                        <div className="places-list-container">
                            <ul>
                                <li>Previous answers:</li>
                                {locations.map((location, index) => (
                                    <li key={index}>{location}</li>
                                ))}
                            </ul>
                        </div>
                        <Map />
                    </div>

                    <p>
                        Current letter: {currentLetter},{" "}
                        {currentTurn?.id === socket.id ? "Your turn" : `${currentTurn?.name}'s turn`}
                    </p>

                    <div className="input-container">
                        <input
                            className="main-input"
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={currentTurn?.id !== socket.id} // Disable input if not user's turn
                        />
                        <button
                            className="btn"
                            onClick={handleLocationEnter}
                            disabled={currentTurn?.id !== socket.id} // Disable button if not user's turn
                        >
                            Enter
                        </button>
                    </div>

                    <p>Game ID: {gameId}</p>
                    <p>Share this link to invite others: {`http://localhost:3000/game/${gameId}`}</p>
                </>
            )}
        </div>
    );
};

export default GameRoom;
