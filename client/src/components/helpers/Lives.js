import React from "react";
import '../../App.css'; 

const Lives = ({ numLives }) => {
    const heartImage = `${process.env.PUBLIC_URL}/assets/lives_heart.png`; // Public URL for the image
    return (
        <div className="lives-container">
            <img src={heartImage} alt="Heart" className="heart-image" />
            <span className="lives-count">{numLives}</span>
        </div>
    );
};

export default Lives;
