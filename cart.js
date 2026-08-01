import { $, peso, displayProductName } from './utils.js';
import { cart, cartTotal, removeFromCart } from './state.js';
import { showConfirm } from './confirm.js';
import { resetTile } from './catalog.js';

export function renderCart(onRemove) {
  const wrap = $('cart-lines');
  const total = cartTotal();

  if (cart.length === 0) {
    wrap.innerHTML = `<div class="cart-empty">No items yet — add products from the left.</div>`;
  } else {
    wrap.innerHTML = cart.map(l => {
      const displayName = displayProductName(l.product_name);
      return `
        <div class="crow">
          <div class="crow-main">
            <div class="crow-name">${displayName}</div>
          </div>
          <span class="crow-qty">×${l.quantity}</span>
          <span class="crow-sub">${peso(l.subtotal)}</span>
          <button class="crow-remove" data-id="${l.product_id}" title="Remove" aria-label="Remove ${displayName}">×</button>
        </div>
      `;
    }).join('');
    wrap.querySelectorAll('.crow-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        const line = cart.find(l => l.product_id === id);
        const name = line ? line.product_name : 'this item';
        showConfirm({
          title: 'Remove item?',
          message: `Remove "${name}" from the current sale?`,
          confirmLabel: 'Remove',
          onConfirm: () => {
            removeFromCart(id);
            const qtyInput = $('qty-' + id);
            if (qtyInput) {
              resetTile(qtyInput.closest('.product-tile'));
            }
            onRemove();
          }
        });
      });
    });
  }

  $('cart-total').textContent = peso(total);
  $('checkout-btn').disabled = cart.length === 0;

  // reset payment box whenever cart changes
  $('pay-box').style.display = 'none';
  $('payment-input').value = '';
  $('pay-hint').textContent = '';
  $('pay-hint').className = 'pay-hint';
  $('confirm-btn').disabled = true;
}