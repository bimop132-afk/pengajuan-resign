# PANDUAN INSTALASI - Aplikasi Pengajuan Resign Karyawan

Panduan lengkap ini akan membantu Anda melakukan instalasi dan setup Aplikasi Pengajuan Resign Karyawan PT Mitra Sigma Tekindo dari awal hingga aplikasi siap digunakan.

## Daftar Isi
1. [Persiapan](#1-persiapan)
2. [Setup Google Spreadsheet](#2-setup-google-spreadsheet)
3. [Setup Google Apps Script](#3-setup-google-apps-script)
4. [Konfigurasi Frontend](#4-konfigurasi-frontend)
5. [Hosting Frontend](#5-hosting-frontend)
6. [Pengujian](#6-pengujian)
7. [Kustomisasi](#7-kustomisasi)
8. [Troubleshooting](#8-troubleshooting)
9. [Keamanan](#9-keamanan)
10. [Struktur Project](#10-struktur-project)

---

## 1. Persiapan

Sebelum memulai, pastikan Anda memiliki:
- **Akun Google** aktif (Gmail atau Google Workspace).
- **Browser modern** (Chrome, Firefox, Safari, Edge versi terbaru).
- **Text editor** (disarankan menggunakan Visual Studio Code, Sublime Text, atau Notepad++).

---

## 2. Setup Google Spreadsheet

Google Spreadsheet akan bertindak sebagai database utama untuk menyimpan data resign karyawan dan log aktivitas sistem.

1. Buka [Google Sheets](https://sheets.google.com) dan buat Spreadsheet baru bernama **"DATABASE PENGAJUAN RESIGN"**.
2. Di bagian bawah, ubah nama *Sheet1* menjadi **DATA RESIGN**.
3. Buat sheet baru dan beri nama **LOG AKTIVITAS**.

**Konfigurasi Sheet "DATA RESIGN":**
Buat header di baris pertama untuk kolom A sampai X dengan teks berikut:
- A: `ID Pengajuan`
- B: `Timestamp`
- C: `NIK`
- D: `Nama Lengkap`
- E: `Tempat Lahir`
- F: `Tanggal Lahir`
- G: `Jenis Kelamin`
- H: `Alamat`
- I: `No WhatsApp`
- J: `Email`
- K: `Jabatan`
- L: `Departemen`
- M: `Sektor`
- N: `Regu`
- O: `Tanggal Mulai Bekerja`
- P: `Atasan/PIC`
- Q: `Tanggal Pengajuan`
- R: `Tanggal Efektif Resign`
- S: `Alasan Resign`
- T: `Keterangan`
- U: `Status Pengajuan`
- V: `Nomor Surat`
- W: `Link Surat`
- X: `Waktu Diproses`

*(Tip: Blok baris pertama, buat tebal (Bold), dan bekukan baris (View > Freeze > 1 row) untuk kemudahan membaca.)*

**Konfigurasi Sheet "LOG AKTIVITAS":**
Buat header di baris pertama untuk kolom A sampai E:
- A: `Timestamp`
- B: `User`
- C: `Aktivitas`
- D: `ID Pengajuan`
- E: `Keterangan`

**Catat Spreadsheet ID:**
Lihat pada URL browser Anda. URL akan terlihat seperti ini:
`https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit#gid=0`
Copy bagian `1a2b3c4d5e6f7g8h9i0j` dan simpan. Ini adalah **Spreadsheet ID** Anda.

---

## 3. Setup Google Apps Script

Apps Script akan menjadi Backend API yang menghubungkan Frontend (website) dengan Spreadsheet (database).

1. Buka tab baru dan akses [script.google.com](https://script.google.com).
2. Klik tombol **New Project** (Proyek Baru).
3. Beri nama proyek, misalnya "API Pengajuan Resign".
4. Di sebelah kiri, buka file `Code.gs`.
5. Hapus semua kode default yang ada, lalu salin (copy-paste) seluruh kode dari file `google-apps-script/Code.gs` yang ada dalam folder project Anda ke dalam editor Apps Script.
6. Cari baris berikut di paling atas kode:
   `const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';`
   Ganti `YOUR_SPREADSHEET_ID_HERE` dengan Spreadsheet ID yang sudah Anda catat di Langkah 2.
7. Di sebelah kiri (di bawah bagian Files), klik icon roda gigi (Project Settings).
8. Centang **"Show 'appsscript.json' manifest file in editor"**.
9. Kembali ke menu editor kode (icon kurung kurawal `< >`), buka file `appsscript.json` yang baru muncul.
10. Salin isi dari file `google-apps-script/appsscript.json` di komputer Anda, lalu paste dan timpa semua kode di `appsscript.json` Apps Script.
11. Simpan semua perubahan dengan menekan icon disket (Save) atau tekan `Ctrl+S` / `Cmd+S`.
12. **Deploy sebagai Web App:**
    - Klik tombol biru **Deploy** di kanan atas.
    - Pilih **New deployment**.
    - Di sebelah ikon gear "Select type", centang kotak **Web app**.
    - Isi deskripsi (opsional, misal: "Versi 1").
    - Di bagian **Execute as**, pastikan memilih **Me (alamat_email_anda@gmail.com)**.
    - Di bagian **Who has access**, wajib pilih **Anyone** (Siapa saja).
    - Klik tombol **Deploy**.
    - *(Catatan: Saat pertama kali deploy, Google akan meminta otorisasi. Klik "Review permissions", pilih akun Google Anda. Jika muncul peringatan "Google hasn't verified this app", klik "Advanced" (Lanjutan), lalu klik "Go to API Pengajuan Resign (unsafe)" di bagian bawah, lalu klik "Allow" (Izinkan).*
13. Setelah deploy berhasil, Anda akan mendapatkan **Web app URL** yang panjang (berakhir dengan `/exec`). **Copy URL tersebut** dan simpan baik-baik.

---

## 4. Konfigurasi Frontend

Sekarang kita akan menghubungkan kode frontend web (HTML/JS) ke backend Apps Script yang baru saja kita deploy.

1. Buka folder frontend project ini di Text Editor (VS Code / Notepad++).
2. Cari dan buka file konfigurasinya (biasanya berada di `js/config.js` atau sejenisnya, pastikan sesuai struktur folder).
3. Cari variabel endpoint API, yang mungkin terlihat seperti ini:
   `const API_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";`
4. Ganti `YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL` dengan **Web app URL** yang Anda dapatkan di akhir langkah ke-3.
5. Simpan file tersebut.

---

## 5. Hosting Frontend

Agar aplikasi bisa diakses oleh seluruh karyawan, Anda perlu menghosting (meng-online-kan) file frontend (HTML, CSS, JS).

**Option A: GitHub Pages (Gratis & Disarankan)**
1. Buat akun di [GitHub](https://github.com).
2. Buat repository baru (klik tombol + di kanan atas, pilih "New repository").
3. Beri nama bebas (contoh: `pengajuan-resign`), pilih *Public*, lalu klik "Create repository".
4. Upload semua file web frontend Anda (index.html, folder css, js, dll) ke repository ini (bisa via git command line atau upload langsung di browser).
5. Setelah terupload, buka tab **Settings** di repository tersebut.
6. Di menu kiri, pilih **Pages**.
7. Pada bagian "Source" (Build and deployment), pilih branch **main** (atau **master**), lalu klik **Save**.
8. Tunggu beberapa menit. GitHub akan memunculkan notifikasi hijau beserta link akses web Anda (contoh: `https://username.github.io/pengajuan-resign/`).

**Option B: Google Drive + Apps Script serving**
(Tidak disarankan untuk file statis kompleks, namun memungkinkan jika di-serve sebagai HTML lewat Apps Script).

**Option C: Netlify / Vercel (Gratis)**
Anda bisa drag & drop folder frontend Anda ke dashboard [Netlify](https://www.netlify.com/) (Drop section) untuk hosting gratis seketika.

---

## 6. Pengujian

Setelah web online, lakukan uji coba menyeluruh:
1. **Buka website** yang sudah di-hosting.
2. **Isi form pengajuan** dengan data *dummy* secara lengkap.
3. Klik submit dan tunggu prosesnya.
4. **Cek Google Spreadsheet:** Buka sheet "DATA RESIGN" dan pastikan data yang barusan Anda submit masuk di baris baru dengan benar, termasuk nomor surat otomatis.
5. Cek apakah dokumen / PDF resign (jika dikonfigurasi Frontend) bisa terdownload/ter-generate dengan benar.
6. **Login HRD:** Masuk ke halaman admin/dashboard (jika ada).
   - Gunakan default credential yang ada di `Code.gs`:
   - Username: `admin`
   - Password: `admin123`
7. **Test Dashboard:** Coba ubah status pengajuan karyawan di dashboard menjadi "Disetujui" atau "Ditolak".
8. **Cek "LOG AKTIVITAS":** Pastikan login Anda dan perubahan status yang Anda buat tadi tercatat dengan rapi di sheet ini.

---

## 7. Kustomisasi

Beberapa hal yang bisa Anda ubah untuk menyesuaikan kebutuhan perusahaan:

- **Mengubah Password HRD:** Buka file `Code.gs` di Apps Script, cari variabel `const HRD_CREDENTIALS = { username: 'admin', password: 'admin123' };`. Ubah nilai-nilainya lalu lakukan *New Deployment* (penting: setiap mengubah Code.gs, Anda harus deploy ulang).
- **Mengubah Warna / Tampilan:** Buka file CSS di frontend (biasanya di `css/style.css`) dan ubah kode warna hex yang digunakan.
- **Mengubah Nama Perusahaan / Logo:** Cukup ganti aset gambar (logo) di folder gambar, dan ubah teks statis di file HTML frontend.

---

## 8. Troubleshooting

Jika mengalami masalah:

- **CORS Error di Console Browser:** Pastikan Anda men-deploy Apps Script dengan Execute As: "Me" dan Who has access: "Anyone". Jangan gunakan mode incognito khusus yang mengeblok cookie pihak ketiga terlalu ketat saat testing lokal.
- **API tidak merespon / Form macet:** Pastikan URL Web App di `config.js` sudah benar dan tidak ada salah ketik. Periksa Console (F12 > Console) di browser untuk melihat detail error.
- **Data tidak tersimpan:** Periksa struktur kolom Spreadsheet Anda apakah sudah tepat. Cek juga log Apps Script di (Executions) kiri layar script.google.com.
- **Login HRD gagal:** Pastikan mengetik username dan password sesuai dengan di `Code.gs` (membedakan huruf besar-kecil/case-sensitive).

---

## 9. Keamanan

Tindakan keamanan yang wajib dilakukan sebelum production:
1. **Ganti password default:** Ganti password 'admin123' dengan password yang kuat (kombinasi huruf, angka, simbol).
2. **Batasi akses spreadsheet:** Pastikan Google Spreadsheet ini HANYA dibagikan (Share) ke tim HRD yang berkepentingan. Jangan bagikan secara *public link*. Apps script tetap bisa berjalan (execute as "Me") meski spreadsheet dikunci *Private*.
3. **Monitor log aktivitas:** Selalu pantau sheet "LOG AKTIVITAS" untuk melihat riwayat aktivitas user (siapa yang mengubah status, login kapan).
4. **Ganti Secret Key:** Ganti value `const SECRET_KEY` di `Code.gs` dengan karakter acak panjang.

---

## 10. Struktur Project

Berikut adalah referensi struktur file dan folder dari sistem (Frontend & Backend):

```text
PENGAJUAN RESIGN/
│
├── google-apps-script/
│   ├── Code.gs                // Backend API Logika & CRUD (Deploy ke Google Script)
│   └── appsscript.json        // Konfigurasi hak akses (Manifest)
│
├── (File-file Frontend Anda biasanya di sini, misal: index.html, folder js/, folder css/)
│
└── PANDUAN_INSTALASI.md       // File panduan ini
```

Selamat! Aplikasi Pengajuan Resign Anda sudah siap digunakan.
