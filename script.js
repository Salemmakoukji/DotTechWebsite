// Enhanced shop script: loads products from data/products.json
// Provides: search, filters, sort, pagination, quick view, and cart using localStorage

const DATA_PATH = 'data/products.json';
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const PAGE_SIZE = 12;
let productsLoadedPromise = null;

// DOM references (initialized on DOMContentLoaded)
let productsGrid;
let loadingEl;
let noResultsEl;
let searchInput;
let categoryFilter;
let priceFilter;
let stockFilter;
let sortFilter;

// Utility
function showLoading(show = true) {
    if (!loadingEl) return;
    loadingEl.classList.toggle('hidden', !show);
}

function showNoResults(show = true) {
    if (!noResultsEl) return;
    noResultsEl.classList.toggle('hidden', !show);
}

// Fetch products JSON
async function loadProductsFromJSON() {
    showLoading(true);
    try {
        const res = await fetch(DATA_PATH);
        if (!res.ok) throw new Error('Failed to load products');
        const raw = await res.json();
        // basic normalization - support both lowercase keys and capitalized keys (user edited file)
        allProducts = (raw || []).map(p => {
            const id = p.id ?? p.ID ?? String(p.ID || p.id || '').toString();
            const name = p.name ?? p.Name ?? '';
            const category = p.category ?? p.Category ?? '';
            const description = p.description ?? p.Description ?? '';
            const price = Number(p.price ?? p.Price ?? 0) || 0;
            const stock = Number(p.stock ?? p.Stock ?? 0) || 0;
            const image = p.image ?? p.ImageURL ?? p.Image ?? '';
            const rating = p.rating ?? p.Rating ?? null;
            const tags = p.tags ?? p.Tags ?? [];
            return { id: String(id), name, category, description, price, stock, image, rating, tags };
        });
        filteredProducts = allProducts.slice();
        renderFiltersFromData();
        render();
    } catch (err) {
        console.error(err);
        productsGrid.innerHTML = '<p class="col-span-full text-center text-red-500">Unable to load products.</p>';
    } finally {
        showLoading(false);
    }
}

// Ensure products are loaded and return a promise
function ensureProductsLoaded() {
    if (!productsLoadedPromise) {
        productsLoadedPromise = loadProductsFromJSON();
    }
    return productsLoadedPromise;
}

// Return product and similar products by id
function getProductDetails(productId) {
    if (!allProducts || allProducts.length === 0) return { product: null, similarProducts: [] };
    const id = String(productId);
    const product = allProducts.find(p => String(p.id) === id) || null;
    if (!product) return { product: null, similarProducts: [] };
    const similarProducts = allProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 3);
    return { product, similarProducts };
}

