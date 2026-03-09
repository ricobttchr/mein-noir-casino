/* ==========================================
   NOIR ARENA - MASTER CONTROLLER
   ========================================== */

// Import um resetSystem erweitert
import { Roulette } from './games/casino/roulette.js';
import { loadState, getMoney, addMoney, resetSystem } from './core/state.js';
import { updateHUD, initNavigation, showToast, setActiveNav } from './core/ui.js';
import { Slots } from './games/casino/slots.js';
import { BookSlot } from './games/casino/book.js'; 

const appRoot = document.getElementById('app-root');

function initApp() {
    loadState();
    updateHUD(getMoney());
    initNavigation(handleRoute);
    handleRoute('lobby');
}

async function handleRoute(route) {
    setActiveNav(route);
    appRoot.style.opacity = '0';
    setTimeout(() => {
        appRoot.innerHTML = '';
        switch(route) {
              case 'roulette':
    appRoot.innerHTML = Roulette.render();
    Roulette.init();
    break;
            case 'lobby': renderLobby(); break;
            case 'slots': appRoot.innerHTML = Slots.render(); Slots.init(); break;
            case 'book': appRoot.innerHTML = BookSlot.render(); BookSlot.init(); break;
            default: renderPlaceholder(route); break;
        }
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
                    <button class="btn b-prm" id="lobby-slots-btn">JETZT SPIELEN</button>
                </div>
                
                <div class="pnl" style="text-align:center; opacity: 0.6;">
                    <div style="font-size:50px; margin-bottom:20px;">🎡</div>
                    <h3 style="color:var(--sec); letter-spacing:2px; margin-bottom:15px;">ROULETTE</h3>
                    <button class="btn b-drk" disabled>IN ARBEIT</button>
                </div>

                <div class="pnl" style="text-align:center; border-color: rgba(227, 66, 52, 0.2);">
                    <div style="font-size:50px; margin-bottom:20px;">🔄</div>
                    <h3 style="color:var(--err); letter-spacing:2px; margin-bottom:15px;">SYSTEM RESET</h3>
                    <p style="font-size:12px; color:#666; margin-bottom:25px;">Setzt Ihr Kapital sofort auf 5.000 € zurück.</p>
                    <button class="btn b-err" id="lobby-reset-btn">WERTE ZURÜCKSETZEN</button>
                </div>
            </div>
        </div>
    `;

    document.getElementById('lobby-slots-btn')?.addEventListener('click', () => handleRoute('slots'));
    
    // Logik für den Reset
    document.getElementById('lobby-reset-btn')?.addEventListener('click', () => {
        if(confirm("Möchten Sie wirklich alles zurücksetzen?")) {
            resetSystem();
            updateHUD(getMoney());
            showToast('System auf 5.000 € zurückgesetzt!', 'info');
        }
    });
}

function renderPlaceholder(name) {
    appRoot.innerHTML = `<div class="screen act"><div class="pnl" style="text-align:center; padding: 120px 20px;"><h2>${name}</h2><button class="btn b-drk" id="placeholder-back">ZURÜCK</button></div></div>`;
    document.getElementById('placeholder-back')?.addEventListener('click', () => handleRoute('lobby'));
}

window.addEventListener('updateHUD', () => updateHUD(getMoney()));
document.addEventListener('DOMContentLoaded', initApp);
window.noirRoute = handleRoute;

