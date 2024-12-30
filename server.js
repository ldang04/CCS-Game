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

const gameRooms = {}; // Store users and game data for each room

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Handle user joining a room
    socket.on("join-room", ({ gameId, userName }) => {
        if (!gameRooms[gameId]) {
            gameRooms[gameId] = { users: [], locations: [], currentLetter: "A" };
        }

        // Add the user to the room
        gameRooms[gameId].users.push({ id: socket.id, name: userName });
        socket.join(gameId);

        // Broadcast the updated user list to everyone in the room
        io.to(gameId).emit("update-users", gameRooms[gameId].users);

        console.log(`User ${userName} joined room ${gameId}`);
    });

    // Handle adding a location
    socket.on("add-location", ({ gameId, location }) => {
        if (!gameRooms[gameId]) return;

        // Add the location to the room's location list
        gameRooms[gameId].locations.push(location);

        // Broadcast the updated locations list to everyone in the room
        io.to(gameId).emit("update-locations", gameRooms[gameId].locations);

        console.log(`Location added in room ${gameId}: ${location}`);
    });

    // Handle changing the current letter
    socket.on("change-current", ({ gameId, letter }) => {
        if (!gameRooms[gameId]) return;

        // Update the current letter for the room
        gameRooms[gameId].currentLetter = letter;

        // Broadcast the updated current letter to everyone in the room
        io.to(gameId).emit("update-current-letter", letter);

        console.log(`Current letter updated in room ${gameId}: ${letter}`);
    });

    // Handle user disconnecting
    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);

        // Remove the user from the room they were in
        for (const gameId in gameRooms) {
            gameRooms[gameId].users = gameRooms[gameId].users.filter(
                (user) => user.id !== socket.id
            );

            // Broadcast the updated user list
            io.to(gameId).emit("update-users", gameRooms[gameId].users);
        }
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
