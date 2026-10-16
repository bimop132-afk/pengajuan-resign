const SPREADSHEET_ID = '18QO0fsV1r6Z2Zgz9-kCS-57eSo5F5W9dTHnx4rDVxPs';
const SECRET_KEY = 'resign-app-secret-2026';
const HRD_CREDENTIALS = { username: 'admin', password: 'admin123' };

const CANONICAL_HEADERS = [
  'ID Pengajuan', 'Nomor Surat', 'NIK', 'Nama Lengkap', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin',
  'Alamat', 'No WhatsApp', 'Email', 'Jabatan', 'Departemen', 'Sektor', 'Regu', 'Tanggal Mulai Bekerja',
  'Atasan PIC', 'Tanggal Pengajuan', 'Tanggal Efektif Resign', 'Alasan Resign', 'Keterangan', 'Status Pengajuan',
  'Dokumen Pendukung', 'Waktu Pengajuan', 'Waktu Diproses', 'Uang Jaminan Nominal', 'Uang Jaminan Status'
];

function getSpreadsheet() {
  if (SPREADSHEET_ID && SPREADSHEET_ID !== 'YOUR_SPREADSHEET_ID_HERE') {
    try {
      return SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      // Fallback to active spreadsheet if bound
    }
  }
  try {
    const active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
  } catch (e) {}
  throw new Error('Spreadsheet ID belum dikonfigurasi. Silakan isi SPREADSHEET_ID di Code.gs.');
}

function getSheetByNameFlexible(ss, names) {
  for (let i = 0; i < names.length; i++) {
    const sheet = ss.getSheetByName(names[i]);
    if (sheet) return sheet;
  }
  return null;
}

function getDataSheet(ss) {
  let sheet = getSheetByNameFlexible(ss, ['Data Pengajuan', 'DATA RESIGN', 'Data Resign', 'Sheet1']);
  if (!sheet) {
    const sheets = ss.getSheets();
    if (sheets.length > 0) sheet = sheets[0];
  }
  if (!sheet) {
    sheet = ss.insertSheet('Data Pengajuan');
    sheet.appendRow(CANONICAL_HEADERS);
  }
  return sheet;
}

function getLogSheet(ss) {
  let sheet = getSheetByNameFlexible(ss, ['Log Activity', 'LOG AKTIVITAS', 'Log Aktivitas']);
  if (!sheet) {
    sheet = ss.insertSheet('Log Activity');
    sheet.appendRow(['Timestamp', 'User', 'Activity', 'ID Pengajuan', 'Keterangan']);
  }
  return sheet;
}

function getUangJaminanSheet(ss) {
  return getSheetByNameFlexible(ss, ['Uang Jaminan', 'UANG JAMINAN', 'Data Uang Jaminan', 'Uang_Jaminan']);
}

function setupSpreadsheet() {
  const ss = getSpreadsheet();
  
  // 1. Data Sheet
  let dataSheet = getDataSheet(ss);
  if (dataSheet.getLastRow() === 0) {
    dataSheet.appendRow(CANONICAL_HEADERS);
    dataSheet.getRange(1, 1, 1, CANONICAL_HEADERS.length).setFontWeight('bold').setBackground('#f1f5f9');
  }

  // 2. Log Sheet
  let logSheet = getLogSheet(ss);
  if (logSheet.getLastRow() === 0) {
    const logHeaders = ['Timestamp', 'User', 'Activity', 'ID Pengajuan', 'Keterangan'];
    logSheet.appendRow(logHeaders);
    logSheet.getRange(1, 1, 1, logHeaders.length).setFontWeight('bold').setBackground('#f1f5f9');
  }

  // 3. Uang Jaminan Sheet
  let ujSheet = getUangJaminanSheet(ss);
  if (!ujSheet) {
    ujSheet = ss.insertSheet('Uang Jaminan');
    const ujHeaders = ['NIK', 'Nama Lengkap', 'Nominal', 'Status'];
    ujSheet.appendRow(ujHeaders);
    ujSheet.getRange(1, 1, 1, ujHeaders.length).setFontWeight('bold').setBackground('#f1f5f9');
    ujSheet.appendRow(['250710024', 'Nanda Yulianti', 500000, 'Lunas']);
  }
}

function getRomanMonth(month) {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[month - 1] || 'I';
}

