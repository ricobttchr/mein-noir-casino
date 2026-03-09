import { getMoney, removeMoney, addMoney, updateStat } from '../../core/state.js';
import { formatMoney, showToast } from '../../core/ui.js';

export const Slots = {
    config: {
        // Low Pays: J, Q, K, A | High Pays: 🍒, 🍋, 🔔, 💎, 7️⃣ | Special: 🃏 (Wild), ⭐ (Scatter)
        // Das ist unser Mathematik-Modell (Hit Frequency & RTP Steuerung)
        symbolWeights: {
            'J': 45, 'Q': 40, 'K': 35, 'A': 30, // Häufige Nieten / Kleingewinne
            '🍒': 25, '🍋': 20, '🔔': 15,       // Mittlere Gewinne
            '💎': 8, '7️⃣': 4,                  // Hohe Gewinne (Selten)
            '🃏': 5,                           // Wild (Joker)
            '⭐': 3                            // Scatter (Freispiele)
        },
        spinDuration: 1800,
        lines: [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,0,0],[2,2,1,2,2],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0]],
        
        // Risikoleiter Stufen (Multiplikatoren des Grundeinsatzes)
        ladderSteps: [0, 2, 4, 8, 12, 20, 40, 80, 140] 
    },
    
    symbolPool: [], // Wird beim Start gefüllt
    isSpinning: false,
    freeSpins: 0,
    currentBet: 0,
    
    // Gamble States
    gambleActive: false,
    currentLadderIdx: 0,
    gambleInterval: null,
    flashState: false,

    render() {
        return `
            <div class="screen act">
                <div class="pnl" style="max-width: 1000px; margin: 0 auto; width: 100%;">
                    
                    <div class="ttl" style="margin-bottom: 15px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <select id="sl-selector" style="padding: 5px; font-size: 14px; background: transparent; border: 1px solid var(--prm); color:var(--prm); margin-right: 10px;">
                                <option value="classic">Classic Noir</option>
                            </select>
                            <button id="sl-btn-info" class="btn b-sec" style="padding: 5px 10px; width:auto; border-radius:50%;">i</button>
                        </div>
                        <span id="sl-fs-counter" style="color:var(--prm); display:none;">FREISPIELE: 0</span>
                    </div>
                    
                    <div class="slot-box" id="sl-main-box">
                        <canvas id="sl-canvas"></canvas>
                        
                        <div class="slot-modal" id="sl-info-modal">
                            <h3 style="color:var(--prm); margin-bottom:15px; border-bottom:1px solid var(--prm); padding-bottom:10px;">PAYTABLE & INFO</h3>
                            <div class="pt-row"><span class="pt-sym">⭐</span><span>Scatter: 3+ lösen 10 Freispiele aus.</span></div>
                            <div class="pt-row"><span class="pt-sym">🃏</span><span>Wild: Ersetzt alle Symbole außer Scatter.</span></div>
                            <div class="pt-row"><span class="pt-sym">7️⃣</span><span>3x: 50 | 4x: 250 | 5x: 1000</span></div>
                            <div class="pt-row"><span class="pt-sym">💎</span><span>3x: 20 | 4x: 100 | 5x: 400</span></div>
                            <div class="pt-row"><span class="pt-sym">🔔</span><span>3x: 10 | 4x: 25 | 5x: 100</span></div>
                            <div class="pt-row"><span class="pt-sym">🍒🍋</span><span>3x: 5 | 4x: 15 | 5x: 50</span></div>
                            <div class="pt-row"><span class="pt-sym">JQKA</span><span>3x: 2 | 4x: 5 | 5x: 20</span></div>
                            <button class="btn b-prm" id="btn-close-info" style="margin-top:20px;">SCHLIESSEN</button>
                        </div>

                        <div class="gamble-ladder-ui" id="gamble-ui">
                            <h3 style="color:var(--prm); margin-bottom: 20px; letter-spacing:3px;">RISIKOLEITER</h3>
                            <div class="ladder-box" id="ladder-container">
                                </div>
                            <div style="display:flex; gap:10px; margin-top:20px; width: 300px;">
                                <button class="btn b-acc" id="btn-gmb-collect" style="flex:1;">NEHMEN</button>
                                <button class="btn b-err" id="btn-gmb-risk" style="flex:1; background:#800000; color:#fff;">DRÜCKEN</button>
                            </div>
                        </div>

                        <div class="sl-rl" id="sl-r0"></div>
                        <div class="sl-rl" id="sl-r1"></div>
                        <div class="sl-rl" id="sl-r2"></div>
                        <div class="sl-rl" id="sl-r3"></div>
                        <div class="sl-rl" id="sl-r4"></div>
                    </div>

                    <div id="sl-display" style="text-align:center; font-size:24px; color:var(--sec); margin:25px 0; letter-spacing:2px; height:30px;">BEREIT</div>

                    <div class="grid" id="sl-controls" style="grid-template-columns: 1fr 1fr 2fr; align-items: end;">
                        <div><label>Einsatz (0.10 - 100)</label><input type="number" id="sl-bet" value="1" min="0.10" max="100" step="0.10"></div>
                        <div><label>Linien</label><input type="number" id="sl-lines" value="10" readonly></div>
                        <div><button class="btn b-prm" id="sl-btn-spin">SPIN</button></div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.canvas = document.getElementById('sl-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.reels = [0,1,2,3,4].map(i => document.getElementById(`sl-r${i}`));
        
        // Symbol-Pool anhand der Gewichte generieren (für den Pseudo-RNG)
        for (const [sym, weight] of Object.entries(this.config.symbolWeights)) {
            for (let i = 0; i < weight; i++) this.symbolPool.push(sym);
        }

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        document.getElementById('sl-btn-spin').onclick = () => this.spin();
        document.getElementById('sl-btn-info').onclick = () => document.getElementById('sl-info-modal').classList.add('act');
        document.getElementById('btn-close-info').onclick = () => document.getElementById('sl-info-modal').classList.remove('act');
        
        // Gamble Buttons
        document.getElementById('btn-gmb-collect').onclick = () => this.collectGamble();
        document.getElementById('btn-gmb-risk').onclick = () => this.stepLadder();

        this.reels.forEach(r => r.innerHTML = '<div class="sl-sym">🎰</div>'.repeat(3));
    },

    resizeCanvas() {
        if(!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    },

    getRandomSymbol() {
        return this.symbolPool[Math.floor(Math.random() * this.symbolPool.length)];
    },

    async spin() {
        if(this.isSpinning || this.gambleActive) return;

        const bet = parseFloat(document.getElementById('sl-bet').value);
        this.currentBet = bet; // Einsatz pro Spin
        
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
            // Blur-Symbole beim Drehen
            for(let j=0; j<15; j++) html += `<div class="sl-sym" style="filter:blur(3px)">${this.getRandomSymbol()}</div>`;
            
            // Echte Ergebnisse
            for(let k=0; k<3; k++) {
                const s = this.getRandomSymbol();
                grid[i].push(s);
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

        setTimeout(() => this.evaluate(grid), this.config.spinDuration + 1200);
    },

    evaluate(grid) {
        let totalWin = 0;
        let scatters = 0;
        const w = this.canvas.clientWidth / 5;
        const h = this.canvas.clientHeight / 3;

        grid.forEach(col => col.forEach(s => { if(s === '⭐') scatters++; }));

        if(scatters >= 3) {
            this.freeSpins += 10;
            this.updateFreeSpinsUI();
            this.showBigWinOverlay("10 FREISPIELE!");
        }

        // Linien Auswertung mit Wild (🃏) Logik
        for(let i=0; i < 10; i++) {
            const p = this.config.lines[i];
            
            // Finde das erste Symbol, das kein Joker ist, um die Linie zu definieren
            let targetSym = grid[0][p[0]];
            let match = 1;

            // Scatters zahlen nicht auf Linien
            if(targetSym === '⭐') continue;

            for(let c=1; c<5; c++) {
                const currentSym = grid[c][p[c]];
                // Wenn wir noch kein klares Zielsymbol haben (weil erstes ein Joker war), definieren wir es jetzt
                if(targetSym === '🃏' && currentSym !== '🃏' && currentSym !== '⭐') targetSym = currentSym;
                
                if(currentSym === targetSym || currentSym === '🃏') {
                    match++;
                } else {
                    break;
                }
            }

            if(match >= 3) {
                let mult = 0;
                // Paytable Multiplikatoren
                if(['J','Q','K','A'].includes(targetSym)) mult = match === 3 ? 2 : match === 4 ? 5 : 20;
                if(['🍒','🍋'].includes(targetSym)) mult = match === 3 ? 5 : match === 4 ? 15 : 50;
                if(targetSym === '🔔') mult = match === 3 ? 10 : match === 4 ? 25 : 100;
                if(targetSym === '💎') mult = match === 3 ? 20 : match === 4 ? 100 : 400;
                if(targetSym === '7️⃣') mult = match === 3 ? 50 : match === 4 ? 250 : 1000;
                // Reine Joker-Linie
                if(targetSym === '🃏') mult = match === 3 ? 50 : match === 4 ? 250 : 1000;
                
                if(mult > 0) {
                    totalWin += this.currentBet * mult;
                    this.drawWinLine(p, match, w, h);
                }
            }
        }

        if(totalWin > 0) {
            document.getElementById('sl-display').innerText = `GEWINN: ${formatMoney(totalWin)}`;
            document.getElementById('sl-display').style.color = 'var(--suc)';
            
            if(totalWin >= this.currentBet * 50) this.showBigWinOverlay("BIG WIN!");

            // Automatisches Sammeln im Freispiel, sonst Leiter
            if(this.freeSpins > 0) {
                addMoney(totalWin);
                window.dispatchEvent(new CustomEvent('updateHUD'));
                setTimeout(() => this.resetSpinState(), 1500);
            } else {
                this.initGamble(totalWin);
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

    // --- RISIKOLEITER ENGINE ---
    initGamble(winAmount) {
        this.gambleActive = true;
        document.getElementById('sl-controls').style.display = 'none';
        
        // Startstufe auf der Leiter finden (erste Stufe, die höher als der Gewinn ist)
        const targetValue = winAmount / this.currentBet;
        this.currentLadderIdx = this.config.ladderSteps.findIndex(s => s >= targetValue);
        if(this.currentLadderIdx === -1) this.currentLadderIdx = this.config.ladderSteps.length - 1; // Max Win
        if(this.currentLadderIdx === 0) this.currentLadderIdx = 1; // Mindestens Stufe 1

        this.renderLadder();
        document.getElementById('gamble-ui').style.display = 'flex';
        this.startLadderBlink();
    },

    renderLadder() {
        const container = document.getElementById('ladder-container');
        container.innerHTML = '';
        
        this.config.ladderSteps.forEach((stepMult, idx) => {
            const val = stepMult * this.currentBet;
            const div = document.createElement('div');
            div.className = `l-step ${idx === this.currentLadderIdx ? 'act' : ''}`;
            div.id = `l-step-${idx}`;
            div.innerText = formatMoney(val);
            container.appendChild(div);
        });
    },

    startLadderBlink() {
        clearInterval(this.gambleInterval);
        this.gambleInterval = setInterval(() => {
            this.flashState = !this.flashState;
            const upIdx = Math.min(this.currentLadderIdx + 1, this.config.ladderSteps.length - 1);
            const downIdx = this.currentLadderIdx === 1 ? 0 : this.currentLadderIdx - 1; // Fällt bei 1 auf 0
            
            document.querySelectorAll('.l-step').forEach(el => el.classList.remove('flash'));
            if(this.flashState) {
                document.getElementById(`l-step-${upIdx}`).classList.add('flash');
            } else {
                document.getElementById(`l-step-${downIdx}`).classList.add('flash');
            }
        }, 150); // Schnelles Automaten-Blinken
    },

    stepLadder() {
        clearInterval(this.gambleInterval);
        document.querySelectorAll('.l-step').forEach(el => el.classList.remove('flash'));

        // 50/50 Chance (bei echten Automaten oft leicht zugunsten der Bank gewichtet, hier fair)
        const won = Math.random() > 0.5;
        
        if(won) {
            this.currentLadderIdx = Math.min(this.currentLadderIdx + 1, this.config.ladderSteps.length - 1);
            this.renderLadder();
            document.getElementById('sl-display').innerText = `GEKLETTERT!`;
            
            if(this.currentLadderIdx === this.config.ladderSteps.length - 1) {
                // Top erreicht!
                setTimeout(() => this.collectGamble(), 1000);
            } else {
                this.startLadderBlink();
            }
        } else {
            // Eine Stufe runter oder auf 0 (typische Novoline-Logik: meistens fällt es auf 0)
            // Wir machen es Hardcore: Es fällt auf 0.
            this.currentLadderIdx = 0;
            this.renderLadder();
            document.getElementById('sl-display').innerText = `VERLOREN!`;
            document.getElementById('sl-display').style.color = 'var(--err)';
            setTimeout(() => this.resetSpinState(), 1500);
        }
    },

    collectGamble() {
        const val = this.config.ladderSteps[this.currentLadderIdx] * this.currentBet;
        if(val > 0) {
            addMoney(val);
            window.dispatchEvent(new CustomEvent('updateHUD'));
            showToast(`Ausgezahlt: ${formatMoney(val)}`, 'info');
        }
        this.resetSpinState();
    },

    resetSpinState() {
        clearInterval(this.gambleInterval);
        this.isSpinning = false;
        this.gambleActive = false;
        document.getElementById('gamble-ui').style.display = 'none';
        document.getElementById('sl-btn-spin').disabled = false;
        document.getElementById('sl-controls').style.display = 'grid';
        
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
