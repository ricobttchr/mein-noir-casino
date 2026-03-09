import { getMoney, removeMoney, addMoney } from '../../core/state.js';
import { formatMoney, showToast } from '../../core/ui.js';

export const Roulette = {
    canvas: null, ctx: null,
    isSpinning: false,
    currentRotation: 0,
    selectedChip: 5,
    bets: new Map(), // Speichert Position -> Betrag
    
    // Die europäische Roulette-Folge
    wheelNumbers: [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26],
    redNumbers: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],

    render() {
        return `
            <div class="screen act">
                <div class="pnl" style="text-align:center;">
                    <h1 style="letter-spacing:8px; margin-bottom:10px; color:var(--prm);">NOIR <span style="color:#fff;">ROULETTE</span></h1>
                    <p style="font-size:12px; color:#666; text-transform:uppercase; letter-spacing:2px;">European Premium Edition</p>
                </div>

                <div class="roulette-wrapper">
                    <div class="wheel-area">
                        <div class="wheel-pin"></div>
                        <canvas id="roulette-canvas" width="900" height="900"></canvas>
                    </div>

                    <div style="flex:1;">
                        <div id="r-display" style="text-align:center; font-size:32px; color:var(--prm); margin-bottom:20px; font-weight:100; font-family:monospace;">PLACE YOUR BETS</div>
                        
                        <div class="betting-layout" id="roulette-table">
                            <div class="table-cell cell-zero" data-bet="0">0</div>
                            ${this.generateTableCells()}
                            </div>

                        <div class="chip-rack">
                            <div class="chip c-5 selected" data-val="5">5</div>
                            <div class="chip c-10" data-val="10">10</div>
                            <div class="chip c-50" data-val="50">50</div>
                            <div class="chip c-100" data-val="100">100</div>
                            <div class="chip c-500" data-val="500">500</div>
                        </div>

                        <div style="margin-top:30px; display:flex; gap:20px;">
                            <button class="btn b-drk" id="r-clear" style="flex:1;">CLEAR</button>
                            <button class="btn b-prm" id="r-spin" style="flex:2;">SPIN</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    generateTableCells() {
        let html = '';
        const rows = [ [3,6,9,12,15,18,21,24,27,30,33,36], [2,5,8,11,14,17,20,23,26,29,32,35], [1,4,7,10,13,16,19,22,25,28,31,34] ];
        
        rows.forEach(row => {
            row.forEach(num => {
                const colorClass = this.redNumbers.includes(num) ? 'cell-red' : 'cell-black';
                html += `<div class="table-cell ${colorClass}" data-bet="${num}">${num}</div>`;
            });
        });
        return html;
    },

    init() {
        this.canvas = document.getElementById('roulette-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.drawWheel();

        // Chip Auswahl
        document.querySelectorAll('.chip').forEach(c => {
            c.onclick = () => {
                document.querySelectorAll('.chip').forEach(ch => ch.classList.remove('selected'));
                c.classList.add('selected');
                this.selectedChip = parseInt(c.dataset.val);
            };
        });

        // Setz-Logik
        document.getElementById('roulette-table').onclick = (e) => {
            const cell = e.target.closest('.table-cell');
            if(!cell || this.isSpinning) return;
            this.placeBet(cell);
        };

        document.getElementById('r-clear').onclick = () => {
            if(this.isSpinning) return;
            this.bets.clear();
            this.updateChipsUI();
        };

        document.getElementById('r-spin').onclick = () => this.spin();
    },

    drawWheel() {
        const cx = 450, cy = 450, r = 400;
        this.ctx.clearRect(0,0,900,900);
        
        this.wheelNumbers.forEach((num, i) => {
            const angle = (i * 2 * Math.PI) / 37 + this.currentRotation;
            const nextAngle = ((i + 1) * 2 * Math.PI) / 37 + this.currentRotation;
            
            // Segment zeichnen
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.arc(cx, cy, r, angle, nextAngle);
            this.ctx.fillStyle = num === 0 ? '#006400' : (this.redNumbers.includes(num) ? '#800' : '#111');
            this.ctx.fill();
            this.ctx.strokeStyle = '#D4AF37';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Zahl zeichnen
            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(angle + Math.PI / 37);
            this.ctx.textAlign = "right";
            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 30px Inter";
            this.ctx.fillText(num, r - 20, 10);
            this.ctx.restore();
        });

        // Mitte (Noir Logo)
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 120, 0, Math.PI * 2);
        this.ctx.fillStyle = '#050505';
        this.ctx.fill();
        this.ctx.strokeStyle = '#D4AF37';
        this.ctx.lineWidth = 8;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#D4AF37';
        this.ctx.font = "bold 40px Inter";
        this.ctx.textAlign = "center";
        this.ctx.fillText("NOIR", cx, cy + 15);
    },

    placeBet(cell) {
        const betID = cell.dataset.bet;
        const currentAmount = this.bets.get(betID) || 0;
        
        if(removeMoney(this.selectedChip)) {
            this.bets.set(betID, currentAmount + this.selectedChip);
            window.dispatchEvent(new CustomEvent('updateHUD'));
            this.updateChipsUI();
        } else {
            showToast("Insolvent?", "error");
        }
    },

    updateChipsUI() {
        // Alle alten Chips entfernen
        document.querySelectorAll('.chip-overlay').forEach(el => el.remove());
        
        this.bets.forEach((amount, betID) => {
            const cell = document.querySelector(`[data-bet="${betID}"]`);
            if(cell) {
                const chip = document.createElement('div');
                chip.className = 'chip-overlay';
                chip.innerText = amount >= 1000 ? (amount/1000)+'k' : amount;
                cell.appendChild(chip);
            }
        });
    },

    async spin() {
        if(this.isSpinning || this.bets.size === 0) {
            if(this.bets.size === 0) showToast("Wetten platzieren!", "info");
            return;
        }

        this.isSpinning = true;
        document.getElementById('r-display').innerText = "NO MORE BETS";
        
        const winningIdx = Math.floor(Math.random() * 37);
        const winningNum = this.wheelNumbers[winningIdx];
        
        // Physikalische Animation (viele Umdrehungen + Ziel)
        const totalRotation = (Math.PI * 2 * 10) + ( (37 - winningIdx) * (Math.PI * 2 / 37) );
        const startTime = performance.now();
        const duration = 6000; // 6 Sekunden edles Drehen

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out Funktion
            const ease = 1 - Math.pow(1 - progress, 4);
            this.currentRotation = ease * totalRotation;
            
            this.drawWheel();

            if(progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.resolveSpin(winningNum);
            }
        };
        requestAnimationFrame(animate);
    },

    resolveSpin(winningNum) {
        this.isSpinning = false;
        const isRed = this.redNumbers.includes(winningNum);
        const display = document.getElementById('r-display');
        display.innerText = `RESULT: ${winningNum} ${winningNum === 0 ? 'GREEN' : (isRed ? 'RED' : 'BLACK')}`;
        
        let totalWin = 0;
        this.bets.forEach((amount, betID) => {
            if(parseInt(betID) === winningNum) {
                totalWin += amount * 36; // Straight up bet
            }
            // Hier könnten später Außenwetten (Rot/Schwarz) hinzugefügt werden
        });

        if(totalWin > 0) {
            addMoney(totalWin);
            window.dispatchEvent(new CustomEvent('updateHUD'));
            showToast(`YOU WON ${formatMoney(totalWin)}!`, 'success');
        }

        this.bets.clear();
        setTimeout(() => {
            this.updateChipsUI();
            if(!this.isSpinning) display.innerText = "PLACE YOUR BETS";
        }, 3000);
    }
};
