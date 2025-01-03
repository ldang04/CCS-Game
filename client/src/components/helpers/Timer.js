import React, { useState, useEffect } from "react";

const Timer = ({ timeLeft }) => {
    const [isFlashing, setIsFlashing] = useState(false); 
    
    useEffect(() => {
        if (timeLeft !== null && timeLeft <= 5) {
            setIsFlashing(true);
        } else {
            setIsFlashing(false);
        }
    }, [timeLeft]);

    return <div className={`timer ${isFlashing ? "flash-red" : ""}`}>Time Remaining: {timeLeft}s</div>;
};

export default Timer;