// Render product details into a container (used on product.html)
function renderProductDetails(product, similarProducts, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <!-- Product Images -->
            <div class="space-y-4">
                <img src="${escapeHtml(product.image||'')}" alt="${escapeHtml(product.name)}" class="w-full h-96 object-cover rounded-xl">
            </div>
            
            <!-- Product Info -->
            <div class="space-y-6">
                <div>
                    <h1 class="text-4xl font-bold text-gray-900">${escapeHtml(product.name)}</h1>
                    <p class="text-xl text-gray-600 mt-2">${escapeHtml(product.category)}</p>
                </div>
                
                <div class="flex items-center gap-4">
                    <span class="text-3xl font-bold text-gray-900">$${Number(product.price).toFixed(2)}</span>
                    <span class="text-sm text-gray-500">${product.stock > 0 ? '<span class="text-green-600 font-semibold">In Stock</span>' : '<span class="text-red-600 font-semibold">Out of Stock</span>'}</span>
                </div>
                
                <div class="prose max-w-none">
                    <h3 class="text-xl font-semibold mb-2">Description</h3>
                    <p class="text-gray-700">${escapeHtml(product.description || '')}</p>
                </div>
                
                <div class="space-y-4">
                    ${product.stock > 0 ? `
                        <a href="#" data-id="${product.id}" class="w-full inline-block bg-black text-white py-4 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors add-to-cart-from-detail">
                            Add to Cart
                        </a>
                    ` : ''}
                    
                    <a href="https://wa.me/963995505964?text=${encodeURIComponent('Hello DotTech 👋, I\'m interested in the ' + product.name)}" 
                           class="w-full inline-block bg-green-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors">
                            <i data-feather="message-circle"></i>
                            Order via WhatsApp
                        </a>
                </div>
            </div>
        </div>
        
        <!-- Similar Products -->
        ${similarProducts && similarProducts.length > 0 ? `
            <div class="mt-12">
                <h2 class="text-3xl font-bold mb-6">Similar Products</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${similarProducts.map(similar => `
                        <a href="product.html?id=${encodeURIComponent(similar.id)}" class="block bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                            <img src="${escapeHtml(similar.image||'')}" alt="${escapeHtml(similar.name)}" class="w-full h-48 object-cover">
                            <div class="p-4">
                                <h4 class="font-semibold mb-2">${escapeHtml(similar.name)}</h4>
                                <div class="flex justify-between items-center">
                                    <span class="font-bold text-gray-900">$${Number(similar.price).toFixed(2)}</span>
                                </div>
                            </div>
                        </a>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    // wire add-to-cart on detail
    document.querySelectorAll('.add-to-cart-from-detail').forEach(el => el.addEventListener('click', function(e){
        e.preventDefault();
        const id = this.dataset.id;
        const p = allProducts.find(x => String(x.id) === String(id));
        if (!p) return;
        const cart = getCart();
        const item = cart.find(i => i.id === id);
        if (item) item.qty = Math.min((item.qty||1) + 1, 99);
        else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
        saveCart(cart);
        showNotification(`${p.name} added to cart!`, 'success');
    }));

    feather.replace();
}

// Load and render featured products (safe to call from pages)
function loadFeaturedProducts(containerId = 'featured-products', count = 3) {
    const container = document.getElementById(containerId);
    if (!container) return;
    // Ensure products are loaded, then render
    ensureProductsLoaded().then(() => {
        const featured = allProducts.slice(0, count);
        container.innerHTML = featured.map(product => `
            <div class="product-card bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                <img src="${escapeHtml(product.image||'')}" alt="${escapeHtml(product.name)}" class="w-full h-48 object-cover">
                <div class="p-6">
                    <h3 class="text-xl font-bold mb-2">${escapeHtml(product.name)}</h3>
                    <p class="text-gray-600 mb-4 line-clamp-2">${escapeHtml(product.description)}</p>
                    <div class="flex justify-between items-center">
                        <span class="text-2xl font-bold text-gray-900">$${Number(product.price).toFixed(2)}</span>
                        ${product.stock > 0 ? '<span class="text-green-600 font-semibold">In Stock</span>' : '<span class="text-red-600 font-semibold">Out of Stock</span>'}
                    </div>
                    <div class="mt-4 flex gap-2">
                        <a href="product.html?id=${encodeURIComponent(product.id)}" class="flex-1 bg-gray-900 text-white py-2 px-4 rounded-lg text-center hover:bg-gray-800 transition-colors">View Details</a>
                        ${product.stock > 0 ? `
                            <button class="bg-black text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors add-to-cart-btn" data-id="${product.id}">
                                <i data-feather="shopping-cart"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        // attach listeners for add-to-cart buttons
        container.querySelectorAll('.add-to-cart-btn').forEach(btn => btn.addEventListener('click', onAddToCart));
        feather.replace();
    }).catch(err => {
        console.error('Failed to load featured products:', err);
    });
}

function renderFiltersFromData() {
    // Populate category filter options dynamically
    if (!categoryFilter) return;
    const categories = Array.from(new Set(allProducts.map(p => p.category))).sort();
    // Keep "All Categories" as first option
    categoryFilter.innerHTML = '<option value="all">All Categories</option>' + categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
}

function escapeHtml(s){
    return s.replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]);
}

