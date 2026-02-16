// --- DOM ELEMENTE LADEN ---
// Hier holen wir uns Referenzen zu allen wichtigen HTML-Elementen, damit wir sie später im Code steuern können.
const startGameButton = document.getElementById('startGameButton');
const gameStatusTextDisplay = document.getElementById('gameStatusTextDisplay');
const multiplayerModeCheckbox = document.getElementById('multiplayerModeCheckbox');
const playerOneKeyInput = document.getElementById('playerOneKeyInput');
const playerTwoKeyInput = document.getElementById('playerTwoKeyInput');
const playerTwoSetupContainer = document.getElementById('playerTwoSetupContainer');
const currentGameModeDisplay = document.getElementById('currentGameModeDisplay');

// Elemente für das Einstellungs-Fenster (Modal) am Anfang
const startScreenModal = document.getElementById('startScreenModal');
const closeModalButton = document.getElementById('closeModalButton');
const difficultySelectionDropdown = document.getElementById('difficultySelectionDropdown');
const tournamentModeCheckbox = document.getElementById('tournamentModeCheckbox');

// Elemente für den Shop und das Doping-System
const openShopButton = document.getElementById('openShopButton');
const shopInterfaceModal = document.getElementById('shopInterfaceModal');
const closeShopButton = document.getElementById('closeShopButton');
const shopItemsContainer = document.getElementById('shopItemsContainer');

const dopingOfferModal = document.getElementById('dopingOfferModal');
const acceptDopingButton = document.getElementById('acceptDopingButton');
const declineDopingButton = document.getElementById('declineDopingButton');

const bustedNotificationOverlay = document.getElementById('bustedNotificationOverlay');
const confirmBustedButton = document.getElementById('confirmBustedButton');

// Die Pferde-Bilder auf der Rennbahn
const playerOneHorseImage = document.getElementById('playerOneHorseImage');
const playerTwoHorseImage = document.getElementById('playerTwoHorseImage');
// Hier speichern wir die KI-Gegner in einer Liste, um sie leichter durchlaufen zu können
const computerOpponentImages = [
    document.getElementById('computerOpponentImageOne'),
    document.getElementById('computerOpponentImageTwo')
];

// Elemente für Geldanzeige und Punktestand
const currentBalanceDisplay = document.getElementById('currentBalanceDisplay');
const bettingAmountInput = document.getElementById('bettingAmountInput');
const scoreboardList = document.getElementById('scoreboardList');

// --- SPIEL VARIABLEN ---
// Hier speichern wir, welche Tasten die Spieler gedrückt haben
let assignedControlKeys = { playerOne: null, playerTwo: null };
// Damit man nicht einfach die Taste gedrückt halten kann, merken wir uns den Status
let isKeyPressedState = { playerOne: false, playerTwo: false };
let isGameCurrentlyActive = false;
// Die aktuellen Positionen der Pferde auf der Bahn (in Prozent)
let currentRacePositions = { playerOne: 0, playerTwo: 0, computerOne: 0, computerTwo: 0 };
let gameLoopInterval = null;
let playerAccountBalance = 1000;
let currentActiveBet = 0;

// Globale Einstellungen für das aktuelle Spiel
let selectedDifficultyLevel = 'medium';
let isTournamentModeActive = false;
let currentTournamentRound = 1;
const MAXIMUM_TOURNAMENT_ROUNDS = 3;
// Ziel ist bei 92%, damit die Nase des Pferdes über die Linie geht
const FINISH_LINE_PERCENTAGE = 92;

// Status für illegale Substanzen
let isPlayerDoped = false;

