let dashboardData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;
let refreshInterval;

async function loadDashboardData() {
    try {
        const response = await apiCall('getDashboardData', { token: getToken() }, 'GET');
        if (response.success) {
            dashboardData = response.data || [];
            updateStats(dashboardData);
            populateDropdownFilters(dashboardData);
            applyFilters();
        } else if (response.message === 'Token invalid') {
            logout();
        }
    } catch (e) {
        showToast('Gagal memuat data', 'error');
    }
}

function updateStats(data) {
    document.getElementById('stat-total').innerText = data.length;
    document.getElementById('stat-baru').innerText = data.filter(d => d['Status Pengajuan'] === 'PENGAJUAN BARU').length;
    document.getElementById('stat-diproses').innerText = data.filter(d => d['Status Pengajuan'] === 'DIPERIKSA HRD').length;
    document.getElementById('stat-disetujui').innerText = data.filter(d => d['Status Pengajuan'] === 'DISETUJUI').length;
    document.getElementById('stat-ditolak').innerText = data.filter(d => d['Status Pengajuan'] === 'DITOLAK').length;
    document.getElementById('stat-selesai').innerText = data.filter(d => d['Status Pengajuan'] === 'SELESAI').length;
}

function populateDropdownFilters(data) {
    const sektors = [...new Set(data.map(d => d['Sektor']).filter(Boolean))];
    const regus = [...new Set(data.map(d => d['Regu']).filter(Boolean))];
    const depts = [...new Set(data.map(d => d['Departemen']).filter(Boolean))];

    const selSektor = document.getElementById('filter-sektor');
    const selRegu = document.getElementById('filter-regu');
    const selDept = document.getElementById('filter-departemen');

    if (selSektor) {
        selSektor.innerHTML = '<option value="">Semua Sektor</option>' + sektors.map(s => `<option value="${s}">${s}</option>`).join('');
    }
    if (selRegu) {
        selRegu.innerHTML = '<option value="">Semua Regu</option>' + regus.map(r => `<option value="${r}">${r}</option>`).join('');
    }
    if (selDept) {
        selDept.innerHTML = '<option value="">Semua Departemen</option>' + depts.map(d => `<option value="${d}">${d}</option>`).join('');
    }
}

function applyFilters() {
    const fNik = (document.getElementById('filter-nik').value || '').toLowerCase();
    const fNama = (document.getElementById('filter-nama').value || '').toLowerCase();
    const fSektor = document.getElementById('filter-sektor').value;
    const fRegu = document.getElementById('filter-regu').value;
    const fDept = document.getElementById('filter-departemen').value;
    const fStatus = document.getElementById('filter-status').value;
    const fTglDari = document.getElementById('filter-tgl-dari').value;
    const fTglSampai = document.getElementById('filter-tgl-sampai').value;

    filteredData = dashboardData.filter(item => {
        let match = true;
        if (fNik && !(item['NIK'] || '').toLowerCase().includes(fNik)) match = false;
        if (fNama && !(item['Nama Lengkap'] || '').toLowerCase().includes(fNama)) match = false;
        if (fSektor && item['Sektor'] !== fSektor) match = false;
        if (fRegu && item['Regu'] !== fRegu) match = false;
        if (fDept && item['Departemen'] !== fDept) match = false;
        if (fStatus && item['Status Pengajuan'] !== fStatus) match = false;
        
        const tglPengajuan = item['Tanggal Pengajuan'] ? item['Tanggal Pengajuan'].split('T')[0] : '';
        if (fTglDari && tglPengajuan < fTglDari) match = false;
        if (fTglSampai && tglPengajuan > fTglSampai) match = false;

        return match;
    });

    currentPage = 1;
    renderTable(filteredData);
}

function resetFilters() {
    document.querySelectorAll('.filter-input').forEach(el => el.value = '');
    applyFilters();
}

function renderTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted" style="padding: 2.5rem 1rem;">Tidak ada data pengajuan resign yang cocok.</td></tr>';
        renderPagination(0);
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = data.slice(startIndex, startIndex + itemsPerPage);

    paginatedItems.forEach(item => {
        let badgeClass = 'badge-baru';
        switch(item['Status Pengajuan']) {
            case 'PENGAJUAN BARU': badgeClass = 'badge-baru'; break;
            case 'DIPERIKSA HRD': badgeClass = 'badge-diperiksa'; break;
            case 'DISETUJUI': badgeClass = 'badge-disetujui'; break;
            case 'DITOLAK': badgeClass = 'badge-ditolak'; break;
            case 'SELESAI': badgeClass = 'badge-selesai'; break;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color: var(--primary-600);">${item['ID Pengajuan'] || '-'}</strong></td>
            <td>${item['NIK'] || '-'}</td>
            <td><strong style="color: var(--gray-900);">${item['Nama Lengkap'] || '-'}</strong></td>
            <td>${item['Jabatan'] || '-'}</td>
            <td>${item['Sektor'] || '-'}</td>
            <td>${item['Regu'] || '-'}</td>
            <td>${formatDate(item['Tanggal Pengajuan'])}</td>
            <td><strong style="color: var(--danger-600);">${formatDate(item['Tanggal Efektif Resign'])}</strong></td>
            <td><span class="badge ${badgeClass}">${item['Status Pengajuan'] || 'PENGAJUAN BARU'}</span></td>
            <td>
                <div style="display: flex; gap: 0.35rem; justify-content: center;">
                    <button onclick="showDetail('${item['ID Pengajuan']}')" class="btn btn-sm btn-info" title="Detail Pengajuan"><i class="fas fa-eye"></i></button>
                    <button onclick="showStatusModal('${item['ID Pengajuan']}', '${item['Status Pengajuan']}')" class="btn btn-sm btn-warning" title="Update Status"><i class="fas fa-edit"></i></button>
                    <button onclick="viewSurat('${item['ID Pengajuan']}')" class="btn btn-sm btn-primary" title="Lihat Surat"><i class="fas fa-file-alt"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    renderPagination(data.length);
}

function renderPagination(totalItems) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        btn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
        btn.onclick = () => goToPage(i);
        pagination.appendChild(btn);
    }
}

function goToPage(page) {
    currentPage = page;
    renderTable(filteredData);
}

function showDetail(id) {
    const item = dashboardData.find(d => d['ID Pengajuan'] === id);
    if (!item) return;

    let html = '<table class="modern-table" style="font-size: 0.9rem;">';
    for (const key in item) {
        let val = item[key] || '-';
        if (key.includes('Tanggal')) val = formatDate(val);
        html += `<tr><th style="width: 38%; background: var(--gray-50);">${key}</th><td>${val}</td></tr>`;
    }
    html += '</table>';
    
    document.getElementById('detail-content').innerHTML = html;
    document.getElementById('detail-modal').style.display = 'flex';
}

function closeDetailModal() {
    document.getElementById('detail-modal').style.display = 'none';
}

function showStatusModal(id, status) {
    document.getElementById('status-id-pengajuan').value = id;
    document.getElementById('status-select').value = status || 'PENGAJUAN BARU';
    document.getElementById('status-catatan').value = '';
    document.getElementById('status-modal').style.display = 'flex';
}

function closeStatusModal() {
    document.getElementById('status-modal').style.display = 'none';
}

async function updateStatus() {
    const idPengajuan = document.getElementById('status-id-pengajuan').value;
    const status = document.getElementById('status-select').value;
    const catatan = document.getElementById('status-catatan').value;
    
    showLoading('Memperbarui status pengajuan...');
    try {
        const response = await apiCall('updateStatus', {
            idPengajuan,
            status,
            catatan,
            token: getToken()
        }, 'POST');

        if (response.success) {
            showToast('Status berhasil diperbarui', 'success');
            closeStatusModal();
            loadDashboardData();
        } else {
            showToast(response.message || 'Gagal memperbarui status', 'error');
        }
    } catch (e) {
        showToast('Terjadi kesalahan koneksi', 'error');
    } finally {
        hideLoading();
    }
}

function viewSurat(id) {
    const item = dashboardData.find(d => d['ID Pengajuan'] === id);
    if (item) {
        const dataForSurat = {
            idPengajuan: item['ID Pengajuan'],
            nomorSurat: item['Nomor Surat'],
            nik: item['NIK'],
            namaLengkap: item['Nama Lengkap'],
            jabatan: item['Jabatan'],
            departemen: item['Departemen'],
            sektor: item['Sektor'],
            regu: item['Regu'],
            tanggalPengajuan: item['Tanggal Pengajuan'],
            tanggalEfektifResign: item['Tanggal Efektif Resign'],
            alasanResign: item['Alasan Resign'],
            status: item['Status Pengajuan']
        };
        sessionStorage.setItem('resign_data', JSON.stringify(dataForSurat));
        window.location.href = 'surat.html';
    }
}

function printSurat(id) {
    viewSurat(id);
}

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        if (checkAuth()) loadDashboardData();
    }, 5 * 60 * 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        if (checkAuth()) {
            loadDashboardData();
            startAutoRefresh();
        }
        document.querySelectorAll('.filter-input').forEach(el => {
            el.addEventListener('change', applyFilters);
            el.addEventListener('keyup', applyFilters);
        });
    }
});
