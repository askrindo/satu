# ASKRINDO SATU (Sistem Aplikasi Terpadu)

Portal aplikasi kerja terpadu PT Asuransi Kredit Indonesia (Askrindo) yang mengintegrasikan berbagai modul operasional harian dalam satu wadah (*single hub*) dengan antarmuka modern, *eye-catching*, dan mudah digunakan.

---

## 🌟 Modul & Aplikasi di Dalam Askrindo SATU

Aplikasi ini mengadopsi arsitektur modular di mana seluruh sub-aplikasi berada dalam satu wadah dan diwajibkan login:

1. **🔐 Login & Autentikasi Multi-Peran**:
   - Sistem Single Sign-On (SSO) internal dengan NIP atau email resmi Askrindo.
   - Sesi terproteksi (*route guard*): Pengguna yang belum login otomatis diarahkan ke halaman login.
   - *Quick Demo Login*: Tombol akses cepat 1-klik untuk menguji berbagai peran (Super Admin, Underwriter, Account Officer KUR, Marketing, dan Trainee).

2. **🛡️ Portal Web Admin (`#/admin`)**:
   - **Manajemen Pengguna**: Tambah user baru, edit profil/divisi/cabang, aktifkan/nonaktifkan akun, dan hapus user.
   - **Matriks Hak Akses Sub-Aplikasi (Live Matrix)**: Atur secara spesifik aplikasi mana saja yang boleh diakses oleh tiap pegawai (KABAR, TTK, BUSET, PELAKU, dan Admin) dengan saklar interaktif *real-time*.
   - **Audit Trail & Log Aktivitas**: Perekaman jejak seluruh aktivitas (login, kalkulasi premi, penerbitan SPPA, analisis laporan keuangan) untuk kepatuhan tata kelola (*Governance, Risk, and Compliance*).
   - **Backup & Konfigurasi**: Ekspor basis data ke JSON/CSV dan kustomisasi pengumuman *ticker*.

3. **🔥 KABAR (Kalkulator Asuransi Kebakaran) (`#/kabar`)**:
   - Simulasi perhitungan tarif premi asuransi kebakaran mengacu pada regulasi OJK (SEOJK No. 6/SEOJK.05/2017).
   - Parameter lengkap: Okupasi (Rumah Tinggal, Ruko, Kantor, Hotel, Pabrik Garmen, Gudang, dll.) & Kelas Konstruksi (1, 2, 3).
   - Komponen TSI: Bangunan, Mesin, Stok Dagangan, dan Perabot.
   - Perluasan Jaminan: RSMDCC 4.1A, Terorisme & Sabotase, Banjir TSFWD, Gempa Bumi EQVET Zona 3, Tertimpa Pesawat, Pembersihan Puing.
   - Cetak *Slip Penawaran / Quotation PDF* resmi & tombol teruskan langsung ke modul BUSET.

4. **💬 TTK (Tanya-Tanya KUR) (`#/ttk`)**:
   - Pusat konsultasi dan simulasi penjaminan Kredit Usaha Rakyat (KUR).
   - Kalkulator Angsuran Bulanan untuk skema **KUR Super Mikro** (3%), **KUR Mikro** (6%), dan **KUR Kecil** (6%).
   - Jadwal Amortisasi Angsuran interaktif per bulan & estimasi porsi Imbal Jasa Penjaminan (IJP) Askrindo.
   - Wizard Uji Kelayakan Calon Debitur (Lama usaha, status SLIK/BI Checking, kepemilikan kredit komersial, legalitas NIB/SKU).
   - Pusat Pengetahuan & Aturan Operasional KUR (Permenko Perekonomian).

5. **📄 BUSET (Buat SPPA Elektronik Terpadu) (`#/buset` / `#/bus`)**:
   - Generator Surat Permohonan Penutupan Asuransi digital dengan *wizard* 4 langkah.
   - Mendukung lini produk: Asuransi Kebakaran (FLEXAS/PAR), Kendaraan Bermotor, Penjaminan Kontrak (Surety Bond - Jaminan Pelaksanaan/Uang Muka), Kontra Bank Garansi (KBG), dan KUR.
   - Terintegrasi langsung dengan modul KABAR (data simulasi otomatis masuk).
   - Halaman *preview* dokumen resmi berstandar Askrindo lengkap dengan Kop Surat, Nomor Registrasi SPPA unik, stempel digital, dan tombol cetak/unduh PDF.
   - Basis data arsip riwayat SPPA yang telah diterbitkan.

