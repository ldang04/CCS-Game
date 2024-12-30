import React, {useEffect, useState} from "react";
import '../../App.css'; 

import Header from "../helpers/Header";

const NewGame = () => {
    const [gameLink, setGameLink] = useState(null); 

    useEffect(() => { // create a unique game id on render
        const fetchGameLink = async () => {
            const link = await createGame(); // Wait for the async function
            setGameLink(link); // Update the state with the resolved link
        };

        fetchGameLink(); // Call the async function
    }, [])

    return (
        <div className="main-container">
            <Header />

            <button className="btn create-btn" onClick={handleCreateGame}>
                Create a new game
            </button>

            {/* @todo: Create a join option */}
        </div>
    )
}

const createGame = async () => {
    const response = await fetch('http://localhost:3001/create-game');
    const data = await response.json();
    const gameLink = `http://localhost:3000/game/${data.gameId}`;
   
    return gameLink; 
};

const handleCreateGame = () => {
    console.log("clicked"); 
}

export default NewGame;