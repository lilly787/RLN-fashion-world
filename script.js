document.addEventListener('DOMContentLoaded', () => {
    // 1. Scroll effect for navbar (sticky scrolled style)
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Highlight active nav link based on scroll position
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a');

    function highlightNavLink() {
        let currentSection = 'home'; // default to home
        const scrollPosition = window.scrollY + 150; // offset for fixed navbar

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollPosition >= top && scrollPosition < top + height) {
                currentSection = id;
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', highlightNavLink);
    highlightNavLink(); // run once on load

    // 3. Intersection Observer for reveal animations
    const reveals = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        root: null,
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    });

    reveals.forEach(reveal => {
        revealObserver.observe(reveal);
    });

    // 4. Shop Filtering Logic
    const filterBtns = document.querySelectorAll('.category-btn');
    const productCards = document.querySelectorAll('.product-card');

    if (filterBtns.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                productCards.forEach(card => {
                    if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                        card.style.display = 'block';
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'translateY(0)';
                        }, 50);
                    } else {
                        card.style.opacity = '0';
                        card.style.transform = 'translateY(20px)';
                        setTimeout(() => {
                            card.style.display = 'none';
                        }, 300); // Wait for transition
                    }
                });
            });
        });
    }
    // --- CART FUNCTIONALITY ---
    
    // State
    let cart = JSON.parse(localStorage.getItem('rln_cart')) || [];

    // Elements
    const cartIcon = document.getElementById('cart-icon');
    const cartCount = document.getElementById('cart-count');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCartBtn = document.getElementById('close-cart');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const addToCartBtns = document.querySelectorAll('.add-to-cart-btn');
    
    // Checkout Elements
    const checkoutItemsContainer = document.getElementById('checkout-items');
    const checkoutSubtotal = document.getElementById('checkout-subtotal');
    const checkoutForm = document.getElementById('checkout-form');

    // Utility: Format currency
    function formatMoney(amount) {
        return '&#8358;' + amount.toLocaleString();
    }

    // Save cart
    function saveCart() {
        localStorage.setItem('rln_cart', JSON.stringify(cart));
    }

    // Update Cart UI in Navbar
    function updateCartCount() {
        if (!cartCount) return;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }

    // Render Cart Overlay Panel
    function renderCartPanel() {
        if (!cartItemsContainer) return;
        
        cartItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Your cart is empty.</p>';
            if (cartSubtotal) cartSubtotal.innerHTML = formatMoney(0);
            return;
        }

        cart.forEach(item => {
            total += (item.price * item.quantity);
            const itemHTML = `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                    <div class="cart-item-info">
                        <h4 class="cart-item-title">${item.name}${item.size ? ' — Size: ' + item.size : ''}</h4>
                        <div class="cart-item-price">${formatMoney(item.price)}</div>
                        <div class="cart-item-actions">
                            <div class="quantity-controls">
                                <button class="qty-btn minus" data-id="${item.id}">-</button>
                                <span>${item.quantity}</span>
                                <button class="qty-btn plus" data-id="${item.id}">+</button>
                            </div>
                            <button class="remove-item" data-id="${item.id}">Remove</button>
                        </div>
                    </div>
                </div>
            `;
            cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        });

        if (cartSubtotal) {
            cartSubtotal.innerHTML = formatMoney(total);
        }

        attachCartPanelListeners();
    }

    // Render Checkout Page Summary
    function renderCheckoutSummary() {
        if (!checkoutItemsContainer) return;
        
        checkoutItemsContainer.innerHTML = '';
        let total = 0;

        if (cart.length === 0) {
            checkoutItemsContainer.innerHTML = '<p>Your cart is empty. Please add items to checkout.</p>';
            if (checkoutSubtotal) checkoutSubtotal.innerHTML = formatMoney(0);
            return;
        }

        cart.forEach(item => {
            total += (item.price * item.quantity);
            const itemHTML = `
                <div class="checkout-item">
                    <div class="checkout-item-details">
                        <img src="${item.image}" alt="${item.name}" class="checkout-item-img">
                        <span>${item.name}${item.size ? ' — Size: ' + item.size : ''} (x${item.quantity})</span>
                    </div>
                    <span>${formatMoney(item.price * item.quantity)}</span>
                </div>
            `;
            checkoutItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        });

        if (checkoutSubtotal) {
            checkoutSubtotal.innerHTML = formatMoney(total);
        }
    }

    // Attach listeners inside the re-rendered cart panel
    function attachCartPanelListeners() {
        document.querySelectorAll('.qty-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const isPlus = e.target.classList.contains('plus');
                updateQuantity(id, isPlus ? 1 : -1);
            });
        });

        document.querySelectorAll('.remove-item').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                removeFromCart(id);
            });
        });
    }

    // Add to Cart Logic
    function addToCart(product) {
        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }
        
        saveCart();
        updateCartCount();
        renderCartPanel();
        
        // Open overlay for visual feedback
        if (cartOverlay) cartOverlay.classList.add('open');
    }

    // Remove from cart
    function removeFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        saveCart();
        updateCartCount();
        renderCartPanel();
        renderCheckoutSummary(); // In case we are on checkout page
    }

    // Update quantity
    function updateQuantity(id, change) {
        const item = cart.find(item => item.id === id);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeFromCart(id);
            } else {
                saveCart();
                updateCartCount();
                renderCartPanel();
                renderCheckoutSummary();
            }
        }
    }

    // --- EVENT LISTENERS ---

    // Open Cart
    if (cartIcon && cartOverlay) {
        cartIcon.addEventListener('click', (e) => {
            e.preventDefault();
            cartOverlay.classList.add('open');
        });
    }

    // Close Cart
    if (closeCartBtn && cartOverlay) {
        closeCartBtn.addEventListener('click', () => {
            cartOverlay.classList.remove('open');
        });
    }

    // --- SIZE MODAL LOGIC ---
    const sizeModal = document.getElementById('size-modal');
    const closeSizeModalBtn = document.getElementById('close-size-modal');
    const confirmSizeBtn = document.getElementById('confirm-size-btn');
    const modalProductInfo = document.getElementById('modal-product-info');
    const modalSizeSelector = document.getElementById('modal-size-selector');
    const modalSizeError = document.getElementById('modal-size-error');
    
    let pendingProduct = null;

    // Add to cart buttons on products - now opens modal
    if (addToCartBtns) {
        addToCartBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                
                const productId = btn.getAttribute('data-id');
                const category = btn.getAttribute('data-category') || 'men';
                
                pendingProduct = {
                    id: productId,
                    name: btn.getAttribute('data-name'),
                    price: parseFloat(btn.getAttribute('data-price')),
                    image: btn.getAttribute('data-image')
                };

                // Populate modal info
                if (modalProductInfo) {
                    modalProductInfo.innerHTML = `
                        <img src="${pendingProduct.image}" class="modal-product-img" alt="${pendingProduct.name}">
                        <div class="modal-product-details">
                            <h4>${pendingProduct.name}</h4>
                            <p>${formatMoney(pendingProduct.price)}</p>
                        </div>
                    `;
                }

                // Populate sizes based on category
                if (modalSizeSelector) {
                    modalSizeSelector.innerHTML = '';
                    let sizes = ['S (36")', 'M (38")', 'L (40")', 'XL (42")', 'XXL (44")'];
                    if (category === 'kids') {
                        sizes = ['2Y (20")', '4Y (22")', '6Y (24")', '8Y (26")', '10Y (28")'];
                    }
                    
                    sizes.forEach(size => {
                        const btn = document.createElement('button');
                        btn.className = 'size-btn';
                        btn.textContent = size;
                        
                        btn.addEventListener('click', () => {
                            // Remove active from siblings
                            modalSizeSelector.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                            btn.classList.add('active');
                            if (modalSizeError) modalSizeError.style.display = 'none';
                        });
                        
                        modalSizeSelector.appendChild(btn);
                    });
                }
                
                if (modalSizeError) modalSizeError.style.display = 'none';
                if (sizeModal) sizeModal.classList.add('open');
            });
        });
    }

    // Close Size Modal
    if (closeSizeModalBtn && sizeModal) {
        closeSizeModalBtn.addEventListener('click', () => {
            sizeModal.classList.remove('open');
            pendingProduct = null;
        });
    }

    // Confirm Size & Add to Cart
    if (confirmSizeBtn) {
        confirmSizeBtn.addEventListener('click', () => {
            if (!pendingProduct) return;
            
            const activeSizeBtn = modalSizeSelector.querySelector('.size-btn.active');
            if (!activeSizeBtn) {
                if (modalSizeError) modalSizeError.style.display = 'block';
                return;
            }
            
            const selectedSize = activeSizeBtn.textContent;
            const finalProduct = {
                ...pendingProduct,
                id: `${pendingProduct.id}-${selectedSize}`,
                size: selectedSize
            };
            
            sizeModal.classList.remove('open');
            pendingProduct = null;
            
            addToCart(finalProduct);
        });
    }

    // Close modal if clicking outside
    if (sizeModal) {
        sizeModal.addEventListener('click', (e) => {
            if (e.target === sizeModal) {
                sizeModal.classList.remove('open');
                pendingProduct = null;
            }
        });
    }

    // Removed inline size selection listeners as they are now handled in the modal logic
    
    // Close overlay if clicking outside the panel
    if (cartOverlay) {
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) {
                cartOverlay.classList.remove('open');
            }
        });
    }

    // Fake Checkout Form Submission
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (cart.length === 0) {
                alert("Your cart is empty. Please add items before placing an order.");
                return;
            }
            
            // NOTE FOR PAYMENT INTEGRATION:
            // This is where you would initialize Paystack or Flutterwave.
            // e.g., let handler = PaystackPop.setup({ key: '...', email: document.getElementById('checkout-email').value, ... });
            // handler.openIframe();
            
            const confetti = document.createElement('div');
            confetti.className = 'confetti-burst';
            confetti.innerHTML = Array.from({ length: 24 }, (_, index) => `<i style="--i:${index}"></i>`).join('');
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 1800);
            alert("Order Placed Successfully! (This is a demo)");
            
            // Clear cart
            cart = [];
            saveCart();
            window.location.href = "thank-you.html";
        });
    }

    // Marketplace reward mechanics
    const dealTimer = document.getElementById('deal-timer');
    if (dealTimer) {
        let secondsLeft = 2 * 60 * 60 + 14 * 60 + 33;
        const updateTimer = () => {
            const hours = String(Math.floor(secondsLeft / 3600)).padStart(2, '0');
            const minutes = String(Math.floor((secondsLeft % 3600) / 60)).padStart(2, '0');
            const seconds = String(secondsLeft % 60).padStart(2, '0');
            dealTimer.textContent = `${hours}:${minutes}:${seconds}`;
            secondsLeft = secondsLeft > 0 ? secondsLeft - 1 : 2 * 60 * 60 + 14 * 60 + 33;
        };
        updateTimer();
        setInterval(updateTimer, 1000);
    }

    const spinModal = document.getElementById('spin-modal');
    const spinButton = document.getElementById('spin-btn');
    const spinWheel = document.getElementById('spin-wheel');
    const spinResult = document.getElementById('spin-result');
    if (spinModal && !sessionStorage.getItem('rln_spin_seen')) {
        setTimeout(() => spinModal.classList.add('open'), 900);
    }
    document.getElementById('close-spin-modal')?.addEventListener('click', () => {
        spinModal?.classList.remove('open');
        sessionStorage.setItem('rln_spin_seen', '1');
    });
    spinButton?.addEventListener('click', () => {
        spinButton.disabled = true;
        spinWheel.style.transform = 'rotate(1440deg)';
        setTimeout(() => {
            spinResult.textContent = 'You won 20% off! Sign up below to claim it.';
            spinButton.textContent = 'Prize unlocked';
            sessionStorage.setItem('rln_spin_seen', '1');
        }, 2600);
    });
    document.getElementById('checkin-btn')?.addEventListener('click', (event) => {
        event.target.textContent = 'Day 1 claimed ✓';
        event.target.disabled = true;
        localStorage.setItem('rln_checkin_date', new Date().toDateString());
    });
    document.getElementById('mystery-btn')?.addEventListener('click', (event) => {
        event.target.textContent = 'You won 10% off ✓';
        event.target.disabled = true;
    });
    document.getElementById('referral-btn')?.addEventListener('click', async () => {
        const shareText = 'Join me on Lizzybees and unlock a shopping reward!';
        if (navigator.share) await navigator.share({ title: 'Lizzybees reward', text: shareText, url: window.location.href });
        else await navigator.clipboard?.writeText(`${shareText} ${window.location.href}`);
    });

    document.querySelectorAll('.product-card').forEach((card, index) => {
        const priceElement = card.querySelector('.product-price');
        if (!priceElement || card.querySelector('.deal-meta')) return;
        const price = Number(card.querySelector('.add-to-cart-btn')?.dataset.price || 0);
        const discount = [62, 45, 38, 68][index % 4];
        const original = Math.round(price / (1 - discount / 100));
        priceElement.innerHTML = `<span class="original-price">₦${original.toLocaleString()}</span> <strong>₦${price.toLocaleString()}</strong><b class="discount-badge">-${discount}%</b>`;
        const meta = document.createElement('div');
        meta.className = 'deal-meta';
        meta.innerHTML = `<span class="rating">★ 4.${6 + (index % 4)}</span> <span>${120 + index * 87}+ sold</span> <span class="stock-note">Only ${2 + (index % 4)} left</span>`;
        priceElement.after(meta);
    });

    // Initialize UI on load
    updateCartCount();
    renderCartPanel();
    renderCheckoutSummary();
});
