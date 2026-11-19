/**
 * Askrindo SATU - CEKLIST Module
 * Cek Entitas dan Kelola List Informasi Status Terblokir
 * Pengelolaan Principal Blacklist (beserta daftar Direksi/Komisaris) & Pindai AI OCR Akta Terbaru untuk deteksi pengurus daftar hitam.
 */

window.CeklistModule = {
  STORAGE_KEY: 'askrindo_satu_ceklist_blacklist_v1',
  SCAN_HISTORY_KEY: 'askrindo_satu_ceklist_scans_v1',

  JABATAN_OPTIONS: [
    'Direktur Utama',
    'Direktur',
    'Wakil Direktur',
    'Komisaris Utama',
    'Komisaris',
    'Persero Aktif (CV)',
    'Persero Komanditer (CV)',
    'Pemegang Saham',
    'Kuasa Direksi',
    'Pengurus Lainnya'
  ],

  ALASAN_OPTIONS: [
    'Wanprestasi / Gagal Proyek',
    'Klaim Belum Subrogasi',
    'Pemalsuan Dokumen / Fraud',
    'Daftar Hitam LKPP / Pemerintah',
    'Kredit Macet / Bermasalah',
    'Sengketa Hukum / Pailit',
    'Pelanggaran Administrasi Berat',
    'Lainnya'
  ],

  entries: [],
  scanHistory: [],
  cloudStatus: 'unknown', // 'available' | 'missing_table' | 'offline'
  activeTab: 'ocr', // 'ocr' | 'blacklist' | 'history'
  searchQuery: '',
  statusFilter: 'all', // 'all' | 'Terblokir Aktif' | 'Dalam Pengawasan' | 'Dipulihkan'
  selectedFiles: [],
  isScanning: false,
  lastScanResult: null,
  hasInitialized: false,

  init() {
    this.loadLocal();
    this.updateView();
    if (!this.hasInitialized) {
      this.hasInitialized = true;
      this.syncWithSupabase();
    }
  },

  loadLocal() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      this.entries = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(this.entries)) this.entries = [];
    } catch (_) {
      this.entries = [];
    }

    try {
      const rawScans = localStorage.getItem(this.SCAN_HISTORY_KEY);
      this.scanHistory = rawScans ? JSON.parse(rawScans) : [];
      if (!Array.isArray(this.scanHistory)) this.scanHistory = [];
    } catch (_) {
      this.scanHistory = [];
    }
  },

  saveLocal() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries));
      localStorage.setItem(this.SCAN_HISTORY_KEY, JSON.stringify(this.scanHistory.slice(0, 30)));
    } catch (e) {
      console.warn('[CEKLIST] Gagal menyimpan cache lokal:', e);
    }
  },

  getSupabaseClient() {
    return window.askrindoDB && window.askrindoDB.supabase ? window.askrindoDB.supabase : null;
  },

  async syncWithSupabase() {
    const sb = this.getSupabaseClient();
    if (!sb) return;
    try {
      const { data, error } = await sb
        .from('ceklist_blacklist')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        if (String(error.message || '').toLowerCase().includes('does not exist') || error.code === '42P01' || error.code === 'PGRST205') {
          this.cloudStatus = 'missing_table';
          console.info('[CEKLIST] Tabel ceklist_blacklist belum dibuat di Supabase; menggunakan cache lokal.');
        } else {
          console.warn('[CEKLIST] Gagal sinkronisasi Supabase:', error.message);
        }
        return;
      }

      this.cloudStatus = 'available';
      const cloudEntries = (data || []).map(row => ({
        id: row.id,
        companyName: row.company_name || '',
        npwp: row.npwp || '',
        address: row.address || '',
        reason: row.reason || '',
        status: row.status || 'Terblokir Aktif',
        blacklistDate: row.blacklist_date || '',
        notes: row.notes || '',
        officers: Array.isArray(row.officers) ? row.officers : [],
        createdBy: row.created_by || '',
        updatedAt: row.updated_at || new Date().toISOString()
      }));

      const cloudMap = new Map(cloudEntries.map(e => [e.id, e]));
      const mergedMap = new Map();
      cloudEntries.forEach(e => mergedMap.set(e.id, e));

      this.entries.forEach(localE => {
        if (!localE || !localE.id) return;
        const existing = mergedMap.get(localE.id);
        if (!existing || new Date(localE.updatedAt || 0) > new Date(existing.updatedAt || 0)) {
          mergedMap.set(localE.id, localE);
          if (!cloudMap.has(localE.id)) {
            this.upsertEntryToCloud(localE);
          }
        }
      });

      this.entries = Array.from(mergedMap.values())
        .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
      this.saveLocal();
      this.updateView();
    } catch (e) {
      console.warn('[CEKLIST] Cloud sync error:', e);
    }
  },

  async upsertEntryToCloud(entry) {
    const sb = this.getSupabaseClient();
    if (!sb || !entry || this.cloudStatus === 'missing_table') return;
    try {
      const { error } = await sb.from('ceklist_blacklist').upsert({
        id: entry.id,
        company_name: entry.companyName,
        npwp: entry.npwp || null,
        address: entry.address || null,
        reason: entry.reason || null,
        status: entry.status || 'Terblokir Aktif',
        blacklist_date: entry.blacklistDate || null,
        notes: entry.notes || null,
        officers: entry.officers || [],
        created_by: entry.createdBy || null,
        updated_at: entry.updatedAt || new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) {
        if (String(error.message || '').toLowerCase().includes('does not exist') || error.code === '42P01' || error.code === 'PGRST205') {
          this.cloudStatus = 'missing_table';
        } else {
          console.warn('[CEKLIST] Gagal upsert Supabase:', error.message);
        }
      } else {
        this.cloudStatus = 'available';
      }
    } catch (e) {
      console.warn('[CEKLIST] Upsert error:', e);
    }
  },

  async deleteEntryFromCloud(id) {
    const sb = this.getSupabaseClient();
    if (!sb || !id || this.cloudStatus === 'missing_table') return;
    try {
      await sb.from('ceklist_blacklist').delete().eq('id', id);
    } catch (e) {
      console.warn('[CEKLIST] Delete cloud error:', e);
    }
  },

  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // Normalisasi nama pengurus (hapus gelar depan/belakang, tanda baca, spasi ganda)
  normalizePersonName(name) {
    let s = String(name || '').toLowerCase();
    // Hapus gelar umum Indonesia
    const titles = [
      'ir', 'drs', 'dra', 'dr', 'prof', 'hj', 'h', 'kh', 'tuan', 'nyonya', 'nona', 'bapak', 'ibu', 'sdr', 'sdri',
      'se', 'sh', 'st', 'si', 'sp', 'ss', 'skm', 'skom', 'sip', 'sos', 'spd', 'spsi', 'sFarm', 'sak',
      'mm', 'mh', 'mt', 'msi', 'mba', 'msc', 'mkn', 'mkom', 'mak', 'mpd', 'phd', 'amd', 'amdk', 'aaij', 'aaik', 'ak', 'ca', 'cpa', 'bkp'
    ];
    s = s.replace(/[.,()\/\-_]/g, ' ');
    const tokens = s.split(/\s+/).filter(t => t.length > 0 && !titles.includes(t));
    return tokens.join(' ').trim();
  },

  normalizeCompanyName(name) {
    return String(name || '')
      .toLowerCase()
      .replace(/\b(pt|cv|ud|fa|firma|koperasi|yayasan|persero|tbk)\b\.?/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  },

  normalizeNik(nik) {
    return String(nik || '').replace(/[^0-9]/g, '');
  },

  // Pencocokan cerdas nama pengurus (Exact NIK, Exact normalized name, atau token overlap >= 80%)
  matchPerson(pA, pB) {
    const nikA = this.normalizeNik(pA.nik);
    const nikB = this.normalizeNik(pB.nik);
    if (nikA.length >= 12 && nikB.length >= 12 && nikA === nikB) {
      return { matched: true, reason: 'Cocok Persis (NIK)', score: 100 };
    }

    const normA = this.normalizePersonName(pA.name);
    const normB = this.normalizePersonName(pB.name);
    if (!normA || !normB || normA.length < 3 || normB.length < 3) {
      return { matched: false, score: 0 };
    }

    if (normA === normB) {
      return { matched: true, reason: 'Cocok Persis (Nama)', score: 98 };
    }

    const tokA = normA.split(' ').filter(t => t.length >= 2);
    const tokB = normB.split(' ').filter(t => t.length >= 2);
    if (tokA.length >= 2 && tokB.length >= 2) {
      const setB = new Set(tokB);
      const common = tokA.filter(t => setB.has(t));
      const minLen = Math.min(tokA.length, tokB.length);
      const ratio = common.length / Math.max(tokA.length, tokB.length);
      if (common.length >= 2 && (common.length === minLen || ratio >= 0.75)) {
        return { matched: true, reason: 'Kemiripan Nama Tinggi', score: Math.round(ratio * 95) };
      }
    }

    return { matched: false, score: 0 };
  },

  // Cross-check hasil ekstraksi akta (nama perusahaan + daftar pengurus) terhadap seluruh database Blacklist
  crossCheckExtraction(extracted) {
    const activeBlacklist = this.entries.filter(e => e.status !== 'Dipulihkan');
    const officerMatches = [];
    const companyMatches = [];

    const normExtCompany = this.normalizeCompanyName(extracted.companyName);
    if (normExtCompany && normExtCompany.length >= 3) {
      activeBlacklist.forEach(bl => {
        const normBlCompany = this.normalizeCompanyName(bl.companyName);
        if (normBlCompany && (normBlCompany === normExtCompany || normBlCompany.includes(normExtCompany) || normExtCompany.includes(normBlCompany))) {
          companyMatches.push({
            blacklistEntry: bl,
            matchType: normBlCompany === normExtCompany ? 'Nama Entitas Sama Persis' : 'Nama Entitas Sangat Mirip'
          });
        }
      });
    }

    const extractedOfficers = Array.isArray(extracted.officers) ? extracted.officers : [];
    extractedOfficers.forEach(extOff => {
      activeBlacklist.forEach(bl => {
        const blOfficers = Array.isArray(bl.officers) ? bl.officers : [];
        blOfficers.forEach(blOff => {
          const m = this.matchPerson(extOff, blOff);
          if (m.matched) {
            officerMatches.push({
              extractedOfficer: extOff,
              blacklistOfficer: blOff,
              blacklistEntry: bl,
              matchReason: m.reason,
              score: m.score
            });
          }
        });
      });
    });

    return {
      isFlagged: officerMatches.length > 0 || companyMatches.length > 0,
      companyMatches,
      officerMatches
    };
  },

  getActiveGeminiApiKey() {
    if (window.LaporModule && typeof window.LaporModule.getActiveGeminiApiKey === 'function') {
      return window.LaporModule.getActiveGeminiApiKey();
    }
    return (localStorage.getItem('gemini_api_key') || '').trim();
  },

  setTab(tab) {
    this.activeTab = tab;
    this.updateView();
  },

  setSearch(val) {
    this.searchQuery = val;
    this.updateView(true);
  },

  setStatusFilter(val) {
    this.statusFilter = val;
    this.updateView();
  },

  getFilteredEntries() {
    const q = this.searchQuery.trim().toLowerCase();
    return this.entries.filter(e => {
      if (this.statusFilter !== 'all' && e.status !== this.statusFilter) return false;
      if (!q) return true;
      const inComp = (e.companyName || '').toLowerCase().includes(q);
      const inNpwp = (e.npwp || '').toLowerCase().includes(q);
      const inReason = (e.reason || '').toLowerCase().includes(q);
      const inOfficers = (e.officers || []).some(o =>
        (o.name || '').toLowerCase().includes(q) ||
        (o.role || '').toLowerCase().includes(q) ||
        (o.nik || '').toLowerCase().includes(q)
      );
      return inComp || inNpwp || inReason || inOfficers;
    });
  },

  getStats() {
    const totalCompanies = this.entries.length;
    const activeBlocked = this.entries.filter(e => e.status === 'Terblokir Aktif').length;
    const totalOfficers = this.entries.reduce((acc, e) => acc + (Array.isArray(e.officers) ? e.officers.length : 0), 0);
    const totalScans = this.scanHistory.length;
    const flaggedScans = this.scanHistory.filter(s => s.isFlagged).length;
    return { totalCompanies, activeBlocked, totalOfficers, totalScans, flaggedScans };
  },

  // --- CRUD PRINCIPAL BLACKLIST MODAL ---
  openBlacklistModal(editId = null) {
    const existingEntry = editId ? this.entries.find(e => e.id === editId) : null;
    const isEdit = !!existingEntry;
    const officers = isEdit && Array.isArray(existingEntry.officers) && existingEntry.officers.length
      ? existingEntry.officers
      : [{ name: '', role: '', nik: '' }];

    const old = document.getElementById('ceklist-entry-modal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'ceklist-entry-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        <div class="bg-gradient-to-r from-[#002B49] via-rose-900 to-rose-700 text-white p-5 flex items-start justify-between gap-4 shrink-0">
          <div>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 border border-white/20 uppercase tracking-wider">
              ${isEdit ? 'Edit Entitas Terblokir' : 'Tambah Principal Daftar Hitam'}
            </span>
            <h3 class="text-lg font-black mt-1">${isEdit ? this.escapeHtml(existingEntry.companyName) : 'Input Perusahaan Blacklist & Pengurus'}</h3>
            <p class="text-[11px] text-rose-100 mt-0.5">Masukkan nama perusahaan beserta seluruh Direktur, Wakil Direktur, Komisaris, dan pemegang sahamnya.</p>
          </div>
          <button type="button" onclick="document.getElementById('ceklist-entry-modal').remove()" class="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <form onsubmit="window.CeklistModule.submitBlacklistForm(event, '${isEdit ? existingEntry.id : ''}')" class="p-5 space-y-4 text-xs overflow-y-auto">
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div class="sm:col-span-8">
              <label class="block font-bold text-slate-700 mb-1">Nama Perusahaan / Principal <span class="text-rose-500">*</span></label>
              <input id="bl-company-name" type="text" required value="${this.escapeHtml(existingEntry?.companyName || '')}" placeholder="Contoh: PT. KARYA MANDIRI NUSANTARA" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-semibold text-slate-800" />
            </div>

            <div class="sm:col-span-4">
              <label class="block font-bold text-slate-700 mb-1">Status Blokir</label>
              <select id="bl-status" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-rose-500 font-semibold text-slate-800">
                <option value="">-- Pilih Status --</option>
                ${['Terblokir Aktif', 'Dalam Pengawasan', 'Dipulihkan'].map(st => `<option value="${st}" ${(existingEntry?.status || '') === st ? 'selected' : ''}>${st}</option>`).join('')}
              </select>
            </div>

            <div class="sm:col-span-6">
              <label class="block font-bold text-slate-700 mb-1">Alasan / Kategori Daftar Hitam</label>
              <select id="bl-reason" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-rose-500 font-semibold text-slate-800">
                <option value="">-- Pilih Alasan --</option>
                ${this.ALASAN_OPTIONS.map(al => `<option value="${this.escapeHtml(al)}" ${existingEntry?.reason === al ? 'selected' : ''}>${this.escapeHtml(al)}</option>`).join('')}
              </select>
            </div>

            <div class="sm:col-span-3">
              <label class="block font-bold text-slate-700 mb-1">NPWP / NIB (opsional)</label>
              <input id="bl-npwp" type="text" value="${this.escapeHtml(existingEntry?.npwp || '')}" placeholder="01.234.567.8-..." class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-semibold text-slate-800" />
            </div>

            <div class="sm:col-span-3">
              <label class="block font-bold text-slate-700 mb-1">Tanggal Blacklist</label>
              <input id="bl-date" type="date" value="${this.escapeHtml(existingEntry?.blacklistDate || '')}" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-semibold text-slate-800" />
            </div>

            <div class="sm:col-span-12">
              <label class="block font-bold text-slate-700 mb-1">Catatan / Keterangan Tambahan (opsional)</label>
              <input id="bl-notes" type="text" value="${this.escapeHtml(existingEntry?.notes || '')}" placeholder="Contoh: Klaim Surety Bond proyek jalan tahun 2024 belum subrogasi..." class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-rose-500 font-medium text-slate-800" />
            </div>
          </div>

          <!-- Dynamic Officers List -->
          <div class="pt-3 border-t border-slate-200 space-y-2.5">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-extrabold text-slate-800 flex items-center gap-1.5">
                  <i data-lucide="users" class="w-4 h-4 text-rose-600"></i>
                  <span>Daftar Pengurus (Direktur, Wakil, Komisaris, dsb.)</span>
                </h4>
                <p class="text-[11px] text-slate-400">Nama pengurus di bawah ini akan otomatis dicocokkan saat pindai AI OCR Akta baru.</p>
              </div>
              <button type="button" onclick="window.CeklistModule.addOfficerRow()" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition">
                <i data-lucide="user-plus" class="w-3.5 h-3.5"></i>
                <span>+ Tambah Pengurus</span>
              </button>
            </div>

            <div id="bl-officers-container" class="space-y-2">
              ${officers.map((o, idx) => this.renderOfficerInputRow(o, idx)).join('')}
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onclick="document.getElementById('ceklist-entry-modal').remove()" class="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition">
              Batal
            </button>
            <button type="submit" class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-md transition">
              <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
              <span>${isEdit ? 'Simpan Perubahan' : 'Simpan ke Daftar Hitam'}</span>
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => document.getElementById('bl-company-name')?.focus(), 50);
  },

  renderOfficerInputRow(officer = {}, idx = 0) {
    return `
      <div class="bl-officer-row grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 items-center">
        <div class="sm:col-span-5">
          <input type="text" data-field="name" required value="${this.escapeHtml(officer.name || '')}" placeholder="Nama Lengkap Pengurus *" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-rose-500 font-semibold text-slate-800" />
        </div>
        <div class="sm:col-span-3">
          <select data-field="role" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-rose-500 font-semibold text-slate-700">
            <option value="">-- Pilih Jabatan --</option>
            ${this.JABATAN_OPTIONS.map(j => `<option value="${this.escapeHtml(j)}" ${(officer.role || '') === j ? 'selected' : ''}>${this.escapeHtml(j)}</option>`).join('')}
          </select>
        </div>
        <div class="sm:col-span-3">
          <input type="text" data-field="nik" value="${this.escapeHtml(officer.nik || '')}" placeholder="NIK / KTP (opsional)" class="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-rose-500 font-mono text-slate-700" />
        </div>
        <div class="sm:col-span-1 flex justify-end">
          <button type="button" onclick="this.closest('.bl-officer-row').remove()" title="Hapus baris" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      </div>
    `;
  },

  addOfficerRow() {
    const container = document.getElementById('bl-officers-container');
    if (!container) return;
    const div = document.createElement('div');
    div.innerHTML = this.renderOfficerInputRow({ name: '', role: '', nik: '' });
    container.appendChild(div.firstElementChild);
    if (window.lucide) window.lucide.createIcons();
  },

  submitBlacklistForm(e, existingId = '') {
    if (e) e.preventDefault();
    const companyName = (document.getElementById('bl-company-name')?.value || '').trim();
    if (!companyName) return;

    const status = document.getElementById('bl-status')?.value || 'Terblokir Aktif';
    const reason = document.getElementById('bl-reason')?.value || '';
    const npwp = (document.getElementById('bl-npwp')?.value || '').trim();
    const blacklistDate = document.getElementById('bl-date')?.value || '';
    const notes = (document.getElementById('bl-notes')?.value || '').trim();

    const officerRows = document.querySelectorAll('#bl-officers-container .bl-officer-row');
    const officers = [];
    officerRows.forEach(row => {
      const name = (row.querySelector('[data-field="name"]')?.value || '').trim();
      const role = row.querySelector('[data-field="role"]')?.value || 'Pengurus';
      const nik = (row.querySelector('[data-field="nik"]')?.value || '').trim();
      if (name) officers.push({ name, role, nik });
    });

    if (!officers.length) {
      if (window.askrindoApp) window.askrindoApp.showToast('Minimal masukkan 1 nama pengurus (Direktur/Komisaris).', 'warning');
      return;
    }

    const curUser = window.authService?.getCurrentUser?.();
    const entry = {
      id: existingId || `BL-${Date.now()}`,
      companyName,
      npwp,
      reason,
      status,
      blacklistDate,
      notes,
      officers,
      createdBy: curUser ? `${curUser.name} (${curUser.nip})` : 'Petugas',
      updatedAt: new Date().toISOString()
    };

    const idx = this.entries.findIndex(x => x.id === entry.id);
    if (idx !== -1) {
      this.entries[idx] = entry;
    } else {
      this.entries.unshift(entry);
    }

    this.saveLocal();
    this.upsertEntryToCloud(entry);

    if (window.askrindoDB?.logActivity) {
      window.askrindoDB.logActivity('CEKLIST', existingId ? 'Edit Blacklist' : 'Tambah Blacklist', `${companyName} (${officers.length} pengurus, status: ${status})`);
    }

    document.getElementById('ceklist-entry-modal')?.remove();
    this.activeTab = 'blacklist';
    this.updateView();
    if (window.askrindoApp) {
      window.askrindoApp.showToast(`Entitas "${companyName}" berhasil disimpan ke Daftar Hitam (${officers.length} pengurus).`, 'success');
    }
  },

  deleteEntry(id) {
    const target = this.entries.find(e => e.id === id);
    if (!target) return;
    if (!confirm(`Hapus "${target.companyName}" dari daftar Principal Blacklist?`)) return;

    this.entries = this.entries.filter(e => e.id !== id);
    this.saveLocal();
    this.deleteEntryFromCloud(id);

    if (window.askrindoDB?.logActivity) {
      window.askrindoDB.logActivity('CEKLIST', 'Hapus Blacklist', `Menghapus ${target.companyName} dari daftar hitam`);
    }

    this.updateView();
    if (window.askrindoApp) {
      window.askrindoApp.showToast(`"${target.companyName}" dihapus dari Daftar Hitam.`, 'success');
    }
  },

  // --- AI OCR AKTA UPLOAD & DETECTION ---
  handleFileSelect(fileList) {
    const files = Array.from(fileList || []).filter(f =>
      f.type === 'application/pdf' || f.type.startsWith('image/')
    );
    if (!files.length) {
      if (window.askrindoApp) window.askrindoApp.showToast('Pilih berkas PDF atau gambar (JPG/PNG) Akta Perusahaan.', 'warning');
      return;
    }
    this.selectedFiles = files;
    this.updateView();
  },

  clearSelectedFiles() {
    this.selectedFiles = [];
    const inp = document.getElementById('ceklist-akta-file');
    if (inp) inp.value = '';
    this.updateView();
  },

  fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = String(reader.result || '');
        const base64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async runAktaOcrScan() {
    if (this.isScanning) return;
    if (!this.selectedFiles.length) {
      if (window.askrindoApp) window.askrindoApp.showToast('Unggah berkas Akta Perusahaan terlebih dahulu.', 'warning');
      return;
    }

    const apiKey = this.getActiveGeminiApiKey();
    if (!apiKey) {
      if (window.askrindoApp) window.askrindoApp.showToast('Kunci Gemini API tidak ditemukan.', 'error');
      return;
    }

    this.isScanning = true;
    this.updateView();

    try {
      const parts = [];
      for (const file of this.selectedFiles) {
        const b64 = await this.fileToBase64(file);
        parts.push({
          inline_data: {
            mime_type: file.type || 'application/pdf',
            data: b64
          }
        });
      }

      const promptText = `Anda adalah sistem OCR Akta Perusahaan Indonesia yang sangat presisi untuk keperluan Compliance & Anti-Fraud Askrindo.
Bacalah dokumen Akta Pendirian / Akta Perubahan / SK Kemenkumham yang dilampirkan.
Ekstrak informasi berikut dalam format JSON murni:
{
  "companyName": "Nama lengkap perusahaan sesuai akta (mis. PT. ... atau CV. ...)",
  "aktaNumber": "Nomor dan tanggal akta jika tertulis, atau kosong",
  "notaryName": "Nama notaris jika tertulis, atau kosong",
  "officers": [
    {
      "name": "Nama lengkap pengurus/direksi/komisaris/pemegang saham sesuai akta (tanpa kata Tuan/Nyonya)",
      "role": "Jabatan tepat sesuai akta (mis. Direktur Utama, Direktur, Wakil Direktur, Komisaris Utama, Komisaris, Persero Aktif, Persero Komanditer, Pemegang Saham)",
      "nik": "Nomor NIK / KTP jika tertulis di akta, atau string kosong"
    }
  ]
}
ATURAN:
- Ekstrak SEMUA pengurus (Direksi, Wakil Direktur, Komisaris, Persero Aktif/Pasif, dan Pemegang Saham) yang tercantum dalam susunan pengurus terbaru di akta.
- JANGAN mengarang nama yang tidak tertulis di dokumen.
- Kembalikan HANYA JSON valid tanpa markdown fence.`;

      parts.push({ text: promptText });

      const candidateModels = [
        'gemini-3-flash-preview',
        'gemini-flash-lite-latest',
        'gemini-2.5-flash',
        'gemini-2.0-flash'
      ];

      let parsedJson = null;
      let lastErr = '';

      for (const m of candidateModels) {
        const controller = new AbortController();
        const tid = setTimeout(() => controller.abort(), 50000);
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ role: 'user', parts }],
              generationConfig: {
                temperature: 0,
                topP: 0.8,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json'
              }
            })
          });
          clearTimeout(tid);
          if (res.ok) {
            const json = await res.json();
            const rawText = json?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim() || '';
            const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
            parsedJson = JSON.parse(cleaned);
            break;
          } else {
            lastErr = `HTTP ${res.status}`;
          }
        } catch (err) {
          clearTimeout(tid);
          lastErr = err.message || String(err);
        }
      }

      if (!parsedJson) {
        throw new Error(`Gagal memindai akta dengan AI OCR (${lastErr || 'tidak ada respons'}).`);
      }

      const extracted = {
        companyName: String(parsedJson.companyName || '').trim() || 'Perusahaan Tidak Teridentifikasi',
        aktaNumber: String(parsedJson.aktaNumber || '').trim(),
        notaryName: String(parsedJson.notaryName || '').trim(),
        officers: Array.isArray(parsedJson.officers)
          ? parsedJson.officers.map(o => ({
              name: String(o?.name || '').trim(),
              role: String(o?.role || 'Pengurus').trim(),
              nik: String(o?.nik || '').trim()
            })).filter(o => o.name)
          : []
      };

      const check = this.crossCheckExtraction(extracted);
      const scanRecord = {
        id: `SCAN-${Date.now()}`,
        timestamp: new Date().toISOString(),
        fileNames: this.selectedFiles.map(f => f.name),
        extracted,
        isFlagged: check.isFlagged,
        companyMatches: check.companyMatches,
        officerMatches: check.officerMatches
      };

      this.lastScanResult = scanRecord;
      this.scanHistory.unshift(scanRecord);
      this.saveLocal();

      if (window.askrindoDB?.logActivity) {
        window.askrindoDB.logActivity(
          'CEKLIST',
          check.isFlagged ? 'Deteksi Blacklist (OCR Akta)' : 'Pindai Akta Bersih',
          `${extracted.companyName}: ${check.isFlagged ? `TERDETEKSI ${check.officerMatches.length} pengurus & ${check.companyMatches.length} entitas daftar hitam` : `Bersih (${extracted.officers.length} pengurus diperiksa)`}`
        );
      }

      this.isScanning = false;
      this.updateView();

      // LANGSUNG TAMPILKAN POP-UP HASIL DETEKSI!
      this.showDetectionPopup(scanRecord);
    } catch (err) {
      console.warn('[CEKLIST] OCR Scan Error:', err);
      this.isScanning = false;
      this.updateView();
      if (window.askrindoApp) {
        window.askrindoApp.showToast(`Gagal memindai akta: ${err.message}`, 'error');
      }
    }
  },

  // --- POP-UP PERINGATAN DETEKSI BLACKLIST / HASIL BERSIH ---
  showDetectionPopup(scan) {
    const old = document.getElementById('ceklist-detection-popup');
    if (old) old.remove();

    const isFlagged = !!scan.isFlagged;
    const ext = scan.extracted || {};
    const offMatches = Array.isArray(scan.officerMatches) ? scan.officerMatches : [];
    const compMatches = Array.isArray(scan.companyMatches) ? scan.companyMatches : [];

    const modal = document.createElement('div');
    modal.id = 'ceklist-detection-popup';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-sm p-4 animate-fadeIn';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 ${isFlagged ? 'border-rose-500' : 'border-emerald-500'} overflow-hidden max-h-[90vh] flex flex-col">
        <!-- Alert Header -->
        <div class="${isFlagged ? 'bg-gradient-to-r from-rose-700 via-red-600 to-rose-600' : 'bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-600'} text-white p-6 flex items-start justify-between gap-4 shrink-0">
          <div class="flex items-start gap-3.5">
            <div class="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0 ${isFlagged ? 'animate-pulse' : ''}">
              <i data-lucide="${isFlagged ? 'shield-alert' : 'shield-check'}" class="w-7 h-7 text-white"></i>
            </div>
            <div>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/20 border border-white/25">
                ${isFlagged ? 'PERINGATAN DAFTAR HITAM (BLACKLIST ALERT)' : 'HASIL PEMERIKSAAN BERSIH (CLEAR)'}
              </span>
              <h3 class="text-lg sm:text-xl font-black mt-1 leading-snug">
                ${isFlagged
                  ? 'Terdeteksi Pengurus / Entitas Pernah Tercatat di Perusahaan Daftar Hitam!'
                  : 'Tidak Ditemukan Pengurus pada Daftar Hitam'}
              </h3>
              <p class="text-xs text-white/90 mt-1">
                Akta Diperiksa: <strong class="underline">${this.escapeHtml(ext.companyName)}</strong>
                ${ext.aktaNumber ? ` &middot; ${this.escapeHtml(ext.aktaNumber)}` : ''}
              </p>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('ceklist-detection-popup').remove()" class="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition shrink-0">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Alert Body -->
        <div class="p-6 overflow-y-auto space-y-4 text-xs">
          ${isFlagged ? `
            ${compMatches.length ? `
              <div class="p-4 rounded-2xl bg-rose-50 border border-rose-300 space-y-2">
                <h4 class="font-black text-rose-900 flex items-center gap-1.5">
                  <i data-lucide="building-2" class="w-4 h-4 text-rose-600"></i>
                  <span>Kesamaan Nama Perusahaan (${compMatches.length})</span>
                </h4>
                ${compMatches.map(cm => `
                  <div class="p-3 rounded-xl bg-white border border-rose-200 flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <p class="font-black text-rose-800">${this.escapeHtml(cm.blacklistEntry.companyName)}</p>
                      <p class="text-[11px] text-slate-500">Alasan: ${this.escapeHtml(cm.blacklistEntry.reason || '-')} &middot; Status: <strong>${this.escapeHtml(cm.blacklistEntry.status)}</strong></p>
                    </div>
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800">${this.escapeHtml(cm.matchType)}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${offMatches.length ? `
              <div class="p-4 rounded-2xl bg-rose-50 border border-rose-300 space-y-2.5">
                <h4 class="font-black text-rose-900 flex items-center gap-1.5">
                  <i data-lucide="user-x" class="w-4 h-4 text-rose-600"></i>
                  <span>Pengurus / Komisaris Terdeteksi di Perusahaan Daftar Hitam (${offMatches.length} Temuan)</span>
                </h4>
                <div class="space-y-2">
                  ${offMatches.map(m => `
                    <div class="p-3.5 rounded-xl bg-white border border-rose-200 shadow-sm space-y-1.5">
                      <div class="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <span class="text-sm font-black text-rose-800">${this.escapeHtml(m.extractedOfficer.name)}</span>
                          <span class="ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">${this.escapeHtml(m.extractedOfficer.role)} di Akta Baru</span>
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white">${this.escapeHtml(m.matchReason)}</span>
                      </div>
                      <div class="text-[11px] text-slate-600 bg-rose-50/70 p-2.5 rounded-lg border border-rose-100">
                        Pernah / sedang tercatat sebagai <strong class="text-rose-900">${this.escapeHtml(m.blacklistOfficer.role)}</strong>
                        di perusahaan daftar hitam <strong class="text-rose-900">${this.escapeHtml(m.blacklistEntry.companyName)}</strong>
                        ${m.blacklistEntry.reason ? ` (${this.escapeHtml(m.blacklistEntry.reason)})` : ''}.
                        ${m.blacklistEntry.notes ? `<div class="mt-1 text-slate-500 italic">Catatan: ${this.escapeHtml(m.blacklistEntry.notes)}</div>` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          ` : `
            <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-2.5">
              <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-600 shrink-0 mt-0.5"></i>
              <div>
                <p class="font-bold">Seluruh pengurus pada akta tidak tercatat dalam database Daftar Hitam CEKLIST.</p>
                <p class="text-[11px] text-emerald-700 mt-0.5">Pemeriksaan telah dilakukan terhadap ${this.entries.length} perusahaan daftar hitam yang tersimpan di sistem.</p>
              </div>
            </div>
          `}

          <!-- Seluruh Pengurus yang Diekstrak OCR -->
          <div class="space-y-2">
            <h4 class="font-extrabold text-slate-700">Susunan Pengurus &amp; Komisaris Terbaca dari Akta (${(ext.officers || []).length} orang)</h4>
            <div class="rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
              ${(ext.officers || []).length ? (ext.officers || []).map(o => {
                const isHit = offMatches.some(m => m.extractedOfficer.name === o.name);
                return `
                  <div class="px-3.5 py-2.5 flex items-center justify-between gap-2 ${isHit ? 'bg-rose-50/70' : 'bg-white'}">
                    <div>
                      <span class="font-bold ${isHit ? 'text-rose-800' : 'text-slate-800'}">${this.escapeHtml(o.name)}</span>
                      ${o.nik ? `<span class="ml-2 text-[10px] font-mono text-slate-400">NIK: ${this.escapeHtml(o.nik)}</span>` : ''}
                    </div>
                    <div class="flex items-center gap-1.5">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">${this.escapeHtml(o.role)}</span>
                      ${isHit ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-rose-600 text-white">BLACKLIST</span>' : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Aman</span>'}
                    </div>
                  </div>
                `;
              }).join('') : '<div class="p-3 text-slate-400 text-center">Tidak ada daftar pengurus yang terbaca pada akta ini.</div>'}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button type="button" onclick="window.CeklistModule.copyScanReport('${scan.id}')" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i>
            <span>Salin Laporan Temuan</span>
          </button>
          <button type="button" onclick="document.getElementById('ceklist-detection-popup').remove()" class="px-5 py-2 rounded-xl text-xs font-bold ${isFlagged ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'} text-white transition">
            Saya Mengerti &amp; Tutup
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  copyScanReport(scanId) {
    const scan = this.scanHistory.find(s => s.id === scanId) || this.lastScanResult;
    if (!scan) return;
    const ext = scan.extracted || {};
    const lines = [
      `*LAPORAN PEMERIKSAAN CEKLIST ASKRINDO*`,
      `• Perusahaan (Akta) : ${ext.companyName}`,
      ext.aktaNumber ? `• Nomor Akta        : ${ext.aktaNumber}` : null,
      `• Status Hasil      : ${scan.isFlagged ? 'PERINGATAN — TERDETEKSI DAFTAR HITAM' : 'BERSIH (CLEAR)'}`,
      ''
    ].filter(Boolean);

    if (scan.isFlagged) {
      lines.push('*Temuan Pengurus Daftar Hitam:*');
      (scan.officerMatches || []).forEach((m, i) => {
        lines.push(`${i + 1}. ${m.extractedOfficer.name} (${m.extractedOfficer.role}) -> Tercatat di ${m.blacklistEntry.companyName} sebagai ${m.blacklistOfficer.role} [${m.blacklistEntry.reason || 'Blacklist'}]`);
      });
    } else {
      lines.push(`Seluruh ${(ext.officers || []).length} pengurus yang terbaca dari akta tidak tercatat pada database daftar hitam.`);
    }

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(lines.join('\n')).then(() => {
        if (window.askrindoApp) window.askrindoApp.showToast('Laporan hasil pemeriksaan CEKLIST disalin!', 'success');
      }).catch(() => {});
    }
  },

  // --- CEK CEPAT MANUAL (Tanpa Upload) ---
  runManualQuickCheck(e) {
    if (e) e.preventDefault();
    const q = (document.getElementById('ceklist-manual-name')?.value || '').trim();
    if (!q) return;

    const extracted = {
      companyName: 'Pemeriksaan Cepat Manual',
      aktaNumber: '',
      notaryName: '',
      officers: [{ name: q, role: 'Dicek Manual', nik: q.replace(/[^0-9]/g, '').length >= 12 ? q : '' }]
    };
    const check = this.crossCheckExtraction({
      companyName: q,
      officers: extracted.officers
    });
    const scanRecord = {
      id: `SCAN-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fileNames: ['Cek Manual'],
      extracted: { ...extracted, companyName: `Pencarian: "${q}"` },
      isFlagged: check.isFlagged,
      companyMatches: check.companyMatches,
      officerMatches: check.officerMatches
    };
    this.showDetectionPopup(scanRecord);
  },

  updateView(preserveSearch = false) {
    const root = document.getElementById('ceklist-module-root');
    if (!root) return;

    let selStart = null;
    if (preserveSearch && document.activeElement?.id === 'ceklist-bl-search') {
      selStart = document.activeElement.selectionStart;
    }

    root.innerHTML = this.renderInner();
    if (window.lucide) window.lucide.createIcons();

    if (preserveSearch && selStart !== null) {
      const inp = document.getElementById('ceklist-bl-search');
      if (inp) {
        inp.focus();
        try { inp.setSelectionRange(selStart, selStart); } catch (_) {}
      }
    }
  },

  render() {
    const user = window.authService.getCurrentUser();
    if (!user || !window.authService.hasAccess('ceklist')) {
      return window.askrindoApp.renderUnauthorized('CEKLIST');
    }
    setTimeout(() => this.init(), 0);
    return `
      <div id="ceklist-module-root" class="space-y-5 pb-6 animate-fadeIn">
        ${this.renderInner()}
      </div>
    `;
  },

  renderInner() {
    const stats = this.getStats();
    return `
      <!-- Header Card -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm border-l-4 border-l-rose-600 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-start sm:items-center gap-3.5 min-w-0">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25 shrink-0">
            <i data-lucide="shield-alert" class="w-6 h-6"></i>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-xl font-black text-slate-900 tracking-tight">CEKLIST</h1>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                Cek Entitas dan Kelola List Informasi Status Terblokir
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                AI OCR Akta Vision
              </span>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Kelola Principal Daftar Hitam beserta Direksi &amp; Komisaris, serta pindai Akta Perusahaan terbaru secara otomatis untuk mendeteksi keterkaitan pengurus daftar hitam.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 flex-wrap">
          <button onclick="window.CeklistModule.openBlacklistModal()" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-sm shadow-rose-600/25 transition">
            <i data-lucide="plus-circle" class="w-4 h-4"></i>
            <span>Tambah Principal Blacklist</span>
          </button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Entitas Daftar Hitam</p>
            <h3 class="text-2xl font-black text-rose-700 mt-0.5">${stats.totalCompanies}</h3>
            <p class="text-[11px] text-rose-600 font-semibold mt-0.5">${stats.activeBlocked} terblokir aktif</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <i data-lucide="building-2" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pengurus Terpantau</p>
            <h3 class="text-2xl font-black text-slate-800 mt-0.5">${stats.totalOfficers}</h3>
            <p class="text-[11px] text-slate-500 font-semibold mt-0.5">Direksi, Wakil &amp; Komisaris</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <i data-lucide="users" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pindai Akta</p>
            <h3 class="text-2xl font-black text-indigo-700 mt-0.5">${stats.totalScans}</h3>
            <p class="text-[11px] text-indigo-600 font-semibold mt-0.5">Pemeriksaan AI OCR</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <i data-lucide="scan-search" class="w-5 h-5"></i>
          </div>
        </div>

        <div class="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Temuan Terdeteksi</p>
            <h3 class="text-2xl font-black ${stats.flaggedScans > 0 ? 'text-rose-700' : 'text-emerald-700'} mt-0.5">${stats.flaggedScans}</h3>
            <p class="text-[11px] text-slate-500 font-semibold mt-0.5">Pengurus terindikasi blacklist</p>
          </div>
          <div class="w-11 h-11 rounded-xl ${stats.flaggedScans > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} flex items-center justify-center shrink-0">
            <i data-lucide="shield-check" class="w-5 h-5"></i>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="inline-flex items-center bg-white border border-slate-200 rounded-2xl p-1.5 shadow-sm gap-1 flex-wrap">
        <button onclick="window.CeklistModule.setTab('ocr')" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${this.activeTab === 'ocr' ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="scan-search" class="w-4 h-4"></i>
          <span>Pindai Akta Terbaru (AI OCR)</span>
        </button>
        <button onclick="window.CeklistModule.setTab('blacklist')" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${this.activeTab === 'blacklist' ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="list-x" class="w-4 h-4"></i>
          <span>Kelola Principal Blacklist (${stats.totalCompanies})</span>
        </button>
        <button onclick="window.CeklistModule.setTab('history')" class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${this.activeTab === 'history' ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
          <i data-lucide="history" class="w-4 h-4"></i>
          <span>Riwayat Pindai (${stats.totalScans})</span>
        </button>
      </div>

      <!-- Active Tab Body -->
      ${this.activeTab === 'ocr' ? this.renderOcrTab() : ''}
      ${this.activeTab === 'blacklist' ? this.renderBlacklistTab() : ''}
      ${this.activeTab === 'history' ? this.renderHistoryTab() : ''}
    `;
  },

  renderOcrTab() {
    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <!-- Upload Akta Card (8 cols) -->
        <div class="lg:col-span-8 bg-gradient-to-br from-[#002B49] via-[#1B263B] to-[#3B0D1E] rounded-3xl p-6 text-white shadow-xl space-y-5">
          <div>
            <span class="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-300">
              <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Deteksi Otomatis Pengurus Daftar Hitam
            </span>
            <h2 class="text-xl font-black mt-1">Upload Akta Terbaru Perusahaan (PDF / Gambar)</h2>
            <p class="text-xs text-slate-300 mt-1">
              AI OCR akan membaca susunan Direksi, Wakil Direktur, Komisaris, dan Pemegang Saham dari akta, lalu langsung mencocokkannya dengan database Principal Blacklist.
            </p>
          </div>

          <!-- Dropzone -->
          <label class="block border-2 border-dashed border-white/30 hover:border-amber-300 rounded-2xl p-6 text-center cursor-pointer bg-white/5 hover:bg-white/10 transition">
            <input
              id="ceklist-akta-file"
              type="file"
              accept="application/pdf,image/*"
              multiple
              onchange="window.CeklistModule.handleFileSelect(this.files)"
              class="hidden"
            />
            <div class="w-12 h-12 rounded-2xl bg-white/10 text-amber-300 flex items-center justify-center mx-auto mb-3">
              <i data-lucide="file-up" class="w-6 h-6"></i>
            </div>
            <p class="text-sm font-bold text-white">Klik untuk memilih berkas Akta (PDF / JPG / PNG)</p>
            <p class="text-[11px] text-slate-300 mt-1">Bisa mengunggah 1 file PDF atau beberapa halaman foto akta sekaligus.</p>
          </label>

          ${this.selectedFiles.length ? `
            <div class="bg-white/10 border border-white/20 rounded-2xl p-3.5 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-bold text-amber-200">${this.selectedFiles.length} Berkas Siap Dipindai:</span>
                <button type="button" onclick="window.CeklistModule.clearSelectedFiles()" class="text-[11px] text-rose-300 hover:text-white font-semibold">Hapus Pilihan</button>
              </div>
              <div class="flex flex-wrap gap-1.5">
                ${this.selectedFiles.map(f => `
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/25 text-[11px] font-semibold text-white">
                    <i data-lucide="file-text" class="w-3.5 h-3.5 text-amber-300"></i>
                    <span>${this.escapeHtml(f.name)}</span>
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="flex items-center justify-between gap-3 flex-wrap pt-1">
            <span class="text-[11px] text-slate-300">
              Memeriksa terhadap <strong class="text-white">${this.entries.length}</strong> perusahaan daftar hitam.
            </span>
            <button
              type="button"
              onclick="window.CeklistModule.runAktaOcrScan()"
              ${this.isScanning || !this.selectedFiles.length ? 'disabled' : ''}
              class="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs sm:text-sm font-black bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 disabled:opacity-50 text-white shadow-lg transition"
            >
              <i data-lucide="${this.isScanning ? 'loader-2' : 'scan-search'}" class="w-4 h-4 ${this.isScanning ? 'animate-spin' : ''}"></i>
              <span>${this.isScanning ? 'Memindai Akta & Mencocokkan...' : 'Pindai AI OCR & Cek Blacklist'}</span>
            </button>
          </div>
        </div>

        <!-- Quick Manual Check Card (4 cols) -->
        <div class="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm flex flex-col justify-between gap-4">
          <div class="space-y-3">
            <div class="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <i data-lucide="user-search" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="text-base font-black text-slate-900">Cek Cepat Nama / NIK</h3>
              <p class="text-xs text-slate-500 mt-1">
                Ingin mengecek 1 nama pengurus, NIK, atau nama perusahaan tanpa mengunggah akta? Ketik langsung di bawah ini.
              </p>
            </div>
            <form onsubmit="window.CeklistModule.runManualQuickCheck(event)" class="space-y-2.5 pt-1">
              <input
                id="ceklist-manual-name"
                type="text"
                required
                placeholder="Ketik nama Direktur / Komisaris / NIK / PT..."
                class="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500"
              />
              <button type="button" onclick="window.CeklistModule.runManualQuickCheck()" class="w-full py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer">
                Periksa Sekarang
              </button>
            </form>
          </div>

          ${this.lastScanResult ? `
            <div class="p-3.5 rounded-2xl border ${this.lastScanResult.isFlagged ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'} space-y-1.5">
              <p class="text-[10px] font-extrabold uppercase tracking-wider ${this.lastScanResult.isFlagged ? 'text-rose-700' : 'text-emerald-700'}">Hasil Pindai Terakhir</p>
              <p class="text-xs font-bold text-slate-800 truncate">${this.escapeHtml(this.lastScanResult.extracted?.companyName)}</p>
              <button type="button" onclick="window.CeklistModule.showDetectionPopup(window.CeklistModule.lastScanResult)" class="text-[11px] font-bold ${this.lastScanResult.isFlagged ? 'text-rose-700' : 'text-emerald-700'} hover:underline">
                Buka Pop-up Hasil &rarr;
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  },

  renderBlacklistTab() {
    const filtered = this.getFilteredEntries();
    return `
      <div class="space-y-4">
        <!-- Search & Filter Bar -->
        <div class="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div class="relative flex-1">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            <input
              id="ceklist-bl-search"
              type="text"
              value="${this.escapeHtml(this.searchQuery)}"
              oninput="window.CeklistModule.setSearch(this.value)"
              placeholder="Cari nama perusahaan, nama Direktur/Komisaris, NIK, atau alasan..."
              class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-semibold text-slate-800 focus:outline-none focus:border-rose-500"
            />
          </div>
          <select onchange="window.CeklistModule.setStatusFilter(this.value)" class="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500">
            <option value="all" ${this.statusFilter === 'all' ? 'selected' : ''}>Semua Status</option>
            <option value="Terblokir Aktif" ${this.statusFilter === 'Terblokir Aktif' ? 'selected' : ''}>Terblokir Aktif</option>
            <option value="Dalam Pengawasan" ${this.statusFilter === 'Dalam Pengawasan' ? 'selected' : ''}>Dalam Pengawasan</option>
            <option value="Dipulihkan" ${this.statusFilter === 'Dipulihkan' ? 'selected' : ''}>Dipulihkan</option>
          </select>
        </div>

        ${!filtered.length ? `
          <div class="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
              <i data-lucide="shield-off" class="w-6 h-6"></i>
            </div>
            <h4 class="text-sm font-bold text-slate-800">Belum Ada Data Principal Daftar Hitam</h4>
            <p class="text-xs text-slate-500 max-w-md mx-auto">
              Klik tombol <strong>Tambah Principal Blacklist</strong> di kanan atas untuk memasukkan perusahaan beserta daftar Direktur, Wakil Direktur, dan Komisarisnya.
            </p>
            <button onclick="window.CeklistModule.openBlacklistModal()" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
              <span>Tambah Principal Blacklist</span>
            </button>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            ${filtered.map(e => {
              const stCls = e.status === 'Terblokir Aktif'
                ? 'bg-rose-100 text-rose-800 border-rose-300'
                : (e.status === 'Dalam Pengawasan'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300');
              return `
                <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between gap-3.5">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="flex items-center gap-1.5 flex-wrap mb-1">
                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border ${stCls}">${this.escapeHtml(e.status)}</span>
                        ${e.blacklistDate ? `<span class="text-[10px] text-slate-400 font-medium">Sejak ${this.escapeHtml(e.blacklistDate)}</span>` : ''}
                      </div>
                      <h4 class="text-base font-black text-slate-900 break-words">${this.escapeHtml(e.companyName)}</h4>
                      <p class="text-[11px] text-rose-700 font-semibold mt-0.5">${this.escapeHtml(e.reason || 'Daftar Hitam')}${e.npwp ? ` &middot; <span class="text-slate-400 font-mono">NPWP: ${this.escapeHtml(e.npwp)}</span>` : ''}</p>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      <button onclick="window.CeklistModule.openBlacklistModal('${e.id}')" title="Edit" class="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                      </button>
                      <button onclick="window.CeklistModule.deleteEntry('${e.id}')" title="Hapus" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                  </div>

                  <!-- Officers Chips -->
                  <div class="bg-slate-50 rounded-xl p-3 border border-slate-200/70 space-y-1.5">
                    <p class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Susunan Pengurus (${(e.officers || []).length})</p>
                    <div class="space-y-1">
                      ${(e.officers || []).map(o => `
                        <div class="flex items-center justify-between gap-2 text-xs">
                          <span class="font-bold text-slate-800">${this.escapeHtml(o.name)}${o.nik ? ` <span class="text-[10px] font-mono text-slate-400">(${this.escapeHtml(o.nik)})</span>` : ''}</span>
                          <span class="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-600 shrink-0">${this.escapeHtml(o.role)}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>

                  ${e.notes ? `<p class="text-[11px] text-slate-500 italic">Catatan: ${this.escapeHtml(e.notes)}</p>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;
  },

  renderHistoryTab() {
    if (!this.scanHistory.length) {
      return `
        <div class="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-2">
          <i data-lucide="history" class="w-8 h-8 text-slate-300 mx-auto"></i>
          <h4 class="text-sm font-bold text-slate-700">Belum Ada Riwayat Pindai Akta</h4>
          <p class="text-xs text-slate-400">Riwayat pemeriksaan AI OCR Akta akan tersimpan otomatis di sini.</p>
        </div>
      `;
    }

    return `
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div class="divide-y divide-slate-100">
          ${this.scanHistory.map((s, idx) => `
            <div class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
              <div class="space-y-1">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${s.isFlagged ? 'bg-rose-600 text-white' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}">
                    ${s.isFlagged ? `TERDETEKSI (${(s.officerMatches || []).length} Pengurus)` : 'BERSIH'}
                  </span>
                  <span class="text-[11px] text-slate-400">${new Date(s.timestamp).toLocaleString('id-ID')}</span>
                </div>
                <p class="text-sm font-bold text-slate-900">${this.escapeHtml(s.extracted?.companyName)}</p>
                <p class="text-[11px] text-slate-500">${(s.extracted?.officers || []).length} pengurus terbaca &middot; Berkas: ${this.escapeHtml((s.fileNames || []).join(', '))}</p>
              </div>
              <button onclick="window.CeklistModule.showDetectionPopup(window.CeklistModule.scanHistory[${idx}])" class="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition self-start sm:self-center">
                Lihat Pop-up Hasil
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // --- INTEGRASI CROSS-APP GATEKEEPER (BLOKIR PENGAJUAN DI SEMUA MODUL) ---
  ensureLoaded() {
    if (!this.entries || this.entries.length === 0) {
      this.loadLocal();
    }
    if (!this._cloudWarmupStarted) {
      this._cloudWarmupStarted = true;
      this.syncFromCloud().catch(() => {});
    }
  },

  checkEntityBlocked({ companyName = '', npwp = '', personName = '' } = {}) {
    this.ensureLoaded();
    const activeEntries = (this.entries || []).filter(e => (e.status || 'Terblokir Aktif') !== 'Dipulihkan');
    if (!activeEntries.length) return { blocked: false, matches: [] };

    const normTargetComp = this.normalizeCompanyName(companyName);
    const targetDigits = String(npwp || '').replace(/[^0-9]/g, '');
    const matches = [];

    activeEntries.forEach(entry => {
      const reasons = [];

      // 1. Cek Nama Perusahaan
      if (normTargetComp) {
        const normEntryComp = this.normalizeCompanyName(entry.companyName);
        if (normEntryComp && (
          normEntryComp === normTargetComp ||
          (normTargetComp.length >= 6 && normEntryComp.includes(normTargetComp)) ||
          (normEntryComp.length >= 6 && normTargetComp.includes(normEntryComp))
        )) {
          reasons.push('Nama Perusahaan Terdaftar di Blacklist');
        }
      }

      // 2. Cek NPWP / NIB
      if (targetDigits.length >= 10) {
        const entryDigits = String(entry.npwp || '').replace(/[^0-9]/g, '');
        if (entryDigits.length >= 10 && entryDigits === targetDigits) {
          reasons.push('NPWP / NIB Cocok dengan Entitas Blacklist');
        }
      }

      // 3. Cek Nama / NIK Pengurus (jika diberikan atau jika tertanggung perorangan)
      const checkPerson = personName || companyName;
      if (checkPerson) {
        const personObj = { name: checkPerson, nik: targetDigits.length >= 12 ? targetDigits : '' };
        (entry.officers || []).forEach(blOff => {
          const hit = this.matchPerson(personObj, blOff);
          if (hit) {
            reasons.push(`Pengurus Terblokir: ${blOff.name} (${blOff.role || 'Pengurus'})`);
          }
        });
      }

      if (reasons.length) {
        matches.push({ entry, reasons: Array.from(new Set(reasons)) });
      }
    });

    return {
      blocked: matches.length > 0,
      matches
    };
  },

  guardEntitySubmission({ companyName = '', npwp = '', personName = '', contextApp = 'Askrindo SATU' } = {}) {
    const result = this.checkEntityBlocked({ companyName, npwp, personName });
    if (!result.blocked) return false;

    const first = result.matches[0]?.entry;
    if (window.askrindoDB?.logActivity) {
      window.askrindoDB.logActivity(
        'CEKLIST',
        `Blokir Pengajuan (${contextApp})`,
        `Pengajuan atas nama "${companyName || personName}" diblokir otomatis karena terdaftar di CEKLIST (${first?.companyName || '-'} — ${first?.reason || 'Blacklist'}).`
      );
    }

    this.showBlockedSubmissionModal({
      companyName: companyName || personName || '-',
      contextApp,
      matches: result.matches
    });

    if (window.askrindoApp) {
      window.askrindoApp.showToast(`DIBLOKIR: "${companyName || personName}" terdaftar dalam Daftar Hitam CEKLIST!`, 'error');
    }
    return true;
  },

  showBlockedSubmissionModal({ companyName = '-', contextApp = 'Askrindo SATU', matches = [] } = {}) {
    const old = document.getElementById('ceklist-block-guard-modal');
    if (old) old.remove();

    const modal = document.createElement('div');
    modal.id = 'ceklist-block-guard-modal';
    modal.className = 'fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fadeIn';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-xl w-full shadow-2xl border-2 border-rose-500 overflow-hidden max-h-[90vh] flex flex-col">
        <!-- Red Header -->
        <div class="bg-gradient-to-r from-rose-700 via-red-600 to-rose-800 text-white p-5 flex items-start justify-between gap-4 shrink-0">
          <div class="flex items-start gap-3">
            <div class="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shrink-0">
              <i data-lucide="shield-ban" class="w-7 h-7 text-white"></i>
            </div>
            <div>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/25 border border-white/25">
                Akses Proses Ditolak · Integrasi CEKLIST
              </span>
              <h3 class="text-lg font-black mt-1 leading-tight">Perusahaan Terdaftar di Daftar Hitam!</h3>
              <p class="text-xs text-rose-100 mt-0.5">
                Pengajuan pada aplikasi <strong>${this.escapeHtml(contextApp)}</strong> tidak dapat dilanjutkan.
              </p>
            </div>
          </div>
          <button type="button" onclick="document.getElementById('ceklist-block-guard-modal').remove()" class="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition shrink-0">
            <i data-lucide="x" class="w-4 h-4"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 space-y-4 overflow-y-auto text-xs">
          <div class="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
            <p class="font-bold">Entitas yang Diajukan: <span class="underline">${this.escapeHtml(companyName)}</span></p>
            <p class="text-[11px] text-rose-800 leading-relaxed">
              Sistem <strong>CEKLIST</strong> mendeteksi bahwa perusahaan atau pengurus terkait tercatat dalam daftar status terblokir. Sesuai kebijakan kepatuhan risiko, proses di modul <strong>${this.escapeHtml(contextApp)}</strong> dihentikan secara otomatis.
            </p>
          </div>

          <div class="space-y-2.5">
            <p class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Detail Catatan Daftar Hitam (${matches.length})</p>
            ${matches.map(m => {
              const e = m.entry;
              return `
                <div class="p-3.5 rounded-2xl bg-white border border-rose-200 shadow-sm space-y-2">
                  <div class="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h4 class="text-sm font-black text-rose-800">${this.escapeHtml(e.companyName)}</h4>
                      ${e.npwp ? `<p class="text-[10px] font-mono text-slate-500">NPWP/NIB: ${this.escapeHtml(e.npwp)}</p>` : ''}
                    </div>
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase">
                      ${this.escapeHtml(e.status || 'Terblokir Aktif')}
                    </span>
                  </div>

                  <div class="flex flex-wrap gap-1.5">
                    ${m.reasons.map(r => `<span class="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">${this.escapeHtml(r)}</span>`).join('')}
                    ${e.reason ? `<span class="px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">Kategori: ${this.escapeHtml(e.reason)}</span>` : ''}
                    ${e.blacklistDate ? `<span class="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-semibold">Tgl: ${this.escapeHtml(e.blacklistDate)}</span>` : ''}
                  </div>

                  ${(e.officers || []).length ? `
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <p class="text-[10px] font-bold uppercase text-slate-400">Pengurus Terdaftar:</p>
                      <div class="flex flex-wrap gap-1.5">
                        ${e.officers.map(o => `<span class="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-700">${this.escapeHtml(o.name)}${o.role ? ` (${this.escapeHtml(o.role)})` : ''}</span>`).join('')}
                      </div>
                    </div>
                  ` : ''}

                  ${e.notes ? `<p class="text-[11px] text-slate-500 italic">Catatan: ${this.escapeHtml(e.notes)}</p>` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Footer -->
        <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button type="button" onclick="document.getElementById('ceklist-block-guard-modal').remove(); window.location.hash='#/ceklist';" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 transition cursor-pointer">
            <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
            <span>Buka Modul CEKLIST</span>
          </button>
          <button type="button" onclick="document.getElementById('ceklist-block-guard-modal').remove()" class="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer">
            Saya Mengerti &amp; Tutup
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  }
};

// Warm up CEKLIST blacklist cache & cloud sync so cross-app blocking works immediately on any page
setTimeout(() => {
  try { window.CeklistModule?.ensureLoaded?.(); } catch (_) {}
}, 400);
