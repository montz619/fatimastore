// cart.js - updates cart badge and provides helper UI interactions
(function(){
    function getCart() {
        try { return JSON.parse(localStorage.getItem('cart') || '[]'); } catch (e) { return []; }
    }

    function updateBadge() {
        // support multiple badge selectors: desktop badges (#cart-badge), mobile badge (#cart-badge-mobile) and .cart-badge
        const badgeEls = document.querySelectorAll('#cart-badge, #cart-badge-mobile, .cart-badge');
        const cart = getCart();
        const totalItems = cart.reduce((s, it) => s + (it.quantity || 0), 0);
        badgeEls.forEach(b => {
            if (totalItems > 0) {
                b.textContent = totalItems;
                b.classList.remove('hidden');
            } else {
                b.classList.add('hidden');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        updateBadge();
    });

    // Update when cart changes
    window.addEventListener('storage', (e) => {
        if (e.key === 'cart') updateBadge();
    });

    // Custom event to notify same-window updates
    window.addEventListener('cart-updated', () => updateBadge());

    // Expose for manual calls
    window.updateCartBadge = updateBadge;
})();

// Quantity modal helper (exposed)
(function(){
    function ensureModal() {
        let modal = document.getElementById('quantity-modal');
        if (modal) return modal;
    modal = document.createElement('div');
    modal.id = 'quantity-modal';
    // ensure this modal appears above page-level overlays/modals
    modal.className = 'fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 hidden';
    // Make sure the quantity modal stacks above other overlays (search modal, etc.)
    modal.style.zIndex = '12200';
        modal.innerHTML = `
                <div class="quantity-modal-inner bg-white rounded-2xl p-6 w-full max-w-sm">
                <h3 id="qm-title" class="text-lg font-semibold mb-2"></h3>
                <div class="flex items-center gap-2 mb-4">
                    <button id="qm-decr" class="px-3 py-1 bg-gray-200 rounded">-</button>
                    <input id="qm-input" type="number" min="1" value="1" class="w-20 text-center border rounded" />
                    <button id="qm-incr" class="px-3 py-1 bg-gray-200 rounded">+</button>
                    <div id="qm-stock" class="text-sm text-gray-500 ml-auto"></div>
                </div>
                <div class="flex justify-end gap-2">
                    <button id="qm-cancel" class="px-4 py-2 rounded bg-gray-200">Cancel</button>
                    <button id="qm-ok" class="px-4 py-2 rounded bg-indigo-600 text-white">Add</button>
                </div>
            </div>
        `;
    document.body.appendChild(modal);
    // ensure inner dialog has its own stacking context above the overlay
    const inner = modal.querySelector('div');
    if (inner) inner.style.zIndex = '12300';
        return modal;
    }

    function showQuantityModal(product, defaultQty, cb) {
        const modal = ensureModal();
        const title = modal.querySelector('#qm-title');
        const input = modal.querySelector('#qm-input');
        const incr = modal.querySelector('#qm-incr');
        const decr = modal.querySelector('#qm-decr');
        const ok = modal.querySelector('#qm-ok');
        const cancel = modal.querySelector('#qm-cancel');
        const stock = modal.querySelector('#qm-stock');
        title.textContent = product.name || 'Item';
        input.value = defaultQty || 1;
        input.min = 1;
        stock.textContent = product.stock != null ? `${product.stock} available` : '';
        function close() { modal.classList.remove('quantity-modal-open'); setTimeout(() => modal.classList.add('hidden'), 220); }
        function close() { 
            modal.classList.remove('quantity-modal-open'); 
            // remove key handler
            if (modal._qm_keyHandler) { modal.removeEventListener('keydown', modal._qm_keyHandler); delete modal._qm_keyHandler; }
            setTimeout(() => modal.classList.add('hidden'), 220); 
        }
        function open() { 
            // bring to front - ensure it stays above other overlays (search modal ~=11100)
            modal.style.zIndex = '12200';
            const inner = modal.querySelector('div'); if (inner) inner.style.zIndex = '12300';
            modal.classList.remove('hidden');
            // add class to trigger CSS transition
            setTimeout(() => modal.classList.add('quantity-modal-open'), 10);
            // basic focus trap: focus the input and listen for Tab
            const focusable = Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter(el => !el.disabled && el.offsetParent !== null);
            let firstFocusable = focusable[0];
            let lastFocusable = focusable[focusable.length - 1];
            if (input) { input.focus(); input.select(); }
            function keyHandler(e) {
                if (e.key === 'Escape') { e.preventDefault(); close(); }
                if (e.key === 'Tab') {
                    if (focusable.length === 0) { e.preventDefault(); return; }
                    if (e.shiftKey) { // shift + tab
                        if (document.activeElement === firstFocusable) { e.preventDefault(); lastFocusable.focus(); }
                    } else {
                        if (document.activeElement === lastFocusable) { e.preventDefault(); firstFocusable.focus(); }
                    }
                }
            }
            modal.addEventListener('keydown', keyHandler);
            // store handler so we can remove later
            modal._qm_keyHandler = keyHandler;
        }
        decr.onclick = () => { input.value = Math.max(1, Number(input.value) - 1); };
        incr.onclick = () => { input.value = Math.max(1, Number(input.value) + 1); };
        cancel.onclick = () => { close(); }; 
        ok.onclick = () => {
            const qty = parseInt(input.value || '0', 10);
            if (!qty || qty <= 0) { alert('Enter a valid quantity'); return; }
            if (product.stock && qty > product.stock) { alert('Quantity exceeds stock'); return; }
            close();
            if (typeof cb === 'function') cb(qty);
        };
        open();
    }

    window.showQuantityModal = showQuantityModal;
})();