function generateIdPengajuan(sheet) {
  const timeZone = Session.getScriptTimeZone() || 'Asia/Jakarta';
  const dateStr = Utilities.formatDate(new Date(), timeZone, "yyyyMMdd");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return `RES-${dateStr}-0001`;
  }

  let maxNum = 0;
  const prefix = `RES-${dateStr}-`;
  for (let i = 1; i < data.length; i++) {
    const val = (data[i][0] || '').toString().trim();
    if (val.startsWith(prefix)) {
      const numPart = parseInt(val.substring(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  }
  const nextNum = maxNum + 1;
  return `RES-${dateStr}-${nextNum.toString().padStart(4, '0')}`;
}

function generateNomorSurat(sheet, dateStr) {
  const date = (dateStr && !isNaN(new Date(dateStr).getTime())) ? new Date(dateStr) : new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const romanMonth = getRomanMonth(month);

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return `001/RES/HRD/TTK/${romanMonth}/${year}`;
  }

  let colIndex = 1; // Default to Column B
  for (let j = 0; j < data[0].length; j++) {
    if ((data[0][j] || '').toString().trim().toLowerCase() === 'nomor surat') {
      colIndex = j;
      break;
    }
  }

  let count = 1;
  for (let i = 1; i < data.length; i++) {
    const val = data[i][colIndex];
    if (val && val.toString().includes(`/${romanMonth}/${year}`)) {
      count++;
    }
  }
  return `${count.toString().padStart(3, '0')}/RES/HRD/TTK/${romanMonth}/${year}`;
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function verifyToken(token) {
  if (!token) return false;
  try {
    const decodedStr = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    const parts = decodedStr.split('|');
    if (parts.length === 3 && parts[0] === HRD_CREDENTIALS.username && parts[2] === SECRET_KEY) {
      const timestamp = parseInt(parts[1], 10);
      const now = new Date().getTime();
      // Server-side validity 12 hours
      if ((now - timestamp) <= 12 * 60 * 60 * 1000) {
        return true;
      }
    }
  } catch (e) {
    return false;
  }
  return false;
}

function logActivity(user, activity, idPengajuan, keterangan) {
  try {
    const ss = getSpreadsheet();
    const sheet = getLogSheet(ss);
    sheet.appendRow([new Date(), user, activity, idPengajuan, keterangan]);
  } catch(e) {}
}

function getRowsDataAsObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const headers = data[0];
  const results = [];
  const timeZone = Session.getScriptTimeZone() || 'Asia/Jakarta';

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const hasData = row.some(cell => cell !== '' && cell !== null && cell !== undefined);
    if (!hasData) continue;

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];
      if (header) {
        let val = row[j];
        if (val instanceof Date) {
          if (val.getHours() === 0 && val.getMinutes() === 0 && val.getSeconds() === 0) {
            val = Utilities.formatDate(val, timeZone, 'yyyy-MM-dd');
          } else {
            val = Utilities.formatDate(val, timeZone, "yyyy-MM-dd'T'HH:mm:ss");
          }
        }
        obj[header.toString().trim()] = val !== undefined ? val : '';
      }
    }
    if (obj['ID Pengajuan'] || obj['NIK'] || obj['Nama Lengkap']) {
      results.push(obj);
    }
  }
  return results;
}

