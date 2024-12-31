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
    socket.on("join-room", ({ gameId, nickname }) => {
        // Creating a new room if the gameID doesn't yet exist. 
        if (!gameRooms[gameId]) {
            gameRooms[gameId] = { users: [], locations: [], currentLetter: "A", currentTurnIndex: 0 };
        }
        
        // Else, room exists: add the user to the room with an id and nickname
        const user = { id: socket.id, name: nickname };
        gameRooms[gameId].users.push(user);
        socket.join(gameId);
    
        // Broadcast the updated user list to everyone in the room
        io.to(gameId).emit("update-users", gameRooms[gameId].users);
    
        // Always broadcast the current turn user
        const currentTurnUser = gameRooms[gameId].users[gameRooms[gameId].currentTurnIndex];
        io.to(gameId).emit("update-turn", currentTurnUser);
    
        console.log(`User ${nickname} joined room ${gameId}`);
    });

    // Before adding location, valdiate answer. 
    const stringSimilarity = require("string-similarity");

    function validateLocation(input) {
        // Normalize input to format of locationMap key. 
        const inputName = input.toLowerCase().trim();
    
        // Find the closest match in the hashmap. Parse thru all keys. 
        const keys = Array.from(locationsMap.keys());
        const { bestMatch } = stringSimilarity.findBestMatch(inputName, keys);
    
        if (bestMatch.rating > 0.8) { // Threshold for similarity set at 0.8. 
            const location = locationsMap.get(bestMatch.target);
    
            if (location.isGuessed) {
                return { success: false, message: `"${bestMatch.target}" has already been guessed!` };
            } else {
                // Mark the location as guessed and return it
                location.isGuessed = true;
                return { success: true, location_data: location };
            }
        } else {
            return { success: false, message: `"${input}" is not a valid location!` };
        }
    }
    
    // Handle adding a location
    socket.on("add-location", ({ gameId, location }) => {
        if (!gameRooms[gameId]) return;
        
        // Returns success if guess is valid. 
        const validationResponse = validateLocation(location);
        
        if (validationResponse.success) {
            const room = gameRooms[gameId];

            // Add the location to the room's location list
            // In this case, we want the standard naming of the location, and not the raw guess, to be added to the locations list. 
            const location_data = validationResponse.location_data;
            room.locations.push(location_data.name_standard);
            
            // Advance to the next turn
            room.currentTurnIndex = (room.currentTurnIndex + 1) % room.users.length;
            const nextTurnUser = room.users[room.currentTurnIndex];
    
            // Broadcast the updated locations list and next turn
            io.to(gameId).emit("update-locations", room.locations);
            io.to(gameId).emit("update-turn", nextTurnUser);
    
            console.log(`Location added in room ${gameId}: ${location}`);
        }

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

// Location hashmap. ==============================================================================================================
// libraries to create the hashmap. 
const fs = require('fs');
const csv = require('csv-parser');

class LocationData {
    constructor(latitude, longitude, name_standard) {
        this.isGuessed = false; // Initially, no location is guessed
        this.latitude = latitude;
        this.longitude = longitude;
        this.name_standard = name_standard;
    }
}

// HashMap for locations
const locationsMap = new Map();

// Load CSV data into the locationsMap
function loadLocations(csvFilePath) {
    return new Promise((resolve, reject) => {
        // Connect incoming CSV into the csv-parser, csv(). 
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                // Normalize the name used for the hashmap key. 
                const name = row.name.toLowerCase().trim();
                // New entry into the locationsMap
                // Note: in this case, name_standard is the unmodified location name. 
                locationsMap.set(name, new LocationData(row.latitude, row.longitude, row.name));
            })
            .on('end', () => {
                console.log('CSV loaded successfully.');
                resolve();
            })
            .on('error', (err) => {
                console.error('Error reading CSV:', err);
                reject(err);
            });
    });
}

const locationsCSVFilePath = "client/public/datasets/cleaned_CCS_dataset.csv";

loadLocations(locationsCSVFilePath).then(() => {
    console.log('Locations loaded into hashmap:', locationsMap);
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
