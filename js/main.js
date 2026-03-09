/* ==========================================
   NOIR ARENA - MASTER CONTROLLER
   ========================================== */

// NEU: addMoney hinzugefügt!
import { loadState, getMoney, addMoney } from './core/state.js';
import { updateHUD, initNavigation, showToast, setActiveNav } from './core/ui.js';
import { Slots } from './games/casino/slots.js';
import { BookSlot } from './games/casino/book.js'; 

const appRoot = document.getElementById('app-root');

function initApp() {
    console.log("Noir Arena: System-Check läuft...");
    
    try {
        loadState();
        updateHUD(getMoney());
        initNavigation(handleRoute);
        handleRoute('lobby');
        
        showToast('Willkommen im Noir Club.', 'info');
    } catch (err) {
        console.error("KRITISCHER SYSTEMFEHLER:", err);
        showToast('Fehler beim Laden der Module!', 'error');
    }
}

async function handleRoute(route) {
    console.log(`Routing: Wechsel zu Modul [${route}]`);
    
    setActiveNav(route);
    
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
            default:
                renderPlaceholder(route);
                break;
        }
        
        appRoot.style.opacity = '1';
        appRoot.scrollTop = 0;
    }, 200);
}

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
                
                <div class="pnl" style="text-align:center; opacity: 0.6;">
                    <div style="font-size:50px; margin-bottom:20px;">🎡</div>
                    <h3 style="color:var(--sec); letter-spacing:2px; margin-bottom:15px;">ROULETTE</h3>
                    <p style="font-size:12px; color:#666; margin-bottom:25px; line-height:1.5;">Bald verfügbar: Der ultimative Klassiker in High-End-Grafik.</p>
                    <button class="btn b-drk" disabled>IN ARBEIT</button>
                </div>

                <div class="pnl" style="text-align:center; border-color: rgba(255,255,255,0.1);">
                    <div style="font-size:50px; margin-bottom:20px;">🏧</div>
                    <h3 style="color:#fff; letter-spacing:2px; margin-bottom:15px;">BANK / ATM</h3>
                    <p style="font-size:12px; color:#666; margin-bottom:25px; line-height:1.5;">Guthaben aufgebraucht? Lade dein Konto für Testzwecke wieder auf.</p>
                    <button class="btn b-acc" id="lobby-bank-btn" style="color:#000;">+ 5.000 € AUFLADEN</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('lobby-slots-btn')?.addEventListener('click', () => handleRoute('slots'));
    
    // NEU: Funktion für den Geldautomaten
    document.getElementById('lobby-bank-btn')?.addEventListener('click', () => {
        addMoney(5000);
        window.dispatchEvent(new CustomEvent('updateHUD'));
        showToast('5.000 € wurden eingezahlt!', 'info');
    });
}

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

window.addEventListener('updateHUD', () => updateHUD(getMoney()));
document.addEventListener('DOMContentLoaded', initApp);
window.noirRoute = handleRoute;