6. **⚡ CEPAT (Cover Note Pertanggungan Asuransi Terintegrasi) (`#/cepat`)**:
   - Generator Cover Note (Nota Penutupan Asuransi Sementara) asuransi umum kilat dan mudah.
   - Dibuat khusus untuk kebutuhan mendesak penjaminan kredit perbankan (*Banker's Clause QQ Bank Mandiri, BRI, BNI, BTN, BSI, BPD, dll.*) sebelum polis definitif terbit.
   - *Wizard* penerbitan kilat 4 langkah: Data Tertanggung & Bank Rekanan, Objek Risiko & Kalkulator Masa Berlaku (14, 30, 60, 90 hari), Klausula Banker's Clause & Pejabat Berwenang, serta Pratinjau Dokumen.
   - Dokumen formal berstandar Askrindo lengkap dengan Kop Surat resmi, Nomor Registrasi Cover Note unik (`CN/ASK-.../2026/11/...`), stempel digital resmi Askrindo, QR code verifikasi keabsahan, dan tombol cetak/unduh PDF.
   - Fitur Arsip & Riwayat Cover Note terbit, serta tombol 1-klik konversi Cover Note langsung ke formulir SPPA modul BUSET untuk penerbitan Polis Definitif.

7. **📊 PELAKU (Perhitungan Laporan Keuangan) (`#/pelaku`)**:
   - Modul analisis rasio keuangan calon debitur atau rekanan penjaminan.
   - Input komponen Neraca (Aset Lancar, Kas, Piutang, Persediaan, Aset Tetap, Kewajiban Lancar, Hutang Bank, Ekuitas) dan Laba Rugi (Omset, HPP, Laba Bersih).
   - Perhitungan rasio otomatis:
     - **Likuiditas**: Current Ratio, Quick Ratio.
     - **Solvabilitas**: Debt to Equity Ratio (DER), Debt to Asset Ratio (DAR).
     - **Profitabilitas**: Net Profit Margin (NPM), Return on Assets (ROA), Return on Equity (ROE).
   - *Automated Scoring & Underwriting Assessment* (Grade A Sehat, Grade B Standar, Grade C Bersyarat, Grade D Berisiko Tinggi) dilengkapi narasi rekomendasi komite penjaminan.
   - Ekspor lembar evaluasi rasio keuangan ke format cetak PDF.

---

## ⚡ Integrasi Cloud Database (Supabase PostgreSQL)

Aplikasi telah terhubung secara otomatis ke database cloud **Supabase (PostgreSQL)**:
* **Project URL**: `https://jvecpwnvbcildrisgyro.supabase.co`
* **API Key**: `sb_publishable_RyIwxOVt5_tMMiPbsDh5kQ_pgwlhFYD`
* **Script Skema Database**: [`schema.sql`](file:///G:/My%20Drive/Personal/Project/ASKRINDO%20SATU/schema.sql)

### 📌 Panduan Menjalankan Script Database (Hanya 1 Kali):
1. Buka dashboard proyek Supabase Anda: [https://supabase.com/dashboard/project/jvecpwnvbcildrisgyro/sql](https://supabase.com/dashboard/project/jvecpwnvbcildrisgyro/sql)
2. Buka menu **SQL Editor** di bilah sisi kiri.
3. Buka berkas **`schema.sql`** di folder proyek ini, salin seluruh isinya, lalu tempel (*paste*) ke SQL Editor Supabase.
4. Klik tombol **Run** (atau tekan `Ctrl + Enter`).
5. **Selesai!** Seluruh tabel `users`, `sppa_records`, `audit_logs`, dan `system_settings` otomatis dibuat beserta data bawaan. Aplikasi web Askrindo SATU akan langsung tersinkronisasi online 24 jam!

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi dibangun dengan arsitektur web modern yang sangat ringan, tanpa memerlukan proses *build* atau instalasi dependensi `node_modules` (bebas dari resiko sinkronisasi lambat di Google Drive).

### Opsi 1: Menjalankan via `run-app.bat` (Rekomendasi di Windows)
1. Buka folder `G:\My Drive\Personal\Project\ASKRINDO SATU`.
2. Klik ganda pada berkas **`run-app.bat`**.
3. Server lokal otomatis aktif di `http://localhost:8080/` dan peramban web akan terbuka otomatis.

### Opsi 2: Buka Langsung Berkas `index.html`
1. Cukup klik ganda pada berkas **`index.html`**.
2. Aplikasi akan langsung berjalan di peramban (Google Chrome, Microsoft Edge, dll.) dengan seluruh fungsi *routing* berbasis *hash* berjalan 100% normal.

---

## 👥 Akun Demonstrasi Bawaan (Demo Credentials)

Untuk memudahkan pengujian fungsionalitas dan matriks hak akses, Anda dapat menggunakan kredensial berikut (kata sandi bawaan: `password123`) atau menggunakan tombol **Pilih Cepat Pengguna Demo** di halaman login:

| Nama Pengguna | NIP / Email | Peran (Role) | Akses Sub-Aplikasi |
| :--- | :--- | :--- | :--- |
| **Ahmad Faisal, S.E.** | `19850101` / `admin.satu@askrindo.co.id` | **Super Administrator** | Akses Penuh: PELAKU (Aktif), Pratinjau KABAR, TTK, BUSET, CEPAT (Segera Hadir), Web Admin |
| **Budi Santoso, AAIJ** | `19900315` / `budi.santoso@askrindo.co.id` | **Senior Underwriter** | PELAKU (Modul Aktif Operasional) |
| **Siti Rahmawati, S.E.** | `19940722` / `siti.rahma@askrindo.co.id` | **Account Officer KUR** | PELAKU (Modul Aktif Operasional) |
| **Dian Permana, S.Kom.** | `19971105` / `dian.permana@askrindo.co.id` | **Marketing Officer** | PELAKU (Modul Aktif Operasional) |
| **Rizky Pratama** | `20010910` / `rizky.pratama@askrindo.co.id` | **Staff Operasional** | PELAKU (Modul Aktif Operasional) |

> **Tahap Peluncuran Bertahap**: Saat ini modul **PELAKU** telah rilis penuh untuk operasional. Modul **KABAR, TTK, BUSET, CEPAT, dan SURETY** berstatus **Segera Hadir**. Pengguna yang membuka modul tersebut akan diarahkan ke layar informasi Segera Hadir.

---

## 📁 Struktur Berkas Proyek

```
G:\My Drive\Personal\Project\ASKRINDO SATU\
├── index.html                      # Wadah utama aplikasi & template single-page
├── run-app.bat                     # Peluncur server lokal otomatis untuk Windows
├── server.ps1                      # Skrip server HTTP lokal ringan PowerShell
├── README.md                       # Dokumentasi lengkap proyek
├── Modern Askrindo Satu Corporate Logo.png
├── Navy A with Orange Swoosh Icon.png
├── Navy A with Orange Swoosh.png
├── SATU Logo with Orange Swoosh.png
└── assets\
    ├── css\
    │   └── style.css               # Gaya kustom Askrindo, glassmorphism, & print styling
    ├── js\
    │   ├── db.js                   # Basis data lokal (LocalStorage & seed data)
    │   ├── auth.js                 # Layanan autentikasi, sesi, & guard hak akses
    │   ├── app.js                  # Router aplikasi, sidebar, topbar, & command palette
    │   └── modules\
    │       ├── dashboard.js        # Modul Beranda Terpadu & launcher aplikasi
    │       ├── admin.js            # Modul Web Admin (kelola user & matriks hak akses)
    │       ├── kabar.js            # Modul Kalkulator Asuransi Kebakaran OJK
    │       ├── ttk.js              # Modul Tanya-Tanya KUR & cek kelayakan debitur
    │       ├── bus.js              # Modul BUSET (Buat SPPA Elektronik Terpadu)
│       ├── cepat.js            # Modul CEPAT (Cover Note Pertanggungan Asuransi Terintegrasi)
    │       └── pelaku.js           # Modul Perhitungan Laporan Keuangan & rasio
    └── images\                     # Aset logo resmi Askrindo SATU
        ├── logo-corporate.png
        ├── logo-icon.png
        ├── logo-mark.png
        └── logo-satu.png
```

---

## 🎨 Desain & Identitas Visual
- **Palet Warna Resmi**:
  - *Navy Blue Askrindo* (`#002B49`, `#0A3D62`): Melambangkan stabilitas, keamanan penjaminan BUMN, dan profesionalisme.
  - *Orange Swoosh* (`#F37021`): Melambangkan energi, inovasi digital, dan kecepatan pelayanan.
  - *Golden Accent* (`#FFB100`): Aksen kemakmuran dan mitra terpercaya.
- **Tipografi**: Menggunakan font modern korporat *Plus Jakarta Sans* dan *JetBrains Mono* untuk nilai angka/tarif.
- **Fitur Cepat**: Tekan **`Ctrl + K`** (atau `Cmd + K`) untuk membuka *Command Palette* pencarian cepat modul kerja dari halaman mana pun.
