document.addEventListener('DOMContentLoaded', async () => {
    // =================================================================
    // 1. SETUP
    // =================================================================
    console.log("DOM Content Loaded. Initializing script...");

    // --- Supabase Client (Initialized only when needed) ---
    let supabase;
    const SUPABASE_URL = 'https://ombquiuawqvxbzqstuii.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYnF1aXVhd3F2eGJ6cXN0dWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzM2MjksImV4cCI6MjA2NzMwOTYyOX0.zAyaE7tAAQY4-cbPQinnBDdqIjm5OvKFwUV12BmXY3Q';

    function initSupabase() {
        if (!supabase && window.supabase) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log("Supabase client initialized.");
        }
    }

    // --- Global State ---
    let allProducts = {};
    let translations = {};
    let cart = [];

    // =================================================================
    // 2. DATA LOADING
    // =================================================================

    async function loadData() {
        try {
            console.log("Fetching products.json...");
            const response = await fetch('products.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log("products.json loaded successfully:", data);
            allProducts = data.allProducts || {};
            translations = data.translations || {};
        } catch (error) {
            console.error("FATAL: Could not load or parse products.json:", error);
        }
    }

    // =================================================================
    // 3. RENDERING FUNCTIONS
    // =================================================================

    function renderProducts() {
        console.log("renderProducts called.");
        const containers = {
            pet: document.getElementById('petList'),
            sheckles: document.getElementById('shecklesList'),
            sprinkler: document.getElementById('sprinklerList'),
            bundle: document.getElementById('bundleList'),
        };

        // Clear previous content
        Object.values(containers).forEach(c => { if (c) c.innerHTML = ''; });

        if (Object.keys(allProducts).length === 0) {
            console.error("Cannot render products: allProducts is empty.");
            return;
        }

        console.log(`Rendering ${Object.keys(allProducts).length} products...`);

        Object.entries(allProducts).forEach(([id, item]) => {
            const container = containers[item.category];
            if (!container) return;

            // Simplified and safer translation logic
            const lang = 'id'; // Hardcoding for stability
            let name = id;
            let desc = '';
            try {
                const t_cat = translations[lang][item.category] || translations[lang][item.category === 'pet' ? 'pets' : 'bundles'] || {};
                const t_item = t_cat[id];
                if (typeof t_item === 'object' && t_item !== null) {
                    name = t_item.name || name;
                    desc = t_item.desc || '';
                } else if (typeof t_item === 'string') {
                    name = t_item;
                }
            } catch (e) {
                console.warn(`Could not find translation for ${id}`, e);
            }

            const priceDisplay = formatPrice(item.price);

            const div = document.createElement('div');
            div.className = 'product-item';
            div.dataset.id = id;
            div.innerHTML = `
                ${item.emoji ? `<div class="pet-icon">${item.emoji}</div>` : ''}
                <strong>${name}</strong>
                <span>${priceDisplay}</span>
                <p class="product-description">${desc}</p>
            `;
            div.onclick = (e) => addToCart(id, name, item.price, e.currentTarget);
            container.appendChild(div);
        });
        console.log("Product rendering finished.");
    }
    
    function updateCart() {
        const cartItemsContainer = document.getElementById('cartItems');
        const cartTotalDisplay = document.getElementById('cartTotal');
        if (!cartItemsContainer || !cartTotalDisplay) return;

        if (cart.length === 0) {
            cartItemsContainer.textContent = "Belum ada item yang dipilih.";
            cartTotalDisplay.textContent = `Total: ${formatPrice(0)}`;
            return;
        }

        let html = "";
        let subtotal = 0;
        cart.forEach(item => {
            html += `<div class="cart-item"><span>${item.name} (x${item.qty})</span> <span>${formatPrice(item.price * item.qty)}</span></div>`;
            subtotal += item.price * item.qty;
        });
        cartItemsContainer.innerHTML = html;
        cartTotalDisplay.textContent = `Total: ${formatPrice(subtotal)}`;
    }

    async function displayReviews() {
        const reviewList = document.getElementById('review-list');
        if (!reviewList) return;
        if (!supabase) initSupabase(); // Ensure supabase is ready

        const { data, error } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
        if (error) return console.error('Error fetching reviews:', error);

        reviewList.innerHTML = '';
        data.forEach(review => {
            const card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = `
                <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
                <p class="review-text">${review.text}</p>
                ${review.image_url ? `<img src="${review.image_url}" alt="Review Image" class="review-image">` : ''}
            `;
            reviewList.appendChild(card);
        });
    }

    // =================================================================
    // 4. EVENT HANDLERS
    // =================================================================

    function flyToCart(startElement) {
        const flyingIcon = document.createElement('div');
        flyingIcon.className = 'fly-to-cart';
        flyingIcon.textContent = '🛒';
        document.body.appendChild(flyingIcon);

        const startRect = startElement.getBoundingClientRect();
        const cartEl = document.getElementById('cartItems');
        const endRect = cartEl.getBoundingClientRect();

        flyingIcon.style.left = `${startRect.left + startRect.width / 2}px`;
        flyingIcon.style.top = `${startRect.top + startRect.height / 2}px`;

        setTimeout(() => {
            flyingIcon.style.left = `${endRect.left + endRect.width / 2}px`;
            flyingIcon.style.top = `${endRect.top + endRect.height / 2}px`;
            flyingIcon.style.transform = 'scale(0.1)';
            flyingIcon.style.opacity = '0';
        }, 10);

        setTimeout(() => {
            document.body.removeChild(flyingIcon);
            cartEl.classList.add('shake');
            setTimeout(() => cartEl.classList.remove('shake'), 300);
        }, 1000);
    }

    function addToCart(id, name, price) {
        const productEl = document.querySelector(`.product-item[data-id='${id}']`);
        flyToCart(productEl);

        const existingItem = cart.find(i => i.id === id);
        if (existingItem) {
            existingItem.qty++;
        } else {
            cart.push({ id, name, price, qty: 1 });
        }
        
        setTimeout(() => {
            updateCart();
        }, 500);
    }

    async function handleReviewSubmit(e) {
        e.preventDefault();
        if (!supabase) initSupabase();
        
        const form = e.target;
        const ratingEl = form.querySelector('input[name="rating"]:checked');
        if (!ratingEl) return alert('Silakan pilih rating bintang.');

        const text = form.querySelector('#reviewText').value;
        const imageFile = form.querySelector('#reviewImage').files[0];
        let imageUrl = null;

        if (imageFile) {
            const filePath = `reviews/${Date.now()}-${imageFile.name}`;
            const { error: uploadError } = await supabase.storage.from('reviews').upload(filePath, imageFile);
            if (uploadError) return console.error('Error uploading image:', uploadError);
            const { data: urlData } = supabase.storage.from('reviews').getPublicUrl(filePath);
            imageUrl = urlData.publicUrl;
        }

        const { error: insertError } = await supabase.from('reviews').insert([{ rating: ratingEl.value, text, image_url: imageUrl }]);
        if (insertError) return console.error('Error saving review:', insertError);

        displayReviews();
        form.reset();
        document.getElementById('imagePreview').style.display = 'none';
    }

    function formatPrice(num) {
        return 'Rp ' + (num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0");
    }

    // =================================================================
    // 5. INITIALIZATION
    // =================================================================
    
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';

    await loadData();
    renderProducts();
    updateCart();
    displayReviews();

    // Setup Intersection Observer for animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('.checkout-step, .ratings-card, .help-card, .cart-summary-card');
    elementsToAnimate.forEach(el => {
        observer.observe(el);
    });

    // Setup other event listeners
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) reviewForm.addEventListener('submit', handleReviewSubmit);
    
    const reviewImageInput = document.getElementById('reviewImage');
    const imagePreview = document.getElementById('imagePreview');
    if (reviewImageInput && imagePreview) {
        reviewImageInput.addEventListener('change', () => {
            const file = reviewImageInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }
});