// --- SHOP DATEN ---
// Eine Liste aller verfügbaren Skins mit Preisen und Bildpfaden
const availableShopMerchandise = [
    { identifier: 'bronze', displayName: 'Bronze Pferd', cost: 1000, imageSource: 'pferd-bronze.png' },
    { identifier: 'silber', displayName: 'Silber Pferd', cost: 1500, imageSource: 'pferd-silber.png' },
    { identifier: 'gold', displayName: 'Gold Pferd', cost: 2000, imageSource: 'pferd-gold.png' },
    { identifier: 'elefant', displayName: 'Elefant', cost: 5000, imageSource: 'pferd-elefant.png' },
    { identifier: 'loewe', displayName: 'Löwe', cost: 10000, imageSource: 'pferd-loewe.png' },
    { identifier: 'einhorn-bunt', displayName: 'buntes Einhorn', cost: 50000, imageSource: 'pferd_einhorn_weiß.png'},
    { identifier: 'einhorn', displayName: 'Einhorn', cost: 100000, imageSource: 'pferd-einhorn.png' }
];
let purchasedSkinIdentifiers = []; // Liste der IDs, die wir schon besitzen
let currentlyEquippedSkin = 'pferd-gelb.png'; // Das Standard-Aussehen

// Geschwindigkeits-Multiplikatoren für die KI je nach Schwierigkeit
const BASE_DIFFICULTY_SPEEDS = { easy: 0.25, medium: 0.4, hard: 0.55 };

// --- SHOP FUNKTIONALITÄT ---
// Öffnen des Shops beim Klick
openShopButton.addEventListener('click', () => {
    generateShopInterface();
    shopInterfaceModal.classList.remove('visually-hidden');
});
// Schließen des Shops
closeShopButton.addEventListener('click', () => shopInterfaceModal.classList.add('visually-hidden'));

// Diese Funktion baut den Shop jedes Mal neu auf, um Updates (gekauft/ausgerüstet) anzuzeigen
function generateShopInterface() {
    shopItemsContainer.innerHTML = '';
    
    // Das Standard-Pferd ist immer verfügbar, also fügen wir es manuell hinzu
    const defaultItemContainer = createShopMerchandiseElement('Standard', 0, 'pferd-gelb.png', true);
    shopItemsContainer.appendChild(defaultItemContainer);

    // Jetzt gehen wir durch alle Items im Array und erstellen die Elemente
    availableShopMerchandise.forEach(item => {
        const isAlreadyOwned = purchasedSkinIdentifiers.includes(item.identifier);
        const itemContainer = createShopMerchandiseElement(item.displayName, item.cost, item.imageSource, isAlreadyOwned, item.identifier);
        shopItemsContainer.appendChild(itemContainer);
    });
}

// Hilfsfunktion, um ein einzelnes Produkt im Shop als HTML-Element zu erstellen
function createShopMerchandiseElement(itemName, itemPrice, imagePath, isOwned, itemId) {
    const itemContainer = document.createElement('div');
    itemContainer.className = 'shop-merchandise-card';
    
    if(isOwned) itemContainer.classList.add('status-owned');
    if(currentlyEquippedSkin === imagePath) itemContainer.classList.add('status-equipped');

    // HTML-Struktur für das Produkt zusammenbauen
    itemContainer.innerHTML = `
        <img src="${imagePath}" alt="${itemName}">
        <h4>${itemName}</h4>
        <div class="price-tag">${isOwned ? 'Im Besitz' : itemPrice + '$'}</div>
    `;

    // Klick-Logik: Entweder Ausrüsten (wenn gekauft) oder Kaufen (wenn genug Geld da ist)
    itemContainer.addEventListener('click', () => {
        if (isOwned) {
            // Skin aktivieren
            currentlyEquippedSkin = imagePath;
            playerOneHorseImage.src = currentlyEquippedSkin;
            generateShopInterface(); // Oberfläche aktualisieren, damit der Rahmen angezeigt wird
        } else {
            // Kaufversuch
            if (playerAccountBalance >= itemPrice) {
                playerAccountBalance -= itemPrice;
                purchasedSkinIdentifiers.push(itemId);
                currentlyEquippedSkin = imagePath;
                playerOneHorseImage.src = currentlyEquippedSkin;
                updateBalanceDisplay();
                generateShopInterface();
                alert(`Erfolgreich gekauft: ${itemName}`);
            } else {
                alert("Nicht genug Geld!");
            }
        }
    });
    return itemContainer;
}

