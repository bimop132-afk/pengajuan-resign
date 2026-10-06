async function apiCall(action, params = {}, method = 'GET') {
    const baseUrl = (typeof CONFIG !== 'undefined' && CONFIG.API_URL) 
        ? CONFIG.API_URL 
        : 'https://script.google.com/macros/s/AKfycbx-gq9IdG3fg3mkyxPjqJwofxruZdutbe9MoNa7NOOM-6GjbqWTnBAfKvVbmpe0_L1N/exec';

    try {
        let url = new URL(baseUrl);
        url.searchParams.append('action', action);

        let options = {
            method: method,
            redirect: 'follow'
        };

        if (method === 'GET') {
            for (const key in params) {
                if (params[key] !== undefined && params[key] !== null) {
                    url.searchParams.append(key, params[key]);
                }
            }
        } else if (method === 'POST') {
            options.body = JSON.stringify(params);
            options.headers = {
                'Content-Type': 'text/plain;charset=utf-8' // Avoid CORS preflight in Google Apps Script
            };
        }

        const response = await fetch(url.toString(), options);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

function showLoading(message = 'Memproses data...') {
    let loader = document.getElementById('loading-overlay');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'loading-overlay';
        loader.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px);
            z-index: 99999; display: flex; flex-direction: column;
            align-items: center; justify-content: center; color: #ffffff;
            font-family: var(--font-sans, sans-serif);
        `;
        loader.innerHTML = `
            <div style="width: 50px; height: 50px; border: 4px solid rgba(255, 255, 255, 0.2); border-top: 4px solid #3b82f6; border-radius: 50%; animation: spinOverlay 0.9s linear infinite; margin-bottom: 1.25rem;"></div>
            <p id="loading-text" style="font-weight: 600; font-size: 1.05rem; margin: 0; letter-spacing: 0.02em;">${message}</p>
            <style>@keyframes spinOverlay { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;
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

function showToast(message, type = 'info', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 99999;
            display: flex; flex-direction: column; gap: 10px; max-width: 360px;
        `;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    
    let bg = 'var(--primary-600, #2563eb)';
    let icon = 'fa-info-circle';

    if (type === 'success') { bg = '#10b981'; icon = 'fa-check-circle'; }
    else if (type === 'error') { bg = '#e11d48'; icon = 'fa-exclamation-circle'; }
    else if (type === 'warning') { bg = '#f59e0b'; icon = 'fa-exclamation-triangle'; }

    toast.style.cssText = `
        background: ${bg}; color: #ffffff; padding: 0.85rem 1.25rem;
        border-radius: 10px; font-weight: 600; font-size: 0.9rem;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.2); display: flex;
        align-items: center; gap: 0.75rem; font-family: var(--font-sans, sans-serif);
        opacity: 0; transform: translateY(-10px); transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
    `;
    toast.innerHTML = `<i class="fas ${icon}" style="font-size: 1.15rem;"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function formatDateLong(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
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
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
    el.style.borderColor = 'var(--danger-600, #e11d48)';
    let errorEl = document.getElementById(`${fieldId}-error`);
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.id = `${fieldId}-error`;
        errorEl.style.cssText = 'color: var(--danger-600, #e11d48); font-size: 0.8rem; font-weight: 600; margin-top: 0.3rem;';
        el.parentNode.appendChild(errorEl);
    }
    errorEl.innerText = message;
}

function clearFieldError(fieldId) {
    const el = document.getElementById(fieldId);
    if (!el) return;
    el.style.borderColor = '';
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (errorEl) errorEl.remove();
}

function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.remove());
}

function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    console.log('App initialized');
}

document.addEventListener('DOMContentLoaded', initApp);
