/* ==========================================
   NOIR ARENA - STATE MANAGER
   ========================================== */

let state = {
    money: 5000,
    stats: { 
        slotsSpins: 0, 
        bigWins: 0 
    }
};

/**
 * Lädt den Spielstand aus dem LocalStorage des Browsers
 */
export function loadState() {
    const saved = localStorage.getItem('noir_state');
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch (e) {
            console.error("Fehler beim Laden des State:", e);
        }
    }
}

/**
 * Speichert den aktuellen Zustand intern im Browser
 */
function save() {
    localStorage.setItem('noir_state', JSON.stringify(state));
}

/**
 * Gibt das aktuelle Guthaben zurück
 */
export function getMoney() { 
    return state.money; 
}

/**
 * Fügt dem Konto Geld hinzu
 */
export function addMoney(amount) {
    state.money += amount;
    save();
}

/**
 * Zieht Geld vom Konto ab, sofern genug vorhanden ist
 * @returns {boolean} - Erfolg oder Misserfolg
 */
export function removeMoney(amount) {
    if (state.money >= amount) {
        state.money -= amount;
        save();
        return true;
    }
    return false;
}

/**
 * Erhöht eine Statistik (z.B. Anzahl der Spins)
 */
export function updateStat(key) {
    if (state.stats && state.stats[key] !== undefined) {
        state.stats[key]++;
        save();
    }
}

/**
 * Setzt das gesamte System auf die Anfangswerte zurück
 */
export function resetSystem() {
    localStorage.removeItem('noir_state'); // Löscht den physischen Speicher
    state = {
        money: 5000,
        stats: { 
            slotsSpins: 0, 
            bigWins: 0 
        }
    };
    save(); // Speichert den neuen (leeren) Zustand
    console.log("System-Reset durchgeführt: 5.000 € geladen.");
}
