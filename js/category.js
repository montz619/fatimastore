// category.js — small renderer for static category templates
document.addEventListener('DOMContentLoaded', async () => {
    // Currency formatter for Philippine Peso
    function formatCurrency(value) {
        try {
            return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
        } catch (e) {
            return '₱' + Number(value).toFixed(2);
        }
    }
    const container = document.getElementById('category-products');
    if (!container) return; // nothing to do on pages without the container

    // derive category from a data attribute on the container
    const category = container.dataset.category || 'all';
    // allow optional brand filter via query string, e.g. ?brand=Brand%20A
    const urlParams = new URLSearchParams(window.location.search);
    const brandFilter = urlParams.get('brand');

    try {
        let products = [];
        if (category === 'all') {
            // try to load all category files from /data
            const files = ['data/food.json', 'data/school-supplies.json'];
            for (const f of files) {
                try {
                    const r = await fetch(`./${f}`);
                    if (!r.ok) continue;
                    const chunk = await r.json();
                    products = products.concat(chunk);
                } catch (e) {
                    // ignore and continue
                }
            }
            if (products.length === 0) {
                console.warn('No products loaded from /data/*.json; ensure category data files exist.');
            }
        } else {
            // load the specific category file if available
            const filePath = `./data/${category}.json`;
            try {
                const r = await fetch(filePath);
                if (r.ok) products = await r.json();
                else console.warn(`Failed to load ${filePath}`);
            } catch (e) {
                console.warn(`Error fetching ${filePath}:`, e);
            }
        }

        let filtered = category === 'all' ? products : products.filter(p => p.category === category);
        if (brandFilter) {
            filtered = filtered.filter(p => (p.brand || '').toLowerCase() === brandFilter.toLowerCase());
        }

        if (filtered.length === 0) {
            container.innerHTML = '<p class="text-gray-600">No products found for this category.</p>';
            return;
        }

        container.innerHTML = '';
        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-xl shadow-sm text-center';

            const img = document.createElement('img');
            img.src = escapeHTML(p.image_url || 'https://placehold.co/300x300/e2e8f0/6B46C1?text=Product');
            img.alt = p.name || '';
            img.loading = 'lazy';
            img.className = 'w-full h-40 object-cover rounded-lg mb-3';
            card.appendChild(img);

            const h3 = document.createElement('h3');
            h3.className = 'font-semibold';
            h3.textContent = p.name || '';
            card.appendChild(h3);

            const priceP = document.createElement('p');
            priceP.className = 'text-sm text-gray-500';
            priceP.textContent = formatCurrency(p.price || 0);
            card.appendChild(priceP);

            const stockP = document.createElement('p');
            stockP.className = 'text-xs text-gray-600 mt-2';
            stockP.textContent = `Stock: ${p.stock ?? 0}`;
            card.appendChild(stockP);

            container.appendChild(card);
        });
        // Mark the first card as a brand-tile so it uses the same centered modal behavior as `brands.html`.
        const firstCard = container.querySelector('div');
        if (firstCard) {
            firstCard.classList.add('cursor-pointer', 'brand-tile');
            // attach dataset attributes expected by brands.js
            firstCard.setAttribute('data-category', category);
            firstCard.setAttribute('data-title', '');
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="text-red-500">Failed to load products.</p>';
    }
});