// --- SPIELVORBEREITUNG & FENSTER-MANAGEMENT ---
closeModalButton.addEventListener('click', () => {
    selectedDifficultyLevel = difficultySelectionDropdown.value;
    isTournamentModeActive = tournamentModeCheckbox.checked;
    updateGameModeTextDisplay();
    startScreenModal.classList.add('visually-hidden');
});

function updateGameModeTextDisplay() {
    let modeDescriptionText = selectedDifficultyLevel.toUpperCase();
    if (isTournamentModeActive) modeDescriptionText += ` (🏆 TURNIER - RUNDE ${currentTournamentRound})`;
    else modeDescriptionText += " (EINZELRENNEN)";
    currentGameModeDisplay.innerText = modeDescriptionText;
}

// Umschalten zwischen Einzel- und Mehrspieler
multiplayerModeCheckbox.addEventListener('change', () => {
    if (multiplayerModeCheckbox.checked) {
        playerTwoSetupContainer.style.display = 'block';
        playerTwoKeyInput.value = ""; 
        assignedControlKeys.playerTwo = null; 
        verifyPlayersAreReady();
    } else {
        playerTwoSetupContainer.style.display = 'none'; 
        assignedControlKeys.playerTwo = null; 
        verifyPlayersAreReady();
    }
});

// Tastenerfassung für Spieler 1
playerOneKeyInput.addEventListener('keydown', (event) => {
    event.preventDefault(); 
    assignedControlKeys.playerOne = event.code; 
    playerOneKeyInput.value = event.key.toUpperCase(); 
    verifyPlayersAreReady();
});

// Tastenerfassung für Spieler 2 (darf nicht die gleiche Taste sein!)
playerTwoKeyInput.addEventListener('keydown', (event) => {
    event.preventDefault();
    if (event.code === assignedControlKeys.playerOne) { alert("Andere Taste wählen!"); return; }
    assignedControlKeys.playerTwo = event.code; 
    playerTwoKeyInput.value = event.key.toUpperCase(); 
    verifyPlayersAreReady();
});

// Prüfen, ob alle notwendigen Tasten belegt sind, bevor der Start-Button aktiviert wird
function verifyPlayersAreReady() {
    if (assignedControlKeys.playerOne && (!multiplayerModeCheckbox.checked || assignedControlKeys.playerTwo)) {
        startGameButton.disabled = false; 
        gameStatusTextDisplay.innerText = "Bereit zum Start!";
    } else {
        startGameButton.disabled = true; 
        gameStatusTextDisplay.innerText = "Wähle Tasten...";
    }
}

// --- DOPING LOGIK ---
acceptDopingButton.addEventListener('click', () => {
    if (playerAccountBalance >= 500) {
        playerAccountBalance -= 500;
        isPlayerDoped = true;
        updateBalanceDisplay();
        dopingOfferModal.classList.add('visually-hidden');
        gameStatusTextDisplay.innerText = "💉 Doping verabreicht...";
        // Kurze Verzögerung für den dramatischen Effekt
        setTimeout(executeCountdownTimer, 1000);
    } else {
        alert("Nicht genug Geld für Doping!");
    }
});

declineDopingButton.addEventListener('click', () => {
    isPlayerDoped = false;
    dopingOfferModal.classList.add('visually-hidden');
    executeCountdownTimer();
});

// --- DISQUALIFIKATION (BUSTED) LOGIK ---
confirmBustedButton.addEventListener('click', () => {
    bustedNotificationOverlay.classList.add('visually-hidden');
    resetTournamentProgress(); // Game Over -> Alles auf Anfang
    startGameButton.disabled = false;
    resetGameToInitialState();
});

