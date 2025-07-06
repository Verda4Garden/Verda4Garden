document.addEventListener('DOMContentLoaded', () => {
    // Check which form is on the page
    if (document.getElementById('loginForm')) {
        handleLoginForm();
        setupPasswordToggle();
        setupRememberMe();
        setupSocialLogin();
    }
    if (document.getElementById('registerForm')) {
        handleRegisterForm();
        setupPasswordToggle();
    }

    // Check user's login status on all pages
    updateUIBasedOnLoginStatus();
    
    // Add wave animation to emoji
    animateWaveEmoji();
});

function handleLoginForm() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rememberMe = document.getElementById('rememberMe')?.checked || false;
        const errorMessage = document.getElementById('errorMessage');
        
        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        submitButton.disabled = true;
        
        // Simulate network delay for better UX
        setTimeout(() => {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            // IMPORTANT: This is a mock hash for demonstration.
            // In a real application, NEVER store passwords, even hashed, on the client-side.
            // Hashing and validation should be done on a secure server.
            const mockHash = (str) => str.split('').reverse().join('');
            const user = users.find(u => u.username === username && u.passwordHash === mockHash(password));

            if (user) {
                // Don't store password hash in the session
                const userData = { username: user.username };
                
                // Handle remember me
                if (rememberMe) {
                    localStorage.setItem('rememberedUser', JSON.stringify(userData));
                } else {
                    localStorage.removeItem('rememberedUser');
                }
                
                sessionStorage.setItem('currentUser', JSON.stringify(userData));
                
                // Show success message before redirect
                errorMessage.textContent = 'Login berhasil! Mengalihkan...';
                errorMessage.style.display = 'block';
                errorMessage.style.color = '#2ecc71';
                errorMessage.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
                errorMessage.style.borderLeft = '3px solid #2ecc71';
                
                setTimeout(() => {
                    window.location.href = 'home.html';
                }, 1000);
            } else {
                // Reset button state
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
                
                // Show error with animation
                errorMessage.textContent = 'Username atau password salah.';
                errorMessage.style.display = 'block';
                errorMessage.classList.add('shake-animation');
                setTimeout(() => {
                    errorMessage.classList.remove('shake-animation');
                }, 500);
            }
        }, 1000);
    });
}

function setupPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
            
            // Add ripple effect
            const ripple = document.createElement('span');
            ripple.classList.add('ripple-effect');
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 500);
        });
    });
}

function setupRememberMe() {
    const rememberMeCheckbox = document.getElementById('rememberMe');
    if (!rememberMeCheckbox) return;
    
    // Check if there's a remembered user
    const rememberedUser = JSON.parse(localStorage.getItem('rememberedUser'));
    if (rememberedUser) {
        document.getElementById('username').value = rememberedUser.username;
        rememberMeCheckbox.checked = true;
    }
}

function setupSocialLogin() {
    const googleButton = document.querySelector('.social-auth-button.google');
    if (!googleButton) return;
    
    googleButton.addEventListener('click', function() {
        // This is just a mock implementation
        const errorMessage = document.getElementById('errorMessage');
        errorMessage.textContent = 'Social login akan segera tersedia!';
        errorMessage.style.display = 'block';
        errorMessage.style.color = '#3498db';
        errorMessage.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
        errorMessage.style.borderLeft = '3px solid #3498db';
    });
}

function animateWaveEmoji() {
    const waveEmoji = document.querySelector('.wave-emoji');
    if (waveEmoji) {
        // The CSS animation is already applied, but we can add extra effects here if needed
    }
}

