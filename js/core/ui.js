/* ==========================================
   NOIR ARENA - UI MANAGER
   ========================================== */

// Formatiert Zahlen als Euro (z.B. 5000 -> 5.000 €)
export function formatMoney(value) {
    return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

// Aktualisiert die Anzeige oben rechts
export function updateHUD(money) {
    const moneyEl = document.getElementById('hud-money');
    if (moneyEl) {
        moneyEl.innerText = formatMoney(money);
    }
}

// Zeigt ein elegantes Popup unten rechts an
export function showToast(message, type = 'success') {
    const box = document.getElementById('toast-box');
    if (!box) return;
    
    const toast = document.createElement('div');
    toast.className = 'tst';
    toast.innerText = message;
    
    // Roter Rand bei Fehlern, Platin bei Info
    if (type === 'error') toast.style.borderLeftColor = 'var(--err)';
    if (type === 'info') toast.style.borderLeftColor = 'var(--sec)';
    
    box.appendChild(toast);
    
    // Nach 3 Sekunden weich ausblenden
    setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// Überwacht Klicks auf das Menü links
export function initNavigation(onNavigate) {
    const navItems = document.querySelectorAll('.nav-it');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Aktive Hervorhebung verschieben
            navItems.forEach(n => n.classList.remove('act'));
            e.currentTarget.classList.add('act');
            
            // Herausfinden, wohin der User will (aus dem data-route Attribut im HTML)
            const route = e.currentTarget.dataset.route;
            if (route && onNavigate) {
                onNavigate(route);
            }
        });
    });
}