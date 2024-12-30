import React, {useState, useEffect} from "react";
import { useParams } from 'react-router-dom'; 
import { io } from "socket.io-client";

import '../../App.css'

import Map from "../helpers/Map";
import Header from "../helpers/Header";

const GameRoom = () => {
    // socket setup 
    const { gameId } = useParams(); 
    const [socket, setSocket] = useState(null); 

    const [currentLetter, setCurrentLetter] = useState("A"); 
    const [input, setInput] = useState('');
    const [answerList, setAnswerList] = useState([]); 

    useEffect(() => { // connect to socket
        const socket = io('http://localhost:3001'); // Connect to WebSocket server

        socket.emit('join-room', gameId); // Join the WebSocket room
        setSocket(socket);

        socket.on('message', (message) => {
            console.log(`Message from room ${gameId}:`, message);
        });

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
                
                <Map />
            </div>

            <p>Current letter: {currentLetter}</p>

            <div className="input-container">
                <input
                    className="main-input"
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                />
                <button className="btn" onClick={() => console.log("clicked")}>Enter</button>
            </div>

            <p>Game ID: {gameId}</p>
            <p>Share this link to invite others: {`http://localhost:3000/game/${gameId}`}</p>
        </div>
    )
}

export default GameRoom;