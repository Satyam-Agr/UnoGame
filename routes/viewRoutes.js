import express from "express";

export default function viewRoutes(games)
{
    const router=express.Router();

    router.get('/', (req, res) => {
        res.render("home")
    });

    router.get('/game/:roomId', (req, res) => {
        const { roomId } = req.params;
        res.render("game", { roomId ,players: game.players.map(id =>players[id]?.name || "Player X")});
    });

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