function handleRegisterForm() {
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const agreeTerms = document.getElementById('agreeTerms')?.checked || false;
        const errorMessage = document.getElementById('errorMessage');
        
        // Reset error message
        errorMessage.style.display = 'none';
        
        // Validate form
        if (username.length < 3) {
            showFormError(errorMessage, 'Username minimal 3 karakter.');
            return;
        }
        
        if (password.length < 6) {
            showFormError(errorMessage, 'Password minimal 6 karakter.');
            return;
        }
        
        if (password !== confirmPassword) {
            showFormError(errorMessage, 'Password tidak cocok.');
            return;
        }
        
        if (!agreeTerms) {
            showFormError(errorMessage, 'Anda harus menyetujui Syarat & Ketentuan untuk mendaftar.');
            return;
        }
        
        // Add loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalButtonText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        submitButton.disabled = true;
        
        // Simulate network delay for better UX
        setTimeout(() => {
            let users = JSON.parse(localStorage.getItem('users')) || [];
            if (users.find(u => u.username === username)) {
                showFormError(errorMessage, 'Username sudah digunakan.');
                submitButton.innerHTML = originalButtonText;
                submitButton.disabled = false;
                return;
            }
            
            // IMPORTANT: This is a mock hash for demonstration. Not for production.
            const mockHash = (str) => str.split('').reverse().join('');
            const newUser = {
                username: username,
                passwordHash: mockHash(password),
                registeredAt: new Date().toISOString()
            };
            
            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));
            
            // Automatically log in the new user
            sessionStorage.setItem('currentUser', JSON.stringify({ username: newUser.username }));
            
            // Show success message with animation
            errorMessage.textContent = 'Pendaftaran berhasil! Mengalihkan...';
            errorMessage.style.display = 'block';
            errorMessage.style.color = '#2ecc71';
            errorMessage.style.backgroundColor = 'rgba(46, 204, 113, 0.1)';
            errorMessage.style.borderLeft = '3px solid #2ecc71';
            
            // Add success animation to form
            form.classList.add('success-animation');
            
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 2000);
        }, 1500);
    });
}

// Helper function to show form errors with animation
function showFormError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    errorElement.style.color = '#e74c3c';
    errorElement.style.backgroundColor = 'rgba(231, 76, 60, 0.1)';
    errorElement.style.borderLeft = '3px solid #e74c3c';
    
    // Add shake animation
    errorElement.classList.add('shake-animation');
    setTimeout(() => {
        errorElement.classList.remove('shake-animation');
    }, 500);
}

