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

    useEffect(() => {
        // Connect to socket
        const socket = io("http://localhost:3001"); // Connect to WebSocket server

        // Listen for updates to the locations list
        socket.on("update-locations", (updatedLocations) => {
            setLocations(updatedLocations); // Update the local state with the new list
        });

        socket.emit("join-room", gameId); // Join the WebSocket room
        setSocket(socket);

        // Listen for messages
        socket.on("message", (message) => {
            console.log(`Message from room ${gameId}:`, message);
        });

        // Update the current letter when the server broadcasts a change
        socket.on("update-current-letter", (newLetter) => {
            setCurrentLetter(newLetter); // Update the state with the new letter
        });

        // Cleanup on component unmount
        return () => {
            socket.disconnect();
        };
    }, [gameId]);

    const handleLocationEnter = () => {
        if (!input.trim()) return; // Prevent empty inputs
        if (input[0].toUpperCase() !== currentLetter) {
            alert(`Your answer must start with the letter "${currentLetter}"`);
            return;
        }

        // Emit the new location to the server
        socket.emit("add-location", { gameId, location: input });

        // Calculate the new current letter
        const lastLetter = input[input.length - 1].toUpperCase();

        // Emit the new current letter to the server
        socket.emit("change-current", { gameId, letter: lastLetter });

        // Clear the input field
        setInput("");
    };

    return (
        <div className="main-container">
            <Header />

            <div className="mid-container">
                <div className="places-list-container">
                    <ul>Previous answers:</ul>
                    {locations.map((location, index) => (
                        <li key={index}>{location}</li>
                    ))}
                </div>
                <Map />
            </div>

            <p>Current letter: {currentLetter} </p>
            <div className="input-container">
                <input
                    className="main-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button className="btn" onClick={handleLocationEnter}>
                    Enter
                </button>
            </div>
            
            <p>Game ID: {gameId}</p>
            <p>Share this link to invite others: {`http://localhost:3000/game/${gameId}`}</p>
        </div>
    );
};

export default GameRoom;
