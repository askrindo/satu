/**
 * Askrindo SATU - Database & Cloud Sync Management (Supabase PostgreSQL + Local Cache)
 * Provides hybrid offline-first persistence with real-time cloud synchronization.
 */

// Supabase Cloud Configuration
const SUPABASE_CONFIG = {
  url: 'https://jvecpwnvbcildrisgyro.supabase.co',
  key: 'sb_publishable_RyIwxOVt5_tMMiPbsDh5kQ_pgwlhFYD',
  projectId: 'jvecpwnvbcildrisgyro'
};

const DB_KEYS = {
  USERS: 'askrindo_satu_users_v1',
  SESSION: 'askrindo_satu_session_v1',
  SPPA: 'askrindo_satu_sppa_v1',
  COVER_NOTES: 'askrindo_satu_cover_notes_v1',
  KABAR: 'askrindo_satu_kabar_v1',
  PELAKU: 'askrindo_satu_pelaku_v1',
  AUDIT: 'askrindo_satu_audit_v1',
  SETTINGS: 'askrindo_satu_settings_v1'
};

// Seed Users for local fallback
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
    allowedApps: ['kabar', 'ttk', 'bus', 'pelaku', 'cepat', 'admin'],
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
    allowedApps: ['kabar', 'bus', 'pelaku', 'cepat'],
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
    allowedApps: ['kabar', 'bus', 'cepat'],
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

// Seed Cover Notes (CEPAT - Cover Note Pertanggungan Asuransi Terintegrasi)
const INITIAL_COVER_NOTES = [
  {
    id: 'CN-2026-001',
    coverNoteNo: 'CN/ASK-JKT/2026/11/0142',
    issuedDate: '2026-11-10',
    validUntil: '2026-12-10',
    validDays: 30,
    insuredType: 'Badan Usaha (PT)',
    insuredName: 'PT Nusantara Megah Mandiri',
    nikNpwp: '01.345.678.9-012.000',
    phone: '021-52901234',
    email: 'finance@nusantaramegah.co.id',
    address: 'Kawasan Industri Pulogadung Blok B No. 12, Jakarta Timur',
    bankName: 'PT Bank Mandiri (Persero) Tbk',
    bankBranch: 'Cabang Jakarta Thamrin',
    creditRefNo: 'PK-MDR/KORP/2026/0889',
    productType: 'Asuransi Kebakaran & Property All Risks (FLEXAS)',
    riskObjectDescription: 'Bangunan Gudang & Fasilitas Pabrik Beserta Mesin Produksi',
    riskLocation: 'Jl. Rawa Terate II No. 8, Kawasan Industri Pulogadung, Jakarta Timur',
    totalTsi: 25000000000,
    estimatedPremium: 38750000,
    deductible: '10% of Claim, Min. Rp 25.000.000',
    specialClauses: 'Banker\'s Clause QQ PT Bank Mandiri (Persero) Tbk, RSMDCC 4.1A, Earthquake EQVET, Flood TSFWD',
    status: 'Aktif',
    notes: 'Diterbitkan untuk pemenuhan klausula pencairan fasilitas KMK Bank Mandiri.',
    registeredBy: 'Ahmad Faisal, S.E., M.M.',
    branch: 'Kantor Cabang Khusus Jakarta'
  },
  {
    id: 'CN-2026-002',
    coverNoteNo: 'CN/ASK-SBY/2026/11/0088',
    issuedDate: '2026-11-08',
    validUntil: '2026-12-08',
    validDays: 30,
    insuredType: 'Badan Usaha (CV)',
    insuredName: 'CV Sumber Logistik Abadi',
    nikNpwp: '02.987.654.3-604.000',
    phone: '031-8491234',
    email: 'admin@sumberlogistik.co.id',
    address: 'Jl. Rungkut Industri III No. 45, Surabaya',
    bankName: 'PT Bank Rakyat Indonesia (Persero) Tbk',
    bankBranch: 'Cabang Surabaya Kertajaya',
    creditRefNo: 'BRI-KMY/SUB/2026/0411',
    productType: 'Asuransi Kendaraan Bermotor (Comprehensive)',
    riskObjectDescription: '12 Unit Truk Hino Ranger Wingbox Tahun 2024-2025',
    riskLocation: 'Jawa - Bali (Lintas Wilayah Operasional)',
    totalTsi: 7200000000,
    estimatedPremium: 86400000,
    deductible: 'Rp 500.000 per kejadian',
    specialClauses: 'Banker\'s Clause QQ PT Bank Rakyat Indonesia (Persero) Tbk, TJH Pihak Ketiga Rp 50.000.000',
    status: 'Aktif',
    notes: 'Jaminan penutupan armada ekspedisi pembiayaan investasi BRI.',
    registeredBy: 'Budi Santoso, AAIJ',
    branch: 'Kantor Cabang Surabaya'
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
  }
];

