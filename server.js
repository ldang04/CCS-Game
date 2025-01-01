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
    if (!gameRooms[gameId]) {
        gameRooms[gameId] = {
            isStarted: false,
            users: [],
            locations: [],
            currentLetter: "A",
            currentTurnIndex: 0,
            timeLimit: time ?? 60,
            lives: lives ?? 3,
            guessedLocations: new Set(),
        };
    }

    const room = gameRooms[gameId];

    // Prevent users from joining if the game has already started
    if (room.isStarted) {
        console.log("from join-room");
        socket.emit("game-started-error", { message: "The game has already started." });
        return;
    }

    const user = { id: socket.id, name: nickname, lives: room.lives, isActive: true };
    room.users.push(user);
    socket.join(gameId);

    // Emit initialization data
    socket.emit("initialize-game", {
        locations: room.locations,
        markers: room.locations.map((loc) => { /* mapping logic */ }),
        currentLetter: room.currentLetter,
        users: room.users,
        currentTurn: room.users[room.currentTurnIndex],
        timeLimit: room.timeLimit,
        isStarted: false
    });

    io.to(gameId).emit("update-users", room.users);
    io.to(gameId).emit("update-turn", room.users[room.currentTurnIndex]);
});

    
    
    function startTimer(gameId) {
        const room = gameRooms[gameId];
        if (!room) return;
    
        room.timeLeft = room.timeLimit; // Initialize timeLeft to the room's timeLimit
    
        const timerInterval = setInterval(() => {
            if (room.timeLeft <= 0) {
                clearInterval(timerInterval);
                handleTimeOut(gameId); // Handle timeout logic
                return;
            }
    
            room.timeLeft -= 1;
    
            // Broadcast the updated time to all players
            io.to(gameId).emit("update-timer", room.timeLeft);
        }, 1000);
    
        room.timerInterval = timerInterval; // Save the interval ID for cleanup if needed
    }
    
    function handleTimeOut(gameId) {
        const room = gameRooms[gameId];
        if (!room) return;
    
        const currentUser = room.users[room.currentTurnIndex];
        if (currentUser.lives > 1) {
            currentUser.lives -= 1;
            io.to(gameId).emit("update-users", room.users);
        } else {
            // Mark user as inactive
            currentUser.isActive = false;
            io.to(gameId).emit("update-users", room.users);
    
            // Check if all users are inactive or the room is empty
            if (room.users.every((user) => !user.active)) {
                io.to(gameId).emit("game-ended");
                clearInterval(room.timerInterval); // Stop the timer
                delete gameRooms[gameId]; // Clean up the game room
                return;
            }
        }
    
         // Move to the next active user
        do {
            room.currentTurnIndex = (room.currentTurnIndex + 1) % room.users.length;
        } while (!room.users[room.currentTurnIndex].active);

        io.to(gameId).emit("update-turn", room.users[room.currentTurnIndex]);

        // Restart the timer for the next turn
        startTimer(gameId);
    }

    // start a game 
    socket.on("start-game-pressed", ({ gameId }) => {
        const room = gameRooms[gameId];
    
        // Check if the room exists
        if (!room) {
            socket.emit("start-game-pressed-error", { message: "The specified room does not exist." });
            return;
        }
    
        // Check if the game is already started
        if (room.isStarted) {
            console.log("from start-game-pressed");
            socket.emit("game-started-error", { message: "Game has already started." });
            return;
        }
    
        // Mark the game as started
        room.isStarted = true;

        // Logic to set whether the game is solo or multiplayer
        if (room.users.length === 1) {
            room.isSolo = true;
            console.log('Solo game enabled');
        }  else {
            room.isSolo = false; // Default back to multiplayer
            console.log('Multiplayer game enabled');
        }
    
        // Notify all players that the game has started
        io.to(gameId).emit("game-started", {
            currentLetter: room.currentLetter,
            currentTurn: room.users[room.currentTurnIndex],
            timeLimit: room.timeLimit,
            users: room.users.map((user) => ({
                id: user.id,
                name: user.name,
                lives: user.lives, // Include remaining lives if lives are being tracked
            })),
            locations: room.locations, // Send any pre-existing guessed locations
            isSolo: room.isSolo, // Send whether the game is solo or multiplayer
        });
    
        console.log(`Game started in room ${gameId}`);
    });
    
    socket.on("pass-turn", ({ gameId }) => {
        const room = gameRooms[gameId];
        if (!room) return;
    
        // Move to the next turn
        room.currentTurnIndex = (room.currentTurnIndex + 1) % room.users.length;
        const nextTurnUser = room.users[room.currentTurnIndex];
    
        // Notify all clients
        io.to(gameId).emit("update-turn", nextTurnUser);
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
    
            // Broadcast the updated locations list and next turn
            io.to(gameId).emit("update-locations", room.locations);
            io.to(gameId).emit("update-turn", nextTurnUser);
    
            // Emit the new marker to all clients in the room
            io.to(gameId).emit("add-marker", {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                name: locationData.name_standard,
            });
    
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

    // Listen for the update-life event (when a user loses a life)
    socket.on("update-life", ({ gameId, userId, newLives }) => {
        const room = gameRooms[gameId];
        if (!room) return;

        // Find the user (current) and update their lives
        const user = room.users.find(user => user.id === userId);
        if (user) {
            user.lives = newLives;

            // Emit the updated users list to all clients in the room
            io.to(gameId).emit("update-users", room.users);
        }
    });

    // Receive end, and notify all clients that the game has ended
    socket.on("end-game", ({ gameId }) => {
        const room = gameRooms[gameId];
        if (!room) return;

        io.to(gameId).emit("game-ended");
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
