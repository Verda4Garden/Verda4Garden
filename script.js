window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
});

let allProducts = {};
let translations = {};
let currentLang = 'id';
let cart = [];
let darkMode = false;

const uiTranslations = {
  id: {
    petsTitle: "Pilih Nominal - Pets",
    shecklesTitle: "Pilih Nominal - Sheckles",
    sprinklerTitle: "Pilih Nominal - Sprinkler",
    bundleTitle: "Pilih Nominal - Bundles",
    cartTitle: "Keranjang",
    emptyCart: "Belum ada item yang dipilih.",
    totalText: "Total",
    buyerNameLabel: "Masukkan Data Akun",
    paymentMethodLabel: "Pilih Pembayaran",
    promoCodeLabel: "Kode Promo",
    checkoutBtn: "Pesan Sekarang!",
    paymentMethods: ["Pilih metode pembayaran", "GoPay", "Dana", "ShopeePay", "QRIS", "COD"],
    promoInvalid: "Kode promo tidak valid.",
    promoApplied: "Kode promo berhasil diterapkan!",
    promoExpired: "Kode promo sudah kedaluwarsa.",
    checkoutConfirm: "Apakah Anda yakin ingin checkout?",
    buyerNameError: "Nama minimal 3 karakter.",
    paymentMethodError: "Pilih metode pembayaran.",
  },
  en: {
    petsTitle: "Select Nominal - Pets",
    shecklesTitle: "Select Nominal - Sheckles",
    sprinklerTitle: "Select Nominal - Sprinkler",
    bundleTitle: "Select Nominal - Bundles",
    cartTitle: "Cart",
    emptyCart: "No items selected yet.",
    totalText: "Total",
    buyerNameLabel: "Enter Account Data",
    paymentMethodLabel: "Select Payment",
    promoCodeLabel: "Promo Code",
    checkoutBtn: "Order Now!",
    paymentMethods: ["Select payment method", "GoPay", "Dana", "ShopeePay", "QRIS", "COD"],
    promoInvalid: "Invalid promo code.",
    promoApplied: "Promo code applied successfully!",
    promoExpired: "Promo code has expired.",
    checkoutConfirm: "Are you sure you want to checkout?",
    buyerNameError: "Name must be at least 3 characters.",
    paymentMethodError: "Please select a payment method.",
    checkTransaction: "Check Transaction",
    lastTransactionTitle: "Last Transaction Details",
    noTransaction: "No transaction has been made yet.",
  }
};

const promoCodes = {
    "SAVE10": { discount: 0.10 },
    "HEMAT20": { discount: 0.20 },
    "V4GJAYA": { discount: 0.20, expiry: "2025-07-10" }
};

async function loadProductData() {
  try {
    const response = await fetch('products.json');
    const data = await response.json();
    allProducts = data.allProducts;
    // Merge translations
    translations = {
      id: { ...uiTranslations.id, ...data.translations.id },
      en: { ...uiTranslations.en, ...data.translations.en }
    };
  } catch (error) {
    console.error("Could not load product data:", error);
  }
}

