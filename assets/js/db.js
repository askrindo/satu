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
    division: 'Divisi Teknologi Informasi (Technology Information Division)',
    branch: 'Divisi Teknologi Informasi (Technology Information Division)',
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
    role: 'Underwriter',
    division: 'Main Branch Office (Kantor Cabang Utama)',
    branch: 'Main Branch Office (Kantor Cabang Utama)',
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
    role: 'Relationship Manager',
    division: 'Branch Office Surabaya',
    branch: 'Branch Office Surabaya',
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
    role: 'Business Head',
    division: 'Branch Office Medan',
    branch: 'Branch Office Medan',
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
    role: 'Branch Support',
    division: 'Branch Office Bandung',
    branch: 'Branch Office Bandung',
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
    role: 'Underwriter',
    subApp: 'KABAR',
    action: 'Simulasi Premi Kebakaran',
    details: 'Melakukan kalkulasi tarif kebakaran okupasi Industri Garmen TSI Rp 12.000.000.000'
  },
  {
    id: 'LOG-1003',
    timestamp: '2026-11-12T08:45:20Z',
    user: 'Siti Rahmawati, S.E.',
    role: 'Relationship Manager',
    subApp: 'TTK',
    action: 'Simulasi Angsuran KUR',
    details: 'Simulasi KUR Mikro Rp 50.000.000 tenor 36 bulan suku bunga subsidi 6%'
  }
];