// --- START LOGIK ---
startGameButton.addEventListener('click', () => {
    let betAmount = parseInt(bettingAmountInput.value);
    
    // Validierung des Wetteinsatzes
    if (betAmount > playerAccountBalance || betAmount < 0) { alert("Ungültiger Einsatz!"); return; }
    
    currentActiveBet = betAmount;
    playerAccountBalance -= currentActiveBet;
    updateBalanceDisplay();
    resetGameToInitialState();
    initiateCountdownSequence();
});

function initiateCountdownSequence() {
    startGameButton.disabled = true;
    
    // Spezialfall: Doping-Angebot in der 3. Runde eines Turniers (nur Einzelspieler)
    if (isTournamentModeActive && currentTournamentRound === 3 && !multiplayerModeCheckbox.checked) {
        dopingOfferModal.classList.remove('visually-hidden');
        // Wir brechen hier ab, da das Modal dann den Timer startet
        return; 
    }

    if (isTournamentModeActive) {
        gameStatusTextDisplay.innerText = `🏆 RUNDE ${currentTournamentRound} von ${MAXIMUM_TOURNAMENT_ROUNDS}`;
        setTimeout(executeCountdownTimer, 1500);
    } else {
        executeCountdownTimer();
    }
}

function executeCountdownTimer() {
    let secondsRemaining = 3;
    gameStatusTextDisplay.innerText = secondsRemaining; 
    gameStatusTextDisplay.style.color = "#e74c3c";
    
    let countdownTimerId = setInterval(() => {
        secondsRemaining--;
        if (secondsRemaining > 0) {
            gameStatusTextDisplay.innerText = secondsRemaining;
        } else {
            clearInterval(countdownTimerId);
            gameStatusTextDisplay.innerText = "LOS!!!"; 
            gameStatusTextDisplay.style.color = "#27ae60";
            initializeGameLoop();
        }
    }, 1000);
}

function initializeGameLoop() {
    isGameCurrentlyActive = true;
    let difficultyMultiplier = BASE_DIFFICULTY_SPEEDS[selectedDifficultyLevel];

    // Im Turniermodus werden die Gegner pro Runde schneller
    if (isTournamentModeActive) {
        const roundDifficultyBoost = 1 + ((currentTournamentRound - 1) * 0.1);
        difficultyMultiplier *= roundDifficultyBoost;
    }

    // Der Loop läuft alle 50ms und bewegt die KIs
    gameLoopInterval = setInterval(() => {
        if (!isGameCurrentlyActive) return;
        
        // Wenn kein zweiter Spieler da ist, übernimmt die KI das zweite Pferd
        if (!multiplayerModeCheckbox.checked) moveComputerOpponent(playerTwoHorseImage, 'playerTwo', difficultyMultiplier);
        
        moveComputerOpponent(computerOpponentImages[0], 'computerOne', difficultyMultiplier);
        moveComputerOpponent(computerOpponentImages[1], 'computerTwo', difficultyMultiplier);
    }, 50);
}

// --- EINGABE VERARBEITUNG (TASTENDRUCK) ---
document.addEventListener('keydown', (event) => {
    if (!isGameCurrentlyActive) return;

    // LOGIK FÜR SPIELER 1
    if (event.code === assignedControlKeys.playerOne) {
        if (isKeyPressedState.playerOne) return; // Spam-Schutz (Gedrückthalten verhindern)
        isKeyPressedState.playerOne = true;
        
        let movementAmount = 1;

        // Wenn gedopt, ist der Spieler schneller, hat aber Risiko erwischt zu werden
        if (isPlayerDoped) {
            movementAmount = 1.3; // 30% Geschwindigkeitsboost
            
            // Risiko-Check ab 80% der Strecke
            if (currentRacePositions.playerOne > 80) {
                if (Math.random() < 0.045) {
                    triggerDisqualification();
                    return;
                }
            }
        }

        currentRacePositions.playerOne += movementAmount;
        updateHorseVisualPosition(playerOneHorseImage, currentRacePositions.playerOne);
        checkForVictory('Spieler 1');
    }

    // LOGIK FÜR SPIELER 2
    if (multiplayerModeCheckbox.checked && event.code === assignedControlKeys.playerTwo) {
        if (isKeyPressedState.playerTwo) return;
        isKeyPressedState.playerTwo = true;
        
        currentRacePositions.playerTwo += 1;
        updateHorseVisualPosition(playerTwoHorseImage, currentRacePositions.playerTwo);
        checkForVictory('Spieler 2');
    }
});

