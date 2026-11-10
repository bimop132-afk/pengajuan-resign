let hrsdmData = { employees: [], candidates: [], contracts: [], onboarding: [], warnings: [], workforce: [] };
let currentModule = 'candidates';
let moduleCurrentPage = 1;
const moduleItemsPerPage = 10;
let moduleFilteredData = [];

const modules = {
  candidates: {
    title: 'Pipeline Kandidat',
    description: 'Pantau kandidat dari seleksi sampai penempatan.',
    sheet: 'Kandidat',
    id: 'ID Kandidat',
    fields: [
      ['Nama Lengkap', 'text'],
      ['No WhatsApp', 'tel'],
      ['Posisi Dilamar', 'text'],
      ['Sumber Kandidat', 'text'],
      ['Tahap', 'select:Seleksi|Tidak Lolos|Menunggu Tanda Tangan Kontrak|Belum Dapat APD|Belum Ditempatkan|Sudah Ditempatkan'],
      ['Tanggal Masuk', 'date'],
      ['Catatan', 'textarea']
    ],
    columns: ['ID Kandidat', 'Nama Lengkap', 'Posisi Dilamar', 'Tahap', 'No WhatsApp', 'Tanggal Masuk', 'Catatan']
  },
  employees: {
    title: 'Database Karyawan',
    description: 'Master data karyawan aktif dan status kelengkapan administrasinya.',
    sheet: 'Karyawan',
    id: 'NIK',
    fields: [
      ['NIK', 'text'],
      ['Nama Lengkap', 'text'],
      ['Jabatan', 'text'],
      ['Departemen', 'text'],
      ['Sektor', 'text'],
      ['Regu', 'text'],
      ['Status Karyawan', 'select:Aktif|Kontrak|Tetap|Nonaktif'],
      ['Tanggal Mulai Bekerja', 'date'],
      ['No WhatsApp', 'tel']
    ],
    columns: ['NIK', 'Nama Lengkap', 'Jabatan', 'Departemen', 'Sektor', 'Regu', 'Status Karyawan', 'Tanggal Mulai Bekerja']
  },
  contracts: {
    title: 'Kontrak Kerja',
    description: 'Kendalikan status dan tanggal berakhir kontrak agar tidak terlewat.',
    sheet: 'Kontrak',
    id: 'ID Kontrak',
    fields: [
      ['NIK', 'text'],
      ['Nama Lengkap', 'text'],
      ['Jenis Kontrak', 'select:PKWT|PKWTT|Magang'],
      ['Tanggal Mulai', 'date'],
      ['Tanggal Berakhir', 'date'],
      ['Status Kontrak', 'select:Draft|Menunggu Tanda Tangan|Aktif|Berakhir'],
      ['Catatan', 'textarea']
    ],
    columns: ['ID Kontrak', 'NIK', 'Nama Lengkap', 'Jenis Kontrak', 'Tanggal Mulai', 'Tanggal Berakhir', 'Status Kontrak']
  },
  onboarding: {
    title: 'Onboarding & APD',
    description: 'Pastikan karyawan baru menyelesaikan dokumen, APD, orientasi, dan penempatan.',
    sheet: 'Onboarding',
    id: 'ID Onboarding',
    fields: [
      ['NIK', 'text'],
      ['Nama Lengkap', 'text'],
      ['Status Dokumen', 'select:Belum Lengkap|Lengkap'],
      ['Status APD', 'select:Belum Dapat APD|Sudah Dapat APD'],
      ['Status Orientasi', 'select:Belum|Selesai'],
      ['Status Penempatan', 'select:Belum Ditempatkan|Sudah Ditempatkan'],
      ['PIC', 'text'],
      ['Tanggal Target', 'date']
    ],
    columns: ['ID Onboarding', 'NIK', 'Nama Lengkap', 'Status Dokumen', 'Status APD', 'Status Orientasi', 'Status Penempatan', 'PIC']
  },
  warnings: {
    title: 'Surat Peringatan',
    description: 'Catat fakta, tingkat SP, masa berlaku, dan tindak lanjut secara konsisten.',
    sheet: 'Surat Peringatan',
    id: 'ID SP',
    fields: [
      ['NIK', 'text'],
      ['Nama Lengkap', 'text'],
      ['Tingkat SP', 'select:SP 1|SP 2|SP 3'],
      ['Tanggal Surat', 'date'],
      ['Masa Berlaku Sampai', 'date'],
      ['Ringkasan Kejadian', 'textarea'],
      ['Status Tindak Lanjut', 'select:Terbuka|Dalam Pembinaan|Selesai'],
      ['Catatan', 'textarea']
    ],
    columns: ['ID SP', 'NIK', 'Nama Lengkap', 'Tingkat SP', 'Tanggal Surat', 'Masa Berlaku Sampai', 'Status Tindak Lanjut', 'Ringkasan Kejadian']
  },
  workforce: {
    title: 'Kebutuhan Karyawan',
    description: 'Bandingkan standar kebutuhan dengan tenaga aktual untuk menentukan gap rekrutmen.',
    sheet: 'Kebutuhan Karyawan',
    id: 'ID Kebutuhan',
    fields: [
      ['Departemen', 'text'],
      ['Jabatan', 'text'],
      ['Lokasi/Sektor', 'text'],
      ['Standar Kebutuhan', 'number'],
      ['Aktual Karyawan', 'number'],
      ['Periode', 'month'],
      ['PIC', 'text'],
      ['Catatan', 'textarea']
    ],
    columns: ['ID Kebutuhan', 'Departemen', 'Jabatan', 'Lokasi/Sektor', 'Standar Kebutuhan', 'Aktual Karyawan', 'Gap', 'Periode', 'PIC']
  }
};