function doGet(e) {
  try {
    if (!e || !e.parameter || !e.parameter.action) {
      return createJsonResponse({ 
        success: true, 
        message: 'API Pengajuan Resign PT Mitra Sigma Tekindo Aktif' 
      });
    }

    const action = e.parameter.action;
    const ss = getSpreadsheet();
    const sheet = getDataSheet(ss);
    
    if (action === 'checkStatus') {
      const nik = (e.parameter.nik || '').toString().trim().toLowerCase();
      const idPengajuan = (e.parameter.idPengajuan || '').toString().trim().toLowerCase();
      const rows = getRowsDataAsObjects(sheet);

      const match = rows.find(r => {
        const rNik = (r['NIK'] || '').toString().trim().toLowerCase();
        const rId = (r['ID Pengajuan'] || '').toString().trim().toLowerCase();
        if (idPengajuan && nik) {
          return rId === idPengajuan && rNik === nik;
        } else if (idPengajuan) {
          return rId === idPengajuan;
        } else if (nik) {
          return rNik === nik;
        }
        return false;
      });

      if (match) {
        return createJsonResponse({ success: true, data: match });
      } else {
        return createJsonResponse({ success: false, message: 'Data tidak ditemukan' });
      }
    }
    
    if (action === 'getDashboardData') {
      if (!verifyToken(e.parameter.token)) return createJsonResponse({ success: false, message: 'Token invalid' });
      const rows = getRowsDataAsObjects(sheet);
      return createJsonResponse({ success: true, data: rows });
    }

    if (action === 'getUangJaminan') {
      const nik = (e.parameter.nik || '').toString().trim();
      if (!nik) return createJsonResponse({ success: false, message: 'NIK diperlukan' });
      const uangJaminanSheet = getUangJaminanSheet(ss);
      if (!uangJaminanSheet) return createJsonResponse({ success: false, message: 'Sheet Uang Jaminan tidak ditemukan' });
      const rows = getRowsDataAsObjects(uangJaminanSheet);
      const match = rows.find(r => (r['NIK'] || '').toString().trim() === nik);
      if (match) {
        return createJsonResponse({ success: true, data: match });
      }
      return createJsonResponse({ success: false, message: 'Data uang jaminan tidak ditemukan' });
    }

    if (action === 'getStats') {
      if (!verifyToken(e.parameter.token)) return createJsonResponse({ success: false, message: 'Token invalid' });
      const rows = getRowsDataAsObjects(sheet);
      let stats = { total: rows.length, baru: 0, diproses: 0, disetujui: 0, ditolak: 0, selesai: 0 };
      rows.forEach(r => {
        const status = (r['Status Pengajuan'] || '').toString().trim().toUpperCase();
        if (status === 'PENGAJUAN BARU') stats.baru++;
        else if (status === 'DIPERIKSA HRD') stats.diproses++;
        else if (status === 'DISETUJUI') stats.disetujui++;
        else if (status === 'DITOLAK') stats.ditolak++;
        else if (status === 'SELESAI') stats.selesai++;
      });
      return createJsonResponse({ success: true, data: stats });
    }

    return createJsonResponse({ success: false, message: `Unknown action: ${action}` });
  } catch (error) {
    return createJsonResponse({ success: false, message: error.toString() });
  }
}

