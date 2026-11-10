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
                <td colspan="12" class="text-center text-muted" style="padding: 3rem 1rem;">
                    <div style="display: inline-block; width: 32px; height: 32px; border: 3px solid #e2e8f0; border-top: 3px solid var(--primary-600); border-radius: 50%; animation: spinOverlay 0.8s linear infinite; margin-bottom: 0.75rem;"></div>
                    <div style="font-weight: 600;">Memuat data pengajuan dari spreadsheet...</div>
                </td>
            </tr>
        `;
    }

    try {
        const response = await apiCall('getDashboardData', { token: getToken() }, 'GET');
        if (response.success) {
            // Urutan terbaru di atas (Sort descending by timestamp / tanggal / ID)
            dashboardData = (response.data || []).sort((a, b) => {
                const timeA = new Date(a['Waktu Pengajuan'] || a['Tanggal Pengajuan'] || 0).getTime();
                const timeB = new Date(b['Waktu Pengajuan'] || b['Tanggal Pengajuan'] || 0).getTime();
                if (timeA !== timeB && !isNaN(timeA) && !isNaN(timeB)) return timeB - timeA;
                return (b['ID Pengajuan'] || '').localeCompare(a['ID Pengajuan'] || '');
            });

            populateCutOffFilter(dashboardData);
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
                    <td colspan="12" class="text-center text-muted" style="padding: 2.5rem 1rem;">
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

// Menghitung periode cut-off (26 bulan lalu s/d 25 bulan ini)
function getCutOffPeriodForDate(dateInput) {
    if (!dateInput) return null;
    let d;
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
        const [y, m, day] = dateInput.split('-').map(Number);
        d = new Date(y, m - 1, day);
    } else {
        d = new Date(dateInput);
    }
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed
    const day = d.getDate();

    let startD, endD, periodLabel;
    const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthsFull = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

    if (day >= 26) {
        // Dari tanggal 26 bulan ini s/d 25 bulan depan
        startD = new Date(year, month, 26);
        endD = new Date(year, month + 1, 25);
    } else {
        // Dari tanggal 26 bulan lalu s/d 25 bulan ini
        startD = new Date(year, month - 1, 26);
        endD = new Date(year, month, 25);
    }

    const startStr = getDateOnly(startD);
    const endStr = getDateOnly(endD);
    const endMonthName = monthsFull[endD.getMonth()];
    const label = `Periode 26 ${monthsShort[startD.getMonth()]} - 25 ${monthsShort[endD.getMonth()]} ${endD.getFullYear()} (${endMonthName} ${endD.getFullYear()})`;

    return {
        key: `${startStr}_${endStr}`,
        startStr,
        endStr,
        label,
        endYear: endD.getFullYear(),
        endMonth: endD.getMonth()
    };
}

function populateCutOffFilter(data) {
    const selPeriode = document.getElementById('filter-periode');
    if (!selPeriode) return;

    const currentVal = selPeriode.value;
    const periodMap = new Map();

    // Pastikan periode cut-off saat ini selalu ada
    const currentPeriod = getCutOffPeriodForDate(new Date());
    if (currentPeriod) {
        periodMap.set(currentPeriod.key, currentPeriod);
    }

    // Ambil semua periode cut-off dari data pengajuan
    data.forEach(item => {
        const p = getCutOffPeriodForDate(item['Tanggal Pengajuan'] || item['Waktu Pengajuan']);
        if (p && !periodMap.has(p.key)) {
            periodMap.set(p.key, p);
        }
    });

    // Urutkan periode terbaru di atas
    const sortedPeriods = Array.from(periodMap.values()).sort((a, b) => b.startStr.localeCompare(a.startStr));

    let html = '<option value="">Semua Data (Tanpa Filter Periode)</option>';
    sortedPeriods.forEach(p => {
        const isCurrent = currentPeriod && p.key === currentPeriod.key;
        const display = isCurrent ? `★ ${p.label} [Periode Berjalan]` : p.label;
        html += `<option value="${p.key}" ${p.key === currentVal ? 'selected' : ''}>${escapeHtml(display)}</option>`;
    });

    selPeriode.innerHTML = html;
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
    const fPeriode = (document.getElementById('filter-periode') ? document.getElementById('filter-periode').value : '').trim();
    const fNik = (document.getElementById('filter-nik') ? document.getElementById('filter-nik').value : '').trim().toLowerCase();
    const fNama = (document.getElementById('filter-nama') ? document.getElementById('filter-nama').value : '').trim().toLowerCase();
    const fSektor = document.getElementById('filter-sektor') ? document.getElementById('filter-sektor').value : '';
    const fRegu = document.getElementById('filter-regu') ? document.getElementById('filter-regu').value : '';
    const fDept = document.getElementById('filter-departemen') ? document.getElementById('filter-departemen').value : '';
    const fStatus = document.getElementById('filter-status') ? document.getElementById('filter-status').value : '';
    const fTglDari = document.getElementById('filter-tgl-dari') ? document.getElementById('filter-tgl-dari').value : '';
    const fTglSampai = document.getElementById('filter-tgl-sampai') ? document.getElementById('filter-tgl-sampai').value : '';

    let periodStart = '', periodEnd = '';
    if (fPeriode && fPeriode.includes('_')) {
        [periodStart, periodEnd] = fPeriode.split('_');
    }

    filteredData = dashboardData.filter(item => {
        let match = true;
        const tglPengajuan = getDateOnly(item['Tanggal Pengajuan']);

        // Filter Periode Cut-Off (26 - 25)
        if (periodStart && periodEnd && tglPengajuan) {
            if (tglPengajuan < periodStart || tglPengajuan > periodEnd) match = false;
        }

        if (fNik && !(item['NIK'] || '').toString().toLowerCase().includes(fNik)) match = false;
        if (fNama && !(item['Nama Lengkap'] || '').toString().toLowerCase().includes(fNama)) match = false;
        if (fSektor && (item['Sektor'] || '').toString().trim() !== fSektor) match = false;
        if (fRegu && (item['Regu'] || '').toString().trim() !== fRegu) match = false;
        if (fDept && (item['Departemen'] || '').toString().trim() !== fDept) match = false;
        if (fStatus && (item['Status Pengajuan'] || '').toString().trim() !== fStatus) match = false;
        
        if (fTglDari && tglPengajuan && tglPengajuan < fTglDari) match = false;
        if (fTglSampai && tglPengajuan && tglPengajuan > fTglSampai) match = false;

        return match;
    });

    updateStats(filteredData);
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
        tbody.innerHTML = '<tr><td colspan="12" class="text-center text-muted" style="padding: 2.5rem 1rem;">Tidak ada data pengajuan resign yang cocok.</td></tr>';
        renderPagination(0);
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedItems = data.slice(startIndex, startIndex + itemsPerPage);

    paginatedItems.forEach(item => {
        const idPengajuan = (item['ID Pengajuan'] || '').toString().trim();
        const status = (item['Status Pengajuan'] || 'PENGAJUAN BARU').toString().trim();
        const kategori = (item['Kategori Resign'] || 'Resign Normal').toString().trim();
        const dendaVal = Number(String(item['Denda Resign'] || '0').replace(/[^\d.-]/g, '')) || 0;
        
        let badgeClass = 'badge-baru';
        switch(status) {
            case 'PENGAJUAN BARU': badgeClass = 'badge-baru'; break;
            case 'DIPERIKSA HRD': badgeClass = 'badge-diperiksa'; break;
            case 'DISETUJUI': badgeClass = 'badge-disetujui'; break;
            case 'DITOLAK': badgeClass = 'badge-ditolak'; break;
            case 'SELESAI': badgeClass = 'badge-selesai'; break;
        }

        // Badge Kategori & Denda Resign
        let dendaBadge = '';
        if (kategori === 'Habis Kontrak') {
            dendaBadge = '<span class="badge badge-disetujui" title="Habis Kontrak: Bebas Denda">Habis Kontrak (Rp 0)</span>';
        } else if (kategori === 'Resign Mendadak' || dendaVal > 0) {
            dendaBadge = `<span class="badge badge-ditolak" title="Resign Mendadak (< 1 Bulan)">Mendadak (Rp ${formatNumber(dendaVal || 125000)})</span>`;
        } else {
            dendaBadge = '<span class="badge badge-selesai" title="Resign Normal Sesuai Prosedur">Normal (Rp 0)</span>';
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
            <td>${dendaBadge}</td>
            <td>${formatNumber(item['Uang Jaminan Nominal'])}</td>
            <td>
                <div style="display: flex; gap: 0.35rem; justify-content: center;">
                    <button class="btn btn-sm btn-info btn-detail-action" title="Detail Pengajuan"><i class="fas fa-eye"></i></button>
                    <button class="btn btn-sm btn-warning btn-status-action" title="Update Status & Denda"><i class="fas fa-edit"></i></button>
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
        } else if (key === 'Denda Resign') {
            const num = Number(String(val).replace(/[^\d.-]/g, '')) || 0;
            val = num > 0 ? `<strong style="color: var(--danger-600);">Rp ${formatNumber(num)} (Denda Resign Mendadak)</strong>` : '<span style="color: var(--success-600); font-weight:700;">Rp 0 (Bebas Denda)</span>';
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
    const item = dashboardData.find(d => (d['ID Pengajuan'] || '').toString().trim() === id.toString().trim());
    document.getElementById('status-id-pengajuan').value = id;
    document.getElementById('status-select').value = status || 'PENGAJUAN BARU';
    document.getElementById('status-catatan').value = '';

    const kategoriSel = document.getElementById('status-kategori');
    const dendaInput = document.getElementById('status-denda');

    if (item && kategoriSel) {
        kategoriSel.value = item['Kategori Resign'] || 'Resign Normal';
    }
    if (item && dendaInput) {
        const dendaVal = Number(String(item['Denda Resign'] || '0').replace(/[^\d.-]/g, '')) || 0;
        dendaInput.value = dendaVal;
    }

    document.getElementById('status-modal').style.display = 'flex';
}

function onAdminKategoriChange() {
    const kategori = document.getElementById('status-kategori').value;
    const dendaInput = document.getElementById('status-denda');
    if (!dendaInput) return;

    if (kategori === 'Resign Mendadak') {
        dendaInput.value = 125000;
    } else if (kategori === 'Habis Kontrak' || kategori === 'Resign Normal') {
        dendaInput.value = 0; // Habis kontrak atau normal bebas denda
    }
}

function closeStatusModal() {
    document.getElementById('status-modal').style.display = 'none';
}

async function updateStatus() {
    const idPengajuan = document.getElementById('status-id-pengajuan').value;
    const status = document.getElementById('status-select').value;
    const catatan = document.getElementById('status-catatan').value.trim();
    const kategoriResign = document.getElementById('status-kategori') ? document.getElementById('status-kategori').value : 'Resign Normal';
    const dendaResign = document.getElementById('status-denda') ? document.getElementById('status-denda').value : 0;
    
    showLoading('Memperbarui status & verifikasi resign...');
    try {
        const response = await apiCall('updateStatus', {
            idPengajuan,
            status,
            catatan,
            kategoriResign,
            dendaResign,
            token: getToken()
        }, 'POST');

        if (response.success) {
            showToast('Status & kategori pengajuan berhasil diperbarui', 'success');
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
            status: item['Status Pengajuan'],
            kategoriResign: item['Kategori Resign'],
            dendaResign: item['Denda Resign']
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

    const fPeriode = document.getElementById('filter-periode') ? document.getElementById('filter-periode').value : '';
    let filename = `DATA_RESIGN_${getCurrentDate()}.csv`;
    if (fPeriode) {
        filename = `DATA_RESIGN_CUTOFF_${fPeriode}.csv`;
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Berhasil mengekspor ${exportItems.length} data ke CSV (${filename})`, 'success');
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