function val(item, key) {
  if (!item || item[key] == null) return '';
  return String(item[key]);
}

function badge(value) {
  const text = escapeHtml(value || '-');
  const key = String(value || '').toLowerCase();
  let badgeClass = 'badge-baru';
  if (key.includes('tidak lolos') || key.includes('belum') || key.includes('berakhir') || key.includes('sp 3')) {
    badgeClass = 'badge-ditolak';
  } else if (key.includes('sudah') || key.includes('aktif') || key.includes('selesai') || key.includes('lengkap') || key.includes('tetap')) {
    badgeClass = 'badge-disetujui';
  } else if (key.includes('tanda tangan') || key.includes('menunggu') || key.includes('seleksi') || key.includes('pembinaan') || key.includes('sp 1') || key.includes('sp 2') || key.includes('kontrak')) {
    badgeClass = 'badge-diperiksa';
  }
  return `<span class="badge ${badgeClass}">${text}</span>`;
}

function countBy(items, predicate) {
  return items.filter(predicate).length;
}

async function loadHRSDM() {
  try {
    showLoading('Memuat data HRSDM...');
    const response = await apiCall('getHRSDMData', { token: getToken() }, 'GET');
    if (!response.success) throw new Error(response.message);
    hrsdmData = { ...hrsdmData, ...(response.data || {}) };
    renderKpis();
    setupModuleFilterDropdowns();
    filterModuleData();
  } catch (err) {
    console.error(err);
    showToast(
      err.message === 'Token invalid' ? 'Sesi berakhir, silakan login kembali' : 'Gagal memuat data HRSDM.',
      'error'
    );
  } finally {
    hideLoading();
  }
}

