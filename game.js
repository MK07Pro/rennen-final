// --- HTML ELEMENTE LADEN ---
// Hier holen wir uns alle Buttons und Textfelder aus dem HTML, damit wir sie steuern können.
const startGameButton = document.getElementById('startGameButton');
const gameStatusText = document.getElementById('gameStatusText');
const twoPlayerModeCheckbox = document.getElementById('twoPlayerModeCheckbox');
const playerOneKeyInput = document.getElementById('playerOneKeyInput');
const playerTwoKeyInput = document.getElementById('playerTwoKeyInput');
const playerTwoSetupContainer = document.getElementById('playerTwoSetupContainer');
const gameModeDisplay = document.getElementById('gameModeDisplay');

// Die Pop-Up Fenster (Modals)
const startScreenModal = document.getElementById('startScreenModal');
const closeModalButton = document.getElementById('closeModalButton');
const difficultySelect = document.getElementById('difficultySelect');
const tournamentCheckbox = document.getElementById('tournamentCheckbox');

// Shop und Doping Elemente
const openShopButton = document.getElementById('openShopButton');
const shopModal = document.getElementById('shopModal');
const closeShopButton = document.getElementById('closeShopButton');
const shopItemsContainer = document.getElementById('shopItemsContainer');

const dopingModal = document.getElementById('dopingModal');
const acceptDopingButton = document.getElementById('acceptDopingButton');
const declineDopingButton = document.getElementById('declineDopingButton');

const bustedOverlay = document.getElementById('bustedOverlay');
const confirmBustedButton = document.getElementById('confirmBustedButton');

// Die Pferde Bilder auf der Rennbahn
const horsePlayerOne = document.getElementById('horsePlayerOne');
const horsePlayerTwo = document.getElementById('horsePlayerTwo');
const computerHorses = [
    document.getElementById('horseComputerTwo'),
    document.getElementById('horseComputerThree')
];

// Geld und Punkteanzeige
const playerMoneyDisplay = document.getElementById('playerMoneyDisplay');
const bettingInput = document.getElementById('bettingInput');
const resultsList = document.getElementById('resultsList');

// --- SPIEL VARIABLEN ---
// Hier speichern wir die Tasten, die die Spieler ausgewählt haben
let playerKeys = { playerOne: null, playerTwo: null };
// Damit man nicht schummeln kann durch Gedrückthalten, merken wir uns, ob die Taste gerade unten ist
let isKeyPressed = { playerOne: false, playerTwo: false };
let isGameRunning = false;
// Wo sind die Pferde gerade? (0 bis 100 Prozent)
let horsePositions = { playerOne: 0, playerTwo: 0, computerTwo: 0, computerThree: 0 };
let gameLoopInterval = null;
let playerMoney = 1000;
let currentBetAmount = 0;

// Einstellungen für das Spiel
let selectedDifficulty = 'medium';
let isTournamentMode = false;
let currentTournamentRound = 1;
const MAX_TOURNAMENT_ROUNDS = 3;
const FINISH_LINE_PERCENTAGE = 92;

// Hat der Spieler gedopt?
let isPlayerDoped = false;

// --- SHOP DATEN ---
// Liste aller Pferde, die man kaufen kann
const availableShopItems = [
    { id: 'bronze', name: 'Bronze Pferd', price: 1000, image: 'pferd-bronze.png' },
    { id: 'silber', name: 'Silber Pferd', price: 1500, image: 'pferd-silber.png' },
    { id: 'gold', name: 'Gold Pferd', price: 2000, image: 'pferd-gold.png' },
    { id: 'elefant', name: 'Elefant', price: 5000, image: 'pferd-elefant.png' },
    { id: 'loewe', name: 'Löwe', price: 10000, image: 'pferd-loewe.png' },
    { id: 'einhorn-bunt', name: 'buntes Einhorn', price: 50000, image: 'pferd_einhorn_weiß.png'},
    { id: 'einhorn', name: 'Einhorn', price: 100000, image: 'pferd-einhorn.png' }
];
let purchasedSkinIds = []; // Welche Pferde gehören uns schon?
let activeSkinImage = 'pferd-gelb.png'; // Welches Pferd nutzen wir gerade?

const BASE_SPEED_SETTINGS = { easy: 0.25, medium: 0.4, hard: 0.55 };

// --- SHOP FUNKTIONEN ---
openShopButton.addEventListener('click', () => {
    updateShopDisplay();
    shopModal.classList.remove('hidden-element');
});
closeShopButton.addEventListener('click', () => shopModal.classList.add('hidden-element'));

