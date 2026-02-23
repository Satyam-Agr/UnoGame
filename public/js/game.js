let state={};//game state
let thisPlayeridx=0;//current player index

//socket connection
const playerId = localStorage.getItem("playerId");//connect to socket with playerId for authentication
const socket = io({auth : { playerId }});//create socket
//to store playerId in localStorage when received from server
socket.on("playerId", ( {playerId} ) => {
    localStorage.setItem("playerId", playerId);
});
//got roomId from ejs file
socket.on("connect", () => {
    console.log("Connected to server with socket ID:", socket.id);
    socket.emit("joinGame", { roomId });
});

//receive game state updates from server
socket.on("stateUpdate", (newState) => {
    state = newState;
    thisPlayeridx = state.players.findIndex(p => p.id === playerId);
    renderGame();
});
socket.on("playerLeft", (newState) => {
    state = newState;
    thisPlayeridx = state.players.findIndex(p => p.id === playerId);
    alert("A player has left the game. Removing them from the game.");
    //only one player left, end game
    if(state.players.length<=1)
    {
        handleVictory(state.players[thisPlayeridx].name);
        return;
    }
    const players=document.querySelectorAll(".player");
    players[state.players.length].remove();//remove last player div
    renderGame();
});
// win condition
socket.on("gameOver", ({winner}) => {
    handleVictory(winner);
    socket.emit("exitGame");
});

//error handling
socket.on("errorMessage", ({msg, leave}) => {
    alert(msg);
    if (leave) {
        window.location.href = `/`;
    }
});

//render functions
function renderPlayer()
{
    const players=document.querySelectorAll(".player");
    for(let i=0;i<state.players.length;i++)
    {
        const playerDiv=players[i];
        const player=state.players[i];
        const cardEl = playerDiv.querySelector(".player__card-count");
        const unoEl = playerDiv.querySelector(".player__uno");
        
        cardEl.textContent = `Card: ${player.hand.length}` ;
        
        //hide uno
        if(player.saidUNO)
            unoEl.classList.remove('hidden');
        else
            unoEl.classList.add('hidden');

        //add or remove active player
        if(i==state.currentPlayerIndex)
            playerDiv.classList.add('player--active');
        else
            playerDiv.classList.remove('player--active');
    }
}
function renderHand()
{
    const handDiv=document.querySelector('#hand-container');
    handDiv.innerHTML="";
    const cards=state.players[thisPlayeridx].hand;
    //check if card is valid to play
    for(let i=0;i<cards.length;i++)
    {
        if(cards[i].valid)
            handDiv.appendChild(makeCard(cards[i],i));
        else
            handDiv.appendChild(makeCard(cards[i]));
    }
}
function renderBoard()
{
    const drawDiv=document.querySelector('#draw-pile');
    const discardDiv=document.querySelector('#discard-pile');
    const currColor=document.querySelector('#color-indicator');
    const message=document.querySelector('#game-message');
    const dirDiv=document.querySelector('.board__direction');
    //update direction   
    if(state.direction==1)
        dirDiv.innerHTML="->";
    else
        dirDiv.innerHTML="<-";
    //update draw pile
    drawDiv.textContent=`Draw - ${state.drawPile.length}`;
    //update discardpile
    discardDiv.innerHTML='';
    discardDiv.appendChild(makeCard(state.topCard));
    //current color
    currColor.textContent=`Current Color: ${state.currentColor}`;
    //game message
    message.textContent=`${state.players[state.currentPlayerIndex].name}'s turn`;
    
    
}
//main render function
function renderGame()
{
    renderPlayer();
    renderHand();
    renderBoard();
}
//click events
//draw a card
document.querySelector('#draw-btn').addEventListener("click",()=>{
    if(state.gameOver)
        return;
    socket.emit("drawCard");
});
//declare uno
document.querySelector('#uno-btn').addEventListener("click",()=>{
    if(state.gameOver)        return;
    socket.emit("declareUNO");
});
document.querySelector('#exit-btn').addEventListener("click",()=>{
    socket.emit("exitGame");
    window.location.href = `/`;
});

//helper functions 
//make a card
function makeCard(card,cardIdx=-1)
{
    const cardDiv = document.createElement("div");
    // Base class
    cardDiv.classList.add("card");
    // Color modifier class
    cardDiv.classList.add(`card--${card.color}`);
    // Display value
    cardDiv.textContent = card.value;
    //card playable or not
    if(cardIdx===-1){
        cardDiv.classList.add('card--disabled');
    }
    else{
        cardDiv.classList.add('card--valid');
        // Click event
        cardDiv.addEventListener("click", ()=> {
            handelCardClick(cardIdx);
        });
    }
    return cardDiv;
}
//handle card click
function handelCardClick(cardIdx)
{
    const card = state.players[thisPlayeridx].hand[cardIdx];
    if(card.color === 'wild')
    {
        const wildColorSelect = document.querySelector('#wild-color-modal');
        wildColorSelect.classList.remove('hidden');
        for(let color of ['green', 'yellow', 'red', 'blue'])
        {
            const selectedColor=wildColorSelect.querySelector(`#select-${color}`);
            selectedColor.onclick = ()=>{
                wildColorSelect.classList.add('hidden');
                socket.emit("playCard", { cardIndex: cardIdx, wildColor:color });
            };
        }
    }
    else
        socket.emit("playCard", { cardIndex: cardIdx });
}
//handle victory
function handleVictory(winnerName) {
    // win condition
    const winnerModal = document.getElementById("winner-modal");
    const winnerText = document.getElementById("winner-text");

    // Update text
    winnerText.textContent = `${winnerName} Wins!`;

    // Show modal
    winnerModal.classList.remove("hidden");

    // Disable all buttons
    document.querySelectorAll("button").forEach(btn => {
        btn.disabled = true;
    });

    // Countdown
    let timeLeft = 5;
    const countdown = document.createElement("p");
    countdown.textContent = `Returning to home in ${timeLeft}...`;
    winnerModal.querySelector(".modal__content").appendChild(countdown);

    const interval = setInterval(() => {
        timeLeft--;
        countdown.textContent = `Returning to home in ${timeLeft}...`;

        if (timeLeft === 0) {
            clearInterval(interval);
            window.location.href = "/";
        }
    }, 1000);
}