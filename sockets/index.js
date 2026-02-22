import { v4 as uuid } from 'uuid';//for unique playerId generation
import lobbyHandlers from "./lobbyHandlers.js";
import gameHandlers from "./gameHandlers.js";
export default function registerSockets(io, games, players) {

    io.on("connection", (socket) => {

        //initialize playerId for this socket connection
        let testId = socket.handshake.auth.playerId;
        if (!testId || !players[testId]) {
            console.log("No playerId provided, generating new one.");
            const newId = uuid();
            socket.emit("playerId", {playerId: newId});
            testId = newId;
            players[newId] = {
                socketId: socket.id,
                name: null,
                roomId: null,
                isConnected: true,
                disconnectTimer: null
            };
        }
        const playerId = testId;
        console.log("User connected: "+socket.id+" with playerId: "+playerId);
            //reconnect logic
        players[playerId].socketId = socket.id;
        players[playerId].isConnected = true;
        if (players[playerId].disconnectTimer) {
            clearTimeout(players[playerId].disconnectTimer);
            players[playerId].disconnectTimer = null;
        }
        //temporary logs to check current games and players
        console.log("Current games:", games);
        console.log("Current players:", players);
        // Attach lobby logic
        lobbyHandlers(playerId, socket, io, games, players);
        // Attach game logic
        gameHandlers(playerId, socket, io, games, players);

        socket.on("disconnect", () => {
            console.log("Disconnected:", socket.id);

            // shared disconnect logic here
        });

    });

}