function applyFilters() {
    const q = (searchInput && searchInput.value || '').trim().toLowerCase();
    const category = (categoryFilter && categoryFilter.value) || 'all';
    const price = (priceFilter && priceFilter.value) || 'all';
    const stock = (stockFilter && stockFilter.value) || 'all';
    const sort = (sortFilter && sortFilter.value) || 'default';

    filteredProducts = allProducts.filter(p => {
        // search
        if (q) {
            const hay = (p.name + ' ' + (p.description||'') + ' ' + (p.tags||[]).join(' ')).toLowerCase();
            if (!hay.includes(q)) return false;
        }
        // category
        if (category !== 'all' && p.category !== category) return false;
        // price
        if (price !== 'all') {
            if (price === '500+') {
                if (!(p.price >= 500)) return false;
            } else {
                const [minS, maxS] = price.split('-');
                const min = Number(minS);
                const max = Number(maxS);
                if (isFinite(min) && p.price < min) return false;
                if (isFinite(max) && p.price > max) return false;
            }
        }
        // stock
        if (stock === 'in-stock' && p.stock <= 0) return false;
        if (stock === 'out-of-stock' && p.stock > 0) return false;

        return true;
    });

    // sorting
    filteredProducts.sort((a,b) => {
        switch(sort) {
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'price-asc': return a.price - b.price;
            case 'price-desc': return b.price - a.price;
            case 'stock-asc': return a.stock - b.stock;
            case 'stock-desc': return b.stock - a.stock;
            default: return 0;
        }
    });

    currentPage = 1;
    render();
}

function render() {
    if (!productsGrid) return;
    const start = (currentPage-1)*PAGE_SIZE;
    const pageItems = filteredProducts.slice(start, start + PAGE_SIZE);

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '';
        showNoResults(true);
        return;
    }
    showNoResults(false);

    productsGrid.innerHTML = pageItems.map(p => productCardHtml(p)).join('');

    // render pagination
    renderPagination();

    // attach card listeners
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => btn.addEventListener('click', onAddToCart));
    document.querySelectorAll('.quick-view-btn').forEach(btn => btn.addEventListener('click', onQuickView));
}

function productCardHtml(p){
    const outOfStock = p.stock <= 0;
    return `
        <div class="bg-white border rounded-lg overflow-hidden shadow-sm">
            <a href="product.html?id=${encodeURIComponent(p.id)}" class="block">
                <img src="${escapeHtml(p.image||'') }" alt="${escapeHtml(p.name)}" class="w-full h-48 object-cover">
            </a>
            <div class="p-4">
                <h3 class="font-semibold text-lg"><a href="product.html?id=${encodeURIComponent(p.id)}">${escapeHtml(p.name)}</a></h3>
                <p class="text-sm text-gray-500">${escapeHtml(p.category)} • Rating: ${p.rating ?? '—'}</p>
                <p class="mt-2 text-xl font-bold">$${Number(p.price).toFixed(2)}</p>
                <p class="text-sm text-gray-600 mt-2 line-clamp-2">${escapeHtml(p.description || '')}</p>
                <div class="mt-4 flex items-center gap-2">
                    <button class="quick-view-btn px-3 py-1 text-sm border rounded text-gray-700" data-id="${p.id}">Quick view</button>
                    <button class="add-to-cart-btn ml-auto px-3 py-1 rounded text-white ${outOfStock? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}" data-id="${p.id}" ${outOfStock? 'disabled' : ''}>${outOfStock? 'Out of stock' : 'Add to cart'}</button>
                </div>
            </div>
        </div>
    `;
}

