import { $, peso, enforceMoneyInput } from './utils.js';
import { cartTotal, checkoutTransaction } from './state.js';
import { showReceipt } from './receipt.js';
import { openAmountNumpad } from './Numpad.js';

// Checkout setup connects the payment UI to the transaction state.
// The user enters an amount, the app checks whether it covers the total,
// and only then the order is finalized into a saved receipt transaction.
export function initCheckout(onComplete) {
  enforceMoneyInput($('payment-input')); // blocks negative amounts; decimals stay allowed for centavos

  const paymentInput = $('payment-input');

  paymentInput.addEventListener('mousedown', e => {
    e.preventDefault();
    openAmountNumpad(paymentInput, { title: 'Enter amount' });
  });

  $('checkout-btn').addEventListener('click', () => {
    $('pay-box').style.display = 'block';
    paymentInput.value = '';
    openAmountNumpad(paymentInput, { title: 'Enter amount' });
  });

  $('payment-input').addEventListener('input', () => {
    const total = cartTotal();
    const paid = parseFloat($('payment-input').value);
    const hint = $('pay-hint');
    const confirmBtn = $('confirm-btn');

    if (isNaN(paid) || paid <= 0) {
      hint.textContent = '';
      hint.className = 'pay-hint';
      confirmBtn.disabled = true;
      return;
    }
    if (paid < total) {
      hint.textContent = `Short by ${peso(total - paid)}`;
      hint.className = 'pay-hint short';
      confirmBtn.disabled = true;
    } else {
      hint.textContent = `Change: ${peso(paid - total)}`;
      hint.className = 'pay-hint ok';
      confirmBtn.disabled = false;
    }
  });

  // The final confirm step converts the active cart into a receipt record.
  // If the amount is valid, the modal/receipt UI is shown and the reports are refreshed.
  $('confirm-btn').addEventListener('click', () => {
    const paid = parseFloat($('payment-input').value);
    const transaction = checkoutTransaction(paid);
    if (!transaction) return;

    showReceipt(transaction);
    onComplete();
  });
}