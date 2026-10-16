let currentStep = 1;

function initForm() {
    const form = document.getElementById('form-resign');
    if (!form) return;

    const tglPengajuan = document.getElementById('tanggal_pengajuan');
    if (tglPengajuan && !tglPengajuan.value) {
        tglPengajuan.value = getCurrentDate();
    }

    const alasanResign = document.getElementById('alasan_resign');
    if (alasanResign) {
        alasanResign.addEventListener('change', function() {
            const container = document.getElementById('alasan_lainnya_container');
            const textarea = document.getElementById('alasan_lainnya');
            if (container) {
                if (this.value === 'Lainnya') {
                    container.style.display = 'block';
                    if (textarea) textarea.focus();
                } else {
                    container.style.display = 'none';
                    if (textarea) textarea.value = '';
                }
            }
        });
    }

    const fileInput = document.getElementById('dokumen_pendukung');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // Auto-fetch uang jaminan when NIK loses focus or changes
    const nikInput = document.getElementById('nik');
    if (nikInput) {
        nikInput.addEventListener('blur', function() {
            const nik = this.value.trim();
            if (nik) fetchUangJaminan(nik);
        });
        nikInput.addEventListener('change', function() {
            const nik = this.value.trim();
            if (nik) fetchUangJaminan(nik);
        });
    }

    updateStepIndicator();
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    const uploadText = document.querySelector('.file-upload-area p');
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showToast('Ukuran file maksimal 5MB', 'error');
            e.target.value = '';
            if (uploadText) {
                uploadText.innerText = 'Klik untuk memilih file dokumen pendukung (PDF, JPG, PNG - Maks 5MB)';
            }
            return;
        }
        if (uploadText) {
            const sizeKb = (file.size / 1024).toFixed(1);
            uploadText.innerHTML = `<strong style="color: var(--success-600);"><i class="fas fa-check-circle"></i> File terpilih: ${escapeHtml(file.name)} (${sizeKb} KB)</strong>`;
        }
    }
}

function updateStepIndicator() {
    document.querySelectorAll('.progress-indicator .step').forEach((stepEl, index) => {
        if (index + 1 < currentStep) {
            stepEl.classList.add('completed');
            stepEl.classList.remove('active');
        } else if (index + 1 === currentStep) {
            stepEl.classList.add('active');
            stepEl.classList.remove('completed');
        } else {
            stepEl.classList.remove('active', 'completed');
        }
    });
}

function validateStep(step) {
    clearAllErrors();
    let isValid = true;
    
    if (step === 1) {
        if (!validateField('nik', { required: true })) isValid = false;
        if (!validateField('nama_lengkap', { required: true })) isValid = false;
        if (!validateField('no_whatsapp', { required: true })) isValid = false;
        if (!validateField('jabatan', { required: true })) isValid = false;
        
        const emailVal = getVal('email');
        if (emailVal && !validateField('email', { type: 'email' })) {
            isValid = false;
        }
    } else if (step === 2) {
        if (!validateField('tanggal_efektif_resign', { required: true })) isValid = false;
        const tglEfektif = document.getElementById('tanggal_efektif_resign').value;
        if (tglEfektif && tglEfektif < getCurrentDate()) {
            showFieldError('tanggal_efektif_resign', 'Tanggal efektif tidak boleh tanggal lampau');
            isValid = false;
        }
        if (!validateField('alasan_resign', { required: true })) isValid = false;
        
        const alasan = document.getElementById('alasan_resign').value;
        if (alasan === 'Lainnya') {
            if (!validateField('alasan_lainnya', { required: true })) isValid = false;
        }
    } else if (step === 3) {
        const c1 = document.getElementById('confirm_1').checked;
        const c2 = document.getElementById('confirm_2').checked;
        if (!c1 || !c2) {
            showToast('Harap centang kedua kotak persetujuan', 'warning');
            isValid = false;
        }
    }
    
    return isValid;
}

