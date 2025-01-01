import React, { useState, useEffect } from 'react';

const Timer = ({ initialTime, onTimeOut }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime); // Timer state

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeOut(); // Trigger timeout action
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearInterval(timer); // Cleanup on unmount
    }, [timeLeft, onTimeOut]);

    return (
        <div className="timer">
            <p>Time Remaining: {timeLeft}s</p>
        </div>
    );
};

export default Timer;