function updateUIBasedOnLoginStatus() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const authLinks = document.getElementById('user-auth-links');
    const userProfile = document.getElementById('user-profile');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const logoutBtn = document.getElementById('logoutBtn');
    const topUpBtnDropdown = document.getElementById('topUpBtnDropdown');

    if (currentUser) {
        if (authLinks) authLinks.style.display = 'none';
        if (userProfile) {
            userProfile.style.display = 'flex';
            
            // Check if we're using the new dropdown UI structure
            const userDropdown = userProfile.querySelector('.user-dropdown');
            
            if (userDropdown) {
                // New UI structure with dropdown
                if (usernameDisplay) {
                    usernameDisplay.textContent = currentUser.username;
                }
                
                // Setup dropdown toggle
                const dropdownHeader = userProfile.querySelector('.user-dropdown-header');
                const dropdownContent = userProfile.querySelector('.user-dropdown-content');
                
                if (dropdownHeader && dropdownContent) {
                    dropdownHeader.addEventListener('click', (e) => {
                        e.stopPropagation();
                        userDropdown.classList.toggle('active');
                    });
                    
                    // Close dropdown when clicking outside
                    document.addEventListener('click', () => {
                        userDropdown.classList.remove('active');
                    });
                    
                    // Prevent clicks inside dropdown content from closing it
                    dropdownContent.addEventListener('click', (e) => {
                        e.stopPropagation();
                    });
                }
                
                // Setup logout button
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', () => {
                        sessionStorage.removeItem('currentUser');
                        window.location.reload();
                    });
                }
                
                // Setup top up button in dropdown
                if (topUpBtnDropdown) {
                    topUpBtnDropdown.addEventListener('click', () => {
                        window.location.href = 'home.html';
                    });
                }
            } else {
                // Legacy UI structure - create dropdown menu
                userProfile.style.alignItems = 'center';
                userProfile.style.gap = '8px';
                userProfile.style.background = 'var(--background-tertiary)';
                userProfile.style.padding = '6px 12px';
                userProfile.style.borderRadius = '8px';
                userProfile.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                
                // Create dropdown menu for user options
                if (!document.getElementById('user-dropdown-menu')) {
                    const dropdownMenu = document.createElement('div');
                    dropdownMenu.id = 'user-dropdown-menu';
                    dropdownMenu.style.display = 'none';
                    dropdownMenu.style.position = 'absolute';
                    dropdownMenu.style.top = '100%';
                    dropdownMenu.style.right = '0';
                    dropdownMenu.style.backgroundColor = 'var(--card-background)';
                    dropdownMenu.style.borderRadius = '8px';
                    dropdownMenu.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
                    dropdownMenu.style.padding = '10px 0';
                    dropdownMenu.style.zIndex = '1000';
                    dropdownMenu.style.minWidth = '180px';
                    dropdownMenu.style.marginTop = '5px';
                    
                    // Add menu items
                    const menuItems = [
                        { icon: '👤', text: 'Profil Saya', action: () => alert('Fitur profil akan segera tersedia!') },
                        { icon: '🧾', text: 'Cek Transaksi', action: () => window.location.href = 'cek-transaksi.html' },
                        { icon: '💎', text: 'Top Up', action: () => window.location.href = 'home.html' },
                        { icon: '🔒', text: 'Keluar', action: () => {
                            sessionStorage.removeItem('currentUser');
                            window.location.reload();
                        }}
                    ];
                    
                    menuItems.forEach(item => {
                        const menuItem = document.createElement('div');
                        menuItem.className = 'user-menu-item';
                        menuItem.innerHTML = `<span class="menu-icon">${item.icon}</span> ${item.text}`;
                        menuItem.style.padding = '10px 15px';
                        menuItem.style.cursor = 'pointer';
                        menuItem.style.transition = 'background-color 0.2s';
                        menuItem.style.display = 'flex';
                        menuItem.style.alignItems = 'center';
                        menuItem.style.gap = '8px';
                        
                        menuItem.addEventListener('mouseover', () => {
                            menuItem.style.backgroundColor = 'var(--background-tertiary)';
                        });
                        
                        menuItem.addEventListener('mouseout', () => {
                            menuItem.style.backgroundColor = 'transparent';
                        });
                        
                        menuItem.addEventListener('click', item.action);
                        dropdownMenu.appendChild(menuItem);
                    });
                    
                    userProfile.style.position = 'relative';
                    userProfile.appendChild(dropdownMenu);
                }
                
                if (usernameDisplay) {
                    usernameDisplay.textContent = `👤 ${currentUser.username}`;
                    usernameDisplay.style.fontWeight = 'bold';
                    usernameDisplay.style.color = 'var(--primary-text)';
                    usernameDisplay.style.cursor = 'pointer';
                    usernameDisplay.style.display = 'flex';
                    usernameDisplay.style.alignItems = 'center';
                    usernameDisplay.style.gap = '5px';
                    
                    // Add dropdown arrow
                    if (!usernameDisplay.querySelector('.dropdown-arrow')) {
                        const arrow = document.createElement('span');
                        arrow.className = 'dropdown-arrow';
                        arrow.innerHTML = '▼';
                        arrow.style.fontSize = '10px';
                        arrow.style.marginLeft = '3px';
                        usernameDisplay.appendChild(arrow);
                    }
                    
                    // Toggle dropdown menu on click
                    usernameDisplay.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const dropdownMenu = document.getElementById('user-dropdown-menu');
                        if (dropdownMenu) {
                            dropdownMenu.style.display = dropdownMenu.style.display === 'none' ? 'block' : 'none';
                        }
                    });
                    
                    // Close dropdown when clicking outside
                    document.addEventListener('click', () => {
                        const dropdownMenu = document.getElementById('user-dropdown-menu');
                        if (dropdownMenu) {
                            dropdownMenu.style.display = 'none';
                        }
                    });
                }
                
                // Hide the logout button as it's now in the dropdown
                if (logoutBtn && !userProfile.querySelector('.user-dropdown')) {
                    logoutBtn.style.display = 'none';
                }
            }
        }
    } else {
        if (authLinks) authLinks.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
    }
    
    // Add a small delay to ensure the DOM is fully updated
    setTimeout(() => {
        if (currentUser && userProfile && userProfile.style.display === 'none') {
            userProfile.style.display = 'flex';
            if (authLinks) authLinks.style.display = 'none';
        }
    }, 100);
}

// Add CSS for new animations
document.head.insertAdjacentHTML('beforeend', `
<style>
    @keyframes shake-animation {
        0% { transform: translateX(0); }
        20% { transform: translateX(-10px); }
        40% { transform: translateX(10px); }
        60% { transform: translateX(-10px); }
        80% { transform: translateX(10px); }
        100% { transform: translateX(0); }
    }
    
    .shake-animation {
        animation: shake-animation 0.5s ease;
    }
    
    .ripple-effect {
        position: absolute;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.4);
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        opacity: 0;
        transform: scale(0);
        animation: ripple 0.5s ease-out;
    }
    
    @keyframes ripple {
        0% {
            transform: scale(0);
            opacity: 0.5;
        }
        100% {
            transform: scale(2);
            opacity: 0;
        }
    }
    
    @keyframes success-animation {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.9; }
        100% { transform: scale(1); opacity: 1; }
    }
    
    .success-animation {
        animation: success-animation 0.5s ease;
        box-shadow: 0 0 20px rgba(46, 204, 113, 0.5);
        transition: all 0.3s ease;
    }
</style>
`);