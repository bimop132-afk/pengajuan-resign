const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec'; // Replace with actual URL

async function apiCall(action, params = {}, method = 'GET') {
    try {
        let url = new URL(SCRIPT_URL);
        url.searchParams.append('action', action);

        let options = {
            method: method,
            redirect: 'follow'
        };

        if (method === 'GET') {
            for (const key in params) {
                url.searchParams.append(key, params[key]);
            }
        } else if (method === 'POST') {
            options.body = JSON.stringify(params);
            options.headers = {
                'Content-Type': 'text/plain;charset=utf-8' // To avoid preflight CORS
            };
        }

        const response = await fetch(url, options);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function showLoading(message = 'Memproses...') {
    let loader = document.getElementById('loading-overlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loading-overlay';
        loader.innerHTML = `<div class="spinner"></div><p id="loading-text">${message}</p>`;
        document.body.appendChild(loader);
    } else {
        document.getElementById('loading-text').innerText = message;
    }
    loader.style.display = 'flex';
}

function hideLoading() {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.style.display = 'none';
}

function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, duration);
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateLong(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function validateField(fieldId, rules) {
    const el = document.getElementById(fieldId);
    if (!el) return true;
    let isValid = true;
    let errorMsg = '';
    
    if (rules.required && !el.value.trim()) {
        isValid = false;
        errorMsg = 'Field ini wajib diisi';
    } else if (rules.type === 'email' && el.value.trim()) {
        const re = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        if (!re.test(el.value)) {
            isValid = false;
            errorMsg = 'Email tidak valid';
        }
    }
    
    if (!isValid) {
        showFieldError(fieldId, errorMsg);
    } else {
        clearFieldError(fieldId);
    }
    
    return isValid;
}

function showFieldError(fieldId, message) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.classList.add('error');
    let errorEl = document.getElementById(`${fieldId}-error`);
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = `${fieldId}-error`;
        errorEl.className = 'error-message';
        el.parentNode.appendChild(errorEl);
    }
    errorEl.innerText = message;
}

function clearFieldError(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.classList.remove('error');
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) errorEl.remove();
}

function clearAllErrors() {
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());
}

function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function sanitizeInput(str) {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
}

function formatNumber(num) {
    return Number(num).toLocaleString('id-ID');
}

function initApp() {
    // Basic app initialization
    console.log('App initialized');
}

document.addEventListener('DOMContentLoaded', initApp);
