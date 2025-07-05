// =================================================================
// GLOBAL VARIABLES & SETUP
// =================================================================
let allProducts = {};
let translations = {};
let currentLang = 'id';
let cart = [];

const SUPABASE_URL = 'https://ombquiuawqvxbzqstuii.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYnF1aXVhd3F2eGJ6cXN0dWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzM2MjksImV4cCI6MjA2NzMwOTYyOX0.zAyaE7tAAQY4-cbPQinnBDdqIjm5OvKFwUV12BmXY3Q';
let supabase;

// =================================================================
// CORE FUNCTIONS
// =================================================================

async function loadProductData() {
  try {
    const response = await fetch('products.json');
    allProducts = (await response.json()).allProducts;
  } catch (error) {
    console.error("Could not load product data:", error);
  }
}

function formatPrice(num) {
    return 'Rp ' + (num ? num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0");
}

function renderAllProducts() {
    const containers = {
        pet: document.getElementById('petList'),
        sheckles: document.getElementById('shecklesList'),
        sprinkler: document.getElementById('sprinklerList'),
        bundle: document.getElementById('bundleList'),
    };

    Object.values(containers).forEach(c => { if(c) c.innerHTML = ''; });

    const isMobileView = localStorage.getItem('deviceType') === 'mobile';

    Object.entries(allProducts).forEach(([id, item]) => {
        const container = containers[item.category];
        if (!container) return;

        const name = item.name || id;
        const desc = item.desc || '';
        const priceDisplay = formatPrice(item.price);

        const div = document.createElement('div');
        div.className = 'product-item';
        div.dataset.id = id;

        div.innerHTML = `
            ${item.emoji ? `<div class="pet-icon">${item.emoji}</div>` : ''}
            <strong>${name}</strong>
            <span>${priceDisplay}</span>
            <p class="product-description">${desc}</p>
            <button class="add-to-cart-btn">Tambah</button>
        `;

        const addToCartBtn = div.querySelector('.add-to-cart-btn');
        
        if (isMobileView) {
            div.onclick = (e) => {
                if (e.target.classList.contains('add-to-cart-btn')) return;
                div.classList.toggle('expanded');
            };
            addToCartBtn.onclick = (e) => addToCart(id, name, item.price, item.emoji, e.currentTarget);
        } else {
            div.onclick = (e) => addToCart(id, name, item.price, item.emoji, e.currentTarget);
            if(addToCartBtn) addToCartBtn.style.display = 'none';
        }
        
        container.appendChild(div);
    });
    highlightSelectedProducts();
}

function flyToCart(startElement, emoji) {
    const flyingIcon = document.createElement('div');
    flyingIcon.className = 'fly-to-cart';
    flyingIcon.textContent = emoji || '🛒';
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

function addToCart(id, name, price, emoji, startElement) {
    const isMobileView = localStorage.getItem('deviceType') === 'mobile';

    if (isMobileView) {
        const audio = document.getElementById('cart-sound');
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.error("Audio play failed:", e));
        }
    } else if (startElement) {
        flyToCart(startElement, emoji);
    }

    const existingItem = cart.find(i => i.id === id);
    if (existingItem) {
        existingItem.qty++;
    } else {
        cart.push({ id, name, price, qty: 1, emoji });
    }
    
    setTimeout(() => {
        updateCart();
        highlightSelectedProducts();
    }, isMobileView ? 0 : 500);
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

function highlightSelectedProducts() {
    document.querySelectorAll('.product-item').forEach(el => {
        el.classList.toggle('selected', cart.some(item => item.id === el.dataset.id));
    });
}

// =================================================================
// REVIEW SYSTEM FUNCTIONS
// =================================================================

async function displayReviews() {
    const reviewList = document.getElementById('review-list');
    if (!reviewList) return;

    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) return console.error('Error fetching reviews:', error);

    reviewList.innerHTML = '';
    reviews.forEach(review => {
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

async function handleReviewSubmit(e) {
    e.preventDefault();
    const reviewForm = e.target;
    const ratingEl = reviewForm.querySelector('input[name="rating"]:checked');
    const reviewText = document.getElementById('reviewText');
    const reviewImageInput = document.getElementById('reviewImage');
    const imagePreview = document.getElementById('imagePreview');

    if (!ratingEl) return alert('Silakan pilih rating bintang.');

    const rating = ratingEl.value;
    const text = reviewText.value;
    const imageFile = reviewImageInput.files[0];
    let imageUrl = null;

    if (imageFile) {
        const filePath = `reviews/${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('reviews').upload(filePath, imageFile);
        if (uploadError) return console.error('Error uploading image:', uploadError);
        
        const { data: urlData } = supabase.storage.from('reviews').getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
    }

    const { error: insertError } = await supabase.from('reviews').insert([{ rating, text, image_url: imageUrl }]);
    if (insertError) return console.error('Error saving review:', insertError);

    displayReviews();
    reviewForm.reset();
    if(imagePreview) imagePreview.style.display = 'none';
}

// =================================================================
// MAIN SCRIPT EXECUTION
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Hide loader
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';

    // Load initial data
    await loadProductData();
    renderAllProducts();
    updateCart();
    displayReviews();

    // Setup Event Listeners
    const checkoutForm = document.getElementById('checkoutForm');
    if(checkoutForm) checkoutForm.addEventListener('submit', (e) => e.preventDefault());

    const reviewForm = document.getElementById('reviewForm');
    if(reviewForm) reviewForm.addEventListener('submit', handleReviewSubmit);

    const reviewImageInput = document.getElementById('reviewImage');
    const imagePreview = document.getElementById('imagePreview');
    if(reviewImageInput && imagePreview) {
        reviewImageInput.addEventListener('change', () => {
            const file = reviewImageInput.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    imagePreview.style.display = 'block';
                }
                reader.readAsDataURL(file);
            }
        });
    }
});