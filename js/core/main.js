import { loadState, getMoney } from './core/state.js';
import { updateHUD, initNavigation, showToast } from './core/ui.js';

const appRoot = document.getElementById('app-root');

function initApp() {
    console.log("Arena Initialisierung...");
    loadState();
    
    // Kleiner Timer, damit der Browser Zeit hat, alles zu ordnen
    setTimeout(() => {
        updateHUD(getMoney());
        initNavigation(handleRoute);
        handleRoute('lobby');
        showToast('System bereit. Willkommen im Noir.', 'info');
    }, 100);
}

async function handleRoute(route) {
    // Elegant wegschalten
    appRoot.style.opacity = '0';
    
    setTimeout(() => {
        switch(route) {
            case 'lobby':
                appRoot.innerHTML = `
                    <div class="screen act">
                        <div class="pnl" style="background: radial-gradient(circle at top right, rgba(212,175,55,0.08), transparent);">
                            <h1 style="font-size:38px; font-weight:300; letter-spacing:4px; margin-bottom:10px; color:#fff;">NOIR <span style="color:var(--prm); font-weight:900;">LOUNGE</span></h1>
                            <p style="color:#888; font-size:16px; font-weight:300; max-width: 700px; line-height:1.6;">
                                Willkommen in der privaten Arena. Hier werden Vermögen geschmiedet und Legenden geschrieben. 
                                Wählen Sie ein Modul, um zu beginnen.
                            </p>
                        </div>

                        <div class="grid">
                            <div class="pnl" style="text-align:center;">
                                <div style="font-size:40px; margin-bottom:15px;">🎰</div>
                                <h3 style="color:var(--prm); letter-spacing:2px; margin-bottom:15px;">PRESTIGE SLOTS</h3>
                                <p style="font-size:12px; color:#666; margin-bottom:20px;">Hohe Varianz. Echte Gewinnlinien. 96% RTP.</p>
                                <button class="btn b-prm" onclick="window.dispatchEvent(new CustomEvent('nav', {detail: 'slots'}))">JETZT SPIELEN</button>
                            </div>
                            
                            <div class="pnl" style="text-align:center;">
                                <div style="font-size:40px; margin-bottom:15px;">🎡</div>
                                <h3 style="color:var(--sec); letter-spacing:2px; margin-bottom:15px;">ROULETTE</h3>
                                <p style="font-size:12px; color:#666; margin-bottom:20px;">Der Klassiker. Setzen Sie auf Sieg.</p>
                                <button class="btn b-sec" onclick="window.dispatchEvent(new CustomEvent('nav', {detail: 'roulette'}))">ZUM TISCH</button>
                            </div>
                        </div>
                    </div>
                `;
                break;

            default:
                appRoot.innerHTML = `
                    <div class="screen act">
                        <div class="pnl" style="text-align:center; padding: 100px 0;">
                            <h2 style="color:var(--prm); letter-spacing:4px;">MODUL IN ENTWICKLUNG</h2>
                            <p style="color:#666; margin-top:20px;">Das System ${route.toUpperCase()} wird gerade kalibriert.</p>
                            <button class="btn b-drk" style="margin-top:30px; width:auto;" onclick="window.dispatchEvent(new CustomEvent('nav', {detail: 'lobby'}))">ZURÜCK ZUR LOUNGE</button>
                        </div>
                    </div>
                `;
        }
        appRoot.style.opacity = '1';
    }, 200);
}

// Damit die Buttons in der Lobby auch funktionieren
window.addEventListener('nav', (e) => handleRoute(e.detail));

document.addEventListener('DOMContentLoaded', initApp);
