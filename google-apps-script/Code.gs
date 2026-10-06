const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const SECRET_KEY = 'resign-app-secret-2026';
const HRD_CREDENTIALS = { username: 'admin', password: 'admin123' };

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function setupSpreadsheet() {
  // Utility for initial setup if needed
}

function getRomanMonth(month) {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return romans[month - 1];
}

function generateIdPengajuan(sheet) {
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd");
  const data = sheet.getDataRange().getValues();
  let count = 1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().includes(`RES-${dateStr}`)) {
      count++;
    }
  }
  return `RES-${dateStr}-${count.toString().padStart(4, '0')}`;
}

function generateNomorSurat(sheet, dateStr) {
  const date = new Date(dateStr || new Date());
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const romanMonth = getRomanMonth(month);
  
  const data = sheet.getDataRange().getValues();
  let count = 1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().includes(`/${romanMonth}/${year}`)) {
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
      if ((now - timestamp) <= 30 * 60 * 1000) {
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
    let sheet = ss.getSheetByName('Log Activity');
    if (!sheet) {
      sheet = ss.insertSheet('Log Activity');
      sheet.appendRow(['Timestamp', 'User', 'Activity', 'ID Pengajuan', 'Keterangan']);
    }
    sheet.appendRow([new Date(), user, activity, idPengajuan, keterangan]);
  } catch(e) {}
}

function getRowsDataAsObjects(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];
  for (let i = 1; i < data.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    results.push(obj);
  }
  return results;
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName('Data Pengajuan');
    
    if (action === 'checkStatus') {
      const nik = e.parameter.nik;
      const idPengajuan = e.parameter.idPengajuan;
      const rows = getRowsDataAsObjects(sheet);
      const match = rows.find(r => r['NIK'] == nik && r['ID Pengajuan'] == idPengajuan);
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

    if (action === 'getStats') {
      if (!verifyToken(e.parameter.token)) return createJsonResponse({ success: false, message: 'Token invalid' });
      const rows = getRowsDataAsObjects(sheet);
      let stats = { total: rows.length, baru: 0, diproses: 0, disetujui: 0, ditolak: 0, selesai: 0 };
      rows.forEach(r => {
        if (r['Status Pengajuan'] === 'PENGAJUAN BARU') stats.baru++;
        else if (r['Status Pengajuan'] === 'DIPERIKSA HRD') stats.diproses++;
        else if (r['Status Pengajuan'] === 'DISETUJUI') stats.disetujui++;
        else if (r['Status Pengajuan'] === 'DITOLAK') stats.ditolak++;
        else if (r['Status Pengajuan'] === 'SELESAI') stats.selesai++;
      });
      return createJsonResponse({ success: true, data: stats });
    }

    return createJsonResponse({ success: false, message: 'Unknown action' });
  } catch (error) {
    return createJsonResponse({ success: false, message: error.toString() });
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || e.parameter.action;
    
    if (action === 'login') {
      if (data.username === HRD_CREDENTIALS.username && data.password === HRD_CREDENTIALS.password) {
        const timestamp = new Date().getTime();
        const rawToken = `${data.username}|${timestamp}|${SECRET_KEY}`;
        const token = Utilities.base64Encode(rawToken);
        logActivity(data.username, 'Login', '', '');
        return createJsonResponse({ success: true, token: token });
      } else {
        return createJsonResponse({ success: false, message: 'Username atau password salah' });
      }
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    const ss = getSpreadsheet();
    let sheet = ss.getSheetByName('Data Pengajuan');
    
    if (!sheet) {
        sheet = ss.insertSheet('Data Pengajuan');
        sheet.appendRow([
            'ID Pengajuan', 'Nomor Surat', 'NIK', 'Nama Lengkap', 'Tempat Lahir', 'Tanggal Lahir', 'Jenis Kelamin',
            'Alamat', 'No WhatsApp', 'Email', 'Jabatan', 'Departemen', 'Sektor', 'Regu', 'Tanggal Mulai Bekerja',
            'Atasan PIC', 'Tanggal Pengajuan', 'Tanggal Efektif Resign', 'Alasan Resign', 'Keterangan', 'Status Pengajuan',
            'Dokumen Pendukung', 'Waktu Pengajuan', 'Waktu Diproses'
        ]);
    }

    if (action === 'submitResign') {
      const idPengajuan = generateIdPengajuan(sheet);
      const nomorSurat = generateNomorSurat(sheet, data.tanggalPengajuan);
      
      const rowData = [
        idPengajuan, nomorSurat, data.nik, data.namaLengkap, data.tempatLahir, data.tanggalLahir, data.jenisKelamin,
        data.alamat, data.noWhatsApp, data.email, data.jabatan, data.departemen, data.sektor, data.regu,
        data.tanggalMulaiBekerja, data.atasanPIC, data.tanggalPengajuan, data.tanggalEfektifResign, data.alasanResign,
        data.keterangan, 'PENGAJUAN BARU', '', new Date(), ''
      ];
      
      sheet.appendRow(rowData);
      logActivity('System', 'Submit Pengajuan', idPengajuan, '');
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
        if (tableData[i][0] === data.idPengajuan) {
          rowIndex = i + 1; // +1 because array is 0-indexed but rows are 1-indexed
          break;
        }
      }
      
      if (rowIndex !== -1) {
        // Col U=21 for Status Pengajuan, T=20 for Keterangan, X=24 for Waktu Diproses
        sheet.getRange(rowIndex, 21).setValue(data.status);
        if (data.catatan) {
           const existingKet = sheet.getRange(rowIndex, 20).getValue();
           sheet.getRange(rowIndex, 20).setValue(existingKet + '\nHRD: ' + data.catatan);
        }
        sheet.getRange(rowIndex, 24).setValue(new Date());
        
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
