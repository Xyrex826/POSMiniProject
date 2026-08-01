import { groceryItems } from './data.js';
import { $, peso, enforceIntegerInput, sanitizeInteger, displayProductName } from './utils.js';
import { setCartQuantity } from './state.js';
import { openNumpad } from './Numpad.js';

const categories = [...new Set(groceryItems.map(p => p.category))].sort();
const CATEGORY_AVATAR_STYLES = {
  Snacks: { bg: 'linear-gradient(135deg, #FFF7ED, #FDE68A)', chip: '#F59E0B', text: '#FFFFFF' },
  Beverages: { bg: 'linear-gradient(135deg, #EFF6FF, #BFDBFE)', chip: '#2563EB', text: '#FFFFFF' },
  'Pantry Staples': { bg: 'linear-gradient(135deg, #F5F3FF, #DDD6FE)', chip: '#7C3AED', text: '#FFFFFF' },
  'Condiments & Spreads': { bg: 'linear-gradient(135deg, #FEF2F2, #FECACA)', chip: '#DC2626', text: '#FFFFFF' },
  'Frozen & Preserved': { bg: 'linear-gradient(135deg, #ECFEFF, #A5F3FC)', chip: '#0891B2', text: '#FFFFFF' },
  Bakery: { bg: 'linear-gradient(135deg, #FFF7ED, #FDBA74)', chip: '#EA580C', text: '#FFFFFF' },
  'Rice & Grains': { bg: 'linear-gradient(135deg, #F0FDF4, #BBF7D0)', chip: '#16A34A', text: '#FFFFFF' },
  'Dairy & Eggs': { bg: 'linear-gradient(135deg, #F8FAFC, #E2E8F0)', chip: '#475569', text: '#FFFFFF' },
  'Fresh Seafood': { bg: 'linear-gradient(135deg, #F0F9FF, #BAE6FD)', chip: '#0284C7', text: '#FFFFFF' },
  'Fresh Meat': { bg: 'linear-gradient(135deg, #FEF2F2, #FBCFE8)', chip: '#BE185D', text: '#FFFFFF' },
  'Fresh Produce': { bg: 'linear-gradient(135deg, #F7FEE7, #BBF7D0)', chip: '#65A30D', text: '#FFFFFF' },
  'Native Delicacies': { bg: 'linear-gradient(135deg, #FFF1F2, #FBCFE8)', chip: '#DB2777', text: '#FFFFFF' }
};

// Resets a single product tile's staged state: quantity back to 0 and any
// selected styling cleared.
export function resetTile(tile) {
  if (!tile) return;
  const input = tile.querySelector('.tile-qty-input');

  if (input) input.value = 0;
  tile.classList.remove('selected');
}

// Fully resets every product tile at once (see resetTile above). Used both
// by "Clear" and by starting a new transaction after checkout, so both
// paths stay in sync.
export function resetAllTiles() {
  document.querySelectorAll('.product-tile').forEach(resetTile);
}

// Renders the "All / Snacks / Beverages / ..." pill row once. Clicking a
// pill re-runs the catalog render with that category applied.
export function renderCategoryFilters(activeCategory, onSelect) {
  const wrap = $('category-filters');
  const pills = ['All', ...categories];
  wrap.innerHTML = pills.map(cat => `
    <button class="cat-pill ${cat === activeCategory ? 'active' : ''}" data-cat="${cat}">${cat}</button>
  `).join('');
  wrap.querySelectorAll('.cat-pill').forEach(btn => {
    btn.addEventListener('click', () => onSelect(btn.dataset.cat));
  });
}

