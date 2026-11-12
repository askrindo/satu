/**
 * Askrindo SATU - Database & Local Storage Management
 * Provides offline-first persistence with realistic enterprise seed data.
 */

const DB_KEYS = {
  USERS: 'askrindo_satu_users_v1',
  SESSION: 'askrindo_satu_session_v1',
  SPPA: 'askrindo_satu_sppa_v1',
  KABAR: 'askrindo_satu_kabar_v1',
  PELAKU: 'askrindo_satu_pelaku_v1',
  AUDIT: 'askrindo_satu_audit_v1',
  SETTINGS: 'askrindo_satu_settings_v1'
};

// Seed Users
const INITIAL_USERS = [
  {
    id: 'USR-001',
    nip: '19850101',
    name: 'Ahmad Faisal, S.E., M.M.',
    email: 'admin.satu@askrindo.co.id',
    password: 'password123',
    role: 'Super Administrator',
    division: 'Divisi Teknologi Informasi & Digitalisasi',
    branch: 'Kantor Pusat - Jakarta',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    allowedApps: ['kabar', 'ttk', 'bus', 'pelaku', 'admin'],
    status: 'active',
    createdAt: '2026-01-10T08:00:00Z',
    lastLogin: '2026-11-12T09:30:00Z'
  },
  {
    id: 'USR-002',
    nip: '19900315',
    name: 'Budi Santoso, AAIJ',
    email: 'budi.santoso@askrindo.co.id',
    password: 'password123',
    role: 'Senior Underwriter',
    division: 'Divisi Underwriting & Penjaminan Non-Bank',
    branch: 'Kantor Cabang Utama Jakarta Gambir',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    allowedApps: ['kabar', 'bus', 'pelaku'],
    status: 'active',
    createdAt: '2026-02-15T09:00:00Z',
    lastLogin: '2026-11-12T08:15:00Z'
  },
  {
    id: 'USR-003',
    nip: '19940722',
    name: 'Siti Rahmawati, S.E.',
    email: 'siti.rahma@askrindo.co.id',
    password: 'password123',
    role: 'Account Officer KUR & UMKM',
    division: 'Divisi Penjaminan Perbankan & Program KUR',
    branch: 'Kantor Cabang Surabaya',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    allowedApps: ['ttk', 'pelaku'],
    status: 'active',
    createdAt: '2026-03-01T10:00:00Z',
    lastLogin: '2026-11-11T16:45:00Z'
  },
  {
    id: 'USR-004',
    nip: '19971105',
    name: 'Dian Permana, S.Kom.',
    email: 'dian.permana@askrindo.co.id',
    password: 'password123',
    role: 'Marketing & Relationship Officer',
    division: 'Divisi Pemasaran Korporasi & Broker',
    branch: 'Kantor Cabang Medan',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
    allowedApps: ['kabar', 'bus'],
    status: 'active',
    createdAt: '2026-05-12T11:00:00Z',
    lastLogin: '2026-11-10T14:20:00Z'
  },
  {
    id: 'USR-005',
    nip: '20010910',
    name: 'Rizky Pratama',
    email: 'rizky.pratama@askrindo.co.id',
    password: 'password123',
    role: 'Staff Operasional (Junior)',
    division: 'Divisi Pelayanan & Operasional Cabang',
    branch: 'Kantor Cabang Bandung',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=256&q=80',
    allowedApps: ['kabar'],
    status: 'active',
    createdAt: '2026-08-01T08:30:00Z',
    lastLogin: '2026-11-09T11:10:00Z'
  }
];

