import { initGameState , nextTurn} from '../game/gameLogic.js';
import { removePlayerFromRoom } from './index.js';
import randomstring from 'randomstring';

export default function lobbyHandlers(playerId, socket, io, games, players) {

    //host logic
    socket.on("checkHost", ({ roomId }) => {
        const game = games[roomId];
        if (!game) return;
        const isHost = game.hostId === playerId;
        socket.emit("hostStatus", { isHost });
    });
    //Start game logic
    socket.on("startGame", ({ roomId }) => {
        const game = games[roomId];
        //error handling for game start conditions
        if (!game) return;
        if (game.hostId !== playerId) {
            socket.emit("errorMessage", { msg: "Only host can start the game" });
            return;
        }
        if(game.players.length < 2) {
            socket.emit("errorMessage", { msg: "At least 2 players required to start the game" });
            return;
        }
        for (const pid of game.players) {
            if (!players[pid] || !players[pid].isConnected) {
                socket.emit("errorMessage", { msg: "All players must be connected to start the game" });
                return;
            }
        }
        //no errors, start the game
        game.started = true;
        game.state = initGameState(game.players, playerNames(game.players));
        nextTurn(game.state);//set first player's cards as valid to play
        io.to(roomId).emit("gameStarted");
    });
    //user creates a room
    socket.on("createRoom",({name})=>{
        const roomId=randomstring.generate({capitalization: 'uppercase' , length: 6 , charset: 'alphabetic'});
        players[playerId].name = name;
        players[playerId].roomId = roomId;
        games[roomId]={
            hostId: playerId,
            players: [playerId],
            started: false,
            state: null
        }
        socket.join(roomId);
        socket.emit("roomJoined",{ roomId });
        io.to(roomId).emit("lobbyUpdate", playerNames(games[roomId].players));
    })
    //user joins a room
    socket.on("joinRoom",({roomId,name})=>{
        const game=games[roomId];
        players[playerId].name = name;
        players[playerId].roomId = roomId;
        if(!game){
            socket.emit("errorMessage",{ msg: "Room not found" , leave: true});
            return;
        }
        if (game.started) {
            socket.emit("errorMessage", { msg: "Game already started", leave: true });
            return;
        }

        if (game.players.length >= 4) {
            socket.emit("errorMessage", { msg: "Room full" , leave: true });
            return;
        }

        // prevent duplicate join
        if (game.players.includes(playerId)) return;
        game.players.push(playerId);

        socket.join(roomId);
        socket.emit("roomJoined", {roomId});
        io.to(roomId).emit("lobbyUpdate", playerNames(game.players));

    })
    //user rejoins a room after refresh
    socket.on("rejoinLobby", ({ roomId }) => {
        if (!games[roomId] || !games[roomId].players.includes(playerId)) 
        {
            socket.emit("errorMessage", {"msg": "Room not found or you are not a member", "leave": true});
            return;
        }

        socket.join(roomId);
        io.to(roomId).emit("lobbyUpdate", playerNames(games[roomId].players));
    });
    //leaving a room
    socket.on("leaveRoom", ({ roomId }) => {
        removePlayerFromRoom(playerId, roomId, games, players, io);
    });
    //helper functions
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