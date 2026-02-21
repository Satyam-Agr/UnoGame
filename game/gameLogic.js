import Shuffle from 'shuffle';//for shuffling the deck
//initialize game state
export function initGameState(playerIds, playerNames)
{
    const state = {
        players: [],
        currentPlayerIndex: 0,
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
            break;
        }
        else {
            state.discardPile.push(card);
        }
    }
    return state;
}
//validate if the played card is valid
export function isValid(card,state)
{
    if(!card)
        return false;
    return (card.color===state.currentColor||card.value===state.topCard.value||card.color==='wild')
}
//play a card
export function playCard(playerIndex, cardIndex, state,) {
    if (state.gameOver) return false;

    const player = state.players[playerIndex];
    const selectedCard = player.hand[cardIndex];

    // Validate move
    if (!isValid(selectedCard,state)) {
        return false;
    }

    // Remove card from player's hand
    player.hand.splice(cardIndex, 1);

    // Update top card
    state.topCard = selectedCard;

    // Update current color
    if(selectedCard.color==="wild")
        state.currentColor = wildColor(state.currentPlayerIndex, state);
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
//draw cards
export function drawCards(playerIndex,count,state)
{
    //select player
    const player=state.players[playerIndex];
    player.saidUNO=false;
    const colors=['green','red','yellow','blue'];//temp
    while(count-->0)
    {
        //draw from the draw pile
        const card={ color: colors[Math.floor(Math.random()*4)], value: Math.floor(Math.random()*10) };// temp

        //update state
        player.hand.push(card);
        state.drawPileCount--;
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
            deck.push({color, value});
            if(value !== 0)
            {
                deck.push({color, value});
            }
        }
    }
    for(let i=0; i<4; i++)
    {
        deck.push({color: "wild", value: "wild"});
        deck.push({color: "wild", value: "wildDraw4"});
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

        case "wilddraw4":
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
//next player index
function nextTurn(state)
{
    state.currentPlayerIndex =(state.currentPlayerIndex + state.direction + state.players.length) 
    % state.players.length;
}
//choose a color for wild card
function wildColor()
{
    //temp
    const colors=['green','red','yellow','blue'];
    return colors[Math.floor(Math.random()*4)];
}