// Seed SPPA
const INITIAL_SPPA = [
  {
    id: 'SPPA-2026-0081',
    date: '2026-11-10',
    insuredName: 'PT Maju Bersama Sejahtera',
    insuredType: 'Badan Usaha (PT)',
    nikNpwp: '01.234.567.8-012.000',
    phone: '0812-8899-7711',
    email: 'finance@majubersama.co.id',
    address: 'Kawasan Industri Pulogadung Blok B No. 14, Jakarta Timur',
    productType: 'Asuransi Kebakaran & Property All Risks (PAR)',
    periodStart: '2026-12-01',
    periodEnd: '2027-12-01',
    riskLocation: 'Gudang & Kantor Utama - Jakarta Timur',
    totalTsi: 18500000000,
    estimatedPremium: 28450000,
    status: 'Approved',
    registeredBy: 'Budi Santoso, AAIJ',
    branch: 'Kantor Cabang Utama Jakarta Gambir'
  },
  {
    id: 'SPPA-2026-0082',
    date: '2026-11-11',
    insuredName: 'CV Sumber Rejeki Abadi',
    insuredType: 'Badan Usaha (CV)',
    nikNpwp: '02.987.654.3-045.000',
    phone: '0813-4455-6677',
    email: 'cv.sumberrejeki@gmail.com',
    address: 'Jl. Rungkut Industri Raya No. 88, Surabaya',
    productType: 'Penjaminan Proyek (Surety Bond - Jaminan Pelaksanaan)',
    periodStart: '2026-11-15',
    periodEnd: '2027-05-15',
    riskLocation: 'Proyek Pembangunan Gedung Balai Diklat Jawa Timur',
    totalTsi: 3500000000,
    estimatedPremium: 10500000,
    status: 'Underwriting Review',
    registeredBy: 'Siti Rahmawati, S.E.',
    branch: 'Kantor Cabang Surabaya'
  },
  {
    id: 'SPPA-2026-0083',
    date: '2026-11-12',
    insuredName: 'H. Suwandi (Toko Kain Berkah)',
    insuredType: 'Perorangan',
    nikNpwp: '3174091508750002',
    phone: '0856-1122-3344',
    email: 'suwandi.berkah@yahoo.co.id',
    address: 'Pasar Tanah Abang Blok A Lt. 2 Los B No. 45, Jakarta Pusat',
    productType: 'Asuransi Kebakaran Standar Indonesia (FLEXAS)',
    periodStart: '2026-11-15',
    periodEnd: '2027-11-15',
    riskLocation: 'Kios Pertokoan Tanah Abang, Jakarta Pusat',
    totalTsi: 850000000,
    estimatedPremium: 1870000,
    status: 'Pending Submission',
    registeredBy: 'Dian Permana, S.Kom.',
    branch: 'Kantor Cabang Utama Jakarta Gambir'
  }
];

// Seed Audit Logs
const INITIAL_AUDIT = [
  {
    id: 'LOG-1001',
    timestamp: '2026-11-12T09:35:10Z',
    user: 'Ahmad Faisal, S.E., M.M.',
    role: 'Super Administrator',
    subApp: 'ADMIN',
    action: 'Konfigurasi Hak Akses',
    details: 'Memperbarui hak akses aplikasi untuk user Rizky Pratama (NIP 20010910)'
  },
  {
    id: 'LOG-1002',
    timestamp: '2026-11-12T09:12:44Z',
    user: 'Budi Santoso, AAIJ',
    role: 'Senior Underwriter',
    subApp: 'KABAR',
    action: 'Simulasi Premi Kebakaran',
    details: 'Melakukan kalkulasi tarif kebakaran okupasi Industri Garmen TSI Rp 12.000.000.000'
  },
  {
    id: 'LOG-1003',
    timestamp: '2026-11-12T08:45:20Z',
    user: 'Siti Rahmawati, S.E.',
    role: 'Account Officer KUR',
    subApp: 'TTK',
    action: 'Simulasi Angsuran KUR',
    details: 'Simulasi KUR Mikro Rp 50.000.000 tenor 36 bulan suku bunga subsidi 6%'
  },
  {
    id: 'LOG-1004',
    timestamp: '2026-11-11T15:20:00Z',
    user: 'Budi Santoso, AAIJ',
    role: 'Senior Underwriter',
    subApp: 'PELAKU',
    action: 'Analisis Laporan Keuangan',
    details: 'Menilai laporan keuangan PT Maju Bersama Sejahtera periode 2025. Hasil: Grade A (Sehat)'
  },
  {
    id: 'LOG-1005',
    timestamp: '2026-11-11T14:10:00Z',
    user: 'Dian Permana, S.Kom.',
    role: 'Marketing Officer',
    subApp: 'BUS',
    action: 'Penerbitan SPPA Baru',
    details: 'Menerbitkan SPPA-2026-0081 untuk PT Maju Bersama Sejahtera'
  }
];