// Tasten loslassen registrieren (damit man wieder drücken kann)
document.addEventListener('keyup', (event) => {
    if (event.code === assignedControlKeys.playerOne) isKeyPressedState.playerOne = false;
    if (event.code === assignedControlKeys.playerTwo) isKeyPressedState.playerTwo = false;
});

function triggerDisqualification() {
    isGameCurrentlyActive = false;
    clearInterval(gameLoopInterval);
    playerAccountBalance = 1; // Strafe: Fast alles Geld weg
    updateBalanceDisplay();
    bustedNotificationOverlay.classList.remove('visually-hidden');
    addEntryToScoreboard(false, "DISQUALIFIZIERT (Doping)");
}

// --- KI BEWEGUNGS-LOGIK ---
function moveComputerOpponent(horseElement, horseIdentifier, difficultyMultiplier) {
    // Ein bisschen Zufall, damit sie nicht linear laufen
    let randomChaosFactor = (Math.random() * 6.0 - 1.5);
    if (randomChaosFactor < 0) randomChaosFactor = 0;
    
    const calculatedSpeed = randomChaosFactor * difficultyMultiplier * 0.4;
    currentRacePositions[horseIdentifier] += calculatedSpeed;
    
    updateHorseVisualPosition(horseElement, currentRacePositions[horseIdentifier]);
    
    // Namen für die Anzeige ermitteln
    let opponentDisplayName = "KI";
    if (horseIdentifier === 'playerTwo') opponentDisplayName = "Gegner 1";
    if (horseIdentifier === 'computerOne') opponentDisplayName = "Gegner 2";
    if (horseIdentifier === 'computerTwo') opponentDisplayName = "Gegner 3";
    
    checkForVictory(opponentDisplayName);
}

// Aktualisiert CSS für Bewegung und Animation (Hüpfen)
function updateHorseVisualPosition(element, percentagePosition) {
    let visualLeftPosition = -5 + (percentagePosition * 0.93);
    element.style.left = visualLeftPosition + '%';
    
    // Kleiner Skalierungseffekt für Tiefe und Hüpf-Animation
    let scaleFactor = 1 + (percentagePosition / 100 * 0.3);
    let jumpOffset = Math.abs(Math.sin(percentagePosition * 1.5)) * -15; 
    let rotationAngle = Math.sin(percentagePosition * 1.5) * 5; 
    
    element.style.transform = `scale(${scaleFactor}) translateY(${jumpOffset}px) rotate(${rotationAngle}deg)`;
}

// Prüfen, ob jemand über der Ziellinie ist
function checkForVictory(potentialWinnerName) {
    if (currentRacePositions.playerOne >= FINISH_LINE_PERCENTAGE || 
        currentRacePositions.playerTwo >= FINISH_LINE_PERCENTAGE ||
        currentRacePositions.computerOne >= FINISH_LINE_PERCENTAGE || 
        currentRacePositions.computerTwo >= FINISH_LINE_PERCENTAGE) {
        
        if (isGameCurrentlyActive) {
            handleGameEnd(potentialWinnerName);
        }
    }
}

