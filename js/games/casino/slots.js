import { getMoney, removeMoney, addMoney, updateStat } from '../../core/state.js';
import { formatMoney, showToast } from '../../core/ui.js';

export const Slots = {
    config: {
        // Balancing: Viel mehr Nieten/Kirschen, seltene Topsymbole. ⭐ ist Scatter.
        symbols: ['🍒','🍒','🍒','🍒','🍋','🍋','🍋','🔔','🔔','💎','7️⃣','⭐'],
        spinDuration: 1800,
        lines: [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,0,0],[2,2,1,2,2],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0]] // 10 Linien Standard
    },
    isSpinning: false,
    freeSpins: 0,
    pendingWin: 0, // Für die Risikoleiter
    currentBet: 0,

    render() {
        return `
            <div class="screen act">
                <div class="pnl" style="max-width: 1000px; margin: 0 auto; width: 100%;">
                    
                    <div class="ttl" style="margin-bottom: 15px;">
                        <select id="sl-selector" style="width: auto; padding: 5px 10px; font-size: 14px; background: transparent; border: 1px solid var(--prm);">
                            <option value="classic">Classic Noir</option>
                            <option value="book">Book of Noir (Locked)</option>
                        </select>
                        <span id="sl-fs-counter" style="color:var(--prm); display:none;">FREISPIELE: 0</span>
                    </div>
                    
                    <div class="slot-box" id="sl-main-box">
                        <canvas id="sl-canvas"></canvas>
                        
                        <div class="gamble-ladder" id="gamble-ladder" style="display:none;"></div>

                        <div class="sl-rl" id="sl-r0"></div>
                        <div class="sl-rl" id="sl-r1"></div>
                        <div class="sl-rl" id="sl-r2"></div>
                        <div class="sl-rl" id="sl-r3"></div>
                        <div class="sl-rl" id="sl-r4"></div>
                    </div>

                    <div id="sl-display" style="text-align:center; font-size:24px; color:var(--sec); margin:25px 0; letter-spacing:2px; height:30px;">BEREIT</div>

                    <div class="grid" id="sl-controls" style="grid-template-columns: 1fr 1fr 2fr; align-items: end;">
                        <div><label>Einsatz / Linie</label><input type="number" id="sl-bet" value="10" min="1"></div>
                        <div><label>Linien</label><input type="number" id="sl-lines" value="10" min="1" max="10" readonly></div>
                        <div><button class="btn b-prm" id="sl-btn-spin">SPIN</button></div>
                    </div>

                    <div class="gamble-box" id="gamble-controls">
                        <button class="btn b-sec" id="btn-gamble-collect">GEWINN NEHMEN</button>
                        <button class="btn b-err" id="btn-gamble-risk" style="background:#800000; color:#fff; border:none;">RISIKO 50/50</button>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.canvas = document.getElementById('sl-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.reels = [0,1,2,3,4].map(i => document.getElementById(`sl-r${i}`));
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        document.getElementById('sl-btn-spin').onclick = () => this.spin();
        document.getElementById('btn-gamble-collect').onclick = () => this.collectWin();
        document.getElementById('btn-gamble-risk').onclick = () => this.playGamble();

        document.getElementById('sl-selector').onchange = (e) => {
            if(e.target.value !== 'classic') {
                showToast("Dieses Modul wird gerade installiert.", "info");
                e.target.value = 'classic';
            }
        };

        this.reels.forEach(r => r.innerHTML = '<div class="sl-sym">🎰</div>'.repeat(3));
    },

    resizeCanvas() {
        if(!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    },

    async spin() {
        if(this.isSpinning || this.pendingWin > 0) return;

        const bet = parseInt(document.getElementById('sl-bet').value);
        const lines = parseInt(document.getElementById('sl-lines').value);
        this.currentBet = bet * lines;

        if(this.freeSpins <= 0 && !removeMoney(this.currentBet)) {
            showToast("Nicht genügend Guthaben!", "error");
            return;
        }

        this.isSpinning = true;
        document.getElementById('sl-btn-spin').disabled = true;
        document.getElementById('sl-display').innerText = this.freeSpins > 0 ? `FREE SPIN (${this.freeSpins})` : "SPINNING...";
        this.ctx.clearRect(0,0,2000,2000);
        
        if(this.freeSpins > 0) { this.freeSpins--; this.updateFreeSpinsUI(); }

        let grid = [[],[],[],[],[]];
        const symbolHeight = this.reels[0].offsetHeight / 3;

        for(let i=0; i<5; i++) {
            let html = '';
            for(let j=0; j<15; j++) html += `<div class="sl-sym" style="filter:blur(3px)">🎰</div>`;
            
            for(let k=0; k<3; k++) {
                const s = this.config.symbols[Math.floor(Math.random()*this.config.symbols.length)];
                grid[i].push(s);
                // Wenn Scatter, dann CSS Animation hinzufügen
                const extraClass = s === '⭐' ? 'sym-scatter' : '';
                html += `<div class="sl-sym ${extraClass}">${s}</div>`;
            }
            
            this.reels[i].style.transition = 'none';
            this.reels[i].style.transform = 'translateY(0)';
            this.reels[i].innerHTML = html;
            
            setTimeout(() => {
                this.reels[i].style.transition = `transform ${this.config.spinDuration + (i*250)}ms cubic-bezier(0.1, 0, 0.1, 1.1)`;
                this.reels[i].style.transform = `translateY(-${15 * symbolHeight}px)`;
            }, 20);
        }

        setTimeout(() => this.evaluate(grid, bet, lines), this.config.spinDuration + 1200);
    },

    evaluate(grid, bet, lines) {
        let win = 0;
        let scatters = 0;
        const w = this.canvas.clientWidth / 5;
        const h = this.canvas.clientHeight / 3;

        grid.forEach(col => col.forEach(s => { if(s === '⭐') scatters++; }));

        if(scatters >= 3) {
            this.freeSpins += 10;
            this.updateFreeSpinsUI();
            this.showBigWinOverlay("10 FREISPIELE!");
        }

        for(let i=0; i < lines; i++) {
            const p = this.config.lines[i];
            let s = grid[0][p[0]], match = 1;
            
            // Scatter zahlen nicht auf Linien
            if(s === '⭐') continue;

            for(let c=1; c<5; c++) { if(grid[c][p[c]] === s) match++; else break; }

            if(match >= 3) {
                // Hardcore Balancing
                let mult = 0;
                if(s === '🍒') mult = match === 3 ? 1 : match === 4 ? 3 : 10;
                if(s === '🍋') mult = match === 3 ? 2 : match === 4 ? 5 : 20;
                if(s === '🔔') mult = match === 3 ? 5 : match === 4 ? 15 : 50;
                if(s === '💎') mult = match === 3 ? 15 : match === 4 ? 50 : 250;
                if(s === '7️⃣') mult = match === 3 ? 30 : match === 4 ? 150 : 1000;
                
                if(mult > 0) {
                    win += bet * mult;
                    this.drawWinLine(p, match, w, h);
                }
            }
        }

        if(win > 0) {
            this.pendingWin = win;
            document.getElementById('sl-display').innerText = `GEWINN: ${formatMoney(win)}`;
            document.getElementById('sl-display').style.color = 'var(--suc)';
            
            // Big Win Check (Mehr als 20x Gesamteinsatz)
            if(win >= this.currentBet * 20) this.showBigWinOverlay("BIG WIN!");

            // Wenn Freispiele laufen, wird automatisch gesammelt. Wenn nicht -> Risiko-Modus
            if(this.freeSpins > 0) {
                setTimeout(() => this.collectWin(), 1500);
            } else {
                document.getElementById('sl-controls').style.display = 'none';
                document.getElementById('gamble-controls').style.display = 'flex';
            }
        } else {
            document.getElementById('sl-display').innerText = "KEIN GEWINN";
            document.getElementById('sl-display').style.color = 'var(--sec)';
            this.resetSpinState();
        }
    },

    drawWinLine(p, match, w, h) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
        this.ctx.lineWidth = 4;
        for(let c=0; c<match; c++) {
            const x = c * w + w/2;
            const y = p[c] * h + h/2;
            if(c === 0) this.ctx.moveTo(x, y); else this.ctx.lineTo(x, y);
        }
        this.ctx.stroke();
    },

    showBigWinOverlay(text) {
        const box = document.getElementById('sl-main-box');
        const overlay = document.createElement('div');
        overlay.className = 'big-win-overlay';
        overlay.innerText = text;
        box.appendChild(overlay);
        setTimeout(() => overlay.remove(), 2500);
    },

    // --- RISIKOLEITER LOGIK ---
    playGamble() {
        // Simples 50/50 Risiko (Verdoppeln oder Nichts)
        if(Math.random() > 0.5) {
            this.pendingWin *= 2;
            document.getElementById('sl-display').innerText = `VERDOPPELT: ${formatMoney(this.pendingWin)}`;
            showToast("GEWONNEN!", "info");
        } else {
            this.pendingWin = 0;
            document.getElementById('sl-display').innerText = `VERLOREN!`;
            document.getElementById('sl-display').style.color = 'var(--err)';
            setTimeout(() => this.resetSpinState(), 1500);
            return;
        }
    },

    collectWin() {
        if(this.pendingWin > 0) {
            addMoney(this.pendingWin);
            window.dispatchEvent(new CustomEvent('updateHUD'));
            this.pendingWin = 0;
        }
        this.resetSpinState();
    },

    resetSpinState() {
        this.isSpinning = false;
        document.getElementById('sl-btn-spin').disabled = false;
        document.getElementById('sl-controls').style.display = 'grid';
        document.getElementById('gamble-controls').style.display = 'none';
        
        if(this.freeSpins > 0) setTimeout(() => this.spin(), 1000);
    },

    updateFreeSpinsUI() {
        const el = document.getElementById('sl-fs-counter');
        if(this.freeSpins > 0) {
            el.style.display = 'inline';
            el.innerText = `FREISPIELE: ${this.freeSpins}`;
        } else {
            el.style.display = 'none';
        }
    }
};