// Status Rilis & Deployment Sub-Aplikasi (Pengembangan Bertahap)
const APP_DEPLOYMENT_STATUS = {
  pelaku: {
    status: 'active', // 'active' | 'development' | 'coming_soon'
    label: 'Rilis Penuh (Aktif)',
    phase: 'Tahap 1 (Live Operasional)',
    badge: 'Rilis Penuh (Aktif)',
    isPublic: true
  },
  kabar: {
    status: 'development',
    label: 'Tahap Pengembangan (Khusus Testing Admin)',
    phase: 'Tahap 2 (Uji Coba Tertutup)',
    badge: 'Khusus Testing Admin',
    isPublic: false
  },
  ttk: {
    status: 'development',
    label: 'Tahap Pengembangan (Khusus Testing Admin)',
    phase: 'Tahap 3 (Uji Coba Tertutup)',
    badge: 'Khusus Testing Admin',
    isPublic: false
  },
  bus: {
    status: 'development',
    label: 'Tahap Pengembangan (Khusus Testing Admin)',
    phase: 'Tahap 4 (Uji Coba Tertutup)',
    badge: 'Khusus Testing Admin',
    isPublic: false
  },
  cepat: {
    status: 'development',
    label: 'Tahap Pengembangan (Khusus Testing Admin)',
    phase: 'Tahap 5 (Uji Coba Tertutup)',
    badge: 'Khusus Testing Admin',
    isPublic: false
  },
  surety: {
    status: 'coming_soon',
    label: 'Segera Hadir',
    phase: 'Roadmap Pengembangan',
    badge: 'Segera Hadir',
    isPublic: false
  }
};
window.APP_DEPLOYMENT_STATUS = APP_DEPLOYMENT_STATUS;

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
    name: 'BUSET',
    tagline: 'Buat SPPA Elektronik Terpadu',
    badge: 'Operasional & Penerbitan',
    category: 'Dokumen & Polis',
    color: 'emerald',
    icon: 'file-text',
    route: '#/buset',
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
  },
  cepat: {
    id: 'cepat',
    name: 'CEPAT',
    tagline: 'Cover Note Pertanggungan Asuransi Terintegrasi',
    badge: 'Penerbitan Nota Sementara',
    category: 'Underwriting & Perbankan',
    color: 'cyan',
    icon: 'file-check-2',
    route: '#/cepat',
    description: 'Pembuatan Cover Note (Nota Penutupan Asuransi Sementara) asuransi umum secara cepat, otomatis berstempel digital, Banker\'s Clause QQ Bank, dan QR code resmi untuk kebutuhan kredit perbankan atau proyek mendesak.',
    features: ['Penerbitan Cover Note Kilat', 'Format Standar Perbankan (Banker\'s Clause)', 'Pratinjau & Cetak PDF Berstempel', 'Arsip & Konversi ke SPPA Definitif']
  }
};

class AskrindoDB {
  constructor() {
    this.supabase = null;
    this.cloudStatus = 'connecting'; // 'connected' | 'pending_schema' | 'offline'
    this.cloudError = null;
    this.init();
  }

  init() {
    // 1. Inisialisasi Cache Lokal jika kosong
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    } else {
      // Auto-migrate: Pastikan modul 'cepat' tersedia bagi admin/underwriter
      try {
        const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS)) || [];
        users.forEach(u => {
          if ((u.id === 'USR-001' || u.id === 'USR-002' || u.id === 'USR-004' || u.role === 'Super Administrator') && !u.allowedApps.includes('cepat')) {
            u.allowedApps.push('cepat');
          }
        });
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

