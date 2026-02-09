// --- ELEMENTE ---
const startBtn = document.getElementById('startBtn');
const statusText = document.getElementById('statusText');
const multiplayerToggle = document.getElementById('multiplayerToggle');
const keyInput1 = document.getElementById('keyInput1');
const keyInput2 = document.getElementById('keyInput2');
const p2SetupDiv = document.getElementById('p2-setup');
const currentModeDisplay = document.getElementById('currentModeDisplay');

// Modal Elemente
const startModal = document.getElementById('startModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalDifficulty = document.getElementById('modalDifficulty');
const modalTournament = document.getElementById('modalTournament');

// Shop & Doping Elemente
const shopBtn = document.getElementById('shopBtn');
const shopModal = document.getElementById('shopModal');
const closeShopBtn = document.getElementById('closeShopBtn');
const shopContainer = document.getElementById('shopContainer');

const dopingModal = document.getElementById('dopingModal');
const acceptDopingBtn = document.getElementById('acceptDopingBtn');
const declineDopingBtn = document.getElementById('declineDopingBtn');

const bustedOverlay = document.getElementById('bustedOverlay');
const bustedConfirmBtn = document.getElementById('bustedConfirmBtn');

// Pferde
const horseP1 = document.getElementById('horse-p1');
const horseLane2 = document.getElementById('horse-lane2');
const aiHorses = [
    document.getElementById('horse-ai2'),
    document.getElementById('horse-ai3')
];

// Wett & Score
const moneyDisplay = document.getElementById('moneyDisplay');
const betInput = document.getElementById('betInput');
const scoreList = document.getElementById('scoreList');

// --- VARIABLEN ---
let keys = { p1: null, p2: null };
let keyState = { p1: false, p2: false };
let gameRunning = false;
let positions = { p1: 0, lane2: 0, ai2: 0, ai3: 0 };
let gameLoop = null;
let playerMoney = 1000;
let currentBet = 0;

// Spiel-Einstellungen
let selectedDifficulty = 'medium';
let isTournament = false;
let tournamentRound = 1;
const MAX_ROUNDS = 3;
const FINISH_LINE = 92;

// Doping Status
let isDoped = false;

// Shop Daten
const shopItems = [
    { id: 'bronze', name: 'Bronze Pferd', price: 1000, img: 'pferd-bronze.png' },
    { id: 'silber', name: 'Silber Pferd', price: 1500, img: 'pferd-silber.png' },
    { id: 'gold', name: 'Gold Pferd', price: 2000, img: 'pferd-gold.png' },
    { id: 'elefant', name: 'Elefant', price: 5000, img: 'pferd-elefant.png' },
    { id: 'loewe', name: 'Löwe', price: 10000, img: 'pferd-loewe.png' },
    { id: 'einhorn-bunt', name: 'buntes Einhorn', price: 50000, img: 'pferd_einhorn_weiß.png'},
    { id: 'einhorn', name: 'Einhorn', price: 100000, img: 'pferd-einhorn.png' }
];
let ownedSkins = []; // IDs der gekauften Skins
let currentSkin = 'pferd-gelb.png'; // Standard Skin

const BASE_SPEEDS = { easy: 0.25, medium: 0.4, hard: 0.55 };

// --- SHOP LOGIK ---
shopBtn.addEventListener('click', () => {
    renderShop();
    shopModal.classList.remove('hidden');
});
closeShopBtn.addEventListener('click', () => shopModal.classList.add('hidden'));

function renderShop() {
    shopContainer.innerHTML = '';
    
    // Standard Pferd (immer im Besitz)
    const defaultDiv = createShopItem('Standard', 0, 'pferd-gelb.png', true);
    shopContainer.appendChild(defaultDiv);

    shopItems.forEach(item => {
        const isOwned = ownedSkins.includes(item.id);
        const itemDiv = createShopItem(item.name, item.price, item.img, isOwned, item.id);
        shopContainer.appendChild(itemDiv);
    });
}

function createShopItem(name, price, img, isOwned, id) {
    const div = document.createElement('div');
    div.className = 'shop-item';
    if(isOwned) div.classList.add('owned');
    if(currentSkin === img) div.classList.add('equipped');

    div.innerHTML = `
        <img src="${img}" alt="${name}">
        <h4>${name}</h4>
        <div class="price">${isOwned ? 'Im Besitz' : price + '$'}</div>
    `;

    div.addEventListener('click', () => {
        if (isOwned) {
            // Ausrüsten
            currentSkin = img;
            horseP1.src = currentSkin;
            renderShop(); // Refresh UI
        } else {
            // Kaufen
            if (playerMoney >= price) {
                playerMoney -= price;
                ownedSkins.push(id);
                currentSkin = img;
                horseP1.src = currentSkin;
                updateMoneyUI();
                renderShop();
                alert(`Erfolgreich gekauft: ${name}`);
            } else {
                alert("Nicht genug Geld!");
            }
        }
    });
    return div;
}

// --- SETUP & MODALS ---
closeModalBtn.addEventListener('click', () => {
    selectedDifficulty = modalDifficulty.value;
    isTournament = modalTournament.checked;
    updateModeDisplay();
    startModal.classList.add('hidden');
});

function updateModeDisplay() {
    let modeText = selectedDifficulty.toUpperCase();
    if (isTournament) modeText += ` (🏆 TURNIER - RUNDE ${tournamentRound})`;
    else modeText += " (EINZELRENNEN)";
    currentModeDisplay.innerText = modeText;
}

multiplayerToggle.addEventListener('change', () => {
    if (multiplayerToggle.checked) {
        p2SetupDiv.style.display = 'block';
        keyInput2.value = ""; keys.p2 = null; checkReady();
    } else {
        p2SetupDiv.style.display = 'none'; keys.p2 = null; checkReady();
    }
});

keyInput1.addEventListener('keydown', (e) => {
    e.preventDefault(); keys.p1 = e.code; keyInput1.value = e.key.toUpperCase(); checkReady();
});

keyInput2.addEventListener('keydown', (e) => {
    e.preventDefault();
    if (e.code === keys.p1) { alert("Andere Taste wählen!"); return; }
    keys.p2 = e.code; keyInput2.value = e.key.toUpperCase(); checkReady();
});

function checkReady() {
    if (keys.p1 && (!multiplayerToggle.checked || keys.p2)) {
        startBtn.disabled = false; statusText.innerText = "Bereit zum Start!";
    } else {
        startBtn.disabled = true; statusText.innerText = "Wähle Tasten...";
    }
}

// --- DOPING LOGIK ---
acceptDopingBtn.addEventListener('click', () => {
    if (playerMoney >= 500) {
        playerMoney -= 500;
        isDoped = true;
        updateMoneyUI();
        dopingModal.classList.add('hidden');
        statusText.innerText = "💉 Doping verabreicht...";
        setTimeout(runTimer, 1000);
    } else {
        alert("Nicht genug Geld für Doping!");
    }
});

declineDopingBtn.addEventListener('click', () => {
    isDoped = false;
    dopingModal.classList.add('hidden');
    runTimer();
});

// --- BUSTED LOGIK ---
bustedConfirmBtn.addEventListener('click', () => {
    bustedOverlay.classList.add('hidden');
    resetTournament(); // Game Over -> Reset
    startBtn.disabled = false;
    resetGame();
});

// --- START LOGIK ---
startBtn.addEventListener('click', () => {
    let bet = parseInt(betInput.value);
    if (bet > playerMoney || bet < 0) { alert("Ungültiger Einsatz!"); return; }
    currentBet = bet;
    playerMoney -= currentBet;
    updateMoneyUI();
    resetGame();
    startCountdown();
});

function startCountdown() {
    startBtn.disabled = true;
    
    // Check auf Doping Szenario (Einzelspieler, Turnier, Runde 3)
    if (isTournament && tournamentRound === 3 && !multiplayerToggle.checked) {
        dopingModal.classList.remove('hidden');
        // Hier brechen wir ab, das Modal übernimmt den Aufruf von runTimer()
        return; 
    }

    let count = 3;
    if (isTournament) {
        statusText.innerText = `🏆 RUNDE ${tournamentRound} von ${MAX_ROUNDS}`;
        setTimeout(runTimer, 1500);
    } else {
        runTimer();
    }
}

function runTimer() {
    let count = 3;
    statusText.innerText = count; statusText.style.color = "#e74c3c";
    let timer = setInterval(() => {
        count--;
        if (count > 0) statusText.innerText = count;
        else {
            clearInterval(timer);
            statusText.innerText = "LOS!!!"; statusText.style.color = "#27ae60";
            startGame();
        }
    }, 1000);
}

function startGame() {
    gameRunning = true;
    let diffMultiplier = BASE_SPEEDS[selectedDifficulty];

    if (isTournament) {
        const roundBoost = 1 + ((tournamentRound - 1) * 0.1);
        diffMultiplier *= roundBoost;
    }

    gameLoop = setInterval(() => {
        if (!gameRunning) return;
        if (!multiplayerToggle.checked) moveAI(horseLane2, 'lane2', diffMultiplier);
        moveAI(aiHorses[0], 'ai2', diffMultiplier);
        moveAI(aiHorses[1], 'ai3', diffMultiplier);
    }, 50);
}

// --- INPUT HANDLER MIT DOPING EFFEKT ---
document.addEventListener('keydown', (e) => {
    if (!gameRunning) return;

    // SPIELER 1
    if (e.code === keys.p1) {
        if (keyState.p1) return; 
        keyState.p1 = true;
        
        let moveAmount = 1;

        // Doping Effekt
        if (isDoped) {
            moveAmount = 1.3; // 30% schneller
            
            if (positions.p1 > 80) {
                if (Math.random() < 0.045) {
                    triggerBusted();
                    return;
                }
            }
        }

        positions.p1 += moveAmount;
        updatePosition(horseP1, positions.p1);
        checkWin('Spieler 1');
    }

    // SPIELER 2
    if (multiplayerToggle.checked && e.code === keys.p2) {
        if (keyState.p2) return;
        keyState.p2 = true;
        positions.lane2 += 1;
        updatePosition(horseLane2, positions.lane2);
        checkWin('Spieler 2');
    }
});

document.addEventListener('keyup', (e) => {
    if (e.code === keys.p1) keyState.p1 = false;
    if (e.code === keys.p2) keyState.p2 = false;
});

function triggerBusted() {
    gameRunning = false;
    clearInterval(gameLoop);
    playerMoney = 1; // Alles verloren bis auf 1$
    updateMoneyUI();
    bustedOverlay.classList.remove('hidden');
    addToScoreboard(false, "DISQUALIFIZIERT (Doping)");
}

// --- KI LOGIK ---
function moveAI(element, id, diffMultiplier) {
    let chaosSpeed = (Math.random() * 6.0 - 1.5);
    if (chaosSpeed < 0) chaosSpeed = 0;
    const speed = chaosSpeed * diffMultiplier * 0.4;
    positions[id] += speed;
    updatePosition(element, positions[id]);
    
    let name = "KI";
    if (id === 'lane2') name = "Gegner 1";
    if (id === 'ai2') name = "Gegner 2";
    if (id === 'ai3') name = "Gegner 3";
    checkWin(name);
}

function updatePosition(element, percent) {
    let visualPercent = -5 + (percent * 0.93);
    element.style.left = visualPercent + '%';
    let scaleFactor = 1 + (percent / 100 * 0.3);
    let jump = Math.abs(Math.sin(percent * 1.5)) * -15; 
    let rotation = Math.sin(percent * 1.5) * 5; 
    element.style.transform = `scale(${scaleFactor}) translateY(${jump}px) rotate(${rotation}deg)`;
}

function checkWin(winnerName) {
    if (positions.p1 >= FINISH_LINE || positions.lane2 >= FINISH_LINE ||
        positions.ai2 >= FINISH_LINE || positions.ai3 >= FINISH_LINE) {
        if (gameRunning) {
            endGame(winnerName);
        }
    }
}

function endGame(winner) {
    gameRunning = false;
    clearInterval(gameLoop);
    let isWin = (winner === 'Spieler 1');
    
    // Doping zurücksetzen
    isDoped = false;

    if (isTournament) {
        if (isWin) {
            if (tournamentRound < MAX_ROUNDS) {
                statusText.innerText = `Runde ${tournamentRound} gewonnen!`;
                statusText.style.color = "gold";
                tournamentRound++; 
                playerMoney += Math.floor(currentBet * 1.5);
                updateMoneyUI();
                setTimeout(() => {
                    startBtn.disabled = false;
                    statusText.innerText = `Bereit für Runde ${tournamentRound}?`;
                    updateModeDisplay();
                }, 2000);
                resetPositionsOnly(); 
                return; 
            } else {
                statusText.innerText = `🏆 TURNIERSIEGER! JACKPOT! 🏆`;
                let jackpot = currentBet * 5; 
                playerMoney += jackpot;
                addToScoreboard(true, `Turniersieg (+${jackpot}$)`);
                resetTournament();
            }
        } else {
            statusText.innerText = `Runde ${tournamentRound} verloren gegen ${winner}`;
            statusText.style.color = "white";
            addToScoreboard(false, `Turnier-Aus R${tournamentRound}`);
            resetTournament();
        }
    } else {
        if (isWin) {
            let winAmount = currentBet * 2;
            playerMoney += winAmount;
            statusText.innerText = `🏆 GEWONNEN! (+${winAmount}$)`;
            statusText.style.color = "gold";
            addToScoreboard(true, `Sieg (+${winAmount}$)`);
        } else {
            statusText.innerText = `Verloren! Sieger: ${winner}`;
            statusText.style.color = "white";
            addToScoreboard(false, `Verloren gegen ${winner}`);
        }
    }
    updateMoneyUI();
    startBtn.disabled = false;
}

function updateMoneyUI() { moneyDisplay.innerText = playerMoney; }

function addToScoreboard(won, text) {
    const li = document.createElement('li');
    li.innerText = text; li.className = won ? 'win-text' : 'loss-text';
    scoreList.prepend(li);
    if (scoreList.children.length > 5) scoreList.removeChild(scoreList.lastChild);
}

function resetGame() {
    positions = { p1: 0, lane2: 0, ai2: 0, ai3: 0 };
    resetHorseVisuals();
    statusText.style.color = "#e74c3c";
    isDoped = false;
}

function resetPositionsOnly() {
    positions = { p1: 0, lane2: 0, ai2: 0, ai3: 0 };
    resetHorseVisuals();
}

function resetHorseVisuals() {
    const allHorses = [horseP1, horseLane2, aiHorses[0], aiHorses[1]];
    allHorses.forEach(h => {
        h.style.left = '-5%';
        h.style.transform = 'scale(1)';
    });
}

function resetTournament() {
    tournamentRound = 1;
    updateModeDisplay();
}