function renderKpis() {
  const c = hrsdmData.candidates || [];
  const e = hrsdmData.employees || [];
  const o = hrsdmData.onboarding || [];
  const w = hrsdmData.workforce || [];

  const gap = w.reduce((n, x) => n + Math.max(0, Number(x['Gap']) || (Number(x['Standar Kebutuhan']) - Number(x['Aktual Karyawan'])) || 0), 0);
  
  const cards = [
    ['Karyawan Aktif', countBy(e, x => val(x, 'Status Karyawan').toLowerCase() !== 'nonaktif'), 'fa-users', 'blue'],
    ['Kandidat Proses', countBy(c, x => !['Tidak Lolos', 'Sudah Ditempatkan'].includes(val(x, 'Tahap'))), 'fa-user-clock', 'indigo'],
    ['Belum TTD Kontrak', countBy(c, x => val(x, 'Tahap') === 'Menunggu Tanda Tangan Kontrak'), 'fa-file-signature', 'yellow'],
    ['Belum APD', countBy(o, x => val(x, 'Status APD') === 'Belum Dapat APD'), 'fa-hard-hat', 'red'],
    ['Belum Ditempatkan', countBy(o, x => val(x, 'Status Penempatan') === 'Belum Ditempatkan'), 'fa-map-marker-alt', 'amber'],
    ['Gap Kebutuhan', gap, 'fa-people-group', 'green']
  ];

  const container = document.getElementById('hrsdm-kpis');
  if (!container) return;

  container.innerHTML = cards.map(x => `
    <div class="stat-card-modern">
      <div>
        <div class="stat-label">${x[0]}</div>
        <div class="stat-value">${x[1]}</div>
      </div>
      <div class="stat-icon-wrapper icon-bg-${x[3]}">
        <i class="fas ${x[2]}"></i>
      </div>
    </div>
  `).join('');
}

function setupModuleFilterDropdowns() {
  const meta = modules[currentModule];
  const items = hrsdmData[currentModule] || [];

  const selStatus = document.getElementById('module-filter-status');
  const selDept = document.getElementById('module-filter-dept');
  const lblStatus = document.getElementById('label-filter-status');

  if (selStatus) {
    let statusField = '';
    if (currentModule === 'candidates') { statusField = 'Tahap'; if (lblStatus) lblStatus.innerText = 'Tahap Seleksi'; }
    else if (currentModule === 'employees') { statusField = 'Status Karyawan'; if (lblStatus) lblStatus.innerText = 'Status Karyawan'; }
    else if (currentModule === 'contracts') { statusField = 'Status Kontrak'; if (lblStatus) lblStatus.innerText = 'Status Kontrak'; }
    else if (currentModule === 'onboarding') { statusField = 'Status Penempatan'; if (lblStatus) lblStatus.innerText = 'Status Penempatan'; }
    else if (currentModule === 'warnings') { statusField = 'Tingkat SP'; if (lblStatus) lblStatus.innerText = 'Tingkat SP'; }
    else if (currentModule === 'workforce') { statusField = 'Periode'; if (lblStatus) lblStatus.innerText = 'Periode'; }

    const distinctStatuses = [...new Set(items.map(x => val(x, statusField)).filter(Boolean))].sort();
    selStatus.innerHTML = '<option value="">Semua ' + (lblStatus ? lblStatus.innerText : 'Status') + '</option>' +
      distinctStatuses.map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('');
  }

  if (selDept) {
    const hasDept = meta.columns.includes('Departemen');
    const deptContainer = document.getElementById('container-filter-dept');
    if (deptContainer) deptContainer.style.display = hasDept ? 'block' : 'none';

    if (hasDept) {
      const distinctDepts = [...new Set(items.map(x => val(x, 'Departemen')).filter(Boolean))].sort();
      selDept.innerHTML = '<option value="">Semua Departemen</option>' +
        distinctDepts.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join('');
    }
  }
}

