/* ==========================================
   NOIR ARENA - UI MANAGER
   ========================================== */

export function formatMoney(value) {
    return value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export function updateHUD(money) {
    const moneyEl = document.getElementById('hud-money');
    if (moneyEl) {
        moneyEl.innerText = formatMoney(money);
    }
}

export function showToast(message, type = 'success') {
    const box = document.getElementById('toast-box');
    if (!box) return;
    
    const toast = document.createElement('div');
    toast.className = 'tst';
    toast.innerText = message;
    
    if (type === 'error') toast.style.borderLeftColor = 'var(--err)';
    if (type === 'info') toast.style.borderLeftColor = 'var(--sec)';
    
    box.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = 0;
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

export function initNavigation(onNavigate) {
    const navItems = document.querySelectorAll('.nav-it');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const route = e.currentTarget.dataset.route;
            if (route && onNavigate) {
                onNavigate(route);
            }
        });
    });
}

// NEU: Diese Funktion setzt die Markierung im Menü aktiv!
export function setActiveNav(route) {
    document.querySelectorAll('.nav-it').forEach(n => {
        n.classList.remove('act'); // Überall entfernen
        if (n.dataset.route === route) {
            n.classList.add('act'); // Beim aktuellen Modul hinzufügen
        }
    });
}
