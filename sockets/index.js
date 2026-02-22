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
        //lobby logic
        lobbyHandlers(playerId, socket, io, games, players);
        //game logic
        gameHandlers(playerId, socket, io, games, players);

        //disconnect
        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            if (!players[playerId]) return;
            players[playerId].isConnected = false;
            players[playerId].disconnectTimer = setTimeout(() => {
                if (!players[playerId].isConnected) {
                    removePlayerFromRoom(playerId, players[playerId].roomId, games, players, io);
                    //remove player form players list
                    delete players[playerId];
                }
            }, 10000); // 10 seconds grace period        
        });
    });

}
//helper function
export function removePlayerFromRoom(playerId, roomId, games, players, io) {
    const game = games[roomId];
    const player = players[playerId];
    if (!game) return;
    game.players = game.players.filter(p => p !== playerId);
    if(player)
        player.roomId = null;
    // If no players left, delete the game.
    if (game.players.length === 0) {
        delete games[roomId];
        return;
    }
    // If game has started, update state and notify players. If in lobby, update lobby.
    if(game.started)
    {
        game.state.players = game.state.players.filter(p => p.id !== playerId);
        if(game.state.currentPlayerIndex >= game.state.players.length)
        {
            game.state.currentPlayerIndex = 0;
        }
        io.to(roomId).emit("playerLeft", game.state);
    }
       
    else
    {
        io.to(roomId).emit("lobbyUpdate", playerNames(game.players));
        //if host leaves, assign new host
        if (game.hostId === playerId) {
            game.hostId = game.players[0];
            io.to(roomId).emit("hostUpdate", { Host: game.hostId });
        }
    }
    //get player names from player ids
    function playerNames(playerIds) {
        const names = playerIds.map(id => {
            if (!players[id]) {
                return "Player X";
            }
            return players[id].name;
        });
        return names;
    }
}