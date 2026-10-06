function populateLetter() {
    const dataStr = sessionStorage.getItem('resign_data');
    if (dataStr) {
        try {
            const data = JSON.parse(dataStr);
            viewLetter(data);
        } catch (e) {
            console.error('Failed to parse session data');
        }
    }
}

function populateLetterFromApiData(apiData) {
    const normalizedData = {
        idPengajuan: apiData['ID Pengajuan'],
        nomorSurat: apiData['Nomor Surat'],
        nik: apiData['NIK'],
        namaLengkap: apiData['Nama Lengkap'],
        jabatan: apiData['Jabatan'],
        departemen: apiData['Departemen'],
        sektor: apiData['Sektor'],
        regu: apiData['Regu'],
        tanggalPengajuan: apiData['Tanggal Pengajuan'],
        tanggalEfektifResign: apiData['Tanggal Efektif Resign'],
        alasanResign: apiData['Alasan Resign'],
        status: apiData['Status Pengajuan']
    };
    viewLetter(normalizedData);
}

function setElText(id, text) {
    const el = document.getElementById(id);
    if (el) el.innerText = text || '-';
}

function viewLetter(data) {
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
    setElText('detail_id_pengajuan', data.idPengajuan);
    setElText('detail_nama', data.namaLengkap);
    setElText('detail_tanggal_pengajuan', formatDate(data.tanggalPengajuan));
    setElText('detail_tanggal_efektif', formatDate(data.tanggalEfektifResign));
    setElText('detail_status', data.status || 'PENGAJUAN BARU');
    setElText('detail_nomor_surat', data.nomorSurat);
}

function viewSurat() {
    window.location.href = 'surat.html';
}

function printSurat() {
    printLetter();
}

function printLetter() {
    window.print();
}

function downloadPDF() {
    const el = document.getElementById('surat-container');
    if (!el) return;
    
    const nama = document.getElementById('surat-nama') ? document.getElementById('surat-nama').innerText.replace(/\s+/g, '_').toUpperCase() : 'NAMA';
    const nik = document.getElementById('surat-nik') ? document.getElementById('surat-nik').innerText : 'NIK';
    
    const opt = {
        margin: [10, 15, 10, 15],
        filename: `SURAT_RESIGN_${nik}_${nama}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    if (typeof html2pdf !== 'undefined') {
        html2pdf().set(opt).from(el).save();
    } else {
        alert("html2pdf library not loaded.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('surat.html') || window.location.pathname.includes('success.html')) {
        populateLetter();
    }
});
