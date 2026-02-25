const playerId = localStorage.getItem("playerId");//connect to socket with playerId for authentication

const socket = io({auth : { playerId }});//create socket
//to store playerId in localStorage when received from server
socket.on("playerId", ( {playerId} ) => {
    localStorage.setItem("playerId", playerId);
});
//got roomId from ejs file
socket.on("connect", () => {
    console.log("Connected to server with socket ID:", socket.id);
    socket.emit("rejoinLobby", { roomId });
});
//update player list in lobby when there is a change
socket.on("lobbyUpdate", (players) => {
    const list = document.querySelector(".player-list");
    list.innerHTML = "";
    players.forEach(p => {
        const div = document.createElement("div");
        div.className = "player-item";
        div.textContent = p;
        list.appendChild(div);
    });
});
//host check for start button visibility
socket.emit("checkHost", { roomId });
socket.on("hostStatus", ({ isHost }) => {   
    hostControls(isHost);
});
//update host controls when host changes
socket.on("hostUpdate", ({ Host }) => {
    console.log("New host is:", Host);
    hostControls(Host === playerId);
});
//redirect to game page when game starts
socket.on("gameStarted", () => {
    window.location.href = `/game/${roomId}`;
});
//error handling
socket.on("errorMessage", ({msg, leave}) => {
    alert(msg);
    if (leave) {
        window.location.href = `/`;
    }
});
//Buttons
document.querySelector(".leave-btn").addEventListener("click", () => {
    socket.emit("leaveRoom", { roomId });
    window.location.href = "/";
});
//helper function to show start button for host and hide for non-host
function hostControls(isHost) {
    if (!isHost) return;
    const startBtn = document.querySelector(".start-btn");
    startBtn.classList.remove("hidden");
    startBtn.addEventListener("click", () => {
        socket.emit("startGame", { roomId });
    });
}