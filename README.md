# UNO Arena 🎮
A real-time multiplayer UNO project built with **Node.js + Express + Socket.IO**.

This project is made by a dev, for devs who want to spin up a fast multiplayer card game and share it with friends on local Wi‑Fi.

## Quick Start (one command)
If you already have **Node.js** and **npm** installed:

```bash
./run-local.sh
```

The script will:
1. Install dependencies (safe to run repeatedly).
2. Check if port `3000` is free. If not, it finds the next free port in `3000-3999`.
3. Start the server on the selected port.
4. Detect your LAN IP (for same-Wi‑Fi players).
5. Print a single shareable URL like:
   - `http://192.168.1.20:3000`

Copy that URL and send it to friends on the same network.

---

## Manual Run (classic)
```bash
npm install
npm start
```

Default app URL:
- `http://localhost:3000`

---

## Requirements
- Node.js (recommended: v18+)
- npm
- A modern browser (Chrome/Edge/Firefox/Safari)

---

## Local Multiplayer Rules (important)
These are practical things you must ensure yourself (cannot be fully enforced in code):

- All players must be on the **same Wi‑Fi/LAN** (unless you deploy to cloud or use a tunnel).
- Host machine firewall must allow incoming traffic on the selected port.
- Keep the host terminal open while playing (closing it stops the server).
- Use stable Wi‑Fi; frequent disconnects can kick players.
- Max room size is 4 players.

---

## Dev Notes
- Uses EJS views for pages and Socket.IO for real-time game events.
- In-memory state (`games`, `players`) means rooms reset when server restarts.

Have fun and ship weird game-night ideas ✨
