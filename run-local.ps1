$ErrorActionPreference = "Stop"

Set-Location -Path $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is required but was not found in PATH."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Error "npm is required but was not found in PATH."
}

npm install --silent

$port = node -e @'
const net = require("net");
const start = 3000;
const end = 3999;

function check(p) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => resolve(false));
    server.listen(p, () => server.close(() => resolve(true)));
  });
}

(async () => {
  for (let p = start; p <= end; p += 1) {
    if (await check(p)) {
      process.stdout.write(String(p));
      return;
    }
  }
  process.stderr.write("No open port found in range 3000-3999.\n");
  process.exit(1);
})();
'@

$hostIp = node -e @'
const os = require("os");
const interfaces = os.networkInterfaces();

for (const entries of Object.values(interfaces)) {
  if (!entries) continue;
  for (const entry of entries) {
    if (entry.family === "IPv4" && !entry.internal) {
      process.stdout.write(entry.address);
      process.exit(0);
    }
  }
}
process.stdout.write("localhost");
'@

Write-Output "http://$hostIp`:$port"

$env:PORT = $port
$env:SILENT_STARTUP = "1"
node index.js
