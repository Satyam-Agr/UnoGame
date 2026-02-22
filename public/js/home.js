const playerId = localStorage.getItem("playerId");//connect to socket with playerId for authentication

const socket = io({auth : { playerId }});//create socket

const createForm = document.querySelector("form[action='/create']");
const joinForm = document.querySelector("form[action='/join']");
//to store playerId in localStorage when received from server
socket.on("playerId", ( {playerId} ) => {
    localStorage.setItem("playerId", playerId);
});
//form submit handlers
createForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = createForm.name.value;
    if(!name)
        return;
    socket.emit("createRoom", { name });
});

joinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = joinForm.name.value;
    const roomId = joinForm.roomId.value.toUpperCase();
    socket.emit("joinRoom", { roomId, name });
});
//redirect to lobby when room is joined successfully
socket.on("roomJoined", ({ roomId }) => {
    window.location.href = `/lobby/${roomId}`;
});
//show error messages from server
socket.on("errorMessage", ({msg}) => {
    alert(msg);
});