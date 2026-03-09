/* ==========================================
   NOIR ARENA - MASTER CONTROLLER (FINAL)
   ========================================== */

import { loadState, getMoney, addMoney, resetSystem } from './core/state.js';
import { updateHUD, initNavigation, showToast, setActiveNav } from './core/ui.js';
import { Slots } from './games/casino/slots.js';
import { BookSlot } from './games/casino/book.js'; 
import { Roulette } from './games/casino/roulette.js';

const appRoot = document.getElementById('app-root');

/**
 * Initialisiert die Applikation beim Laden
 */
function initApp() {
    console.log("Noir Arena: System-Check läuft...");
    
    try {
        loadState();
        updateHUD(getMoney());
        initNavigation(handleRoute);
        
        // Startseite setzen
        handleRoute('lobby');
        
        showToast('Willkommen im Noir Club.', 'info');
    } catch (err) {
        console.error("KRITISCHER SYSTEMFEHLER:", err);
        showToast('Fehler beim Laden der Module!', 'error');
    }
}

/**
 * Zentraler Router für den Seitenwechsel
 */
async function handleRoute(route) {
    console.log(`Routing: Wechsel zu Modul [${route}]`);
    
    // UI-Markierung in der Sidebar links anpassen
    setActiveNav(route);
    
    // Sanfter Übergang (Fade-out)
    appRoot.style.opacity = '0';
    
    setTimeout(() => {
        appRoot.innerHTML = '';

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
                renderPlaceholder(route);
                break;
        }
        
        // Sanfter Übergang (Fade-in)
        appRoot.style.opacity = '1';
        appRoot.scrollTop = 0;
    }, 200);
}

/**
 * Rendert die Haupt-Lounge (Lobby)
 */
function renderLobby() {
    appRoot.innerHTML = `
        <div class="screen act">
            <div class="pnl" style="background: radial-gradient(circle at top right, rgba(212,175,55,0.08), transparent);">
                <h1 style="font-size:38px; font-weight:300; letter-spacing:4px; margin-bottom:10px; color:#fff;">NOIR <span style="color:var(--prm); font-weight:900;">LOUNGE</span></h1>
                <p style="color:#888; font-size:16px; font-weight:300; max-width: 700px; line-height:1.6;">
                    Die private Spielarena ist bereit. Wählen Sie ein Modul aus der Sidebar oder starten Sie direkt eines der Highlight-Spiele.
                </p>
            </div>

            <div class="grid">
                <div class="pnl" style="text-align:center;">
                    <div style="font-size:50px; margin-bottom:20px;">🎰</div>
                    <h3 style="color:var(--prm); letter-spacing:2px; margin-bottom:15px;">PRESTIGE SLOTS</h3>
                    <p style="font-size:12px; color:#666; margin-bottom:25px; line-height:1.5;">Classic & Book of Noir. Hochauflösende Walzen und Freispiele.</p>
                    <button class="btn b-prm" id="lobby-slots-btn">JETZT SPIELEN</button>
                </div>
                
                <div class="pnl" style="text-align:center;">
                    <div style="font-size:50px; margin-bottom:20px;">🎡</div>
                    <h3 style="color:var(--sec); letter-spacing:2px; margin-bottom:15px;">NOIR ROULETTE</h3>
                    <p style="font-size:12px; color:#666; margin-bottom:25px; line-height:1.5;">European Deluxe. Setzen Sie Chips auf den digitalen Teppich.</p>
                    <button class="btn b-prm" id="lobby-roulette-btn">JETZT SPIELEN</button>
                </div>

                <div class="pnl" style="text-align:center; border-color: rgba(227, 66, 52, 0.2);">
                    <div style="font-size:50px; margin-bottom:20px;">🔄</div>
                    <h3 style="color:var(--err); letter-spacing:2px; margin-bottom:15px;">SYSTEM RESET</h3>
                    <p style="font-size:12px; color:#666; margin-bottom:25px; line-height:1.5;">Alles verspielt? Setzen Sie Ihr Kapital auf die Startwerte zurück.</p>
                    <button class="btn b-err" id="lobby-reset-btn">WERTE ZURÜCKSETZEN</button>
                </div>
            </div>
        </div>
    `;

    // Event Listener für die Lobby-Buttons
    document.getElementById('lobby-slots-btn')?.addEventListener('click', () => handleRoute('slots'));
    document.getElementById('lobby-roulette-btn')?.addEventListener('click', () => handleRoute('roulette'));
    
    document.getElementById('lobby-reset-btn')?.addEventListener('click', () => {
        if(confirm("Möchten Sie wirklich alle Daten und das Guthaben zurücksetzen?")) {
            resetSystem();
            updateHUD(getMoney());
            showToast('System auf 5.000 € zurückgesetzt!', 'info');
        }
    });
}

/**
 * Platzhalter für noch nicht entwickelte Module
 */
function renderPlaceholder(name) {
    appRoot.innerHTML = `
        <div class="screen act">
            <div class="pnl" style="text-align:center; padding: 120px 20px;">
                <h2 style="color:var(--prm); letter-spacing:5px; text-transform:uppercase;">Modul: ${name}</h2>
                <p style="color:#555; margin-top:20px; font-size:14px; letter-spacing:1px;">Dieses System wird aktuell von der KI kalibriert und geschmiedet.</p>
                <button class="btn b-drk" style="margin-top:40px; width:auto;" id="placeholder-back">ZURÜCK ZUR LOUNGE</button>
            </div>
        </div>
    `;
    document.getElementById('placeholder-back')?.addEventListener('click', () => handleRoute('lobby'));
}

// Globales Event-Handling für Geld-Updates
window.addEventListener('updateHUD', () => updateHUD(getMoney()));

// App-Start nach DOM-Ladezeit
document.addEventListener('DOMContentLoaded', initApp);

// Globaler Router für In-Game Wechsel (z.B. zwischen Slots)
window.noirRoute = handleRoute;