function renderPagination(){
    // remove existing pager if present
    const existing = document.getElementById('pager');
    if (existing) existing.remove();

    const total = Math.ceil(filteredProducts.length / PAGE_SIZE);
    if (total <= 1) return;

    const pager = document.createElement('div');
    pager.id = 'pager';
    pager.className = 'col-span-full mt-6 flex justify-center items-center gap-2';

    const prev = document.createElement('button');
    prev.textContent = 'Prev';
    prev.className = 'px-3 py-1 border rounded';
    prev.disabled = currentPage === 1;
    prev.addEventListener('click', () => { currentPage = Math.max(1, currentPage-1); render(); });
    pager.appendChild(prev);

    const info = document.createElement('span');
    info.textContent = `Page ${currentPage} of ${total}`;
    info.className = 'px-4';
    pager.appendChild(info);

    const next = document.createElement('button');
    next.textContent = 'Next';
    next.className = 'px-3 py-1 border rounded';
    next.disabled = currentPage === total;
    next.addEventListener('click', () => { currentPage = Math.min(total, currentPage+1); render(); });
    pager.appendChild(next);

    productsGrid.parentNode.appendChild(pager);
}

// Quick view modal
function onQuickView(e){
    const id = e.currentTarget.dataset.id;
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    showModal(p);
}