function formatPrice(num) {
    return 'Rp ' + num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function applyTranslations() {
    document.getElementById('petsTitle').textContent = translations[currentLang].petsTitle;
    document.getElementById('shecklesTitle').textContent = translations[currentLang].shecklesTitle;
    document.getElementById('sprinklerTitle').textContent = translations[currentLang].sprinklerTitle;
    document.getElementById('bundleTitle').textContent = translations[currentLang].bundleTitle;
    document.getElementById('cartTitle').textContent = translations[currentLang].cartTitle;
    document.getElementById('labelBuyerName').textContent = translations[currentLang].buyerNameLabel;
    document.getElementById('labelPaymentMethod').textContent = translations[currentLang].paymentMethodLabel;
    document.getElementById('labelPromoCode').textContent = translations[currentLang].promoCodeLabel;
    document.getElementById('checkoutBtn').textContent = translations[currentLang].checkoutBtn;
    
    const paymentMethodSelect = document.getElementById('paymentMethod');
    paymentMethodSelect.innerHTML = '';
    translations[currentLang].paymentMethods.forEach((method, index) => {
        const option = document.createElement('option');
        option.value = index === 0 ? "" : method;
        option.textContent = method;
        if (index === 0) option.disabled = true;
        paymentMethodSelect.appendChild(option);
    });
    paymentMethodSelect.value = "";

    renderAllProducts();
    updateCart();
}

function renderAllProducts() {
    const containers = {
        pet: document.getElementById('petList'),
        sheckles: document.getElementById('shecklesList'),
        sprinkler: document.getElementById('sprinklerList'),
        bundle: document.getElementById('bundleList'),
        game: document.getElementById('gameList')
    };

    for (let key in containers) {
        if (containers[key]) containers[key].innerHTML = '';
    }

    const isMobileView = localStorage.getItem('deviceType') === 'mobile';

    Object.entries(allProducts).forEach(([id, item]) => {
        const container = containers[item.category];
        if (!container) return;

        let translationKey = item.category;
        if (item.category === 'pet') translationKey = 'pets';
        if (item.category === 'bundle') translationKey = 'bundles';

        const name = translations[currentLang][translationKey][id]?.name || id;
        const desc = translations[currentLang][translationKey][id]?.desc;
        const priceDisplay = formatPrice(item.price);

        const div = document.createElement('div');
        div.className = 'product-item';
        div.dataset.id = id;

        div.innerHTML = `
            ${item.emoji ? `<div class="pet-icon">${item.emoji}</div>` : ''}
            <strong>${name}</strong>
            <span>${priceDisplay}</span>
            ${desc ? `<p class="product-description">${desc}</p>` : ''}
            <button class="add-to-cart-btn">Tambah</button>
        `;

        const addToCartBtn = div.querySelector('.add-to-cart-btn');
        
        if (isMobileView) {
            div.onclick = (e) => {
                // Prevent card click from triggering if the button was clicked
                if (e.target.classList.contains('add-to-cart-btn')) return;
                
                // Toggle expanded view for description and button
                div.classList.toggle('expanded');
            };
            addToCartBtn.onclick = (e) => {
                // Pass the button element itself for the animation start point
                addToCart(id, name, item.price, item.emoji, e.currentTarget);
            };
        } else {
            // Desktop view: click anywhere on the card adds to cart
            // Pass the card element for the animation start point
            div.onclick = (e) => addToCart(id, name, item.price, item.emoji, e.currentTarget);
            // Hide the button in desktop view as it's not needed
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

    // Animate to cart
    setTimeout(() => {
        flyingIcon.style.left = `${endRect.left + endRect.width / 2}px`;
        flyingIcon.style.top = `${endRect.top + endRect.height / 2}px`;
        flyingIcon.style.transform = 'scale(0.1)';
        flyingIcon.style.opacity = '0';
    }, 10);

    // Remove after animation
    setTimeout(() => {
        document.body.removeChild(flyingIcon);
        // Add a little shake to the cart
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
            audio.play();
        }
    } else {
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
    }, 500); // Delay update to let animation play
}

function decreaseQuantity(id) {
    const itemIndex = cart.findIndex(i => i.id === id);
    if (itemIndex > -1) {
        if (cart[itemIndex].qty > 1) {
            cart[itemIndex].qty--;
        } else {
            cart.splice(itemIndex, 1);
        }
    }
    updateCart();
    highlightSelectedProducts();
}

function updateCart() {
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalDisplay = document.getElementById('cartTotal');
    const discountDisplay = document.getElementById('discountDisplay');
    const promoCodeInput = document.getElementById('promoCode');
    
    if (cart.length === 0) {
        cartItemsContainer.textContent = translations[currentLang].emptyCart;
        cartTotalDisplay.textContent = `${translations[currentLang].totalText}: ${formatPrice(0)}`;
        discountDisplay.style.display = "none";
        validateForm();
        return;
    }

    let html = "";
    let subtotal = 0;
    cart.forEach(item => {
        html += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <span>${item.name}</span>
                    <span>${formatPrice(item.price)}</span>
                </div>
                <div class="cart-item-controls">
                    <button onclick="decreaseQuantity('${item.id}')">-</button>
                    <span>${item.qty}</span>
                    <button onclick="addToCart('${item.id}', '${item.name}', ${item.price}, '${item.emoji}')">+</button>
                </div>
            </div>
        `;
        subtotal += item.price * item.qty;
    });
    cartItemsContainer.innerHTML = html;

    const promoCode = promoCodeInput.value.trim().toUpperCase();
    const promo = promoCodes[promoCode];
    let discount = 0;
    const promoMessageContainer = document.getElementById('promoCodeMessage');

    if (promo) {
        const isExpired = promo.expiry && new Date(promo.expiry) < new Date();
        if (isExpired) {
            promoMessageContainer.textContent = translations[currentLang].promoExpired;
            promoMessageContainer.style.display = 'block';
            promoMessageContainer.style.color = 'var(--primary-text)';
            discountDisplay.style.display = "none";
        } else {
            discount = subtotal * promo.discount;
            discountDisplay.textContent = `Diskon: -${formatPrice(discount)}`;
            discountDisplay.style.display = "block";
            promoMessageContainer.textContent = translations[currentLang].promoApplied;
            promoMessageContainer.style.display = 'block';
            promoMessageContainer.style.color = '#28a745'; // Green for success
        }
    } else {
        discountDisplay.style.display = "none";
        if (promoCodeInput.value.trim() !== '') {
            promoMessageContainer.textContent = translations[currentLang].promoInvalid;
            promoMessageContainer.style.display = 'block';
            promoMessageContainer.style.color = 'var(--primary-text)';
        } else {
            promoMessageContainer.style.display = 'none';
        }
    }

    const total = subtotal - discount;
    cartTotalDisplay.textContent = `${translations[currentLang].totalText}: ${formatPrice(total)}`;
    validateForm();
}

function highlightSelectedProducts() {
    document.querySelectorAll('.product-item').forEach(el => {
        if (cart.some(item => item.id === el.dataset.id)) {
            el.classList.add('selected');
        } else {
            el.classList.remove('selected');
        }
    });
}

function validateForm() {
    const buyerNameInput = document.getElementById('buyerName');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const checkoutBtn = document.getElementById('checkoutBtn');

    const isBuyerNameValid = buyerNameInput.value.trim().length >= 3;
    const isPaymentMethodValid = paymentMethodSelect.value !== "";
    const isCartNotEmpty = cart.length > 0;

    checkoutBtn.disabled = !(isBuyerNameValid && isPaymentMethodValid && isCartNotEmpty);
}

function checkout(event) {
    event.preventDefault();
    const buyerName = document.getElementById('buyerName').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const promoCode = document.getElementById('promoCode').value.trim().toUpperCase();
    
    let subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    let discount = 0;
    const promo = promoCodes[promoCode];
    if (promo) {
        const isExpired = promo.expiry && new Date(promo.expiry) < new Date();
        if (!isExpired) {
            discount = subtotal * promo.discount;
        }
    }
    const total = subtotal - discount;

    // Generate unique invoice ID
    const invoiceId = `V4G-${Date.now()}`;

    let message = `Halo, saya ingin memesan:\n\n`;
    message += `*Nomor Invoice: ${invoiceId}*\n\n`;
    cart.forEach(item => {
        message += `- ${item.name} (x${item.qty}) - ${formatPrice(item.price * item.qty)}\n`;
    });
    message += `\nSubtotal: ${formatPrice(subtotal)}\n`;
    if (discount > 0) {
        message += `Diskon (${promoCode}): -${formatPrice(discount)}\n`;
    }
    message += `Total: ${formatPrice(total)}\n\n`;
    message += `Nama ROBLOX: ${buyerName}\n`;
    message += `Metode Pembayaran: ${paymentMethod}\n\n`;
    message += `Mohon diproses segera. Terima kasih!`;

    const whatsappUrl = `https://wa.me/6285651205765?text=${encodeURIComponent(message)}`;
    
    // Show confirmation modal with Invoice ID
    showCheckoutSuccessModal(invoiceId, whatsappUrl);

    // Save transaction to local storage
    const transaction = {
        invoiceId,
        buyerName,
        paymentMethod,
        promoCode,
        cart: [...cart],
        subtotal,
        discount,
        total,
        date: new Date().toLocaleString()
    };
    localStorage.setItem(invoiceId, JSON.stringify(transaction));
    localStorage.setItem('lastTransaction', JSON.stringify(transaction)); // For modal

    // Reset state
    cart = [];
    document.getElementById('checkoutForm').reset();
    document.getElementById('buyerName').value = '';
    updateCart();
    highlightSelectedProducts();
}

// --- Supabase Setup ---
const SUPABASE_URL = 'https://ombquiuawqvxbzqstuii.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tYnF1aXVhd3F2eGJ6cXN0dWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MzM2MjksImV4cCI6MjA2NzMwOTYyOX0.zAyaE7tAAQY4-cbPQinnBDdqIjm5OvKFwUV12BmXY3Q';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function displayReviews() {
    const reviewList = document.getElementById('review-list');
    if (!reviewList) return;

    const { data: reviews, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        return;
    }

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

document.addEventListener('DOMContentLoaded', async () => {
    await loadProductData();
    
    const langSelector = document.getElementById('langSelector');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const buyerNameInput = document.getElementById('buyerName');
    const paymentMethodSelect = document.getElementById('paymentMethod');
    const checkoutForm = document.getElementById('checkoutForm');
    const modal = document.getElementById('transactionModal');
    const closeBtn = document.querySelector('.close-button');

    langSelector.addEventListener('change', (e) => {
        currentLang = e.target.value;
        applyTranslations();
        const reviewForm = document.getElementById('reviewForm');
        const reviewImageInput = document.getElementById('reviewImage');
        const imagePreview = document.getElementById('imagePreview');
    
        if (reviewForm) {
            reviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const ratingEl = reviewForm.querySelector('input[name="rating"]:checked');
                if (!ratingEl) {
                    alert('Silakan pilih rating bintang.');
                    return;
                }
                const rating = ratingEl.value;
                const text = document.getElementById('reviewText').value;
                const imageFile = reviewImageInput.files[0];
                let imageUrl = null;

                // Upload image to Supabase Storage if it exists
                if (imageFile) {
                    const filePath = `reviews/${Date.now()}-${imageFile.name}`;
                    const { data: uploadData, error: uploadError } = await supabase
                        .storage
                        .from('reviews') // Make sure you have a bucket named 'reviews'
                        .upload(filePath, imageFile);

                    if (uploadError) {
                        console.error('Error uploading image:', uploadError);
                    } else {
                        const { data: urlData } = supabase.storage.from('reviews').getPublicUrl(filePath);
                        imageUrl = urlData.publicUrl;
                    }
                }

                // Insert review into the database
                const { error: insertError } = await supabase
                    .from('reviews')
                    .insert([{ rating, text, image_url: imageUrl }]);

                if (insertError) {
                    console.error('Error saving review:', insertError);
                } else {
                    displayReviews();
                    reviewForm.reset();
                    imagePreview.style.display = 'none';
                }
            });
        }
    
        if (reviewImageInput) {
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
    
        displayReviews(); // Initial display
    });

    darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        darkMode = !darkMode;
    });

    buyerNameInput.addEventListener('input', validateForm);
    paymentMethodSelect.addEventListener('change', validateForm);
    checkoutForm.addEventListener('submit', checkout);

    // Keep modal functionality for last transaction view
    const lastTxBtn = document.getElementById('checkTransactionBtn'); // Assuming you might want a quick view button
    if(lastTxBtn) {
        lastTxBtn.addEventListener('click', showTransactionModal);
    }
    if(closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    }
    if(modal) {
        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                modal.classList.remove('active');
            }
        });
    }

    applyTranslations();

    // Scroll animations
    const header = document.querySelector('header');
    const productBanner = document.querySelector('.product-banner');

    window.addEventListener('scroll', () => {
        // Header shadow on scroll
        if (window.scrollY > 20) {
            header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        } else {
            header.style.boxShadow = 'none';
        }

        // Parallax for product banner
        const scrollPosition = window.pageYOffset;
        if (productBanner) {
            productBanner.style.transform = `translateY(${scrollPosition * 0.2}px)`;
        }
    });
    const reviewForm = document.getElementById('reviewForm');
    const reviewImageInput = document.getElementById('reviewImage');
    const imagePreview = document.getElementById('imagePreview');

    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const ratingEl = reviewForm.querySelector('input[name="rating"]:checked');
            if (!ratingEl) {
                alert('Silakan pilih rating bintang.');
                return;
            }
            const rating = ratingEl.value;
            const text = document.getElementById('reviewText').value;
            const imageFile = reviewImageInput.files[0];
            let imageUrl = null;

            // Upload image to Supabase Storage if it exists
            if (imageFile) {
                const filePath = `reviews/${Date.now()}-${imageFile.name}`;
                const { data: uploadData, error: uploadError } = await supabase
                    .storage
                    .from('reviews') // Make sure you have a bucket named 'reviews'
                    .upload(filePath, imageFile);

                if (uploadError) {
                    console.error('Error uploading image:', uploadError);
                } else {
                    const { data: urlData } = supabase.storage.from('reviews').getPublicUrl(filePath);
                    imageUrl = urlData.publicUrl;
                }
            }

            // Insert review into the database
            const { error: insertError } = await supabase
                .from('reviews')
                .insert([{ rating, text, image_url: imageUrl }]);

            if (insertError) {
                console.error('Error saving review:', insertError);
            } else {
                displayReviews();
                reviewForm.reset();
                imagePreview.style.display = 'none';
            }
        });
    }

    if (reviewImageInput) {
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

    displayReviews();
});

