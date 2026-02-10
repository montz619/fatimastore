// ...existing code... (showQuantityModal provided by js/cart.js)

// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Select the container where product cards will be rendered
    const hotDealsContainer = document.getElementById('hot-deals-container');
    const quickViewModal = document.getElementById('quick-view-modal');
    const modalContent = document.getElementById('modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    // Elements for the new click-based dropdown menu
    const categoriesToggle = document.getElementById('categories-toggle');
    const categoriesMenu = document.getElementById('categories-menu');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    let allProducts = [];
    
    // Currency formatter for Philippine Peso
    function formatCurrency(value) {
        try {
            return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
        } catch (e) {
            // Fallback
            return '₱' + Number(value).toFixed(2);
        }
    }

    /* --- Global search: attaches to any input.search-input and shows results in a modal --- */
    async function fetchAllProductsForSearch() {
        try {
            const dataFiles = ['./data/food.json', './data/school-supplies.json', './data/general-merchandise.json', './data/bbq.json'];
            const responses = await Promise.all(dataFiles.map(path => fetch(path).catch(() => null)));
            const jsonPromises = responses.map(r => (r && r.ok) ? r.json() : []);
            const arrays = await Promise.all(jsonPromises);
            // Merge on-disk data with any runtime-registered products (e.g., curated brand modal items)
            const disk = arrays.flat();
            const registered = Array.isArray(window.__productSearchRegistry) ? window.__productSearchRegistry : [];
            // Merge and de-duplicate by id (if present) or by lowercase name
            const merged = [];
            const seen = new Set();
            function uniqueKey(p) {
                if (!p) return null;
                if (p.id) return `id:${String(p.id)}`;
                if (p.name) return `name:${String(p.name).toLowerCase()}`;
                return null;
            }
            for (const p of disk.concat(registered)) {
                const k = uniqueKey(p);
                if (!k) {
                    merged.push(p);
                } else if (!seen.has(k)) {
                    seen.add(k);
                    merged.push(p);
                }
            }
            return merged;
        } catch (e) {
            console.error('Search: failed to load product data', e);
            return [];
        }
    }

    // Allow other scripts to register products at runtime so they become searchable immediately.
    // Usage: window.registerProductsForSearch(arrayOfProductObjects)
    // Each product should include at least a `name` and optional `id`, `brand`, `tags`, `price`, `stock`, etc.
    // UUID helper: use crypto.randomUUID when available, otherwise fallback to a v4 generator
    function generateUUID() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
        // fallback v4 implementation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    window.generateUUID = generateUUID;

    window.registerProductsForSearch = function (items) {
        try {
            if (!Array.isArray(items)) return;
            if (!Array.isArray(window.__productSearchRegistry)) window.__productSearchRegistry = [];
            // simple dedupe by id or lowercase name
            // Remove products that belong to temporarily disabled categories or brand tiles
            try {
                const disabledEls = Array.from(document.querySelectorAll('.disabled-tile'));
                const disabledCategories = new Set(disabledEls.map(el => (el.dataset && el.dataset.category) ? String(el.dataset.category).toLowerCase() : null).filter(Boolean));
                const disabledTitles = disabledEls.map(el => (el.dataset && el.dataset.title) ? String(el.dataset.title) : null).filter(Boolean);
                // slugify helper: normalize titles to simple path-like tokens
                const slugify = s => String(s || '').toLowerCase().replace(/\s+/g,'-').replace(/&/g,'and').replace(/[^a-z0-9\-]/g,'');
                const disabledSlugs = new Set(disabledTitles.map(slugify));

                function matchesDisabledBrand(p) {
                    if (!p) return false;
                    // check brand/name
                    const name = p.name ? String(p.name).toLowerCase() : '';
                    const brand = p.brand ? String(p.brand).toLowerCase() : '';
                    const img = p.image_url ? String(p.image_url).toLowerCase() : '';
                    const tags = Array.isArray(p.tags) ? p.tags.join(' ').toLowerCase() : '';
                    for (const s of disabledSlugs) {
                        if (!s) continue;
                        if (name.includes(s) || brand.includes(s) || img.includes(s) || tags.includes(s)) return true;
                    }
                    return false;
                }

                // filter merged list
                const filtered = merged.filter(p => {
                    try {
                        if (!p) return false;
                        if (p.category && disabledCategories.has(String(p.category).toLowerCase())) return false;
                        if (matchesDisabledBrand(p)) return false;
                        return true;
                    } catch (e) { return true; }
                });
                return filtered;
            } catch (e) {
                // If DOM scanning fails, return merged as-is
                return merged;
            }
            const existing = window.__productSearchRegistry;
            const seen = new Set(existing.map(p => (p && p.id) ? `id:${p.id}` : (p && p.name) ? `name:${String(p.name).toLowerCase()}` : null));
            for (const it of items) {
                if (!it) continue;
                // assign a UUID if item lacks an id (guarantees uniqueness across runtime and persisted items)
                if (!it.id) it.id = generateUUID();
                const key = (it.id) ? `id:${it.id}` : (it.name ? `name:${String(it.name).toLowerCase()}` : null);
                if (key && seen.has(key)) continue;
                if (key) seen.add(key);
                existing.push(it);
            }
            // keep registry sane (limit growth) — keep last 500 entries
            if (existing.length > 500) window.__productSearchRegistry = existing.slice(-500);
        } catch (e) {
            console.error('registerProductsForSearch failed', e);
        }
    };

    function ensureSearchModal() {
        let modal = document.getElementById('search-results-modal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.id = 'search-results-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 hidden';
    // keep search modal below the quantity modal (quantity modal uses 12200)
    modal.style.zIndex = '11100';
        modal.innerHTML = `
            <div class="bg-white w-full max-w-xl mt-12 rounded-2xl p-4 shadow-lg">
                <div class="flex items-center justify-between mb-3">
                    <h3 class="text-lg font-semibold">Search results</h3>
                    <button id="search-modal-close" aria-label="Close" class="text-gray-600 hover:text-gray-900">✕</button>
                </div>
                <div id="search-results-container" class="space-y-3 max-h-[60vh] overflow-auto"></div>
            </div>
        `;
        document.body.appendChild(modal);
        const closeBtn = modal.querySelector('#search-modal-close');
        function clearSearchInputs() {
            try {
                const inputs = Array.from(document.querySelectorAll('.search-input'));
                inputs.forEach(i => { i.value = ''; i.blur && i.blur(); });
            } catch (e) { /* ignore */ }
        }
        closeBtn && closeBtn.addEventListener('click', () => { modal.classList.add('hidden'); clearSearchInputs(); });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) { modal.classList.add('hidden'); clearSearchInputs(); }
        });
        return modal;
    }

    async function performSearch(query) {
        if (!query || !query.trim()) return;
        const q = query.trim().toLowerCase();
        const items = await fetchAllProductsForSearch();
        const matches = items.filter(p => {
            if (!p) return false;
            const hay = `${p.name || ''} ${p.brand || ''} ${Array.isArray(p.tags) ? p.tags.join(' ') : ''}`.toLowerCase();
            return hay.includes(q);
        }).map(p => ({ ...p, discountPercent: p.originalPrice && p.originalPrice > p.price ? Math.round(((Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice)) * 100) : 0 }));

        const modal = ensureSearchModal();
        const resultsEl = modal.querySelector('#search-results-container');
        resultsEl.innerHTML = '';
        if (!matches.length) {
            resultsEl.innerHTML = '<p class="text-gray-600">No results found.</p>';
        } else {
            // render compact rows (DOM-built for safety)
            matches.slice(0, 40).forEach(product => {
                const row = document.createElement('div');
                row.className = 'flex items-center gap-3 p-2 rounded hover:bg-gray-50';

                const img = document.createElement('img');
                img.className = 'w-14 h-14 object-cover rounded-md';
                img.loading = 'lazy';
                img.alt = product.name || '';
                // Prefer WebP when available, otherwise use the supplied image_url.
                img.src = product.image_webp || product.image_url || '';

                const meta = document.createElement('div');
                meta.className = 'flex-1 min-w-0';

                const title = document.createElement('div');
                title.className = 'font-semibold text-sm truncate';
                title.textContent = product.name || '';

                const sub = document.createElement('div');
                sub.className = 'text-xs text-gray-500 truncate';
                sub.textContent = `${product.brand || ''}${product.subcategory ? ' · ' + product.subcategory : ''}`;

                meta.appendChild(title);
                meta.appendChild(sub);

                const right = document.createElement('div');
                right.className = 'text-right';

                if (product.discountPercent) {
                    const priceEl = document.createElement('div');
                    priceEl.className = 'text-red-500 font-bold text-sm';
                    priceEl.textContent = formatCurrency(product.price);

                    const origEl = document.createElement('div');
                    origEl.className = 'text-xs text-gray-500 line-through';
                    origEl.textContent = formatCurrency(product.originalPrice);

                    right.appendChild(priceEl);
                    right.appendChild(origEl);
                } else {
                    const priceEl = document.createElement('div');
                    priceEl.className = 'text-sm font-bold';
                    priceEl.textContent = formatCurrency(product.price);
                    right.appendChild(priceEl);
                }

                const addBtn = document.createElement('button');
                addBtn.className = 'ml-2 mt-2 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm search-add-btn';
                addBtn.textContent = 'Add to cart';
                // disable if out of stock
                if (product && (Number(product.stock || 0) <= 0)) {
                    addBtn.disabled = true;
                    addBtn.setAttribute('aria-disabled', 'true');
                    addBtn.classList.add('opacity-50', 'cursor-not-allowed');
                    addBtn.textContent = 'Out of stock';
                }
                right.appendChild(addBtn);

                row.appendChild(img);
                row.appendChild(meta);
                row.appendChild(right);

                // wire add button only when in stock
                if (!addBtn.disabled) {
                            addBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (window.showQuantityModal) {
                            window.showQuantityModal(product, 1, (qty) => { addToCart(product, qty); try { window.dispatchEvent(new Event('cart-updated')); } catch (e) {} if (window.notify && window.notify.success) window.notify.success(`Added ${qty} x ${product.name} to cart.`, { undo: () => { /* noop undo for now */ } }); });
                        } else {
                            const qtyStr = prompt(`Enter quantity for "${product.name}" (available: ${product.stock}):`, '1');
                            if (qtyStr === null) return; const qty = parseInt(qtyStr, 10); if (!qty || qty <= 0) { if (window.notify && window.notify.error) window.notify.error('Please enter a valid quantity.'); else alert('Please enter a valid quantity.'); return; } if (product.stock && qty > product.stock) { if (window.notify && window.notify.error) window.notify.error('Requested quantity exceeds available stock.'); else alert('Requested quantity exceeds available stock.'); return; } addToCart(product, qty); try { window.dispatchEvent(new Event('cart-updated')); } catch (e) {} if (window.notify && window.notify.success) window.notify.success(`Added ${qty} x ${product.name} to cart.`);
                        }
                    });
                }

                resultsEl.appendChild(row);
            });
        }
        modal.classList.remove('hidden');
    }

    function wireSearchInputs() {
        const inputs = Array.from(document.querySelectorAll('.search-input'));
        inputs.forEach(inp => {
            inp.setAttribute('autocomplete', 'off');
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    performSearch(inp.value);
                }
            });
            // wire nearby Search button if present
            const wrapper = inp.closest('div');
            if (wrapper) {
                const btn = wrapper.querySelector('button');
                if (btn) btn.addEventListener('click', (ev) => { ev.preventDefault(); performSearch(inp.value); });
            }
        });
    }

    // wire on DOM ready (also call once more at end)
    wireSearchInputs();

    /**
     * Toggles the visibility of the categories menu.
     */
    function toggleCategoriesMenu() {
    if (categoriesMenu) categoriesMenu.classList.toggle('hidden');
    }

    /**
     * Closes the categories menu.
     */
    function closeCategoriesMenu() {
        categoriesMenu.classList.add('hidden');
    }

    // Event listener for toggling the menu on click
    if (categoriesToggle) {
        categoriesToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Prevents the window click listener from immediately closing the menu
            toggleCategoriesMenu();
        });
    }

    // Global click listener to close the menu if the user clicks anywhere else
    window.addEventListener('click', (e) => {
        try {
            if (categoriesMenu && categoriesToggle) {
                if (!categoriesMenu.contains(e.target) && !categoriesToggle.contains(e.target)) {
                    closeCategoriesMenu();
                }
            }
        } catch (err) {
            // Defensive: ignore if elements not present
        }
    });

    // Mobile menu toggle
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !mobileMenu.classList.contains('hidden');
            if (isOpen) {
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            } else {
                mobileMenu.classList.remove('hidden');
                mobileMenuBtn.setAttribute('aria-expanded', 'true');
            }
        });

        // Close mobile menu when clicking outside
        window.addEventListener('click', (e) => {
            try {
                if (!mobileMenu.contains(e.target) && e.target !== mobileMenuBtn) {
                    mobileMenu.classList.add('hidden');
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                }
            } catch (err) { /* ignore */ }
        });
    }

    /**
     * Fetches product data from the JSON file and renders the cards on the page.
     */
    async function fetchProducts() {
        try {
            // Aggregate known category data files to compute top hot items across the site
            const dataFiles = ['./data/food.json', './data/school-supplies.json'];
            const responses = await Promise.all(dataFiles.map(path => fetch(path).catch(e => null)));
            const jsonPromises = responses.map(r => (r && r.ok) ? r.json() : []);
            const arrays = await Promise.all(jsonPromises);
            // flatten and normalize
            allProducts = arrays.flat();

            // Select top 5 marked-down items by discount percentage for the homepage Hot Deals
            const hotItems = allProducts
                .filter(p => p && p.originalPrice && Number(p.originalPrice) > Number(p.price))
                .map(p => ({
                    ...p,
                    discountPercent: Math.round(((Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice)) * 100)
                }))
                .sort((a, b) => b.discountPercent - a.discountPercent)
                .slice(0, 5);

            renderProducts(hotItems);
        } catch (error) {
            console.error('There was a problem fetching the products:', error);
            hotDealsContainer.innerHTML = '<p class="text-center text-red-500">Failed to load products. Please try again later.</p>';
        }
    }

    /**
     * Renders a list of products to the DOM.
     * @param {Array} productsToRender - The array of products to display.
     */
    function renderProducts(productsToRender) {
        hotDealsContainer.innerHTML = '';
        productsToRender.forEach(product => {
            const productCard = document.createElement('div');
            // Added a data attribute to easily get the product ID
            // make card relative so discount badge can position absolutely
            productCard.className = 'product-card relative bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-xl transition-shadow duration-300 cursor-pointer';
            productCard.setAttribute('data-id', product.id);
            productCard.setAttribute('data-category', product.category);
            
            // Construct the product card using DOM APIs (safer than innerHTML)
            if (product.discountPercent) {
                const badge = document.createElement('div');
                badge.className = 'absolute top-4 right-4 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full';
                badge.textContent = `-${product.discountPercent}%`;
                productCard.appendChild(badge);
            }

            const imgEl = document.createElement('img');
            imgEl.className = 'rounded-2xl mb-4 w-full h-48 object-cover';
            imgEl.loading = 'lazy';
            imgEl.alt = product.name || '';
            imgEl.src = product.image_webp || product.image_url || '';
            productCard.appendChild(imgEl);

            const h3 = document.createElement('h3');
            h3.className = 'font-semibold text-lg mb-2';
            h3.textContent = product.name || '';
            productCard.appendChild(h3);

            if (product.originalPrice) {
                const orig = document.createElement('p');
                orig.className = 'text-gray-500 line-through';
                orig.textContent = formatCurrency(product.originalPrice);
                productCard.appendChild(orig);
            }

            const priceP = document.createElement('p');
            priceP.className = 'text-red-500 text-xl font-bold';
            priceP.textContent = formatCurrency(product.price);
            productCard.appendChild(priceP);

            const stockP = document.createElement('p');
            stockP.className = 'text-sm text-gray-500 mt-2';
            const stockSpan = document.createElement('span');
            stockSpan.id = `stock-${product.id}`;
            stockSpan.className = 'font-bold text-gray-800';
            stockSpan.textContent = String(product.stock ?? '0');
            stockP.appendChild(document.createTextNode('Stock: '));
            stockP.appendChild(stockSpan);
            stockP.appendChild(document.createTextNode(' left'));
            productCard.appendChild(stockP);

            const cardAddBtn = document.createElement('button');
            cardAddBtn.className = 'mt-4 bg-indigo-600 text-white px-4 py-2 rounded-full add-to-cart-btn';
            cardAddBtn.textContent = 'Add to cart';
            if (Number(product.stock || 0) <= 0) {
                cardAddBtn.disabled = true;
                cardAddBtn.setAttribute('aria-disabled', 'true');
                cardAddBtn.classList.add('opacity-50', 'cursor-not-allowed');
                cardAddBtn.textContent = 'Out of stock';
            }
            productCard.appendChild(cardAddBtn);
            hotDealsContainer.appendChild(productCard);

            // Add a click event listener to open the modal
            productCard.addEventListener('click', () => showProductModal(product));

            // Wire up Add to cart button
            const cardBtn = productCard.querySelector('.add-to-cart-btn');
            if (cardBtn && !cardBtn.disabled) {
                cardBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // prevent opening quick view
                    if (window.showQuantityModal) {
                        window.showQuantityModal(product, 1, (qty) => {
                            addToCart(product, qty);
                            try { window.dispatchEvent(new Event('cart-updated')); } catch (e) {}
                            if (window.notify && window.notify.success) window.notify.success(`Added ${qty} x ${product.name} to cart.`);
                        });
                    } else {
                        const qtyStr = prompt(`Enter quantity for "${product.name}" (available: ${product.stock}):`, '1');
                        if (qtyStr === null) return; // cancelled
                        const qty = parseInt(qtyStr, 10);
                        if (!qty || qty <= 0) { if (window.notify && window.notify.error) window.notify.error('Please enter a valid quantity.'); else alert('Please enter a valid quantity.'); return; }
                        if (product.stock && qty > product.stock) { if (window.notify && window.notify.error) window.notify.error('Requested quantity exceeds available stock.'); else alert('Requested quantity exceeds available stock.'); return; }
                        addToCart(product, qty);
                        try { window.dispatchEvent(new Event('cart-updated')); } catch (e) {}
                        if (window.notify && window.notify.success) window.notify.success(`Added ${qty} x ${product.name} to cart.`);
                    }
                });
            }
        });
    }

    // --- Simple cart helpers using localStorage ---
    function getCart() {
        try {
            const raw = localStorage.getItem('cart');
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Normalize existing cart entries on startup:
    // - assign UUIDs to any items missing an id
    // - merge duplicates detected by same name+category into one line (summing quantity)
    function normalizeCart() {
        let cart = getCart();
        let map = new Map();
        for (let item of cart) {
            // ensure id
            if (!item.id) {
                try {
                    item.id = (window.generateUUID ? window.generateUUID() : ('gen-' + Date.now() + '-' + Math.random().toString(36).slice(2,8)));
                } catch (e) {
                    item.id = ('gen-' + Date.now() + '-' + Math.random().toString(36).slice(2,8));
                }
            }
            const key = `${(item.name||'').toString().trim().toLowerCase()}|${(item.category||'').toString().trim().toLowerCase()}`;
            if (map.has(key)) {
                const existing = map.get(key);
                existing.quantity = (existing.quantity || 0) + (item.quantity || 0);
            } else {
                // clone to avoid mutating original objects directly
                map.set(key, { id: item.id, name: item.name, price: item.price, quantity: item.quantity || 0, category: item.category });
            }
        }
        const merged = Array.from(map.values());
        // If merged result differs from previous cart, persist and emit update
        try {
            const old = JSON.stringify(cart || []);
            const neu = JSON.stringify(merged || []);
            if (old !== neu) {
                saveCart(merged);
                try { window.dispatchEvent(new Event('cart-updated')); } catch (e) { /* ignore */ }
            }
        } catch (e) {
            console.error('Failed to normalize cart', e);
        }
    }

    // Run normalization immediately so any legacy carts are fixed
    try { normalizeCart(); } catch (e) { console.error('Cart normalization failed', e); }

    function addToCart(product, quantity) {
        const cart = getCart();
        // Guard: only block when product.stock is explicitly present and indicates zero/insufficient
        try {
            const hasStockField = product && (product.stock !== undefined && product.stock !== null);
            if (hasStockField && Number(product.stock) <= 0) {
                if (window.notify && window.notify.error) window.notify.error('Item is out of stock.'); else alert('Item is out of stock.');
                return;
            }
            if (hasStockField && quantity && Number(quantity) > Number(product.stock)) {
                if (window.notify && window.notify.error) window.notify.error('Requested quantity exceeds available stock.'); else alert('Requested quantity exceeds available stock.');
                return;
            }
        } catch (e) { /* ignore parsing errors */ }
        // Ensure product has a unique id. If missing, generate a UUID and assign it.
        try {
            if (!product.id) product.id = (window.generateUUID ? window.generateUUID() : ('gen-' + Date.now() + '-' + Math.random().toString(36).slice(2,8)));
        } catch (e) {
            if (!product.id) product.id = ('gen-' + Date.now() + '-' + Math.random().toString(36).slice(2,8));
        }
        const pid = String(product.id);
        // find existing cart entry by id
        let existing = cart.find(item => item.id && String(item.id) === pid);
        if (existing) {
            existing.quantity = (existing.quantity || 0) + quantity;
        } else {
            cart.push({ id: pid, name: product.name, price: product.price, quantity, category: product.category });
        }
        saveCart(cart);
    // notify other parts of the app to update badges/UI
    try { window.dispatchEvent(new Event('cart-updated')); } catch (e) { /* ignore */ }
    }

    // Expose cart helpers to other scripts
    window.getCart = getCart;
    window.saveCart = saveCart;
    window.addToCart = addToCart;

    /**
     * Shows a modal with the detailed product information.
     * @param {Object} product - The product object to display.
     */
    function showProductModal(product) {
        // clear existing content
        modalContent.innerHTML = '';
        const img = document.createElement('img');
        img.className = 'rounded-2xl mb-6 w-full h-64 object-cover';
        img.loading = 'lazy';
        img.alt = product.name || '';
        img.src = product.image_webp || product.image_url || '';

        const title = document.createElement('h3');
        title.className = 'text-2xl font-bold mb-2';
        title.textContent = product.name || '';

        const desc = document.createElement('p');
        desc.className = 'text-gray-700 mb-4';
        desc.textContent = product.description || 'No description available.';

        modalContent.appendChild(img);
        modalContent.appendChild(title);
        modalContent.appendChild(desc);

        if (product.originalPrice) {
            const orig = document.createElement('p');
            orig.className = 'text-gray-500 line-through text-lg';
            orig.textContent = formatCurrency(product.originalPrice);
            modalContent.appendChild(orig);
        }

        const price = document.createElement('p');
        price.className = 'text-red-500 text-3xl font-bold mb-4';
        price.textContent = formatCurrency(product.price);
        modalContent.appendChild(price);

        const stock = document.createElement('p');
        stock.className = 'text-sm text-gray-500 mt-2';
        const stockSpan = document.createElement('span');
        stockSpan.className = 'font-bold text-gray-800';
        stockSpan.textContent = String(product.stock ?? '0');
        stock.appendChild(document.createTextNode('Stock: '));
        stock.appendChild(stockSpan);
        stock.appendChild(document.createTextNode(' left'));
        modalContent.appendChild(stock);

        // Open the modal
        quickViewModal.classList.remove('hidden');
        quickViewModal.classList.add('modal-open');
        // push a history state so the back button closes the quick view instead of leaving the page
        try {
            history.pushState({ modal: 'quickview' }, '');
            const popHandler = function () {
                try { closeProductModal(true); } catch (e) { /* ignore */ }
                window.removeEventListener('popstate', popHandler);
            };
            window.addEventListener('popstate', popHandler);
            quickViewModal._popstateHandler = popHandler;
        } catch (e) { /* ignore */ }

    // Modal is view-only; no ordering from this site. Close on outside click or close button.
    }

    /**
     * Closes the product modal.
     */
    function closeProductModal() {
        const fromPop = arguments[0] === true;
        quickViewModal.classList.add('modal-closing');
        quickViewModal.addEventListener('animationend', () => {
            quickViewModal.classList.remove('modal-closing', 'modal-open');
            quickViewModal.classList.add('hidden');
            // cleanup popstate handler and, if close initiated by UI, go back in history
            try {
                if (quickViewModal && quickViewModal._popstateHandler) {
                    window.removeEventListener('popstate', quickViewModal._popstateHandler);
                    delete quickViewModal._popstateHandler;
                }
                if (!fromPop) {
                    try { history.back(); } catch (e) { /* ignore */ }
                }
            } catch (e) { /* ignore */ }
        }, { once: true });
    }

    // Event listener for closing the modal
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeProductModal);
    }
    if (quickViewModal) {
        quickViewModal.addEventListener('click', (e) => {
            if (e.target.id === 'quick-view-modal') {
                closeProductModal();
            }
        });
    }

    // Event listeners for category filtering - support data-filter or data-open-category (mobile menu)
    const categorySelector = '[data-filter], [data-open-category]';
    const categoryLinks = Array.from(document.querySelectorAll(categorySelector));
    categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // If the link has a real href (points to another page), allow navigation
            const href = link.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript:')) {
                // allow navigation to another page
                return;
            }

            e.preventDefault();
            // read either dataset.filter or dataset.openCategory
            const filter = link.dataset.filter || link.dataset.openCategory;
            if (!filter) return;
            if (filter === 'all') {
                renderProducts(allProducts);
            } else {
                const filteredProducts = allProducts.filter(product => product.category === filter);
                renderProducts(filteredProducts);
            }
            closeCategoriesMenu(); // Close the menu after a category is selected
        });
    });

    // Call the function to fetch and render products only on pages that have the hot-deals container
    if (hotDealsContainer) {
        fetchProducts();
    }
});