// Renders the product grid as tiles. Each tile has a quantity stepper
// (−, a manually-typeable number field, +) that updates the cart directly.
export function renderCatalog(filter = '', category = 'All', onAdd) {
  const wrap = $('catalog');
  const sectionLabel = $('catalog-section-label');
  wrap.innerHTML = '';
  const f = filter.trim().toLowerCase();
  const sectionTitle = category === 'All' ? 'All Section' : `${category} Section`;
  if (sectionLabel) sectionLabel.textContent = sectionTitle;

  const items = groceryItems.filter(p =>
    p.product_name.toLowerCase().includes(f) &&
    (category === 'All' || p.category === category)
  ).sort((a, b) => a.product_name.localeCompare(b.product_name));

  if (items.length === 0) {
    wrap.innerHTML = `<div class="empty-state">No products match your search.</div>`;
    return;
  }

  items.forEach(p => {
    const tile = document.createElement('div');
    tile.className = 'product-tile';
    const displayName = displayProductName(p.product_name);
    const placeholder = displayName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'PR';
    const avatarStyle = CATEGORY_AVATAR_STYLES[p.category] || { bg: 'linear-gradient(135deg, #eef8f1, #f7f7f8)', chip: '#15803D', text: '#14532D' };
    tile.innerHTML = `
      <div class="tile-image" aria-hidden="true" style="background:${avatarStyle.bg}"><span style="background:${avatarStyle.chip}; color:${avatarStyle.text}">${placeholder}</span></div>
      <div class="tile-info">
        <span class="tile-cat">${p.category}</span>
        <span class="tile-name">${displayName}</span>
        <span class="tile-price">${peso(p.product_price)}</span>
      </div>
      <div class="tile-actions">
        <div class="tile-qty-label">Qty</div>
        <div class="tile-qty-row">
          <input type="number" class="tile-qty-input" id="qty-${p.product_id}"
                 min="0" step="1" inputmode="numeric" value="0"
                 aria-label="Quantity for ${displayName}">
          <button type="button" class="qty-btn qty-dec" data-id="${p.product_id}" aria-label="Decrease quantity">−</button>
          <button type="button" class="qty-btn qty-inc" data-id="${p.product_id}" aria-label="Increase quantity">+</button>
        </div>
      </div>
    `;
    wrap.appendChild(tile);
  });

  // Manual typing: block bad keystrokes, strip anything that slips
  // through, and clamp to a minimum of 0 on blur.
  wrap.querySelectorAll('.tile-qty-input').forEach(inp => {
    enforceIntegerInput(inp, { min: 0 });
    const tile = inp.closest('.product-tile');
    const nameEl = tile?.querySelector('.tile-name');

    inp.addEventListener('blur', () => {
      const id = Number(inp.id.replace('qty-', ''));
      const qty = sanitizeInteger(inp.value, 0);
      setCartQuantity(id, qty);
      onAdd();
    });
    inp.addEventListener('mousedown', e => {
      e.preventDefault(); // stop native focus/on-screen keyboard from also popping up
      openNumpad(inp, { title: nameEl ? nameEl.textContent : 'Enter quantity' });
    });
    inp.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const id = Number(inp.id.replace('qty-', ''));
      const qty = sanitizeInteger(inp.value, 0);
      setCartQuantity(id, qty);
      inp.blur();
      onAdd();
    });
  });

  // Clicking a tile increments the quantity and commits it immediately.
  wrap.querySelectorAll('.product-tile').forEach(tile => {
    tile.addEventListener('click', e => {
      if (e.target.closest('.qty-btn') || e.target.closest('.tile-qty-input')) {
        return;
      }

      const input = tile.querySelector('.tile-qty-input');
      if (!input) return;

      const id = Number(input.id.replace('qty-', ''));
      const current = sanitizeInteger(input.value, 0);
      const nextQty = current + 1;
      input.value = nextQty;
      setCartQuantity(id, nextQty);
      tile.classList.add('selected');
      onAdd();
    });
  });

  // − / + stepper buttons update the cart immediately.
  wrap.querySelectorAll('.qty-dec').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const input = $('qty-' + id);
      const current = sanitizeInteger(input.value, 0);
      if (current === 0) {
        alert('Quantity is already 0.');
        return;
      }
      const nextQty = current - 1;
      input.value = nextQty;
      setCartQuantity(id, nextQty);
      onAdd();
    });
  });
  wrap.querySelectorAll('.qty-inc').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      const input = $('qty-' + id);
      const nextQty = sanitizeInteger(input.value, 0) + 1;
      input.value = nextQty;
      setCartQuantity(id, nextQty);
      onAdd();
    });
  });
}