// Baut den Shop jedes Mal neu auf, um Updates anzuzeigen
function updateShopDisplay() {
    shopItemsContainer.innerHTML = '';
    
    // Das Standard Pferd ist immer da
    const defaultItem = buildShopItem('Standard', 0, 'pferd-gelb.png', true);
    shopItemsContainer.appendChild(defaultItem);

    availableShopItems.forEach(item => {
        const isOwned = purchasedSkinIds.includes(item.id);
        const newItem = buildShopItem(item.name, item.price, item.image, isOwned, item.id);
        shopItemsContainer.appendChild(newItem);
    });
}

function buildShopItem(name, price, image, isOwned, id) {
    const itemContainer = document.createElement('div');
    itemContainer.className = 'shop-product-card';
    if(isOwned) itemContainer.classList.add('status-owned');
    if(activeSkinImage === image) itemContainer.classList.add('status-equipped');

    itemContainer.innerHTML = `
        <img src="${image}" alt="${name}">
        <h4>${name}</h4>
        <div class="price-label">${isOwned ? 'Im Besitz' : price + '$'}</div>
    `;

    itemContainer.addEventListener('click', () => {
        if (isOwned) {
            // Ausrüsten
            activeSkinImage = image;
            horsePlayerOne.src = activeSkinImage;
            updateShopDisplay(); // Oberfläche neu laden
        } else {
            // Kaufen
            if (playerMoney >= price) {
                playerMoney -= price;
                purchasedSkinIds.push(id);
                activeSkinImage = image;
                horsePlayerOne.src = activeSkinImage;
                updateMoneyDisplay();
                updateShopDisplay();
                alert(`Erfolgreich gekauft: ${name}`);
            } else {
                alert("Nicht genug Geld!");
            }
        }
    });
    return itemContainer;
}

// --- EINSTELLUNGEN & POPUPS ---
closeModalButton.addEventListener('click', () => {
    selectedDifficulty = difficultySelect.value;
    isTournamentMode = tournamentCheckbox.checked;
    updateGameModeDisplay();
    startScreenModal.classList.add('hidden-element');
});

function updateGameModeDisplay() {
    let text = selectedDifficulty.toUpperCase();
    if (isTournamentMode) text += ` (🏆 TURNIER - RUNDE ${currentTournamentRound})`;
    else text += " (EINZELRENNEN)";
    gameModeDisplay.innerText = text;
}

twoPlayerModeCheckbox.addEventListener('change', () => {
    if (twoPlayerModeCheckbox.checked) {
        playerTwoSetupContainer.style.display = 'block';
        playerTwoKeyInput.value = ""; playerKeys.playerTwo = null; checkIfPlayersReady();
    } else {
        playerTwoSetupContainer.style.display = 'none'; playerKeys.playerTwo = null; checkIfPlayersReady();
    }
});

playerOneKeyInput.addEventListener('keydown', (event) => {
    event.preventDefault(); 
    playerKeys.playerOne = event.code; 
    playerOneKeyInput.value = event.key.toUpperCase(); 
    checkIfPlayersReady();
});

playerTwoKeyInput.addEventListener('keydown', (event) => {
    event.preventDefault();
    if (event.code === playerKeys.playerOne) { alert("Andere Taste wählen!"); return; }
    playerKeys.playerTwo = event.code; 
    playerTwoKeyInput.value = event.key.toUpperCase(); 
    checkIfPlayersReady();
});

function checkIfPlayersReady() {
    // Start Button nur aktivieren, wenn alle Tasten belegt sind
    if (playerKeys.playerOne && (!twoPlayerModeCheckbox.checked || playerKeys.playerTwo)) {
        startGameButton.disabled = false; gameStatusText.innerText = "Bereit zum Start!";
    } else {
        startGameButton.disabled = true; gameStatusText.innerText = "Wähle Tasten...";
    }
}

// --- DOPING FUNKTIONEN ---
acceptDopingButton.addEventListener('click', () => {
    if (playerMoney >= 500) {
        playerMoney -= 500;
        isPlayerDoped = true;
        updateMoneyDisplay();
        dopingModal.classList.add('hidden-element');
        gameStatusText.innerText = "💉 Doping verabreicht...";
        setTimeout(executeStartTimer, 1000);
    } else {
        alert("Nicht genug Geld für Doping!");
    }
});

declineDopingButton.addEventListener('click', () => {
    isPlayerDoped = false;
    dopingModal.classList.add('hidden-element');
    executeStartTimer();
});

// --- DISQUALIFIZIERT (BUSTED) ---
confirmBustedButton.addEventListener('click', () => {
    bustedOverlay.classList.add('hidden-element');
    resetTournament(); // Verloren -> Alles zurücksetzen
    startGameButton.disabled = false;
    resetGame();
});

