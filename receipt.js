import { $, peso, displayProductName } from './utils.js';
import { clearCart } from './state.js';
import { renderCart } from './cart.js';
import { resetAllTiles } from './catalog.js';

export function showReceipt(tx) {
  const itemLines = tx.items.map(i => `
    <div class="rline item-name"><span>${displayProductName(i.product_name)}</span></div>
    <div class="rline item-sub">
      <span>${i.quantity} × ${peso(i.product_price)}</span>
      <span>${peso(i.subtotal)}</span>
    </div>
  `).join('');

  $('resibo-content').innerHTML = `
    <div class="receipt-check">✓</div>
    <h3>Payment received</h3>
    <div class="sub">${tx.transaction_id} &nbsp;·&nbsp; ${tx.date}</div>

    <div class="receipt-lines">${itemLines}</div>
    <hr class="receipt-divider">
    <div class="rline grand"><span>Total</span><span>${peso(tx.total_amount)}</span></div>
    <div class="rline"><span>Paid</span><span>${peso(tx.amount_paid)}</span></div>
    <div class="rline"><span>Change</span><span>${peso(tx.change)}</span></div>

    <button class="btn-primary" id="receipt-close">New Transaction</button>
  `;

  $('receipt-overlay').classList.add('show');
  $('receipt-close').addEventListener('click', () => {
    clearCart();
    renderCart(() => {});
    resetAllTiles();
    $('receipt-overlay').classList.remove('show');
  });
}