// brands.js — dynamically render unique brands from per-category data files in /data

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('brands-list');
    if (!container) return;

    try {
        // try to aggregate products from per-category files first
        let products = [];
        const files = ['./data/food.json', './data/school-supplies.json'];
        for (const f of files) {
            try {
                const r = await fetch(f);
                if (!r.ok) continue;
                const chunk = await r.json();
                products = products.concat(chunk);
            } catch (e) {
                // ignore
            }
        }
        if (products.length === 0) {
            console.warn('No products loaded from /data/*.json; ensure category data files exist.');
        }

        // extract unique brands
        const brandsMap = new Map();
        products.forEach(p => {
            const b = (p.brand || 'Unknown').trim();
            if (!brandsMap.has(b)) brandsMap.set(b, p);
        });

        // If the page includes static .brand-tile elements (declared in HTML), preserve them.
        // Otherwise render brand tiles dynamically from the products data.
        const existingTiles = container.querySelectorAll('.brand-tile');
        if (existingTiles.length === 0) {
            container.innerHTML = '';
            brandsMap.forEach((exampleProduct, brand) => {
                const card = document.createElement('div');
                // give it the brand-tile class so behavior below applies
                card.className = 'brand-tile bg-white p-4 rounded-xl shadow-sm flex flex-col items-center justify-center cursor-pointer';
                card.setAttribute('data-category', exampleProduct.category || 'all');
                card.setAttribute('data-title', brand);

                const img = document.createElement('img');
                img.className = 'mb-2 max-h-14 object-contain';
                img.loading = 'lazy';
                img.alt = `${brand} logo`;
                img.src = escapeHTML(exampleProduct.image_url || ('https://placehold.co/100x60/f8f9fa/212529?text=' + encodeURIComponent(brand)));

                const label = document.createElement('div');
                label.className = 'text-sm font-semibold';
                label.textContent = brand;

                card.appendChild(img);
                card.appendChild(label);
                container.appendChild(card);
            });
        } else {
            // ensure existing static tiles have cursor and accessible attributes
            existingTiles.forEach(t => t.classList.add('cursor-pointer'));
        }

        // Enable interactive category tiles and modal
    // re-query tiles so we include either static or dynamically-created brand tiles
    const tiles = document.querySelectorAll('.brand-tile');
        let overlay = document.getElementById('brand-overlay');
        let modal = document.getElementById('brand-modal');
        let modalTitle = document.getElementById('brand-modal-title');
        let modalSub = document.getElementById('brand-modal-sub');
        let modalItems = document.getElementById('brand-items');
        let modalClose = document.getElementById('brand-modal-close');

        // If the modal/overlay isn't present in the current page (e.g., pages other than brands.html),
        // create them dynamically so tiles and nav links still open the centered modal.
        if (!overlay || !modal) {
            overlay = document.createElement('div');
            overlay.id = 'brand-overlay';
            overlay.className = 'brand-overlay';
            overlay.setAttribute('aria-hidden', 'true');

            modal = document.createElement('div');
            modal.id = 'brand-modal';
            modal.className = 'brand-modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');

                // Build modal DOM safely
                const header = document.createElement('div');
                header.className = 'flex items-center justify-between';
                const h2 = document.createElement('h2');
                h2.id = 'brand-modal-title';
                h2.className = 'text-xl font-bold';
                h2.textContent = 'Category';
                const closeBtn = document.createElement('button');
                closeBtn.id = 'brand-modal-close';
                closeBtn.className = 'text-gray-600 hover:text-gray-900';
                closeBtn.textContent = 'Close';
                header.appendChild(h2);
                header.appendChild(closeBtn);

                const sub = document.createElement('p');
                sub.id = 'brand-modal-sub';
                sub.className = 'text-gray-600 text-sm mt-1';
                sub.textContent = 'Showing items';

                const itemsDiv = document.createElement('div');
                itemsDiv.id = 'brand-items';
                itemsDiv.className = 'brand-list mt-4';

                modal.appendChild(header);
                modal.appendChild(sub);
                modal.appendChild(itemsDiv);

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            // re-query the elements we just created
            modalTitle = document.getElementById('brand-modal-title');
            modalSub = document.getElementById('brand-modal-sub');
            modalItems = document.getElementById('brand-items');
            modalClose = document.getElementById('brand-modal-close');
        }

    function formatCurrency(value) {
            try {
                return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
            } catch (e) {
                return '₱' + Number(value).toFixed(2);
            }
        }

        function openModal() {
            overlay.classList.add('open');
            modal.classList.add('open');
            overlay.setAttribute('aria-hidden', 'false');
            // prevent body scroll while modal is open
            document.body.style.overflow = 'hidden';
            // focus modal for accessibility
            setTimeout(() => { modal.focus && modal.focus(); }, 150);
            // push history state so back button can close modal instead of navigating away
            try {
                history.pushState({ modal: 'brand' }, '');
                const popHandler = function () {
                    // when user presses back, close modal (mark as from popstate)
                    try { closeModal(true); } catch (e) { /* ignore */ }
                    window.removeEventListener('popstate', popHandler);
                };
                window.addEventListener('popstate', popHandler);
                // store handler reference to allow cleanup if modal is closed via UI
                overlay._popstateHandler = popHandler;
            } catch (e) {
                // history may not be available in some environments; ignore
            }
        }

        function closeModal() {
            // allow callers to indicate this close was triggered by popstate
            const fromPop = arguments[0] === true;
            modal.classList.remove('open');
            overlay.classList.remove('open');
            overlay.setAttribute('aria-hidden', 'true');
            modalItems.innerHTML = '';
            // restore body scrolling
            document.body.style.overflow = '';
            // cleanup popstate handler and, if closed via UI, pop the history entry we added
            try {
                if (overlay && overlay._popstateHandler) {
                    window.removeEventListener('popstate', overlay._popstateHandler);
                    delete overlay._popstateHandler;
                }
                if (!fromPop) {
                    // we previously pushed a state; go back one step to restore URL/history
                    try { history.back(); } catch (e) { /* ignore */ }
                }
            } catch (e) { /* ignore */ }
        }

        modalClose.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        // Ensure a quick-view modal (same behavior as Hot Deals) exists so brand items can open detailed view
        let quickViewModal = document.getElementById('quick-view-modal');
        let quickModalContent = document.getElementById('modal-content');
        let quickCloseBtn = document.getElementById('close-modal-btn');
        if (!quickViewModal) {
            quickViewModal = document.createElement('div');
            quickViewModal.id = 'quick-view-modal';
            quickViewModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 hidden';
            // build quick view modal DOM
            const inner = document.createElement('div');
            inner.className = 'bg-white rounded-3xl p-8 w-full max-w-md relative';
            const closeBtn = document.createElement('button');
            closeBtn.id = 'close-modal-btn';
            closeBtn.className = 'absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition-colors transform hover:rotate-90 transition-transform duration-300';
            closeBtn.setAttribute('aria-label', 'Close');
            closeBtn.innerHTML = `\n                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">\n                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />\n                        </svg>\n                    `;
            const modalContentDiv = document.createElement('div');
            modalContentDiv.id = 'modal-content';
            inner.appendChild(closeBtn);
            inner.appendChild(modalContentDiv);
            quickViewModal.appendChild(inner);
            document.body.appendChild(quickViewModal);
            quickModalContent = modalContentDiv;
            quickCloseBtn = closeBtn;
        }

        function openQuickView() {
            quickViewModal.classList.remove('hidden');
            quickViewModal.classList.add('modal-open');
            // ensure it's above the brand overlay
            quickViewModal.style.zIndex = 200;
            console.debug('[quickview] opened quick-view modal');
        }

        function closeQuickView() {
            quickViewModal.classList.add('modal-closing');
            quickViewModal.addEventListener('animationend', () => {
                quickViewModal.classList.remove('modal-closing', 'modal-open');
                quickViewModal.classList.add('hidden');
                console.debug('[quickview] closed quick-view modal');
            }, { once: true });
        }

        if (quickCloseBtn) quickCloseBtn.addEventListener('click', closeQuickView);
        quickViewModal.addEventListener('click', (e) => {
            if (e.target.id === 'quick-view-modal') closeQuickView();
        });

        // Function to show detailed quick view (same layout as main.js)
        function showProductQuickView(product) {
            quickModalContent.innerHTML = '';
            const img = document.createElement('img');
            img.className = 'rounded-2xl mb-6 w-full h-64 object-cover';
            img.alt = product.name || '';
            img.src = product.image_url || 'https://placehold.co/400x300/e2e8f0/6B46C1?text=Img';

            const title = document.createElement('h3');
            title.className = 'text-2xl font-bold mb-2';
            title.textContent = product.name || '';

            const desc = document.createElement('p');
            desc.className = 'text-gray-700 mb-4';
            desc.textContent = product.description || 'No description available.';

            quickModalContent.appendChild(img);
            quickModalContent.appendChild(title);
            quickModalContent.appendChild(desc);

            if (product.originalPrice) {
                const orig = document.createElement('p');
                orig.className = 'text-gray-500 line-through text-lg';
                orig.textContent = formatCurrency(product.originalPrice);
                quickModalContent.appendChild(orig);
            }

            const price = document.createElement('p');
            price.className = 'text-red-500 text-3xl font-bold mb-4';
            price.textContent = formatCurrency(product.price || 0);
            quickModalContent.appendChild(price);

            const stock = document.createElement('p');
            stock.className = 'text-sm text-gray-500 mt-2';
            stock.textContent = `Stock: ${product.stock || 0} left`;
            quickModalContent.appendChild(stock);

            openQuickView();
        }

    // Expose quick view for other scripts (e.g., category.js)
    window.showProductQuickView = showProductQuickView;

        // Reusable function: show a category in the centered modal
        async function showCategoryInModal(category, title) {
            modalTitle.textContent = title || category;
            modalSub.textContent = 'Loading items...';
            openModal();

            // Fetch items for the category
            let items = [];
            try {
                const r = await fetch(`./data/${category}.json`);
                if (r.ok) items = await r.json();
                else console.warn(`Failed to load ./data/${category}.json`);
            } catch (err) {
                console.warn(`Error fetching ./data/${category}.json`, err);
            }

            // Filter items by title keyword (for subcategory tiles like Snacks/Drinks)
            const keyword = (title || '').toLowerCase();
            let filtered = items;
            if (keyword) {
                filtered = items.filter(it => {
                    const tags = (it.tags || []).map(t => String(t).toLowerCase());
                    const name = (it.name || '').toLowerCase();
                    return tags.includes(keyword) || name.includes(keyword);
                });
            }

            // Ensure we always display 5 items. If there aren't enough real items, fill the remainder with placeholders.
            const result = [];
            if (filtered && filtered.length > 0) {
                result.push(...filtered.slice(0, 5));
            }

            if (result.length < 5) {
                const needed = 5 - result.length;
                // Try to fill from other items in the same category
                const nonMatches = items.filter(it => !result.includes(it));
                result.push(...nonMatches.slice(0, needed));
            }

            // If still empty, insert placeholder items
            if (result.length === 0) {
                for (let i = 0; i < 5; i++) {
                    result.push({
                        name: `Item ${i + 1}`,
                        image_url: 'https://placehold.co/80x80/e2e8f0/6B46C1?text=Img',
                        price: 0.00,
                        stock: 0
                    });
                }
            }

                    // If this modal was opened for a specific named tile, we may need to show curated items.
            try {
                const tstr = String(title || '').toLowerCase();
                // Powdered Drinks: replace the default result with a curated list of powdered milk/drinks
                if ((tstr.includes('powder') || tstr.includes('powdered')) ) {
                    result.length = 0; // clear any previous items
                    result.push(
                        {
                            id: null,
                            name: 'Alaska Fortified 300g',
                            image_url: 'images/food/powdered-drinks/alaska-300g.jpg',
                            image_webp: 'images/food/powdered-drinks/alaska-300g.webp',
                            price: 350.00,
                            stock: 5,
                            description: 'Alaska Fortified 300g'
                        },
                        {
                            id: null,
                            name: 'Alaska Fortified 150g',
                            image_url: 'images/food/powdered-drinks/alaska-150g.jpg',
                            image_webp: 'images/food/powdered-drinks/alaska-150g.webp',
                            price: 230.00,
                            stock: 10,
                            description: 'Alaska Fortified 150g'
                        },
                        {
                            id: null,
                            name: 'Alaska Fortified 33g',
                            image_url: 'images/food/powdered-drinks/alaska-33g.jpg',
                            image_webp: 'images/food/powdered-drinks/alaska-33g.webp',
                            price: 12.00,
                            stock: 20,
                            description: 'Alaska Fortified 33g'
                        },
                        {
                            id: null,
                            name: 'Bear Brand 680g',
                            image_url: 'images/food/powdered-drinks/bearbrand-680g.jpg',
                            image_webp: 'images/food/powdered-drinks/bearbrand-680g.webp',
                            price: 400.00,
                            stock: 3,
                            description: 'Bear Brand 680g'
                        },
                        {
                            id: null,
                            name: 'Bear Brand 135g',
                            image_url: 'images/food/powdered-drinks/bearbrand-135g.jpg',
                            image_webp: 'images/food/powdered-drinks/bearbrand-135g.webp',
                            price: 250.00,
                            stock: 10,
                            description: 'Bear Brand 135g'
                        }
                    );
                    // Append additional powdered-drinks items requested
                    result.push(
                        {
                            id: null,
                            name: 'Bear Brand 33g',
                            image_url: 'images/food/powdered-drinks/bearbrand-33g.jpg',
                            image_webp: 'images/food/powdered-drinks/bearbrand-33g.webp',
                            price: 12.00,
                            stock: 20,
                            description: 'Bear Brand 33g'
                        },
                        {
                            id: null,
                            name: 'Birch Tree Fortified 300g',
                            image_url: 'images/food/powdered-drinks/birchtree-300g.jpg',
                            image_webp: 'images/food/powdered-drinks/birchtree-300g.webp',
                            price: 300.00,
                            stock: 5,
                            description: 'Birch Tree Fortified 300g'
                        },
                        {
                            id: null,
                            name: 'Birch Tree Fortified 33g',
                            image_url: 'images/food/powdered-drinks/birchtree-33g.jpg',
                            image_webp: 'images/food/powdered-drinks/birchtree-33g.webp',
                            price: 12.00,
                            stock: 20,
                            description: 'Birch Tree Fortified 33g'
                        },
                        {
                            id: null,
                            name: 'Nescafe Creamy Latte 20g',
                            image_url: 'images/food/powdered-drinks/nescafe-creamylatte-20g.jpg',
                            image_webp: 'images/food/powdered-drinks/nescafe-creamylatte-20g.webp',
                            price: 12.00,
                            stock: 20,
                            description: 'Nescafe Creamy Latte 20g'
                        },
                        {
                            id: null,
                            name: 'Nescafe Creamy White 20g',
                            image_url: 'images/food/powdered-drinks/nescafe-creamywhite-20g.jpg',
                            image_webp: 'images/food/powdered-drinks/nescafe-creamywhite-20g.webp',
                            price: 12.00,
                            stock: 20,
                            description: 'Nescafe Creamy White 20g'
                        }
                    );
                    // More additions: Nescafe, Nestea, Tang
                    result.push(
                        {
                            id: null,
                            name: 'Nescafe Original 20g',
                            image_url: 'images/food/powdered-drinks/nescafe-original-20g.jpg',
                            image_webp: 'images/food/powdered-drinks/nescafe-original-20g.webp',
                            price: 12.00,
                            stock: 20,
                            description: 'Nescafe Original 20g'
                        },
                        {
                            id: null,
                            name: 'Nescafe Original Twin Pack 40g',
                            image_url: 'images/food/powdered-drinks/nescafe-original-twinpack-40g.jpg',
                            image_webp: 'images/food/powdered-drinks/nescafe-original-twinpack-40g.webp',
                            price: 18.00,
                            stock: 20,
                            description: 'Nescafe Original Twin Pack 40g'
                        },
                        {
                            id: null,
                            name: 'Nescafe Sticks',
                            image_url: 'images/food/powdered-drinks/nescafe-sticks.jpg',
                            image_webp: 'images/food/powdered-drinks/nescafe-sticks.webp',
                            price: 5.00,
                            stock: 96,
                            description: 'Nescafe Sticks'
                        },
                        {
                            id: null,
                            name: 'Nestea Lemon 250g',
                            image_url: 'images/food/powdered-drinks/nestea-lemon-250g.jpg',
                            image_webp: 'images/food/powdered-drinks/nestea-lemon-250g.webp',
                            price: 150.00,
                            stock: 5,
                            description: 'Nestea Lemon 250g'
                        },
                        {
                            id: null,
                            name: 'Nestea Lemon 20g',
                            image_url: 'images/food/powdered-drinks/nestea-lemon-20g.jpg',
                            image_webp: 'images/food/powdered-drinks/nestea-lemon-20g.webp',
                            price: 30.00,
                            stock: 20,
                            description: 'Nestea Lemon 20g'
                        },
                        {
                            id: null,
                            name: 'Tang Orange 375g',
                            image_url: 'images/food/powdered-drinks/tang-orange-375g.jpg',
                            image_webp: 'images/food/powdered-drinks/tang-orange-375g.webp',
                            price: 460.00,
                            stock: 3,
                            description: 'Tang Orange 375g'
                        },
                        {
                            id: null,
                            name: 'Tang Orange 14g',
                            image_url: 'images/food/powdered-drinks/tang-orange-14g.jpg',
                            image_webp: 'images/food/powdered-drinks/tang-orange-14g.webp',
                            price: 30.00,
                            stock: 20,
                            description: 'Tang Orange 14g'
                        },
                        {
                            id: null,
                            name: 'Tang Grapes 19g',
                            image_url: 'images/food/powdered-drinks/tang-grapes-19g.jpg',
                            image_webp: 'images/food/powdered-drinks/tang-grapes-19g.webp',
                            price: 30.00,
                            stock: 20,
                            description: 'Tang Grapes 19g'
                        },
                        {
                            id: null,
                            name: 'Tang Pomelo 19g',
                            image_url: 'images/food/powdered-drinks/tang-pomelo-19g.jpg',
                            image_webp: 'images/food/powdered-drinks/tang-pomelo-19g.webp',
                            price: 30.00,
                            stock: 20,
                            description: 'Tang Pomelo 19g'
                        },
                        {
                            id: null,
                            name: 'Tang Strawberry 19g',
                            image_url: 'images/food/powdered-drinks/tang-strawberry-19g.jpg',
                            image_webp: 'images/food/powdered-drinks/tang-strawberry-19g.webp',
                            price: 30.00,
                            stock: 20,
                            description: 'Tang Strawberry 19g'
                        }
                    );
                }

                // If this modal was opened for the 'Snacks' (or renamed Chips) tile, replace the very first item
                // with a curated Oishi product per request.
                if ((tstr.includes('snack') || tstr.includes('chip') || tstr.includes('crackl')) && result.length > 0) {
                    result[0] = {
                        id: null,
                        name: 'Oishi Prawn Crackers (Big, Spicy)',
                        // include both webp and jpg so rendering can prefer webp with jpg fallback
                        image_url: 'images/food/Chips-n-crackers/oishi-spicy-big.jpg',
                        image_webp: 'images/food/Chips-n-crackers/oishi-spicy-big.webp',
                        price: 30.00,
                        stock: 10,
                        description: 'Oishi Prawn Crackers (Big, Spicy)'
                    };
                    // also replace the second item with Oishi Original (Big, Original)
                    if (result.length > 1) {
                        result[1] = {
                            id: null,
                            name: 'Oishi Prawn Crackers (Big, Original)',
                            image_url: 'images/food/Chips-n-crackers/oishi-original-big.jpg',
                            image_webp: 'images/food/Chips-n-crackers/oishi-original-big.webp',
                            price: 30.00,
                            stock: 10,
                            description: 'Oishi Prawn Crackers (Big, Original)'
                        };
                    }
                    // replace the third item with the small spicy variant if available
                    if (result.length > 2) {
                        result[2] = {
                            id: null,
                            name: 'Oishi Prawn Crackers (Small, Spicy)',
                            image_url: 'images/food/Chips-n-crackers/oishi-spicy-small.jpg',
                            image_webp: 'images/food/Chips-n-crackers/oishi-spicy-small.webp',
                            price: 10.00,
                            stock: 10,
                            description: 'Oishi Prawn Crackers (Small, Spicy)'
                        };
                    }
                    // replace the fourth item (index 3) with the Small Original variant
                    if (result.length > 3) {
                        result[3] = {
                            id: null,
                            name: 'Oishi Prawn Crackers (Small, Original)',
                            image_url: 'images/food/Chips-n-crackers/oishi-original-small.jpg',
                            image_webp: 'images/food/Chips-n-crackers/oishi-original-small.webp',
                            price: 10.00,
                            stock: 10,
                            description: 'Oishi Prawn Crackers (Small, Original)'
                        };
                    }
                    // replace the fifth item (index 4) with Oishi Seafood Curls (Big, Spicy)
                    if (result.length > 4) {
                        result[4] = {
                            id: null,
                            name: 'Oishi Seafood Curls (Big, Spicy)',
                            image_url: 'images/food/Chips-n-crackers/oishi-curls-spicy-big.jpg',
                            image_webp: 'images/food/Chips-n-crackers/oishi-curls-spicy-big.webp',
                            price: 30.00,
                            stock: 10,
                            description: 'Oishi Seafood Curls (Big, Spicy)'
                        };
                    }
                    // append a sixth item: Oishi Seafood Curls (Small, Spicy)
                    // this will make the modal show 6 items when available
                    if (result.length >= 5) {
                        result[5] = {
                            id: null,
                            name: 'Oishi Seafood Curls (Small, Spicy)',
                            image_url: 'images/food/Chips-n-crackers/oishi-curls-spicy-small.jpg',
                            image_webp: 'images/food/Chips-n-crackers/oishi-curls-spicy-small.webp',
                            price: 10.00,
                            stock: 10,
                            description: 'Oishi Seafood Curls (Small, Spicy)'
                        };
                    }
                    // append a seventh item: Oishi Fish Crackers (Big, Spicy)
                    if (result.length >= 6) {
                        result[6] = {
                            id: null,
                            name: 'Oishi Fish Crackers (Big)',
                            image_url: 'images/food/Chips-n-crackers/oishi-fish-crackers-big.jpg',
                            image_webp: 'images/food/Chips-n-crackers/oishi-fish-crackers-big.webp',
                            price: 30.00,
                            stock: 10,
                            description: 'Oishi Fish Crackers (Big)'
                        };
                    }
                    // append a Small Fish Crackers item (Small)
                    if (result.length >= 7) {
                        // append at the end to avoid gaps
                        result.push({
                            id: null,
                            name: 'Oishi Fish Crackers (Small)',
                            image_url: 'images/food/Chips-n-crackers/oishi-fish-crackers-small.jpg',
                            image_webp: 'images/food/Chips-n-crackers/oishi-fish-crackers-small.webp',
                            price: 10.00,
                            stock: 10,
                            description: 'Oishi Fish Crackers (Small)'
                        });
                    }
                    // append Oishi Marty's Cracklin' (Big, Spicy)
                    if (result.length >= 8) {
                        result.push({
                            id: null,
                            name: "Oishi Marty's Cracklin' (Big, Spicy)",
                            image_url: 'images/food/Chips-n-crackers/martys-big.jpg',
                            image_webp: 'images/food/Chips-n-crackers/martys-big.webp',
                            price: 30.00,
                            stock: 10,
                            description: "Oishi Marty's Cracklin' (Big, Spicy)"
                        });
                    }
                    // append Marty's Small Spicy variant
                    if (result.length >= 9) {
                        result.push({
                            id: null,
                            name: "Oishi Marty's Cracklin' (Small, Spicy)",
                            image_url: 'images/food/Chips-n-crackers/martys-small.jpg',
                            image_webp: 'images/food/Chips-n-crackers/martys-small.webp',
                            price: 10.00,
                            stock: 10,
                            description: "Oishi Marty's Cracklin' (Small, Spicy)"
                        });
                    }
                    // append Oishi Crispy Patata (Big)
                    if (result.length >= 10) {
                        result.push({
                            id: null,
                            name: 'Oishi Crispy Patata (Big)',
                            image_url: 'images/food/Chips-n-crackers/crispy-patata-big.jpg',
                            image_webp: 'images/food/Chips-n-crackers/crispy-patata-big.webp',
                            price: 30.00,
                            stock: 10,
                            description: 'Oishi Crispy Patata (Big)'
                        });
                    }
                    // append Oishi Crispy Patata (Small)
                    if (result.length >= 11) {
                        result.push({
                            id: null,
                            name: 'Oishi Crispy Patata (Small)',
                            image_url: 'images/food/Chips-n-crackers/crispy-patata-small.jpg',
                            image_webp: 'images/food/Chips-n-crackers/crispy-patata-small.webp',
                            price: 10.00,
                            stock: 10,
                            description: 'Oishi Crispy Patata (Small)'
                        });
                    }
                }
            } catch (e) { /* ignore safety */ }

            // Register curated Oishi items in the global search registry so they are discoverable
            try {
                if (window.registerProductsForSearch) {
                    const toRegister = [];
                    // gather any items we inserted into the result and register them all
                    for (let i = 0; i < result.length; i++) {
                        const it = result[i];
                        if (!it) continue;
                        toRegister.push({
                            id: it.id || null,
                            name: it.name,
                            brand: 'Oishi',
                            tags: ['chips','oishi'],
                            image_url: it.image_url,
                            image_webp: it.image_webp,
                            price: it.price,
                            stock: it.stock,
                            description: it.description || '',
                            category: category
                        });
                    }
                    if (toRegister.length) window.registerProductsForSearch(toRegister);
                }
            } catch (e) { /* ignore registration failures */ }

            modalSub.textContent = `${result.length} items available`;
            modalItems.innerHTML = '';

            // Detect if the result set only contains placeholder items (no real price/stock/name)
            const hasRealProduct = result.some(it => {
                if (!it) return false;
                // heuristics: price > 0 or stock > 0 or name not like 'Item 1'
                const nameLooksPlaceholder = /^Item\s+\d+$/i.test(String(it.name || ''));
                return (Number(it.price || 0) > 0) || (Number(it.stock || 0) > 0) || !nameLooksPlaceholder;
            });

            if (!hasRealProduct) {
                // render a friendly Coming Soon block
                const box = document.createElement('div');
                box.className = 'w-full py-12 flex flex-col items-center justify-center text-center text-gray-600';
                const emoji = document.createElement('div');
                emoji.className = 'text-4xl mb-3';
                emoji.textContent = '🛒';
                const h = document.createElement('h3');
                h.className = 'text-xl font-semibold mb-2';
                h.textContent = 'Coming soon';
                const p = document.createElement('p');
                p.className = 'text-sm text-gray-500 max-w-lg';
                p.textContent = 'We are adding products for this brand. Check back soon or contact us if you have a request.';
                box.appendChild(emoji);
                box.appendChild(h);
                box.appendChild(p);
                modalItems.appendChild(box);
                modalSub.textContent = 'No items yet';
                return;
            }

            result.forEach(it => {
                const row = document.createElement('div');
                row.className = 'product-row cursor-pointer';
                // build row using DOM APIs (use classes so CSS can make the layout responsive)
                const left = document.createElement('div');
                left.className = 'flex items-center gap-3';

                // Prefer WebP when available by rendering a <picture> with a webp <source> and jpg fallback
                let mediaEl;
                if (it.image_webp) {
                    const pic = document.createElement('picture');
                    const src = document.createElement('source');
                    src.setAttribute('type', 'image/webp');
                    src.setAttribute('srcset', it.image_webp);
                    const img = document.createElement('img');
                    img.className = 'w-14 h-14 object-cover rounded-md';
                    img.src = it.image_url || it.image_webp;
                    img.alt = it.name || '';
                    img.loading = 'lazy';
                    pic.appendChild(src);
                    pic.appendChild(img);
                    mediaEl = pic;
                } else if (it.image_url && (it.image_url.endsWith('.jpg') || it.image_url.endsWith('.jpeg'))) {
                    // try to infer a webp sibling, otherwise just use the jpg
                    const inferredWebp = it.image_url.replace(/\.jpe?g$/i, '.webp');
                    const pic = document.createElement('picture');
                    const src = document.createElement('source');
                    src.setAttribute('type', 'image/webp');
                    src.setAttribute('srcset', inferredWebp);
                    const img = document.createElement('img');
                    img.className = 'w-14 h-14 object-cover rounded-md';
                    img.src = it.image_url;
                    img.alt = it.name || '';
                    img.loading = 'lazy';
                    pic.appendChild(src);
                    pic.appendChild(img);
                    mediaEl = pic;
                } else {
                    const img = document.createElement('img');
                    img.className = 'w-14 h-14 object-cover rounded-md';
                    img.src = it.image_url || 'https://placehold.co/80x80/e2e8f0/6B46C1?text=Img';
                    img.alt = it.name || '';
                    img.loading = 'lazy';
                    mediaEl = img;
                }

                const textWrap = document.createElement('div');
                const nameDiv = document.createElement('div');
                nameDiv.className = 'product-name';
                nameDiv.textContent = it.name || 'Item name';
                const priceDiv = document.createElement('div');
                priceDiv.className = 'text-sm text-gray-500';
                priceDiv.textContent = formatCurrency(it.price || 0);

                textWrap.appendChild(nameDiv);
                textWrap.appendChild(priceDiv);
                left.appendChild(mediaEl);
                left.appendChild(textWrap);

                const stockDiv = document.createElement('div');
                stockDiv.className = 'product-stock';
                stockDiv.textContent = it.stock != null ? (it.stock + ' left') : '';

                const addWrap = document.createElement('div');
                // allow CSS to move this onto its own centered row on small screens
                addWrap.className = 'product-add';
                const addBtn = document.createElement('button');
                addBtn.className = 'add-to-cart-btn inline-block mt-2 bg-indigo-600 text-white px-3 py-1 rounded-full';
                addBtn.textContent = 'Add to cart';
                addWrap.appendChild(addBtn);

                row.appendChild(left);
                row.appendChild(stockDiv);
                row.appendChild(addWrap);
                // Attach click handler to open quick view with the product data
                row.addEventListener('click', (ev) => {
                    // If user clicked the Add to cart button, handle separately
                    const target = ev.target;
                    if (target.closest('.add-to-cart-btn')) return; // let button handler handle it
                    // Normalize placeholder items to a product shape
                    const productObj = {
                        id: it.id || null,
                        name: it.name || 'Item',
                        image_url: it.image_url || 'https://placehold.co/400x300/e2e8f0/6B46C1?text=Img',
                        description: it.description || '',
                        originalPrice: it.originalPrice || null,
                        price: it.price || 0,
                        stock: it.stock || 0,
                        category: category
                    };
                    showProductQuickView(productObj);
                });

                // Attach add-to-cart button handler
                setTimeout(() => {
                    const btn = row.querySelector('.add-to-cart-btn');
                    if (btn) {
                        btn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            if (window.showQuantityModal) {
                                window.showQuantityModal(it, 1, (qty) => {
                                    if (it.stock && qty > it.stock) { alert('Requested quantity exceeds available stock.'); return; }
                                    if (window.addToCart) {
                                        window.addToCart({ id: it.id || null, name: it.name, price: it.price || 0, category }, qty);
                                        alert(`Added ${qty} x ${it.name} to cart.`);
                                        try { window.dispatchEvent(new Event('cart-updated')); } catch(e) {}
                                    } else {
                                        alert('Cart functionality not available.');
                                    }
                                });
                            } else {
                                const qtyStr = prompt(`Enter quantity for "${it.name}" (available: ${it.stock || 0}):`, '1');
                                if (qtyStr === null) return;
                                const qty = parseInt(qtyStr, 10);
                                if (!qty || qty <= 0) { alert('Please enter a valid quantity.'); return; }
                                if (it.stock && qty > it.stock) { alert('Requested quantity exceeds available stock.'); return; }
                                if (window.addToCart) {
                                    window.addToCart({ id: it.id || null, name: it.name, price: it.price || 0, category }, qty);
                                    alert(`Added ${qty} x ${it.name} to cart.`);
                                    try { window.dispatchEvent(new Event('cart-updated')); } catch(e) {}
                                } else {
                                    alert('Cart functionality not available.');
                                }
                            }
                        });
                    }
                }, 10);
                modalItems.appendChild(row);
            });
        }

        // Attach showCategoryInModal to static/dynamic tiles
        tiles.forEach(t => {
            // add small add-to-cart button inside each tile for quick adds
            try {
                if (!t.querySelector('.tile-add-btn')) {
                    const btn = document.createElement('button');
                    btn.className = 'tile-add-btn mt-3 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm';
                    btn.textContent = 'Add to cart';
                    btn.style.display = 'none';
                    t.appendChild(btn);
                    // show the button on hover via simple listeners
                    t.addEventListener('mouseenter', () => btn.style.display = 'inline-block');
                    t.addEventListener('mouseleave', () => btn.style.display = 'none');
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const category = t.dataset.category;
                        const title = t.dataset.title || '';
                        // when adding from tile, attempt to find a sample product from the category with this title
                        (async () => {
                            let items = [];
                            try {
                                const r = await fetch(`./data/${category}.json`);
                                if (r.ok) items = await r.json();
                            } catch (err) { }
                            const match = items.find(it => (it.name || '').toLowerCase().includes((title||'').toLowerCase()) || (it.tags||[]).map(x=>x.toLowerCase()).includes((title||'').toLowerCase()));
                            const sample = match || items[0] || { id: null, name: title || 'Item', price: 0, stock: 0 };
                            if (window.showQuantityModal) {
                                window.showQuantityModal(sample, 1, (qty) => {
                                    if (window.addToCart) {
                                        window.addToCart({ id: sample.id || null, name: sample.name, price: sample.price || 0, category }, qty);
                                        window.dispatchEvent(new Event('cart-updated'));
                                        alert(`Added ${qty} x ${sample.name} to cart.`);
                                    }
                                });
                            } else {
                                const qStr = prompt(`Enter quantity for "${sample.name}" (available: ${sample.stock || 0}):`, '1');
                                if (qStr === null) return;
                                const q = parseInt(qStr, 10);
                                if (!q || q <= 0) { alert('Please enter a valid quantity.'); return; }
                                if (sample.stock && q > sample.stock) { alert('Requested quantity exceeds available stock.'); return; }
                                if (window.addToCart) { window.addToCart({ id: sample.id || null, name: sample.name, price: sample.price || 0, category }, q); try { window.dispatchEvent(new Event('cart-updated')); } catch(e) {} }
                            }
                        })();
                    });
                }
            } catch(e) { /* ignore */ }

            t.addEventListener('click', () => {
                const category = t.dataset.category;
                const title = t.dataset.title || '';
                showCategoryInModal(category, title);
            });
        });

    // Bind nav/menu links with data-open-category to open the same modal on a normal left-click
        // but allow modifier keys (Ctrl/Cmd/Shift/Alt) and middle-clicks to perform normal navigation.
        const navCategoryLinks = document.querySelectorAll('[data-open-category]');
        // Determine current category (if on a category page) so we don't treat nav items as tiles
        const currentCategoryContainer = document.getElementById('category-products');
        const currentCategory = currentCategoryContainer ? currentCategoryContainer.dataset.category : null;

    // Keep default navigation behavior for submenu links (they already have hrefs to category pages).
    // This ensures clicking Categories -> Food will navigate to category-food.html across the site.

        // Proactively register curated Oishi items so they are discoverable by the global search
        try {
                const curated = [
                    {
                    id: null,
                    name: 'Oishi Prawn Crackers (Big, Spicy)',
                    brand: 'Oishi',
                    tags: ['chips','oishi'],
                    image_url: 'images/food/Chips-n-crackers/oishi-spicy-big.jpg',
                    image_webp: 'images/food/Chips-n-crackers/oishi-spicy-big.webp',
                    price: 30.00,
                    stock: 10,
                    description: 'Oishi Prawn Crackers (Big, Spicy)',
                    category: 'food'
                },
                {
                    id: null,
                    name: 'Oishi Prawn Crackers (Big, Original)',
                    brand: 'Oishi',
                    tags: ['chips','oishi'],
                    image_url: 'images/food/Chips-n-crackers/oishi-original-big.jpg',
                    image_webp: 'images/food/Chips-n-crackers/oishi-original-big.webp',
                    price: 30.00,
                    stock: 10,
                    description: 'Oishi Prawn Crackers (Big, Original)',
                    category: 'food'
                },
                {
                    id: null,
                    name: 'Oishi Prawn Crackers (Small, Spicy)',
                    brand: 'Oishi',
                    tags: ['chips','oishi'],
                    image_url: 'images/food/Chips-n-crackers/oishi-spicy-small.jpg',
                    image_webp: 'images/food/Chips-n-crackers/oishi-spicy-small.webp',
                    price: 10.00,
                    stock: 10,
                    description: 'Oishi Prawn Crackers (Small, Spicy)',
                    category: 'food'
                }
            ];
            // If the main search registrar is available use it, otherwise push into the low-level registry
            if (window.registerProductsForSearch) {
                window.registerProductsForSearch(curated);
            } else {
                if (!Array.isArray(window.__productSearchRegistry)) window.__productSearchRegistry = [];
                // simple dedupe by lowercase name
                const seen = new Set(window.__productSearchRegistry.map(p => p && p.name ? String(p.name).toLowerCase() : null));
                curated.forEach(it => {
                    if (!it || !it.name) return;
                    if (seen.has(it.name.toLowerCase())) return;
                    seen.add(it.name.toLowerCase());
                    if (!it.id) {
                        try { it.id = (window.generateUUID ? window.generateUUID() : ('gen-' + Date.now() + '-' + Math.random().toString(36).slice(2,8))); } catch (e) { it.id = ('gen-' + Date.now() + '-' + Math.random().toString(36).slice(2,8)); }
                    }
                    window.__productSearchRegistry.push(it);
                });
            }
        } catch (e) { /* ignore registration errors */ }

        // Expose for debugging/other scripts if needed
        window.showCategoryInModal = showCategoryInModal;

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-red-500">Failed to load brands.</p>';
    }
});
