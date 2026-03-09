import { getMoney, removeMoney, addMoney, updateStat } from '../../core/state.js';
import { formatMoney, showToast } from '../../core/ui.js';

// --- EINGEBAUTE SOUND ENGINE ---
const Snd = {
    ctx: null,
    init() {
        if(!this.ctx) {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        }
        if(this.ctx.state === 'suspended') this.ctx.resume();
    },
    play(freq, type, dur, vol=0.05) {
        if(!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type; osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + dur);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + dur);
    },
    tick() { this.play(400, 'triangle', 0.05, 0.02); }, // Walzen klicken
    win() { 
        setTimeout(()=>this.play(400,'sine',0.2, 0.1), 0);
        setTimeout(()=>this.play(600,'sine',0.2, 0.1), 150);
        setTimeout(()=>this.play(800,'sine',0.4, 0.15), 300);
    },
    ladder() { this.play(1000, 'square', 0.1, 0.02); }, // Blinken
    ladderWin() { this.play(1200, 'sine', 0.3, 0.1); },
    ladderLose() { this.play(150, 'sawtooth', 0.4, 0.1); }
};

export const Slots = {
    config: {
        symbolWeights: {
            'J': 45, 'Q': 40, 'K': 35, 'A': 30,
            '🍒': 25, '🍋': 20, '🔔': 15,
            '💎': 8, '7️⃣': 4,
            '🃏': 5, '⭐': 3
        },
        spinDuration: 1800,
        lines: [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,0,0],[2,2,1,2,2],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0]],
        ladderSteps: [0, 2, 4, 8, 12, 20, 40, 80, 140] 
    },
    
    symbolPool: [],
    isSpinning: false,
    isAuto: false, // Auto-Spin Status
    freeSpins: 0,
    currentBet: 0,
    
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
                            <div class="pt-row">
                                <span><span class="sym-let sym-A" style="font-size:20px;">A</span> <span class="sym-let sym-K" style="font-size:20px;">K</span></span>
                                <span>3x: 3 | 4x: 10 | 5x: 25</span>
                            </div>
                            <div class="pt-row">
                                <span><span class="sym-let sym-Q" style="font-size:20px;">Q</span> <span class="sym-let sym-J" style="font-size:20px;">J</span></span>
                                <span>3x: 2 | 4x: 5 | 5x: 20</span>
                            </div>
                            <button class="btn b-prm" id="btn-close-info" style="margin-top:20px;">SCHLIESSEN</button>
                        </div>

                        <div class="gamble-ladder-ui" id="gamble-ui">
                            <h3 style="color:var(--prm); margin-bottom: 20px; letter-spacing:3px;">RISIKOLEITER</h3>
                            <div class="ladder-box" id="ladder-container"></div>
                            <div class="gamble-btns">
                                <button class="btn b-acc" id="btn-gmb-collect">NEHMEN</button>
                                <button class="btn b-err" id="btn-gmb-risk" style="background:#800000; color:#fff;">DRÜCKEN</button>
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
                        <div><label>Linien (1-10)</label><input type="number" id="sl-lines" value="10" min="1" max="10"></div>
                        <div style="display:flex; gap:10px;">
                            <button class="btn b-drk" id="sl-btn-auto" style="flex:1;">AUTO</button>
                            <button class="btn b-prm" id="sl-btn-spin" style="flex:2;">SPIN</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.canvas = document.getElementById('sl-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.reels = [0,1,2,3,4].map(i => document.getElementById(`sl-r${i}`));
        
        for (const [sym, weight] of Object.entries(this.config.symbolWeights)) {
            for (let i = 0; i < weight; i++) this.symbolPool.push(sym);
        }

        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Buttons binden
        document.getElementById('sl-btn-spin').onclick = () => { this.isAuto = false; this.updateAutoUI(); this.spin(); };
        document.getElementById('sl-btn-auto').onclick = () => this.toggleAuto();
        
        document.getElementById('sl-btn-info').onclick = () => document.getElementById('sl-info-modal').classList.add('act');
        document.getElementById('btn-close-info').onclick = () => document.getElementById('sl-info-modal').classList.remove('act');
        
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

    // Helfer für das Design der Buchstaben
    formatSymbol(s) {
        if(['J','Q','K','A'].includes(s)) {
            return `<div class="sl-sym sym-let sym-${s}">${s}</div>`;
        }
        const extraClass = s === '⭐' ? 'sym-scatter' : '';
        return `<div class="sl-sym ${extraClass}">${s}</div>`;
    },

    toggleAuto() {
        this.isAuto = !this.isAuto;
        this.updateAutoUI();
        if(this.isAuto && !this.isSpinning) this.spin();
    },

    updateAutoUI() {
        const btn = document.getElementById('sl-btn-auto');
        if(this.isAuto) {
            btn.style.background = 'var(--prm)'; btn.style.color = '#000'; btn.innerText = 'STOP AUTO';
        } else {
            btn.style.background = ''; btn.style.color = ''; btn.innerText = 'AUTO';
        }
    },

    async spin() {
        if(this.isSpinning || this.gambleActive) return;

        Snd.init(); // Sound Engine aktivieren
        
        const bet = parseFloat(document.getElementById('sl-bet').value);
        const lines = parseInt(document.getElementById('sl-lines').value) || 10;
        
        this.currentBet = bet; 
        
        if(this.freeSpins <= 0 && !removeMoney(this.currentBet * lines)) {
            showToast("Nicht genügend Guthaben!", "error");
            this.isAuto = false; this.updateAutoUI();
            return;
        }

        this.isSpinning = true;
        document.getElementById('sl-btn-spin').disabled = true;
        document.getElementById('sl-btn-auto').disabled = true;
        document.getElementById('sl-display').innerText = this.freeSpins > 0 ? `FREE SPIN (${this.freeSpins})` : "SPINNING...";
        this.ctx.clearRect(0,0,2000,2000);
        
        if(this.freeSpins > 0) { this.freeSpins--; this.updateFreeSpinsUI(); }

        let grid = [[],[],[],[],[]];
        const symbolHeight = this.reels[0].offsetHeight / 3;

        for(let i=0; i<5; i++) {
            let html = '';
            for(let j=0; j<15; j++) html += `<div class="sl-sym" style="filter:blur(3px)">🎰</div>`;
            
            for(let k=0; k<3; k++) {
                const s = this.getRandomSymbol();
                grid[i].push(s);
                html += this.formatSymbol(s);
            }
            
            this.reels[i].style.transition = 'none';
            this.reels[i].style.transform = 'translateY(0)';
            this.reels[i].innerHTML = html;
            
            setTimeout(() => {
                Snd.tick(); // Sound bei jedem Walzen-Start
                this.reels[i].style.transition = `transform ${this.config.spinDuration + (i*250)}ms cubic-bezier(0.1, 0, 0.1, 1.1)`;
                this.reels[i].style.transform = `translateY(-${15 * symbolHeight}px)`;
            }, 20 + (i*100)); // Leicht versetzter Start
        }

        // Dynamische Linien-Auswertung übergeben
        setTimeout(() => this.evaluate(grid, lines), this.config.spinDuration + 1200);
    },

    evaluate(grid, activeLines) {
        let totalWin = 0;
        let scatters = 0;
        const w = this.canvas.clientWidth / 5;
        const h = this.canvas.clientHeight / 3;

        grid.forEach(col => col.forEach(s => { if(s === '⭐') scatters++; }));

        if(scatters >= 3) {
            this.freeSpins += 10;
            this.updateFreeSpinsUI();
            this.showBigWinOverlay("10 FREISPIELE!");
            Snd.win();
        }

        // Nur bis zu den eingestellten Linien auswerten
        const linesToCheck = Math.min(activeLines, 10);

        for(let i=0; i < linesToCheck; i++) {
            const p = this.config.lines[i];
            let targetSym = grid[0][p[0]], match = 1;

            if(targetSym === '⭐') continue;

            for(let c=1; c<5; c++) {
                const currentSym = grid[c][p[c]];
                if(targetSym === '🃏' && currentSym !== '🃏' && currentSym !== '⭐') targetSym = currentSym;
                if(currentSym === targetSym || currentSym === '🃏') match++; else break;
            }

            if(match >= 3) {
                let mult = 0;
                if(['A','K'].includes(targetSym)) mult = match === 3 ? 3 : match === 4 ? 10 : 25;
                if(['Q','J'].includes(targetSym)) mult = match === 3 ? 2 : match === 4 ? 5 : 20;
                if(['🍒','🍋'].includes(targetSym)) mult = match === 3 ? 5 : match === 4 ? 15 : 50;
                if(targetSym === '🔔') mult = match === 3 ? 10 : match === 4 ? 25 : 100;
                if(targetSym === '💎') mult = match === 3 ? 20 : match === 4 ? 100 : 400;
                if(targetSym === '7️⃣') mult = match === 3 ? 50 : match === 4 ? 250 : 1000;
                if(targetSym === '🃏') mult = match === 3 ? 50 : match === 4 ? 250 : 1000;
                
                if(mult > 0) {
                    totalWin += this.currentBet * mult;
                    this.drawWinLine(p, match, w, h);
                }
            }
        }

        if(totalWin > 0) {
            Snd.win();
            document.getElementById('sl-display').innerText = `GEWINN: ${formatMoney(totalWin)}`;
            document.getElementById('sl-display').style.color = 'var(--suc)';
            
            if(totalWin >= this.currentBet * 50) this.showBigWinOverlay("BIG WIN!");

            // Wenn Freispiele oder AUTO-Modus aktiv sind -> Gewinn direkt aufs Konto, Leiter überspringen!
            if(this.freeSpins > 0 || this.isAuto) {
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

    initGamble(winAmount) {
        this.gambleActive = true;
        document.getElementById('sl-controls').style.display = 'none';
        
        const targetValue = winAmount / this.currentBet;
        this.currentLadderIdx = this.config.ladderSteps.findIndex(s => s >= targetValue);
        if(this.currentLadderIdx === -1) this.currentLadderIdx = this.config.ladderSteps.length - 1;
        if(this.currentLadderIdx === 0) this.currentLadderIdx = 1; 

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
            Snd.ladder(); // Beep Beep Sound
            this.flashState = !this.flashState;
            const upIdx = Math.min(this.currentLadderIdx + 1, this.config.ladderSteps.length - 1);
            const downIdx = this.currentLadderIdx === 1 ? 0 : this.currentLadderIdx - 1;
            
            document.querySelectorAll('.l-step').forEach(el => el.classList.remove('flash'));
            if(this.flashState) {
                document.getElementById(`l-step-${upIdx}`).classList.add('flash');
            } else {
                document.getElementById(`l-step-${downIdx}`).classList.add('flash');
            }
        }, 150);
    },

    stepLadder() {
        clearInterval(this.gambleInterval);
        document.querySelectorAll('.l-step').forEach(el => el.classList.remove('flash'));

        const won = Math.random() > 0.5;
        
        if(won) {
            Snd.ladderWin();
            this.currentLadderIdx = Math.min(this.currentLadderIdx + 1, this.config.ladderSteps.length - 1);
            this.renderLadder();
            document.getElementById('sl-display').innerText = `GEKLETTERT!`;
            
            if(this.currentLadderIdx === this.config.ladderSteps.length - 1) {
                setTimeout(() => this.collectGamble(), 1000);
            } else {
                setTimeout(() => this.startLadderBlink(), 300); // Kurze Pause vor neuem Blinken
            }
        } else {
            Snd.ladderLose();
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
        document.getElementById('sl-btn-auto').disabled = false;
        document.getElementById('sl-controls').style.display = 'grid';
        
        if(this.freeSpins > 0 || this.isAuto) setTimeout(() => this.spin(), 1000);
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
