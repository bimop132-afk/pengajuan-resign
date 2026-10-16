let dashboardData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 10;
let refreshInterval;

async function loadDashboardData() {
    const tbody = document.getElementById('table-body');
    if (tbody && dashboardData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" class="text-center text-muted" style="padding: 3rem 1rem;">
                    <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top: 3px solid var(--primary-600); border-radius: 50%; animation: spinOverlay 0.8s linear infinite; margin-bottom: 0.75rem;"></div>
                    <div style="font-weight: 600;">Memuat data pengajuan dari spreadsheet...</div>
                </td>
            </tr>
        `;
    }

    try {
        const response = await apiCall('getDashboardData', { token: getToken() }, 'GET');
        if (response.success) {
            dashboardData = response.data || [];
            updateStats(dashboardData);
            populateDropdownFilters(dashboardData);
            applyFilters();
        } else if (response.message === 'Token invalid') {
            showToast('Sesi Anda telah berakhir, silakan login kembali', 'warning');
            setTimeout(logout, 1500);
        } else {
            showToast(response.message || 'Gagal memuat data', 'error');
        }
    } catch (e) {
        console.error('Error loadDashboardData:', e);
        showToast('Gagal memuat data pengajuan', 'error');
        if (tbody && dashboardData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center text-muted" style="padding: 2.5rem 1rem;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem; color: var(--danger-600); margin-bottom: 0.5rem;"></i>
                        <p style="margin: 0; font-weight: 600;">Gagal terhubung ke database spreadsheet.</p>
                        <button onclick="loadDashboardData()" class="btn btn-sm btn-primary" style="margin-top: 0.75rem;"><i class="fas fa-redo"></i> Coba Lagi</button>
                    </td>
                </tr>
            `;
        }
    }
}

function updateStats(data) {
    const totalEl = document.getElementById('stat-total');
    const baruEl = document.getElementById('stat-baru');
    const diprosesEl = document.getElementById('stat-diproses');
    const disetujuiEl = document.getElementById('stat-disetujui');
    const ditolakEl = document.getElementById('stat-ditolak');
    const selesaiEl = document.getElementById('stat-selesai');

    if (totalEl) totalEl.innerText = data.length;
    if (baruEl) baruEl.innerText = data.filter(d => (d['Status Pengajuan'] || '').toString().trim().toUpperCase() === 'PENGAJUAN BARU').length;
    if (diprosesEl) diprosesEl.innerText = data.filter(d => (d['Status Pengajuan'] || '').toString().trim().toUpperCase() === 'DIPERIKSA HRD').length;
    if (disetujuiEl) disetujuiEl.innerText = data.filter(d => (d['Status Pengajuan'] || '').toString().trim().toUpperCase() === 'DISETUJUI').length;
    if (ditolakEl) ditolakEl.innerText = data.filter(d => (d['Status Pengajuan'] || '').toString().trim().toUpperCase() === 'DITOLAK').length;
    if (selesaiEl) selesaiEl.innerText = data.filter(d => (d['Status Pengajuan'] || '').toString().trim().toUpperCase() === 'SELESAI').length;
}

