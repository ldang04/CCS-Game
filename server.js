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
    socket.on("join-room", ({ gameId, nickname, time, lives }) => {
        // Check if the room exists
        if (!gameRooms[gameId]) {
            // Create a new room with the provided time and lives or default values
            gameRooms[gameId] = { 
                users: [], 
                locations: [], 
                currentLetter: "A", 
                currentTurnIndex: 0, 
                time: time ?? 60, // Use provided time or default to 60
                lives: lives ?? 3  // Use provided lives or default to 3
            };
        }
    
        // Add the user to the room
        const user = { id: socket.id, name: nickname, lives: gameRooms[gameId].lives };
        gameRooms[gameId].users.push(user);
        socket.join(gameId);
    
        // Broadcast the updated user list and turn to the room
        io.to(gameId).emit("update-users", gameRooms[gameId].users);
        io.to(gameId).emit("update-turn", gameRooms[gameId].users[gameRooms[gameId].currentTurnIndex]);
    
        console.log(`User ${nickname} joined room ${gameId}`);
    });
    

    // Handle adding a location
    socket.on("add-location", ({ gameId, location }) => {
        if (!gameRooms[gameId]) return;

        const room = gameRooms[gameId];

        // Add the location to the room's location list
        room.locations.push(location);

        // Advance to the next turn
        room.currentTurnIndex = (room.currentTurnIndex + 1) % room.users.length;
        const nextTurnUser = room.users[room.currentTurnIndex];

        // Broadcast the updated locations list and next turn
        io.to(gameId).emit("update-locations", room.locations);
        io.to(gameId).emit("update-turn", nextTurnUser);

        console.log(`Location added in room ${gameId}: ${location}`);
    });

    // Handle changing the current letter
    socket.on("change-current", ({ gameId, letter }) => {
        if (!gameRooms[gameId]) return;

        // Update the current letter for the room
        gameRooms[gameId].currentLetter = letter;

        // Broadcast the updated current letter
        io.to(gameId).emit("update-current-letter", letter);

        console.log(`Current letter updated in room ${gameId}: ${letter}`);
    });

    // Handle user disconnecting
    socket.on("disconnect", () => {
        console.log(`User ${socket.id} disconnected`);

        // Remove the user from the room they were in
        for (const gameId in gameRooms) {
            const room = gameRooms[gameId];
            const userIndex = room.users.findIndex((user) => user.id === socket.id);

            if (userIndex !== -1) {
                room.users.splice(userIndex, 1);

                // Adjust the current turn index if necessary
                if (room.currentTurnIndex >= userIndex) {
                    room.currentTurnIndex = (room.currentTurnIndex - 1 + room.users.length) % room.users.length;
                }

                // Broadcast the updated user list and turn
                io.to(gameId).emit("update-users", room.users);
                if (room.users.length > 0) {
                    const nextTurnUser = room.users[room.currentTurnIndex];
                    io.to(gameId).emit("update-turn", nextTurnUser);
                }
            }
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

app.get('/check-room/:roomId', (req, res) => {
    const { roomId } = req.params;
    const roomExists = Boolean(gameRooms[roomId]); // Check if the room exists in the gameRooms object
    res.json({ exists: roomExists });
});

// Start the server
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
