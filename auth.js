document.addEventListener('DOMContentLoaded', () => {
    // Check which form is on the page
    if (document.getElementById('loginForm')) {
        handleLoginForm();
    }
    if (document.getElementById('registerForm')) {
        handleRegisterForm();
    }

    // Check user's login status on all pages
    updateUIBasedOnLoginStatus();
});

function handleLoginForm() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorMessage = document.getElementById('errorMessage');

        const users = JSON.parse(localStorage.getItem('users')) || [];
        // IMPORTANT: This is a mock hash for demonstration.
        // In a real application, NEVER store passwords, even hashed, on the client-side.
        // Hashing and validation should be done on a secure server.
        const mockHash = (str) => str.split('').reverse().join('');
        const user = users.find(u => u.username === username && u.passwordHash === mockHash(password));

        if (user) {
            // Don't store password hash in the session
            sessionStorage.setItem('currentUser', JSON.stringify({ username: user.username }));
            window.location.href = 'home.html';
        } else {
            errorMessage.textContent = 'Username atau password salah.';
            errorMessage.style.display = 'block';
        }
    });
}

function handleRegisterForm() {
    const form = document.getElementById('registerForm');
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMessage = document.getElementById('errorMessage');

        if (password.length < 6) {
            errorMessage.textContent = 'Password minimal 6 karakter.';
            errorMessage.style.display = 'block';
            return;
        }
        if (password !== confirmPassword) {
            errorMessage.textContent = 'Password tidak cocok.';
            errorMessage.style.display = 'block';
            return;
        }

        let users = JSON.parse(localStorage.getItem('users')) || [];
        if (users.find(u => u.username === username)) {
            errorMessage.textContent = 'Username sudah digunakan.';
            errorMessage.style.display = 'block';
            return;
        }

        // IMPORTANT: This is a mock hash for demonstration. Not for production.
        const mockHash = (str) => str.split('').reverse().join('');
        const newUser = {
            username: username,
            passwordHash: mockHash(password)
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Automatically log in the new user
        sessionStorage.setItem('currentUser', JSON.stringify({ username: newUser.username }));
        
        // Show success message instead of alert
        form.innerHTML = `<p class="success-message">Pendaftaran berhasil! Anda akan dialihkan dalam 3 detik...</p>`;
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 3000);
    });
}

function updateUIBasedOnLoginStatus() {
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const authLinks = document.getElementById('user-auth-links');
    const userProfile = document.getElementById('user-profile');
    const usernameDisplay = document.getElementById('usernameDisplay');
    const logoutBtn = document.getElementById('logoutBtn');

    if (currentUser) {
        if (authLinks) authLinks.style.display = 'none';
        if (userProfile) {
            userProfile.style.display = 'flex';
            usernameDisplay.textContent = currentUser.username;
            logoutBtn.addEventListener('click', () => {
                sessionStorage.removeItem('currentUser');
                window.location.reload();
            });
        }
    } else {
        if (authLinks) authLinks.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
    }
}