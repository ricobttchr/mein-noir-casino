import { getMoney, removeMoney, addMoney } from '../../core/state.js';
import { formatMoney, showToast } from '../../core/ui.js';

export const Roulette = {
    isSpinning: false,
    selectedBet: null,
    numbers: [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26],
    
    render() {
        return `
            <div class="screen act">
                <div class="pnl roulette-container">
                    <h2 style="letter-spacing:4px; color:var(--prm);">NOIR ROULETTE</h2>
                    
                    <div class="wheel-pointer"></div>
                    <div class="wheel-box" id="r-wheel">
                        <div class="wheel-img" id="r-wheel-inner">
                            <span style="color:white; font-weight:bold; font-size:40px;">NOIR</span>
                        </div>
                    </div>

                    <div id="r-display" style="font-size:24px; color:var(--prm); height:30px; letter-spacing:2px;">EINSATZ WÄHLEN</div>

                    <div class="betting-table">
                        <div class="bet-btn bet-red" data-type="red">ROT (2x)</div>
                        <div class="bet-btn bet-black" data-type="black">SCHWARZ (2x)</div>
                        <div class="bet-btn" data-type="even">GERADE (2x)</div>
                        <div class="bet-btn" data-type="odd">UNGERADE (2x)</div>
                        <div class="bet-btn" data-type="zero" style="border-color:var(--suc);">ZERO (36x)</div>
                        <div class="bet-btn" data-type="high">19-36 (2x)</div>
                    </div>

                    <div class="grid" style="width:100%; max-width:600px; align-items:end;">
                        <div><label>Einsatz</label><input type="number" id="r-bet-amount" value="100" min="10"></div>
                        <button class="btn b-prm" id="r-btn-spin">DREHEN</button>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        const btns = document.querySelectorAll('.bet-btn');
        btns.forEach(btn => {
            btn.onclick = () => {
                btns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.selectedBet = btn.dataset.type;
                document.getElementById('r-display').innerText = `WETTE: ${this.selectedBet.toUpperCase()}`;
            };
        });

        document.getElementById('r-btn-spin').onclick = () => this.spin();
    },

    spin() {
        if (this.isSpinning || !this.selectedBet) {
            if (!this.selectedBet) showToast("Wette auswählen!", "error");
            return;
        }

        const amount = parseInt(document.getElementById('r-bet-amount').value);
        if (!removeMoney(amount)) {
            showToast("Nicht genug Geld!", "error");
            return;
        }
        window.dispatchEvent(new CustomEvent('updateHUD'));

        this.isSpinning = true;
        const wheel = document.getElementById('r-wheel-inner');
        const display = document.getElementById('r-display');
        
        // Zufälliges Ergebnis (0-36)
        const resultIdx = Math.floor(Math.random() * this.numbers.length);
        const winningNumber = this.numbers[resultIdx];
        
        // Animation berechnen (mindestens 5 volle Umdrehungen + Position des Segments)
        const rotation = (360 * 5) + (resultIdx * (360 / 37));
        wheel.style.transform = `rotate(${rotation}deg)`;
        display.innerText = "DIE KUGEL ROLLT...";

        setTimeout(() => {
            this.evaluate(winningNumber, amount);
            this.isSpinning = false;
            // Reset der Rotation für den nächsten Spin (ohne Sprung)
            wheel.style.transition = 'none';
            wheel.style.transform = `rotate(${rotation % 360}deg)`;
            setTimeout(() => wheel.style.transition = 'transform 4s cubic-bezier(0.1, 0, 0.1, 1)', 50);
        }, 4000);
    },

    evaluate(num, amount) {
        const isRed = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(num);
        const isEven = num !== 0 && num % 2 === 0;
        let won = false;
        let multiplier = 2;

        if (this.selectedBet === 'red' && isRed) won = true;
        if (this.selectedBet === 'black' && num !== 0 && !isRed) won = true;
        if (this.selectedBet === 'even' && isEven) won = true;
        if (this.selectedBet === 'odd' && num !== 0 && !isEven) won = true;
        if (this.selectedBet === 'zero' && num === 0) { won = true; multiplier = 36; }
        if (this.selectedBet === 'high' && num >= 19) won = true;

        const display = document.getElementById('r-display');
        const colorName = num === 0 ? "GRÜN" : (isRed ? "ROT" : "SCHWARZ");
        
        if (won) {
            const winAmount = amount * multiplier;
            addMoney(winAmount);
            window.dispatchEvent(new CustomEvent('updateHUD'));
            display.innerText = `${num} ${colorName} - GEWONNEN: ${formatMoney(winAmount)}`;
            display.style.color = 'var(--suc)';
            showToast(`Gewonnen! ${formatMoney(winAmount)}`);
        } else {
            display.innerText = `${num} ${colorName} - VERLOREN`;
            display.style.color = 'var(--err)';
        }
    }
};