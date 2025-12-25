// Hot Deals page script: fetch products and display items with originalPrice > price

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('hot-deals-list');
    if (!container) return;

    function formatCurrency(value) {
        try {
            return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
        } catch (e) {
            return '₱' + Number(value).toFixed(2);
        }
    }

    function capitalize(s) {
        if (!s || typeof s !== 'string') return s;
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    async function loadHotDeals() {
        try {
            const dataFiles = ['./data/food.json', './data/school-supplies.json', './data/general-merchandise.json'];
            const responses = await Promise.all(dataFiles.map(p => fetch(p).catch(e => null)));
            const jsonPromises = responses.map(r => (r && r.ok) ? r.json() : []);
            const arrays = await Promise.all(jsonPromises);
            const items = arrays.flat();

            const hotItems = items
                .filter(it => it && it.originalPrice && Number(it.originalPrice) > Number(it.price))
                .map(p => ({ ...p, discountPercent: Math.round(((Number(p.originalPrice) - Number(p.price)) / Number(p.originalPrice)) * 100) }))
                .sort((a, b) => b.discountPercent - a.discountPercent);

            if (!hotItems.length) {
                container.innerHTML = '<p class="text-center text-gray-600">No hot deals right now.</p>';
                return;
            }
            renderItems(hotItems);
        } catch (err) {
            console.error(err);
            container.innerHTML = '<p class="text-center text-red-500">Failed to load hot deals.</p>';
        }
    }

    function renderItems(items) {
        container.innerHTML = '';

        // Group items by category -> subcategory
        const groups = {};
        items.forEach(it => {
            const cat = it.category || 'Other';
            const sub = it.subcategory || 'Other';
            groups[cat] = groups[cat] || {};
            groups[cat][sub] = groups[cat][sub] || [];
            groups[cat][sub].push(it);
        });

        // Render each group and its subcategories
        Object.keys(groups).forEach(cat => {
            const catEl = document.createElement('section');
            catEl.className = 'mb-8';
            // Eye-catching mobile-friendly category header
            const h2 = document.createElement('h2');
            h2.className = 'text-xl sm:text-2xl font-extrabold text-indigo-700 mb-4';
            const span = document.createElement('span');
            span.className = 'inline-block bg-indigo-50 dark:bg-opacity-10 px-3 py-1 rounded-md shadow-sm';
            span.textContent = capitalize(cat);
            h2.appendChild(span);
            catEl.appendChild(h2);

            const subs = groups[cat];
            Object.keys(subs).forEach(sub => {
                const itemsList = subs[sub];
                // skip empty
                if (!itemsList || !itemsList.length) return;

                const subSection = document.createElement('div');
                subSection.className = 'mb-6';
                // Slightly smaller subcategory header with accent color for mobile readability
                subSection.innerHTML = '';
                const subH = document.createElement('h3');
                subH.className = 'text-sm sm:text-lg font-semibold text-indigo-600 mb-3';
                subH.textContent = sub;
                subSection.appendChild(subH);

                const grid = document.createElement('div');
                // compact grid tuned for mobile first
                grid.className = 'grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3';

                itemsList.forEach(product => {
                    const card = document.createElement('div');
                    // Compact card styling for mobile focus
                    card.className = 'relative product-card bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow duration-200 cursor-pointer';

                    if (product.discountPercent) {
                        const badge = document.createElement('div');
                        badge.className = 'absolute top-2 right-2 bg-red-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full';
                        badge.textContent = `-${product.discountPercent}%`;
                        card.appendChild(badge);
                    }

                    const img = document.createElement('img');
                    img.className = 'rounded-xl mb-2 w-full h-28 object-cover';
                    img.loading = 'lazy';
                    img.alt = product.name || '';
                    img.src = product.image_webp || product.image_url || '';
                    card.appendChild(img);

                    const title = document.createElement('h4');
                    title.className = 'font-semibold text-sm sm:text-base mb-1 leading-tight';
                    title.textContent = product.name || '';
                    card.appendChild(title);

                    if (product.originalPrice) {
                        const orig = document.createElement('p');
                        orig.className = 'text-gray-500 text-xs line-through';
                        orig.textContent = formatCurrency(product.originalPrice);
                        card.appendChild(orig);
                    }

                    const price = document.createElement('p');
                    price.className = 'text-red-500 text-base font-bold';
                    price.textContent = formatCurrency(product.price);
                    card.appendChild(price);

                    const stock = document.createElement('p');
                    stock.className = 'text-xs text-gray-500 mt-1';
                    const stockSpan = document.createElement('span');
                    stockSpan.id = `stock-${product.id}`;
                    stockSpan.className = 'font-bold text-gray-800';
                    stockSpan.textContent = String(product.stock ?? '0');
                    stock.appendChild(document.createTextNode('Stock: '));
                    stock.appendChild(stockSpan);
                    card.appendChild(stock);

                    const btn = document.createElement('button');
                    btn.className = 'mt-3 bg-indigo-600 text-white px-3 py-1 rounded-full text-sm add-to-cart-btn';
                    btn.textContent = 'Add to cart';
                    card.appendChild(btn);

                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const qtyStr = prompt(`Enter quantity for "${product.name}" (available: ${product.stock}):`, '1');
                        if (qtyStr === null) return;
                        const qty = parseInt(qtyStr, 10);
                        if (!qty || qty <= 0) { alert('Please enter a valid quantity.'); return; }
                        if (product.stock && qty > product.stock) { alert('Requested quantity exceeds available stock.'); return; }
                        if (window.addToCart) {
                            window.addToCart(product, qty);
                            try { window.dispatchEvent(new Event('cart-updated')); } catch (e) {}
                            alert(`Added ${qty} x ${product.name} to cart.`);
                        } else {
                            alert('Cart helper not available.');
                        }
                    });

                    grid.appendChild(card);
                });

                subSection.appendChild(grid);
                catEl.appendChild(subSection);
            });

            container.appendChild(catEl);
        });
    }

    loadHotDeals();
});
