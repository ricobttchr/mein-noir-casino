/* ==========================================
   NOIR ARENA - MASTER CONTROLLER
   ========================================== */

// 1. IMPORTE (Die Bausteine laden)
import { loadState, getMoney } from './core/state.js';
import { updateHUD, initNavigation, showToast } from './core/ui.js';

// Hier binden wir die Spiele ein, sobald wir sie erstellt haben
import { Slots } from './games/casino/slots.js';

// Das Herzstück: Hier landen alle Spiele in der Mitte
const appRoot = document.getElementById('app-root');

/**
 * Initialisiert die gesamte Arena beim Start
 */
function initApp() {
    console.log("Noir Arena: System-Check läuft...");
    
    try {
        // Daten aus dem Speicher holen
        loadState();
        
        // HUD (Geldanzeige oben rechts) aktualisieren
        const currentMoney = getMoney();
        updateHUD(currentMoney);
        
        // Sidebar-Navigation aktivieren
        initNavigation(handleRoute);
        
        // Mit der Lobby (Startbildschirm) beginnen
        handleRoute('lobby');
        
        console.log("Noir Arena: System erfolgreich gestartet.");
        showToast('Willkommen im Noir Club.', 'info');

    } catch (err) {
        console.error("KRITISCHER SYSTEMFEHLER:", err);
        showToast('Fehler beim Laden der Module!', 'error');
    }
}

/**
 * Der Router: Tauscht den Inhalt in der Mitte dynamisch aus
 * @param {string} route - Der Name des Ziels (z.B. 'slots', 'lobby')
 */
async function handleRoute(route) {
    console.log(`Routing: Wechsel zu Modul [${route}]`);
    
    // Weicher Übergang: Erst ausblenden
    appRoot.style.opacity = '0';
    
    // Kurze Pause für die Animation
    setTimeout(() => {
        // Inhalt leeren, bevor Neues kommt
        appRoot.innerHTML = '';

        switch(route) {
            case 'lobby':
                renderLobby();
                break;
                
            case 'slots':
                // Das Slot-Modul rendern und starten
                appRoot.innerHTML = Slots.render();
                Slots.init();
                break;
            
            // Hier kommen später Roulette, Blackjack etc. dazu
            default:
                renderPlaceholder(route);
                break;
        }
        
        // Wieder einblenden
        appRoot.style.opacity = '1';
        // Seite nach oben scrollen
        appRoot.scrollTop = 0;
    }, 200);
}

/**
 * Rendert die Startseite (Lounge)
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
                    <p style="font-size:12px; color:#666; margin-bottom:25px; line-height:1.5;">Hochauflösende Walzen, Freispiele und Linien-Vorschau.</p>
                    <button class="btn b-prm" id="lobby-slots-btn">JETZT SPIELEN</button>
                </div>
                
                <div class="pnl" style="text-align:center; opacity: 0.6;">
                    <div style="font-size:50px; margin-bottom:20px;">🎡</div>
                    <h3 style="color:var(--sec); letter-spacing:2px; margin-bottom:15px;">ROULETTE</h3>
                    <p style="font-size:12px; color:#666; margin-bottom:25px; line-height:1.5;">Bald verfügbar: Der ultimative Klassiker in High-End-Grafik.</p>
                    <button class="btn b-drk" disabled>IN ARBEIT</button>
                </div>
            </div>
        </div>
    `;

    // Event-Listener für die Lobby-Buttons
    document.getElementById('lobby-slots-btn')?.addEventListener('click', () => handleRoute('slots'));
}

/**
 * Zeigt einen Platzhalter für noch nicht fertige Spiele
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

// Globales Event-Handling (falls wir von überall navigieren wollen)
window.addEventListener('updateHUD', () => updateHUD(getMoney()));

// App starten, wenn das Dokument bereit ist
document.addEventListener('DOMContentLoaded', initApp);
