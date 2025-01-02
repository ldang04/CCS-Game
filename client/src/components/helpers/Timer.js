import React, { useState, useEffect } from "react";

const Timer = ({ timeLeft }) => {
    
    return <div className="timer">Time Remaining: {timeLeft}s</div>;
};

export default Timer;