        // Update active session if logged in
        const sess = this.getCurrentSession();
        if (sess && (sess.id === 'USR-001' || sess.id === 'USR-002' || sess.id === 'USR-004' || sess.role === 'Super Administrator') && !sess.allowedApps.includes('cepat')) {
          sess.allowedApps.push('cepat');
          this.setSession(sess);
        }
      } catch (e) {}
    }

    if (!localStorage.getItem(DB_KEYS.SPPA)) {
      localStorage.setItem(DB_KEYS.SPPA, JSON.stringify(INITIAL_SPPA));
    }
    if (!localStorage.getItem(DB_KEYS.COVER_NOTES)) {
      localStorage.setItem(DB_KEYS.COVER_NOTES, JSON.stringify(INITIAL_COVER_NOTES));
    }
    if (!localStorage.getItem(DB_KEYS.AUDIT)) {
      localStorage.setItem(DB_KEYS.AUDIT, JSON.stringify(INITIAL_AUDIT));
    }
    const existingSettings = localStorage.getItem(DB_KEYS.SETTINGS);
    if (!existingSettings) {
      localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify({
        appName: 'Askrindo SATU',
        companyName: 'PT Asuransi Kredit Indonesia (Askrindo)',
        memberOf: '',
        maintenanceMode: false,
        notificationBanner: 'Selamat datang di Portal Aplikasi Terpadu Askrindo SATU.'
      }));
    } else {
      try {
        const s = JSON.parse(existingSettings);
        if (s.notificationBanner && s.notificationBanner.includes('Supabase')) {
          s.notificationBanner = 'Selamat datang di Portal Aplikasi Terpadu Askrindo SATU.';
          localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(s));
        }
      } catch (e) {}
    }

    // 2. Inisialisasi Supabase SDK
    if (window.supabase) {
      try {
        this.supabase = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.key);
        this.syncWithSupabase();
      } catch (e) {
        console.warn('[Supabase] Gagal inisialisasi client:', e);
        this.cloudStatus = 'offline';
      }
    } else {
      this.cloudStatus = 'offline';
    }
  }

  // --- Sinkronisasi Cloud Dua Arah (Supabase <-> LocalStorage) ---
  async syncWithSupabase() {
    if (!this.supabase) return;

    try {
      // Test fetch tabel users
      const { data: users, error: userErr } = await this.supabase
        .from('users')
        .select('*');

      if (userErr) {
        // Jika tabel belum dibuat di Supabase (relation does not exist)
        console.info('[Supabase] Menunggu migrasi tabel schema.sql:', userErr.message);
        this.cloudStatus = 'pending_schema';
        this.cloudError = 'Tabel database Supabase belum dibuat. Jalankan schema.sql di SQL Editor Supabase.';
        window.dispatchEvent(new CustomEvent('askrindo:cloud-status', { detail: { status: this.cloudStatus, error: this.cloudError } }));
        return;
      }

      // Jika berhasil connect & tabel ada
      this.cloudStatus = 'connected';
      this.cloudError = null;

      if (users && users.length > 0) {
        // Map database columns to app schema
        const mappedUsers = users.map(u => ({
          id: u.id,
          nip: u.nip,
          name: u.name,
          email: u.email,
          password: u.password,
          role: u.role,
          division: u.division,
          branch: u.branch,
          avatar: u.avatar,
          allowedApps: u.allowed_apps || ['kabar'],
          status: u.status,
          createdAt: u.created_at,
          lastLogin: u.last_login
        }));
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(mappedUsers));
      }

      // Fetch SPPA records
      const { data: sppaData } = await this.supabase
        .from('sppa_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (sppaData && sppaData.length > 0) {
        const mappedSppa = sppaData.map(s => ({
          id: s.id,
          date: s.date,
          insuredName: s.insured_name,
          insuredType: s.insured_type,
          nikNpwp: s.nik_npwp,
          phone: s.phone,
          email: s.email,
          address: s.address,
          productType: s.product_type,
          periodStart: s.period_start,
          periodEnd: s.period_end,
          riskLocation: s.risk_location,
          totalTsi: Number(s.total_tsi) || 0,
          estimatedPremium: Number(s.estimated_premium) || 0,
          status: s.status,
          registeredBy: s.registered_by,
          branch: s.branch
        }));
        localStorage.setItem(DB_KEYS.SPPA, JSON.stringify(mappedSppa));
      }

      // Fetch Audit logs
      const { data: auditData } = await this.supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (auditData && auditData.length > 0) {
        const mappedLogs = auditData.map(l => ({
          id: l.id,
          timestamp: l.timestamp,
          user: l.user_name,
          role: l.role,
          subApp: l.sub_app,
          action: l.action,
          details: l.details
        }));
        localStorage.setItem(DB_KEYS.AUDIT, JSON.stringify(mappedLogs));
      }

      // Trigger event update UI
      window.dispatchEvent(new CustomEvent('askrindo:db-synced'));
      window.dispatchEvent(new CustomEvent('askrindo:cloud-status', { detail: { status: this.cloudStatus } }));
      console.log('[Supabase] Sinkronisasi data cloud sukses terhubung!');
    } catch (e) {
      console.warn('[Supabase Sync Error]:', e);
      this.cloudStatus = 'offline';
      window.dispatchEvent(new CustomEvent('askrindo:cloud-status', { detail: { status: this.cloudStatus, error: e.message } }));
    }
  }

  // --- Users CRUD ---
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
    let targetUser = null;

    if (userData.id) {
      // Update
      const index = users.findIndex(u => u.id === userData.id);
      if (index !== -1) {
        users[index] = { ...users[index], ...userData };
        targetUser = users[index];
      }
    } else {
      // Create new
      const newId = 'USR-' + String(users.length + 1).padStart(3, '0');
      targetUser = {
        id: newId,
        createdAt: new Date().toISOString(),
        status: 'active',
        avatar: `https://images.unsplash.com/photo-${1534528741775 + users.length * 1000}?auto=format&fit=crop&w=256&q=80`,
        ...userData
      };
      users.push(targetUser);
    }
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

    // Async sync to Supabase
    if (this.supabase && this.cloudStatus === 'connected' && targetUser) {
      this.supabase.from('users').upsert({
        id: targetUser.id,
        nip: targetUser.nip,
        name: targetUser.name,
        email: targetUser.email,
        password: targetUser.password || 'password123',
        role: targetUser.role,
        division: targetUser.division,
        branch: targetUser.branch,
        avatar: targetUser.avatar,
        allowed_apps: targetUser.allowedApps,
        status: targetUser.status || 'active',
        last_login: targetUser.lastLogin || new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.warn('[Supabase Sync User Error]:', error);
      });
    }

    return true;
  }

  deleteUser(id) {
    let users = this.getUsers();
    users = users.filter(u => u.id !== id);
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

    // Async sync to Supabase
    if (this.supabase && this.cloudStatus === 'connected') {
      this.supabase.from('users').delete().eq('id', id).then(({ error }) => {
        if (error) console.warn('[Supabase Delete User Error]:', error);
      });
    }

    return true;
  }

  updateUserPermissions(userId, allowedApps) {
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    if (user) {
      user.allowedApps = allowedApps;
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

      // Async sync to Supabase
      if (this.supabase && this.cloudStatus === 'connected') {
        this.supabase.from('users').update({ allowed_apps: allowedApps }).eq('id', userId).then(({ error }) => {
          if (error) console.warn('[Supabase Update Permissions Error]:', error);
        });
      }
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

    // Async sync to Supabase
    if (this.supabase && this.cloudStatus === 'connected') {
      this.supabase.from('sppa_records').upsert({
        id: sppaData.id,
        date: sppaData.date,
        insured_name: sppaData.insuredName,
        insured_type: sppaData.insuredType,
        nik_npwp: sppaData.nikNpwp,
        phone: sppaData.phone,
        email: sppaData.email,
        address: sppaData.address,
        product_type: sppaData.productType,
        period_start: sppaData.periodStart,
        period_end: sppaData.periodEnd,
        risk_location: sppaData.riskLocation,
        total_tsi: sppaData.totalTsi,
        estimated_premium: sppaData.estimatedPremium,
        status: sppaData.status,
        registered_by: sppaData.registeredBy,
        branch: sppaData.branch
      }).then(({ error }) => {
        if (error) console.warn('[Supabase Sync SPPA Error]:', error);
      });
    }

    return sppaData;
  }

  // --- Cover Notes (CEPAT) Management ---
  getCoverNotes() {
    try {
      return JSON.parse(localStorage.getItem(DB_KEYS.COVER_NOTES)) || [];
    } catch (e) {
      return INITIAL_COVER_NOTES;
    }
  }

  getCoverNote(id) {
    const list = this.getCoverNotes();
    return list.find(cn => cn.id === id);
  }

  saveCoverNote(cnData) {
    const list = this.getCoverNotes();
    if (!cnData.id) {
      const year = new Date().getFullYear();
      const count = list.length + 1;
      cnData.id = `CN-${year}-${String(count).padStart(3, '0')}`;
      cnData.issuedDate = cnData.issuedDate || new Date().toISOString().split('T')[0];
      list.unshift(cnData);
    } else {
      const index = list.findIndex(c => c.id === cnData.id);
      if (index !== -1) {
        list[index] = { ...list[index], ...cnData };
      } else {
        list.unshift(cnData);
      }
    }
    localStorage.setItem(DB_KEYS.COVER_NOTES, JSON.stringify(list));
    return cnData;
  }

  deleteCoverNote(id) {
    let list = this.getCoverNotes();
    list = list.filter(c => c.id !== id);
    localStorage.setItem(DB_KEYS.COVER_NOTES, JSON.stringify(list));
    return true;
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
    if (logs.length > 150) logs.pop();
    localStorage.setItem(DB_KEYS.AUDIT, JSON.stringify(logs));

    // Async sync to Supabase
    if (this.supabase && this.cloudStatus === 'connected') {
      this.supabase.from('audit_logs').insert({
        id: newLog.id,
        timestamp: newLog.timestamp,
        user_name: newLog.user,
        role: newLog.role,
        sub_app: newLog.subApp,
        action: newLog.action,
        details: newLog.details
      }).then(({ error }) => {
        if (error) console.warn('[Supabase Log Activity Error]:', error);
      });
    }
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

    if (this.supabase && this.cloudStatus === 'connected') {
      this.supabase.from('system_settings').upsert({
        id: 'config',
        app_name: settings.appName,
        company_name: settings.companyName,
        notification_banner: settings.notificationBanner,
        updated_at: new Date().toISOString()
      }).then(({ error }) => {
        if (error) console.warn('[Supabase Settings Error]:', error);
      });
    }
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
