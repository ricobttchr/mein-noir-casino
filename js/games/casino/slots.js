import { getMoney, removeMoney, addMoney, updateStat, getState } from '../../core/state.js';
import { formatMoney, showToast } from '../../core/ui.js';

export const Slots = {
    config: {
        symbols: ['🍒','🍒','🍒','🍋','🍋','🔔','💎','7️⃣','⭐'],
        reelsCount: 5,
        rowsCount: 3,
        spinDuration: 2000,
        lines: [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,0,0],[2,2,1,2,2],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0],[2,1,1,1,2],[0,2,0,2,0],[2,0,2,0,2],[1,0,1,0,1],[1,2,1,2,1],[0,0,2,0,0],[2,2,0,2,2],[1,1,0,1,1],[1,1,2,1,1],[0,2,2,2,0]]
    },
    isSpinning: false,
    freeSpins: 0,

    // Erzeugt das HTML für das Spiel
    render() {
        return `
            <div class="screen act">
                <div class="pnl" style="max-width: 1000px; margin: 0 auto; width: 100%;">
                    <div class="ttl">
                        <span>PRESTIGE SLOTS</span>
                        <span id="sl-fs-counter" style="color:var(--prm); display:none;">FREISPIELE: 0</span>
                    </div>
                    
                    <div class="slot-box" id="sl-main-box">
                        <canvas id="sl-canvas"></canvas>
                        <div class="sl-rl" id="sl-r0"></div>
                        <div class="sl-rl" id="sl-r1"></div>
                        <div class="sl-rl" id="sl-r2"></div>
                        <div class="sl-rl" id="sl-r3"></div>
                        <div class="sl-rl" id="sl-r4"></div>
                    </div>

                    <div id="sl-display" style="text-align:center; font-size:22px; color:var(--prm); margin:30px 0; letter-spacing:3px;">BEREIT</div>

                    <div class="grid" style="grid-template-columns: 1fr 1fr 2fr; align-items: end;">
                        <div>
                            <label>Einsatz / Linie</label>
                            <input type="number" id="sl-bet" value="10" min="1">
                        </div>
                        <div>
                            <label>Linien (1-20)</label>
                            <input type="number" id="sl-lines" value="10" min="1" max="20">
                        </div>
                        <div style="display:flex; gap:15px;">
                            <button class="btn b-prm" id="sl-btn-spin" style="flex:2;">SPIN</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // Initialisiert die Spiellogik nach dem Rendern
    init() {
        this.canvas = document.getElementById('sl-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.reels = [0,1,2,3,4].map(i => document.getElementById(`sl-r${i}`));
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        document.getElementById('sl-btn-spin').onclick = () => this.spin();
        document.getElementById('sl-lines').onchange = () => this.previewLines();

        // Startsymbole setzen
        this.reels.forEach(r => r.innerHTML = '<div class="sl-sym">🎰</div>'.repeat(3));
    },

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    },

    previewLines() {
        const lineCount = parseInt(document.getElementById('sl-lines').value);
        this.ctx.clearRect(0,0,2000,2000);
        const w = this.canvas.clientWidth / 5;
        const h = this.canvas.clientHeight / 3;

        for(let i=0; i < lineCount; i++) {
            const p = this.config.lines[i];
            this.ctx.beginPath();
            this.ctx.strokeStyle = `rgba(212, 175, 55, 0.4)`;
            this.ctx.lineWidth = 3;
            p.forEach((row, col) => {
                const x = col * w + w/2;
                const y = row * h + h/2;
                if(col === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
            });
            this.ctx.stroke();
        }
        setTimeout(() => this.ctx.clearRect(0,0,2000,2000), 1000);
    },

    async spin() {
        if(this.isSpinning) return;

        const bet = parseInt(document.getElementById('sl-bet').value);
        const lines = parseInt(document.getElementById('sl-lines').value);
        const totalCost = bet * lines;

        if(this.freeSpins <= 0 && !removeMoney(totalCost)) {
            showToast("Nicht genügend Guthaben!", "error");
            return;
        }

        this.isSpinning = true;
        document.getElementById('sl-btn-spin').disabled = true;
        this.ctx.clearRect(0,0,2000,2000);
        
        if(this.freeSpins > 0) {
            this.freeSpins--;
            this.updateFreeSpinsUI();
        }

        // Walzen-Ergebnisse generieren
        let grid = [[],[],[],[],[]];
        const symbolHeight = this.reels[0].offsetHeight / 3;

        for(let i=0; i<5; i++) {
            let html = '';
            for(let j=0; j<20; j++) html += `<div class="sl-sym" style="filter:blur(2px)">${this.config.symbols[Math.floor(Math.random()*this.config.symbols.length)]}</div>`;
            
            // Die echten 3 Symbole am Ende
            for(let k=0; k<3; k++) {
                const s = this.config.symbols[Math.floor(Math.random()*this.config.symbols.length)];
                grid[i].push(s);
                html += `<div class="sl-sym">${s}</div>`;
            }
            
            this.reels[i].style.transition = 'none';
            this.reels[i].style.transform = 'translateY(0)';
            this.reels[i].innerHTML = html;
            
            // Animation triggern
            setTimeout(() => {
                this.reels[i].style.transition = `transform ${this.config.spinDuration + (i*200)}ms cubic-bezier(0.1, 0, 0.1, 1)`;
                this.reels[i].style.transform = `translateY(-${20 * symbolHeight}px)`;
            }, 50);
        }

        setTimeout(() => this.evaluate(grid, bet, lines), this.config.spinDuration + 1000);
    },

    evaluate(grid, bet, lines) {
        let win = 0;
        let scatters = 0;
        const w = this.canvas.clientWidth / 5;
        const h = this.canvas.clientHeight / 3;

        // Scatters zählen
        grid.forEach(col => col.forEach(s => { if(s === '⭐') scatters++; }));

        if(scatters >= 3) {
            this.freeSpins += 5;
            this.updateFreeSpinsUI();
            showToast("5 FREISPIELE GEWONNEN!", "info");
        }

        // Linien prüfen
        for(let i=0; i < lines; i++) {
            const p = this.config.lines[i];
            let s = grid[0][p[0]], match = 1;
            for(let c=1; c<5; c++) { if(grid[c][p[c]] === s) match++; else break; }

            if(match >= 3) {
                let mult = 0;
                if(s === '🍒') mult = match === 3 ? 2 : match === 4 ? 5 : 15;
                if(s === '💎') mult = match === 3 ? 10 : match === 4 ? 50 : 200;
                if(s === '7️⃣') mult = match === 3 ? 50 : match === 4 ? 200 : 1000;
                
                if(mult > 0) {
                    win += bet * mult;
                    this.drawWinLine(p, match, w, h);
                }
            }
        }

        if(win > 0) {
            addMoney(win);
            document.getElementById('sl-display').innerText = `GEWINN: ${formatMoney(win)}`;
            showToast(`Gewinn: ${formatMoney(win)}`);
        } else {
            document.getElementById('sl-display').innerText = "KEIN GEWINN";
        }

        this.isSpinning = false;
        document.getElementById('sl-btn-spin').disabled = false;
        updateStat('slotsSpins');
        window.dispatchEvent(new CustomEvent('updateHUD'));

        if(this.freeSpins > 0) setTimeout(() => this.spin(), 1500);
    },

    drawWinLine(p, match, w, h) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'var(--prm)';
        this.ctx.lineWidth = 5;
        this.ctx.shadowBlur = 15;
        this.ctx.shadowColor = 'var(--prm)';
        for(let c=0; c<match; c++) {
            const x = c * w + w/2;
            const y = p[c] * h + h/2;
            if(c === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
    },

    updateFreeSpinsUI() {
        const el = document.getElementById('sl-fs-counter');
        const box = document.getElementById('sl-main-box');
        if(this.freeSpins > 0) {
            el.style.display = 'inline';
            el.innerText = `FREISPIELE: ${this.freeSpins}`;
            box.style.borderColor = 'var(--prm)';
            box.style.boxShadow = '0 0 30px var(--prm)';
        } else {
            el.style.display = 'none';
            box.style.borderColor = 'var(--brd)';
            box.style.boxShadow = 'none';
        }
    }
};