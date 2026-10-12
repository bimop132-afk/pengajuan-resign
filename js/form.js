let currentStep = 1;

function initForm() {
    const form = document.getElementById('form-resign');
    if (!form) return;

    const tglPengajuan = document.getElementById('tanggal_pengajuan');
    if (tglPengajuan) tglPengajuan.value = getCurrentDate();

    const alasanResign = document.getElementById('alasan_resign');
    if (alasanResign) {
        alasanResign.addEventListener('change', function() {
            const container = document.getElementById('alasan_lainnya_container');
            if (this.value === 'Lainnya') {
                container.style.display = 'block';
            } else {
                container.style.display = 'none';
            }
        });
    }

    const fileInput = document.getElementById('dokumen_pendukung');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // Auto-fetch uang jaminan when NIK loses focus
    const nikInput = document.getElementById('nik');
    if (nikInput) {
        nikInput.addEventListener('blur', function() {
            const nik = this.value.trim();
            if (nik) fetchUangJaminan(nik);
        });
    }

    updateStepIndicator();
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) {
            showToast('Ukuran file maksimal 5MB', 'error');
            e.target.value = '';
            return;
        }
        // Can add base64 reading here if needed to store
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
    } else if (step === 2) {
        if (!validateField('tanggal_efektif_resign', { required: true })) isValid = false;
        const tglEfektif = document.getElementById('tanggal_efektif_resign').value;
        if (tglEfektif && tglEfektif <= getCurrentDate()) {
            showFieldError('tanggal_efektif_resign', 'Tanggal efektif harus setelah hari ini');
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
            showToast('Harap centang kedua persetujuan', 'error');
            isValid = false;
        }
    }
    return isValid;
}

function nextStep(step) {
    if (!validateStep(currentStep)) return;
    
    document.getElementById(`section${currentStep}`).style.display = 'none';
    currentStep = step;
    document.getElementById(`section${currentStep}`).style.display = 'block';
    updateStepIndicator();
}

function prevStep(step) {
    document.getElementById(`section${currentStep}`).style.display = 'none';
    currentStep = step;
    document.getElementById(`section${currentStep}`).style.display = 'block';
    updateStepIndicator();
}

function showConfirmation() {
    if (!validateStep(3)) return;
    document.getElementById('confirm-modal').style.display = 'flex';
}

function closeConfirmation() {
    document.getElementById('confirm-modal').style.display = 'none';
}

async function fetchUangJaminan(nik) {
    try {
        const response = await apiCall('getUangJaminan', { nik: nik }, 'GET');
        if (response.success && response.data) {
            const nominal = document.getElementById('uang_jaminan_nominal');
            const status = document.getElementById('uang_jaminan_status');
            if (nominal) nominal.value = response.data['Nominal'] || response.data['Nominal Uang Jaminan'] || '-';
            if (status) status.value = response.data['Status'] || response.data['Status Uang Jaminan'] || 'Tidak ditemukan';
        }
    } catch (err) {
        console.error('Gagal mengambil data uang jaminan:', err);
    }
}

function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

async function submitForm() {
    closeConfirmation();
    showLoading('Mengirim pengajuan...');
    
    const formData = {
        nik: getVal('nik'),
        namaLengkap: getVal('nama_lengkap'),
        tempatLahir: getVal('tempatlahir'),
        tanggalLahir: getVal('datinglahir'),
        jenisKelamin: getVal('jeniskelamin'),
        alamat: getVal('alamat'),
        noWhatsApp: getVal('no_whatsapp'),
        email: getVal('email'),
        jabatan: getVal('jabatan'),
        departemen: getVal('departemen'),
        sektor: getVal('sektor'),
        regu: getVal('regu'),
        tanggalMulaiBekerja: getVal('dating_mulai_bekerja'),
        atasanPIC: getVal('atasan_pic'),
        tanggalPengajuan: getVal('dating_pengajuan'),
        tanggalEfektifResign: getVal('dating_efektif_resign'),
        alasanResign: document.getElementById('alasan_resign').value === 'Lainnya' ? getVal('alasan_lainnya') : getVal('alasan_resign'),
        keterangan: getVal('eterangan'),
        uangJaminanNominal: getVal('uang_jaminan_nominal'),
        uangJaminanStatus: getVal('uang_jaminan_status')
    };

    try {
        const response = await apiCall('submitResign', formData, 'POST');
        if (response.success) {
            const sessionData = {
                idPengajuan: response.data.idPengajuan,
                nomorSurat: response.data.nomorSurat,
                nik: formData.nik,
                namaLengkap: formData.namaLengkap,
                jabatan: formData.jabatan,
                departemen: formData.departemen,
                sektor: formData.sektor,
                regu: formData.regu,
                tanggalPengajuan: formData.tanggalPengajuan,
                tanggalEfektifResign: formData.tanggalEfektifResign,
                alasanResign: formData.alasanResign,
                keterangan: formData.keterangan,
                status: 'PENGAJUAN BARU'
            };
            sessionStorage.setItem('resign_data', JSON.stringify(sessionData));
            window.location.href = 'success.html';
        } else {
            showToast(response.message || 'Gagal mengirim pengajuan', 'error');
        }
    } catch (err) {
        console.error('Submit error:', err);
        showToast('Gagal terhubung ke server. Pastikan API_URL di config.js sudah benar.', 'error');
    } finally {
        hideLoading();
    }
}
    } catch (err) {
        console.error('Submit error:', err);
        showToast('Gagal terhubung ke server. Pastikan API_URL di config.js sudah benar.', 'error');
    } finally {
        hideLoading();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('form-resign')) {
        initForm();
    }
});
