//to do:-
//add homerules
let state={};//game state
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

socket.on("stateUpdate", (newState) => {
    state = newState;
    renderGame();
});

//error handling
socket.on("errorMessage", ({msg, leave}) => {
    alert(msg);
    if (leave) {
        window.location.href = `/`;
    }
});
//helper functions to make a card
function makeCard(card,idx=-1)
{
    const cardDiv = document.createElement("div");
    // Base class
    cardDiv.classList.add("card");
    // Color modifier class
    cardDiv.classList.add(`card--${card.color}`);
    // Display value
    cardDiv.textContent = card.value;
    //card playable or not
    if(idx===-1){
        cardDiv.classList.add('card--disabled');
    }
    else{
        cardDiv.classList.add('card--valid');
        // Click event
        cardDiv.addEventListener("click", () => {
            handleCardClick(idx);
        });
    }
    return cardDiv;
}
//render functions
function renderPlayer()
{
    const players=document.querySelectorAll(".player");
    for(let i=0;i<state.players.length;i++)
    {
        const playerDiv=players[i];
        const player=state.players[i];
        const nameEl = playerDiv.querySelector(".player__name");
        const cardEl = playerDiv.querySelector(".player__card-count");
        const unoEl = playerDiv.querySelector(".player__uno");
        
        //update name & length 
        nameEl.textContent = player.name;
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
    const cards=state.players[state.currentPlayerIndex].hand;
    for(let i=0;i<cards.length;i++)
    {
        if(isValid(cards[i]))
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
    drawDiv.textContent=`Draw - ${state.drawPileCount}`;
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
//play a card
function handleCardClick(idx)
{
    playCard(state.currentPlayerIndex,idx);
    renderGame();
}
//draw a card
document.querySelector('#draw-btn').addEventListener("click",()=>{
    if(state.gameOver)
        return;
    //draw a card
    drawCards(state.currentPlayerIndex,1);
    nextTurn();
    //render the next turn
    renderGame();
});
//declare uno
document.querySelector('#uno-btn').addEventListener("click",()=>{
    const index=state.currentPlayerIndex;
    if(state.players[index].hand.length==2)
        state.players[index].saidUNO=true;
});
document.querySelector('#restart-btn').addEventListener("click",()=>{
    renderGame();
});