function filterModuleData() {
  const meta = modules[currentModule];
  const items = hrsdmData[currentModule] || [];
  const searchVal = (document.getElementById('module-search')?.value || '').trim().toLowerCase();
  const statusVal = (document.getElementById('module-filter-status')?.value || '').trim();
  const deptVal = (document.getElementById('module-filter-dept')?.value || '').trim();

  let statusField = '';
  if (currentModule === 'candidates') statusField = 'Tahap';
  else if (currentModule === 'employees') statusField = 'Status Karyawan';
  else if (currentModule === 'contracts') statusField = 'Status Kontrak';
  else if (currentModule === 'onboarding') statusField = 'Status Penempatan';
  else if (currentModule === 'warnings') statusField = 'Tingkat SP';
  else if (currentModule === 'workforce') statusField = 'Periode';

  moduleFilteredData = items.filter(x => {
    let match = true;
    if (searchVal) {
      const rowText = Object.values(x).join(' ').toLowerCase();
      if (!rowText.includes(searchVal)) match = false;
    }
    if (statusVal && statusField) {
      if (val(x, statusField) !== statusVal) match = false;
    }
    if (deptVal && meta.columns.includes('Departemen')) {
      if (val(x, 'Departemen') !== deptVal) match = false;
    }
    return match;
  });

  moduleCurrentPage = 1;
  renderModule();
}

function resetModuleFilters() {
  const search = document.getElementById('module-search');
  const selStatus = document.getElementById('module-filter-status');
  const selDept = document.getElementById('module-filter-dept');
  if (search) search.value = '';
  if (selStatus) selStatus.value = '';
  if (selDept) selDept.value = '';
  filterModuleData();
}

function renderModule() {
  const meta = modules[currentModule];
  const items = hrsdmData[currentModule] || [];

  // Update header info
  document.getElementById('module-title').textContent = meta.title;
  document.getElementById('module-description').textContent = meta.description;
  const addBtnLabel = document.getElementById('btn-add-label');
  if (addBtnLabel) addBtnLabel.textContent = `Tambah ${meta.title}`;

  // Quick summary badges
  const summary = document.getElementById('module-summary');
  if (currentModule === 'candidates') {
    summary.style.display = 'flex';
    summary.innerHTML = ['Seleksi', 'Tidak Lolos', 'Menunggu Tanda Tangan Kontrak', 'Belum Dapat APD', 'Belum Ditempatkan', 'Sudah Ditempatkan'].map(s => {
      const cnt = countBy(items, x => val(x, 'Tahap') === s);
      return `<button type="button" class="btn btn-sm btn-secondary" onclick="filterByStage('${s}')" style="font-size:0.8rem; padding: 0.35rem 0.65rem;"><strong>${cnt}</strong> ${s}</button>`;
    }).join(' ');
  } else if (currentModule === 'workforce') {
    summary.style.display = 'block';
    summary.innerHTML = `<div class="workforce-note"><i class="fas fa-circle-info text-primary"></i> <strong>Formula:</strong> Gap = Standar Kebutuhan − Aktual Karyawan. Nilai positif menunjukkan kekurangan kuota tenaga kerja.</div>`;
  } else {
    summary.style.display = 'none';
    summary.innerHTML = '';
  }

  // Table head
  const headCols = [...meta.columns, 'Aksi'];
  document.getElementById('module-head').innerHTML = `<tr>${headCols.map((c, i) => `<th style="${i === headCols.length - 1 ? 'text-align: center;' : ''}">${escapeHtml(c)}</th>`).join('')}</tr>`;

  // Paginated data
  const tbody = document.getElementById('module-body');
  if (!moduleFilteredData || moduleFilteredData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${headCols.length}" class="text-center text-muted" style="padding: 3rem 1rem;">Tidak ada data ${meta.title.toLowerCase()} yang ditemukan.</td></tr>`;
    renderModulePagination(0);
    return;
  }

  const startIndex = (moduleCurrentPage - 1) * moduleItemsPerPage;
  const pageItems = moduleFilteredData.slice(startIndex, startIndex + moduleItemsPerPage);

  tbody.innerHTML = pageItems.map(row => {
    const idVal = val(row, meta.id);
    const colsHtml = meta.columns.map(col => {
      const cellVal = val(row, col);
      if (/Status|Tahap|Tingkat SP/.test(col)) {
        return `<td>${badge(cellVal)}</td>`;
      }
      if (/Tanggal|Masa Berlaku/.test(col)) {
        return `<td>${formatDate(cellVal)}</td>`;
      }
      if (col === meta.id) {
        return `<td><strong style="color: var(--primary-600);">${escapeHtml(cellVal || '-')}</strong></td>`;
      }
      if (col === 'Nama Lengkap') {
        return `<td><strong style="color: var(--gray-900);">${escapeHtml(cellVal || '-')}</strong></td>`;
      }
      return `<td>${escapeHtml(cellVal || '-')}</td>`;
    }).join('');

    const actionHtml = `
      <td style="text-align: center;">
        <div style="display: flex; gap: 0.35rem; justify-content: center;">
          <button class="btn btn-sm btn-info" onclick="showHRDetail('${escapeHtml(idVal)}')" title="Detail"><i class="fas fa-eye"></i></button>
          <button class="btn btn-sm btn-warning" onclick="openEditModal('${escapeHtml(idVal)}')" title="Update"><i class="fas fa-edit"></i></button>
          <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${escapeHtml(idVal)}')" title="Hapus"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    `;

    return `<tr>${colsHtml}${actionHtml}</tr>`;
  }).join('');

  renderModulePagination(moduleFilteredData.length);
}