function showCheckoutSuccessModal(invoiceId, whatsappUrl) {
    const modal = document.getElementById('transactionModal');
    const modalTitle = document.getElementById('modalTitle');
    const detailsContainer = document.getElementById('transactionDetails');
    
    modalTitle.textContent = "Pesanan Berhasil Dibuat!";
    detailsContainer.innerHTML = `
        <p>Terima kasih telah memesan!</p>
        <p>Nomor Invoice Anda adalah:</p>
        <h2 style="color: var(--primary-text); text-align: center; margin: 15px 0;">${invoiceId}</h2>
        <p>Silakan simpan nomor ini untuk mengecek status transaksi Anda nanti.</p>
        <p>Klik tombol di bawah untuk melanjutkan pembayaran melalui WhatsApp.</p>
        <a href="${whatsappUrl}" target="_blank" class="auth-button" style="text-decoration: none; display: block; text-align: center; margin-top: 20px;" id="continueToWaBtn">Lanjutkan ke WhatsApp</a>
    `;
    
    modal.classList.add('active');

    // Reset form after showing modal and user proceeds
    document.getElementById('continueToWaBtn').addEventListener('click', () => {
        // Reset state
        cart = [];
        document.getElementById('checkoutForm').reset();
        document.getElementById('buyerName').value = '';
        updateCart();
        highlightSelectedProducts();
        
        // Optionally close modal after clicking
        // setTimeout(() => {
        //     modal.style.display = "none";
        // }, 500);
    });
}