// Seed App Catalog Info
const SUB_APPS_CATALOG = {
  kabar: {
    id: 'kabar',
    name: 'KABAR',
    tagline: 'Kalkulator Asuransi Kebakaran',
    badge: 'Underwriting & Tarif OJK',
    category: 'Perhitungan Premi',
    color: 'orange',
    icon: 'flame',
    route: '#/kabar',
    description: 'Hitung tarif premi standar asuransi kebakaran dan perluasan jaminan (RSMDCC, TSFWD, EQVET) mengacu pada regulasi OJK secara cepat dan presisi.',
    features: ['Tarif OJK SEOJK 6/2017', 'Kalkulator Perluasan Jaminan', 'Slip Penawaran / Quotation PDF', 'Integrasi Langsung ke SPPA']
  },
  ttk: {
    id: 'ttk',
    name: 'TTK',
    tagline: 'Tanya-Tanya KUR',
    badge: 'Penjaminan KUR & UMKM',
    category: 'Konsultasi & Simulasi',
    color: 'blue',
    icon: 'help-circle',
    route: '#/ttk',
    description: 'Pusat informasi dan asisten penjaminan Kredit Usaha Rakyat (Super Mikro, Mikro, Kecil). Simulasi angsuran, suku bunga subsidi, dan cek kelayakan debitur.',
    features: ['Simulasi Angsuran & IJP Askrindo', 'Cek Kelayakan Calon Debitur', 'Jadwal Amortisasi Lengkap', 'Smart Knowledge Base Peraturan']
  },
  bus: {
    id: 'bus',
    name: 'BUS',
    tagline: 'Buat SPPA',
    badge: 'Operasional & Penerbitan',
    category: 'Dokumen & Polis',
    color: 'emerald',
    icon: 'file-text',
    route: '#/bus',
    description: 'Penyusunan Surat Permohonan Penutupan Asuransi secara digital, lengkap dengan validasi data tertanggung, kode registrasi, dan cetak dokumen resmi berstandar Askrindo.',
    features: ['Wizard 4 Langkah Praktis', 'Preview Dokumen Berstempel Digital', 'Unduh Format PDF Siap Tanda Tangan', 'Arsip Riwayat Pengajuan']
  },
  pelaku: {
    id: 'pelaku',
    name: 'PELAKU',
    tagline: 'Perhitungan Laporan Keuangan',
    badge: 'Analisis Finansial & Risiko',
    category: 'Underwriting & Akuntansi',
    color: 'purple',
    icon: 'calculator',
    route: '#/pelaku',
    description: 'Analisis rasio keuangan calon nasabah (Likuiditas, Solvabilitas DER/DAR, Profitabilitas ROA/ROE/NPM) serta penilaian scoring otomatis untuk kelayakan penjaminan.',
    features: ['Input Neraca & Laba Rugi', 'Analisis 9+ Rasio Finansial Utama', 'Scoring Kelayakan & Rekomendasi Underwriting', 'Lembar Ringkasan Analisis Cetak']
  }
};

class AskrindoDB {
  constructor() {
    this.init();
  }