// --- START LOGIK ---
startGameButton.addEventListener('click', () => {
    let betAmount = parseInt(bettingInput.value);
    if (betAmount > playerMoney || betAmount < 0) { alert("Ungültiger Einsatz!"); return; }
    currentBetAmount = betAmount;
    playerMoney -= currentBetAmount;
    updateMoneyDisplay();
    resetGame();
    startCountdown();
});

function startCountdown() {
    startGameButton.disabled = true;
    
    // Check ob wir in Runde 3 sind (Doping anbieten)
    if (isTournamentMode && currentTournamentRound === 3 && !twoPlayerModeCheckbox.checked) {
        dopingModal.classList.remove('hidden-element');
        return; // Wir warten hier auf die Entscheidung im Modal
    }

    if (isTournamentMode) {
        gameStatusText.innerText = `🏆 RUNDE ${currentTournamentRound} von ${MAX_TOURNAMENT_ROUNDS}`;
        setTimeout(executeStartTimer, 1500);
    } else {
        executeStartTimer();
    }
}

function executeStartTimer() {
    let secondsLeft = 3;
    gameStatusText.innerText = secondsLeft; gameStatusText.style.color = "#e74c3c";
    let timerInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft > 0) gameStatusText.innerText = secondsLeft;
        else {
            clearInterval(timerInterval);
            gameStatusText.innerText = "LOS!!!"; gameStatusText.style.color = "#27ae60";
            startRaceLoop();
        }
    }, 1000);
}

function startRaceLoop() {
    isGameRunning = true;
    let difficultyMultiplier = BASE_SPEED_SETTINGS[selectedDifficulty];

    if (isTournamentMode) {
        const roundBoost = 1 + ((currentTournamentRound - 1) * 0.1);
        difficultyMultiplier *= roundBoost;
    }

    gameLoopInterval = setInterval(() => {
        if (!isGameRunning) return;
        // Wenn kein 2. Spieler da ist, spielt der Computer das Pferd
        if (!twoPlayerModeCheckbox.checked) moveComputerHorse(horsePlayerTwo, 'playerTwo', difficultyMultiplier);
        moveComputerHorse(computerHorses[0], 'computerTwo', difficultyMultiplier);
        moveComputerHorse(computerHorses[1], 'computerThree', difficultyMultiplier);
    }, 50);
}

// --- TASTENDRUCK VERARBEITUNG ---
document.addEventListener('keydown', (event) => {
    if (!isGameRunning) return;

    // SPIELER 1
    if (event.code === playerKeys.playerOne) {
        if (isKeyPressed.playerOne) return; 
        isKeyPressed.playerOne = true;
        
        let movementAmount = 1;

        // Wenn gedopt, rennt man schneller
        if (isPlayerDoped) {
            movementAmount = 1.3; // 30% Bonus
            
            // Ab 80% Strecke besteht Risiko erwischt zu werden
            if (horsePositions.playerOne > 80) {
                if (Math.random() < 0.045) {
                    handleDopingDisqualification();
                    return;
                }
            }
        }

        horsePositions.playerOne += movementAmount;
        updateHorseVisuals(horsePlayerOne, horsePositions.playerOne);
        checkForWinner('Spieler 1');
    }

    // SPIELER 2
    if (twoPlayerModeCheckbox.checked && event.code === playerKeys.playerTwo) {
        if (isKeyPressed.playerTwo) return;
        isKeyPressed.playerTwo = true;
        horsePositions.playerTwo += 1;
        updateHorseVisuals(horsePlayerTwo, horsePositions.playerTwo);
        checkForWinner('Spieler 2');
    }
});

document.addEventListener('keyup', (event) => {
    if (event.code === playerKeys.playerOne) isKeyPressed.playerOne = false;
    if (event.code === playerKeys.playerTwo) isKeyPressed.playerTwo = false;
});

function handleDopingDisqualification() {
    isGameRunning = false;
    clearInterval(gameLoopInterval);
    playerMoney = 1; // Strafe: Fast alles Geld weg
    updateMoneyDisplay();
    bustedOverlay.classList.remove('hidden-element');
    addResultToScoreboard(false, "DISQUALIFIZIERT (Doping)");
}

// --- COMPUTER GEGNER (KI) ---
function moveComputerHorse(element, horseId, difficultyMultiplier) {
    let randomSpeed = (Math.random() * 6.0 - 1.5);
    if (randomSpeed < 0) randomSpeed = 0;
    const finalSpeed = randomSpeed * difficultyMultiplier * 0.4;
    horsePositions[horseId] += finalSpeed;
    updateHorseVisuals(element, horsePositions[horseId]);
    
    let displayName = "KI";
    if (horseId === 'playerTwo') displayName = "Gegner 1";
    if (horseId === 'computerTwo') displayName = "Gegner 2";
    if (horseId === 'computerThree') displayName = "Gegner 3";
    checkForWinner(displayName);
}

