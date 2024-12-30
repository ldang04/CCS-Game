const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);

// Allow CORS for Express routes (optional, for REST APIs)
app.use(cors());

// WEB SOCKET CONFIG ===========================================================================================================================

// Initialize Socket.IO with CORS settings
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // React app URL
        methods: ["GET", "POST"],
    },
});

const gameRooms = {}; // Store locations for each game room

// Handle connections to websocket
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join room
    socket.on("join-room", (gameId) => {
        socket.join(gameId);
        console.log(`User ${socket.id} joined room ${gameId}`);

        // Send the current locations to the newly joined user
        if (gameRooms[gameId]) {
            socket.emit("update-locations", gameRooms[gameId]);
        } else {
            gameRooms[gameId] = []; // Initialize the room if it doesn't exist
        }
    });

    // Add location to a room
    socket.on("add-location", ({ gameId, location }) => {
        if (!gameRooms[gameId]) {
            gameRooms[gameId] = [];
        }

        // Add the location to the list and broadcast to all users in the room
        gameRooms[gameId].push(location);
        io.to(gameId).emit("update-locations", gameRooms[gameId]);
    });

    // Change the current letter
    socket.on("change-current", ({ gameId, letter }) => {
        if (!gameRooms[gameId]) {
            gameRooms[gameId] = []; // Initialize room if it doesn't exist
        }
    
        // Broadcast the new current letter to all users in the room
        io.to(gameId).emit("update-current-letter", letter);
    });

    // Disconnect
    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);
    });
});

// API routes ==============================================================================================================
app.get("/", (req, res) => {
    res.send("Hello, world!"); 
});

app.get('/create_game', (req, res) => {
    const gameId = uuidv4(); // Generate a unique ID for the game
    res.json({ gameId }); // Send the game ID back to the client
});

// Start the server
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});