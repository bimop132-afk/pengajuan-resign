async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errEl = document.getElementById('login-error');

    if (!username || !password) {
        if(errEl) {
            errEl.innerText = 'Username dan password harus diisi';
            errEl.style.display = 'block';
        }
        return;
    }

    if(errEl) errEl.style.display = 'none';
    showLoading('Sedang masuk...');

    try {
        const response = await apiCall('login', { username, password }, 'POST');
        if (response.success) {
            sessionStorage.setItem('auth_token', response.token);
            sessionStorage.setItem('login_time', Date.now());
            window.location.href = 'dashboard.html';
        } else {
            if(errEl) {
                errEl.innerText = response.message || 'Login gagal';
                errEl.style.display = 'block';
            }
        }
    } catch (error) {
        if(errEl) {
            errEl.innerText = 'Terjadi kesalahan koneksi';
            errEl.style.display = 'block';
        }
    } finally {
        hideLoading();
    }
}

function checkAuth() {
    const token = sessionStorage.getItem('auth_token');
    const loginTime = sessionStorage.getItem('login_time');
    
    if (!token || !loginTime) {
        if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'login.html';
        }
        return false;
    }

    const now = Date.now();
    const isExpired = (now - parseInt(loginTime)) > (30 * 60 * 1000); // 30 mins

    if (isExpired) {
        logout();
        return false;
    }

    return true;
}

function logout() {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('login_time');
    window.location.href = 'login.html';
}

function getToken() {
    return sessionStorage.getItem('auth_token');
}

function togglePasswordVisibility() {
    const pwd = document.getElementById('password');
    const icon = document.getElementById('toggle-password-icon');
    if (pwd && icon) {
        if (pwd.type === 'password') {
            pwd.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            pwd.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const toggleIcon = document.getElementById('toggle-password-icon');
    if (toggleIcon) {
        toggleIcon.addEventListener('click', togglePasswordVisibility);
    }
});