function showModal(p){
    // create modal container if not exists
    let m = document.getElementById('product-modal');
    if (m) m.remove();
    m = document.createElement('div');
    m.id = 'product-modal';
    m.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
    m.innerHTML = `
        <div class="bg-white rounded-lg max-w-2xl w-full p-6 relative">
            <button id="modal-close" class="absolute top-3 right-3 text-gray-600">✕</button>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <img src="${escapeHtml(p.image||'')}" alt="${escapeHtml(p.name)}" class="w-full h-64 object-cover rounded">
                <div>
                    <h2 class="text-2xl font-bold">${escapeHtml(p.name)}</h2>
                    <p class="text-gray-600 mt-1">${escapeHtml(p.category)} • Rating: ${p.rating ?? '—'}</p>
                    <p class="text-xl font-semibold mt-3">$${p.price.toFixed(2)}</p>
                    <p class="mt-4 text-gray-700">${escapeHtml(p.description||'')}</p>
                    <div class="mt-6 flex gap-2">
                        <button id="modal-add-to-cart" data-id="${p.id}" class="px-4 py-2 bg-blue-600 text-white rounded">Add to cart</button>
                        <button id="modal-close-2" class="px-4 py-2 border rounded">Close</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(m);
    document.getElementById('modal-close').addEventListener('click', () => m.remove());
    document.getElementById('modal-close-2').addEventListener('click', () => m.remove());
    document.getElementById('modal-add-to-cart').addEventListener('click', onAddToCart);
}

// Cart handling
function getCart(){
    try {
        return JSON.parse(localStorage.getItem('dottech_cart') || '[]');
    } catch { return []; }
}

function saveCart(cart){
    localStorage.setItem('dottech_cart', JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge(){
    const cart = getCart();
    const qty = cart.reduce((s,i)=> s + (i.qty||1), 0);

    // Update any global light DOM badges (fallback)
    const fallbackIds = ['cart-count', 'cart-badge', 'cart-badge-legacy'];
    fallbackIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = qty;
            el.classList.toggle('hidden', qty === 0);
        }
    });

    // Update custom navbar shadow root badges if present
    const customNav = document.querySelector('custom-navbar');
    if (customNav && customNav.shadowRoot) {
        try {
            const shadowBadge = customNav.shadowRoot.getElementById('cart-badge');
            if (shadowBadge) {
                shadowBadge.textContent = qty;
                shadowBadge.classList.toggle('hidden', qty === 0);
            }
            const mobileBadge = customNav.shadowRoot.getElementById('mobile-cart-badge');
            if (mobileBadge) {
                mobileBadge.textContent = qty;
            }
        } catch (err) {
            // shadowRoot access may be restricted in some browsers, ignore silently
            console.debug('Could not update navbar shadow badges', err);
        }
    }
}

// --- Cart page rendering helpers ---
function renderCartPage(containerId = 'cart-page') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const cart = getCart();

    container.innerHTML = `
        <div class="max-w-5xl mx-auto p-6">
            <h1 class="text-3xl font-bold mb-6">Your Cart</h1>
            <div id="cart-items-list" class="space-y-4"></div>
            <div id="cart-totals" class="mt-6"></div>
            <div class="mt-6 flex gap-4">
                <button id="clear-cart-btn" class="bg-red-500 text-white px-6 py-3 rounded">Clear Cart</button>
                <button id="checkout-btn" class="bg-green-600 text-white px-6 py-3 rounded">Checkout via WhatsApp</button>
            </div>
        </div>
    `;

    renderCartItemsList();
    renderCartTotals();

    // remove previous delegated handler if present
    if (container._cartHandler) container.removeEventListener('click', container._cartHandler);
    // delegated handler for cart actions
    container._cartHandler = function(e) {
        const clearBtn = e.target.closest('#clear-cart-btn');
        if (clearBtn) {
            e.preventDefault();
            clearCart();
            renderCartPage(containerId);
            return;
        }

        const checkoutBtn = e.target.closest('#checkout-btn');
        if (checkoutBtn) {
            e.preventDefault();
            sendWhatsAppOrder();
            return;
        }

        const qtyBtn = e.target.closest('.update-qty');
        if (qtyBtn) {
            e.preventDefault();
            const id = qtyBtn.dataset.id;
            const op = qtyBtn.dataset.op;
            const cart = getCart();
            const item = cart.find(i => i.id === id);
            if (!item) return;
            if (op === 'incr') item.qty = Math.min((item.qty||1) + 1, 99);
            else item.qty = item.qty - 1;
            if (item.qty <= 0) removeFromCart(id);
            else saveCart(cart);
            renderCartPage(containerId);
            return;
        }

        const removeBtn = e.target.closest('.remove-item');
        if (removeBtn) {
            e.preventDefault();
            const id = removeBtn.dataset.id;
            removeFromCart(id);
            renderCartPage(containerId);
            return;
        }
    };
    container.addEventListener('click', container._cartHandler);
    console.debug('renderCartPage wired: delegated cart handler attached');
}

function renderCartItemsList(listId = 'cart-items-list') {
    const list = document.getElementById(listId);
    if (!list) return;
    const cart = getCart();
    if (!cart || cart.length === 0) {
        list.innerHTML = `
            <div class="text-center py-12">
                <i data-feather="shopping-cart" class="w-16 h-16 text-gray-400 mx-auto mb-4"></i>
                <p class="text-gray-500">Your cart is empty</p>
                <a href="shop.html" class="mt-4 inline-block bg-gray-900 text-white px-6 py-3 rounded">Continue shopping</a>
            </div>
        `;
        feather.replace();
        return;
    }

    list.innerHTML = cart.map(item => `
        <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <img src="${escapeHtml(item.image || '')}" alt="${escapeHtml(item.name)}" class="w-24 h-24 object-cover rounded">
            <div class="flex-1">
                <h4 class="font-semibold">${escapeHtml(item.name)}</h4>
                <div class="flex items-center gap-2 mt-2">
                    <button data-id="${item.id}" data-op="decr" class="update-qty w-8 h-8 bg-gray-200 rounded-full">-</button>
                    <span class="font-semibold">${item.qty}</span>
                    <button data-id="${item.id}" data-op="incr" class="update-qty w-8 h-8 bg-gray-200 rounded-full">+</button>
                </div>
            </div>
            <div class="text-right">
                <p class="font-semibold">$${(item.price * item.qty).toFixed(2)}</p>
                <button data-id="${item.id}" class="remove-item text-red-500 mt-2">Remove</button>
            </div>
        </div>
    `).join('');

    // wire qty buttons and remove
    const qtyButtons = document.querySelectorAll('.update-qty');
    console.debug('renderCartItemsList wiring', qtyButtons.length, 'qty buttons and', document.querySelectorAll('.remove-item').length, 'remove buttons');
    qtyButtons.forEach(btn => btn.addEventListener('click', function(){
        const id = this.dataset.id;
        const op = this.dataset.op;
        const cart = getCart();
        const item = cart.find(i => i.id === id);
        if (!item) return;
        if (op === 'incr') item.qty = Math.min((item.qty||1) + 1, 99);
        else item.qty = item.qty - 1;
        if (item.qty <= 0) removeFromCart(id);
        else saveCart(cart);
        renderCartPage();
    }));

    document.querySelectorAll('.remove-item').forEach(btn => btn.addEventListener('click', function(){
        console.debug('remove-item clicked for', this.dataset.id);
        removeFromCart(this.dataset.id);
        renderCartPage();
    }));

    feather.replace();
}

function renderCartTotals(containerId = 'cart-totals'){
    const container = document.getElementById(containerId);
    if (!container) return;
    const cart = getCart();
    const subtotal = cart.reduce((s,i) => s + (i.price * i.qty), 0);
    container.innerHTML = `
        <div class="flex justify-end">
            <div class="w-full md:w-1/3 bg-white p-4 rounded-lg shadow">
                <div class="flex justify-between mb-2"><span>Subtotal</span><strong>$${subtotal.toFixed(2)}</strong></div>
                <div class="flex justify-between mb-2"><span>Shipping</span><strong>Free</strong></div>
                <div class="border-t pt-4 flex justify-between"><span>Total</span><strong>$${subtotal.toFixed(2)}</strong></div>
            </div>
        </div>
    `;
}

function onAddToCart(e){
    const id = e.currentTarget.dataset.id;
    const p = allProducts.find(x => x.id === id);
    if (!p || p.stock <= 0) return;
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (item) item.qty = Math.min((item.qty||1) + 1, 99);
    else cart.push({ id: p.id, name: p.name, price: p.price, qty: 1 });
    saveCart(cart);
    // brief visual feedback
    e.currentTarget.textContent = 'Added';
    setTimeout(()=>{ if (e.currentTarget) e.currentTarget.textContent = 'Add to cart'; }, 900);
}

// Remove a single item from cart by id
function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => String(item.id) !== String(productId));
    saveCart(cart);
    // If we're on the cart page, re-render
    try { renderCartPage(); } catch (e) {}
}

// Clear the entire cart
function clearCart() {
    localStorage.setItem('dottech_cart', JSON.stringify([]));
    updateCartBadge();
    try { renderCartPage(); } catch (e) {}
    showNotification('Cart cleared', 'info');
}

// Send WhatsApp order with cart contents
function sendWhatsAppOrder() {
    const cart = getCart();
    if (!cart || cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    const orderDetails = cart.map(item => `- ${item.name} x${item.qty}`).join('\n');
    const total = cart.reduce((s,i) => s + (i.price * i.qty), 0).toFixed(2);
    const message = `Hello DotTech 👋, I'd like to order:\n\n${orderDetails}\n\nTotal: $${total}`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/963995505964?text=${encoded}`);
}

