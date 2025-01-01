import React, { useState, useEffect } from "react";

const Timer = ({ timeLimit, onTimeOut }) => {
    const [timeLeft, setTimeLeft] = useState(timeLimit);

    useEffect(() => {
        setTimeLeft(timeLimit); // Reset timer whenever timeLimit changes
    }, [timeLimit]);

    useEffect(() => {
        if (timeLeft <= 0) {
            onTimeOut();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, onTimeOut]);

    return <div className="timer">Time Remaining: {timeLeft}s</div>;
};

export default Timer;