// Status Rilis & Deployment Sub-Aplikasi (Pengembangan Bertahap)
const APP_DEPLOYMENT_STATUS = {
  pelaku: {
    status: 'active', // 'active' | 'coming_soon'
    label: 'Rilis Penuh (Aktif)',
    phase: 'Tahap 1 (Live Operasional)',
    badge: 'Aktif',
    isPublic: true
  },
  kabar: {
    status: 'coming_soon',
    label: 'Segera Hadir',
    phase: 'Roadmap Pengembangan',
    badge: 'Segera Hadir',
    isPublic: false
  },
  ttk: {
    status: 'coming_soon',
    label: 'Segera Hadir',
    phase: 'Roadmap Pengembangan',
    badge: 'Segera Hadir',
    isPublic: false
  },
  bus: {
    status: 'coming_soon',
    label: 'Segera Hadir',
    phase: 'Roadmap Pengembangan',
    badge: 'Segera Hadir',
    isPublic: false
  },
  cepat: {
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
    this.pelakuCloudStatus = 'unknown'; // 'available' | 'missing_table' | 'offline'
    this.init();
  }

  normalizeLegacyRole(role) {
    const legacyMap = {
      'Senior Underwriter': 'Underwriter',
      'Account Officer KUR & UMKM': 'Relationship Manager',
      'Account Officer KUR': 'Relationship Manager',
      'Marketing & Relationship Officer': 'Business Head',
      'Marketing Officer': 'Relationship Manager',
      'Staff Operasional (Junior)': 'Branch Support',
      'Staff Operasional': 'Branch Support'
    };
    return legacyMap[role] || role;
  }

  init() {
    // 1. Inisialisasi Cache Lokal jika kosong
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify(INITIAL_USERS));
    } else {
      // Auto-migrate: Pastikan modul 'cepat' tersedia & role diperbarui ke struktur baru
      try {
        const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS)) || [];
        users.forEach(u => {
          if ((u.id === 'USR-001' || u.id === 'USR-002' || u.id === 'USR-004' || u.role === 'Super Administrator') && !u.allowedApps.includes('cepat')) {
            u.allowedApps.push('cepat');
          }
          if (u.role) {
            u.role = this.normalizeLegacyRole(u.role);
          }
          const normalizedUnit = this.normalizeLegacyUnitKerja(u.division, u.branch);
          u.division = normalizedUnit;
          u.branch = normalizedUnit;
        });
        localStorage.setItem(DB_KEYS.USERS, JSON.stringify(users));

        // Update active session if logged in
        const sess = this.getCurrentSession();
        if (sess) {
          let sessUpdated = false;
          if ((sess.id === 'USR-001' || sess.id === 'USR-002' || sess.id === 'USR-004' || sess.role === 'Super Administrator') && !sess.allowedApps.includes('cepat')) {
            sess.allowedApps.push('cepat');
            sessUpdated = true;
          }
          const normalizedSessRole = this.normalizeLegacyRole(sess.role);
          if (normalizedSessRole !== sess.role) {
            sess.role = normalizedSessRole;
            sessUpdated = true;
          }
          const normalizedSessUnit = this.normalizeLegacyUnitKerja(sess.division, sess.branch);
          if (normalizedSessUnit !== sess.branch || normalizedSessUnit !== sess.division) {
            sess.division = normalizedSessUnit;
            sess.branch = normalizedSessUnit;
            sessUpdated = true;
          }
          if (sessUpdated) this.setSession(sess);
        }
      } catch (e) {}
    }

    if (!localStorage.getItem(DB_KEYS.SPPA)) {
      localStorage.setItem(DB_KEYS.SPPA, JSON.stringify(INITIAL_SPPA));
    }
    if (!localStorage.getItem(DB_KEYS.COVER_NOTES)) {
      localStorage.setItem(DB_KEYS.COVER_NOTES, JSON.stringify(INITIAL_COVER_NOTES));
    }
    if (!localStorage.getItem(DB_KEYS.PELAKU)) {
      localStorage.setItem(DB_KEYS.PELAKU, JSON.stringify([]));
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
          role: this.normalizeLegacyRole(u.role),
          division: this.normalizeLegacyUnitKerja(u.division, u.branch),
          branch: this.normalizeLegacyUnitKerja(u.division, u.branch),
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
          role: this.normalizeLegacyRole(l.role),
          subApp: l.sub_app,
          action: l.action,
          details: l.details
        }));
        localStorage.setItem(DB_KEYS.AUDIT, JSON.stringify(mappedLogs));
      }

      // Sync PELAKU company financial analyses if cloud table exists
      await this.syncPelakuWithSupabase();

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

  getStandardUnitKerja() {
    return [
      'Divisi Transformasi Perusahaan (Corporate Transformation Division)',
      'Divisi Audit Internal (Internal Audit Division)',
      'Divisi Sekretaris Perusahaan (Corporate Secretary Division)',
      'Divisi Bisnis Program (Program Business Division)',
      'Divisi Bisnis Bank & IKNB (Bank & NBFI Business Division)',
      'Divisi Bisnis BUMN (SOE Business Division)',
      'Divisi Bisnis Komersil & Ritel (Commercial & Retail Bisnis Division)',
      'Divisi Pengelolaan Jaringan (Network Management Division)',
      'Divisi Underwriting dan Reasuransi (Underwriting & Reinsurance Division)',
      'Divisi Klaim (Claims Division)',
      'Divisi Aktuaria & Manajemen Portofolio (Actuarial & Portfolio Management Division)',
      'Divisi Riset & Pengembangan Produk (Research & Product Development Division)',
      'Divisi Teknologi Informasi (Technology Information Division)',
      'Divisi Akuntansi (Accounting Division)',
      'Divisi Keuangan & Investasi (Finance & Investment Division)',
      'Divisi Subrogasi (Subrogation Division)',
      'Divisi Strategi & Pengelolaan Anak Perusahaan (Corporate Strategy & Subsidiaries Division)',
      'Divisi Operasional & Layanan Pelanggan (Operational & Customer Care Division)',
      'Divisi Kepatuhan (Compliance Division)',
      'Divisi Sumber Daya Manusia (Human Resource Division)',
      'Divisi Manajemen Risiko (Risk Management Division)',
      'Divisi Hukum (Legal Division)',
      'Divisi Pengadaan & Layanan Umum (Procurement & General Service Division)',
      'Regional Office I',
      'Regional Office II',
      'Regional Office III',
      'Regional Office IV',
      'Regional Office V',
      'Regional Office VI',
      'Regional Office VII',
      'Main Branch Office (Kantor Cabang Utama)',
      'Branch Office Jakarta Cikini',
      'Branch Office Surabaya',
      'Branch Office Semarang',
      'Branch Office Bandung',
      'Branch Office Medan',
      'Branch Office Makassar',
      'Branch Office Denpasar',
      'Branch Office Palembang',
      'Branch Office Lampung',
      'Branch Office Pontianak',
      'Branch Office Banjarmasin',
      'Branch Office Pekanbaru',
      'Branch Office Padang',
      'Branch Office Jambi',
      'Branch Office Bengkulu',
      'Branch Office Palangkaraya',
      'Branch Office Balikpapan',
      'Branch Office Samarinda',
      'Branch Office Manado',
      'Branch Office Palu',
      'Branch Office Serang',
      'Branch Office Tegal',
      'Branch Office Cirebon',
      'Branch Office Tasikmalaya',
      'Branch Office Yogyakarta',
      'Branch Office Surakarta',
      'Branch Office Jember',
      'Branch Office Madiun',
      'Branch Office Kediri',
      'Branch Office Jayapura',
      'Branch Office Jakarta Utara',
      'Branch Office Jakarta Barat',
      'Branch Office Jakarta Timur',
      'Branch Office Jakarta Selatan',
      'Branch Office Bekasi',
      'Branch Office Tangerang',
      'Branch Office Bogor',
      'Branch Office Karawang',
      'Branch Office Sukabumi',
      'Branch Office Pangkal Pinang',
      'Branch Office Batam',
      'Branch Office Kisaran',
      'Branch Office Padang Sidempuan',
      'Branch Office Purwokerto',
      'Branch Office Magelang',
      'Branch Office Pati',
      'Branch Office Malang',
      'Branch Office Madura',
      'Branch Office Pangkalan Bun',
      'Branch Office Tarakan',
      'Branch Office Ternate',
      'Branch Office Kendari',
      'Branch Office Gorontalo',
      'Branch Office Mataram',
      'Branch Office Ambon',
      'Branch Office Mamuju',
      'Branch Office Kupang',
      'Branch Office Sorong'
    ];
  }

  normalizeLegacyUnitKerja(division, branch) {
    const units = this.getStandardUnitKerja();
    const cleanBranch = (branch || '').trim();
    const cleanDivision = (division || '').trim();

    if (cleanBranch && units.includes(cleanBranch)) return cleanBranch;

    const legacyBranchMap = {
      'Kantor Cabang Utama Jakarta Gambir': 'Main Branch Office (Kantor Cabang Utama)',
      'Kantor Cabang Khusus Jakarta': 'Main Branch Office (Kantor Cabang Utama)',
      'KCU Jakarta Gambir': 'Main Branch Office (Kantor Cabang Utama)'
    };
    if (legacyBranchMap[cleanBranch]) return legacyBranchMap[cleanBranch];

    if (cleanBranch.startsWith('Kantor Cabang ')) {
      const city = cleanBranch.slice('Kantor Cabang '.length).trim();
      const candidate = `Branch Office ${city}`;
      if (units.includes(candidate)) return candidate;
    }

    if (cleanDivision && units.includes(cleanDivision)) return cleanDivision;

    const legacyDivisionMap = {
      'Divisi Teknologi Informasi & Digitalisasi': 'Divisi Teknologi Informasi (Technology Information Division)',
      'Divisi Underwriting & Penjaminan Non-Bank': 'Divisi Underwriting dan Reasuransi (Underwriting & Reinsurance Division)',
      'Divisi Penjaminan Perbankan & Program KUR': 'Divisi Bisnis Program (Program Business Division)',
      'Divisi Pemasaran Korporasi & Broker': 'Divisi Bisnis Komersil & Ritel (Commercial & Retail Bisnis Division)',
      'Divisi Pelayanan & Operasional Cabang': 'Divisi Operasional & Layanan Pelanggan (Operational & Customer Care Division)',
      'Divisi Manajemen Risiko & Kepatuhan': 'Divisi Manajemen Risiko (Risk Management Division)'
    };
    if (legacyDivisionMap[cleanDivision]) return legacyDivisionMap[cleanDivision];

    return cleanBranch || cleanDivision || units[0];
  }

  getUserUnitKerja(user) {
    if (!user) return '';
    return this.normalizeLegacyUnitKerja(user.division, user.branch);
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
    const normalizedUnit = userData.unitKerja
      ? userData.unitKerja.trim()
      : (userData.branch || userData.division
        ? this.normalizeLegacyUnitKerja(userData.division, userData.branch)
        : undefined);
    const normalizedPayload = {
      ...userData,
      ...(normalizedUnit ? { division: normalizedUnit, branch: normalizedUnit } : {})
    };
    delete normalizedPayload.unitKerja;

    if (normalizedPayload.id) {
      // Update
      const index = users.findIndex(u => u.id === normalizedPayload.id);
      if (index !== -1) {
        users[index] = { ...users[index], ...normalizedPayload };
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
        ...normalizedPayload
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

  // --- PELAKU (Analisa Laporan Keuangan Per Perusahaan) ---
  normalizeCompanyId(companyName) {
    if (!companyName) return '';
    const clean = String(companyName)
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, ' ')
      .replace(/\bP\s+T\b/g, 'PT')
      .replace(/\bC\s+V\b/g, 'CV')
      .replace(/\bU\s+D\b/g, 'UD')
      .replace(/\bF\s+A\b/g, 'FA')
      .replace(/\bP\s+D\b/g, 'PD')
      .replace(/\bT\s+B\s+K\b/g, 'TBK')
      .replace(/\s+/g, ' ')
      .trim();
    return clean ? clean.replace(/\s+/g, '-') : '';
  }

  getPelakuAnalyses() {
    try {
      const list = JSON.parse(localStorage.getItem(DB_KEYS.PELAKU)) || [];
      return Array.isArray(list)
        ? list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
        : [];
    } catch (e) {
      return [];
    }
  }

  getPelakuAnalysis(companyNameOrId) {
    if (!companyNameOrId) return null;
    const rawId = String(companyNameOrId).trim();
    const normId = this.normalizeCompanyId(rawId);
    const list = this.getPelakuAnalyses();
    return list.find(item => item.id === rawId || (normId && item.id === normId)) || null;
  }

  searchPelakuAnalyses(query) {
    const list = this.getPelakuAnalyses();
    if (!query || !query.trim()) return list;
    const q = query.trim().toLowerCase();
    const qNorm = this.normalizeCompanyId(query).toLowerCase();
    return list.filter(item =>
      (item.companyName || '').toLowerCase().includes(q) ||
      (item.id || '').toLowerCase().includes(q) ||
      (qNorm && (item.id || '').toLowerCase().includes(qNorm)) ||
      (item.kapName || '').toLowerCase().includes(q) ||
      (item.sector || '').toLowerCase().includes(q) ||
      String(item.year1 || '').includes(q) ||
      String(item.year2 || '').includes(q)
    );
  }

  _mergeSnapshots(listA = [], listB = []) {
    const byId = new Map();
    [...listA, ...listB].forEach(s => {
      if (!s || !s.snapshotId) return;
      if (!byId.has(s.snapshotId)) byId.set(s.snapshotId, s);
    });
    return Array.from(byId.values())
      .sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0))
      .slice(0, 20);
  }

  savePelakuAnalysis(analysisData) {
    const companyName = (analysisData.companyName || '').trim();
    const companyId = this.normalizeCompanyId(companyName);
    if (!companyId) return null;

    const session = this.getCurrentSession();
    const nowIso = new Date().toISOString();
    const list = this.getPelakuAnalyses();
    const existingIdx = list.findIndex(item => item.id === companyId);
    const existing = existingIdx !== -1 ? list[existingIdx] : null;

    // Gabungkan riwayat multi-tahun (yearlyData) agar tahun-tahun sebelumnya tidak pernah tertimpa
    const prevYearly = existing?.yearlyData ? { ...existing.yearlyData } : {};
    if (existing?.year1 && existing?.data1 && !prevYearly[existing.year1]) {
      prevYearly[existing.year1] = { ...existing.data1 };
    }
    if (existing?.year2 && existing?.data2 && !prevYearly[existing.year2]) {
      prevYearly[existing.year2] = { ...existing.data2 };
    }

    const mergedYearlyData = { ...prevYearly, ...(analysisData.yearlyData || {}) };
    if (analysisData.year1 && analysisData.data1) {
      mergedYearlyData[analysisData.year1] = { ...(mergedYearlyData[analysisData.year1] || {}), ...analysisData.data1 };
    }
    if (analysisData.year2 && analysisData.data2) {
      mergedYearlyData[analysisData.year2] = { ...(mergedYearlyData[analysisData.year2] || {}), ...analysisData.data2 };
    }

    // Susun daftar tahun berurutan kronologis (contoh: ['2024', '2025', '2026'])
    let allYears = Array.from(new Set([
      ...(existing?.years || []),
      ...(analysisData.years || []),
      analysisData.year1,
      analysisData.year2,
      ...Object.keys(mergedYearlyData)
    ].filter(y => y && String(y).trim().length > 0))).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

    if (allYears.length === 0) allYears = ['2024', '2025'];

    const activeYr1 = String(analysisData.year1 || (allYears.length >= 2 ? allYears[allYears.length - 2] : allYears[0]));
    const activeYr2 = String(analysisData.year2 || allYears[allYears.length - 1]);

    const snapshot = {
      snapshotId: 'SNAP-' + nowIso.replace(/[-:T.Z]/g, '').slice(0, 14),
      savedAt: nowIso,
      savedBy: session ? session.name : (analysisData.updatedBy || 'Analis'),
      branch: session ? session.branch : (analysisData.branch || '-'),
      years: allYears,
      year1: activeYr1,
      year2: activeYr2,
      projectVal: Number(analysisData.projectVal) || 0,
      sector: analysisData.sector || 'konstruksi',
      auditStatus: analysisData.auditStatus || 'audited',
      kapName: analysisData.kapName || '-',
      opinion: analysisData.opinion || '-',
      score: Number(analysisData.score) || 0,
      grade: analysisData.grade || '-',
      racPassCount: Number(analysisData.racPassCount) || 0,
      racFailCount: Number(analysisData.racFailCount) || 0,
      yearlyData: mergedYearlyData,
      data1: mergedYearlyData[activeYr1] || { ...(analysisData.data1 || {}) },
      data2: mergedYearlyData[activeYr2] || { ...(analysisData.data2 || {}) },
      summaryMetrics: { ...(analysisData.summaryMetrics || {}) }
    };

    let snapshots = existing && Array.isArray(existing.snapshots) ? [...existing.snapshots] : [];
    const latestSnap = snapshots[0];
    const isSameContentAsLatest = latestSnap &&
      latestSnap.year1 === snapshot.year1 &&
      latestSnap.year2 === snapshot.year2 &&
      Number(latestSnap.projectVal) === snapshot.projectVal &&
      JSON.stringify(latestSnap.yearlyData || {}) === JSON.stringify(snapshot.yearlyData || {}) &&
      JSON.stringify(latestSnap.data1) === JSON.stringify(snapshot.data1) &&
      JSON.stringify(latestSnap.data2) === JSON.stringify(snapshot.data2);

    if (isSameContentAsLatest) {
      snapshots[0] = snapshot;
    } else {
      snapshots.unshift(snapshot);
      if (snapshots.length > 20) snapshots = snapshots.slice(0, 20);
    }

    const savedRecord = {
      id: companyId,
      companyName,
      sector: snapshot.sector,
      auditStatus: snapshot.auditStatus,
      kapName: snapshot.kapName,
      opinion: snapshot.opinion,
      years: allYears,
      year1: snapshot.year1,
      year2: snapshot.year2,
      projectVal: snapshot.projectVal,
      score: snapshot.score,
      grade: snapshot.grade,
      racPassCount: snapshot.racPassCount,
      racFailCount: snapshot.racFailCount,
      yearlyData: mergedYearlyData,
      data1: snapshot.data1,
      data2: snapshot.data2,
      summaryMetrics: snapshot.summaryMetrics,
      snapshots,
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso,
      createdBy: existing?.createdBy || snapshot.savedBy,
      updatedBy: snapshot.savedBy,
      branch: snapshot.branch
    };

    if (existingIdx !== -1) {
      list.splice(existingIdx, 1);
    }
    list.unshift(savedRecord);
    localStorage.setItem(DB_KEYS.PELAKU, JSON.stringify(list));

    this.syncPelakuRecordToCloud(savedRecord);
    return { savedRecord, isNewCompany: !existing, snapshotCount: snapshots.length };
  }

  deletePelakuAnalysis(companyNameOrId) {
    const normId = this.normalizeCompanyId(companyNameOrId) || companyNameOrId;
    let list = this.getPelakuAnalyses();
    list = list.filter(item => item.id !== companyNameOrId && item.id !== normId);
    localStorage.setItem(DB_KEYS.PELAKU, JSON.stringify(list));

    if (this.supabase && this.cloudStatus === 'connected' && this.pelakuCloudStatus !== 'missing_table') {
      this.supabase.from('pelaku_analyses').delete().eq('id', normId).then(({ error }) => {
        if (error) console.warn('[Supabase Delete PELAKU Error]:', error.message);
      });
    }
    return true;
  }

  importPelakuAnalyses(recordsArray) {
    if (!Array.isArray(recordsArray)) return 0;
    const current = this.getPelakuAnalyses();
    const map = new Map(current.map(r => [r.id, r]));
    let importedCount = 0;

    recordsArray.forEach(raw => {
      if (!raw || !raw.companyName) return;
      const cid = this.normalizeCompanyId(raw.companyName);
      if (!cid) return;
      const normalized = {
        ...raw,
        id: cid,
        snapshots: Array.isArray(raw.snapshots) ? raw.snapshots : []
      };
      const existing = map.get(cid);
      if (!existing) {
        map.set(cid, normalized);
        importedCount++;
      } else {
        const mergedSnaps = this._mergeSnapshots(existing.snapshots, normalized.snapshots);
        const keepNew = new Date(normalized.updatedAt || 0) > new Date(existing.updatedAt || 0);
        const merged = { ...(keepNew ? normalized : existing), snapshots: mergedSnaps };
        map.set(cid, merged);
        importedCount++;
      }
      this.syncPelakuRecordToCloud(map.get(cid));
    });

    const result = Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    );
    localStorage.setItem(DB_KEYS.PELAKU, JSON.stringify(result));
    return importedCount;
  }

  syncPelakuRecordToCloud(rec) {
    if (!this.supabase || this.cloudStatus !== 'connected' || this.pelakuCloudStatus === 'missing_table' || !rec) {
      return;
    }
    this.supabase.from('pelaku_analyses').upsert({
      id: rec.id,
      company_name: rec.companyName,
      sector: rec.sector,
      audit_status: rec.auditStatus,
      kap_name: rec.kapName,
      opinion: rec.opinion,
      year1: String(rec.year1 || ''),
      year2: String(rec.year2 || ''),
      project_val: Number(rec.projectVal) || 0,
      score: Number(rec.score) || 0,
      grade: rec.grade,
      rac_pass_count: Number(rec.racPassCount) || 0,
      rac_fail_count: Number(rec.racFailCount) || 0,
      payload: {
        years: rec.years || [rec.year1, rec.year2].filter(Boolean),
        yearlyData: rec.yearlyData || {},
        data1: rec.data1,
        data2: rec.data2,
        summaryMetrics: rec.summaryMetrics,
        snapshots: rec.snapshots
      },
      created_by: rec.createdBy,
      updated_by: rec.updatedBy,
      branch: rec.branch,
      created_at: rec.createdAt,
      updated_at: rec.updatedAt
    }).then(({ error }) => {
      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01' || (error.message || '').includes('does not exist')) {
          this.pelakuCloudStatus = 'missing_table';
        } else {
          console.warn('[Supabase Sync PELAKU Error]:', error.message);
        }
      } else {
        this.pelakuCloudStatus = 'available';
      }
    });
  }

  async syncPelakuWithSupabase() {
    if (!this.supabase || this.cloudStatus !== 'connected') return;
    try {
      const { data, error } = await this.supabase
        .from('pelaku_analyses')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01' || (error.message || '').includes('does not exist')) {
          this.pelakuCloudStatus = 'missing_table';
          console.info('[Supabase] Tabel pelaku_analyses belum dibuat; menggunakan Local Storage Hybrid.');
        }
        return;
      }

      this.pelakuCloudStatus = 'available';
      const localList = this.getPelakuAnalyses();
      const mergedMap = new Map(localList.map(r => [r.id, r]));

      if (Array.isArray(data)) {
        data.forEach(row => {
          const payload = row.payload || {};
          const cloudRec = {
            id: row.id,
            companyName: row.company_name,
            sector: row.sector,
            auditStatus: row.audit_status,
            kapName: row.kap_name,
            opinion: row.opinion,
            year1: row.year1,
            year2: row.year2,
            projectVal: Number(row.project_val) || 0,
            score: Number(row.score) || 0,
            grade: row.grade,
            racPassCount: Number(row.rac_pass_count) || 0,
            racFailCount: Number(row.rac_fail_count) || 0,
            years: payload.years || [row.year1, row.year2].filter(Boolean),
            yearlyData: payload.yearlyData || {},
            data1: payload.data1 || {},
            data2: payload.data2 || {},
            summaryMetrics: payload.summaryMetrics || {},
            snapshots: Array.isArray(payload.snapshots) ? payload.snapshots : [],
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            createdBy: row.created_by,
            updatedBy: row.updated_by,
            branch: row.branch
          };

          const existing = mergedMap.get(cloudRec.id);
          if (!existing) {
            mergedMap.set(cloudRec.id, cloudRec);
          } else {
            const mergedSnaps = this._mergeSnapshots(existing.snapshots, cloudRec.snapshots);
            const cloudIsNewer = new Date(cloudRec.updatedAt || 0) >= new Date(existing.updatedAt || 0);
            mergedMap.set(cloudRec.id, { ...(cloudIsNewer ? cloudRec : existing), snapshots: mergedSnaps });
          }
        });
      }

      // Push local-only or newer local records to Supabase
      const cloudIds = new Set((data || []).map(r => r.id));
      localList.forEach(localRec => {
        if (!cloudIds.has(localRec.id)) {
          this.syncPelakuRecordToCloud(localRec);
        }
      });

      const mergedList = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
      );
      localStorage.setItem(DB_KEYS.PELAKU, JSON.stringify(mergedList));
    } catch (e) {
      console.warn('[Supabase PELAKU Sync Error]:', e);
    }
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