function filterByStage(stage) {
  const sel = document.getElementById('module-filter-status');
  if (sel) {
    sel.value = stage;
    filterModuleData();
  }
}

function renderModulePagination(totalItems) {
  const container = document.getElementById('module-pagination');
  const info = document.getElementById('module-pagination-info');
  if (!container) return;
  container.innerHTML = '';

  const totalPages = Math.ceil(totalItems / moduleItemsPerPage);
  if (info) {
    info.innerText = `Menampilkan ${totalItems > 0 ? (moduleCurrentPage - 1) * moduleItemsPerPage + 1 : 0} - ${Math.min(moduleCurrentPage * moduleItemsPerPage, totalItems)} dari total ${totalItems} data`;
  }

  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.innerText = i;
    btn.className = `pagination-btn ${i === moduleCurrentPage ? 'active' : ''}`;
    btn.onclick = () => {
      moduleCurrentPage = i;
      renderModule();
    };
    container.appendChild(btn);
  }
}

// ==================== CREATE RECORD ====================
function openCreateModal(module) {
  const meta = modules[module];
  document.getElementById('modal-title').innerHTML = `<i class="fas fa-plus-circle text-primary"></i> Tambah ${meta.title}`;
  
  document.getElementById('modal-fields').innerHTML = meta.fields.map(([label, type]) => {
    const name = label.replace(/\s+/g, '_');
    const isRequired = ['NIK', 'Nama Lengkap', 'Departemen', 'Jabatan', 'Tingkat SP', 'Tahap', 'Status Karyawan', 'Jenis Kontrak'].includes(label);

    if (type.startsWith('select:')) {
      const options = type.slice(7).split('|').map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('');
      return `
        <div class="form-group">
          <label class="form-label">${label} ${isRequired ? '<span class="required">*</span>' : ''}</label>
          <select name="${name}" class="form-select" ${isRequired ? 'required' : ''}>
            <option value="">Pilih ${label}...</option>
            ${options}
          </select>
        </div>
      `;
    }

    if (type === 'textarea') {
      return `
        <div class="form-group full">
          <label class="form-label">${label}</label>
          <textarea name="${name}" class="form-control" rows="3" placeholder="Masukkan ${label.toLowerCase()}..."></textarea>
        </div>
      `;
    }

    return `
      <div class="form-group">
        <label class="form-label">${label} ${isRequired ? '<span class="required">*</span>' : ''}</label>
        <input name="${name}" type="${type}" class="form-control" placeholder="Masukkan ${label.toLowerCase()}..." ${isRequired ? 'required' : ''}>
      </div>
    `;
  }).join('');

  document.getElementById('hrsdm-modal').style.display = 'flex';
  document.getElementById('hrsdm-form').onsubmit = event => saveRecord(event, module);
}

