#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "Error: Node.js is required but was not found in PATH." >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm is required but was not found in PATH." >&2
  exit 1
fi

npm install --silent

PORT="$(node - <<'NODE'
const net = require('net');
const start = 3000;
const end = 3999;

function check(p) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen(p, '0.0.0.0', () => {
      server.close(() => resolve(true));
    });
  });
}

(async () => {
  for (let p = start; p <= end; p += 1) {
    if (await check(p)) {
      process.stdout.write(String(p));
      return;
    }
  }
  process.stderr.write('No open port found in range 3000-3999.\n');
  process.exit(1);
})();
NODE
)"

HOST_IP="$(node - <<'NODE'
const os = require('os');
const interfaces = os.networkInterfaces();
for (const entries of Object.values(interfaces)) {
  if (!entries) continue;
  for (const entry of entries) {
    if (entry.family === 'IPv4' && !entry.internal) {
      process.stdout.write(entry.address);
      process.exit(0);
    }
  }
}
process.stdout.write('localhost');
NODE
)"

echo "http://${HOST_IP}:${PORT}"
PORT="$PORT" SILENT_STARTUP=1 node index.js