function showTransactionModal() {
    const modal = document.getElementById('transactionModal');
    const modalTitle = document.getElementById('modalTitle');
    const detailsContainer = document.getElementById('transactionDetails');
    const transactionData = localStorage.getItem('lastTransaction');

    if (transactionData) {
        const tx = JSON.parse(transactionData);
        let detailsHtml = `
            <p><strong>Tanggal:</strong> ${tx.date}</p>
            <p><strong>Nama ROBLOX:</strong> ${tx.buyerName}</p>
            <p><strong>Metode Pembayaran:</strong> ${tx.paymentMethod}</p>
            <hr>
            <h4>Item yang Dibeli:</h4>
        `;
        tx.cart.forEach(item => {
            detailsHtml += `<p>- ${item.name} (x${item.qty}) - ${formatPrice(item.price * item.qty)}</p>`;
        });
        detailsHtml += `<hr>`;
        detailsHtml += `<p><strong>Subtotal:</strong> ${formatPrice(tx.subtotal)}</p>`;
        if (tx.discount > 0) {
            detailsHtml += `<p><strong>Diskon (${tx.promoCode}):</strong> -${formatPrice(tx.discount)}</p>`;
        }
        detailsHtml += `<p><strong>Total Pembayaran:</strong> ${formatPrice(tx.total)}</p>`;
        
        detailsContainer.innerHTML = detailsHtml;
    } else {
        detailsContainer.innerHTML = `<p>${translations[currentLang].noTransaction}</p>`;
    }
    
    modalTitle.textContent = translations[currentLang].lastTransactionTitle;
    modal.classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
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
});