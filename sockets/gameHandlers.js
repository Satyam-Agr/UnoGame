import { playCard, drawCardBtn, declareUNO } from "../game/gameLogic.js";

export default function gameHandlers(playerId, socket, io, games, players) {
    console.log("User connected to game socket: "+socket.id);
    socket.on("joinGame", ({ roomId }) => {
        const game = games[roomId];
        if (!game || !game.players.includes(playerId)) {
            socket.emit("errorMessage", { msg: "Game not found" , leave: true});
            return;
        }
        if (!game.started) {
            socket.emit("errorMessage", { msg: "Game has not started yet" , leave: true});
            return;
        }
        socket.join(roomId);
        socket.emit("stateUpdate", game.state);
    });
    socket.on("playCard", ({ cardIndex , wildColor}) => {
        const info = getPlayerInfo();
        playCard(info.playerIndex, cardIndex, wildColor, info.game.state);
        if(info.game.state.gameOver)
        {
            io.to(info.roomId).emit("gameOver", { winner: info.game.state.players[info.playerIndex].name });
        }
        else
        {
            io.to(info.roomId).emit("stateUpdate", info.game.state);
        }
    });
    socket.on("drawCard", () => {

        const info = getPlayerInfo();
        drawCardBtn(info.playerIndex,info.game.state);
        io.to(info.roomId).emit("stateUpdate", info.game.state);
    });
    socket.on("declareUNO", () => {
        const info = getPlayerInfo();
        declareUNO(info.playerIndex, info.game.state);
        socket.emit("stateUpdate", info.game.state);
        io.to(info.roomId).emit("stateUpdate", info.game.state);
    });
    //helper function to get game and player info
    function getPlayerInfo()
    {
        const player = players[playerId];
        const roomId = player.roomId;
        const game = games[roomId];
        const playerIndex = game.state.players.findIndex(p => p.id === playerId);
        if(playerIndex === -1) return;
        return { player, roomId, game, playerIndex };
        
    }
}