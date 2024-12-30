import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";

import "../../App.css";

import Map from "../helpers/Map";
import Header from "../helpers/Header";

const GameRoom = () => {
<<<<<<< HEAD
    // socket setup 
    const { gameId } = useParams(); 
    const [socket, setSocket] = useState(null); 
    const [locations, setLocations] = useState([]); 
=======
	// socket setup
	const { gameId } = useParams();
	const [socket, setSocket] = useState(null);
>>>>>>> e5ad8c684f2d7249e2e4eb66b50d62d7599e6ee4

	const [currentLetter, setCurrentLetter] = useState("A");
	const [input, setInput] = useState("");
	const [answerList, setAnswerList] = useState([]);

	useEffect(() => {
		// connect to socket
		const socket = io("http://localhost:3001"); // Connect to WebSocket server

<<<<<<< HEAD
        // Listen for updates to the locations list
        socket.on("update-locations", (updatedLocations) => {
            setLocations(updatedLocations); // Update the local state with the new list
        });

        socket.emit('join-room', gameId); // Join the WebSocket room
        setSocket(socket);
=======
		socket.emit("join-room", gameId); // Join the WebSocket room
		setSocket(socket);
>>>>>>> e5ad8c684f2d7249e2e4eb66b50d62d7599e6ee4

		socket.on("message", (message) => {
			console.log(`Message from room ${gameId}:`, message);
		});

<<<<<<< HEAD
         // Update the current letter when the server broadcasts a change
        socket.on("update-current-letter", (newLetter) => {
            setCurrentLetter(newLetter); // Update the state with the new letter
        });
        
        // Cleanup on component unmount
        return () => {
            socket.disconnect();
        };
    }, []); 

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
    }

    return (
        <div className="main-container">
            <Header />

            <div className="mid-container">
                <div className="places-list-container">
                    <ul>Previous answers</ul>

                    {locations.map((location, index) => (
                        <li key={index}>{location}</li>
                    ))}
                </div>
                
                <Map />
            </div>
=======
		// Cleanup on component unmount
		return () => {
			socket.disconnect();
		};
	}, []);

	return (
		<div className="main-container">
			<Header />

			<div className="mid-container">
				<div className="places-list-container">
					<ul>Previous answers</ul>
				</div>
>>>>>>> e5ad8c684f2d7249e2e4eb66b50d62d7599e6ee4

				<Map />
			</div>

<<<<<<< HEAD
            <div className="input-container">
                <input
                    className="main-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button className="btn" onClick={handleLocationEnter}>Enter</button>
            </div>
=======
			<p>Current letter: {currentLetter}</p>
>>>>>>> e5ad8c684f2d7249e2e4eb66b50d62d7599e6ee4

			<div className="input-container">
				<input
					className="main-input"
					type="text"
					value={input}
					onChange={(e) => setInput(e.target.value)}
				/>
				<button className="btn" onClick={() => console.log("clicked")}>
					Enter
				</button>
			</div>

			<p>Game ID: {gameId}</p>
			<p>
				Share this link to invite others:{" "}
				{`http://localhost:3000/game/${gameId}`}
			</p>
		</div>
	);
};

export default GameRoom;
