export default function gameSocket(io, games) {
    io.on("connection",(socket)=>{
        console.log("User connected to game socket: "+socket.id);
        socket.on("joinGame", ({ roomId }) => {
            const game = games[roomId];
            if (!game || !game.players.includes(socket.id)) {
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
    });
    
}