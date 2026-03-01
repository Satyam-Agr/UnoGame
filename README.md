# UNO Arena
Real-time multiplayer UNO built with Node.js, Express, EJS, and Socket.IO.

## Quick Start (PowerShell)
Run from the project root:

```powershell
./run-local.ps1
```

The script will:
1. Install dependencies.
2. Find an available port in `3000-3999`.
3. Start the server.
4. Print a shareable LAN URL.

If PowerShell blocks script execution in your current terminal, run:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

Then run:

```powershell
./run-local.ps1
```

## Manual Run
```powershell
npm install
npm start
```

Default URL:
- `http://localhost:3000`

## Requirements
- Node.js (v18+ recommended)
- npm
- Modern browser

## Local Multiplayer Notes
- Players should be on the same LAN/Wi-Fi.
- Host firewall must allow inbound traffic on the selected port.
- Keep the host terminal running while the game is active.
- Room state is in-memory (`games`, `players`) and resets on restart.