function closeHRModal() {
  document.getElementById('hrsdm-modal').style.display = 'none';
}

async function saveRecord(event, module) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.target).entries());
  
  try {
    showLoading('Menyimpan data ke database HRSDM...');
    const response = await apiCall('saveHRSDMRecord', { token: getToken(), module, values }, 'POST');
    if (!response.success) throw new Error(response.message);
    closeHRModal();
    showToast('Data berhasil disimpan ke spreadsheet', 'success');
    await loadHRSDM();
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan data', 'error');
  } finally {
    hideLoading();
  }
}

// ==================== EDIT RECORD ====================
function openEditModal(id) {
  const meta = modules[currentModule];
  const items = hrsdmData[currentModule] || [];
  const record = items.find(r => val(r, meta.id) === id);

  if (!record) {
    showToast('Data tidak ditemukan', 'error');
    return;
  }

  document.getElementById('edit-record-id').value = id;
  document.getElementById('edit-modal-title').innerHTML = `<i class="fas fa-edit text-primary"></i> Update ${meta.title} (${id})`;

  document.getElementById('edit-modal-fields').innerHTML = meta.fields.map(([label, type]) => {
    const name = label.replace(/\s+/g, '_');
    const curVal = record[label] !== undefined ? record[label] : (record[name] || '');
    const isRequired = ['NIK', 'Nama Lengkap', 'Departemen', 'Jabatan'].includes(label);

    if (type.startsWith('select:')) {
      const options = type.slice(7).split('|').map(v => `<option value="${escapeHtml(v)}" ${String(curVal).trim() === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('');
      return `
        <div class="form-group">
          <label class="form-label">${label} ${isRequired ? '<span class="required">*</span>' : ''}</label>
          <select name="${name}" class="form-select" ${isRequired ? 'required' : ''}>
            <option value="">Pilih ${label}...</option>
            ${options}
          </select>
        </div>
      `;
    }

    if (type === 'textarea') {
      return `
        <div class="form-group full">
          <label class="form-label">${label}</label>
          <textarea name="${name}" class="form-control" rows="3">${escapeHtml(curVal)}</textarea>
        </div>
      `;
    }

    const formattedVal = (type === 'date' && curVal) ? getDateOnly(curVal) : escapeHtml(curVal);
    const isReadOnly = (label === meta.id && currentModule !== 'employees') ? 'readonly' : '';

    return `
      <div class="form-group">
        <label class="form-label">${label} ${isRequired ? '<span class="required">*</span>' : ''}</label>
        <input name="${name}" type="${type}" value="${formattedVal}" class="form-control" ${isRequired ? 'required' : ''} ${isReadOnly}>
      </div>
    `;
  }).join('');

  document.getElementById('hrsdm-edit-modal').style.display = 'flex';
  document.getElementById('hrsdm-edit-form').onsubmit = event => updateRecord(event, currentModule);
}

function closeHREditModal() {
  document.getElementById('hrsdm-edit-modal').style.display = 'none';
}

async function updateRecord(event, module) {
  event.preventDefault();
  const id = document.getElementById('edit-record-id').value;
  const values = Object.fromEntries(new FormData(event.target).entries());

  try {
    showLoading('Memperbarui data HRSDM...');
    const response = await apiCall('updateHRSDMRecord', {
      token: getToken(),
      module,
      id,
      values
    }, 'POST');

    if (!response.success) throw new Error(response.message);
    closeHREditModal();
    showToast('Data HRSDM berhasil diperbarui', 'success');
    await loadHRSDM();
  } catch (err) {
    showToast(err.message || 'Gagal memperbarui data', 'error');
  } finally {
    hideLoading();
  }
}

// ==================== DETAIL RECORD ====================
function showHRDetail(id) {
  const meta = modules[currentModule];
  const items = hrsdmData[currentModule] || [];
  const record = items.find(r => val(r, meta.id) === id);

  if (!record) {
    showToast('Data tidak ditemukan', 'warning');
    return;
  }

  document.getElementById('detail-modal-title').innerHTML = `<i class="fas fa-file-alt text-primary"></i> Detail ${meta.title} (${escapeHtml(id)})`;

  let html = '<table class="modern-table" style="font-size: 0.9rem;">';
  for (const key in record) {
    let cellVal = record[key];
    if (cellVal === undefined || cellVal === null || cellVal === '') cellVal = '-';
    else if (key.includes('Tanggal') || key.includes('Masa Berlaku') || key.includes('Dibuat')) cellVal = formatDate(cellVal);
    else if (/Status|Tahap|Tingkat SP/.test(key)) cellVal = badge(cellVal);
    else cellVal = escapeHtml(String(cellVal)).replace(/\n/g, '<br>');

    html += `<tr><th style="width: 35%; background: var(--gray-50); font-weight: 700;">${escapeHtml(key)}</th><td>${cellVal}</td></tr>`;
  }
  html += '</table>';

  document.getElementById('detail-modal-content').innerHTML = html;
  document.getElementById('hrsdm-detail-modal').style.display = 'flex';
}

function closeHRDetailModal() {
  document.getElementById('hrsdm-detail-modal').style.display = 'none';
}

// ==================== DELETE RECORD ====================
function openDeleteModal(id) {
  const meta = modules[currentModule];
  document.getElementById('delete-record-id').value = id;
  document.getElementById('delete-prompt-text').innerHTML = `Apakah Anda yakin ingin menghapus data <strong>${escapeHtml(id)}</strong> dari ${escapeHtml(meta.title)}?`;
  document.getElementById('hrsdm-delete-modal').style.display = 'flex';
}

function closeHRDeleteModal() {
  document.getElementById('hrsdm-delete-modal').style.display = 'none';
}

async function confirmDeleteHRRecord() {
  const id = document.getElementById('delete-record-id').value;
  if (!id) return;

  try {
    showLoading('Menghapus data...');
    const response = await apiCall('deleteHRSDMRecord', {
      token: getToken(),
      module: currentModule,
      id
    }, 'POST');

    if (!response.success) throw new Error(response.message);
    closeHRDeleteModal();
    showToast('Data berhasil dihapus dari database', 'success');
    await loadHRSDM();
  } catch (err) {
    showToast(err.message || 'Gagal menghapus data', 'error');
  } finally {
    hideLoading();
  }
}

// ==================== CSV EXPORT ====================
function exportHRSDMToCSV() {
  const meta = modules[currentModule];
  const items = moduleFilteredData.length > 0 ? moduleFilteredData : (hrsdmData[currentModule] || []);

  if (!items || items.length === 0) {
    showToast('Tidak ada data untuk diekspor', 'warning');
    return;
  }

  const headers = meta.columns;
  const csvRows = [headers.map(h => `"${h}"`).join(',')];

  items.forEach(row => {
    const values = headers.map(header => {
      const v = row[header] === undefined || row[header] === null ? '' : String(row[header]).replace(/"/g, '""');
      return `"${v}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvContent = "\uFEFF" + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const filename = `DATA_HRSDM_${meta.title.replace(/\s+/g, '_').toUpperCase()}_${getCurrentDate()}.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Berhasil mengekspor ${items.length} data ke CSV (${filename})`, 'success');
}

function refreshHRSDM() {
  showToast('Memperbarui data HRSDM...', 'info');
  loadHRSDM();
}

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;

  document.querySelectorAll('#module-nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentModule = btn.dataset.module;
      document.querySelectorAll('#module-nav button').forEach(x => x.classList.toggle('active', x === btn));
      resetModuleFilters();
      setupModuleFilterDropdowns();
      filterModuleData();
    });
  });

  loadHRSDM();
});