function populateDropdownFilters(data) {
    const sektors = [...new Set(data.map(d => (d['Sektor'] || '').toString().trim()).filter(Boolean))].sort();
    const regus = [...new Set(data.map(d => (d['Regu'] || '').toString().trim()).filter(Boolean))].sort();
    const depts = [...new Set(data.map(d => (d['Departemen'] || '').toString().trim()).filter(Boolean))].sort();

    const selSektor = document.getElementById('filter-sektor');
    const selRegu = document.getElementById('filter-regu');
    const selDept = document.getElementById('filter-departemen');

    if (selSektor) {
        const cur = selSektor.value;
        selSektor.innerHTML = '<option value="">Semua Sektor</option>' + sektors.map(s => `<option value="${escapeHtml(s)}" ${s === cur ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('');
    }
    if (selRegu) {
        const cur = selRegu.value;
        selRegu.innerHTML = '<option value="">Semua Regu</option>' + regus.map(r => `<option value="${escapeHtml(r)}" ${r === cur ? 'selected' : ''}>${escapeHtml(r)}</option>`).join('');
    }
    if (selDept) {
        const cur = selDept.value;
        selDept.innerHTML = '<option value="">Semua Departemen</option>' + depts.map(d => `<option value="${escapeHtml(d)}" ${d === cur ? 'selected' : ''}>${escapeHtml(d)}</option>`).join('');
    }
}

function applyFilters() {
    const fNik = (document.getElementById('filter-nik') ? document.getElementById('filter-nik').value : '').trim().toLowerCase();
    const fNama = (document.getElementById('filter-nama') ? document.getElementById('filter-nama').value : '').trim().toLowerCase();
    const fSektor = document.getElementById('filter-sektor') ? document.getElementById('filter-sektor').value : '';
    const fRegu = document.getElementById('filter-regu') ? document.getElementById('filter-regu').value : '';
    const fDept = document.getElementById('filter-departemen') ? document.getElementById('filter-departemen').value : '';
    const fStatus = document.getElementById('filter-status') ? document.getElementById('filter-status').value : '';
    const fTglDari = document.getElementById('filter-tgl-dari') ? document.getElementById('filter-tgl-dari').value : '';
    const fTglSampai = document.getElementById('filter-tgl-sampai') ? document.getElementById('filter-tgl-sampai').value : '';

    filteredData = dashboardData.filter(item => {
        let match = true;
        if (fNik && !(item['NIK'] || '').toString().toLowerCase().includes(fNik)) match = false;
        if (fNama && !(item['Nama Lengkap'] || '').toString().toLowerCase().includes(fNama)) match = false;
        if (fSektor && (item['Sektor'] || '').toString().trim() !== fSektor) match = false;
        if (fRegu && (item['Regu'] || '').toString().trim() !== fRegu) match = false;
        if (fDept && (item['Departemen'] || '').toString().trim() !== fDept) match = false;
        if (fStatus && (item['Status Pengajuan'] || '').toString().trim() !== fStatus) match = false;
        
        const tglPengajuan = getDateOnly(item['Tanggal Pengajuan']);
        if (fTglDari && tglPengajuan && tglPengajuan < fTglDari) match = false;
        if (fTglSampai && tglPengajuan && tglPengajuan > fTglSampai) match = false;

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
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-muted" style="padding: 2.5rem 1rem;">Tidak ada data pengajuan resign yang cocok.</td></tr>';
        renderPagination(0);
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = data.slice(startIndex, startIndex + itemsPerPage);

    paginatedItems.forEach(item => {
        const idPengajuan = (item['ID Pengajuan'] || '').toString().trim();
        const status = (item['Status Pengajuan'] || 'PENGAJUAN BARU').toString().trim();
        
        let badgeClass = 'badge-baru';
        switch(status) {
            case 'PENGAJUAN BARU': badgeClass = 'badge-baru'; break;
            case 'DIPERIKSA HRD': badgeClass = 'badge-diperiksa'; break;
            case 'DISETUJUI': badgeClass = 'badge-disetujui'; break;
            case 'DITOLAK': badgeClass = 'badge-ditolak'; break;
            case 'SELESAI': badgeClass = 'badge-selesai'; break;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong style="color: var(--primary-600);">${escapeHtml(idPengajuan || '-')}</strong></td>
            <td>${escapeHtml(item['NIK'] || '-')}</td>
            <td><strong style="color: var(--gray-900);">${escapeHtml(item['Nama Lengkap'] || '-')}</strong></td>
            <td>${escapeHtml(item['Jabatan'] || '-')}</td>
            <td>${escapeHtml(item['Sektor'] || '-')}</td>
            <td>${escapeHtml(item['Regu'] || '-')}</td>
            <td>${formatDate(item['Tanggal Pengajuan'])}</td>
            <td><strong style="color: var(--danger-600);">${formatDate(item['Tanggal Efektif Resign'])}</strong></td>
            <td><span class="badge ${badgeClass}">${escapeHtml(status)}</span></td>
            <td>${formatNumber(item['Uang Jaminan Nominal'])}</td>
            <td>
                <div style="display: flex; gap: 0.35rem; justify-content: center;">
                    <button class="btn btn-sm btn-info btn-detail-action" title="Detail Pengajuan"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-warning btn-status-action" title="Update Status"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-primary btn-surat-action" title="Lihat Surat"><i class="fas fa-file-alt"></i></button>
                </div>
            </td>
        `;

        // Attach event listeners safely
        tr.querySelector('.btn-detail-action').addEventListener('click', () => showDetail(idPengajuan));
        tr.querySelector('.btn-status-action').addEventListener('click', () => showStatusModal(idPengajuan, status));
        tr.querySelector('.btn-surat-action').addEventListener('click', () => viewSurat(idPengajuan));

        tbody.appendChild(tr);
    });

    renderPagination(data.length);
}

