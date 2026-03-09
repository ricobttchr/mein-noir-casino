/* ==========================================
   NOIR ARENA - DEPLOYMENT FIX
   ========================================== */

import { loadState, getMoney, addMoney, resetSystem } from './core/state.js';
import { updateHUD, initNavigation, showToast, setActiveNav } from './core/ui.js';

// Achte darauf, dass die Dateinamen auf dem Server EXAKT so geschrieben sind (meistens alles klein)
import { Slots } from './games/casino/slots.js';
import { BookSlot } from './games/casino/book.js'; 
import { Roulette } from './games/casino/roulette.js';

const appRoot = document.getElementById('app-root');

function initApp() {
    try {
        loadState();
        updateHUD(getMoney());
        initNavigation(handleRoute);
        
        // Timeout sorgt dafür, dass das DOM sicher bereit ist
        setTimeout(() => handleRoute('lobby'), 50);
    } catch (err) {
        console.error("Boot Error:", err);
    }
}

async function handleRoute(route) {
    if (!appRoot) return;
    setActiveNav(route);
    
    appRoot.style.opacity = '0';
    
    setTimeout(() => {
        appRoot.innerHTML = '';
        try {
            switch(route) {
                case 'lobby': renderLobby(); break;
                case 'slots': appRoot.innerHTML = Slots.render(); Slots.init(); break;
                case 'book': appRoot.innerHTML = BookSlot.render(); BookSlot.init(); break;
                case 'roulette': appRoot.innerHTML = Roulette.render(); Roulette.init(); break;
                default: renderLobby();
            }
        } catch (e) {
            appRoot.innerHTML = `<div class="pnl">Fehler beim Laden von ${route}</div>`;
            console.error(e);
        }
        appRoot.style.opacity = '1';
    }, 150);
}

// ... Rest der renderLobby Funktion wie gehabt ...
function renderLobby() {
    appRoot.innerHTML = `
        <div class="screen act">
            <div class="pnl">
                <h1 style="color:var(--prm);">NOIR LOUNGE</h1>
                <p>System bereit.</p>
            </div>
            <div class="grid">
                <div class="pnl" style="text-align:center;">
                    <div style="font-size:40px;">🎰</div>
                    <button class="btn b-prm" id="lobby-slots-btn" style="width:100%; margin-top:10px;">SLOTS</button>
                </div>
                <div class="pnl" style="text-align:center;">
                    <div style="font-size:40px;">🎡</div>
                    <button class="btn b-prm" id="lobby-roulette-btn" style="width:100%; margin-top:10px;">ROULETTE</button>
                </div>
                <div class="pnl" style="text-align:center;">
                    <div style="font-size:40px;">🔄</div>
                    <button class="btn b-err" id="lobby-reset-btn" style="width:100%; margin-top:10px;">RESET</button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('lobby-slots-btn')?.addEventListener('click', () => handleRoute('slots'));
    document.getElementById('lobby-roulette-btn')?.addEventListener('click', () => handleRoute('roulette'));
    document.getElementById('lobby-reset-btn')?.addEventListener('click', () => {
        if(confirm("Reset?")) { resetSystem(); updateHUD(getMoney()); handleRoute('lobby'); }
    });
}

document.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('updateHUD', () => updateHUD(getMoney()));
