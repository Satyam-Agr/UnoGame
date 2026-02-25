import express from "express";

export default function viewRoutes(players, games)
{
    const router=express.Router();
    //home page
    router.get('/', (req, res) => {
        res.render("home")
    });
    //game page
    router.get('/game/:roomId', (req, res) => {
        const { roomId } = req.params;
        res.render("game", { roomId ,players: games[roomId]?.players.map(id =>players[id]?.name || "Player X") || []});
    });
    //lobby page
    router.get("/lobby/:roomId", (req, res) => {
        const { roomId } = req.params;
        const game = games[roomId];
        if (!game) {
            return res.redirect("/");
        }
        res.render("lobby", { roomId ,players: game.players.map(id =>players[id]?.name || "Player X")});
    });
    
    return router;
}