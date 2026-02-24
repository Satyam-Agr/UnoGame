import { playCard, drawCardBtn, declareUNO , catchUNO} from "../game/gameLogic.js";
import { removePlayerFromRoom } from "./index.js";

export default function gameHandlers(playerId, socket, io, games, players) {
    console.log("User connected to game socket: "+socket.id);
    //user joins a game room (after lobby)
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
    //game actions
    //play a card
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
            if(wildColor)
            {
                io.to(info.roomId).emit("message", {
                    msg: `${info.game.state.players[info.playerIndex].name} played ${info.game.state.topCard.value}. Color -> ${wildColor}.`
                });
            }
        }
    });
    //draw a card(Draw Button in UI)
    socket.on("drawCard", () => {

        const info = getPlayerInfo();
        drawCardBtn(info.playerIndex,info.game.state);
        io.to(info.roomId).emit("stateUpdate", info.game.state);
    });
    //declare UNO
    socket.on("declareUNO", () => {
        const info = getPlayerInfo();
        declareUNO(info.playerIndex, info.game.state);
        io.to(info.roomId).emit("stateUpdate", info.game.state);
    });
    //catch uno
    socket.on("catchUNO", ({ targetPlayerIndex }) => {
        const info = getPlayerInfo();
        if(catchUNO( targetPlayerIndex, info.game.state))
        {
            io.to(info.roomId).emit("stateUpdate", info.game.state);
            io.to(info.roomId).emit("message", {
                msg: `${info.game.state.players[info.playerIndex].name} caught ${info.game.state.players[targetPlayerIndex].name}. Penalty: +2 cards.`
            });
        }
    });
    //exit game
    socket.on("exitGame", () => {
        const info = getPlayerInfo();
        if(!info) return;
        if(!info.game.state.gameOver)
        {
            socket.emit("errorMessage", { msg: "You have left the game" , leave: true});
        }
        removePlayerFromRoom(playerId, info.roomId, games, players, io);
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
