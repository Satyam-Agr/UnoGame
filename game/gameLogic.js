import Shuffle from 'shuffle';//for shuffling the deck
//initialize game state
export function initGameState(playerIds, playerNames)
{
    const state = {
        players: [],
        currentPlayerIndex: -1,
        direction: 1,
        currentColor: null,
        topCard: null,
        gameOver: false,
        drawPile: [],
        discardPile: []
    };
    //creat player objects
    for (let i = 0; i < playerIds.length; i++) {
        state.players.push({
            id: playerIds[i],
            name: playerNames[i],
            hand: [],
            saidUNO: false
        });
    }
    // Create and shuffle deck
    const deck = createDeck();
    state.drawPile = deck;
    // Deal cards to players
    deck.deal(7, state.players.map(p => p.hand));
    // Set top card
    while (true) {
        const card = deck.draw();
        if (card.color !== "wild") {
            state.topCard = card;
            state.currentColor = card.color;
            break;
        }
        else {
            state.discardPile.push(card);
        }
    }
    return state;
}
//play a card
export function playCard(playerIndex, cardIndex, wildColor, state) {
    if (state.gameOver) return false;

    const player = state.players[playerIndex];
    const selectedCard = player.hand[cardIndex];

    // Validate move
    if (!isValid(selectedCard,state,playerIndex)) {
        return false;
    }

    // Remove card from player's hand
    player.hand.splice(cardIndex, 1);

    // Update top card
    state.discardPile.push(state.topCard);
    state.topCard = selectedCard;

    // Update current color
    if(wildColor)
        state.currentColor = wildColor;
    else
        state.currentColor = selectedCard.color;

    //next step
    if(typeof(selectedCard.value) == 'number')
        nextTurn(state);
    else
        applyCardEffect(selectedCard, state);
    // Check win condition
    if (player.hand.length === 0) {
        state.gameOver = true;
    }
    return true;
}
export function drawCardBtn(playerIndex,state)
{
    if(playerIndex !== state.currentPlayerIndex) return;//only allow current player to draw cards
    drawCards(playerIndex, 1, state);
    const handLength = state.players[playerIndex].hand.length;
    const cardDrawn = state.players[playerIndex].hand[handLength-1];
    //if the drawn card is playable, mark it as valid so that player can play it and only it
    if(isValid(cardDrawn,state,playerIndex))
    {
        for( let card of state.players[state.currentPlayerIndex]?.hand ?? [])
        {
            card.valid = false;//reset valid status of cards
        }
        cardDrawn.valid = true;
        return;
    }
    nextTurn(state);
}
//declare uno
export function declareUNO(playerIndex,state)
{
    const player = state.players[playerIndex];
    if(player.hand.length==1)
        player.saidUNO = true;
}
//change turn
export function nextTurn(state)
{
    for( let card of state.players[state.currentPlayerIndex]?.hand ?? [])
    {
        card.valid = false;//reset valid status of cards at the start of each turn
    }
    state.currentPlayerIndex =(state.currentPlayerIndex + state.direction + state.players.length) 
    % state.players.length;
    for( let card of state.players[state.currentPlayerIndex].hand)
    {
        if(isValid(card,state,state.currentPlayerIndex))
            card.valid = true;
        else
            card.valid = false;
    }
}
//helper functions
//create a deck of cards
function createDeck()
{
    const deck = [];
    for(let color of ["red", "yellow", "green", "blue"])
    {
        for(let value of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, "skip", "reverse", "draw2"])
        {
            deck.push({color, value, valid: false});
            if(value !== 0)
            {
                deck.push({color, value, valid: false});//two of each card except 0
            }
        }
    }
    for(let i=0; i<4; i++)
    {
        deck.push({color: "wild", value: "wild", valid: false});
        deck.push({color: "wild", value: "wildDraw4", valid: false});
    }
    return Shuffle.shuffle({deck});
}
//main function to call the individual functions(can add new power cards in the future)
function applyCardEffect(card, state) {
    const totalPlayers = state.players.length;

    switch (card.value) {

        case "skip":
            nextTurn(state); // skip next
            nextTurn(state);
            break;

        case "reverse":
            if (totalPlayers > 2) {
                state.direction *= -1;
                nextTurn(state);
            } else {
                // reverse acts like skip in 2-player
                nextTurn(state);
                nextTurn(state);
            }
            break;

        case "draw2":
            nextTurn(state);
            drawCards(state.currentPlayerIndex, 2, state);
            nextTurn(state);
            break;

        case "wildDraw4":
            nextTurn(state);
            drawCards(state.currentPlayerIndex, 4, state);
            nextTurn(state);
            break;

        case "wild":
            nextTurn(state);
            break;

        default:
            nextTurn(state);
    }
}
//draw cards
function drawCards(playerIndex,count,state)
{
    if(state.drawPile.length<=0 && state.discardPile.length<=0) return;//no cards left to draw
    const player = state.players[playerIndex];
    player.saidUNO=false;//reset uno declaration if player draws a card
    if(state.drawPile.length<=count)
    {
        count-=state.drawPile.length;
        state.drawPile.deal(state.drawPile.length, [player.hand]);
        //if draw pile is empty, shuffle discard pile and move to draw pile
        state.drawPile = state.discardPile;
        state.discardPile = [];
        state.drawPile = Shuffle.shuffle({deck: state.drawPile});
    }
    if(state.drawPile.length<count)
        state.drawPile.deal(state.drawPile.length, [player.hand]);
    else
        state.drawPile.deal(count, [player.hand]);
}
//validate if the played card is valid
function isValid(card,state,playerIndex)
{
    if(!card || state.currentPlayerIndex!==playerIndex)
        return false;
    return (card.color===state.currentColor||card.value===state.topCard.value||card.color==='wild')
}