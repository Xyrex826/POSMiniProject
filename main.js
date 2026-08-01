import { $ } from './utils.js';
import { renderCatalog, renderCategoryFilters, resetAllTiles } from './catalog.js';
import { renderCart } from './cart.js';
import { renderReports } from './reports.js';
import { initCheckout } from './checkout.js';
import { clearCart } from './state.js';
import { showConfirm, closeConfirm, isConfirmOpen, initConfirmModal } from './confirm.js';
import { initNumpad, isNumpadOpen, closeNumpad } from './Numpad.js';

let currentSearch = '';
let currentCategory = 'All';

function refreshCart() {
  renderCart(refreshCart);
}

function refreshCatalog() {
  renderCatalog(currentSearch, currentCategory, refreshCart);
}

function refreshFilters() {
  renderCategoryFilters(currentCategory, cat => {
    currentCategory = cat;
    refreshFilters();
    refreshCatalog();
  });
}

/* ===================== TABS ===================== */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn[data-tab]').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  $('view-' + tab).classList.add('active');
  if (tab === 'reports') renderReports();
}

document.querySelectorAll('.tab-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

/* ===================== CONFIRMATION MODAL (shared) ===================== */
initConfirmModal();

/* ===================== NUMPAD (touchscreen quantity entry) ===================== */
initNumpad();

/* ===================== ACTIONS (mouse + keyboard share this) ===================== */
function runAction(action) {
  switch (action) {
    case 'new-sale':
      showConfirm({
        title: 'Clear list of items??',
        message: 'This will remove all items from the cart.',
        confirmLabel: 'Clear All',
        onConfirm: () => {
          clearCart();
          refreshCart();
          resetAllTiles();
        }
      });
      break;
    case 'tab-pos':
      switchTab('pos');
      break;
    case 'tab-reports':
      switchTab('reports');
      break;
    case 'checkout':
      $('checkout-btn').click();
      break;
    case 'confirm':
      if (!$('confirm-btn').disabled) $('confirm-btn').click();
      break;
    case 'cancel':
      if (isNumpadOpen()) {
        closeNumpad();
      } else if ($('receipt-overlay').classList.contains('show')) {
        $('receipt-overlay').classList.remove('show');
      } else if (isConfirmOpen()) {
        closeConfirm();
      } else {
        $('pay-box').style.display = 'none';
      }
      break;
  }
}

$('btn-new-sale').addEventListener('click', () => runAction('new-sale'));

/* ===================== KEYBOARD SHORTCUTS ===================== */
document.addEventListener('keydown', e => {
  const map = {
    F1: 'new-sale',
    F3: 'tab-reports',
    F4: 'tab-pos',
    F9: 'checkout',
    F10: 'confirm',
    Escape: 'cancel'
  };
  if (map[e.key]) {
    e.preventDefault();
    runAction(map[e.key]);
  }
});

/* ===================== CLOCK ===================== */
function tickClock() {
  $('status-clock').textContent = new Date().toLocaleString('en-PH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}
tickClock();
setInterval(tickClock, 1000);

/* ===================== SEARCH ===================== */
$('search').addEventListener('input', e => {
  currentSearch = e.target.value;
  refreshCatalog();
});

/* ===================== CHECKOUT ===================== */
initCheckout(() => {
  refreshCart();
  renderReports();
});

/* ===================== INIT ===================== */
refreshFilters();
refreshCatalog();
refreshCart();
renderReports();