function updateHorseVisuals(element, percentValue) {
    let visualLeft = -5 + (percentValue * 0.93);
    element.style.left = visualLeft + '%';
    // Animation: Pferd hüpft beim Laufen
    let scale = 1 + (percentValue / 100 * 0.3);
    let jumpHeight = Math.abs(Math.sin(percentValue * 1.5)) * -15; 
    let rotation = Math.sin(percentValue * 1.5) * 5; 
    element.style.transform = `scale(${scale}) translateY(${jumpHeight}px) rotate(${rotation}deg)`;
}

function checkForWinner(winnerName) {
    if (horsePositions.playerOne >= FINISH_LINE_PERCENTAGE || horsePositions.playerTwo >= FINISH_LINE_PERCENTAGE ||
        horsePositions.computerTwo >= FINISH_LINE_PERCENTAGE || horsePositions.computerThree >= FINISH_LINE_PERCENTAGE) {
        if (isGameRunning) {
            finishRace(winnerName);
        }
    }
}

function finishRace(winner) {
    isGameRunning = false;
    clearInterval(gameLoopInterval);
    let didPlayerOneWin = (winner === 'Spieler 1');
    
    isPlayerDoped = false;

    if (isTournamentMode) {
        if (didPlayerOneWin) {
            if (currentTournamentRound < MAX_TOURNAMENT_ROUNDS) {
                gameStatusText.innerText = `Runde ${currentTournamentRound} gewonnen!`;
                gameStatusText.style.color = "gold";
                currentTournamentRound++; 
                playerMoney += Math.floor(currentBetAmount * 1.5);
                updateMoneyDisplay();
                setTimeout(() => {
                    startGameButton.disabled = false;
                    gameStatusText.innerText = `Bereit für Runde ${currentTournamentRound}?`;
                    updateGameModeDisplay();
                }, 2000);
                resetPositionsOnly(); 
                return; 
            } else {
                gameStatusText.innerText = `🏆 TURNIERSIEGER! JACKPOT! 🏆`;
                let jackpot = currentBetAmount * 5; 
                playerMoney += jackpot;
                addResultToScoreboard(true, `Turniersieg (+${jackpot}$)`);
                resetTournament();
            }
        } else {
            gameStatusText.innerText = `Runde ${currentTournamentRound} verloren gegen ${winner}`;
            gameStatusText.style.color = "white";
            addResultToScoreboard(false, `Turnier-Aus R${currentTournamentRound}`);
            resetTournament();
        }
    } else {
        if (didPlayerOneWin) {
            let winAmount = currentBetAmount * 2;
            playerMoney += winAmount;
            gameStatusText.innerText = `🏆 GEWONNEN! (+${winAmount}$)`;
            gameStatusText.style.color = "gold";
            addResultToScoreboard(true, `Sieg (+${winAmount}$)`);
        } else {
            gameStatusText.innerText = `Verloren! Sieger: ${winner}`;
            gameStatusText.style.color = "white";
            addResultToScoreboard(false, `Verloren gegen ${winner}`);
        }
    }
    updateMoneyDisplay();
    startGameButton.disabled = false;
}

function updateMoneyDisplay() { playerMoneyDisplay.innerText = playerMoney; }

function addResultToScoreboard(hasWon, text) {
    const listItem = document.createElement('li');
    listItem.innerText = text; listItem.className = hasWon ? 'win-text-style' : 'loss-text-style';
    resultsList.prepend(listItem);
    if (resultsList.children.length > 5) resultsList.removeChild(resultsList.lastChild);
}

function resetGame() {
    horsePositions = { playerOne: 0, playerTwo: 0, computerTwo: 0, computerThree: 0 };
    resetHorseStyles();
    gameStatusText.style.color = "#e74c3c";
    isPlayerDoped = false;
}

function resetPositionsOnly() {
    horsePositions = { playerOne: 0, playerTwo: 0, computerTwo: 0, computerThree: 0 };
    resetHorseStyles();
}

function resetHorseStyles() {
    const allHorses = [horsePlayerOne, horsePlayerTwo, computerHorses[0], computerHorses[1]];
    allHorses.forEach(horse => {
        horse.style.left = '-5%';
        horse.style.transform = 'scale(1)';
    });
}

function resetTournament() {
    currentTournamentRound = 1;
    updateGameModeDisplay();
}