function nextStep(step) {
    if (!validateStep(currentStep)) return;
    
    const curSec = document.getElementById(`section${currentStep}`);
    const nextSec = document.getElementById(`section${step}`);
    if (curSec) curSec.style.display = 'none';
    if (nextSec) nextSec.style.display = 'block';
    
    currentStep = step;
    updateStepIndicator();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(step) {
    const curSec = document.getElementById(`section${currentStep}`);
    const prevSec = document.getElementById(`section${step}`);
    if (curSec) curSec.style.display = 'none';
    if (prevSec) prevSec.style.display = 'block';
    
    currentStep = step;
    updateStepIndicator();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showConfirmation() {
    if (!validateStep(3)) return;
    document.getElementById('confirm-modal').style.display = 'flex';
}

function closeConfirmation() {
    document.getElementById('confirm-modal').style.display = 'none';
}

async function fetchUangJaminan(nik) {
    const nominal = document.getElementById('uang_jaminan_nominal');
    const status = document.getElementById('uang_jaminan_status');
    if (nominal) nominal.value = 'Mengecek...';
    if (status) status.value = 'Mengecek...';

    try {
        const response = await apiCall('getUangJaminan', { nik: nik }, 'GET');
        if (response.success && response.data) {
            const nom = response.data['Nominal'] || response.data['Nominal Uang Jaminan'] || response.data['nominal'] || '-';
            const stat = response.data['Status'] || response.data['Status Uang Jaminan'] || response.data['status'] || 'Aktif';
            if (nominal) nominal.value = (typeof nom === 'number' || /^\d+$/.test(String(nom).trim())) ? `Rp ${formatNumber(nom)}` : nom;
            if (status) status.value = stat;
        } else {
            if (nominal) nominal.value = '-';
            if (status) status.value = 'Tidak ada catatan';
        }
    } catch (err) {
        console.error('Gagal mengambil data uang jaminan:', err);
        if (nominal) nominal.value = '-';
        if (status) status.value = 'Gagal memuat';
    }
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
}

async function submitForm() {
    closeConfirmation();
    showLoading('Mengirim pengajuan resign ke sistem...');
    
    const formData = {
        nik: getVal('nik'),
        namaLengkap: getVal('nama_lengkap'),
        tempatLahir: getVal('tempat_lahir'),
        tanggalLahir: getVal('tanggal_lahir'),
        jenisKelamin: getVal('jenis_kelamin'),
        alamat: getVal('alamat'),
        noWhatsApp: getVal('no_whatsapp'),
        email: getVal('email'),
        jabatan: getVal('jabatan'),
        departemen: getVal('departemen'),
        sektor: getVal('sektor'),
        regu: getVal('regu'),
        tanggalMulaiBekerja: getVal('tanggal_mulai_bekerja'),
        atasanPIC: getVal('atasan_pic'),
        tanggalPengajuan: getVal('tanggal_pengajuan') || getCurrentDate(),
        tanggalEfektifResign: getVal('tanggal_efektif_resign'),
        alasanResign: (document.getElementById('alasan_resign').value === 'Lainnya') ? getVal('alasan_lainnya') : getVal('alasan_resign'),
        keterangan: getVal('keterangan'),
        uangJaminanNominal: getVal('uang_jaminan_nominal'),
        uangJaminanStatus: getVal('uang_jaminan_status')
    };

    try {
        const response = await apiCall('submitResign', formData, 'POST');
        if (response.success && response.data) {
            const sessionData = {
                idPengajuan: response.data.idPengajuan,
                nomorSurat: response.data.nomorSurat,
                nik: formData.nik,
                namaLengkap: formData.namaLengkap,
                tempatLahir: formData.tempatLahir,
                tanggalLahir: formData.tanggalLahir,
                jenisKelamin: formData.jenisKelamin,
                alamat: formData.alamat,
                noWhatsApp: formData.noWhatsApp,
                email: formData.email,
                jabatan: formData.jabatan,
                departemen: formData.departemen,
                sektor: formData.sektor,
                regu: formData.regu,
                tanggalMulaiBekerja: formData.tanggalMulaiBekerja,
                atasanPIC: formData.atasanPIC,
                tanggalPengajuan: formData.tanggalPengajuan,
                tanggalEfektifResign: formData.tanggalEfektifResign,
                alasanResign: formData.alasanResign,
                keterangan: formData.keterangan,
                uangJaminanNominal: formData.uangJaminanNominal,
                uangJaminanStatus: formData.uangJaminanStatus,
                status: 'PENGAJUAN BARU'
            };
            sessionStorage.setItem('resign_data', JSON.stringify(sessionData));
            window.location.href = `success.html?id=${encodeURIComponent(response.data.idPengajuan)}&nik=${encodeURIComponent(formData.nik)}`;
        } else {
            showToast(response.message || 'Gagal mengirim pengajuan', 'error');
        }
    } catch (err) {
        console.error('Submit error:', err);
        showToast(err.message || 'Gagal terhubung ke server. Pastikan Web App Apps Script sudah aktif.', 'error');
    } finally {
        hideLoading();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('form-resign')) {
        initForm();
    }
});

