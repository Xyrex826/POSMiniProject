// Small shared helpers used across modules.
export const peso = n =>
  '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const $ = id => document.getElementById(id);

export function displayProductName(name = '') {
  return String(name || '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ===================== INPUT VALIDATION =====================
// Keys that would let someone type a negative sign, exponent, or decimal point.
const BLOCKED_INTEGER_KEYS = ['-', '+', 'e', 'E', '.', ','];
const BLOCKED_MONEY_KEYS = ['-', '+', 'e', 'E'];

// Attaches whole-number-only, non-negative validation to a quantity <input>.
// Blocks disallowed keystrokes as they're typed, strips anything that slips
// through (e.g. via paste), and clamps to a minimum on blur so the field
// never ends up empty or below the minimum.
export function enforceIntegerInput(input, { min = 1 } = {}) {
  input.addEventListener('keydown', e => {
    if (BLOCKED_INTEGER_KEYS.includes(e.key)) e.preventDefault();
  });
  input.addEventListener('input', () => {
    const cleaned = input.value.replace(/[^0-9]/g, '');
    if (cleaned !== input.value) input.value = cleaned;
  });
  input.addEventListener('blur', () => {
    input.value = sanitizeInteger(input.value, min);
  });
}

// Attaches non-negative validation to a money <input> (e.g. amount received).
// Decimals are allowed since currency has cents/centavos — only the minus
// sign and scientific-notation characters are blocked.
export function enforceMoneyInput(input) {
  input.addEventListener('keydown', e => {
    if (BLOCKED_MONEY_KEYS.includes(e.key)) e.preventDefault();
  });
  input.addEventListener('input', () => {
    const cleaned = input.value.replace(/[^0-9.]/g, '');
    if (cleaned !== input.value) input.value = cleaned;
  });
}

// Parses a value as a whole number, falling back to `min` if it's missing,
// not a number, negative, or below the minimum. Used both live (on blur)
// and defensively at the moment a value is actually consumed (e.g. "Add").
export function sanitizeInteger(value, min = 1) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n < min) return min;
  return n;
}