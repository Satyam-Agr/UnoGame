let state={};//game state
let thisPlayeridx=0;//current player index
let latestEventMessage = "";
let catchEnableTimeoutId = null;
let eventMessageShownAt = 0;
let waitingForCardMove = false;
let eventMessageHideTimeoutId = null;
const EVENT_MESSAGE_MIN_MS = 3000;

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
    const prevTopCard = state.topCard;
    state = newState;
    thisPlayeridx = state.players.findIndex(p => p.id === playerId);
    const topCardChanged = cardSignature(prevTopCard) !== cardSignature(state.topCard);
    maybeHideEventMessage(topCardChanged);
    renderGame();
});
socket.on("playerLeft", (newState) => {
    state = newState;
    thisPlayeridx = state.players.findIndex(p => p.id === playerId);
    showEventMessage("System: A player left the game.");
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
socket.on("message", ({msg}) => {
    showEventMessage(msg);
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
    const numPlayers=state.players.length;
    for(let i=0;i<numPlayers;i++)
    {
        const playerDiv=players[(numPlayers-1-thisPlayeridx+i)%numPlayers];//calculate player div index based on current player index
        const player=state.players[i];//
        const nameEl = playerDiv.querySelector(".player__name");
        const cardEl = playerDiv.querySelector(".player__card-count");
        const unoEl = playerDiv.querySelector(".player__uno");
        
        nameEl.textContent = player.name;
        cardEl.textContent = `Card: ${player.hand.length}` ;
        
        //hide uno
        if(player.uno?.said)
            unoEl.classList.remove('hidden');
        else
            unoEl.classList.add('hidden');

        //add or remove active player
        if(i==state.currentPlayerIndex)
            playerDiv.classList.add('player--active');
        else
            playerDiv.classList.remove('player--active');

        const isSelf = i === thisPlayeridx;
        playerDiv.classList.toggle('player--self', isSelf);
        playerDiv.classList.toggle('player--self-turn', isSelf && i === state.currentPlayerIndex);
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
        handDiv.appendChild(makeCard(cards[i], {
            cardIdx: i,
            inHand: true,
            playable: cards[i].valid
        }));
    }
}
function renderBoard()
{
    const drawDiv=document.querySelector('#draw-pile');
    const discardDiv=document.querySelector('#discard-pile');
    const turnMessage=document.querySelector('#game-message');
    const eventMessage=document.querySelector('#event-message');
    const dirDiv=document.querySelector('.board__direction');
    const drawBtn=document.querySelector('#draw-btn');
    const unoBtn=document.querySelector('#uno-btn');
    const catchBtn=document.querySelector('#catch-btn');
    //update direction   
    if(state.direction==1)
        dirDiv.textContent="↻";
    else
        dirDiv.textContent="↺";
    //update draw pile
    drawDiv.innerHTML = '';
    drawDiv.appendChild(makeCardBack());
    const drawCount = document.createElement('span');
    drawCount.classList.add('pile__count');
    drawCount.textContent = `${state.drawPile.length}`;
    drawDiv.appendChild(drawCount);
    //update discardpile
    discardDiv.innerHTML='';
    discardDiv.appendChild(makeCard(state.topCard));
    //game message
    turnMessage.textContent=`${state.players[state.currentPlayerIndex].name}'s turn`;
    if(eventMessage) updateEventMessageUI();
    //button states
    const thisPlayer = state.players[thisPlayeridx];
    setButtonVisualState(drawBtn, false);
    setButtonVisualState(unoBtn, false);
    setButtonVisualState(catchBtn, false);

    if(catchEnableTimeoutId){
        clearTimeout(catchEnableTimeoutId);
        catchEnableTimeoutId = null;
    }

    if(state.currentPlayerIndex===thisPlayeridx){
        setButtonVisualState(drawBtn, true);
    }
    if(thisPlayer?.uno && !thisPlayer.uno.said){
        setButtonVisualState(unoBtn, true);
    }
    const targetPlayer = state.players.find(p => p.uno?.catch);
    if(targetPlayer && targetPlayer.id !== thisPlayer.id){
        const graceTimeLeft = targetPlayer.uno.StartTimestamp + 3000 - Date.now();
        if(graceTimeLeft <= 0){
            setButtonVisualState(catchBtn, true);
        } else {
            setButtonVisualState(catchBtn, false);
            catchEnableTimeoutId = setTimeout(() => {
                const currentTarget = state.players.find(p => p.uno?.catch);
                if(currentTarget?.id === targetPlayer.id){
                    setButtonVisualState(catchBtn, true);
                }
            }, graceTimeLeft);
        }
    }
}
//main render function
function renderGame()
{
    renderPlayer();
    renderHand();
    renderBoard();
}
function showEventMessage(msg)
{
    latestEventMessage = formatEventMessage(msg);
    eventMessageShownAt = Date.now();
    waitingForCardMove = true;
    if(eventMessageHideTimeoutId){
        clearTimeout(eventMessageHideTimeoutId);
        eventMessageHideTimeoutId = null;
    }
    updateEventMessageUI();
}
function updateEventMessageUI()
{
    const eventMessageEl = document.querySelector('#event-message');
    if(!eventMessageEl) return;
    eventMessageEl.textContent = latestEventMessage;
    eventMessageEl.classList.toggle('hidden', !latestEventMessage);
}
function maybeHideEventMessage(topCardChanged)
{
    if(!waitingForCardMove || !latestEventMessage) return;
    if(!topCardChanged) return;
    const elapsed = Date.now() - eventMessageShownAt;
    if(elapsed >= EVENT_MESSAGE_MIN_MS){
        latestEventMessage = "";
        waitingForCardMove = false;
        updateEventMessageUI();
        return;
    }
    eventMessageHideTimeoutId = setTimeout(() => {
        latestEventMessage = "";
        waitingForCardMove = false;
        eventMessageHideTimeoutId = null;
        updateEventMessageUI();
    }, EVENT_MESSAGE_MIN_MS - elapsed);
}
function cardSignature(card)
{
    if(!card) return "";
    return `${card.color}-${card.value}`;
}
//click events
//draw a card
document.querySelector('#draw-btn').addEventListener("click",()=>{
    if(state.gameOver)        return;
    setButtonVisualState(document.querySelector('#draw-btn'), false);
    socket.emit("drawCard");
});
//declare uno
document.querySelector('#uno-btn').addEventListener("click",()=>{
    if(state.gameOver)        return;
    setButtonVisualState(document.querySelector('#uno-btn'), false);
    socket.emit("declareUNO");
});
//catch uno
document.querySelector('#catch-btn').addEventListener("click",()=>{
    if(state.gameOver)        return;
    setButtonVisualState(document.querySelector('#catch-btn'), false);
    const targetPlayerIndex = state.players.findIndex(p => p.uno?.catch);
    if(targetPlayerIndex !== -1)
        socket.emit("catchUNO", { targetPlayerIndex });
});
document.querySelector('#exit-btn').addEventListener("click",()=>{
    socket.emit("exitGame");
    window.location.href = `/`;
});

//helper functions 
//make a card
function makeCard(card, options = {})
{
    const { cardIdx = -1, inHand = false, playable = false } = options;
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");
    cardDiv.classList.add(`card--${card.color}`);
    cardDiv.setAttribute('data-value', card.value);

    const topCorner = document.createElement('span');
    topCorner.classList.add('card__corner', 'card__corner--top');
    topCorner.textContent = formatCardValue(card.value, true);

    const bottomCorner = document.createElement('span');
    bottomCorner.classList.add('card__corner', 'card__corner--bottom');
    bottomCorner.textContent = formatCardValue(card.value, true);

    const center = document.createElement('div');
    center.classList.add('card__center');

    const centerValue = document.createElement('span');
    centerValue.classList.add('card__value');
    centerValue.textContent = formatCardValue(card.value, false);
    center.appendChild(centerValue);

    cardDiv.appendChild(topCorner);
    cardDiv.appendChild(bottomCorner);
    cardDiv.appendChild(center);

    // Mark 6 and 9 with underline styling to avoid orientation ambiguity.
    if (card.value === 6 || card.value === 9) {
        cardDiv.classList.add('card--mark-69');
    }

    if (inHand) {
        cardDiv.style.zIndex = `${cardIdx + 1}`;
    }

    if(inHand && !playable){
        cardDiv.classList.add('card--disabled');
    }
    else if(inHand && playable){
        cardDiv.classList.add('card--valid');
        cardDiv.addEventListener("click", ()=> {
            handelCardClick(cardIdx);
        });
    }
    return cardDiv;
}
function makeCardBack()
{
    const back = document.createElement('div');
    back.classList.add('card', 'card--back');

    const logo = document.createElement('span');
    logo.classList.add('card__back-logo');
    logo.textContent = 'UNO';
    back.appendChild(logo);

    return back;
}
function formatCardValue(value, compact)
{
    if(typeof value === 'number') return `${value}`;
    switch(value)
    {
        case 'skip': return compact ? '⊘' : '⊘';
        case 'reverse': return compact ? 'R' : '↺';
        case 'draw2': return '+2';
        case 'wild': return compact ? 'W' : 'WILD';
        case 'wildDraw4': return compact ? '+4' : 'WILD';
        default: return `${value}`;
    }
}
function formatEventMessage(msg = "")
{
    const cleanMsg = msg.replace(/\s+/g, " ").trim();
    if(!cleanMsg) return "";
    const maxLine = 34;
    const words = cleanMsg.split(" ");
    const lines = [];
    let line = "";
    for(const word of words){
        const next = line ? `${line} ${word}` : word;
        if(next.length > maxLine){
            if(line) lines.push(line);
            line = word;
        } else {
            line = next;
        }
    }
    if(line) lines.push(line);
    return lines.slice(0, 3).join("\n");
}
function setButtonVisualState(btn, isActive)
{
    if(!btn) return;
    btn.classList.toggle('btn--active', isActive);
    btn.classList.toggle('btn--inactive', !isActive);
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