function doPost(e) {
  try {
    let data = {};
    if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = {};
      }
    }
    const action = data.action || (e.parameter && e.parameter.action);

    if (action === 'login') {
      const user = (data.username || '').toString().trim().toLowerCase();
      const pwd = (data.password || '').toString().trim();
      if (user === HRD_CREDENTIALS.username.toLowerCase() && pwd === HRD_CREDENTIALS.password) {
        const timestamp = new Date().getTime();
        const rawToken = `${HRD_CREDENTIALS.username}|${timestamp}|${SECRET_KEY}`;
        const token = Utilities.base64Encode(rawToken);
        logActivity(HRD_CREDENTIALS.username, 'Login', '', 'Berhasil login ke Dashboard');
        return createJsonResponse({ success: true, token: token });
      } else {
        return createJsonResponse({ success: false, message: 'Username atau password salah' });
      }
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    const ss = getSpreadsheet();
    let sheet = getDataSheet(ss);

    if (action === 'submitResign') {
      const idPengajuan = generateIdPengajuan(sheet);
      const nomorSurat = generateNomorSurat(sheet, data.tanggalPengajuan);
      
      const fieldMap = {
        'id pengajuan': idPengajuan,
        'nomor surat': nomorSurat,
        'nik': data.nik || '',
        'nama lengkap': data.namaLengkap || '',
        'tempat lahir': data.tempatLahir || '',
        'tanggal lahir': data.tanggalLahir || '',
        'jenis kelamin': data.jenisKelamin || '',
        'alamat': data.alamat || '',
        'no whatsapp': data.noWhatsApp || '',
        'nomor whatsapp': data.noWhatsApp || '',
        'email': data.email || '',
        'jabatan': data.jabatan || '',
        'departemen': data.departemen || '',
        'sektor': data.sektor || '',
        'regu': data.regu || '',
        'tanggal mulai bekerja': data.tanggalMulaiBekerja || '',
        'atasan pic': data.atasanPIC || '',
        'atasan/pic': data.atasanPIC || '',
        'tanggal pengajuan': data.tanggalPengajuan || '',
        'tanggal efektif resign': data.tanggalEfektifResign || '',
        'alasan resign': data.alasanResign || '',
        'keterangan': data.keterangan || '',
        'status pengajuan': 'PENGAJUAN BARU',
        'dokumen pendukung': data.dokumenPendukung || '',
        'link surat': '',
        'timestamp': new Date(),
        'waktu pengajuan': new Date(),
        'waktu diproses': '',
        'uang jaminan nominal': data.uangJaminanNominal || '',
        'uang jaminan status': data.uangJaminanStatus || ''
      };

      const tableData = sheet.getDataRange().getValues();
      let rowData = [];

      if (tableData.length > 0 && tableData[0].length > 0) {
        const headers = tableData[0];
        for (let c = 0; c < headers.length; c++) {
          const hKey = (headers[c] || '').toString().trim().toLowerCase();
          rowData.push(fieldMap[hKey] !== undefined ? fieldMap[hKey] : '');
        }
      } else {
        sheet.appendRow(CANONICAL_HEADERS);
        rowData = [
          idPengajuan, nomorSurat, data.nik || '', data.namaLengkap || '', data.tempatLahir || '',
          data.tanggalLahir || '', data.jenisKelamin || '', data.alamat || '', data.noWhatsApp || '',
          data.email || '', data.jabatan || '', data.departemen || '', data.sektor || '', data.regu || '',
          data.tanggalMulaiBekerja || '', data.atasanPIC || '', data.tanggalPengajuan || '',
          data.tanggalEfektifResign || '', data.alasanResign || '', data.keterangan || '',
          'PENGAJUAN BARU', '', new Date(), '', data.uangJaminanNominal || '', data.uangJaminanStatus || ''
        ];
      }

      sheet.appendRow(rowData);
      logActivity('Karyawan', 'Submit Pengajuan', idPengajuan, `NIK: ${data.nik}, Nama: ${data.namaLengkap}`);
      lock.releaseLock();
      
      return createJsonResponse({ success: true, data: { idPengajuan, nomorSurat } });
    }

    if (action === 'updateStatus') {
      if (!verifyToken(data.token)) {
        lock.releaseLock();
        return createJsonResponse({ success: false, message: 'Token invalid' });
      }
      
      const tableData = sheet.getDataRange().getValues();
      let rowIndex = -1;
      for (let i = 1; i < tableData.length; i++) {
        if ((tableData[i][0] || '').toString().trim() === (data.idPengajuan || '').toString().trim()) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex !== -1) {
        const headers = tableData[0];
        let colStatus = -1;
        let colKet = -1;
        let colWaktuProses = -1;

        for (let j = 0; j < headers.length; j++) {
          const h = (headers[j] || '').toString().trim().toLowerCase();
          if (h === 'status pengajuan' || h === 'status') colStatus = j + 1;
          else if (h === 'keterangan') colKet = j + 1;
          else if (h === 'waktu diproses' || h === 'waktu proses') colWaktuProses = j + 1;
        }

        // Fallbacks if not found by name
        if (colStatus === -1) colStatus = 21;
        if (colKet === -1) colKet = 20;
        if (colWaktuProses === -1) colWaktuProses = 24;

        sheet.getRange(rowIndex, colStatus).setValue(data.status);
        if (data.catatan) {
          const existingKet = sheet.getRange(rowIndex, colKet).getValue();
          const newKet = existingKet ? `${existingKet}\nHRD: ${data.catatan}` : `HRD: ${data.catatan}`;
          sheet.getRange(rowIndex, colKet).setValue(newKet);
        }
        sheet.getRange(rowIndex, colWaktuProses).setValue(new Date());
        
        logActivity(HRD_CREDENTIALS.username, 'Update Status', data.idPengajuan, `Status: ${data.status}`);
        lock.releaseLock();
        return createJsonResponse({ success: true });
      } else {
        lock.releaseLock();
        return createJsonResponse({ success: false, message: 'Data tidak ditemukan' });
      }
    }

    lock.releaseLock();
    return createJsonResponse({ success: false, message: 'Unknown POST action' });
  } catch (error) {
    return createJsonResponse({ success: false, message: error.toString() });
  }
}
