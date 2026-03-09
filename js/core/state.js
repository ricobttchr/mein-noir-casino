/* ==========================================
   NOIR ARENA - CORE STATE MANAGEMENT
   ========================================== */

const SAVE_KEY = 'NOIR_ARENA_SAVE';

// Unser Standard-Spielstand für neue Spieler
let state = {
    money: 5000,
    debt: 0,
    stats: {
        won: 0,
        lost: 0,
        slotsSpins: 0,
        rouletteSpins: 0,
        blackjackHands: 0,
        arcadeScores: {}
    },
    inventory: {
        realEstate: [0, 0, 0, 0],
        stocks: { AAPL: 0, TSLA: 0, NVDA: 0, MSCI: 0 },
        pets: { justin: 0, tom: 0 }
    },
    settings: {
        sound: true,
        fx: true
    }
};

// Lädt den Spielstand aus dem Browser-Speicher
export function loadState() {
    try {
        const saved = localStorage.getItem(SAVE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Wir mischen den alten Spielstand mit dem neuen, falls wir später neue Dinge hinzufügen
            state = { ...state, ...parsed };
            state.stats = { ...state.stats, ...(parsed.stats || {}) };
            state.inventory = { ...state.inventory, ...(parsed.inventory || {}) };
            state.settings = { ...state.settings, ...(parsed.settings || {}) };
        }
    } catch (e) {
        console.warn("Konnte Noir Spielstand nicht laden", e);
    }
}

// Speichert den Spielstand
export function saveState() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {
        console.warn("Konnte Noir Spielstand nicht speichern", e);
    }
}

// Gibt den aktuellen Kontostand zurück
export function getMoney() {
    return state.money;
}

// Zieht Geld ab (z.B. für einen Einsatz). 
// Gibt 'true' zurück, wenn genug Geld da war, sonst 'false'.
export function removeMoney(amount) {
    if (state.money >= amount) {
        state.money -= amount;
        state.stats.lost += amount;
        saveState();
        return true; // Transaktion erfolgreich
    }
    return false; // Zu wenig Geld!
}

// Fügt Geld hinzu (z.B. bei einem Gewinn)
export function addMoney(amount) {
    state.money += amount;
    if (amount > 0) {
        state.stats.won += amount;
    }
    saveState();
}

// Erhöht eine Statistik (z.B. updateStat('slotsSpins'))
export function updateStat(key, amount = 1) {
    if (state.stats[key] !== undefined) {
        state.stats[key] += amount;
        saveState();
    }
}

// Gibt das komplette State-Objekt (nur zum Lesen) zurück
export function getState() {
    return state;

}
/* ==========================================
   NOIR ARENA - STATE MANAGER (UPGRADED)
   ========================================== */

let state = {
    money: 5000,
    stats: { slotsSpins: 0, bigWins: 0 }
};

export function loadState() {
    const saved = localStorage.getItem('noir_state');
    if (saved) state = JSON.parse(saved);
}

function save() {
    localStorage.setItem('noir_state', JSON.stringify(state));
}

export function getMoney() { return state.money; }

export function addMoney(amount) {
    state.money += amount;
    save();
}

export function removeMoney(amount) {
    if (state.money >= amount) {
        state.money -= amount;
        save();
        return true;
    }
    return false;
}

export function updateStat(key) {
    if (state.stats[key] !== undefined) {
        state.stats[key]++;
        save();
    }
}

// NEU: Der radikale Reset
export function resetSystem() {
    localStorage.removeItem('noir_state'); // Löscht den Speicher
    state = {
        money: 5000,
        stats: { slotsSpins: 0, bigWins: 0 }
    };
    save(); // Legt neuen Startzustand fest
}
