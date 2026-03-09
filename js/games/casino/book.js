import { getMoney, removeMoney, addMoney, updateStat } from '../../core/state.js';
import { formatMoney, showToast } from '../../core/ui.js';

// --- GEMEINSAME SOUND ENGINE ---
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
    tick() { this.play(300, 'triangle', 0.05, 0.02); }, 
    win() { 
        setTimeout(()=>this.play(400,'sine',0.2, 0.1), 0);
        setTimeout(()=>this.play(600,'sine',0.2, 0.1), 150);
        setTimeout(()=>this.play(800,'sine',0.4, 0.15), 300);
    },
    expand() { this.play(150, 'sawtooth', 0.8, 0.1); setTimeout(()=>this.play(300, 'square', 0.8, 0.1), 200); },
    ladder() { this.play(1000, 'square', 0.1, 0.02); }, 
    ladderWin() { this.play(1200, 'sine', 0.3, 0.1); },
    ladderLose() { this.play(150, 'sawtooth', 0.4, 0.1); }
};

export const BookSlot = {
    config: {
        // High Volatility Profil (Ägypten Thema)
        symbolWeights: {
            '10': 45, 'J': 40, 'Q': 35, 'K': 30, 'A': 25, // Low Pays
            '🦅': 12, '🐕': 10, '🛕': 6, '🤠': 3,          // High Pays
            '📘': 5                                      // Scatter & Wild
        },
        spinDuration: 2000,
        // 10 Klassische Linien
        lines: [[1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],[0,0,1,0,0],[2,2,1,2,2],[1,0,0,0,1],[1,2,2,2,1],[0,1,1,1,0]],
        // Risikoleiter Stufen
        ladderSteps: [0, 2, 4, 8, 12, 20, 40, 80, 140] 
    },
    
    symbolPool: [], isSpinning: false, isAuto: false, 
    freeSpins: 0, currentBet: 0,
    specialSymbol: null, // Für die Freispiele

    gambleActive: false, currentLadderIdx: 0, gambleInterval: null, flashState: false,

    render() {
        return `
            <div class="screen act">
                <div class="pnl" style="max-width: 1000px; margin: 0 auto; width: 100%;">
                    
                    <div class="ttl" style="margin-bottom: 15px; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <select id="sl-selector" style="padding: 5px; font-size: 14px; background: transparent; border: 1px solid var(--prm); color:var(--prm); width:auto; margin-right:10px;">
                                <option value="book">Book of Noir</option>
                                <option value="classic">Classic Noir</option>
                            </select>
                            <button id="sl-btn-info" class="btn b-sec" style="padding: 5px 10px; width:auto; border-radius:50%;">i</button>
                        </div>
                        <span id="sl-fs-counter" style="color:var(--prm); display:none; font-weight:bold; font-size:16px; letter-spacing:1px;">
                            FREE SPINS: <span id="fs-num">0</span> <span id="fs-sym" style="margin-left:10px; font-size:24px;"></span>
                        </span>
                    </div>
                    
                    <div class="slot-box book-theme" id="sl-main-box">
                        <canvas id="sl-canvas"></canvas>

                        <div class="slot-modal" id="sl-info-modal">
                            <h3 style="color:var(--prm); margin-bottom:15px; border-bottom:1px solid var(--prm); padding-bottom:10px; letter-spacing:2px;">BOOK OF NOIR PAYTABLE</h3>
                            <div class="pt-row"><span class="pt-sym sym-book-anim" style="font-size:24px;">📘</span><span>Scatter/Wild: 3+ lösen 10 Freispiele mit Spezial-Symbol aus.</span></div>
                            <div class="pt-row"><span class="pt-sym sym-high">🤠</span><span>5x Vollbild: 5000x | 4x: 1000x | 3x: 100x | 2x: 10x</span></div>
                            <div class="pt-row"><span class="pt-sym sym-high">🛕</span><span>5x Vollbild: 2000x | 4x: 400x | 3x: 40x | 2x: 5x</span></div>
                            <div class="pt-row"><span class="pt-sym sym-high">🦅🐕</span><span>5x Vollbild: 750x | 4x: 100x | 3x: 30x | 2x: 5x</span></div>
                            <div class="pt-row">
                                <span><span class="sym-let-book sym-A" style="font-size:20px;">A</span> <span class="sym-let-book sym-K" style="font-size:20px;">K</span></span>
                                <span>5x: 150x | 4x: 40x | 3x: 5x</span>
                            </div>
                            <div class="pt-row">
                                <span><span class="sym-let-book sym-Q" style="font-size:20px;">Q</span> <span class="sym-let-book sym-J" style="font-size:20px;">J</span> <span class="sym-let-book sym-10" style="font-size:20px;">10</span></span>
                                <span>5x: 100x | 4x: 25x | 3x: 5x</span>
                            </div>
                            <button class="btn b-prm" id="btn-close-info" style="margin-top:20px;">SCHLIESSEN</button>
                        </div>

                        <div class="gamble-ladder-ui" id="gamble-ui">
                            <h3 style="color:var(--prm); margin-bottom: 10px; letter-spacing:3px; font-size:16px;">RISIKOLEITER</h3>
                            <div class="ladder-box" id="ladder-container"></div>
                            <div class="gamble-btns">
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
                        <div><label>Einsatz / Linie</label><input type="number" id="sl-bet" value="1" min="0.10" max="100" step="0.10"></div>
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
        this.canvas = document.getElementById('sl-canvas'); this.ctx = this.canvas.getContext('2d');
        this.reels = [0,1,2,3,4].map(i => document.getElementById(`sl-r${i}`));
        
        for (const [sym, weight] of Object.entries(this.config.symbolWeights)) {
            for (let i = 0; i < weight; i++) this.symbolPool.push(sym);
        }

        this.resizeCanvas(); window.addEventListener('resize', () => this.resizeCanvas());

        document.getElementById('sl-btn-spin').onclick = () => { this.isAuto = false; this.updateAutoUI(); this.spin(); };
        document.getElementById('sl-btn-auto').onclick = () => this.toggleAuto();
        
        document.getElementById('sl-btn-info').onclick = () => document.getElementById('sl-info-modal').classList.add('act');
        document.getElementById('btn-close-info').onclick = () => document.getElementById('sl-info-modal').classList.remove('act');

        document.getElementById('btn-gmb-collect').onclick = () => this.collectGamble();
        document.getElementById('btn-gmb-risk').onclick = () => this.stepLadder();

        document.getElementById('sl-selector').onchange = (e) => {
            if(e.target.value === 'classic') window.noirRoute('slots');
        };

        this.reels.forEach(r => r.innerHTML = '<div class="sl-sym">🛕</div>'.repeat(3));
    },

    resizeCanvas() {
        if(!this.canvas) return;
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    },

    getRandomSymbol() { return this.symbolPool[Math.floor(Math.random() * this.symbolPool.length)]; },

    formatSymbol(s) {
        if(['10','J','Q','K','A'].includes(s)) return `<div class="sl-sym sym-let-book sym-${s}">${s}</div>`;
        if(['🦅','🐕','🛕','🤠'].includes(s)) return `<div class="sl-sym sym-high">${s}</div>`;
        const extraClass = s === '📘' ? 'sym-book-anim' : '';
        return `<div class="sl-sym ${extraClass}">${s}</div>`;
    },

    toggleAuto() {
        this.isAuto = !this.isAuto; this.updateAutoUI();
        if(this.isAuto && !this.isSpinning) this.spin();
    },

    updateAutoUI() {
        const btn = document.getElementById('sl-btn-auto');
        if(this.isAuto) { btn.style.background = 'var(--prm)'; btn.style.color = '#000'; btn.innerText = 'STOP AUTO'; } 
        else { btn.style.background = ''; btn.style.color = ''; btn.innerText = 'AUTO'; }
    },

    async spin() {
        if(this.isSpinning || this.gambleActive) return;
        Snd.init(); 
        
        const bet = parseFloat(document.getElementById('sl-bet').value);
        const lines = parseInt(document.getElementById('sl-lines').value) || 10;
        this.currentBet = bet; 
        
        if(this.freeSpins <= 0) {
            const totalCost = this.currentBet * lines;
            if(!removeMoney(totalCost)) {
                showToast("Nicht genügend Guthaben!", "error");
                this.isAuto = false; this.updateAutoUI(); return;
            }
            window.dispatchEvent(new CustomEvent('updateHUD'));
            this.specialSymbol = null; // Reset Symbol
        }

        this.isSpinning = true;
        document.getElementById('sl-btn-spin').disabled = true;
        document.getElementById('sl-btn-auto').disabled = false; // Bleibt klickbar für Abbruch

        document.getElementById('sl-display').innerText = this.freeSpins > 0 ? `FREE SPIN` : "SPINNING...";
        document.getElementById('sl-display').style.color = 'var(--sec)';
        this.ctx.clearRect(0,0,2000,2000);
        
        if(this.freeSpins > 0) { this.freeSpins--; this.updateFreeSpinsUI(); }

        let grid = [[],[],[],[],[]];
        const symbolHeight = this.reels[0].offsetHeight / 3;

        for(let i=0; i<5; i++) {
            let html = '';
            // Blur-Effekt beim Drehen mit echten Symbolen
            for(let j=0; j<15; j++) {
                const rs = this.getRandomSymbol();
                if(['10','J','Q','K','A'].includes(rs)) html += `<div class="sl-sym" style="filter:blur(3px); opacity:0.6;"><span class="sym-let-book sym-${rs}">${rs}</span></div>`;
                else if(['🦅','🐕','🛕','🤠'].includes(rs)) html += `<div class="sl-sym" style="filter:blur(3px); opacity:0.6;"><span class="sym-high">${rs}</span></div>`;
                else html += `<div class="sl-sym" style="filter:blur(3px); opacity:0.6;">${rs}</div>`;
            }
            // Reale Ergebnisse
            for(let k=0; k<3; k++) {
                const s = this.getRandomSymbol();
                grid[i].push(s);
                html += this.formatSymbol(s);
            }
            this.reels[i].style.transition = 'none';
            this.reels[i].style.transform = 'translateY(0)';
            this.reels[i].innerHTML = html;
            
            setTimeout(() => {
                Snd.tick(); 
                this.reels[i].style.transition = `transform ${this.config.spinDuration + (i*300)}ms cubic-bezier(0.1, 0, 0.1, 1.1)`;
                this.reels[i].style.transform = `translateY(-${15 * symbolHeight}px)`;
            }, 20 + (i*150)); 
        }

        setTimeout(() => this.evaluate(grid, lines), this.config.spinDuration + 1400);
    },

    async evaluate(grid, activeLines) {
        let totalWin = 0; let scatters = 0;
        const linesToCheck = Math.min(activeLines, 10);
        const w = this.canvas.clientWidth / 5;
        const h = this.canvas.clientHeight / 3;

        // 1. Scatter zählen
        grid.forEach(col => col.forEach(s => { if(s === '📘') scatters++; }));

        if(scatters >= 3) {
            Snd.win();
            // Scatter Gewinn (basiert auf Gesamteinsatz!)
            totalWin += this.currentBet * activeLines * (scatters === 3 ? 2 : scatters === 4 ? 20 : 200);
            this.freeSpins += 10;
            
            if(!this.specialSymbol) {
                const validSyms = ['10','J','Q','K','A','🦅','🐕','🛕','🤠'];
                this.specialSymbol = validSyms[Math.floor(Math.random() * validSyms.length)];
                this.showBigWinOverlay(`10 FREISPIELE!\nSYMBOL: ${this.specialSymbol}`);
                setTimeout(() => this.updateFreeSpinsUI(), 2500);
            } else {
                this.showBigWinOverlay("10 WEITERE FREISPIELE!");
            }
        }

        // 2. Normale Linien (Buch ist Wild!)
        for(let i=0; i < linesToCheck; i++) {
            const p = this.config.lines[i];
            let targetSym = grid[0][p[0]], match = 1;

            if(targetSym === '📘') { // Finde erstes Nicht-Wild
                if(grid[1][p[1]] !== '📘') targetSym = grid[1][p[1]];
                else if(grid[2][p[2]] !== '📘') targetSym = grid[2][p[2]];
            }

            if(targetSym === '📘') targetSym = '10'; // Nur Wilds auf der Linie -> zahlt wie das niedrigste Symbol

            for(let c=1; c<5; c++) {
                const currentSym = grid[c][p[c]];
                if(currentSym === targetSym || currentSym === '📘') match++; else break;
            }

            if(match >= 2) { // Berechne Gewinn
                let mult = 0;
                if(['🤠'].includes(targetSym)) mult = match===2?10 : match===3?100 : match===4?1000 : 5000;
                else if(['🛕'].includes(targetSym)) mult = match===2?5 : match===3?40 : match===4?400 : 2000;
                else if(['🦅','🐕'].includes(targetSym)) mult = match===2?5 : match===3?30 : match===4?100 : 750;
                else if(['A','K'].includes(targetSym) && match>=3) mult = match===3?5 : match===4?40 : 150;
                else if(['10','J','Q'].includes(targetSym) && match>=3) mult = match===3?5 : match===4?25 : 100;
                
                if(mult > 0) {
                    totalWin += this.currentBet * mult;
                    this.drawWinLine(p, match, w, h);
                }
            }
        }

        // 3. EXPANDING SYMBOL LOGIK (Nur in Freispielen)
        if(this.specialSymbol && scatters < 3) { // Nicht expandieren, wenn gerade Freispiele gewonnen wurden
            let reelsWithSymbol = [];
            for(let i=0; i<5; i++) {
                if(grid[i].includes(this.specialSymbol)) reelsWithSymbol.push(i);
            }

            const minNeeded = ['10','J','Q','K','A'].includes(this.specialSymbol) ? 3 : 2;

            if(reelsWithSymbol.length >= minNeeded) {
                await new Promise(r => setTimeout(r, 800));
                Snd.expand();

                reelsWithSymbol.forEach(rIdx => {
                    const overlay = document.createElement('div');
                    overlay.className = 'expanding-overlay';
                    overlay.innerHTML = this.formatSymbol(this.specialSymbol);
                    overlay.style.fontSize = '80px';
                    this.reels[rIdx].appendChild(overlay);
                });

                // Vollbild Gewinn berechnen
                let mult = 0;
                let match = reelsWithSymbol.length;
                let sym = this.specialSymbol;
                if(['🤠'].includes(sym)) mult = match===2?10 : match===3?100 : match===4?1000 : 5000;
                else if(['🛕'].includes(sym)) mult = match===2?5 : match===3?40 : match===4?400 : 2000;
                else if(['🦅','🐕'].includes(sym)) mult = match===2?5 : match===3?30 : match===4?100 : 750;
                else if(['A','K'].includes(sym) && match>=3) mult = match===3?5 : match===4?40 : 150;
                else if(['10','J','Q'].includes(sym) && match>=3) mult = match===3?5 : match===4?25 : 100;
                
                const expandWin = (this.currentBet * mult) * activeLines; // Zahlt auf ALLEN Linien
                totalWin += expandWin;

                await new Promise(r => setTimeout(r, 1500));
                document.querySelectorAll('.expanding-overlay').forEach(el => el.remove());
            }
        }

        // 4. Auszahlung / Risiko
        if(totalWin > 0) {
            Snd.win();
            document.getElementById('sl-display').innerText = `GEWINN: ${formatMoney(totalWin)}`;
            document.getElementById('sl-display').style.color = 'var(--suc)';
            if(totalWin >= this.currentBet * activeLines * 50) this.showBigWinOverlay("MEGA WIN!");

            // Automatisches Sammeln im Freispiel oder AUTO
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
        setTimeout(() => overlay.remove(), 3000);
    },

    // --- RISIKOLEITER ENGINE ---
    initGamble(winAmount) {
        this.gambleActive = true;
        document.getElementById('sl-controls').style.display = 'none';
        
        // Buttons freischalten
        document.getElementById('btn-gmb-collect').disabled = false;
        document.getElementById('btn-gmb-risk').disabled = false;
        
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
            Snd.ladder(); 
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

        // Sofort sperren gegen Spamming
        document.getElementById('btn-gmb-collect').disabled = true;
        document.getElementById('btn-gmb-risk').disabled = true;

        const won = Math.random() > 0.5;
        
        if(won) {
            Snd.ladderWin();
            this.currentLadderIdx = Math.min(this.currentLadderIdx + 1, this.config.ladderSteps.length - 1);
            this.renderLadder();
            document.getElementById('sl-display').innerText = `GEKLETTERT!`;
            
            if(this.currentLadderIdx === this.config.ladderSteps.length - 1) {
                setTimeout(() => this.collectGamble(), 1000);
            } else {
                setTimeout(() => {
                    document.getElementById('btn-gmb-collect').disabled = false;
                    document.getElementById('btn-gmb-risk').disabled = false;
                    this.startLadderBlink();
                }, 300); 
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
        
        if(this.freeSpins > 0 || this.isAuto) setTimeout(() => this.spin(), 800);
        else if (this.freeSpins === 0 && this.specialSymbol) {
            this.specialSymbol = null; // Freispiele vorbei
            this.updateFreeSpinsUI();
        }
    },

    updateFreeSpinsUI() {
        const el = document.getElementById('sl-fs-counter');
        if(this.freeSpins > 0 || this.specialSymbol) {
            el.style.display = 'inline';
            document.getElementById('fs-num').innerText = this.freeSpins;
            document.getElementById('fs-sym').innerText = this.specialSymbol || '';
        } else {
            el.style.display = 'none';
        }
    }
};
