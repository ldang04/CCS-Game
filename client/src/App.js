import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { io } from 'socket.io-client';
import "./App.css"; 

// component imports 
import NewGame from './components/states/NewGame';
import GameRoom from './components/states/GameRoom';
import EndScreen from "./components/states/EndScreen";

const App = () => {
    //  game states
    const [gameState, setGameState] = useState(0); // 0: New Game 1: Playing 2: End
   
    return (
        <Router>
            <Routes>
                <Route path="/" element={<NewGame />} />
                <Route path="/game/:gameId" element={<GameRoom />} />
                <Route path="/endScreen" element={<EndScreen />} />
            </Routes>
        </Router>
    );
}

export default App;