import { $, sanitizeInteger } from './utils.js';

// Touchscreen-friendly on-screen numpad. Any quantity input can call
// openNumpad(inputEl, { title }) to let the user tap digits instead of
// typing on a physical/native keyboard. Only one numpad can be open at
// a time, targeting a single input element.

const MAX_DIGITS = 6; // caps entry at 999999 — plenty for a quantity field

let targetInput = null;
let freshEntry = true; // true until the first digit is tapped, so the
                        // initial "0" gets replaced instead of becoming "00"

function renderValue() {
  const currentValue = targetInput ? targetInput.value : '0';
  $('numpad-value').textContent = currentValue;
  $('amount-numpad-value').textContent = currentValue;
}

function notifyInputChange() {
  if (!targetInput) return;
  targetInput.dispatchEvent(new Event('input', { bubbles: true }));
}

function pressDigit(d) {
  if (!targetInput) return;
  const current = freshEntry ? '' : targetInput.value;
  freshEntry = false;
  const next = (current + d).replace(/^0+(?=\d)/, ''); // drop leading zeros
  if (next.length > MAX_DIGITS) return;
  targetInput.value = next === '' ? '0' : next;
  renderValue();
  notifyInputChange();
}

function pressBackspace() {
  if (!targetInput) return;
  freshEntry = false;
  const next = targetInput.value.slice(0, -1);
  targetInput.value = next === '' ? '0' : next;
  renderValue();
  notifyInputChange();
}

function pressClear() {
  if (!targetInput) return;
  targetInput.value = '0';
  freshEntry = true;
  renderValue();
  notifyInputChange();
}

function finalizeInputValue() {
  if (!targetInput) return;
  const stepValue = Number(targetInput.step || 1);
  const isDecimalInput = Number.isFinite(stepValue) && stepValue < 1;

  if (isDecimalInput) {
    const normalized = Number(targetInput.value);
    targetInput.value = Number.isFinite(normalized) ? String(normalized) : '';
  } else {
    targetInput.value = sanitizeInteger(targetInput.value, 0);
  }

  targetInput.dispatchEvent(new Event('input', { bubbles: true }));
  targetInput.dispatchEvent(new Event('blur', { bubbles: true }));
}

export function closeNumpad() {
  if (targetInput) {
    finalizeInputValue();
  }
  targetInput = null;
  $('numpad-overlay').classList.remove('show');
  $('amount-numpad-overlay').classList.remove('show');
}

export function isNumpadOpen() {
  return $('numpad-overlay').classList.contains('show') || $('amount-numpad-overlay').classList.contains('show');
}

export function openNumpad(inputEl, { title = 'Enter quantity' } = {}) {
  targetInput = inputEl;
  freshEntry = true;
  $('numpad-title').textContent = title;
  renderValue();
  $('numpad-overlay').classList.add('show');
  $('amount-numpad-overlay').classList.remove('show');
}

export function openAmountNumpad(inputEl, { title = 'Enter amount' } = {}) {
  targetInput = inputEl;
  freshEntry = true;
  $('amount-numpad-title').textContent = title;
  renderValue();
  $('amount-numpad-overlay').classList.add('show');
  $('numpad-overlay').classList.remove('show');
}

// Wires all numpad buttons once at startup.
export function initNumpad() {
  $('numpad-overlay').addEventListener('mousedown', e => {
    if (e.target === $('numpad-overlay')) closeNumpad(); // tap outside closes
  });
  $('amount-numpad-overlay').addEventListener('mousedown', e => {
    if (e.target === $('amount-numpad-overlay')) closeNumpad(); // tap outside closes
  });

  document.querySelectorAll('.numpad-key[data-digit]').forEach(btn => {
    btn.addEventListener('click', () => pressDigit(btn.dataset.digit));
  });
  $('numpad-backspace').addEventListener('click', pressBackspace);
  $('numpad-clear').addEventListener('click', pressClear);
  $('numpad-done').addEventListener('click', closeNumpad);
  $('amount-numpad-backspace').addEventListener('click', pressBackspace);
  $('amount-numpad-clear').addEventListener('click', pressClear);
  $('amount-numpad-done').addEventListener('click', closeNumpad);
}