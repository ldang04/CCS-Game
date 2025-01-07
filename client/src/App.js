import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css"; 

// component imports 
import NewGame from './components/states/NewGame';
import GameRoom from './components/states/GameRoom';
import EndScreen from "./components/states/EndScreen";

const App = () => {
   
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