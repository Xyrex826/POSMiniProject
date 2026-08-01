import { $, peso, displayProductName } from './utils.js';
import { transactions, totalSales, bestSeller } from './state.js';

export function renderReports() {
  $('stat-total').textContent = peso(totalSales());
  $('stat-count').textContent = transactions.length;

  const best = bestSeller();
  $('stat-best').textContent = best ? `${best.name} (${best.qty}×)` : '—';

  const wrap = $('tx-table-wrap');
  if (transactions.length === 0) {
    wrap.innerHTML = `<div class="empty-state">No transactions recorded this session yet.</div>`;
    return;
  }

  const rows = transactions.slice().reverse().map(t => `
    <tr>
      <td class="tx-id">${t.transaction_id}</td>
      <td>${t.date}</td>
      <td class="tx-items">${t.items.map(i => `${displayProductName(i.product_name)} ×${i.quantity}`).join('<br>')}</td>
      <td class="tx-items">${t.items.map(i => i.category).join('<br>')}</td>
      <td class="tx-amt">${peso(t.total_amount)}</td>
      <td class="tx-amt">${peso(t.amount_paid)}</td>
      <td class="tx-amt">${peso(t.change)}</td>
    </tr>
  `).join('');

  wrap.innerHTML = `
    <table class="tx-table">
      <thead>
        <tr>
          <th>Transaction</th>
          <th>Date</th>
          <th>Items</th>
          <th>Category</th>
          <th>Total</th>
          <th>Paid</th>
          <th>Change</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}