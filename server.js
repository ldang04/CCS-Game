const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// Allow CORS for Express routes (optional, for REST APIs)
app.use(cors());

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // React app URL
        methods: ["GET", "POST"],
    },
});

// Handle Socket.IO connections
io.on('connection', (socket) => {
    console.log(`A user connected: ${socket.id}`);

    // welcome to the server! 
    socket.emit('message', 'Welcome to the server!');

    socket.on('message', (data) => {
        console.log(`Message received: ${data}`);
        io.emit('message', data); // Broadcast to all clients

    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});


app.get("/", (req, res) => {
    res.send("Hello, world!"); 
});

// Start the server
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});