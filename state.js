// All app state lives here as plain in-memory arrays. No database, no normalization —
// a transaction stores its own copy of product details directly on each line item.
import { groceryItems } from './data.js';

// `cart` is the live order being built right now.
// `transactions` keeps a permanent history of completed sales for reports.
export const cart = [];          // current sale: [{product_id, product_name, product_price, category, quantity, subtotal}]
export const transactions = [];  // completed sales, flat array
let txCounter = 1;

// Helper that adds up the current order total.
// The UI calls this whenever it needs to display the running total.
export function cartTotal() {
  return cart.reduce((sum, l) => sum + l.subtotal, 0);
}

// Adds or merges a product line into the active cart.
// This is the bridge between the catalog tile and the cashier's current order.
export function addToCart(productId, quantity) {
  const product = groceryItems.find(p => p.product_id === productId);
  if (!product) return;

  const existing = cart.find(l => l.product_id === productId);
  if (existing) {
    existing.quantity += quantity;
    existing.subtotal = existing.quantity * existing.product_price;
  } else {
    cart.push({
      product_id: product.product_id,
      product_name: product.product_name,
      product_price: product.product_price,
      category: product.category,
      quantity: quantity,
      subtotal: product.product_price * quantity
    });
  }
}

export function removeFromCart(productId) {
  const idx = cart.findIndex(l => l.product_id === productId);
  if (idx !== -1) cart.splice(idx, 1);
}

// Sets a cart line to an exact quantity. Useful for typed input values where
// the user wants the cart quantity to match the number they entered.
export function setCartQuantity(productId, quantity) {
  const product = groceryItems.find(p => p.product_id === productId);
  if (!product) return;

  const nextQty = Math.max(0, Math.floor(quantity));
  const existing = cart.find(l => l.product_id === productId);

  if (nextQty === 0) {
    removeFromCart(productId);
    return;
  }

  if (existing) {
    existing.quantity = nextQty;
    existing.subtotal = existing.quantity * existing.product_price;
  } else {
    cart.push({
      product_id: product.product_id,
      product_name: product.product_name,
      product_price: product.product_price,
      category: product.category,
      quantity: nextQty,
      subtotal: product.product_price * nextQty
    });
  }
}

// Decreases a cart line's quantity by `amount` (default 1). If that brings
// the line to 0 or below, the line is removed entirely. No-op if the
// product isn't in the cart.
export function decrementCartItem(productId, amount = 1) {
  const line = cart.find(l => l.product_id === productId);
  if (!line) return;

  line.quantity -= amount;
  if (line.quantity <= 0) {
    removeFromCart(productId);
  } else {
    line.subtotal = line.quantity * line.product_price;
  }
}

export function clearCart() {
  cart.length = 0;
}

// Checkout takes a snapshot of the current cart and turns it into a finalized receipt record.
// After that, the cart is cleared so the next sale starts with a clean slate.
export function checkoutTransaction(amountPaid) {
  const total = cartTotal();
  if (amountPaid < total) return null;

  const now = new Date();
  const transaction = {
    transaction_id: 'TX' + String(txCounter++).padStart(4, '0'),
    date: now.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }),
    items: cart.map(l => ({
      product_id: l.product_id,
      product_name: l.product_name,
      product_price: l.product_price,
      category: l.category,
      quantity: l.quantity,
      subtotal: l.subtotal
    })),
    total_amount: total,
    amount_paid: amountPaid,
    change: amountPaid - total
  };

  transactions.push(transaction);
  clearCart();
  return transaction;
}

export function totalSales() {
  return transactions.reduce((s, t) => s + t.total_amount, 0);
}

// Most purchased product — tally quantity across all transaction items.
export function bestSeller() {
  const tally = {};
  transactions.forEach(t => t.items.forEach(i => {
    if (!tally[i.product_id]) tally[i.product_id] = { name: i.product_name, qty: 0 };
    tally[i.product_id].qty += i.quantity;
  }));
  const ranked = Object.values(tally).sort((a, b) => b.qty - a.qty);
  return ranked[0] || null;
}