function handleGameEnd(winnerName) {
    isGameCurrentlyActive = false;
    clearInterval(gameLoopInterval);
    let didPlayerOneWin = (winnerName === 'Spieler 1');
    
    // Doping für die nächste Runde zurücksetzen
    isPlayerDoped = false;

    if (isTournamentModeActive) {
        if (didPlayerOneWin) {
            // Wenn gewonnen und noch Runden übrig sind
            if (currentTournamentRound < MAXIMUM_TOURNAMENT_ROUNDS) {
                gameStatusTextDisplay.innerText = `Runde ${currentTournamentRound} gewonnen!`;
                gameStatusTextDisplay.style.color = "gold";
                
                currentTournamentRound++; 
                playerAccountBalance += Math.floor(currentActiveBet * 1.5);
                updateBalanceDisplay();
                
                // Kurze Pause vor der nächsten Runde
                setTimeout(() => {
                    startGameButton.disabled = false;
                    gameStatusTextDisplay.innerText = `Bereit für Runde ${currentTournamentRound}?`;
                    updateGameModeTextDisplay();
                }, 2000);
                
                resetPositionsOnly(); 
                return; 
            } else {
                // Turniersieg!
                gameStatusTextDisplay.innerText = `🏆 TURNIERSIEGER! JACKPOT! 🏆`;
                let jackpotAmount = currentActiveBet * 5; 
                playerAccountBalance += jackpotAmount;
                addEntryToScoreboard(true, `Turniersieg (+${jackpotAmount}$)`);
                resetTournamentProgress();
            }
        } else {
            // Verloren im Turnier
            gameStatusTextDisplay.innerText = `Runde ${currentTournamentRound} verloren gegen ${winnerName}`;
            gameStatusTextDisplay.style.color = "white";
            addEntryToScoreboard(false, `Turnier-Aus R${currentTournamentRound}`);
            resetTournamentProgress();
        }
    } else {
        // Normales Einzelrennen
        if (didPlayerOneWin) {
            let winAmount = currentActiveBet * 2;
            playerAccountBalance += winAmount;
            gameStatusTextDisplay.innerText = `🏆 GEWONNEN! (+${winAmount}$)`;
            gameStatusTextDisplay.style.color = "gold";
            addEntryToScoreboard(true, `Sieg (+${winAmount}$)`);
        } else {
            gameStatusTextDisplay.innerText = `Verloren! Sieger: ${winnerName}`;
            gameStatusTextDisplay.style.color = "white";
            addEntryToScoreboard(false, `Verloren gegen ${winnerName}`);
        }
    }
    
    updateBalanceDisplay();
    startGameButton.disabled = false;
}

function updateBalanceDisplay() { 
    currentBalanceDisplay.innerText = playerAccountBalance; 
}

function addEntryToScoreboard(hasWon, messageText) {
    const listElement = document.createElement('li');
    listElement.innerText = messageText; 
    listElement.className = hasWon ? 'victory-text-message' : 'defeat-text-message';
    
    scoreboardList.prepend(listElement);
    // Liste sauber halten (nur die letzten 5 Einträge)
    if (scoreboardList.children.length > 5) scoreboardList.removeChild(scoreboardList.lastChild);
}

// Setzt alles für ein komplett neues Rennen zurück
function resetGameToInitialState() {
    currentRacePositions = { playerOne: 0, playerTwo: 0, computerOne: 0, computerTwo: 0 };
    resetHorseVisualStyles();
    gameStatusTextDisplay.style.color = "#e74c3c";
    isPlayerDoped = false;
}

// Setzt nur die Positionen zurück (für Turnier-Zwischenrunden)
function resetPositionsOnly() {
    currentRacePositions = { playerOne: 0, playerTwo: 0, computerOne: 0, computerTwo: 0 };
    resetHorseVisualStyles();
}

// Setzt die CSS Styles der Pferde zurück auf Startposition
function resetHorseVisualStyles() {
    const allActiveHorses = [playerOneHorseImage, playerTwoHorseImage, computerOpponentImages[0], computerOpponentImages[1]];
    allActiveHorses.forEach(horse => {
        horse.style.left = '-5%';
        horse.style.transform = 'scale(1)';
    });
}

function resetTournamentProgress() {
    currentTournamentRound = 1;
    updateGameModeTextDisplay();
}
