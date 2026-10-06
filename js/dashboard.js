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

function applyFilters() {
    const fNik = (document.getElementById('filter-nik').value || '').toLowerCase();
    const fNama = (document.getElementById('filter-nama').value || '').toLowerCase();
    const fSektor = document.getElementById('filter-sektor').value;
    const fRegu = document.getElementById('filter-regu').value;
    const fDept = document.getElementById('filter-departemen').value;
    const fStatus = document.getElementById('filter-status').value;
    const fTglDari = document.getElementById('filter-tgl-dari').value;
    const fTglSampai = document.getElementById('filter-tgl-sampai').value;
    const fEfektifDari = document.getElementById('filter-tgl-efektif-dari').value;
    const fEfektifSampai = document.getElementById('filter-tgl-efektif-sampai').value;

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

        const tglEfektif = item['Tanggal Efektif Resign'] ? item['Tanggal Efektif Resign'].split('T')[0] : '';
        if (fEfektifDari && tglEfektif < fEfektifDari) match = false;
        if (fEfektifSampai && tglEfektif > fEfektifSampai) match = false;

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
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Tidak ada data</td></tr>';
        renderPagination(0);
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = data.slice(startIndex, startIndex + itemsPerPage);

    paginatedItems.forEach(item => {
        let badgeClass = '';
        switch(item['Status Pengajuan']) {
            case 'PENGAJUAN BARU': badgeClass = 'badge-baru'; break;
            case 'DIPERIKSA HRD': badgeClass = 'badge-diperiksa'; break;
            case 'DISETUJUI': badgeClass = 'badge-disetujui'; break;
            case 'DITOLAK': badgeClass = 'badge-ditolak'; break;
            case 'SELESAI': badgeClass = 'badge-selesai'; break;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item['ID Pengajuan']}</td>
            <td>${item['NIK']}</td>
            <td>${item['Nama Lengkap']}</td>
            <td>${item['Jabatan']}</td>
            <td>${item['Sektor']}</td>
            <td>${item['Regu']}</td>
            <td>${formatDate(item['Tanggal Pengajuan'])}</td>
            <td>${formatDate(item['Tanggal Efektif Resign'])}</td>
            <td><span class="badge ${badgeClass}">${item['Status Pengajuan']}</span></td>
            <td>
                <button onclick="showDetail('${item['ID Pengajuan']}')">Detail</button>
                <button onclick="showStatusModal('${item['ID Pengajuan']}', '${item['Status Pengajuan']}')">Ubah Status</button>
                <button onclick="viewSurat('${item['ID Pengajuan']}')">Lihat Surat</button>
                <button onclick="printSurat('${item['ID Pengajuan']}')">Cetak</button>
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
    
    if(totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        if (i === currentPage) btn.className = 'active';
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

    let html = '<table class="detail-table">';
    for (const key in item) {
        html += `<tr><th>${key}</th><td>${item[key] || '-'}</td></tr>`;
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
    document.getElementById('status-select').value = status;
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
    
    showLoading('Memperbarui status...');
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
            showToast(response.message || 'Gagal memperbarui', 'error');
        }
    } catch (e) {
        showToast('Terjadi kesalahan', 'error');
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
        window.open('surat.html', '_blank');
    }
}

function printSurat(id) {
    viewSurat(id); // viewSurat opens it. In a real app, might want to trigger print there.
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