// Minimal notification helper (reusable)
function showNotification(message, type = 'info') {
    // remove existing
    const existing = document.querySelector('.dt-notification');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = `dt-notification fixed top-6 right-6 z-50 px-5 py-3 rounded shadow-lg ${type === 'success' ? 'bg-green-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`;
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// Initialization wiring
function initShop() {
    // query DOM elements now that DOMContentLoaded has fired
    productsGrid = document.getElementById('products-grid');
    loadingEl = document.getElementById('loading');
    noResultsEl = document.getElementById('no-results');
    searchInput = document.getElementById('search-input');
    categoryFilter = document.getElementById('category-filter');
    priceFilter = document.getElementById('price-filter');
    stockFilter = document.getElementById('stock-filter');
    sortFilter = document.getElementById('sort-filter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 250));
        console.debug('search-input found and listener attached');
    } else {
        console.debug('search-input NOT found');
    }
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    if (priceFilter) priceFilter.addEventListener('change', applyFilters);
    if (stockFilter) stockFilter.addEventListener('change', applyFilters);
    if (sortFilter) sortFilter.addEventListener('change', applyFilters);

    updateCartBadge();
    // start loading products and keep the promise globally available
    productsLoadedPromise = loadProductsFromJSON();
}

// helpers
function debounce(fn, wait){
    let t;
    return function(...args){
        clearTimeout(t); t = setTimeout(()=> fn.apply(this,args), wait);
    }
}

// kick off
document.addEventListener('DOMContentLoaded', initShop);