function renderPagination(totalItems) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
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
    const item = dashboardData.find(d => (d['ID Pengajuan'] || '').toString().trim() === id.toString().trim());
    if (!item) return;

    let html = '<table class="modern-table" style="font-size: 0.9rem;">';
    for (const key in item) {
        let val = item[key];
        if (val === undefined || val === null || val === '') {
            val = '-';
        } else if (key.includes('Tanggal') || key.includes('Waktu')) {
            val = formatDate(val);
        } else if (key === 'Uang Jaminan Nominal') {
            val = formatNumber(val);
        } else {
            val = escapeHtml(String(val)).replace(/\n/g, '<br>');
        }
        html += `<tr><th style="width: 38%; background: var(--gray-50); font-weight: 700;">${escapeHtml(key)}</th><td>${val}</td></tr>`;
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
    const catatan = document.getElementById('status-catatan').value.trim();
    
    showLoading('Memperbarui status pengajuan...');
    try {
        const response = await apiCall('updateStatus', {
            idPengajuan,
            status,
            catatan,
            token: getToken()
        }, 'POST');

        if (response.success) {
            showToast('Status pengajuan berhasil diperbarui', 'success');
            closeStatusModal();
            loadDashboardData();
        } else {
            showToast(response.message || 'Gagal memperbarui status', 'error');
        }
    } catch (e) {
        showToast(e.message || 'Terjadi kesalahan koneksi', 'error');
    } finally {
        hideLoading();
    }
}

function viewSurat(id) {
    const item = dashboardData.find(d => (d['ID Pengajuan'] || '').toString().trim() === id.toString().trim());
    if (item) {
        const dataForSurat = {
            idPengajuan: item['ID Pengajuan'],
            nomorSurat: item['Nomor Surat'],
            nik: item['NIK'],
            namaLengkap: item['Nama Lengkap'],
            tempatLahir: item['Tempat Lahir'],
            tanggalLahir: item['Tanggal Lahir'],
            jenisKelamin: item['Jenis Kelamin'],
            alamat: item['Alamat'],
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
        window.location.href = `surat.html?id=${encodeURIComponent(item['ID Pengajuan'] || '')}&nik=${encodeURIComponent(item['NIK'] || '')}`;
    }
}

function exportToCSV() {
    if (!dashboardData || dashboardData.length === 0) {
        showToast('Tidak ada data untuk diekspor', 'warning');
        return;
    }
    
    const exportItems = filteredData.length > 0 ? filteredData : dashboardData;
    const headers = Object.keys(exportItems[0]);
    const csvRows = [headers.map(h => `"${h}"`).join(',')];

    exportItems.forEach(row => {
        const values = headers.map(header => {
            const val = row[header] === undefined || row[header] === null ? '' : String(row[header]).replace(/"/g, '""');
            return `"${val}"`;
        });
        csvRows.push(values.join(','));
    });

    const csvContent = "\uFEFF" + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DATA_RESIGN_${getCurrentDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Berhasil mengekspor ${exportItems.length} data ke CSV`, 'success');
}

function refreshDashboard() {
    showToast('Memperbarui data...', 'info');
    loadDashboardData();
}

function startAutoRefresh() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
        if (checkAuth()) loadDashboardData();
    }, 5 * 60 * 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    const isDashboard = window.location.pathname.toLowerCase().includes('dashboard.html') || document.getElementById('table-body') !== null;
    if (isDashboard) {
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

