/* ==========================================
   NOIR ARENA - MASTER CONTROLLER (FIX)
   ========================================== */

import { loadState, getMoney, addMoney, resetSystem } from './core/state.js';
import { updateHUD, initNavigation, showToast, setActiveNav } from './core/ui.js';
import { Slots } from './games/casino/slots.js';
import { BookSlot } from './games/casino/book.js'; 
import { Roulette } from './games/casino/roulette.js';

const appRoot = document.getElementById('app-root');

function initApp() {
    console.log("Noir Arena: Initialisierung...");
    
    try {
        loadState();
        updateHUD(getMoney());
        initNavigation(handleRoute);
        
        // WICHTIG: Erzwinge Sichtbarkeit beim Start
        if (appRoot) appRoot.style.opacity = '1';
        
        handleRoute('lobby');
    } catch (err) {
        console.error("Initialisierungsfehler:", err);
    }
}

async function handleRoute(route) {
    if (!appRoot) return;

    console.log(`Navigiere zu: ${route}`);
    setActiveNav(route);
    
    // Sanfter Übergang
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
                    appRoot.innerHTML = `<div class="pnl"><h2>Modul ${route} nicht gefunden</h2></div>`;
            }
        } catch (e) {
            console.error("Fehler beim Rendern der Route:", e);
            appRoot.innerHTML = `<div class="pnl"><h2 style="color:red;">Ladefehler im Modul ${route}</h2></div>`;
        }
        
        appRoot.style.opacity = '1';
    }, 200);
}

function renderLobby() {
    appRoot.innerHTML = `
        <div class="screen">
            <div class="pnl">
                <h1 style="font-size:32px; color:var(--prm); margin-bottom:10px;">NOIR LOUNGE</h1>
                <p style="color:#888;">Willkommen im privaten High-Roller Bereich.</p>
            </div>

            <div class="grid">
                <div class="pnl" style="text-align:center;">
                    <div style="font-size:40px; margin-bottom:15px;">🎰</div>
                    <h3>SLOTS</h3>
                    <button class="btn b-prm" id="btn-goto-slots" style="margin-top:15px; width:100%;">SPIELEN</button>
                </div>
                <div class="pnl" style="text-align:center;">
                    <div style="font-size:40px; margin-bottom:15px;">🎡</div>
                    <h3>ROULETTE</h3>
                    <button class="btn b-prm" id="btn-goto-roulette" style="margin-top:15px; width:100%;">SPIELEN</button>
                </div>
                <div class="pnl" style="text-align:center;">
                    <div style="font-size:40px; margin-bottom:15px;">🔄</div>
                    <h3>RESET</h3>
                    <button class="btn b-err" id="btn-system-reset" style="margin-top:15px; width:100%;">RESET</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('btn-goto-slots')?.addEventListener('click', () => handleRoute('slots'));
    document.getElementById('btn-goto-roulette')?.addEventListener('click', () => handleRoute('roulette'));
    document.getElementById('btn-system-reset')?.addEventListener('click', () => {
        if(confirm("System zurücksetzen?")) {
            resetSystem();
            updateHUD(getMoney());
            showToast("Reset erfolgreich");
        }
    });
}

// Globaler Event Listener für Geld-Updates
window.addEventListener('updateHUD', () => updateHUD(getMoney()));
document.addEventListener('DOMContentLoaded', initApp);
window.noirRoute = handleRoute;