  init() {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    }
    if (!localStorage.getItem(DB_KEYS.SPPA)) {
      localStorage.setItem(DB_KEYS.SPPA, JSON.stringify(INITIAL_SPPA));
    }
    if (!localStorage.getItem(DB_KEYS.AUDIT)) {
      localStorage.setItem(DB_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT));
    }
    if (!localStorage.getItem(DB_KEYS.SETTINGS)) {
      localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify({
        appName: 'Askrindo SATU',
        companyName: 'PT Asuransi Kredit Indonesia (Askrindo)',
        memberOf: 'Indonesia Financial Group (IFG)',
        maintenanceMode: false,
        notificationBanner: 'Selamat datang di Portal Terpadu Askrindo SATU. Pastikan data tertanggung diverifikasi dengan NIK/NPWP valid.'
      }));
    }
  }

  // --- Users ---
  getUsers() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.USERS)) || [];
    } catch (e) {
      return INITIAL_USERS;
    }
  }

  getUser(id) {
    const users = this.getUsers();
    return users.find(u => u.id === id);
  }

  findUserByNipOrEmail(query) {
    if (!query) return null;
    const clean = query.trim().toLowerCase();
    const users = this.getUsers();
    return users.find(u => u.nip.toLowerCase() === clean || u.email.toLowerCase() === clean);
  }

  saveUser(userData) {
    const users = this.getUsers();
    if (userData.id) {
      // Update
      const index = users.findIndex(u => u.id === userData.id);
      if (index !== -1) {
        users[index] = { ...users[index], ...userData };
      }
    } else {
      // Create new
      const newId = 'USR-' + String(users.length + 1).padStart(3, '0');
      const newUser = {
        id: newId,
        createdAt: new Date().toISOString(),
        status: 'active',
        avatar: `https://images.unsplash.com/photo-${1534528741775 + users.length * 1000}?auto=format&fit=crop&w=256&q=80`,
        ...userData
      };
      users.push(newUser);
    }
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    return true;
  }

  deleteUser(id) {
    let users = this.getUsers();
    users = users.filter(u => u.id !== id);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
    return true;
  }

  updateUserPermissions(userId, allowedApps) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.allowedApps = allowedApps;
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));
      return true;
    }
    return false;
  }

  // --- Session ---
  getCurrentSession() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.SESSION));
    } catch (e) {
      return null;
    }
  }

  setSession(user) {
    localStorage.setItem(DB_KEYS.SESSION, JSON.stringify(user));
  }

  clearSession() {
    localStorage.removeItem(DB_KEYS.SESSION);
  }

  // --- SPPA Management ---
  getSppaList() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.SPPA)) || [];
    } catch (e) {
      return INITIAL_SPPA;
    }
  }

  saveSppa(sppaData) {
    const list = this.getSppaList();
    if (!sppaData.id) {
      const year = new Date().getFullYear();
      const count = list.length + 1;
      sppaData.id = `SPPA-${year}-${String(count).padStart(4, '0')}`;
      sppaData.date = new Date().toISOString().split('T')[0];
      list.unshift(sppaData);
    } else {
      const index = list.findIndex(s => s.id === sppaData.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...sppaData };
      } else {
        list.unshift(sppaData);
      }
    }
    localStorage.setItem(DB_KEYS.SPPA, JSON.stringify(list));
    return sppaData;
  }

  // --- Audit Logs ---
  getAuditLogs() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.AUDIT)) || [];
    } catch (e) {
      return INITIAL_AUDIT;
    }
  }

  logActivity(subApp, action, details, userOverride = null) {
    const session = userOverride || this.getCurrentSession();
    const logs = this.getAuditLogs();
    const newLog = {
      id: 'LOG-' + (logs.length + 1001),
      timestamp: new Date().toISOString(),
      user: session ? session.name : 'System',
      role: session ? session.role : 'Guest',
      subApp: subApp || 'SYSTEM',
      action: action,
      details: details
    };
    logs.unshift(newLog);
    // Keep max 150 items
    if (logs.length > 150) logs.pop();
    localStorage.setItem(DB_KEYS.AUDIT, JSON.stringify(logs));
  }

  // --- Settings ---
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.SETTINGS));
    } catch (e) {
      return {};
    }
  }

  updateSettings(settings) {
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(settings));
  }

  // Reset to Factory Default
  resetAll() {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    localStorage.setItem(DB_KEYS.SPPA, JSON.stringify(INITIAL_SPPA));
    localStorage.setItem(DB_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT));
    this.clearSession();
  }
}

// Global Export
window.askrindoDB = new AskrindoDB();
window.SUB_APPS_CATALOG = SUB_APPS_CATALOG;
