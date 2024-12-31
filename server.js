const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const stringSimilarity = require("string-similarity");

const app = express();
const server = http.createServer(app);

// Allow CORS for Express routes (optional, for REST APIs)
app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

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
            gameRooms[gameId] = { 
                users: [], 
                locations: [], 
                currentLetter: "A", 
                currentTurnIndex: 0, 
                time: time ?? 60, 
                lives: lives ?? 3,
                guessedLocations: new Set() // Track guessed locations for this room
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
    
        // Validate the location within the context of the room
        const validationResponse = validateLocation(location, gameId);
    
        if (validationResponse.success) {
            const room = gameRooms[gameId];
            const locationData = validationResponse.location_data;
    
            // Add the location to the room's location list
            room.locations.push(locationData.name_standard);
    
            // Calculate the new current letter
            const lastLetter = locationData.name_standard.slice(-1).toUpperCase();
    
            // Update the current letter for the room
            room.currentLetter = lastLetter;
            io.to(gameId).emit("update-current-letter", lastLetter); // Emit only on success
    
            // Advance to the next turn
            room.currentTurnIndex = (room.currentTurnIndex + 1) % room.users.length;
            const nextTurnUser = room.users[room.currentTurnIndex];
            
            // Now, prepare to add marker for the guessed location on the map. 
            const markerData = {
                name: locationData.name_standard,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
            };    

            // Broadcast the updated locations list, next turn, and marker data
            io.to(gameId).emit("add-marker", markerData);
            io.to(gameId).emit("update-locations", room.locations);
            io.to(gameId).emit("update-turn", nextTurnUser);
    
            console.log(`Location added in room ${gameId}: ${location}`);
        } else {
            // Send error back to the user
            socket.emit("location-error", validationResponse.message);
            console.log(validationResponse.message);
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
    // console.log('Locations loaded into hashmap:', locationsMap);
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


function validateLocation(input, gameId) { 
    // Normalize input to format of locationsMap key
    const inputName = input.toLowerCase().trim();

    // Find the closest match in the hashmap
    const keys = Array.from(locationsMap.keys());
    const { bestMatch } = stringSimilarity.findBestMatch(inputName, keys);

    if (bestMatch.rating > 0.95) { // Threshold for similarity set at 0.95
        const location = locationsMap.get(bestMatch.target);

        // Check if the location has already been guessed in this room
        const guessedLocations = gameRooms[gameId]?.guessedLocations;
        if (guessedLocations?.has(bestMatch.target)) {
            return { success: false, message: `"${bestMatch.target}" has already been guessed!` };
        } else {
            // Mark the location as guessed for this specific room
            guessedLocations?.add(bestMatch.target);
            return { success: true, location_data: location };
        }
    } else {
        return { success: false, message: `"${input}" is not a valid location!` };
    }
}

app.post("/validate_location", (req, res) => {
    const { gameId, location } = req.body;
    if (!gameId || !location) {
        return res.status(400).json({ success: false, message: "Missing gameId or location." });
    }

    // Validate the location (example validation logic)
    const validationResponse = validateLocation(location, gameId);

    console.log(validationResponse);
    res.json(validationResponse);
});

// Start the server
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
