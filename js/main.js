/* ==========================================
   NOIR ARENA - MASTER CONTROLLER (STABLE)
   ========================================== */

import { loadState, getMoney, addMoney, resetSystem } from './core/state.js';
import { updateHUD, initNavigation, showToast, setActiveNav } from './core/ui.js';
import { Slots } from './games/casino/slots.js';
import { BookSlot } from './games/casino/book.js'; 
import { Roulette } from './games/casino/roulette.js';

const appRoot = document.getElementById('app-root');

function initApp() {
    console.log("Noir Arena: Booting System...");
    
    try {
        loadState();
        updateHUD(getMoney());
        initNavigation(handleRoute);
        
        // Sicherstellen, dass appRoot existiert und sichtbar ist
        if (appRoot) {
            appRoot.style.opacity = '1';
            handleRoute('lobby');
        } else {
            console.error("KRITISCHER FEHLER: 'app-root' nicht gefunden!");
        }
    } catch (err) {
        console.error("Initialisierungsfehler:", err);
    }
}

async function handleRoute(route) {
    if (!appRoot) return;

    console.log(`Routing zu: ${route}`);
    setActiveNav(route);
    
    // Sanfter Fade-Out
    appRoot.style.opacity = '0';
    
    setTimeout(() => {
        appRoot.innerHTML = '';

        try {
            switch(route) {
                case 'lobby':
                    renderLobby();
                    break;
                case 'slots':
                    appRoot.innerHTML = Slots.render();
                    Slots.init();
                    break;
                case 'book': 
                    appRoot.innerHTML = BookSlot.render();
                    BookSlot.init();
                    break;
                case 'roulette':
                    appRoot.innerHTML = Roulette.render();
                    Roulette.init();
                    break;
                default:
                    console.warn("Route nicht definiert:", route);
                    renderLobby(); // Fallback zur Lobby
            }
        } catch (e) {
            console.error("Fehler beim Rendern der Route:", e);
            appRoot.innerHTML = `<div class="pnl"><h2 style="color:var(--err);">Fehler im Modul ${route}</h2><p>${e.message}</p></div>`;
        }
        
        // Fade-In
        appRoot.style.opacity = '1';
    }, 200);
}

function renderLobby() {
    appRoot.innerHTML = `
        <div class="screen act">
            <div class="pnl" style="background: radial-gradient(circle at top right, rgba(212,175,55,0.08), transparent);">
                <h1 style="font-size:38px; font-weight:300; letter-spacing:4px; margin-bottom:10px; color:#fff;">NOIR <span style="color:var(--prm); font-weight:900;">LOUNGE</span></h1>
                <p style="color:#888; font-size:16px; font-weight:300; max-width: 700px;">Wählen Sie ein Modul oder setzen Sie das System zurück.</p>
            </div>

            <div class="grid">
                <div class="pnl" style="text-align:center;">
                    <div style="font-size:50px; margin-bottom:20px;">🎰</div>
                    <h3 style="color:var(--prm); letter-spacing:2px; margin-bottom:15px;">PRESTIGE SLOTS</h3>
                    <button class="btn b-prm" id="lobby-slots-btn" style="width:100%;">JETZT SPIELEN</button>
                </div>
                
                <div class="pnl" style="text-align:center;">
                    <div style="font-size:50px; margin-bottom:20px;">🎡</div>
                    <h3 style="color:var(--sec); letter-spacing:2px; margin-bottom:15px;">NOIR ROULETTE</h3>
                    <button class="btn b-prm" id="lobby-roulette-btn" style="width:100%;">JETZT SPIELEN</button>
                </div>

                <div class="pnl" style="text-align:center; border-color: rgba(227, 66, 52, 0.2);">
                    <div style="font-size:50px; margin-bottom:20px;">🔄</div>
                    <h3 style="color:var(--err); letter-spacing:2px; margin-bottom:15px;">SYSTEM RESET</h3>
                    <button class="btn b-err" id="lobby-reset-btn" style="width:100%;">RESET</button>
                </div>
            </div>
        </div>
    `;

    // Event Listener für die Buttons in der Lobby
    document.getElementById('lobby-slots-btn')?.addEventListener('click', () => handleRoute('slots'));
    document.getElementById('lobby-roulette-btn')?.addEventListener('click', () => handleRoute('roulette'));
    document.getElementById('lobby-reset-btn')?.addEventListener('click', () => {
        if(confirm("Möchten Sie wirklich alles zurücksetzen?")) {
            resetSystem();
            updateHUD(getMoney());
            showToast('System auf 5.000 € zurückgesetzt!', 'info');
            handleRoute('lobby');
        }
    });
}

// Globales Event-Handling
window.addEventListener('updateHUD', () => updateHUD(getMoney()));
document.addEventListener('DOMContentLoaded', initApp);
window.noirRoute = handleRoute;
