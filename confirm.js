import { $ } from './utils.js';

// Generic confirmation modal. Any module can call showConfirm() to ask
// "are you sure?" before a destructive action, instead of each feature
// building its own modal. Only one confirmation can be pending at a time.
let pendingConfirm = null;

export function showConfirm({ title, message, confirmLabel = 'Confirm', onConfirm }) {
  $('confirm-title').textContent = title;
  $('confirm-message').textContent = message;
  $('confirm-ok-btn').textContent = confirmLabel;
  pendingConfirm = onConfirm;
  $('confirm-overlay').classList.add('show');
}

export function closeConfirm() {
  $('confirm-overlay').classList.remove('show');
  pendingConfirm = null;
}

export function isConfirmOpen() {
  return $('confirm-overlay').classList.contains('show');
}

// Wires the Cancel/OK buttons once at startup.
export function initConfirmModal() {
  $('confirm-cancel-btn').addEventListener('click', closeConfirm);
  $('confirm-ok-btn').addEventListener('click', () => {
    const action = pendingConfirm;
    closeConfirm();
    if (action) action();
  });
}