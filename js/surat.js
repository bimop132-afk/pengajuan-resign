async function populateLetter() {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id') || urlParams.get('idPengajuan');
    const nikFromUrl = urlParams.get('nik');

    let loadedData = null;

    const dataStr = sessionStorage.getItem('resign_data');
    if (dataStr) {
        try {
            const data = JSON.parse(dataStr);
            if (!idFromUrl || data.idPengajuan === idFromUrl || data['ID Pengajuan'] === idFromUrl) {
                loadedData = data;
            }
        } catch (e) {
            console.error('Failed to parse session data');
        }
    }

    if (!loadedData && idFromUrl) {
        showLoading('Memuat data surat...');
        try {
            const res = await apiCall('checkStatus', { idPengajuan: idFromUrl, nik: nikFromUrl || '' }, 'GET');
            if (res.success && res.data) {
                loadedData = res.data;
            } else {
                showToast('Data pengajuan tidak ditemukan di sistem', 'warning');
            }
        } catch (err) {
            console.error('Gagal memuat surat via API:', err);
            showToast('Gagal mengambil data surat dari server', 'error');
        } finally {
            hideLoading();
        }
    }

    if (loadedData) {
        viewLetter(loadedData);
    } else if (document.getElementById('surat-container')) {
        // If neither session nor URL param provided, show friendly message
        const warningBox = document.createElement('div');
        warningBox.style.cssText = `
            max-width: 210mm; margin: 1rem auto; padding: 1rem 1.25rem;
            background: var(--warning-50, #fffbeb); border: 1px solid var(--warning-100, #fef3c7);
            border-radius: 8px; color: var(--warning-700, #b45309); font-weight: 600; font-size: 0.95rem;
            text-align: center;
        `;
        warningBox.innerHTML = `
            <i class="fas fa-info-circle"></i> Tidak ada data surat resign aktif dalam sesi ini.
            <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem; justify-content: center;">
                <a href="form.html" class="btn btn-sm btn-primary"><i class="fas fa-edit"></i> Buat Pengajuan Baru</a>
                <a href="check-status.html" class="btn btn-sm btn-secondary"><i class="fas fa-search"></i> Cek Status Pengajuan</a>
            </div>
        `;
        const container = document.getElementById('surat-container');
        if (container && container.parentNode) {
            container.parentNode.insertBefore(warningBox, container);
        }
    }
}

function populateLetterFromApiData(apiData) {
    if (!apiData) return;
    viewLetter(apiData);
}

function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = (text !== undefined && text !== null && String(text).trim() !== '') ? String(text).trim() : '-';
}

function viewLetter(data) {
    if (!data) return;

    setElText('surat-nomor', data.nomorSurat || data['Nomor Surat']);
    setElText('surat-nama', data.namaLengkap || data['Nama Lengkap']);
    setElText('surat-nik', data.nik || data['NIK']);
    setElText('surat-jabatan', data.jabatan || data['Jabatan']);
    setElText('surat-departemen', data.departemen || data['Departemen']);
    setElText('surat-sektor', data.sektor || data['Sektor']);
    setElText('surat-regu', data.regu || data['Regu']);
    setElText('surat-tanggal-efektif', formatDateLong(data.tanggalEfektifResign || data['Tanggal Efektif Resign']));
    setElText('surat-alasan', data.alasanResign || data['Alasan Resign']);
    setElText('surat-tanggal-pengajuan', formatDateLong(data.tanggalPengajuan || data['Tanggal Pengajuan']));
    setElText('surat-ttd-nama', data.namaLengkap || data['Nama Lengkap']);
    setElText('surat-ttd-nik', data.nik || data['NIK']);

    // Populating success.html details if they exist
    setElText('detail_id_pengajuan', data.idPengajuan || data['ID Pengajuan']);
    setElText('detail_nama', data.namaLengkap || data['Nama Lengkap']);
    setElText('detail_tanggal_pengajuan', formatDate(data.tanggalPengajuan || data['Tanggal Pengajuan']));
    setElText('detail_tanggal_efektif', formatDate(data.tanggalEfektifResign || data['Tanggal Efektif Resign']));
    setElText('detail_status', data.status || data['Status Pengajuan'] || 'PENGAJUAN BARU');
    setElText('detail_nomor_surat', data.nomorSurat || data['Nomor Surat']);

    // If admin is viewing from dashboard, adjust toolbar back link
    if (sessionStorage.getItem('auth_token')) {
        const backBtn = document.querySelector('.letter-toolbar a');
        if (backBtn) {
            backBtn.href = 'dashboard.html';
            backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Kembali ke Dashboard';
        }
    }
}

function printLetter() {
    window.print();
}

async function downloadPDF() {
    const el = document.getElementById('surat-container');
    if (!el) {
        window.location.href = 'surat.html?download=1';
        return;
    }
    
    const namaEl = document.getElementById('surat-nama') || document.getElementById('detail_nama');
    const nikEl = document.getElementById('surat-nik') || document.getElementById('surat-ttd-nik');
    const nama = namaEl ? namaEl.innerText.replace(/\s+/g, '_').toUpperCase() : 'KARYAWAN';
    const nik = nikEl ? nikEl.innerText.replace(/\s+/g, '') : 'NIK';
    
    if (typeof html2pdf === 'undefined') {
        alert('Library PDF belum termuat. Silakan muat ulang halaman lalu coba kembali.');
        return;
    }

    const toolbar = document.querySelector('.letter-toolbar');
    const origToolbarDisplay = toolbar ? toolbar.style.display : '';
    if (toolbar) toolbar.style.display = 'none';

    const origShadow = el.style.boxShadow;
    const origMargin = el.style.margin;
    el.style.boxShadow = 'none';
    el.style.margin = '0 auto';

    showLoading('Membuat dokumen PDF resmi...');
    try {
        await html2pdf().set({
            margin: [5, 5, 5, 5],
            filename: `SURAT_RESIGN_${nik}_${nama}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0, scrollX: 0 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(el).save();
        showToast('PDF berhasil diunduh', 'success');
    } catch (error) {
        console.error('Gagal membuat PDF surat:', error);
        showToast('PDF gagal dibuat. Silakan gunakan tombol Cetak Surat (Ctrl+P).', 'error');
    } finally {
        hideLoading();
        el.style.boxShadow = origShadow;
        el.style.margin = origMargin;
        if (toolbar) toolbar.style.display = origToolbarDisplay;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const isSurat = document.getElementById('surat-container') !== null;
    const isSuccess = document.getElementById('detail_id_pengajuan') !== null;
    
    if (isSurat || isSuccess) {
        await populateLetter();

        const params = new URLSearchParams(window.location.search);
        if (params.get('print') === '1') {
            setTimeout(() => printLetter(), 600);
        } else if (params.get('download') === '1') {
            setTimeout(() => downloadPDF(), 600);
        }
    }
});

