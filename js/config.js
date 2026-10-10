// Configuration for Pengajuan Resign Application
const CONFIG = {
    // Google Apps Script Web App URL - Replace with your deployed URL
    API_URL: 'https://script.google.com/macros/s/AKfycbz136-mDKYmtnSWGpZAS85NNCqGb5jE89uQM0gbKcReERq07qZRRax2zkaeaQslzWQZ/exec',

    // Company Info
    COMPANY_NAME: 'PT Mitra Sigma Tekindo',
    COMPANY_LOCATION: 'Majalengka',

    // App Settings
    APP_NAME: 'Pengajuan Resign Karyawan',
    APP_VERSION: '1.0.0',

    // Pagination
    ITEMS_PER_PAGE: 10,

    // Status Options
    STATUS: {
        BARU: 'PENGAJUAN BARU',
        DIPERIKSA: 'DIPERIKSA HRD',
        DISETUJUI: 'DISETUJUI',
        DITOLAK: 'DITOLAK',
        SELESAI: 'SELESAI'
    },

    // Alasan Resign Options
    ALASAN_RESIGN: [
        'Mendapat pekerjaan baru',
        'Keperluan keluarga',
        'Melanjutkan pendidikan',
        'Alasan pribadi',
        'Tidak sesuai dengan pekerjaan',
        'Kondisi kesehatan',
        'Lainnya'
    ],

    // Session timeout in milliseconds (30 minutes)
    SESSION_TIMEOUT: 30 * 60 * 1000,

    // Date format helper
    formatDate: function (date) {
        // Format to DD/MM/YYYY
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    },

    formatDateLong: function (date) {
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        const d = new Date(date);
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    },

    getRomanMonth: function (month) {
        const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
        return roman[month];
    }
};
