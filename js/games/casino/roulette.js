import { getMoney, removeMoney, addMoney } from '../../core/state.js';
import { formatMoney, showToast } from '../../core/ui.js';

export const Roulette = {
    canvas: null, ctx: null,
    isSpinning: false,
    currentRotation: 0,
    selectedChip: 5,
    bets: new Map(), 
    
    // Die exakte europäische Roulette-Folge (0 bis 26 im Uhrzeigersinn)
    wheelNumbers: [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26],
    redNumbers: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],

    render() {
        return `
            <div class="screen act">
                <div class="pnl" style="text-align:center; padding: 20px;">
                    <h1 style="letter-spacing:8px; margin-bottom:5px; color:var(--prm);">NOIR <span style="color:#fff;">ROULETTE</span></h1>
                    <p style="font-size:11px; color:#666; text-transform:uppercase; letter-spacing:2px;">Premium European Table</p>
                </div>

                <div class="roulette-wrapper">
                    <div class="wheel-area">
                        <div class="wheel-pin"></div>
                        <canvas id="roulette-canvas" width="900" height="900"></canvas>
                    </div>

                    <div style="flex:1; min-width: 400px;">
                        <div id="r-display" style="text-align:center; font-size:28px; color:var(--prm); margin-bottom:20px; font-family:monospace; min-height:40px;">PLACE YOUR BETS</div>
                        
                        <div class="betting-layout" id="roulette-table">
                            <div class="table-cell cell-zero" data-bet="0">0</div>
                            ${this.generateTableCells()}
                            
                            <div class="table-cell" style="grid-column: 2 / span 2" data-bet="low">1-18</div>
                            <div class="table-cell" style="grid-column: 4 / span 2" data-bet="even">EVEN</div>
                            <div class="table-cell cell-red" style="grid-column: 6 / span 2" data-bet="red">RED</div>
                            <div class="table-cell cell-black" style="grid-column: 8 / span 2" data-bet="black">BLACK</div>
                            <div class="table-cell" style="grid-column: 10 / span 2" data-bet="odd">ODD</div>
                            <div class="table-cell" style="grid-column: 12 / span 2" data-bet="high">19-36</div>
                        </div>

                        <div class="chip-rack">
                            ${[5, 10, 50, 100, 500].map(v => `<div class="chip c-${v} ${this.selectedChip === v ? 'selected' : ''}" data-val="${v}">${v}</div>`).join('')}
                        </div>

                        <div style="margin-top:25px; display:flex; gap:15px;">
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
        this.drawWheel(0);

        document.querySelectorAll('.chip').forEach(c => {
            c.onclick = () => {
                document.querySelectorAll('.chip').forEach(ch => ch.classList.remove('selected'));
                c.classList.add('selected');
                this.selectedChip = parseInt(c.dataset.val);
            };
        });

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

    drawWheel(rotation) {
        const cx = 450, cy = 450, r = 420;
        this.ctx.clearRect(0,0,900,900);
        
        this.wheelNumbers.forEach((num, i) => {
            // Die 0 muss oben starten, daher korrigieren wir den Startwinkel um -90 Grad (-Math.PI / 2)
            const angleStep = (Math.PI * 2) / 37;
            const startAngle = (i * angleStep) + rotation - (Math.PI / 2) - (angleStep / 2);
            const endAngle = startAngle + angleStep;
            
            this.ctx.beginPath();
            this.ctx.moveTo(cx, cy);
            this.ctx.arc(cx, cy, r, startAngle, endAngle);
            this.ctx.fillStyle = num === 0 ? '#006400' : (this.redNumbers.includes(num) ? '#800' : '#111');
            this.ctx.fill();
            this.ctx.strokeStyle = '#D4AF37';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.save();
            this.ctx.translate(cx, cy);
            this.ctx.rotate(startAngle + angleStep / 2);
            this.ctx.textAlign = "right";
            this.ctx.fillStyle = "white";
            this.ctx.font = "bold 28px Inter";
            this.ctx.fillText(num, r - 30, 10);
            this.ctx.restore();
        });

        // Edles Zentrum
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 140, 0, Math.PI * 2);
        this.ctx.fillStyle = '#050505';
        this.ctx.fill();
        this.ctx.strokeStyle = '#D4AF37';
        this.ctx.lineWidth = 10;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#D4AF37';
        this.ctx.font = "bold 45px Inter";
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
            showToast("Guthaben unzureichend!", "error");
        }
    },

    updateChipsUI() {
        document.querySelectorAll('.chip-overlay').forEach(el => el.remove());
        this.bets.forEach((amount, betID) => {
            const cell = document.querySelector(`[data-bet="${betID}"]`);
            if(cell) {
                const chip = document.createElement('div');
                chip.className = 'chip-overlay';
                chip.innerText = amount >= 1000 ? (amount/1000).toFixed(1)+'k' : amount;
                cell.appendChild(chip);
            }
        });
    },

    spin() {
        if(this.isSpinning || this.bets.size === 0) return;

        this.isSpinning = true;
        document.getElementById('r-display').innerText = "NO MORE BETS";
        document.getElementById('r-display').style.color = "var(--prm)";
        
        const winningIdx = Math.floor(Math.random() * 37);
        const winningNum = this.wheelNumbers[winningIdx];
        
        const fullRotations = 8;
        const segmentAngle = (Math.PI * 2) / 37;
        // Wir berechnen die Rotation so, dass der winningIdx genau unter den Pointer (oben) rutscht
        const finalRotation = (Math.PI * 2 * fullRotations) - (winningIdx * segmentAngle);
        
        const startTime = performance.now();
        const duration = 5000;

        const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3); // Smooth ease-out
            
            this.currentRotation = ease * finalRotation;
            this.drawWheel(this.currentRotation);

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
        const isEven = winningNum !== 0 && winningNum % 2 === 0;
        const isLow = winningNum >= 1 && winningNum <= 18;
        
        const display = document.getElementById('r-display');
        const colorName = winningNum === 0 ? 'GREEN' : (isRed ? 'RED' : 'BLACK');
        display.innerText = `${winningNum} ${colorName}`;
        
        let totalWin = 0;
        this.bets.forEach((amount, betID) => {
            let won = false;
            let mult = 0;

            if (!isNaN(betID) && parseInt(betID) === winningNum) { won = true; mult = 36; }
            else if (betID === 'red' && isRed) { won = true; mult = 2; }
            else if (betID === 'black' && winningNum !== 0 && !isRed) { won = true; mult = 2; }
            else if (betID === 'even' && isEven) { won = true; mult = 2; }
            else if (betID === 'odd' && winningNum !== 0 && !isEven) { won = true; mult = 2; }
            else if (betID === 'low' && isLow) { won = true; mult = 2; }
            else if (betID === 'high' && winningNum >= 19) { won = true; mult = 2; }

            if (won) totalWin += amount * mult;
        });

        if(totalWin > 0) {
            addMoney(totalWin);
            window.dispatchEvent(new CustomEvent('updateHUD'));
            display.style.color = "var(--suc)";
            showToast(`GEWONNEN: ${formatMoney(totalWin)}`, 'success');
        } else {
            display.style.color = "var(--err)";
        }

        this.bets.clear();
        setTimeout(() => {
            this.updateChipsUI();
            if(!this.isSpinning) {
                display.innerText = "PLACE YOUR BETS";
                display.style.color = "var(--prm)";
            }
        }, 3000);
    }
};
