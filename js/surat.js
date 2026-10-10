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

function printLetter() {
    window.print();
}

async function downloadPDF() {
    const el = document.getElementById('surat-container');
    if (!el) return;
    
    const nama = document.getElementById('surat-nama') ? document.getElementById('surat-nama').innerText.replace(/\s+/g, '_').toUpperCase() : 'NAMA';
    const nik = document.getElementById('surat-nik') ? document.getElementById('surat-nik').innerText : 'NIK';
    
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
        alert('Library PDF belum termuat. Silakan muat ulang halaman lalu coba kembali.');
        return;
    }

    // Clone the letter to a detached element so we can render it without affecting the page
    const exportLetter = el.cloneNode(true);
    exportLetter.removeAttribute('id');
    exportLetter.style.position = 'absolute';
    exportLetter.style.top = '0';
    exportLetter.style.left = '0';
    exportLetter.style.width = '210mm';
    exportLetter.style.height = 'auto';
    exportLetter.style.background = '#ffffff';
    exportLetter.style.visibility = 'hidden';
    exportLetter.style.zIndex = '-1';
    exportLetter.style.boxShadow = 'none';
    exportLetter.style.margin = '0';
    exportLetter.style.padding = '20mm 18mm';
    document.body.appendChild(exportLetter);

    try {
        const canvas = await html2canvas(exportLetter, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            width: exportLetter.scrollWidth,
            height: exportLetter.scrollHeight,
            windowWidth: exportLetter.scrollWidth,
            windowHeight: exportLetter.scrollHeight
        });

        const pdf = new window.jspdf.jsPDF({
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        });
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 10;
        const maxWidth = pageWidth - (margin * 2);
        const maxHeight = pageHeight - (margin * 2);
        const imageRatio = canvas.width / canvas.height;
        const imageWidth = Math.min(maxWidth, maxHeight * imageRatio);
        const imageHeight = imageWidth / imageRatio;
        const x = (pageWidth - imageWidth) / 2;
        const y = (pageHeight - imageHeight) / 2;

        pdf.addImage(canvas.toDataURL('image/jpeg', 0.98), 'JPEG', x, y, imageWidth, imageHeight);
        pdf.save(`SURAT_RESIGN_${nik}_${nama}.pdf`);
    } catch (error) {
        console.error('Gagal membuat PDF surat:', error);
        alert('PDF gagal dibuat. Silakan coba kembali.');
    } finally {
        exportLetter.remove();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('surat.html') || window.location.pathname.includes('success.html')) {
        populateLetter();
    }
});
