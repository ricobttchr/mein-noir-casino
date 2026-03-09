/* ==========================================
   NOIR ARENA - DEBUGGING & MAIN CONTROLLER
   ========================================== */

// Wir versuchen die Module zu laden. Wenn das hier scheitert, 
// bricht der Browser das Skript ab. 
import { loadState, getMoney } from './core/state.js';
import { updateHUD, initNavigation, showToast } from './core/ui.js';

console.log("System-Check: Module erfolgreich geladen.");

const appRoot = document.getElementById('app-root');

function initApp() {
    console.log("Arena Initialisierung läuft...");
    
    try {
        loadState();
        const currentMoney = getMoney();
        
        console.log("Geld geladen:", currentMoney);
        
        updateHUD(currentMoney);
        initNavigation(handleRoute);
        
        // Starte in der Lobby
        handleRoute('lobby');
        
        showToast('Noir System online.', 'info');
    } catch (err) {
        console.error("KRITISCHER FEHLER beim Start:", err);
        document.getElementById('hud-money').innerText = "ERROR";
    }
}

async function handleRoute(route) {
    console.log("Navigiere zu:", route);
    appRoot.style.opacity = '0';
    
    setTimeout(() => {
        if (route === 'lobby') {
            appRoot.innerHTML = `
                <div class="screen act">
                    <div class="pnl" style="background: radial-gradient(circle at top right, rgba(212,175,55,0.08), transparent);">
                        <h1 style="font-size:38px; font-weight:300; letter-spacing:4px; margin-bottom:10px; color:#fff;">NOIR <span style="color:var(--prm); font-weight:900;">LOUNGE</span></h1>
                        <p style="color:#888; font-size:16px; font-weight:300; max-width: 700px; line-height:1.6;">
                            Willkommen in der privaten Arena. Hier werden Vermögen geschmiedet und Legenden geschrieben. 
                        </p>
                    </div>

                    <div class="grid">
                        <div class="pnl" style="text-align:center;">
                            <div style="font-size:40px; margin-bottom:15px;">🎰</div>
                            <h3 style="color:var(--prm); letter-spacing:2px; margin-bottom:15px;">PRESTIGE SLOTS</h3>
                            <button class="btn b-prm" id="btn-goto-slots">JETZT SPIELEN</button>
                        </div>
                        <div class="pnl" style="text-align:center;">
                            <div style="font-size:40px; margin-bottom:15px;">🎡</div>
                            <h3 style="color:var(--sec); letter-spacing:2px; margin-bottom:15px;">ROULETTE</h3>
                            <button class="btn b-sec" id="btn-goto-roulette">ZUM TISCH</button>
                        </div>
                    </div>
                </div>
            `;
            
            // Event-Listener für die Buttons in der Lobby
            document.getElementById('btn-goto-slots')?.addEventListener('click', () => handleRoute('slots'));
            document.getElementById('btn-goto-roulette')?.addEventListener('click', () => handleRoute('roulette'));

        } else {
            appRoot.innerHTML = `
                <div class="screen act">
                    <div class="pnl" style="text-align:center; padding: 100px 0;">
                        <h2 style="color:var(--prm); letter-spacing:4px;">MODUL [${route.toUpperCase()}]</h2>
                        <p style="color:#666; margin-top:20px;">Wird gerade von der KI geschmiedet...</p>
                        <button class="btn b-drk" style="margin-top:30px; width:auto;" id="btn-back">ZURÜCK</button>
                    </div>
                </div>
            `;
            document.getElementById('btn-back')?.addEventListener('click', () => handleRoute('lobby'));
        }
        appRoot.style.opacity = '1';
    }, 200);
}

// App starten
document.addEventListener('DOMContentLoaded', initApp);
