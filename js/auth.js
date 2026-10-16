async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errEl = document.getElementById('login-error');

    if (!username || !password) {
        if (errEl) {
            errEl.innerHTML = '<i class="fas fa-exclamation-circle"></i> Username dan password harus diisi';
            errEl.style.display = 'block';
        }
        return;
    }

    if (errEl) errEl.style.display = 'none';
    showLoading('Memverifikasi akun HRD...');

    try {
        const response = await apiCall('login', { username, password }, 'POST');
        if (response.success && response.token) {
            sessionStorage.setItem('auth_token', response.token);
            sessionStorage.setItem('login_time', Date.now());
            sessionStorage.setItem('admin_user', username);
            window.location.href = 'dashboard.html';
        } else {
            if (errEl) {
                errEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${response.message || 'Username atau password salah'}`;
                errEl.style.display = 'block';
            }
        }
    } catch (error) {
        if (errEl) {
            errEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message || 'Terjadi kesalahan koneksi'}`;
            errEl.style.display = 'block';
        }
    } finally {
        hideLoading();
    }
}

function checkAuth() {
    const isDashboard = window.location.pathname.toLowerCase().includes('dashboard.html');
    const token = sessionStorage.getItem('auth_token');
    const loginTime = sessionStorage.getItem('login_time');
    
    if (!token || !loginTime) {
        if (isDashboard) {
            window.location.href = 'login.html';
        }
        return false;
    }

    const now = Date.now();
    const timeout = (typeof CONFIG !== 'undefined' && CONFIG.SESSION_TIMEOUT) ? CONFIG.SESSION_TIMEOUT : (30 * 60 * 1000);
    const isExpired = (now - parseInt(loginTime, 10)) > timeout;

    if (isExpired) {
        logout();
        return false;
    }

    // Refresh active session time
    sessionStorage.setItem('login_time', Date.now());
    return true;
}

function logout() {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('login_time');
    sessionStorage.removeItem('admin_user');
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
    const isDashboard = window.location.pathname.toLowerCase().includes('dashboard.html');
    const isLogin = window.location.pathname.toLowerCase().includes('login.html');

    if (isDashboard) {
        checkAuth();
    } else if (isLogin) {
        const token = sessionStorage.getItem('auth_token');
        const loginTime = sessionStorage.getItem('login_time');
        if (token && loginTime) {
            const timeout = (typeof CONFIG !== 'undefined' && CONFIG.SESSION_TIMEOUT) ? CONFIG.SESSION_TIMEOUT : (30 * 60 * 1000);
            if ((Date.now() - parseInt(loginTime, 10)) <= timeout) {
                window.location.href = 'dashboard.html';
                return;
            }
        }
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const toggleIcon = document.getElementById('toggle-password-icon');
    if (toggleIcon) {
        toggleIcon.addEventListener('click', togglePasswordVisibility);
    }
});

