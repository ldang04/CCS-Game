import React from "react";
import { useNavigate } from "react-router-dom";
import '../../App.css'; 

const Header = () => {
    const navigate = useNavigate()
    return (
        <div className="header-container">
            <h1 onClick={() => navigate("/")}>Geochain.io</h1>
            <p>Chain countries, cities, and states by their last letters!</p>
        </div>
    )
}

export default Header; 