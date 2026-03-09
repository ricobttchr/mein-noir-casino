/* ==========================================
   NOIR ARENA - MAIN CONTROLLER & ROUTER
   ========================================== */

import { loadState, getMoney } from './core/state.js';
import { updateHUD, initNavigation, showToast } from './core/ui.js';

// Das ist unser mittlerer Bereich, wo die Spiele landen
const appRoot = document.getElementById('app-root');

// Wird ausgeführt, sobald die Seite geladen ist
function initApp() {
    loadState();                // Spielstand laden
    updateHUD(getMoney());      // 5.000 € oben eintragen
    
    // Navigation scharfschalten
    initNavigation(handleRoute);
    
    // Startbildschirm laden
    handleRoute('lobby');
    
    showToast('Noir System online. Willkommen.', 'info');
}

// Unser dynamischer Router
async function handleRoute(route) {
    // Kurzer Ladebildschirm
    appRoot.innerHTML = '<div style="color:var(--prm); text-align:center; padding:50px; font-weight:300; letter-spacing:2px;">LOADING MODULE...</div>';
    
    try {
        // Hier passiert die Magie: Je nachdem, worauf du klickst, laden wir einen anderen Screen.
        // Sobald wir die Spiele-Dateien bauen, importieren wir sie hier.
        switch(route) {
            case 'lobby':
                appRoot.innerHTML = `
                    <div class="screen act">
                        <div class="pnl" style="background: radial-gradient(circle at top right, rgba(212,175,55,0.08), transparent);">
                            <h1 style="font-size:36px; font-weight:300; letter-spacing:2px; margin-bottom:15px; color:#fff;">Noir Arena Lounge</h1>
                            <p style="color:#aaa; font-size:15px; line-height:1.6; font-weight:300; max-width: 800px;">
                                Modulares System geladen. Wähle eine Kategorie auf der linken Seite.
                            </p>
                        </div>
                    </div>
                `;
                break;
                
            default:
                // Platzhalter für alle Spiele, die wir noch nicht gebaut haben
                appRoot.innerHTML = `
                    <div class="screen act">
                        <div class="pnl" style="text-align:center; padding: 100px 20px;">
                            <h2 style="color:var(--sec); letter-spacing: 2px;">MODUL [${route.toUpperCase()}]</h2>
                            <p style="color:#666; margin-top:15px;">Wird als nächstes entwickelt und hier eingehängt.</p>
                        </div>
                    </div>
                `;
                break;
        }
        
    } catch (error) {
        console.error("Fehler beim Laden der Route:", error);
        showToast('System Error beim Laden.', 'error');
    }
}

// App starten
document.addEventListener('DOMContentLoaded', initApp);