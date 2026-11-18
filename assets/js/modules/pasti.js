/**
 * Askrindo SATU - PASTI Module
 * Pemeriksaan Administrasi SPKMGR Terintegrasi
 * Pencarian dokumen & rincian status SPKMGR berbasis Google Sheets live sync.
 */

window.PastiModule = {
  SHEET_ID: '1KeCuxCS0GaVP991eeZBF7uAsZeh4zpfHe-QsSjbemd4',
  CSV_URL: 'https://docs.google.com/spreadsheets/d/1KeCuxCS0GaVP991eeZBF7uAsZeh4zpfHe-QsSjbemd4/export?format=csv',
  SHEET_EDIT_URL: 'https://docs.google.com/spreadsheets/d/1KeCuxCS0GaVP991eeZBF7uAsZeh4zpfHe-QsSjbemd4/edit?usp=sharing',
  CACHE_KEY: 'askrindo_satu_pasti_cache_v1',

  rows: [],
  syncedAt: null,
  isSyncing: false,
  syncError: null,

  // Filter & view state
  searchQuery: '',
  quickFilter: 'all', // 'all' | 'belum_ada' | 'ada' | 'softfile' | 'belum_bayar' | 'sudah_bayar'
  rmFilter: 'all',
  cobFilter: 'all',
  viewMode: 'auto', // 'auto' (cards when searching, table otherwise) | 'cards' | 'table'
  currentPage: 1,
  pageSize: 25,
  selectedRecordIndex: null,
  hasInitialized: false,

  init() {
    this.loadFromCache();
    this.updateView();
    if (!this.hasInitialized) {
      this.hasInitialized = true;
      this.syncFromSheet(false);
    }
  },

  loadFromCache() {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.rows)) {
        this.rows = parsed.rows;
        this.syncedAt = parsed.syncedAt || null;
      }
    } catch (e) {
      console.warn('[PASTI] Gagal membaca cache lokal:', e);
    }
  },

  saveToCache() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify({
        rows: this.rows,
        syncedAt: this.syncedAt
      }));
    } catch (e) {
      console.warn('[PASTI] Gagal menyimpan cache lokal:', e);
    }
  },

  async syncFromSheet(showNotification = true) {
    if (this.isSyncing) return;
    this.isSyncing = true;
    this.syncError = null;
    this.updateSyncBadge();

    try {
      const url = `${this.CSV_URL}&_t=${Date.now()}`;
      const resp = await fetch(url, { cache: 'no-store' });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }
      const csvText = await resp.text();
      const parsedRows = this.parseSpkmgrCsv(csvText);
      if (!parsedRows.length) {
        throw new Error('Data CSV kosong atau format header tidak sesuai.');
      }

      this.rows = parsedRows;
      this.syncedAt = new Date().toISOString();
      this.saveToCache();

      if (showNotification && window.askrindoApp) {
        window.askrindoApp.showToast(`Database PASTI berhasil disinkronkan (${this.rows.length} data SPKMGR).`, 'success');
      }
    } catch (err) {
      console.warn('[PASTI] Gagal sinkronisasi Google Sheets:', err);
      this.syncError = err.message || 'Gagal terhubung ke Google Sheets';
      if (showNotification && window.askrindoApp) {
        window.askrindoApp.showToast(
          this.rows.length
            ? `Sinkronisasi gagal (${this.syncError}). Menampilkan data cache terakhir.`
            : `Gagal memuat database Google Sheets (${this.syncError}).`,
          'warning'
        );
      }
    } finally {
      this.isSyncing = false;
      this.updateView(true);
    }
  },

  parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;
    const cleanText = String(text || '').replace(/^\uFEFF/, '');

    for (let i = 0; i < cleanText.length; i++) {
      const ch = cleanText[i];
      const next = cleanText[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          field += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          field += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          row.push(field);
          field = '';
        } else if (ch === '\r' && next === '\n') {
          row.push(field);
          rows.push(row);
          row = [];
          field = '';
          i++;
        } else if (ch === '\n' || ch === '\r') {
          row.push(field);
          rows.push(row);
          row = [];
          field = '';
        } else {
          field += ch;
        }
      }
    }

    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  },

  parseSpkmgrCsv(csvText) {
    const matrix = this.parseCsv(csvText);
    if (matrix.length < 2) return [];

    // Header row: [, Nama, Jenis COB, Tanggal, JW Awal, JW Akhir, Status SPKMGR, Keterangan, Status Pembayaran, Nama RM, Biaya SPKMGR]
    const headers = matrix[0].map(h => String(h || '').trim().toLowerCase());
    const findCol = (keywords, fallbackIdx) => {
      const idx = headers.findIndex(h => keywords.some(k => h.includes(k)));
      return idx !== -1 ? idx : fallbackIdx;
    };

    const idxNo = 0;
    const idxNama = findCol(['nama'], 1);
    const idxCob = findCol(['cob'], 2);
    const idxTanggal = findCol(['tanggal'], 3);
    const idxJwAwal = findCol(['jw awal', 'awal'], 4);
    const idxJwAkhir = findCol(['jw akhir', 'akhir'], 5);
    const idxStatus = findCol(['status spkmgr'], 6);
    const idxKet = findCol(['keterangan'], 7);
    const idxBayar = findCol(['pembayaran', 'bayar'], 8);
    const idxRm = findCol(['nama rm', 'rm'], 9);
    const idxBiaya = findCol(['biaya'], 10);

    const parsed = [];
    for (let i = 1; i < matrix.length; i++) {
      const cols = matrix[i];
      const nama = String(cols[idxNama] || '').trim();
      if (!nama) continue;

      const no = String(cols[idxNo] || '').trim() || String(parsed.length + 1);
      const jenisCob = String(cols[idxCob] || '').trim() || '-';
      const tanggal = String(cols[idxTanggal] || '').trim() || '-';
      const jwAwal = String(cols[idxJwAwal] || '').trim() || '-';
      const jwAkhir = String(cols[idxJwAkhir] || '').trim() || '-';
      const statusSpkmgr = String(cols[idxStatus] || '').trim() || '-';
      const keterangan = String(cols[idxKet] || '').trim() || '-';
      const statusPembayaran = String(cols[idxBayar] || '').trim() || '-';
      const rawRm = String(cols[idxRm] || '').trim();
      const namaRm = (!rawRm || rawRm === '#N/A') ? '-' : rawRm;
      const biayaSpkmgr = String(cols[idxBiaya] || '').trim() || '-';

      parsed.push({
        _idx: parsed.length,
        no,
        nama,
        jenisCob,
        tanggal,
        jwAwal,
        jwAkhir,
        statusSpkmgr,
        keterangan,
        statusPembayaran,
        namaRm,
        biayaSpkmgr,
        biayaNum: this.parseRupiah(biayaSpkmgr)
      });
    }

    return parsed;
  },

  parseRupiah(str) {
    const digits = String(str || '').replace(/[^0-9]/g, '');
    return digits ? Number(digits) : 0;
  },

  formatRupiah(num) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(Number(num) || 0);
  },

  escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  highlightMatch(text, query) {
    const safeText = this.escapeHtml(text);
    const q = String(query || '').trim();
    if (!q) return safeText;
    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQ})`, 'gi');
    return safeText.replace(regex, '<mark class="bg-amber-200/90 text-slate-900 px-0.5 rounded font-extrabold">$1</mark>');
  },

  parseDateId(str) {
    const m = String(str || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  },

  getJwStatus(jwAkhirStr) {
    const d = this.parseDateId(jwAkhirStr);
    if (!d) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { label: 'Berakhir', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
    if (diffDays <= 30) {
      return { label: `${diffDays} hari lagi`, cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
    return { label: 'Aktif', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  },

  getUniqueRms() {
    const set = new Set();
    this.rows.forEach(r => {
      if (r.namaRm && r.namaRm !== '-') set.add(r.namaRm);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  },

  getFilteredRows() {
    const q = this.searchQuery.trim().toLowerCase();
    return this.rows.filter(r => {
      if (q) {
        const matchNama = r.nama.toLowerCase().includes(q);
        const matchRm = r.namaRm.toLowerCase().includes(q);
        const matchNo = r.no.toLowerCase() === q;
        if (!matchNama && !matchRm && !matchNo) return false;
      }

      if (this.rmFilter !== 'all' && r.namaRm !== this.rmFilter) return false;
      if (this.cobFilter !== 'all' && r.jenisCob !== this.cobFilter) return false;

      if (this.quickFilter === 'belum_ada') {
        if (!r.keterangan.toLowerCase().includes('belum ada')) return false;
      } else if (this.quickFilter === 'ada') {
        if (r.keterangan.toLowerCase() !== 'ada spkmgr') return false;
      } else if (this.quickFilter === 'softfile') {
        if (!r.keterangan.toLowerCase().includes('softfile')) return false;
      } else if (this.quickFilter === 'belum_bayar') {
        if (!r.statusPembayaran.toLowerCase().includes('belum bayar')) return false;
      } else if (this.quickFilter === 'sudah_bayar') {
        if (!r.statusPembayaran.toLowerCase().includes('sudah bayar')) return false;
      }

      return true;
    });
  },

  getStats() {
    const total = this.rows.length;
    const uniquePrincipals = new Set(this.rows.map(r => r.nama.toUpperCase())).size;
    const belumAda = this.rows.filter(r => r.keterangan.toLowerCase().includes('belum ada')).length;
    const adaDokumen = this.rows.filter(r => {
      const k = r.keterangan.toLowerCase();
      return k.includes('ada spkmgr') && !k.includes('belum ada');
    }).length;
    const belumBayarRows = this.rows.filter(r => r.statusPembayaran.toLowerCase().includes('belum bayar'));
    const belumBayar = belumBayarRows.length;
    const totalBiayaBelumBayar = belumBayarRows.reduce((acc, r) => acc + r.biayaNum, 0);
    const sudahBayar = this.rows.filter(r => r.statusPembayaran.toLowerCase().includes('sudah bayar')).length;

    return {
      total,
      uniquePrincipals,
      belumAda,
      adaDokumen,
      belumBayar,
      totalBiayaBelumBayar,
      sudahBayar
    };
  },

  setSearch(val) {
    this.searchQuery = val;
    this.currentPage = 1;
    this.updateView(true);
  },

  clearSearch() {
    this.searchQuery = '';
    this.currentPage = 1;
    this.updateView(false);
    const inp = document.getElementById('pasti-search-input');
    if (inp) inp.focus();
  },

  setQuickFilter(filterKey) {
    this.quickFilter = this.quickFilter === filterKey && filterKey !== 'all' ? 'all' : filterKey;
    this.currentPage = 1;
    this.updateView(false);
  },

  setRmFilter(rm) {
    this.rmFilter = rm;
    this.currentPage = 1;
    this.updateView(false);
  },

  setCobFilter(cob) {
    this.cobFilter = cob;
    this.currentPage = 1;
    this.updateView(false);
  },

  setViewMode(mode) {
    this.viewMode = mode;
    this.updateView(false);
  },

  setPage(page) {
    this.currentPage = page;
    this.updateView(false);
    const container = document.getElementById('pasti-results-anchor');
    if (container) container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  resetAllFilters() {
    this.searchQuery = '';
    this.quickFilter = 'all';
    this.rmFilter = 'all';
    this.cobFilter = 'all';
    this.currentPage = 1;
    this.updateView(false);
  },

  getKeteranganBadge(ket) {
    const lower = String(ket || '').toLowerCase();
    if (lower.includes('softfile')) {
      return {
        label: ket,
        icon: 'file-text',
        cls: 'bg-sky-50 text-sky-700 border-sky-200',
        dot: 'bg-sky-500'
      };
    }
    if (lower.includes('belum ada')) {
      return {
        label: ket,
        icon: 'alert-circle',
        cls: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500'
      };
    }
    if (lower.includes('ada spkmgr')) {
      return {
        label: ket,
        icon: 'check-circle-2',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500'
      };
    }
    return {
      label: ket || '-',
      icon: 'minus-circle',
      cls: 'bg-slate-50 text-slate-600 border-slate-200',
      dot: 'bg-slate-400'
    };
  },

  getPembayaranBadge(status) {
    const lower = String(status || '').toLowerCase();
    if (lower.includes('sudah bayar')) {
      return {
        label: 'Sudah Bayar',
        icon: 'badge-check',
        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }
    if (lower.includes('belum bayar')) {
      return {
        label: 'Belum Bayar',
        icon: 'clock',
        cls: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    return {
      label: status === '-' || !status ? 'Tidak Ada Tagihan (-)' : status,
      icon: 'minus',
      cls: 'bg-slate-50 text-slate-500 border-slate-200'
    };
  },

  getStatusSpkmgrBadge(status) {
    const lower = String(status || '').toLowerCase();
    if (lower === 'waarmerking') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (lower === 'legalisasi') {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (lower.includes('tidak')) {
      return 'bg-slate-100 text-slate-600 border-slate-200';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200';
  },

  copySummary(idx) {
    const r = this.rows[idx];
    if (!r) return;
    const text = [
      `*Rincian Status SPKMGR - PASTI Askrindo*`,
      `• Nama Principal : ${r.nama}`,
      `• No. Urut       : #${r.no}`,
      `• Jenis COB      : ${r.jenisCob}`,
      `• Tanggal        : ${r.tanggal}`,
      `• Jangka Waktu   : ${r.jwAwal} s/d ${r.jwAkhir}`,
      `• Status SPKMGR  : ${r.statusSpkmgr}`,
      `• Keterangan     : ${r.keterangan}`,
      `• Pembayaran     : ${r.statusPembayaran}${r.biayaSpkmgr !== '-' ? ` (${r.biayaSpkmgr})` : ''}`,
      `• Nama RM        : ${r.namaRm}`
    ].join('\n');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        if (window.askrindoApp) {
          window.askrindoApp.showToast(`Ringkasan status ${r.nama} disalin ke clipboard!`, 'success');
        }
      }).catch(() => {});
    }
  },

  openDetailModal(idx) {
    const r = this.rows[idx];
    if (!r) return;
    this.selectedRecordIndex = idx;

    const ketBadge = this.getKeteranganBadge(r.keterangan);
    const payBadge = this.getPembayaranBadge(r.statusPembayaran);
    const spkmgrCls = this.getStatusSpkmgrBadge(r.statusSpkmgr);
    const jwStatus = this.getJwStatus(r.jwAkhir);

    const existing = document.getElementById('pasti-detail-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'pasti-detail-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in';
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    modal.innerHTML = `
      <div class="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
        <!-- Modal Header -->
        <div class="bg-gradient-to-r from-[#002B49] via-[#1e1b4b] to-indigo-900 text-white p-6 flex items-start justify-between gap-4">
          <div class="space-y-1.5 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/15 border border-white/20 text-indigo-100">
                No. #${this.escapeHtml(r.no)}
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${r.jenisCob === 'KBG' ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-300/30' : 'bg-amber-400/20 text-amber-200 border border-amber-300/30'}">
                COB: ${this.escapeHtml(r.jenisCob)}
              </span>
              ${jwStatus ? `<span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 border border-white/20 text-white">${jwStatus.label}</span>` : ''}
            </div>
            <h3 class="text-xl font-black tracking-tight break-words">${this.escapeHtml(r.nama)}</h3>
            <p class="text-xs text-indigo-200 flex items-center gap-1.5">
              <i data-lucide="user-check" class="w-3.5 h-3.5"></i>
              <span>Relationship Manager: <strong class="text-white">${this.escapeHtml(r.namaRm)}</strong></span>
            </p>
          </div>
          <button onclick="document.getElementById('pasti-detail-modal').remove()" class="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-6 space-y-5">
          <!-- 3-Pillar Status Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="p-3.5 rounded-2xl border bg-slate-50/70 border-slate-200 space-y-1.5">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status SPKMGR</p>
              <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${spkmgrCls}">
                ${this.escapeHtml(r.statusSpkmgr)}
              </span>
            </div>

            <div class="p-3.5 rounded-2xl border bg-slate-50/70 border-slate-200 space-y-1.5">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kelengkapan Dokumen</p>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${ketBadge.cls}">
                <i data-lucide="${ketBadge.icon}" class="w-3.5 h-3.5"></i>
                ${this.escapeHtml(ketBadge.label)}
              </span>
            </div>

            <div class="p-3.5 rounded-2xl border bg-slate-50/70 border-slate-200 space-y-1.5">
              <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Status Pembayaran</p>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${payBadge.cls}">
                  <i data-lucide="${payBadge.icon}" class="w-3.5 h-3.5"></i>
                  ${this.escapeHtml(payBadge.label)}
                </span>
                ${r.biayaSpkmgr && r.biayaSpkmgr !== '-' ? `<span class="text-xs font-black text-rose-700">${this.escapeHtml(r.biayaSpkmgr)}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- Detail Grid -->
          <div class="bg-slate-50 rounded-2xl border border-slate-200/80 divide-y divide-slate-200/70 text-xs">
            <div class="grid grid-cols-3 p-3.5 gap-2">
              <span class="text-slate-500 font-medium">Tanggal Dokumen</span>
              <span class="col-span-2 font-bold text-slate-800">${this.escapeHtml(r.tanggal)}</span>
            </div>
            <div class="grid grid-cols-3 p-3.5 gap-2">
              <span class="text-slate-500 font-medium">Jangka Waktu (JW)</span>
              <span class="col-span-2 font-bold text-slate-800">${this.escapeHtml(r.jwAwal)} &rarr; ${this.escapeHtml(r.jwAkhir)}</span>
            </div>
            <div class="grid grid-cols-3 p-3.5 gap-2">
              <span class="text-slate-500 font-medium">Biaya SPKMGR</span>
              <span class="col-span-2 font-bold ${r.biayaNum > 0 ? 'text-rose-700' : 'text-slate-700'}">${this.escapeHtml(r.biayaSpkmgr)}</span>
            </div>
            <div class="grid grid-cols-3 p-3.5 gap-2">
              <span class="text-slate-500 font-medium">Relationship Manager</span>
              <span class="col-span-2 font-bold text-slate-800">${this.escapeHtml(r.namaRm)}</span>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="flex items-center justify-between gap-3 pt-1">
            <a href="${this.SHEET_EDIT_URL}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition">
              <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
              <span>Buka di Google Sheets</span>
            </a>
            <div class="flex items-center gap-2">
              <button onclick="window.PastiModule.copySummary(${r._idx})" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span>Salin Ringkasan</span>
              </button>
              <button onclick="document.getElementById('pasti-detail-modal').remove()" class="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition">
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
  },

  updateSyncBadge() {
    const el = document.getElementById('pasti-sync-badge');
    if (!el) return;
    if (this.isSyncing) {
      el.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span><span>Menyinkronkan Sheet...</span>`;
      el.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200';
    } else if (this.syncError && !this.rows.length) {
      el.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500"></span><span>Gagal Sinkron</span>`;
      el.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200';
    } else {
      el.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>Live Google Sheets · ${this.rows.length} Data</span>`;
      el.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  },

  updateView(preserveSearchFocus = false) {
    const root = document.getElementById('pasti-module-root');
    if (!root) return;

    let selStart = null;
    let selEnd = null;
    if (preserveSearchFocus) {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.id === 'pasti-search-input') {
        selStart = activeEl.selectionStart;
        selEnd = activeEl.selectionEnd;
      }
    }

    root.innerHTML = this.renderInner();
    if (window.lucide) window.lucide.createIcons();

    if (preserveSearchFocus && selStart !== null) {
      const inp = document.getElementById('pasti-search-input');
      if (inp) {
        inp.focus();
        try {
          inp.setSelectionRange(selStart, selEnd);
        } catch (_) {}
      }
    }
  },

  render() {
    setTimeout(() => this.init(), 0);
    return `
      <div id="pasti-module-root" class="space-y-5 pb-6">
        ${this.renderInner()}
      </div>
    `;
  },

  renderInner() {
    const stats = this.getStats();
    const filtered = this.getFilteredRows();
    const rms = this.getUniqueRms();
    const hasActiveFilter = Boolean(this.searchQuery.trim() || this.quickFilter !== 'all' || this.rmFilter !== 'all' || this.cobFilter !== 'all');
    const effectiveMode = this.viewMode === 'auto'
      ? (hasActiveFilter ? 'cards' : 'table')
      : this.viewMode;

    const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    const startIdx = (this.currentPage - 1) * this.pageSize;
    const pagedRows = filtered.slice(startIdx, startIdx + this.pageSize);

    const syncLabel = this.isSyncing
      ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>Menyinkronkan Sheet...</span>`
      : `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>Live Google Sheets · ${stats.total} Data</span>`;

    const syncedTimeText = this.syncedAt
      ? new Date(this.syncedAt).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Belum disinkronkan';

    const quickFilterChips = [
      { key: 'all', label: 'Semua Data', count: stats.total, activeCls: 'bg-slate-900 text-white border-slate-900', idleCls: 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20' },
      { key: 'belum_ada', label: 'Belum Ada SPKMGR', count: stats.belumAda, activeCls: 'bg-amber-400 text-slate-950 border-amber-300', idleCls: 'bg-amber-500/15 text-amber-200 border-amber-400/30 hover:bg-amber-500/25' },
      { key: 'ada', label: 'Ada SPKMGR', count: this.rows.filter(r => r.keterangan.toLowerCase() === 'ada spkmgr').length, activeCls: 'bg-emerald-400 text-slate-950 border-emerald-300', idleCls: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30 hover:bg-emerald-500/25' },
      { key: 'softfile', label: 'Ada Softfile', count: this.rows.filter(r => r.keterangan.toLowerCase().includes('softfile')).length, activeCls: 'bg-sky-400 text-slate-950 border-sky-300', idleCls: 'bg-sky-500/15 text-sky-200 border-sky-400/30 hover:bg-sky-500/25' },
      { key: 'belum_bayar', label: 'Belum Bayar', count: stats.belumBayar, activeCls: 'bg-rose-400 text-slate-950 border-rose-300', idleCls: 'bg-rose-500/15 text-rose-200 border-rose-400/30 hover:bg-rose-500/25' },
      { key: 'sudah_bayar', label: 'Sudah Bayar', count: stats.sudahBayar, activeCls: 'bg-teal-400 text-slate-950 border-teal-300', idleCls: 'bg-teal-500/15 text-teal-200 border-teal-400/30 hover:bg-teal-500/25' }
    ];

    return `
      <!-- Header Card -->
      <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm border-l-4 border-l-indigo-600 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-start sm:items-center gap-3.5 min-w-0">
          <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
            <i data-lucide="file-search" class="w-6 h-6"></i>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-xl font-black text-slate-900 tracking-tight">PASTI</h1>
              <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Pemeriksaan Administrasi SPKMGR Terintegrasi
              </span>
              <div id="pasti-sync-badge">${syncLabel}</div>
            </div>
            <p class="text-xs text-slate-500 mt-1">
              Pencarian cepat dokumen SPKMGR berdasarkan nama principal untuk memantau kelengkapan dokumen, status waarmerking, dan status pembayaran secara real-time.
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 shrink-0 flex-wrap">
          <span class="text-[11px] text-slate-400 font-medium hidden sm:inline mr-1">Sync: ${syncedTimeText}</span>
          <button onclick="window.PastiModule.syncFromSheet(true)" ${this.isSyncing ? 'disabled' : ''} class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white shadow-sm shadow-indigo-600/20 transition">
            <i data-lucide="refresh-cw" class="w-3.5 h-3.5 ${this.isSyncing ? 'animate-spin' : ''}"></i>
            <span>Sinkronkan Ulang</span>
          </button>
          <a href="${this.SHEET_EDIT_URL}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition">
            <i data-lucide="sheet" class="w-3.5 h-3.5 text-emerald-600"></i>
            <span>Buka Google Sheet</span>
          </a>
        </div>
      </div>

      <!-- Hero Spotlight Search Panel -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002B49] via-[#13294B] to-[#1E1B4B] p-6 sm:p-7 text-white shadow-xl">
        <div class="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none"></div>
        <div class="absolute -left-12 -bottom-16 w-56 h-56 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"></div>

        <div class="relative z-10 space-y-4">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-2">
            <div>
              <span class="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300 mb-1">
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> Pencarian Instan Principal
              </span>
              <h2 class="text-xl sm:text-2xl font-black tracking-tight">Cari Nama Principal / Perusahaan</h2>
            </div>
            <div class="text-xs text-indigo-200 font-medium">
              Menampilkan <strong class="text-white font-extrabold">${filtered.length}</strong> dari ${stats.total} dokumen SPKMGR
            </div>
          </div>

          <!-- Search Input & Dropdown Filters -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div class="lg:col-span-7 relative">
              <i data-lucide="search" class="w-5 h-5 text-indigo-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"></i>
              <input
                id="pasti-search-input"
                type="text"
                value="${this.escapeHtml(this.searchQuery)}"
                oninput="window.PastiModule.setSearch(this.value)"
                placeholder="Ketik nama principal (misal: CV. AR'SYERA, PT. PUTRA, BANGUN) atau nama RM..."
                class="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-semibold shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-400/40"
              />
              ${this.searchQuery ? `
                <button onclick="window.PastiModule.clearSearch()" title="Hapus pencarian" class="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition">
                  <i data-lucide="x" class="w-4 h-4"></i>
                </button>
              ` : ''}
            </div>

            <div class="lg:col-span-3">
              <select onchange="window.PastiModule.setRmFilter(this.value)" class="w-full h-full py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="all" class="text-slate-900">Semua RM (${rms.length})</option>
                ${rms.map(rm => `<option value="${this.escapeHtml(rm)}" ${this.rmFilter === rm ? 'selected' : ''} class="text-slate-900">RM: ${this.escapeHtml(rm)}</option>`).join('')}
              </select>
            </div>

            <div class="lg:col-span-2">
              <select onchange="window.PastiModule.setCobFilter(this.value)" class="w-full h-full py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="all" class="text-slate-900">Semua COB</option>
                <option value="SB" ${this.cobFilter === 'SB' ? 'selected' : ''} class="text-slate-900">SB (Surety Bond)</option>
                <option value="KBG" ${this.cobFilter === 'KBG' ? 'selected' : ''} class="text-slate-900">KBG (Kontra BG)</option>
              </select>
            </div>
          </div>

          <!-- Quick Filter Pills -->
          <div class="flex flex-wrap items-center gap-2 pt-1">
            ${quickFilterChips.map(c => `
              <button onclick="window.PastiModule.setQuickFilter('${c.key}')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition ${this.quickFilter === c.key ? c.activeCls : c.idleCls}">
                <span>${c.label}</span>
                <span class="px-1.5 py-0.2 rounded-full text-[10px] ${this.quickFilter === c.key ? 'bg-black/15' : 'bg-white/10'}">${c.count}</span>
              </button>
            `).join('')}

            ${hasActiveFilter ? `
              <button onclick="window.PastiModule.resetAllFilters()" class="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition">
                <i data-lucide="rotate-ccw" class="w-3 h-3"></i>
                <span>Reset Filter</span>
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button onclick="window.PastiModule.setQuickFilter('all')" class="text-left bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-indigo-300 transition flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Dokumen</p>
            <h3 class="text-2xl font-black text-slate-800 mt-0.5">${stats.total}</h3>
            <p class="text-[11px] text-indigo-600 font-semibold mt-0.5">${stats.uniquePrincipals} principal unik</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <i data-lucide="folder-kanban" class="w-5 h-5"></i>
          </div>
        </button>

        <button onclick="window.PastiModule.setQuickFilter('belum_ada')" class="text-left bg-white rounded-2xl p-4 border ${this.quickFilter === 'belum_ada' ? 'border-amber-400 ring-2 ring-amber-200' : 'border-slate-200/80'} shadow-sm hover:shadow-md hover:border-amber-300 transition flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Belum Ada SPKMGR</p>
            <h3 class="text-2xl font-black text-amber-700 mt-0.5">${stats.belumAda}</h3>
            <p class="text-[11px] text-amber-600 font-semibold mt-0.5">${stats.total ? ((stats.belumAda / stats.total) * 100).toFixed(1) : '0.0'}% dari total data</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <i data-lucide="file-warning" class="w-5 h-5"></i>
          </div>
        </button>

        <button onclick="window.PastiModule.setQuickFilter('belum_bayar')" class="text-left bg-white rounded-2xl p-4 border ${this.quickFilter === 'belum_bayar' ? 'border-rose-400 ring-2 ring-rose-200' : 'border-slate-200/80'} shadow-sm hover:shadow-md hover:border-rose-300 transition flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Belum Bayar</p>
            <h3 class="text-2xl font-black text-rose-700 mt-0.5">${stats.belumBayar}</h3>
            <p class="text-[11px] text-rose-600 font-semibold mt-0.5">Total: ${this.formatRupiah(stats.totalBiayaBelumBayar)}</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <i data-lucide="wallet" class="w-5 h-5"></i>
          </div>
        </button>

        <button onclick="window.PastiModule.setQuickFilter('ada')" class="text-left bg-white rounded-2xl p-4 border ${this.quickFilter === 'ada' ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200/80'} shadow-sm hover:shadow-md hover:border-emerald-300 transition flex items-center justify-between">
          <div>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Dokumen Tersedia</p>
            <h3 class="text-2xl font-black text-emerald-700 mt-0.5">${stats.adaDokumen}</h3>
            <p class="text-[11px] text-emerald-600 font-semibold mt-0.5">${stats.sudahBayar} tercatat sudah bayar</p>
          </div>
          <div class="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <i data-lucide="file-check-2" class="w-5 h-5"></i>
          </div>
        </button>
      </div>

      <!-- Results Toolbar -->
      <div id="pasti-results-anchor" class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <h3 class="text-sm font-extrabold text-slate-800">
            ${this.searchQuery.trim()
              ? `Hasil Pencarian "<span class="text-indigo-600">${this.escapeHtml(this.searchQuery.trim())}</span>"`
              : 'Daftar Status Dokumen SPKMGR'}
          </h3>
          <span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            ${filtered.length} Data
          </span>
        </div>

        <div class="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm self-start sm:self-auto">
          <button onclick="window.PastiModule.setViewMode('cards')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${effectiveMode === 'cards' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="layout-grid" class="w-3.5 h-3.5"></i>
            <span>Kartu Rincian</span>
          </button>
          <button onclick="window.PastiModule.setViewMode('table')" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${effectiveMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}">
            <i data-lucide="table-2" class="w-3.5 h-3.5"></i>
            <span>Tabel Lengkap</span>
          </button>
        </div>
      </div>

      <!-- Results Content -->
      ${this.isSyncing && !this.rows.length
        ? this.renderLoadingState()
        : (filtered.length === 0
            ? this.renderEmptyState()
            : (effectiveMode === 'cards' ? this.renderCardsView(pagedRows) : this.renderTableView(pagedRows)))}

      <!-- Pagination -->
      ${filtered.length > this.pageSize ? this.renderPagination(filtered.length, totalPages) : ''}
    `;
  },

  renderLoadingState() {
    return `
      <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
          <i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">Memuat Database SPKMGR dari Google Sheets...</h4>
        <p class="text-xs text-slate-500">Mohon tunggu sebentar, sedang mengambil data terbaru.</p>
      </div>
    `;
  },

  renderEmptyState() {
    return `
      <div class="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <i data-lucide="search-x" class="w-6 h-6"></i>
        </div>
        <h4 class="text-sm font-bold text-slate-800">Data Principal Tidak Ditemukan</h4>
        <p class="text-xs text-slate-500 max-w-md mx-auto">
          Tidak ada dokumen SPKMGR yang cocok dengan pencarian atau filter yang dipilih.
        </p>
        <button onclick="window.PastiModule.resetAllFilters()" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition">
          <i data-lucide="rotate-ccw" class="w-3.5 h-3.5"></i>
          <span>Tampilkan Semua Data</span>
        </button>
      </div>
    `;
  },

  renderCardsView(rows) {
    return `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${rows.map(r => {
          const ketBadge = this.getKeteranganBadge(r.keterangan);
          const payBadge = this.getPembayaranBadge(r.statusPembayaran);
          const spkmgrCls = this.getStatusSpkmgrBadge(r.statusSpkmgr);
          const jwStatus = this.getJwStatus(r.jwAkhir);

          return `
            <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-indigo-300 transition-all p-5 flex flex-col justify-between gap-4">
              <!-- Card Top -->
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap mb-1.5">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-600">#${this.escapeHtml(r.no)}</span>
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${r.jenisCob === 'KBG' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}">${this.escapeHtml(r.jenisCob)}</span>
                    ${jwStatus ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${jwStatus.cls}">${jwStatus.label}</span>` : ''}
                  </div>
                  <h4 class="text-base font-black text-slate-900 leading-snug break-words">
                    ${this.highlightMatch(r.nama, this.searchQuery)}
                  </h4>
                  <p class="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                    <i data-lucide="user" class="w-3.5 h-3.5 text-slate-400"></i>
                    <span>RM: <strong class="text-slate-700">${this.highlightMatch(r.namaRm, this.searchQuery)}</strong></span>
                    <span class="text-slate-300">·</span>
                    <span>Tgl: <strong class="text-slate-700">${this.escapeHtml(r.tanggal)}</strong></span>
                  </p>
                </div>

                <button onclick="window.PastiModule.copySummary(${r._idx})" title="Salin ringkasan status" class="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border border-slate-200 transition shrink-0">
                  <i data-lucide="copy" class="w-4 h-4"></i>
                </button>
              </div>

              <!-- 3-Pillar Rincian Status -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50/90 p-3 rounded-xl border border-slate-200/70">
                <div>
                  <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Status SPKMGR</span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${spkmgrCls}">
                    ${this.escapeHtml(r.statusSpkmgr)}
                  </span>
                </div>

                <div>
                  <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Dokumen</span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${ketBadge.cls}">
                    <i data-lucide="${ketBadge.icon}" class="w-3 h-3 shrink-0"></i>
                    <span class="truncate">${this.escapeHtml(ketBadge.label)}</span>
                  </span>
                </div>

                <div>
                  <span class="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Pembayaran</span>
                  <div class="flex items-center gap-1 flex-wrap">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${payBadge.cls}">
                      <i data-lucide="${payBadge.icon}" class="w-3 h-3 shrink-0"></i>
                      <span>${this.escapeHtml(payBadge.label)}</span>
                    </span>
                    ${r.biayaNum > 0 ? `<span class="text-[11px] font-black text-rose-700">${this.escapeHtml(r.biayaSpkmgr)}</span>` : ''}
                  </div>
                </div>
              </div>

              <!-- Card Footer -->
              <div class="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
                <div class="text-[11px] text-slate-500 flex items-center gap-1.5">
                  <i data-lucide="calendar-range" class="w-3.5 h-3.5 text-slate-400"></i>
                  <span>JW: <strong class="text-slate-700">${this.escapeHtml(r.jwAwal)}</strong> &rarr; <strong class="text-slate-700">${this.escapeHtml(r.jwAkhir)}</strong></span>
                </div>
                <button onclick="window.PastiModule.openDetailModal(${r._idx})" class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition">
                  <span>Lihat Rincian</span>
                  <i data-lucide="arrow-right" class="w-3 h-3"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderTableView(rows) {
    return `
      <div class="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                <th class="py-3 px-3.5">No</th>
                <th class="py-3 px-3.5">Nama Principal</th>
                <th class="py-3 px-3">COB</th>
                <th class="py-3 px-3">Jangka Waktu</th>
                <th class="py-3 px-3">Status SPKMGR</th>
                <th class="py-3 px-3">Keterangan Dokumen</th>
                <th class="py-3 px-3">Pembayaran & Biaya</th>
                <th class="py-3 px-3">Nama RM</th>
                <th class="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${rows.map(r => {
                const ketBadge = this.getKeteranganBadge(r.keterangan);
                const payBadge = this.getPembayaranBadge(r.statusPembayaran);
                const spkmgrCls = this.getStatusSpkmgrBadge(r.statusSpkmgr);

                return `
                  <tr onclick="window.PastiModule.openDetailModal(${r._idx})" class="hover:bg-indigo-50/40 cursor-pointer transition-colors">
                    <td class="py-3 px-3.5 font-mono text-slate-400 font-semibold whitespace-nowrap">${this.escapeHtml(r.no)}</td>
                    <td class="py-3 px-3.5">
                      <div class="font-bold text-slate-900">${this.highlightMatch(r.nama, this.searchQuery)}</div>
                      <div class="text-[10px] text-slate-400">Tgl: ${this.escapeHtml(r.tanggal)}</div>
                    </td>
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${r.jenisCob === 'KBG' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}">
                        ${this.escapeHtml(r.jenisCob)}
                      </span>
                    </td>
                    <td class="py-3 px-3 whitespace-nowrap text-[11px] text-slate-600">
                      ${this.escapeHtml(r.jwAwal)} &rarr; ${this.escapeHtml(r.jwAkhir)}
                    </td>
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold border ${spkmgrCls}">
                        ${this.escapeHtml(r.statusSpkmgr)}
                      </span>
                    </td>
                    <td class="py-3 px-3 whitespace-nowrap">
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${ketBadge.cls}">
                        <i data-lucide="${ketBadge.icon}" class="w-3 h-3"></i>
                        ${this.escapeHtml(ketBadge.label)}
                      </span>
                    </td>
                    <td class="py-3 px-3 whitespace-nowrap">
                      <div class="flex items-center gap-1.5">
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${payBadge.cls}">
                          <i data-lucide="${payBadge.icon}" class="w-3 h-3"></i>
                          ${this.escapeHtml(payBadge.label)}
                        </span>
                        ${r.biayaNum > 0 ? `<span class="text-[11px] font-bold text-rose-700">${this.escapeHtml(r.biayaSpkmgr)}</span>` : ''}
                      </div>
                    </td>
                    <td class="py-3 px-3 whitespace-nowrap font-semibold text-slate-700">${this.highlightMatch(r.namaRm, this.searchQuery)}</td>
                    <td class="py-3 px-3.5 text-center whitespace-nowrap" onclick="event.stopPropagation()">
                      <button onclick="window.PastiModule.openDetailModal(${r._idx})" class="px-2.5 py-1 rounded-lg text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition">
                        Detail
                      </button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderPagination(totalItems, totalPages) {
    const startItem = (this.currentPage - 1) * this.pageSize + 1;
    const endItem = Math.min(totalItems, this.currentPage * this.pageSize);
    return `
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-2xl px-4 py-3 border border-slate-200/80 shadow-sm text-xs">
        <span class="text-slate-500">
          Menampilkan <strong class="text-slate-800">${startItem}–${endItem}</strong> dari <strong class="text-slate-800">${totalItems}</strong> data
        </span>
        <div class="flex items-center gap-1.5">
          <button onclick="window.PastiModule.setPage(${this.currentPage - 1})" ${this.currentPage <= 1 ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition">
            &larr; Sebelumnya
          </button>
          <span class="px-3 py-1.5 font-bold text-slate-700">Hal ${this.currentPage} / ${totalPages}</span>
          <button onclick="window.PastiModule.setPage(${this.currentPage + 1})" ${this.currentPage >= totalPages ? 'disabled' : ''} class="px-3 py-1.5 rounded-lg font-bold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition">
            Berikutnya &rarr;
          </button>
        </div>
      </div>
    `;
  }
};
