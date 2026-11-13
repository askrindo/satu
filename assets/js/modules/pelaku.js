/**
 * Askrindo SATU - PELAKU Module (Perhitungan Laporan Keuangan)
 * Financial Statement & Ratio Analysis Engine for Underwriting, Surety, and Credit Assessment.
 * Full 27-Account Comparative Financial Statement Model (Neraca & Laba Rugi) adopted from ASCA.
 * Integrated with AI Financial Statement Scanner (Gemini Multimodal Vision OCR).
 */

const BUILTIN_GEMINI_API_KEY = (function() {
  try {
    return atob('QVEuQWI4Uk42STE0WTRhNkZkRzduNFZjdzZSWWRJMjVuZGg5bXhnUTYwOGhqMTUxbFFOMEE=');
  } catch (e) {
    return '';
  }
})();

// Daftar 27 Kunci Akun Finansial Standar ASCA / Askrindo
const FIN_ACCOUNT_KEYS = [
  'cash', 'otherCa', 'ar', 'inv', 'otherAr', 'prepaid',
  'fa', 'depr', 'invest', 'taxAsset',
  'ap', 'stDebt', 'otherAp', 'accrued', 'ltDebt',
  'capital', 'otherCap', 'retEarn', 're',
  'rev', 'cogs', 'opex', 'otherInc', 'otherExp', 'intExp', 'tax', 'div'
];

// Konfigurasi Baris Pos-Pos Laporan Keuangan Lengkap Persis ASCA
const FIN_STATEMENT_STRUCTURE = [
  // ==========================================
  // BAGIAN I: URAIAN NERACA - AKTIVA (ASSETS)
  // ==========================================
  { type: 'header', title: 'I. URAIAN NERACA &mdash; AKTIVA (ASSETS)', bg: 'bg-[#002B49] text-white' },
  { type: 'subheader', title: 'A. AKTIVA LANCAR (CURRENT ASSETS)', bg: 'bg-slate-100 text-slate-800 font-bold' },
  { k: 'cash', code: 'a', label: 'Kas & Bank (Kas dan Setara Kas)', section: 'ca' },
  { k: 'otherCa', code: 'a2', label: 'Uang Jaminan / Aset Lancar Lainnya', section: 'ca' },
  { k: 'ar', code: 'b', label: 'Piutang Usaha (Trade Accounts Receivable)', section: 'ca' },
  { k: 'inv', code: 'c', label: 'Persediaan Barang (Inventory)', section: 'ca' },
  { k: 'otherAr', code: 'd', label: 'Piutang Lain-lain', section: 'ca' },
  { k: 'prepaid', code: 'e', label: 'Biaya Dibayar Dimuka (Pekerjaan dlm Proses)', section: 'ca' },
  { type: 'subtotal', code: 'f', label: 'TOTAL AKTIVA LANCAR', id: 'calc_ca', formula: 'ca' },

  { type: 'subheader', title: 'B. AKTIVA TETAP & AKTIVA LAIN-LAIN (NON-CURRENT ASSETS)', bg: 'bg-slate-100 text-slate-800 font-bold' },
  { k: 'fa', code: 'h', label: 'Aktiva Tetap (Fixed Assets)', section: 'nca' },
  { k: 'depr', code: 'i', label: 'Penyusutan (Akumulasi Penyusutan)', isDeduction: true, section: 'nca' },
  { k: 'invest', code: 'g', label: 'Investasi Saham / Piutang Nilai Perolehan', section: 'nca' },
  { k: 'taxAsset', code: 'j', label: 'Other Assets / Aktiva Lain-lain (Termasuk Pajak Tangguhan)', section: 'nca' },
  { type: 'subtotal', code: 'k', label: 'TOTAL AKTIVA TETAP & LAINNYA', id: 'calc_nca', formula: 'nca' },
  { type: 'total', code: 'l', label: 'TOTAL AKTIVA', id: 'calc_ta', formula: 'ta', bg: 'bg-blue-50 text-blue-900 border-y-2 border-blue-300 font-black' },

  // ==========================================
  // BAGIAN II: URAIAN NERACA - PASSIVA
  // ==========================================
  { type: 'header', title: 'II. URAIAN NERACA &mdash; PASSIVA (LIABILITIES & EQUITY)', bg: 'bg-[#002B49] text-white' },
  { type: 'subheader', title: 'A. HUTANG LANCAR / JANGKA PENDEK (CURRENT LIABILITIES)', bg: 'bg-slate-100 text-slate-800 font-bold' },
  { k: 'ap', code: 'm1', label: 'Hutang Usaha (Utang Dagang / Trade AP)', section: 'cl' },
  { k: 'stDebt', code: 'm2', label: 'Hutang Jk. Pendek (Utang Bank Jangka Pendek)', section: 'cl' },
  { k: 'otherAp', code: 'm3', label: 'Hutang Lancar Lainnya (Utang Lain-lain)', section: 'cl' },
  { k: 'accrued', code: 'm4', label: 'Biaya YMH Dibayar (Accrued Expenses)', section: 'cl' },
  { type: 'subtotal', code: 'm', label: 'Hutang Lancar (TOTAL HUTANG LANCAR)', id: 'calc_cl', formula: 'cl' },

  { type: 'subheader', title: 'B. HUTANG JANGKA PANJANG (LONG-TERM LIABILITIES)', bg: 'bg-slate-100 text-slate-800 font-bold' },
  { k: 'ltDebt', code: 'n', label: 'Hutang JK. Panjang (Long-Term Liabilities)', section: 'lt' },
  { type: 'subtotal', code: 'o', label: 'TOTAL HUTANG', id: 'calc_tl', formula: 'tl' },

  { type: 'subheader', title: 'C. MODAL SENDIRI / EKUITAS (EQUITY)', bg: 'bg-slate-100 text-slate-800 font-bold' },
  { k: 'capital', code: 'p', label: 'Modal / Saham (Modal Disetor)', section: 'eq' },
  { k: 'otherCap', code: 'q', label: 'Setoran Modal Lainnya', section: 'eq' },
  { k: 'retEarn', code: 'q1', label: 'Laba (Rugi) Ditahan Periode Lalu', section: 'eq' },
  { k: 're', code: 'q2', label: 'Laba (Rugi) Tahun Berjalan (Total Saldo Laba = q1 + q2)', section: 'eq' },
  { type: 'subtotal', code: 'r', label: 'Modal Sendiri (Equity)', id: 'calc_eq', formula: 'eq' },
  { type: 'total', code: 's', label: 'TOTAL HTNG & MODAL (PASSIVA)', id: 'calc_tlEq', formula: 'passiva', bg: 'bg-blue-50 text-blue-900 border-y-2 border-blue-300 font-black' },

  // ==========================================
  // BAGIAN III: LAPORAN LABA RUGI (INCOME STATEMENT)
  // ==========================================
  { type: 'header', title: 'III. R/L &mdash; LAPORAN LABA RUGI (INCOME STATEMENT)', bg: 'bg-[#002B49] text-white' },
  { k: 'rev', code: 't', label: 'Pendapatan Netto (Sales / Revenue)', section: 'is' },
  { type: 'calc_monthly', code: 't/bln', label: 'Pendapatan Rata-rata Perbulan', id: 'calc_revMo', source: 'rev' },
  { k: 'cogs', code: 'u', label: 'Harga Pokok Produksi / Penjualan (HPP)', section: 'is' },
  { type: 'subtotal', code: 'w', label: 'Laba Kotor (Gross Profit)', id: 'calc_gp', formula: 'gp' },
  { k: 'opex', code: 'v', label: 'Beban Usaha (Biaya Operasional Adm & Umum)', section: 'is' },
  { type: 'subtotal', code: 'v2', label: 'Laba (Rugi) Bruto Operasional', id: 'calc_opBruto', formula: 'opBruto' },
  { k: 'otherInc', code: 'x', label: 'Pendapatan Lain-lain', section: 'is' },
  { k: 'otherExp', code: 'x2', label: 'Beban Lain-lain', section: 'is' },
  { type: 'subtotal', code: 'y1', label: 'Laba (Rugi) Sblm Pjk & Bunga (EBIT)', id: 'calc_ebit', formula: 'ebit' },
  { type: 'calc_monthly', code: 'Y2', label: 'Laba Bersih Rata-rata / Bln Sblm Pajak', id: 'calc_ebitMo', source: 'ebit' },
  { k: 'intExp', code: 'y3', label: 'Biaya Bunga (Interest Expense)', section: 'is' },
  { type: 'subtotal', code: 'y', label: 'Laba (Rugi) Sblm Pajak (EBT)', id: 'calc_ebt', formula: 'ebt' },
  { k: 'tax', code: 'z1', label: 'Pajak Penghasilan (Tax)', section: 'is' },
  { k: 'div', code: 'z2', label: 'Deviden', section: 'is' },
  { type: 'total', code: 'z', label: 'EAT (Laba Bersih)', id: 'calc_eat', formula: 'eat', bg: 'bg-emerald-50 text-emerald-950 border-y-2 border-emerald-300 font-black' },
  { type: 'calc_monthly', code: 'z/bln', label: 'Laba Bersih Rata-rata Perbulan', id: 'calc_eatMo', source: 'eat' }
];

const PELAKU_DRAFT_KEY = 'askrindo_satu_pelaku_draft_v1';

window.PelakuModule = {
  currentTab: 'workspace', // 'workspace' | 'archive'
  archiveSearch: '',
  archiveFilter: 'all', // 'all' | 'rac_pass' | 'rac_fail'
  workspaceState: null,
  formSourceMode: 'sample', // 'sample' | 'blank' | 'saved' | 'dirty' | 'ocr'
  loadedCompanyId: null,
  preAutoMatchState: null,
  autoLoadedCompanyId: null,
  historyBannerMatch: null,
  historyBannerAutoLoaded: false,
  dismissedBannerForId: null,
  lastToastMatchId: null,
  companyLookupTimer: null,
  outsideClickBound: false,
  currentAnalysis: null,
  selectedAiFinFiles: [],
  currentExtractedFinData: null,
  extractedYearsData: null,

  defaultData1: {
    cash: 14200000000, otherCa: 900000000, ar: 23500000000, inv: 18100000000, otherAr: 1200000000, prepaid: 850000000,
    fa: 42000000000, depr: 6500000000, invest: 2500000000, taxAsset: 1500000000,
    ap: 15100000000, stDebt: 19500000000, otherAp: 1800000000, accrued: 2400000000, ltDebt: 18000000000,
    capital: 30000000000, otherCap: 0, retEarn: 4450000000, re: 7000000000,
    rev: 185000000000, cogs: 157250000000, opex: 14800000000, otherInc: 1200000000, otherExp: 450000000, intExp: 3800000000, tax: 2850000000, div: 500000000
  },

  defaultData2: {
    cash: 18500000000, otherCa: 1200000000, ar: 28900000000, inv: 21400000000, otherAr: 1500000000, prepaid: 1100000000,
    fa: 48000000000, depr: 8200000000, invest: 3000000000, taxAsset: 1800000000,
    ap: 17800000000, stDebt: 21000000000, otherAp: 2100000000, accrued: 2800000000, ltDebt: 22500000000,
    capital: 35000000000, otherCap: 0, retEarn: 6950000000, re: 9050000000,
    rev: 224000000000, cogs: 189500000000, opex: 17200000000, otherInc: 1600000000, otherExp: 550000000, intExp: 4200000000, tax: 3550000000, div: 1550000000
  },

  escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  formatDateTimeId(iso) {
    if (!iso) return '-';
    try {
      return new Date(iso).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return String(iso);
    }
  },

  sectorLabel(sec) {
    const map = {
      konstruksi: 'Konstruksi & Infrastruktur',
      perdagangan: 'Perdagangan Besar & Distributor',
      manufaktur: 'Manufaktur & Pabrikasi',
      jasa: 'Jasa & Pengadaan Barang/Jasa (Vendor)'
    };
    return map[sec] || sec || '-';
  },

  buildSampleState() {
    return {
      companyName: 'PT Adhi Bangun Persada',
      sector: 'konstruksi',
      year1: '2024',
      year2: '2025',
      auditStatus: 'audited',
      opinion: 'Wajar Tanpa Pengecualian (WTP)',
      projectVal: 15000000000,
      kapName: 'KAP Tanubrata Sutanto Fahmi Bambang & Rekan (BDO Indonesia)',
      d1: { ...this.defaultData1 },
      d2: { ...this.defaultData2 }
    };
  },

  buildBlankState() {
    const curYr = new Date().getFullYear();
    const blankAcc = {};
    FIN_ACCOUNT_KEYS.forEach(k => { blankAcc[k] = ''; });
    return {
      companyName: '',
      sector: 'konstruksi',
      year1: String(curYr - 1),
      year2: String(curYr),
      auditStatus: 'audited',
      opinion: 'Wajar Tanpa Pengecualian (WTP)',
      projectVal: '',
      kapName: '',
      d1: { ...blankAcc },
      d2: { ...blankAcc }
    };
  },

  initWorkspaceState() {
    if (this.workspaceState) return;
    try {
      const rawDraft = localStorage.getItem(PELAKU_DRAFT_KEY);
      if (rawDraft) {
        const parsed = JSON.parse(rawDraft);
        if (parsed && parsed.workspaceState) {
          this.workspaceState = parsed.workspaceState;
          this.formSourceMode = parsed.formSourceMode || 'sample';
          this.loadedCompanyId = parsed.loadedCompanyId || null;
          if (this.loadedCompanyId) {
            const match = window.askrindoDB?.getPelakuAnalysis(this.loadedCompanyId);
            if (match) {
              this.historyBannerMatch = match;
              this.historyBannerAutoLoaded = true;
            }
          }
          return;
        }
      }
    } catch (e) {}
    this.workspaceState = this.buildSampleState();
    this.formSourceMode = 'sample';
    this.loadedCompanyId = null;
  },

  saveWorkspaceDraft() {
    if (!this.workspaceState) return;
    try {
      localStorage.setItem(PELAKU_DRAFT_KEY, JSON.stringify({
        workspaceState: this.workspaceState,
        formSourceMode: this.formSourceMode,
        loadedCompanyId: this.loadedCompanyId
      }));
    } catch (e) {}
  },

  captureWorkspaceFromDom() {
    const compEl = document.getElementById('pelaku-company');
    if (!compEl) return this.workspaceState;

    const readAcc = (yr) => {
      const obj = {};
      FIN_ACCOUNT_KEYS.forEach(k => {
        const el = document.getElementById(`inp_${k}_${yr}`);
        const raw = el ? el.value.trim() : '';
        obj[k] = raw === '' ? '' : this.parseFormattedNumber(raw);
      });
      return obj;
    };

    const projRaw = document.getElementById('inp_projectValue')?.value.trim() || '';

    return {
      companyName: compEl.value || '',
      sector: document.getElementById('pelaku-sector')?.value || 'konstruksi',
      year1: document.getElementById('inp_year1')?.value || '2024',
      year2: document.getElementById('inp_year2')?.value || '2025',
      auditStatus: document.getElementById('pelaku-audit-status')?.value || 'audited',
      opinion: document.getElementById('pelaku-opinion')?.value || '',
      projectVal: projRaw === '' ? '' : this.parseFormattedNumber(projRaw),
      kapName: document.getElementById('pelaku-kap-name')?.value || '',
      d1: readAcc(1),
      d2: readAcc(2)
    };
  },

  syncWorkspaceFromDom() {
    if (!document.getElementById('pelaku-company')) return;
    this.workspaceState = this.captureWorkspaceFromDom();
    this.saveWorkspaceDraft();
  },

  bindGlobalDropdownClose() {
    if (this.outsideClickBound) return;
    this.outsideClickBound = true;
    document.addEventListener('click', (e) => {
      const wrap = document.getElementById('pelaku-company-autocomplete-wrap');
      const dd = document.getElementById('pelaku-company-dropdown');
      if (dd && wrap && !wrap.contains(e.target)) {
        dd.classList.add('hidden');
      }
    });
  },

  getActiveGeminiApiKey() {
    const custom = (localStorage.getItem('gemini_api_key') || '').trim();
    return custom || BUILTIN_GEMINI_API_KEY;
  },

  // Formatting & Parsing Helpers
  formatNumberWithDots(val, forceDecimals = true) {
    if (val === null || val === undefined || val === '') return '';
    const num = typeof val === 'number' ? val : this.parseFormattedNumber(val);
    if (isNaN(num)) return '';
    const isNeg = num < 0;
    const absNum = Math.abs(num);

    if (forceDecimals) {
      const fixed = absNum.toFixed(2);
      const parts = fixed.split('.');
      const intPart = parts[0];
      const decPart = parts[1];
      const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      const formatted = `${withDots},${decPart}`;
      return isNeg ? `-${formatted}` : formatted;
    } else {
      const intPart = Math.round(absNum).toString();
      const withDots = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      return (isNeg ? '-' : '') + withDots;
    }
  },

  parseFormattedNumber(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    let s = String(val).trim();
    if (!s) return 0;
    const isNeg = s.startsWith('-') || (s.startsWith('(') && s.endsWith(')'));
    s = s.replace(/^[-+(]|[-+)]$/g, '').replace(/^[Rr][Pp]\.?\s*/, '').trim();

    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    let cleanNumStr = '';

    if (lastDot !== -1 && lastComma !== -1) {
      if (lastComma > lastDot) {
        cleanNumStr = s.replace(/\./g, '').replace(',', '.');
      } else {
        cleanNumStr = s.replace(/,/g, '');
      }
    } else if (lastComma !== -1) {
      const commaCount = (s.match(/,/g) || []).length;
      if (commaCount === 1) {
        const parts = s.split(',');
        if (parts[1].length <= 2) {
          cleanNumStr = parts[0].replace(/\D/g, '') + '.' + parts[1];
        } else {
          cleanNumStr = s.replace(/,/g, '');
        }
      } else {
        cleanNumStr = s.replace(/,/g, '');
      }
    } else if (lastDot !== -1) {
      const dotCount = (s.match(/\./g) || []).length;
      if (dotCount === 1) {
        const parts = s.split('.');
        if (parts[1].length === 3 && parts[0].length >= 1) {
          cleanNumStr = parts[0].replace(/\D/g, '');
        } else {
          cleanNumStr = parts[0].replace(/\D/g, '') + '.' + parts[1];
        }
      } else {
        cleanNumStr = s.replace(/\./g, '');
      }
    } else {
      cleanNumStr = s.replace(/\D/g, '');
    }

    const num = parseFloat(cleanNumStr) || 0;
    return isNeg ? -num : num;
  },

  fmtRp(val, compact = false) {
    if (val === null || val === undefined || isNaN(val)) return 'Rp 0,00';
    const neg = val < 0;
    const abs = Math.abs(val);
    if (compact) {
      if (abs >= 1e12) return `${neg ? '-' : ''}Rp ${(abs / 1e12).toFixed(2).replace('.', ',')} T`;
      if (abs >= 1e9) return `${neg ? '-' : ''}Rp ${(abs / 1e9).toFixed(2).replace('.', ',')} M`;
      if (abs >= 1e6) return `${neg ? '-' : ''}Rp ${(abs / 1e6).toFixed(2).replace('.', ',')} Jt`;
    }
    const formatted = this.formatNumberWithDots(abs, true);
    return neg ? `(Rp ${formatted})` : `Rp ${formatted}`;
  },

  fmtNum(val, dec = 2) {
    if (val === null || val === undefined || isNaN(val)) return '0,00';
    return Number(val).toFixed(dec).replace('.', ',');
  },

  handleDotInput(inputEl) {
    if (!inputEl) return;
    const raw = inputEl.value;
    const isNeg = raw.trim().startsWith('-');
    const clean = raw.replace(/[^\d.,]/g, '');

    let parts = clean.split(',');
    if (parts.length > 2) {
      parts = [parts[0], parts.slice(1).join('')];
    }

    let intStr = parts[0].replace(/\D/g, '');
    let decStr = parts.length > 1 ? parts[1].replace(/\D/g, '').slice(0, 2) : null;

    if (!intStr && decStr === null) {
      inputEl.value = isNeg ? '-' : '';
      return;
    }

    const cleanInt = intStr.replace(/^0+(?=\d)/, '');
    const withDots = (cleanInt || (decStr !== null ? '0' : '')).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    let formatted = (isNeg ? '-' : '') + withDots;
    if (decStr !== null) {
      formatted += ',' + decStr;
    }
    inputEl.value = formatted;
  },

  handleDotBlur(inputEl) {
    if (!inputEl) return;
    const val = inputEl.value.trim();
    if (val === '' || val === '-') {
      inputEl.value = '';
      return;
    }
    const num = this.parseFormattedNumber(val);
    inputEl.value = this.formatNumberWithDots(num, true);
  },

  render() {
    const user = window.authService.getCurrentUser();
    if (!user || !window.authService.hasAccess('pelaku')) {
      return window.askrindoApp.renderUnauthorized('PELAKU');
    }

    this.initWorkspaceState();
    this.bindGlobalDropdownClose();

    const savedList = window.askrindoDB ? window.askrindoDB.getPelakuAnalyses() : [];
    const savedCount = savedList.length;
    const ws = this.workspaceState;
    const projFormatted = (ws.projectVal === '' || ws.projectVal === null || ws.projectVal === undefined)
      ? ''
      : this.formatNumberWithDots(ws.projectVal, false);

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Module Header with Tabs & Actions -->
        <div class="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4 border-l-4 border-l-purple-600">
          <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20 shrink-0">
                <i data-lucide="calculator" class="w-6 h-6"></i>
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h1 class="text-2xl font-black text-slate-800 tracking-tight">PELAKU</h1>
                  <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    Perhitungan Laporan Keuangan
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm flex items-center gap-1">
                    <i data-lucide="sparkles" class="w-3 h-3"></i> AI OCR Vision
                  </span>
                </div>
                <p class="text-xs text-slate-500 mt-0.5">
                  Model Finansial 27 Pos Komparatif (ASCA) &amp; Matriks RAC Askrindo &bull; Arsip otomatis terindeks per Nama Perusahaan.
                </p>
              </div>
            </div>

            <!-- Navigation Tabs & Workspace Quick Actions -->
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Mode Tabs -->
              <div class="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <button onclick="window.PelakuModule.setTab('workspace')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${this.currentTab === 'workspace' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
                  <i data-lucide="file-spreadsheet" class="w-3.5 h-3.5"></i>
                  <span>Lembar Analisa</span>
                </button>
                <button onclick="window.PelakuModule.setTab('archive')" class="px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${this.currentTab === 'archive' ? 'bg-purple-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}">
                  <i data-lucide="folder-archive" class="w-3.5 h-3.5"></i>
                  <span>Arsip Perusahaan</span>
                  <span id="pelaku-archive-count-badge" class="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${this.currentTab === 'archive' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'}">${savedCount}</span>
                </button>
              </div>

              ${this.currentTab === 'workspace' ? `
                <button onclick="window.PelakuModule.startNewAnalysis()" class="px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition flex items-center gap-1.5" title="Mulai analisa perusahaan baru (form bersih)">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i>
                  <span>Analisa Baru</span>
                </button>
                <button id="btn-pelaku-save-top" onclick="window.PelakuModule.saveCurrentAnalysis()" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5" title="Simpan analisa ke arsip perusahaan (Ctrl+S)">
                  <i data-lucide="save" class="w-4 h-4"></i>
                  <span>Simpan Analisa</span>
                </button>
                <button onclick="window.PelakuModule.openAiFinUploadModal()" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-indigo-700 shadow-md shadow-purple-500/25 transition flex items-center gap-1.5 group">
                  <i data-lucide="scan-line" class="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform"></i>
                  <span>Pindai AI OCR Vision</span>
                </button>
                <button onclick="window.PelakuModule.loadSampleData()" class="px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition" title="Muat Data Contoh Konstruksi 27 Pos">
                  Contoh
                </button>
                <button onclick="window.PelakuModule.resetForm()" class="px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition" title="Kosongkan angka pada form">
                  Kosongkan
                </button>
              ` : `
                <button onclick="window.PelakuModule.startNewAnalysis()" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-md shadow-purple-500/20 transition flex items-center gap-1.5">
                  <i data-lucide="plus-circle" class="w-4 h-4"></i>
                  <span>+ Buat Analisa Baru</span>
                </button>
              `}
            </div>
          </div>
        </div>

        ${this.currentTab === 'archive' ? this.renderArchiveView(savedList) : `
          <!-- Banner Keseimbangan Neraca (Real-Time Balance Bar) -->
          <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#002B49] text-white p-4 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-4 flex-wrap">
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-300 font-semibold">Status Neraca Th <span id="lbl_balance_yr1" class="font-bold text-amber-300">${this.escapeHtml(ws.year1)}</span>:</span>
                <span id="badge_balance_yr1" class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  &check; BALANCE
                </span>
              </div>
              <div class="h-4 w-px bg-slate-700 hidden sm:block"></div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-300 font-semibold">Status Neraca Th <span id="lbl_balance_yr2" class="font-bold text-amber-300">${this.escapeHtml(ws.year2)}</span>:</span>
                <span id="badge_balance_yr2" class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  &check; BALANCE
                </span>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="window.PelakuModule.autoBalanceAllYears()" class="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 transition flex items-center gap-1.5">
                <i data-lucide="scale" class="w-3.5 h-3.5"></i>
                <span>Seimbangkan Neraca Otomatis</span>
              </button>
            </div>
          </div>

          <!-- Layout Utama: 8 Kolom Tabel Finansial & 4 Kolom Panel Scoring Underwriting -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- Kolom Kiri: Tabel 27 Pos Laporan Keuangan Lengkap ASCA (8 cols) -->
            <div class="lg:col-span-8 space-y-6">
              
              <!-- Card 1: Identitas Calon Debitur / Rekanan Penjaminan -->
              <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div class="flex items-center justify-between flex-wrap gap-2">
                  <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <i data-lucide="building" class="w-4 h-4 text-purple-600"></i>
                    <span>1. Profil Calon Debitur / Rekanan Penjaminan</span>
                  </h3>
                  <span class="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                    Nama Perusahaan = ID Otomatis
                  </span>
                </div>

                <!-- Baris 1: Nama Perusahaan Rekanan (Full Width) -->
                <div id="pelaku-company-autocomplete-wrap" class="relative text-xs">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <label for="pelaku-company" class="font-semibold text-slate-700">Nama Perusahaan / Rekanan <span class="text-purple-600 font-bold">(ID)</span></label>
                    <span id="pelaku-company-id-badge" class="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[180px]">
                      ID: -
                    </span>
                  </div>
                  <div class="relative">
                    <input
                      type="text"
                      id="pelaku-company"
                      value="${this.escapeHtml(ws.companyName)}"
                      placeholder="Ketik Nama Perusahaan (jika pernah dibuat, data otomatis muncul)..."
                      autocomplete="off"
                      onfocus="window.PelakuModule.openCompanyAutocomplete()"
                      oninput="window.PelakuModule.handleCompanyInput(this.value)"
                      onblur="window.PelakuModule.handleCompanyBlur()"
                      onkeydown="window.PelakuModule.handleCompanyKeydown(event)"
                      class="w-full pl-3 pr-9 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 font-semibold text-slate-800 bg-white"
                    />
                    <button
                      type="button"
                      onmousedown="event.preventDefault(); window.PelakuModule.toggleCompanyAutocomplete();"
                      title="Lihat daftar perusahaan tersimpan"
                      class="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg text-slate-400 hover:text-purple-700 hover:bg-purple-50 flex items-center justify-center transition"
                    >
                      <i data-lucide="chevron-down" class="w-4 h-4"></i>
                    </button>
                  </div>
                  <!-- Smart Company Autocomplete Dropdown -->
                  <div id="pelaku-company-dropdown" class="hidden absolute left-0 right-0 mt-1.5 bg-white rounded-2xl border border-slate-200 shadow-2xl z-40 max-h-64 overflow-y-auto divide-y divide-slate-100"></div>
                </div>

                <!-- Dynamic Inline Banner when Existing Company ID is Detected -->
                <div id="pelaku-company-history-banner" class="hidden"></div>

                <!-- Baris 2: Periode Finansial, Status Audit & Nilai Proyek -->
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Tahun 1 (Sebelumnya)</label>
                    <input type="number" id="inp_year1" value="${this.escapeHtml(ws.year1)}" oninput="window.PelakuModule.updateYearLabels(); window.PelakuModule.onMetaFieldChanged();" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-center font-bold font-mono focus:border-purple-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Tahun 2 (Terakhir)</label>
                    <input type="number" id="inp_year2" value="${this.escapeHtml(ws.year2)}" oninput="window.PelakuModule.updateYearLabels(); window.PelakuModule.onMetaFieldChanged();" class="w-full px-3 py-2 rounded-xl border border-slate-200 text-center font-bold font-mono focus:border-purple-500 focus:outline-none bg-white" />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Status Audit</label>
                    <select id="pelaku-audit-status" onchange="window.PelakuModule.onMetaFieldChanged()" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:border-purple-500 focus:outline-none">
                      <option value="audited" ${ws.auditStatus === 'audited' ? 'selected' : ''}>Audited KAP</option>
                      <option value="unaudited" ${ws.auditStatus === 'unaudited' ? 'selected' : ''}>In-House / Unaudited</option>
                    </select>
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Nilai Proyek yang Dijamin (Rp)</label>
                    <input type="text" id="inp_projectValue" value="${projFormatted}" oninput="window.PelakuModule.handleDotInput(this); window.PelakuModule.onMetaFieldChanged();" onblur="window.PelakuModule.handleDotBlur(this); window.PelakuModule.calculateRatios();" class="w-full px-3 py-2 rounded-xl border border-purple-200 font-bold font-mono focus:border-purple-500 focus:outline-none bg-white" placeholder="Contoh: 15.000.000.000" />
                  </div>
                </div>
              </div>

              <!-- Card 2: Tabel Pos-Pos Laporan Keuangan Lengkap 27 Akun (Persis ASCA) -->
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <i data-lucide="table-2" class="w-4 h-4 text-purple-600"></i>
                      <span>2. Tabel Neraca &amp; Laba Rugi Komparatif 2 Tahun (Standar ASCA)</span>
                    </h3>
                    <p class="text-[11px] text-slate-500">
                      Masukkan nilai dalam Rupiah penuh (contoh: <code>14.200.000.000</code>). Subtotal, rasio common-size %, dan pertumbuhan otomatis dihitung.
                    </p>
                  </div>
                  <span class="text-[10px] font-mono text-slate-400 bg-white px-2 py-1 rounded border border-slate-200 self-start sm:self-auto">
                    Format: IDR
                  </span>
                </div>

                <!-- Kontainer Tabel Komparatif -->
                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs border-collapse" id="finStatementInputTable">
                    <thead>
                      <tr class="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                        <th class="p-2.5 w-[35%]">Uraian Neraca &amp; Laba Rugi</th>
                        <th class="p-2.5 w-[7%] text-center">Kode</th>
                        <th class="p-2.5 w-[20%] text-right">Tahun <span id="thLabelYear1" class="font-bold">${this.escapeHtml(ws.year1)}</span> (Rp)</th>
                        <th class="p-2.5 w-[7%] text-right">%</th>
                        <th class="p-2.5 w-[20%] text-right">Tahun <span id="thLabelYear2" class="font-bold">${this.escapeHtml(ws.year2)}</span> (Rp)</th>
                        <th class="p-2.5 w-[7%] text-right">%</th>
                        <th class="p-2.5 w-[9%] text-right">Growth (%)</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      ${this.renderFinStatementTableRows()}
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Card 3: Matriks Kepatuhan Standar Risk Acceptance Criteria (RAC) Askrindo -->
              <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <i data-lucide="shield-check" class="w-4 h-4 text-purple-600"></i>
                      <span>3. Matriks Kepatuhan Standar Risk Acceptance Criteria (RAC) Askrindo</span>
                    </h3>
                    <p class="text-[11px] text-slate-500">
                      Evaluasi Rasio Utama Akseptasi Penjaminan Proyek &amp; Kredit: <strong>Current Ratio (CR &ge; 100,00%)</strong> sebagai indikator tunggal kelayakan likuiditas.
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <span id="badge_rac_pass_count" class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      1 RAC LULUS
                    </span>
                    <span id="badge_rac_fail_count" class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      0 TIDAK LULUS
                    </span>
                  </div>
                </div>

                <div class="overflow-x-auto">
                  <table class="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr class="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                        <th class="py-2.5 px-3 w-[5%] text-center">No</th>
                        <th class="py-2.5 px-3 w-[20%]">Indikator Rasio Utama</th>
                        <th class="py-2.5 px-3 w-[18%]">Rumus Perhitungan</th>
                        <th class="py-2.5 px-2 w-[12%] text-center">Standar <span class="underline decoration-dotted">RAC</span></th>
                        <th class="py-2.5 px-2 w-[11%] text-center">Tahun <span id="thRacYear1">${this.escapeHtml(ws.year1)}</span></th>
                        <th class="py-2.5 px-2 w-[13%] text-center text-emerald-900 bg-emerald-50/70">Tahun <span id="thRacYear2">${this.escapeHtml(ws.year2)}</span> (Eval)</th>
                        <th class="py-2.5 px-2 w-[10%] text-center">Status <span class="underline decoration-dotted">RAC</span></th>
                        <th class="py-2.5 px-3 w-[21%]">Analisis &amp; Keterangan Komparasi</th>
                      </tr>
                    </thead>
                    <tbody id="racTableBody" class="divide-y divide-slate-100 font-sans">
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Kolom Kanan: Scoring & Evaluasi Underwriting Askrindo (4 cols, Sticky) -->
            <div class="lg:col-span-4 space-y-6">
              <div class="sticky top-20 bg-white rounded-3xl p-6 border-2 border-purple-500/20 shadow-xl space-y-5">
                
                <!-- Header Score -->
                <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-purple-600">Evaluasi Finansial Askrindo</span>
                    <h3 class="text-base font-black text-slate-800">Scoring &amp; Kelayakan Rekanan</h3>
                  </div>
                  <div id="pelaku-grade-badge" class="px-3.5 py-1.5 rounded-xl font-black text-xs bg-emerald-100 text-emerald-800 border border-emerald-300">
                    GRADE A (SEHAT)
                  </div>
                </div>

                <!-- Composite Score Banner -->
                <div class="p-5 rounded-2xl bg-gradient-to-br from-[#002B49] via-indigo-900 to-[#0A3D62] text-white shadow-lg space-y-2">
                  <div class="flex items-center justify-between text-xs text-indigo-200">
                    <span>Skor Finansial Komposit:</span>
                    <span id="pelaku-score-num" class="font-mono font-bold text-amber-300 text-sm">88.5 / 100</span>
                  </div>
                  <div class="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div id="pelaku-score-bar" class="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full" style="width: 88.5%;"></div>
                  </div>
                  <p id="pelaku-short-summary" class="text-[11px] text-slate-200 pt-1 leading-relaxed">
                    Perusahaan memiliki struktur permodalan yang sehat dan likuiditas lancar untuk mendukung proyek penjaminan.
                  </p>
                </div>

                <!-- Ratio Breakdown -->
                <div class="space-y-3 text-xs">
                  <h4 class="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>Indikator Rasio Utama (Th <span id="lbl_ratio_eval_yr">${this.escapeHtml(ws.year2)}</span>)</span>
                    <span class="text-[10px] font-normal text-slate-400">Standar Askrindo</span>
                  </h4>

                  <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span class="font-semibold text-slate-700">Current Ratio (Likuiditas)</span>
                      <span class="block text-[10px] text-slate-400">Standar: &ge; 120%</span>
                    </div>
                    <span id="ratio-cr" class="font-mono font-bold text-emerald-600 text-sm">166.13%</span>
                  </div>

                  <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span class="font-semibold text-slate-700">Quick Ratio (Acid Test)</span>
                      <span class="block text-[10px] text-slate-400">Standar: &ge; 100%</span>
                    </div>
                    <span id="ratio-qr" class="font-mono font-bold text-emerald-600 text-sm">111.90%</span>
                  </div>

                  <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span class="font-semibold text-slate-700">Cash Ratio (Kas/Hutang Lancar)</span>
                      <span class="block text-[10px] text-slate-400">Ketersediaan kas cepat</span>
                    </div>
                    <span id="ratio-cash" class="font-mono font-bold text-slate-800 text-sm">42.33%</span>
                  </div>

                  <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span class="font-semibold text-slate-700">Debt to Equity (DER)</span>
                      <span class="block text-[10px] text-slate-400">Batas maks: &lt; 2.50x</span>
                    </div>
                    <span id="ratio-der" class="font-mono font-bold text-slate-800 text-sm">1.30x</span>
                  </div>

                  <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span class="font-semibold text-slate-700">Debt to Asset Ratio (DAR)</span>
                      <span class="block text-[10px] text-slate-400">Porsi hutang atas aset</span>
                    </div>
                    <span id="ratio-dar" class="font-mono font-bold text-slate-800 text-sm">56.48%</span>
                  </div>

                  <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span class="font-semibold text-slate-700">Net Profit Margin (NPM)</span>
                      <span class="block text-[10px] text-slate-400">Margin laba bersih</span>
                    </div>
                    <span id="ratio-npm" class="font-mono font-bold text-blue-600 text-sm">4.04%</span>
                  </div>

                  <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span class="font-semibold text-slate-700">Return on Equity (ROE)</span>
                      <span class="block text-[10px] text-slate-400">Imbal hasil modal</span>
                    </div>
                    <span id="ratio-roe" class="font-mono font-bold text-purple-600 text-sm">17.75%</span>
                  </div>

                  <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span class="font-semibold text-slate-700">Pertumbuhan Penjualan</span>
                      <span class="block text-[10px] text-slate-400">Growth Omset (YoY)</span>
                    </div>
                    <span id="ratio-sales-growth" class="font-mono font-bold text-emerald-600 text-sm">+21.08%</span>
                  </div>

                  <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <div>
                      <span class="font-semibold text-slate-700">Pertumbuhan Laba Bersih</span>
                      <span class="block text-[10px] text-slate-400">Growth EAT (YoY)</span>
                    </div>
                    <span id="ratio-net-growth" class="font-mono font-bold text-emerald-600 text-sm">+29.29%</span>
                  </div>
                </div>

                <!-- Rekomendasi Narasi Underwriting Askrindo -->
                <div class="p-4 rounded-2xl bg-purple-50 border border-purple-200/70 space-y-2">
                  <span class="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <i data-lucide="shield-check" class="w-4 h-4 text-purple-600"></i>
                    Rekomendasi Komite Underwriting
                  </span>
                  <p id="pelaku-narrative" class="text-xs text-slate-700 leading-relaxed font-medium">
                    Rekanan memenuhi seluruh parameter underwriting penjaminan kredit &amp; surety bond Askrindo. Layak diberikan persetujuan.
                  </p>
                </div>

                <!-- Save Status Strip -->
                <div id="pelaku-save-status-strip" class="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
                  <span class="text-slate-500 font-medium">Status Arsip:</span>
                  <span id="pelaku-save-status-text" class="font-bold text-slate-700">Belum disimpan</span>
                </div>

                <!-- Tombol Aksi -->
                <div class="space-y-2">
                  <button id="btn-pelaku-save-side" onclick="window.PelakuModule.saveCurrentAnalysis()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/25 transition">
                    <i data-lucide="save" class="w-4 h-4"></i>
                    <span>Simpan Analisa Perusahaan</span>
                  </button>
                  <button onclick="window.PelakuModule.printAnalysis()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/30 transition">
                    <i data-lucide="printer" class="w-4 h-4"></i>
                    <span>Cetak Hasil Evaluasi PDF</span>
                  </button>
                  <button onclick="window.location.hash='#/buset'" class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs text-slate-600 hover:bg-slate-100 transition border border-slate-200">
                    <i data-lucide="file-text" class="w-4 h-4"></i>
                    <span>Teruskan ke SPPA BUSET</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        `}

        <!-- Print & Modal Containers -->
        <div id="pelaku-modal-container"></div>
      </div>
    `;
  },

  renderFinStatementTableRows() {
    return FIN_STATEMENT_STRUCTURE.map((row) => {
      if (row.type === 'header') {
        return `
          <tr class="${row.bg}">
            <td colspan="7" class="py-2.5 px-3 text-xs font-extrabold uppercase tracking-wide">
              ${row.title}
            </td>
          </tr>
        `;
      }
      if (row.type === 'subheader') {
        return `
          <tr class="${row.bg}">
            <td colspan="7" class="py-1.5 px-3 text-[11px] font-bold uppercase tracking-wide">
              ${row.title}
            </td>
          </tr>
        `;
      }
      if (row.type === 'subtotal' || row.type === 'total') {
        const isTotal = row.type === 'total';
        const cls = row.bg || (isTotal ? 'bg-blue-100/70 text-blue-950 font-black' : 'bg-slate-100 font-bold text-slate-800');
        return `
          <tr class="${cls} border-t border-b border-slate-200">
            <td class="py-2 px-3 text-xs uppercase tracking-wide font-extrabold">
              ${row.label}
            </td>
            <td class="py-2 px-1 text-center font-mono font-bold text-xs text-purple-700">
              ${row.code}
            </td>
            <td class="py-2 px-2 text-right font-mono font-extrabold text-xs" id="${row.id}_1">
              0,00
            </td>
            <td class="py-2 px-1 text-right font-mono text-[11px] font-bold text-slate-600" id="pct_${row.id}_1">
              -
            </td>
            <td class="py-2 px-2 text-right font-mono font-extrabold text-xs" id="${row.id}_2">
              0,00
            </td>
            <td class="py-2 px-1 text-right font-mono text-[11px] font-bold text-slate-600" id="pct_${row.id}_2">
              -
            </td>
            <td class="py-2 px-2 text-right font-mono text-[11px] font-bold" id="grw_${row.id}">
              -
            </td>
          </tr>
        `;
      }
      if (row.type === 'calc_monthly') {
        return `
          <tr class="bg-slate-50/70 italic text-slate-600 text-[11px]">
            <td class="py-1.5 px-3">
              ${row.label}
            </td>
            <td class="py-1.5 px-1 text-center font-mono font-semibold text-slate-400">
              ${row.code}
            </td>
            <td class="py-1.5 px-2 text-right font-mono" id="${row.id}_1">
              0,00
            </td>
            <td class="py-1.5 px-1 text-right font-mono text-slate-400">
              8,3%
            </td>
            <td class="py-1.5 px-2 text-right font-mono" id="${row.id}_2">
              0,00
            </td>
            <td class="py-1.5 px-1 text-right font-mono text-slate-400">
              8,3%
            </td>
            <td class="py-1.5 px-2 text-right font-mono font-semibold" id="grw_${row.id}">
              -
            </td>
          </tr>
        `;
      }

      // Baris Input Akun Finansial (a, b, c, ... z1, z2)
      const ws = this.workspaceState || this.buildSampleState();
      const val1 = ws.d1?.[row.k];
      const val2 = ws.d2?.[row.k];
      const strVal1 = (val1 === '' || val1 === null || val1 === undefined) ? '' : this.formatNumberWithDots(val1, true);
      const strVal2 = (val2 === '' || val2 === null || val2 === undefined) ? '' : this.formatNumberWithDots(val2, true);
      return `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
          <td class="py-1 px-3 text-slate-700 text-xs font-medium">
            ${row.label}
          </td>
          <td class="py-1 px-1 text-center font-mono font-bold text-[11px] text-slate-500 bg-slate-50/40">
            ${row.code}
          </td>
          <td class="py-1 px-2">
            <input type="text" id="inp_${row.k}_1" value="${strVal1}" oninput="window.PelakuModule.handleDotInput(this); window.PelakuModule.onFinancialInputChanged();" onblur="window.PelakuModule.handleDotBlur(this); window.PelakuModule.calculateRatios();" class="w-full px-2 py-1 rounded-lg border border-slate-200 text-right font-mono text-xs font-semibold focus:border-purple-500 focus:outline-none bg-white" placeholder="0,00" />
          </td>
          <td class="py-1 px-1 text-right font-mono text-[11px] text-slate-500" id="pct_${row.k}_1">
            -
          </td>
          <td class="py-1 px-2">
            <input type="text" id="inp_${row.k}_2" value="${strVal2}" oninput="window.PelakuModule.handleDotInput(this); window.PelakuModule.onFinancialInputChanged();" onblur="window.PelakuModule.handleDotBlur(this); window.PelakuModule.calculateRatios();" class="w-full px-2 py-1 rounded-lg border border-slate-200 text-right font-mono text-xs font-semibold focus:border-purple-500 focus:outline-none bg-white" placeholder="0,00" />
          </td>
          <td class="py-1 px-1 text-right font-mono text-[11px] text-slate-500" id="pct_${row.k}_2">
            -
          </td>
          <td class="py-1 px-2 text-right font-mono text-[11px] font-bold" id="grw_${row.k}">
            -
          </td>
        </tr>
      `;
    }).join('');
  },

  updateYearLabels() {
    const y1 = document.getElementById('inp_year1')?.value || '2024';
    const y2 = document.getElementById('inp_year2')?.value || '2025';

    const th1 = document.getElementById('thLabelYear1');
    const th2 = document.getElementById('thLabelYear2');
    const b1 = document.getElementById('lbl_balance_yr1');
    const b2 = document.getElementById('lbl_balance_yr2');
    const rEval = document.getElementById('lbl_ratio_eval_yr');

    if (th1) th1.textContent = y1;
    if (th2) th2.textContent = y2;
    if (b1) b1.textContent = y1;
    if (b2) b2.textContent = y2;
    if (rEval) rEval.textContent = y2;
  },

  calculateRatios() {
    // Jangan timpa state saat tab arsip aktif (elemen input tidak dirender)
    if (!document.getElementById('pelaku-company') || !document.getElementById('finStatementInputTable')) {
      return;
    }

    const getVal = (k, yr) => this.parseFormattedNumber(document.getElementById(`inp_${k}_${yr}`)?.value) || 0;

    const y1 = document.getElementById('inp_year1')?.value || '2024';
    const y2 = document.getElementById('inp_year2')?.value || '2025';

    // 1. Hitung Subtotal Neraca & Laba Rugi untuk Kedua Tahun
    const d1 = {};
    const d2 = {};
    FIN_ACCOUNT_KEYS.forEach(k => {
      d1[k] = getVal(k, 1);
      d2[k] = getVal(k, 2);
    });

    // Tahun 1
    const ca1 = d1.cash + d1.otherCa + d1.ar + d1.inv + d1.otherAr + d1.prepaid;
    const nca1 = (d1.fa - Math.abs(d1.depr)) + d1.invest + d1.taxAsset;
    const ta1 = ca1 + nca1;
    const cl1 = d1.ap + d1.stDebt + d1.otherAp + d1.accrued;
    const lt1 = d1.ltDebt;
    const tl1 = cl1 + lt1;
    const eq1 = d1.capital + d1.otherCap + d1.retEarn + d1.re;
    const pass1 = tl1 + eq1;

    const rev1 = d1.rev;
    const revMo1 = rev1 / 12;
    const gp1 = rev1 - d1.cogs;
    const opBruto1 = gp1 - d1.opex;
    const ebit1 = opBruto1 + d1.otherInc - d1.otherExp;
    const ebitMo1 = ebit1 / 12;
    const ebt1 = ebit1 - d1.intExp;
    const eat1 = d1.re !== 0 && d1.rev === 0 ? d1.re : (ebt1 - d1.tax - d1.div);
    const eatMo1 = eat1 / 12;

    // Tahun 2
    const ca2 = d2.cash + d2.otherCa + d2.ar + d2.inv + d2.otherAr + d2.prepaid;
    const nca2 = (d2.fa - Math.abs(d2.depr)) + d2.invest + d2.taxAsset;
    const ta2 = ca2 + nca2;
    const cl2 = d2.ap + d2.stDebt + d2.otherAp + d2.accrued;
    const lt2 = d2.ltDebt;
    const tl2 = cl2 + lt2;
    const eq2 = d2.capital + d2.otherCap + d2.retEarn + d2.re;
    const pass2 = tl2 + eq2;

    const rev2 = d2.rev;
    const revMo2 = rev2 / 12;
    const gp2 = rev2 - d2.cogs;
    const opBruto2 = gp2 - d2.opex;
    const ebit2 = opBruto2 + d2.otherInc - d2.otherExp;
    const ebitMo2 = ebit2 / 12;
    const ebt2 = ebit2 - d2.intExp;
    const eat2 = d2.re !== 0 && d2.rev === 0 ? d2.re : (ebt2 - d2.tax - d2.div);
    const eatMo2 = eat2 / 12;

    // Update Subtotals Display di Tabel
    const setCalc = (id, v1, v2) => {
      const el1 = document.getElementById(`${id}_1`);
      const el2 = document.getElementById(`${id}_2`);
      if (el1) el1.textContent = this.formatNumberWithDots(v1, true);
      if (el2) el2.textContent = this.formatNumberWithDots(v2, true);
    };

    setCalc('calc_ca', ca1, ca2);
    setCalc('calc_nca', nca1, nca2);
    setCalc('calc_ta', ta1, ta2);
    setCalc('calc_cl', cl1, cl2);
    setCalc('calc_tl', tl1, tl2);
    setCalc('calc_eq', eq1, eq2);
    setCalc('calc_tlEq', pass1, pass2);

    setCalc('calc_revMo', revMo1, revMo2);
    setCalc('calc_gp', gp1, gp2);
    setCalc('calc_opBruto', opBruto1, opBruto2);
    setCalc('calc_ebit', ebit1, ebit2);
    setCalc('calc_ebitMo', ebitMo1, ebitMo2);
    setCalc('calc_ebt', ebt1, ebt2);
    setCalc('calc_eat', eat1, eat2);
    setCalc('calc_eatMo', eatMo1, eatMo2);

    // 2. Update Persentase Common Size % & Growth %
    const setPct = (id, v1, base1, v2, base2) => {
      const el1 = document.getElementById(`pct_${id}_1`);
      const el2 = document.getElementById(`pct_${id}_2`);
      if (el1) {
        const p1 = base1 > 0 ? (v1 / base1) * 100 : 0;
        el1.textContent = p1.toFixed(1).replace('.', ',') + '%';
      }
      if (el2) {
        const p2 = base2 > 0 ? (v2 / base2) * 100 : 0;
        el2.textContent = p2.toFixed(1).replace('.', ',') + '%';
      }
    };

    const setGrw = (id, v1, v2) => {
      const el = document.getElementById(`grw_${id}`);
      if (!el) return;
      if (v1 === 0 && v2 === 0) {
        el.textContent = '0,0%';
        el.className = 'py-1 px-2 text-right font-mono text-[11px] font-bold text-slate-400';
        return;
      }
      if (v1 === 0) {
        el.textContent = 'N/A';
        el.className = 'py-1 px-2 text-right font-mono text-[11px] font-bold text-slate-400';
        return;
      }
      const g = ((v2 - v1) / Math.abs(v1)) * 100;
      const sign = g > 0 ? '+' : '';
      el.textContent = sign + g.toFixed(1).replace('.', ',') + '%';
      el.className = `py-1 px-2 text-right font-mono text-[11px] font-bold ${g >= 0 ? 'text-emerald-600' : 'text-rose-600'}`;
    };

    // Subtotal Persentase
    setPct('calc_ca', ca1, ta1, ca2, ta2);
    setPct('calc_nca', nca1, ta1, nca2, ta2);
    setPct('calc_ta', ta1, ta1, ta2, ta2);
    setPct('calc_cl', cl1, pass1, cl2, pass2);
    setPct('calc_tl', tl1, pass1, tl2, pass2);
    setPct('calc_eq', eq1, pass1, eq2, pass2);
    setPct('calc_tlEq', pass1, pass1, pass2, pass2);

    setPct('calc_gp', gp1, rev1, gp2, rev2);
    setPct('calc_opBruto', opBruto1, rev1, opBruto2, rev2);
    setPct('calc_ebit', ebit1, rev1, ebit2, rev2);
    setPct('calc_ebt', ebt1, rev1, ebt2, rev2);
    setPct('calc_eat', eat1, rev1, eat2, rev2);

    // Subtotal Growth
    setGrw('calc_ca', ca1, ca2);
    setGrw('calc_nca', nca1, nca2);
    setGrw('calc_ta', ta1, ta2);
    setGrw('calc_cl', cl1, cl2);
    setGrw('calc_tl', tl1, tl2);
    setGrw('calc_eq', eq1, eq2);
    setGrw('calc_tlEq', pass1, pass2);
    setGrw('calc_revMo', revMo1, revMo2);
    setGrw('calc_gp', gp1, gp2);
    setGrw('calc_opBruto', opBruto1, opBruto2);
    setGrw('calc_ebit', ebit1, ebit2);
    setGrw('calc_ebitMo', ebitMo1, ebitMo2);
    setGrw('calc_ebt', ebt1, ebt2);
    setGrw('calc_eat', eat1, eat2);
    setGrw('calc_eatMo', eatMo1, eatMo2);

    // Masing-masing akun (Aktiva vs Total Aktiva, Hutang/Ekuitas vs Total Passiva, Laba Rugi vs Penjualan)
    FIN_STATEMENT_STRUCTURE.forEach(r => {
      if (!r.k) return;
      const v1 = d1[r.k];
      const v2 = d2[r.k];
      const base1 = (r.section === 'ca' || r.section === 'nca') ? ta1 : (r.section === 'is' ? rev1 : pass1);
      const base2 = (r.section === 'ca' || r.section === 'nca') ? ta2 : (r.section === 'is' ? rev2 : pass2);
      setPct(r.k, v1, base1, v2, base2);
      setGrw(r.k, v1, v2);
    });

    // 3. Balance Indicator Neraca
    const diff1 = Math.abs(ta1 - pass1);
    const diff2 = Math.abs(ta2 - pass2);
    const isBal1 = diff1 < 1.0;
    const isBal2 = diff2 < 1.0;

    const b1 = document.getElementById('badge_balance_yr1');
    const b2 = document.getElementById('badge_balance_yr2');
    if (b1) {
      b1.className = `px-2.5 py-1 rounded-full text-xs font-bold ${isBal1 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/25 text-rose-300 border border-rose-500/50'}`;
      b1.innerHTML = isBal1 ? '&check; BALANCE' : `SELISIH ${this.fmtRp(diff1)}`;
    }
    if (b2) {
      b2.className = `px-2.5 py-1 rounded-full text-xs font-bold ${isBal2 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/25 text-rose-300 border border-rose-500/50'}`;
      b2.innerHTML = isBal2 ? '&check; BALANCE' : `SELISIH ${this.fmtRp(diff2)}`;
    }

    // 4. Perhitungan Rasio Finansial Utama (Tahun 2 / Terakhir terhadap Tahun 1)
    const curCl = cl2 > 0 ? cl2 : 1;
    const curEq = eq2 > 0 ? eq2 : 1;
    const curTa = ta2 > 0 ? ta2 : 1;
    const curRev = rev2 > 0 ? rev2 : 1;

    const currentRatio = (ca2 / curCl) * 100;
    const quickRatio = ((d2.cash + d2.ar + d2.otherAr) / curCl) * 100;
    const cashRatio = (d2.cash / curCl) * 100;
    const der = tl2 / curEq;
    const dar = (tl2 / curTa) * 100;
    const gpm = (gp2 / curRev) * 100;
    const opm = (ebit2 / curRev) * 100;
    const npm = (eat2 / curRev) * 100;
    const roe = (eat2 / curEq) * 100;
    const roa = (eat2 / curTa) * 100;

    const salesGrowth = rev1 > 0 ? ((rev2 - rev1) / rev1) * 100 : 0;
    const netProfitGrowth = eat1 !== 0 ? ((eat2 - eat1) / Math.abs(eat1)) * 100 : 0;

    // Update Ratio Badges
    const updateText = (id, txt, colorCls) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = txt;
        if (colorCls) el.className = `font-mono font-bold text-sm ${colorCls}`;
      }
    };

    updateText('ratio-cr', currentRatio.toFixed(2) + '%', currentRatio >= 120 ? 'text-emerald-600' : 'text-rose-600');
    updateText('ratio-qr', quickRatio.toFixed(2) + '%', quickRatio >= 100 ? 'text-emerald-600' : 'text-amber-600');
    updateText('ratio-cash', cashRatio.toFixed(2) + '%', 'text-slate-800');
    updateText('ratio-der', der.toFixed(2) + 'x', der < 2.5 ? 'text-slate-800' : 'text-rose-600');
    updateText('ratio-dar', dar.toFixed(2) + '%', dar < 70 ? 'text-slate-800' : 'text-rose-600');
    updateText('ratio-npm', npm.toFixed(2) + '%', npm > 0 ? 'text-blue-600' : 'text-rose-600');
    updateText('ratio-roe', roe.toFixed(2) + '%', roe > 10 ? 'text-purple-600' : 'text-slate-700');
    updateText('ratio-sales-growth', (salesGrowth >= 0 ? '+' : '') + salesGrowth.toFixed(2) + '%', salesGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600');
    updateText('ratio-net-growth', (netProfitGrowth >= 0 ? '+' : '') + netProfitGrowth.toFixed(2) + '%', netProfitGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600');

    // 5. Composite Scoring & Grade Askrindo
    const auditStatus = document.getElementById('pelaku-audit-status')?.value || 'audited';
    const isAudited = auditStatus === 'audited';

    let score = 40;
    if (isAudited) score += 15; else score += 5;
    if (currentRatio >= 150) score += 15; else if (currentRatio >= 120) score += 10; else if (currentRatio >= 100) score += 5;
    if (quickRatio >= 100) score += 10; else if (quickRatio >= 80) score += 5;
    if (der < 1.5) score += 15; else if (der <= 2.5) score += 10; else score -= 10;
    if (npm >= 6) score += 10; else if (npm >= 2) score += 5;
    if (roe >= 15) score += 5;
    if (salesGrowth > 10) score += 5;
    if (isBal1 && isBal2) score += 5;

    score = Math.min(Math.max(score, 10), 100);

    let grade = 'GRADE A (SEHAT)';
    let gradeCls = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    let summaryText = 'Kondisi keuangan rekanan sangat sehat. Likuiditas tinggi dan struktur solvabilitas modal sangat terkendali.';
    let narrative = 'Rekanan memenuhi seluruh parameter underwriting penjaminan kredit & surety bond Askrindo. Layak diberikan persetujuan.';

    if (score < 50) {
      grade = 'GRADE D (RISIKO TINGGI)';
      gradeCls = 'bg-rose-100 text-rose-800 border-rose-300';
      summaryText = 'Perusahaan menghadapi tekanan beban hutang berat atau likuiditas di bawah batas aman penjaminan.';
      narrative = 'TIDAK DIREKOMENDASIKAN untuk penjaminan tanpa agunan fisik 100% dan persetujuan khusus komite kredit.';
    } else if (score < 68) {
      grade = 'GRADE C (CUKUP SEHAT)';
      gradeCls = 'bg-amber-100 text-amber-800 border-amber-300';
      summaryText = 'Tingkat leverage mendekati batas toleransi. Diperlukan mitigasi risiko dan pemantauan cash flow berkala.';
      narrative = 'Dapat dipertimbangkan bersyarat dengan agunan tambahan atau pembatasan plafon penjaminan.';
    } else if (score < 82) {
      grade = 'GRADE B (SEHAT STANDAR)';
      gradeCls = 'bg-blue-100 text-blue-800 border-blue-300';
      summaryText = 'Profil keuangan memenuhi standar wajar industri dengan operasional dan laba yang positif.';
      narrative = 'Layak diberikan fasilitas penjaminan dengan syarat dan pemantauan standar.';
    }

    const elBadge = document.getElementById('pelaku-grade-badge');
    const elScoreNum = document.getElementById('pelaku-score-num');
    const elScoreBar = document.getElementById('pelaku-score-bar');
    const elSumm = document.getElementById('pelaku-short-summary');
    const elNarr = document.getElementById('pelaku-narrative');

    if (elBadge) {
      elBadge.className = `px-3.5 py-1.5 rounded-xl font-black text-xs ${gradeCls}`;
      elBadge.textContent = grade;
    }
    if (elScoreNum) elScoreNum.textContent = score.toFixed(1) + ' / 100';
    if (elScoreBar) elScoreBar.style.width = score + '%';
    if (elSumm) elSumm.textContent = summaryText;
    if (elNarr) elNarr.textContent = narrative;

    // 6. Matriks Kepatuhan Risk Acceptance Criteria (RAC) Askrindo
    const projectVal = this.parseFormattedNumber(document.getElementById('inp_projectValue')?.value) || 0;
    const totals1 = { ca: ca1, nca: nca1, ta: ta1, cl: cl1, tl: tl1, eq: eq1, pass: pass1, rev: rev1, gp: gp1, ebit: ebit1, ebt: ebt1, eat: eat1 };
    const totals2 = { ca: ca2, nca: nca2, ta: ta2, cl: cl2, tl: tl2, eq: eq2, pass: pass2, rev: rev2, gp: gp2, ebit: ebit2, ebt: ebt2, eat: eat2 };

    const racList = this.computeRacMatrix(totals1, totals2, y1, y2, projectVal);
    const passRacCount = racList.filter(r => r.pass).length;
    const failRacCount = racList.length - passRacCount;

    const racBody = document.getElementById('racTableBody');
    const thRac1 = document.getElementById('thRacYear1');
    const thRac2 = document.getElementById('thRacYear2');
    if (thRac1) thRac1.textContent = y1;
    if (thRac2) thRac2.textContent = y2;

    if (racBody) {
      racBody.innerHTML = racList.map(r => `
        <tr class="hover:bg-slate-50/70 transition-colors">
          <td class="py-3 px-3 text-center font-bold text-slate-500">${r.no}</td>
          <td class="py-3 px-3 font-bold text-slate-800">
            <div class="flex items-center gap-2">
              <span>${r.name}</span>
              ${r.badge ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">${r.badge}</span>` : ''}
            </div>
          </td>
          <td class="py-3 px-3 text-slate-600 font-mono text-[11px]">${r.formula}</td>
          <td class="py-3 px-2 text-center font-bold text-slate-700 font-mono">${r.rac}</td>
          <td class="py-3 px-2 text-center text-slate-500 font-mono">${r.v1}</td>
          <td class="py-3 px-2 text-center font-bold font-mono text-xs ${r.pass ? 'text-emerald-700' : 'text-rose-700'}">${r.v2}</td>
          <td class="py-3 px-2 text-center">
            <span class="inline-block px-2.5 py-1 rounded-md font-bold text-[10px] ${r.pass ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-rose-50 text-rose-700 border border-rose-300'}">
              ${r.pass ? 'LULUS' : 'TIDAK LULUS'}
            </span>
          </td>
          <td class="py-3 px-3 text-[11px] leading-relaxed text-slate-700">
            ${r.ket}
          </td>
        </tr>
      `).join('');
    }

    const bPass = document.getElementById('badge_rac_pass_count');
    const bFail = document.getElementById('badge_rac_fail_count');
    if (bPass) {
      bPass.textContent = `${passRacCount} RAC LULUS`;
      bPass.className = `px-2.5 py-1 rounded-full text-xs font-bold ${passRacCount > 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-100 text-slate-600 border border-slate-200'}`;
    }
    if (bFail) {
      bFail.textContent = `${failRacCount} TIDAK LULUS`;
      bFail.className = `px-2.5 py-1 rounded-full text-xs font-bold ${failRacCount === 0 ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-rose-100 text-rose-800 border border-rose-300'}`;
    }

    // Simpan objek analisis untuk lembar cetak
    const companyRaw = document.getElementById('pelaku-company')?.value.trim() || '';
    const companyId = window.askrindoDB ? window.askrindoDB.normalizeCompanyId(companyRaw) : '';
    this.currentAnalysis = {
      companyId: companyId || '-',
      company: companyRaw || 'PT Rekanan',
      sector: document.getElementById('pelaku-sector')?.value || 'konstruksi',
      year1: y1,
      year2: y2,
      projectVal,
      auditStatus: isAudited ? 'Audited KAP' : 'In-House / Unaudited',
      kapName: document.getElementById('pelaku-kap-name')?.value || '-',
      opinion: document.getElementById('pelaku-opinion')?.value || '-',
      score,
      grade,
      summaryText,
      narrative,
      currentRatio,
      quickRatio,
      cashRatio,
      der,
      dar,
      npm,
      roe,
      roa,
      salesGrowth,
      netProfitGrowth,
      d1,
      d2,
      totals1,
      totals2,
      racList,
      passRacCount,
      failRacCount
    };

    this.syncWorkspaceFromDom();
    this.updateCompanyIdBadgeAndBanner();
    this.updateSaveIndicators();
  },

  computeRacMatrix(totals1, totals2, yr1, yr2, projectVal) {
    // Rasio Utama: Current Ratio (CR) - Standar Tunggal RAC Likuiditas Askrindo (>= 100,00%)
    const isNoDebt1 = !totals1.cl || totals1.cl === 0;
    const isNoDebt2 = !totals2.cl || totals2.cl === 0;
    const cr1 = isNoDebt1 ? null : (totals1.ca / totals1.cl) * 100;
    const cr2 = isNoDebt2 ? null : (totals2.ca / totals2.cl) * 100;
    const passCR = isNoDebt2 ? true : (cr2 >= 100);

    return [
      {
        no: 1,
        name: 'Current Ratio (CR)',
        badge: 'Rasio Utama',
        formula: 'Aset Lancar / Liab. Lancar',
        rac: '&ge; 100,00%',
        v1: isNoDebt1 ? 'N/A (Bebas Utang)' : `${this.fmtNum(cr1, 2)}%`,
        v2: isNoDebt2 ? 'N/A (Bebas Utang)' : `${this.fmtNum(cr2, 2)}%`,
        pass: passCR,
        ket: isNoDebt2
          ? 'Likuiditas Sangat Prima (N/A): Perusahaan beroperasi murni modal sendiri (Hutang Lancar Rp 0). Risiko gagal bayar kewajiban lancar nihil.'
          : (passCR
            ? `Current Ratio ${this.fmtNum(cr2, 2)}% memenuhi standar RAC (&ge; 100,00%). Debitur memiliki likuiditas lancar memadai untuk melunasi kewajiban jangka pendek.`
            : `Current Ratio ${this.fmtNum(cr2, 2)}% di bawah standar RAC (&ge; 100,00%). Likuiditas jangka pendek ketat dan berisiko saat penagihan piutang terlambat.`)
      }
    ];
  },

  autoBalanceAllYears() {
    [1, 2].forEach(yr => {
      this.autoBalanceYear(yr);
    });
    this.calculateRatios();
    window.askrindoApp.showToast('Neraca kedua tahun berhasil diseimbangkan otomatis (Aktiva = Passiva)!', 'success');
  },

  autoBalanceYear(yr) {
    const getVal = (k) => this.parseFormattedNumber(document.getElementById(`inp_${k}_${yr}`)?.value) || 0;
    const setVal = (k, v) => {
      const el = document.getElementById(`inp_${k}_${yr}`);
      if (el) el.value = this.formatNumberWithDots(Math.round(v * 100) / 100, true);
    };

    const act = getVal('cash') + getVal('otherCa') + getVal('ar') + getVal('inv') + getVal('otherAr') + getVal('prepaid') + getVal('fa') - Math.abs(getVal('depr')) + getVal('invest') + getVal('taxAsset');
    const liab = getVal('ap') + getVal('stDebt') + getVal('otherAp') + getVal('accrued') + getVal('ltDebt');
    const cap = getVal('capital') + getVal('otherCap');
    const re = getVal('re');

    const targetEquity = act - liab;
    const neededRetEarn = targetEquity - cap - re;
    setVal('retEarn', neededRetEarn);
  },

  loadSampleData() {
    this.formSourceMode = 'sample';
    this.loadedCompanyId = null;
    this.preAutoMatchState = null;
    this.autoLoadedCompanyId = null;
    this.historyBannerMatch = null;
    this.historyBannerAutoLoaded = false;
    this.dismissedBannerForId = null;
    this.lastToastMatchId = null;

    const sampleState = this.buildSampleState();
    this.applyStateToDom(sampleState, false);
    window.askrindoApp.showToast('Contoh data Laporan Keuangan 27 pos ASCA berhasil dimuat!', 'info');
  },

  resetForm() {
    const curYr = new Date().getFullYear();
    this.formSourceMode = 'blank';
    this.loadedCompanyId = null;
    this.preAutoMatchState = null;
    this.autoLoadedCompanyId = null;
    this.historyBannerMatch = null;
    this.historyBannerAutoLoaded = false;
    this.dismissedBannerForId = null;
    this.lastToastMatchId = null;

    FIN_ACCOUNT_KEYS.forEach(k => {
      const el1 = document.getElementById(`inp_${k}_1`);
      const el2 = document.getElementById(`inp_${k}_2`);
      if (el1) el1.value = '';
      if (el2) el2.value = '';
    });
    const y1Inp = document.getElementById('inp_year1');
    const y2Inp = document.getElementById('inp_year2');
    if (y1Inp && !y1Inp.value) y1Inp.value = curYr - 1;
    if (y2Inp && !y2Inp.value) y2Inp.value = curYr;

    this.updateYearLabels();
    this.calculateRatios();
    window.askrindoApp.showToast('Angka Laporan Keuangan berhasil dikosongkan.', 'info');
  },

  startNewAnalysis() {
    this.workspaceState = this.buildBlankState();
    this.formSourceMode = 'blank';
    this.loadedCompanyId = null;
    this.preAutoMatchState = null;
    this.autoLoadedCompanyId = null;
    this.historyBannerMatch = null;
    this.historyBannerAutoLoaded = false;
    this.dismissedBannerForId = null;
    this.lastToastMatchId = null;
    this.saveWorkspaceDraft();

    if (this.currentTab !== 'workspace') {
      this.currentTab = 'workspace';
    }
    window.askrindoApp.renderCurrentRoute();

    setTimeout(() => {
      const compEl = document.getElementById('pelaku-company');
      if (compEl) {
        compEl.focus();
        this.openCompanyAutocomplete();
      }
    }, 60);

    window.askrindoApp.showToast('Siap membuat analisa baru. Masukkan Nama Perusahaan (otomatis menjadi ID).', 'info');
  },

  setTab(tab) {
    if (this.currentTab === 'workspace') {
      this.syncWorkspaceFromDom();
    }
    this.currentTab = tab;
    window.askrindoApp.renderCurrentRoute();
  },

  handleDbSynced() {
    const savedList = window.askrindoDB ? window.askrindoDB.getPelakuAnalyses() : [];
    const badge = document.getElementById('pelaku-archive-count-badge');
    if (badge) badge.textContent = savedList.length;

    if (this.currentTab === 'archive') {
      const container = document.getElementById('pelaku-archive-root');
      if (container) {
        window.askrindoApp.renderCurrentRoute();
      }
    } else {
      const compEl = document.getElementById('pelaku-company');
      if (compEl) {
        if (this.formSourceMode === 'blank' && compEl.value.trim()) {
          this.resolveCompanyMatch(compEl.value, 'sync');
        } else {
          this.updateCompanyIdBadgeAndBanner();
          this.updateSaveIndicators();
        }
      }
    }
  },

  onFinancialInputChanged() {
    this.preAutoMatchState = null;
    this.autoLoadedCompanyId = null;
    if (this.formSourceMode !== 'ocr') {
      this.formSourceMode = 'dirty';
    }
    this.calculateRatios();
  },

  onMetaFieldChanged() {
    if (this.formSourceMode === 'saved') {
      this.formSourceMode = 'dirty';
    }
    this.calculateRatios();
  },

  applyStateToDom(state, preserveCompanyText = false) {
    const comp = document.getElementById('pelaku-company');
    if (comp && !preserveCompanyText) comp.value = state.companyName || '';
    const sec = document.getElementById('pelaku-sector');
    if (sec) sec.value = state.sector || 'konstruksi';
    const y1Inp = document.getElementById('inp_year1');
    const y2Inp = document.getElementById('inp_year2');
    if (y1Inp) y1Inp.value = state.year1 || '2024';
    if (y2Inp) y2Inp.value = state.year2 || '2025';
    const auditSel = document.getElementById('pelaku-audit-status');
    if (auditSel) auditSel.value = state.auditStatus || 'audited';
    const kapInp = document.getElementById('pelaku-kap-name');
    if (kapInp) kapInp.value = state.kapName || '';
    const opInp = document.getElementById('pelaku-opinion');
    if (opInp) opInp.value = state.opinion || '';
    const projInp = document.getElementById('inp_projectValue');
    if (projInp) {
      projInp.value = (state.projectVal === '' || state.projectVal === null || state.projectVal === undefined)
        ? ''
        : this.formatNumberWithDots(state.projectVal, false);
    }

    FIN_ACCOUNT_KEYS.forEach(k => {
      const el1 = document.getElementById(`inp_${k}_1`);
      const el2 = document.getElementById(`inp_${k}_2`);
      const v1 = state.d1?.[k];
      const v2 = state.d2?.[k];
      if (el1) el1.value = (v1 === '' || v1 === null || v1 === undefined) ? '' : this.formatNumberWithDots(v1, true);
      if (el2) el2.value = (v2 === '' || v2 === null || v2 === undefined) ? '' : this.formatNumberWithDots(v2, true);
    });

    this.updateYearLabels();
    this.calculateRatios();
  },

  // =========================================================================
  // COMPANY ID AUTO-LOOKUP, AUTOCOMPLETE & PERSISTENT ARCHIVE
  // =========================================================================
  openCompanyAutocomplete() {
    const val = document.getElementById('pelaku-company')?.value || '';
    this.renderCompanyAutocomplete(val);
  },

  toggleCompanyAutocomplete() {
    const dd = document.getElementById('pelaku-company-dropdown');
    if (!dd) return;
    if (dd.classList.contains('hidden')) {
      this.openCompanyAutocomplete();
    } else {
      dd.classList.add('hidden');
    }
  },

  renderCompanyAutocomplete(query) {
    const dd = document.getElementById('pelaku-company-dropdown');
    if (!dd || !window.askrindoDB) return;

    const allSaved = window.askrindoDB.getPelakuAnalyses();
    if (allSaved.length === 0) {
      dd.classList.add('hidden');
      return;
    }

    const q = (query || '').trim();
    const matches = q ? window.askrindoDB.searchPelakuAnalyses(q) : allSaved.slice(0, 8);

    if (matches.length === 0) {
      const normNew = window.askrindoDB.normalizeCompanyId(q);
      dd.innerHTML = `
        <div class="p-3 text-xs text-slate-500 flex items-center justify-between gap-2">
          <div>
            <span class="font-semibold text-slate-700">Perusahaan baru:</span> belum ada di arsip.
            <span class="block text-[10px] font-mono text-purple-700 mt-0.5">ID Otomatis: ${this.escapeHtml(normNew || '-')}</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">Entri Baru</span>
        </div>
      `;
      dd.classList.remove('hidden');
      return;
    }

    dd.innerHTML = `
      <div class="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
        <span>Perusahaan Pernah Dianalisa (${matches.length})</span>
        <span class="text-purple-600">Klik untuk muat data</span>
      </div>
      ${matches.slice(0, 10).map(rec => `
        <button
          type="button"
          onmousedown="event.preventDefault(); window.PelakuModule.selectCompanyFromAutocomplete('${this.escapeHtml(rec.id)}');"
          class="w-full text-left px-3.5 py-2.5 hover:bg-purple-50/80 transition flex items-start justify-between gap-3 group"
        >
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold text-slate-800 group-hover:text-purple-800 truncate">${this.escapeHtml(rec.companyName)}</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">ID: ${this.escapeHtml(rec.id)}</span>
            </div>
            <div class="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
              <span>Th ${this.escapeHtml(rec.year1)}&ndash;${this.escapeHtml(rec.year2)}</span>
              <span>&bull;</span>
              <span>Proyek ${this.fmtRp(rec.projectVal || 0, true)}</span>
              <span>&bull;</span>
              <span>Disimpan ${this.formatDateTimeId(rec.updatedAt)}</span>
            </div>
          </div>
          <div class="text-right shrink-0">
            <span class="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold ${rec.racFailCount === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
              ${rec.racPassCount}/6 RAC
            </span>
            <span class="block text-[10px] font-mono text-slate-400 mt-0.5">Skor ${Number(rec.score || 0).toFixed(1)}</span>
          </div>
        </button>
      `).join('')}
    `;
    dd.classList.remove('hidden');
  },

  selectCompanyFromAutocomplete(companyId) {
    const dd = document.getElementById('pelaku-company-dropdown');
    if (dd) dd.classList.add('hidden');

    const rec = window.askrindoDB?.getPelakuAnalysis(companyId);
    if (!rec) return;

    if ((this.formSourceMode === 'dirty' || this.formSourceMode === 'ocr') && this.loadedCompanyId !== rec.id) {
      if (!confirm(`Form saat ini memiliki perubahan yang belum disimpan. Muat data laporan keuangan sebelumnya untuk "${rec.companyName}"?`)) {
        return;
      }
    }

    this.preAutoMatchState = null;
    this.autoLoadedCompanyId = null;
    this.populateFormFromAnalysisRecord(rec, { toast: true });
  },

  handleCompanyInput(val) {
    if (this.workspaceState) {
      this.workspaceState.companyName = val;
      this.saveWorkspaceDraft();
    }

    this.renderCompanyAutocomplete(val);
    this.updateCompanyIdBadgeAndBanner();
    this.updateSaveIndicators();

    if (this.companyLookupTimer) clearTimeout(this.companyLookupTimer);
    this.companyLookupTimer = setTimeout(() => {
      this.resolveCompanyMatch(val, 'typing');
    }, 260);
  },

  handleCompanyKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (this.companyLookupTimer) clearTimeout(this.companyLookupTimer);
      const dd = document.getElementById('pelaku-company-dropdown');
      if (dd) dd.classList.add('hidden');
      this.resolveCompanyMatch(e.target.value, 'enter');
    } else if (e.key === 'Escape') {
      const dd = document.getElementById('pelaku-company-dropdown');
      if (dd) dd.classList.add('hidden');
    }
  },

  handleCompanyBlur() {
    setTimeout(() => {
      const dd = document.getElementById('pelaku-company-dropdown');
      if (dd) dd.classList.add('hidden');
      const val = document.getElementById('pelaku-company')?.value || '';
      this.resolveCompanyMatch(val, 'blur');
    }, 180);
  },

  resolveCompanyMatch(rawName, source = 'typing') {
    if (!window.askrindoDB || !document.getElementById('pelaku-company')) return;

    const normId = window.askrindoDB.normalizeCompanyId(rawName);
    const existing = normId ? window.askrindoDB.getPelakuAnalysis(normId) : null;

    if (!existing) {
      if (source === 'typing' && this.preAutoMatchState && this.autoLoadedCompanyId) {
        const snap = this.preAutoMatchState;
        this.preAutoMatchState = null;
        this.autoLoadedCompanyId = null;
        this.loadedCompanyId = null;
        this.formSourceMode = snap._mode || 'blank';
        this.historyBannerMatch = null;
        this.historyBannerAutoLoaded = false;
        this.applyStateToDom(snap, true);
        return;
      }

      if (this.loadedCompanyId && this.loadedCompanyId !== normId) {
        this.loadedCompanyId = null;
        if (this.formSourceMode === 'saved') {
          this.formSourceMode = 'dirty';
        }
      }
      this.historyBannerMatch = null;
      this.historyBannerAutoLoaded = false;
      this.updateCompanyIdBadgeAndBanner();
      this.updateSaveIndicators();
      return;
    }

    // Jika perusahaan yang sama sudah ter-load dan masih sinkron
    if (this.loadedCompanyId === existing.id && this.formSourceMode === 'saved') {
      this.historyBannerMatch = existing;
      this.historyBannerAutoLoaded = true;
      if (source !== 'typing') {
        this.preAutoMatchState = null;
        this.autoLoadedCompanyId = null;
      }
      this.updateCompanyIdBadgeAndBanner();
      return;
    }

    const canAutoLoad = (
      this.formSourceMode === 'blank' ||
      this.formSourceMode === 'sample' ||
      this.formSourceMode === 'saved' ||
      !!this.autoLoadedCompanyId
    );

    if (canAutoLoad) {
      if (!this.preAutoMatchState && source === 'typing') {
        this.preAutoMatchState = {
          ...this.captureWorkspaceFromDom(),
          _mode: this.formSourceMode
        };
      }
      this.populateFormFromAnalysisRecord(existing, {
        preserveCompanyText: source === 'typing',
        toast: this.lastToastMatchId !== existing.id
      });
      this.autoLoadedCompanyId = source === 'typing' ? existing.id : null;
      if (source !== 'typing') {
        this.preAutoMatchState = null;
      }
      this.lastToastMatchId = existing.id;
    } else {
      // User sudah mengetik angka manual / hasil OCR baru -> jangan timpa paksa, tampilkan banner pilihan!
      this.historyBannerMatch = existing;
      this.historyBannerAutoLoaded = false;
      this.updateCompanyIdBadgeAndBanner();
      this.updateSaveIndicators();
    }
  },

  populateFormFromAnalysisRecord(rec, opts = {}) {
    if (!rec) return;
    const src = opts.snapshot || rec;

    const state = {
      companyName: rec.companyName || '',
      sector: src.sector || rec.sector || 'konstruksi',
      year1: String(src.year1 || rec.year1 || '2024'),
      year2: String(src.year2 || rec.year2 || '2025'),
      auditStatus: src.auditStatus || rec.auditStatus || 'audited',
      opinion: src.opinion || rec.opinion || '-',
      projectVal: src.projectVal !== undefined ? src.projectVal : (rec.projectVal || 0),
      kapName: src.kapName || rec.kapName || '-',
      d1: { ...(src.data1 || {}) },
      d2: { ...(src.data2 || {}) }
    };

    this.formSourceMode = opts.snapshot ? 'dirty' : 'saved';
    this.loadedCompanyId = rec.id;
    this.historyBannerMatch = rec;
    this.historyBannerAutoLoaded = true;
    this.dismissedBannerForId = null;

    this.applyStateToDom(state, !!opts.preserveCompanyText);

    if (opts.toast) {
      window.askrindoApp.showToast(
        opts.toastMessage || `Data laporan keuangan "${rec.companyName}" (ID: ${rec.id}) dimuat otomatis!`,
        'success'
      );
    }
  },

  updateCompanyIdBadgeAndBanner() {
    const compRaw = document.getElementById('pelaku-company')?.value.trim() || '';
    const normId = window.askrindoDB ? window.askrindoDB.normalizeCompanyId(compRaw) : '';
    const existing = normId && window.askrindoDB ? window.askrindoDB.getPelakuAnalysis(normId) : null;

    const badgeEl = document.getElementById('pelaku-company-id-badge');
    if (badgeEl) {
      if (!normId) {
        badgeEl.className = 'px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200 truncate max-w-[200px]';
        badgeEl.textContent = 'ID: (Belum diisi)';
        badgeEl.title = 'Masukkan nama perusahaan untuk membuat ID otomatis';
      } else if (existing) {
        badgeEl.className = 'px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 truncate max-w-[200px]';
        badgeEl.textContent = `✓ ID: ${existing.id}`;
        badgeEl.title = `Terdaftar di Arsip • ${existing.snapshots?.length || 1} versi tersimpan`;
      } else {
        badgeEl.className = 'px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200 truncate max-w-[200px]';
        badgeEl.textContent = `ID Baru: ${normId}`;
        badgeEl.title = `Akan disimpan dengan ID: ${normId}`;
      }
    }

    const bannerEl = document.getElementById('pelaku-company-history-banner');
    if (!bannerEl) return;

    const match = this.historyBannerMatch || existing;
    if (!match || !normId || normId !== match.id || this.dismissedBannerForId === match.id) {
      bannerEl.classList.add('hidden');
      bannerEl.innerHTML = '';
      return;
    }

    const snapCount = Array.isArray(match.snapshots) ? match.snapshots.length : 1;
    const savedAtTxt = this.formatDateTimeId(match.updatedAt);
    const nextYr = (parseInt(match.year2, 10) || new Date().getFullYear()) + 1;

    if (this.historyBannerAutoLoaded) {
      bannerEl.className = 'p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn';
      bannerEl.innerHTML = `
        <div class="flex items-start gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
            <i data-lucide="history" class="w-4 h-4"></i>
          </div>
          <div>
            <p class="font-bold text-emerald-950">
              Riwayat Perusahaan Ditemukan &bull; <span class="font-mono text-emerald-800">ID: ${this.escapeHtml(match.id)}</span>
            </p>
            <p class="text-[11px] text-emerald-800 mt-0.5">
              Data laporan keuangan sebelumnya (<strong>Th ${this.escapeHtml(match.year1)} &amp; ${this.escapeHtml(match.year2)}</strong>, ${this.escapeHtml(match.grade)}, diperbarui ${savedAtTxt}) telah dimuat ke tabel.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap shrink-0">
          <button type="button" onclick="window.PelakuModule.rollForwardYear2ToYear1('${this.escapeHtml(match.id)}')" class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 text-[11px] transition flex items-center gap-1" title="Pindahkan data Th ${this.escapeHtml(match.year2)} ke Kolom Tahun 1 untuk perbandingan tahun ${nextYr}">
            <i data-lucide="arrow-right-left" class="w-3.5 h-3.5"></i>
            <span>Lanjut Periode ${this.escapeHtml(match.year2)}&ndash;${nextYr}</span>
          </button>
          ${snapCount > 1 ? `
            <button type="button" onclick="window.PelakuModule.openCompanySnapshotsModal('${this.escapeHtml(match.id)}')" class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-semibold border border-slate-300 text-[11px] transition flex items-center gap-1">
              <i data-lucide="layers" class="w-3.5 h-3.5"></i>
              <span>Riwayat (${snapCount})</span>
            </button>
          ` : ''}
          <button type="button" onclick="window.PelakuModule.dismissHistoryBanner('${this.escapeHtml(match.id)}')" class="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 transition" title="Tutup info">
            <i data-lucide="x" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;
    } else {
      const m = match.summaryMetrics || {};
      bannerEl.className = 'p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fadeIn';
      bannerEl.innerHTML = `
        <div class="flex items-start gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
            <i data-lucide="folder-search" class="w-4 h-4"></i>
          </div>
          <div>
            <p class="font-bold text-amber-950">
              Nama Perusahaan Sama Ditemukan di Arsip (<span class="font-mono">${this.escapeHtml(match.id)}</span>)
            </p>
            <p class="text-[11px] text-amber-900 mt-0.5">
              Analisa sebelumnya: <strong>Th ${this.escapeHtml(match.year1)}&ndash;${this.escapeHtml(match.year2)}</strong> &bull; Aset ${this.fmtRp(m.ta2 || 0, true)} &bull; EAT ${this.fmtRp(m.eat2 || 0, true)} &bull; Disimpan ${savedAtTxt}.
            </p>
          </div>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap shrink-0">
          <button type="button" onclick="window.PelakuModule.populateFormFromAnalysisRecord(window.askrindoDB.getPelakuAnalysis('${this.escapeHtml(match.id)}'), { toast: true })" class="px-2.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition">
            Muat Data Sebelumnya
          </button>
          <button type="button" onclick="window.PelakuModule.rollForwardIntoYear1KeepingYear2('${this.escapeHtml(match.id)}')" class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 font-bold border border-amber-300 text-[11px] transition" title="Ambil data Th ${this.escapeHtml(match.year2)} sebelumnya ke Kolom Tahun 1 tanpa menghapus angka Tahun 2 saat ini">
            Isi Th ${this.escapeHtml(match.year2)} ke Kolom Th 1
          </button>
          <button type="button" onclick="window.PelakuModule.dismissHistoryBanner('${this.escapeHtml(match.id)}')" class="px-2 py-1.5 rounded-xl text-amber-800 hover:bg-amber-100 font-semibold text-[11px] transition">
            Abaikan
          </button>
        </div>
      `;
    }
    if (window.lucide) window.lucide.createIcons();
  },

  dismissHistoryBanner(companyId) {
    this.dismissedBannerForId = companyId;
    const bannerEl = document.getElementById('pelaku-company-history-banner');
    if (bannerEl) {
      bannerEl.classList.add('hidden');
      bannerEl.innerHTML = '';
    }
  },

  rollForwardYear2ToYear1(companyId) {
    const rec = window.askrindoDB?.getPelakuAnalysis(companyId);
    if (!rec) return;

    const prevYr2 = String(rec.year2 || '2025');
    const nextYr2 = String((parseInt(prevYr2, 10) || new Date().getFullYear()) + 1);
    const blankYr2 = {};
    FIN_ACCOUNT_KEYS.forEach(k => { blankYr2[k] = ''; });

    this.preAutoMatchState = null;
    this.autoLoadedCompanyId = null;
    this.formSourceMode = 'dirty';
    this.loadedCompanyId = rec.id;
    this.historyBannerMatch = rec;
    this.historyBannerAutoLoaded = true;

    this.applyStateToDom({
      companyName: rec.companyName,
      sector: rec.sector,
      year1: prevYr2,
      year2: nextYr2,
      auditStatus: rec.auditStatus,
      opinion: rec.opinion,
      projectVal: rec.projectVal,
      kapName: rec.kapName,
      d1: { ...(rec.data2 || {}) },
      d2: blankYr2
    }, false);

    setTimeout(() => document.getElementById('inp_cash_2')?.focus(), 50);
    window.askrindoApp.showToast(`Data Th ${prevYr2} disalin ke Kolom Tahun 1. Silakan isi atau pindai OCR data Th ${nextYr2}.`, 'info');
  },

  rollForwardIntoYear1KeepingYear2(companyId) {
    const rec = window.askrindoDB?.getPelakuAnalysis(companyId);
    if (!rec) return;

    const prevYr2 = String(rec.year2 || '2025');
    const y1Inp = document.getElementById('inp_year1');
    if (y1Inp) y1Inp.value = prevYr2;

    FIN_ACCOUNT_KEYS.forEach(k => {
      const el1 = document.getElementById(`inp_${k}_1`);
      if (el1) el1.value = this.formatNumberWithDots(rec.data2?.[k] || 0, true);
    });

    this.formSourceMode = 'dirty';
    this.loadedCompanyId = rec.id;
    this.dismissedBannerForId = rec.id;
    this.updateYearLabels();
    this.calculateRatios();
    window.askrindoApp.showToast(`Kolom Tahun 1 diisi dari data akhir "${rec.companyName}" (Th ${prevYr2}), Tahun 2 tetap dipertahankan!`, 'success');
  },

  updateSaveIndicators() {
    const compRaw = document.getElementById('pelaku-company')?.value.trim() || '';
    const normId = window.askrindoDB ? window.askrindoDB.normalizeCompanyId(compRaw) : '';
    const existing = normId && window.askrindoDB ? window.askrindoDB.getPelakuAnalysis(normId) : null;

    const topBtn = document.getElementById('btn-pelaku-save-top');
    const sideBtn = document.getElementById('btn-pelaku-save-side');
    const stripTxt = document.getElementById('pelaku-save-status-text');
    const archiveBadge = document.getElementById('pelaku-archive-count-badge');

    if (archiveBadge && window.askrindoDB) {
      archiveBadge.textContent = window.askrindoDB.getPelakuAnalyses().length;
    }

    if (existing && this.formSourceMode === 'saved' && this.loadedCompanyId === existing.id) {
      if (stripTxt) {
        stripTxt.className = 'font-bold text-emerald-700';
        stripTxt.textContent = `✓ Tersimpan (${this.formatDateTimeId(existing.updatedAt)})`;
      }
      if (topBtn) {
        topBtn.innerHTML = `<i data-lucide="check-circle" class="w-4 h-4"></i><span>Tersimpan</span>`;
        topBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 transition flex items-center gap-1.5';
      }
      if (sideBtn) {
        sideBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i><span>Perbarui Analisa Tersimpan</span>`;
      }
    } else if (existing) {
      if (stripTxt) {
        stripTxt.className = 'font-bold text-amber-700';
        stripTxt.textContent = 'Perubahan baru (belum disimpan ke ID)';
      }
      if (topBtn) {
        topBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i><span>Perbarui Analisa*</span>`;
        topBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 transition flex items-center gap-1.5';
      }
      if (sideBtn) {
        sideBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i><span>Simpan Pembaruan (${existing.id})</span>`;
      }
    } else {
      if (stripTxt) {
        stripTxt.className = 'font-semibold text-slate-600';
        stripTxt.textContent = 'Draft lokal (belum disimpan)';
      }
      if (topBtn) {
        topBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i><span>Simpan Analisa</span>`;
        topBtn.className = 'px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5';
      }
      if (sideBtn) {
        sideBtn.innerHTML = `<i data-lucide="save" class="w-4 h-4"></i><span>Simpan Analisa Perusahaan</span>`;
      }
    }
    if (window.lucide) window.lucide.createIcons();
  },

  saveCurrentAnalysis(silent = false) {
    const compEl = document.getElementById('pelaku-company');
    const companyName = compEl ? compEl.value.trim() : '';
    const companyId = window.askrindoDB ? window.askrindoDB.normalizeCompanyId(companyName) : '';

    if (!companyName || !companyId) {
      if (compEl) {
        compEl.focus();
        compEl.classList.add('border-rose-500', 'ring-2', 'ring-rose-200');
        setTimeout(() => compEl.classList.remove('border-rose-500', 'ring-2', 'ring-rose-200'), 2500);
      }
      window.askrindoApp.showToast('Harap isi Nama Perusahaan / Rekanan terlebih dahulu sebelum menyimpan (menjadi ID Analisa).', 'error');
      return null;
    }

    this.calculateRatios();
    const c = this.currentAnalysis;
    if (!c || !window.askrindoDB) return null;

    const payload = {
      companyName,
      sector: c.sector,
      auditStatus: document.getElementById('pelaku-audit-status')?.value || 'audited',
      kapName: c.kapName,
      opinion: c.opinion,
      year1: c.year1,
      year2: c.year2,
      projectVal: c.projectVal,
      score: c.score,
      grade: c.grade,
      racPassCount: c.passRacCount,
      racFailCount: c.failRacCount,
      data1: c.d1,
      data2: c.d2,
      summaryMetrics: {
        ca2: c.totals2?.ca || 0,
        ta2: c.totals2?.ta || 0,
        tl2: c.totals2?.tl || 0,
        eq2: c.totals2?.eq || 0,
        rev2: c.totals2?.rev || 0,
        eat2: c.totals2?.eat || 0,
        nwc2: (c.totals2?.ca || 0) - (c.totals2?.cl || 0),
        currentRatio: c.currentRatio,
        der: c.der,
        roa: c.roa,
        roe: c.roe
      }
    };

    const res = window.askrindoDB.savePelakuAnalysis(payload);
    if (!res) return null;

    this.formSourceMode = 'saved';
    this.loadedCompanyId = res.savedRecord.id;
    this.preAutoMatchState = null;
    this.autoLoadedCompanyId = null;
    this.historyBannerMatch = res.savedRecord;
    this.historyBannerAutoLoaded = true;
    this.dismissedBannerForId = null;
    this.saveWorkspaceDraft();

    window.askrindoDB.logActivity(
      'PELAKU',
      res.isNewCompany ? 'Simpan Analisa Baru' : 'Perbarui Analisa Perusahaan',
      `Menyimpan analisa keuangan ${companyName} (ID: ${res.savedRecord.id}) Tahun Buku ${c.year1}-${c.year2} Skor ${c.score.toFixed(1)}`
    );

    this.updateCompanyIdBadgeAndBanner();
    this.updateSaveIndicators();

    if (!silent) {
      window.askrindoApp.showToast(
        `Analisa "${companyName}" (ID: ${res.savedRecord.id}) berhasil disimpan! Total ${res.snapshotCount} riwayat versi.`,
        'success'
      );
    }
    return res;
  },

  loadCompanyAnalysisById(companyId, snapshotId = null) {
    const rec = window.askrindoDB?.getPelakuAnalysis(companyId);
    if (!rec) {
      window.askrindoApp.showToast('Data analisa perusahaan tidak ditemukan.', 'error');
      return;
    }

    let chosenSnap = null;
    if (snapshotId && Array.isArray(rec.snapshots)) {
      chosenSnap = rec.snapshots.find(s => s.snapshotId === snapshotId) || null;
    }

    this.preAutoMatchState = null;
    this.autoLoadedCompanyId = null;

    if (this.currentTab !== 'workspace') {
      this.currentTab = 'workspace';
      const src = chosenSnap || rec;
      this.workspaceState = {
        companyName: rec.companyName,
        sector: src.sector || rec.sector || 'konstruksi',
        year1: String(src.year1 || rec.year1 || '2024'),
        year2: String(src.year2 || rec.year2 || '2025'),
        auditStatus: src.auditStatus || rec.auditStatus || 'audited',
        opinion: src.opinion || rec.opinion || '-',
        projectVal: src.projectVal !== undefined ? src.projectVal : (rec.projectVal || 0),
        kapName: src.kapName || rec.kapName || '-',
        d1: { ...(src.data1 || {}) },
        d2: { ...(src.data2 || {}) }
      };
      this.formSourceMode = chosenSnap ? 'dirty' : 'saved';
      this.loadedCompanyId = rec.id;
      this.historyBannerMatch = rec;
      this.historyBannerAutoLoaded = true;
      this.dismissedBannerForId = null;
      this.saveWorkspaceDraft();
      window.askrindoApp.renderCurrentRoute();
    } else {
      this.populateFormFromAnalysisRecord(rec, { snapshot: chosenSnap, toast: false });
    }

    const msg = chosenSnap
      ? `Membuka riwayat "${rec.companyName}" periode Th ${chosenSnap.year1}–${chosenSnap.year2}!`
      : `Analisa "${rec.companyName}" (ID: ${rec.id}) berhasil dibuka!`;
    window.askrindoApp.showToast(msg, 'success');
  },

  deleteSavedCompany(companyId) {
    const rec = window.askrindoDB?.getPelakuAnalysis(companyId);
    if (!rec) return;
    if (!confirm(`Hapus permanen seluruh arsip analisa perusahaan "${rec.companyName}" (ID: ${rec.id}) beserta ${rec.snapshots?.length || 1} riwayat periodenya?`)) {
      return;
    }
    window.askrindoDB.deletePelakuAnalysis(rec.id);
    window.askrindoDB.logActivity('PELAKU', 'Hapus Arsip Perusahaan', `Menghapus arsip analisa ${rec.companyName} (ID: ${rec.id})`);

    if (this.loadedCompanyId === rec.id) {
      this.loadedCompanyId = null;
      this.formSourceMode = 'dirty';
      this.historyBannerMatch = null;
      this.historyBannerAutoLoaded = false;
      this.saveWorkspaceDraft();
    }

    window.askrindoApp.showToast(`Arsip "${rec.companyName}" berhasil dihapus.`, 'info');
    window.askrindoApp.renderCurrentRoute();
  },

  openCompanySnapshotsModal(companyId) {
    const rec = window.askrindoDB?.getPelakuAnalysis(companyId);
    const modal = document.getElementById('pelaku-modal-container');
    if (!rec || !modal) return;

    const snaps = Array.isArray(rec.snapshots) && rec.snapshots.length > 0
      ? rec.snapshots
      : [{
          snapshotId: 'LATEST',
          savedAt: rec.updatedAt,
          savedBy: rec.updatedBy,
          year1: rec.year1,
          year2: rec.year2,
          projectVal: rec.projectVal,
          score: rec.score,
          grade: rec.grade,
          racPassCount: rec.racPassCount,
          summaryMetrics: rec.summaryMetrics
        }];

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                <i data-lucide="history" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-800">${this.escapeHtml(rec.companyName)}</h3>
                <p class="text-xs text-slate-500 font-mono">ID Perusahaan: <strong>${this.escapeHtml(rec.id)}</strong> &bull; ${snaps.length} Riwayat Analisa Tersimpan</p>
              </div>
            </div>
            <button onclick="document.getElementById('pelaku-modal-container').innerHTML=''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="space-y-2.5 max-h-[55vh] overflow-y-auto">
            ${snaps.map((s, idx) => {
              const m = s.summaryMetrics || {};
              return `
                <div class="p-4 rounded-2xl border ${idx === 0 ? 'border-purple-300 bg-purple-50/40' : 'border-slate-200 bg-white'} flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div class="space-y-1 text-xs">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="font-bold text-slate-800">Periode Buku: Th ${this.escapeHtml(s.year1)} &ndash; ${this.escapeHtml(s.year2)}</span>
                      ${idx === 0 ? '<span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-600 text-white uppercase">Terbaru</span>' : ''}
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${Number(s.racPassCount) === 6 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                        ${s.racPassCount ?? 0}/6 RAC LULUS
                      </span>
                    </div>
                    <p class="text-[11px] text-slate-600">
                      Nilai Proyek: <strong>${this.fmtRp(s.projectVal || 0, false)}</strong> &bull;
                      Total Aset Th ${this.escapeHtml(s.year2)}: <strong>${this.fmtRp(m.ta2 || 0, true)}</strong> &bull;
                      EAT: <strong>${this.fmtRp(m.eat2 || 0, true)}</strong>
                    </p>
                    <p class="text-[10px] text-slate-400">
                      Disimpan pada ${this.formatDateTimeId(s.savedAt)} oleh <strong>${this.escapeHtml(s.savedBy || '-')}</strong> &bull; ${this.escapeHtml(s.grade || '-')} (Skor ${Number(s.score || 0).toFixed(1)})
                    </p>
                  </div>
                  <button onclick="document.getElementById('pelaku-modal-container').innerHTML=''; window.PelakuModule.loadCompanyAnalysisById('${this.escapeHtml(rec.id)}', '${idx === 0 ? '' : this.escapeHtml(s.snapshotId)}');" class="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs transition shrink-0 flex items-center gap-1.5">
                    <i data-lucide="folder-open" class="w-3.5 h-3.5"></i>
                    <span>Buka Versi Ini</span>
                  </button>
                </div>
              `;
            }).join('')}
          </div>

          <div class="flex items-center justify-end pt-2 border-t border-slate-100">
            <button onclick="document.getElementById('pelaku-modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
              Tutup
            </button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  exportArchiveJson() {
    const list = window.askrindoDB ? window.askrindoDB.getPelakuAnalyses() : [];
    if (list.length === 0) {
      window.askrindoApp.showToast('Belum ada data perusahaan tersimpan untuk diekspor.', 'warning');
      return;
    }
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), app: 'Askrindo SATU PELAKU', records: list }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PELAKU_Arsip_Perusahaan_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    window.askrindoApp.showToast(`${list.length} arsip perusahaan berhasil diekspor ke JSON!`, 'success');
  },

  handleImportArchiveFile(input) {
    const file = input?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.records) ? parsed.records : []);
        const count = window.askrindoDB.importPelakuAnalyses(arr);
        window.askrindoApp.showToast(`${count} data analisa perusahaan berhasil diimpor & digabungkan!`, 'success');
        window.askrindoApp.renderCurrentRoute();
      } catch (e) {
        window.askrindoApp.showToast('Format file JSON tidak valid.', 'error');
      }
    };
    reader.readAsText(file);
    input.value = '';
  },

  openCloudSqlModal() {
    const modal = document.getElementById('pelaku-modal-container');
    if (!modal) return;
    const sqlSnippet = `CREATE TABLE IF NOT EXISTS public.pelaku_analyses (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  sector TEXT,
  audit_status TEXT,
  kap_name TEXT,
  opinion TEXT,
  year1 TEXT NOT NULL,
  year2 TEXT NOT NULL,
  project_val NUMERIC NOT NULL DEFAULT 0,
  score NUMERIC DEFAULT 0,
  grade TEXT,
  rac_pass_count INT DEFAULT 0,
  rac_fail_count INT DEFAULT 0,
  payload JSONB NOT NULL,
  created_by TEXT,
  updated_by TEXT,
  branch TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW())
);
ALTER TABLE public.pelaku_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on pelaku_analyses" ON public.pelaku_analyses FOR ALL USING (true) WITH CHECK (true);`;

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 class="text-base font-extrabold text-slate-800">Aktifkan Sinkronisasi Cloud Supabase (Opsional)</h3>
            <button onclick="document.getElementById('pelaku-modal-container').innerHTML=''" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed">
            Saat ini arsip sudah tersimpan otomatis di <strong>Penyimpanan Browser Lokal</strong>. Agar data perusahaan juga tersinkronisasi lintas komputer &amp; cabang secara real-time, jalankan query berikut di <strong>SQL Editor Supabase</strong>:
          </p>
          <pre class="p-3 rounded-xl bg-slate-900 text-emerald-300 text-[11px] font-mono overflow-x-auto max-h-56">${this.escapeHtml(sqlSnippet)}</pre>
          <div class="flex items-center justify-end gap-2">
            <button onclick="navigator.clipboard?.writeText(this.dataset.sql); window.askrindoApp.showToast('SQL berhasil disalin ke clipboard!', 'success');" data-sql="${this.escapeHtml(sqlSnippet)}" class="px-4 py-2 rounded-xl text-xs font-bold bg-purple-700 text-white hover:bg-purple-800 transition">
              Salin Script SQL
            </button>
            <button onclick="document.getElementById('pelaku-modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
              Tutup
            </button>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  },

  // =========================================================================
  // TAB 2: ARSIP ANALISA PERUSAHAAN TERSIMPAN
  // =========================================================================
  getFilteredArchiveList(list) {
    const q = (this.archiveSearch || '').trim().toLowerCase();
    const qNorm = window.askrindoDB ? window.askrindoDB.normalizeCompanyId(this.archiveSearch).toLowerCase() : '';
    return list.filter(item => {
      const matchSearch = !q ||
        (item.companyName || '').toLowerCase().includes(q) ||
        (item.id || '').toLowerCase().includes(q) ||
        (qNorm && (item.id || '').toLowerCase().includes(qNorm)) ||
        (item.kapName || '').toLowerCase().includes(q) ||
        (item.sector || '').toLowerCase().includes(q) ||
        String(item.year1 || '').includes(q) ||
        String(item.year2 || '').includes(q);
      const matchFilter = this.archiveFilter === 'all' ||
        (this.archiveFilter === 'rac_pass' && Number(item.racFailCount) === 0) ||
        (this.archiveFilter === 'rac_fail' && Number(item.racFailCount) > 0);
      return matchSearch && matchFilter;
    });
  },

  setArchiveSearch(val) {
    this.archiveSearch = val;
    const tbody = document.getElementById('pelaku-archive-tbody');
    if (tbody && window.askrindoDB) {
      const list = window.askrindoDB.getPelakuAnalyses();
      tbody.innerHTML = this.renderArchiveRowsHtml(this.getFilteredArchiveList(list));
      if (window.lucide) window.lucide.createIcons();
    }
  },

  setArchiveFilter(filterVal) {
    this.archiveFilter = filterVal;
    window.askrindoApp.renderCurrentRoute();
  },

  renderArchiveRowsHtml(filtered) {
    if (!filtered || filtered.length === 0) {
      return `
        <tr>
          <td colspan="6" class="py-12 text-center text-slate-400">
            <i data-lucide="folder-open" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>
            <p class="font-semibold text-slate-600">Belum ada arsip analisa perusahaan yang cocok.</p>
            <p class="text-[11px] text-slate-400 mt-1">Gunakan tombol <strong>+ Buat Analisa Baru</strong> lalu klik <strong>Simpan Analisa</strong> agar tersimpan permanen per Nama Perusahaan (ID).</p>
          </td>
        </tr>
      `;
    }

    return filtered.map(item => {
      const m = item.summaryMetrics || {};
      const snapCount = Array.isArray(item.snapshots) ? item.snapshots.length : 1;
      const allPass = Number(item.racFailCount) === 0;
      return `
        <tr class="hover:bg-slate-50/80 transition">
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="font-bold text-slate-800 text-xs">${this.escapeHtml(item.companyName)}</span>
            </div>
            <span class="inline-block mt-1 px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 font-mono text-[10px] font-bold">
              ID: ${this.escapeHtml(item.id)}
            </span>
            <span class="block text-[10px] text-slate-400 mt-0.5 capitalize">
              ${this.escapeHtml(this.sectorLabel(item.sector))} &bull; ${item.auditStatus === 'audited' ? 'Audited KAP' : 'Unaudited'}
            </span>
          </td>
          <td class="py-3.5 px-4">
            <span class="font-bold text-slate-800 font-mono">Th ${this.escapeHtml(item.year1)} &ndash; ${this.escapeHtml(item.year2)}</span>
            <button onclick="window.PelakuModule.openCompanySnapshotsModal('${this.escapeHtml(item.id)}')" class="mt-1 flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:underline">
              <i data-lucide="history" class="w-3 h-3"></i>
              <span>${snapCount} Riwayat Periode</span>
            </button>
          </td>
          <td class="py-3.5 px-4">
            <span class="font-mono font-bold text-slate-800">${this.fmtRp(item.projectVal || 0, true)}</span>
            <span class="block text-[10px] text-slate-500 mt-0.5">Aset: ${this.fmtRp(m.ta2 || 0, true)}</span>
            <span class="block text-[10px] text-slate-500">EAT: ${this.fmtRp(m.eat2 || 0, true)}</span>
          </td>
          <td class="py-3.5 px-4">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-2 py-0.5 rounded-md text-[10px] font-black ${Number(item.score) >= 80 ? 'bg-emerald-100 text-emerald-800' : (Number(item.score) >= 65 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800')}">
                Skor ${Number(item.score || 0).toFixed(1)}
              </span>
              <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${allPass ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}">
                ${item.racPassCount ?? 0}/6 RAC
              </span>
            </div>
            <span class="block text-[10px] text-slate-400 mt-1">${this.escapeHtml(item.grade || '-')}</span>
          </td>
          <td class="py-3.5 px-4 text-[11px] text-slate-600">
            <span class="font-medium block">${this.formatDateTimeId(item.updatedAt)}</span>
            <span class="text-[10px] text-slate-400">Oleh: ${this.escapeHtml(item.updatedBy || '-')}</span>
          </td>
          <td class="py-3.5 px-4 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="window.PelakuModule.loadCompanyAnalysisById('${this.escapeHtml(item.id)}')" class="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-[11px] transition flex items-center gap-1 shadow-sm" title="Buka kembali analisa ini">
                <i data-lucide="folder-open" class="w-3.5 h-3.5"></i>
                <span>Buka</span>
              </button>
              <button onclick="window.PelakuModule.openCompanySnapshotsModal('${this.escapeHtml(item.id)}')" class="p-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition" title="Lihat Semua Riwayat Versi">
                <i data-lucide="layers" class="w-4 h-4"></i>
              </button>
              <button onclick="window.PelakuModule.deleteSavedCompany('${this.escapeHtml(item.id)}')" class="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Hapus Arsip Perusahaan">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  renderArchiveView(list) {
    const filtered = this.getFilteredArchiveList(list);
    const totalPassAll = list.filter(i => Number(i.racFailCount) === 0).length;
    const totalProjVal = list.reduce((acc, c) => acc + (Number(c.projectVal) || 0), 0);
    const cloudStatus = window.askrindoDB?.pelakuCloudStatus || 'unknown';

    return `
      <div id="pelaku-archive-root" class="space-y-6">
        <!-- Summary KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Perusahaan Tersimpan</p>
              <h4 class="text-2xl font-black text-slate-800">${list.length} <span class="text-xs font-normal text-slate-400">entitas</span></h4>
              <p class="text-[11px] text-purple-600 font-medium">Terindeks otomatis by ID Perusahaan</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <i data-lucide="building-2" class="w-6 h-6"></i>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Lolos Semua Standar RAC</p>
              <h4 class="text-2xl font-black text-emerald-600">${totalPassAll} <span class="text-xs font-normal text-slate-400">dari ${list.length}</span></h4>
              <p class="text-[11px] text-slate-500">Memenuhi 6 Indikator RAC Askrindo</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i data-lucide="shield-check" class="w-6 h-6"></i>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Akumulasi Nilai Proyek</p>
              <h4 class="text-xl font-black text-slate-800 truncate max-w-[180px]" title="${this.fmtRp(totalProjVal, false)}">${this.fmtRp(totalProjVal, true)}</h4>
              <p class="text-[11px] text-indigo-600 font-medium">Dasar Evaluasi NWC / Nilai Proyek</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <i data-lucide="briefcase" class="w-6 h-6"></i>
            </div>
          </div>
        </div>

        <!-- Search, Filter & Backup Toolbar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
          <div class="relative w-full lg:w-80">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5"></i>
            <input
              type="text"
              id="pelaku-archive-search"
              placeholder="Cari Nama Perusahaan, ID, KAP, atau Tahun..."
              value="${this.escapeHtml(this.archiveSearch)}"
              oninput="window.PelakuModule.setArchiveSearch(this.value)"
              class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 text-xs"
            />
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <button onclick="window.PelakuModule.setArchiveFilter('all')" class="px-3 py-1.5 rounded-xl font-semibold transition ${this.archiveFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Semua (${list.length})
            </button>
            <button onclick="window.PelakuModule.setArchiveFilter('rac_pass')" class="px-3 py-1.5 rounded-xl font-semibold transition ${this.archiveFilter === 'rac_pass' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Lulus RAC (${totalPassAll})
            </button>
            <button onclick="window.PelakuModule.setArchiveFilter('rac_fail')" class="px-3 py-1.5 rounded-xl font-semibold transition ${this.archiveFilter === 'rac_fail' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Tidak Lulus (${list.length - totalPassAll})
            </button>

            <div class="h-4 w-px bg-slate-200 hidden sm:block mx-1"></div>

            <button onclick="window.PelakuModule.exportArchiveJson()" class="px-3 py-1.5 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1" title="Unduh backup JSON semua perusahaan">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
              <span>Ekspor JSON</span>
            </button>
            <label class="px-3 py-1.5 rounded-xl font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1 cursor-pointer" title="Muat backup JSON dari perangkat lain">
              <i data-lucide="upload" class="w-3.5 h-3.5"></i>
              <span>Impor JSON</span>
              <input type="file" accept=".json,application/json" class="hidden" onchange="window.PelakuModule.handleImportArchiveFile(this)" />
            </label>
            ${cloudStatus === 'missing_table' ? `
              <button onclick="window.PelakuModule.openCloudSqlModal()" class="px-3 py-1.5 rounded-xl font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition flex items-center gap-1" title="Aktifkan sinkronisasi Cloud Supabase">
                <i data-lucide="database" class="w-3.5 h-3.5"></i>
                <span>Setup Cloud SQL</span>
              </button>
            ` : (cloudStatus === 'available' ? `
              <span class="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Cloud Sync Aktif
              </span>
            ` : '')}
          </div>
        </div>

        <!-- Archive Table -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th class="py-3.5 px-4">Perusahaan &amp; ID Analisa</th>
                  <th class="py-3.5 px-4">Periode &amp; Riwayat</th>
                  <th class="py-3.5 px-4">Proyek &amp; Neraca Eval</th>
                  <th class="py-3.5 px-4">Skor &amp; Kepatuhan RAC</th>
                  <th class="py-3.5 px-4">Terakhir Disimpan</th>
                  <th class="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody id="pelaku-archive-tbody" class="divide-y divide-slate-100">
                ${this.renderArchiveRowsHtml(filtered)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  // =========================================================================
  // AI OCR VISION ENGINE & UPLOAD MODAL (Gemini Multimodal Vision API)
  // =========================================================================
  openAiFinUploadModal(isReviewOnly = false) {
    let container = document.getElementById('pelaku-modal-container');
    if (!container) return;

    if (isReviewOnly && this.currentExtractedFinData) {
      this.renderAiFinReviewTable();
      return;
    }

    const curYr = new Date().getFullYear();
    const yr1 = curYr - 1;
    const yr2 = curYr;

    container.innerHTML = `
      <div id="aiFinModalBackdrop" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] overflow-y-auto">
          
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-700 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                <i data-lucide="sparkles" class="w-5 h-5 text-amber-300"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-800">AI OCR Vision Laporan Keuangan</h3>
                <p class="text-xs text-slate-500">Pindai berkas PDF / Gambar Neraca &amp; Laba Rugi Berbasis Gemini Vision</p>
              </div>
            </div>
            <button onclick="window.PelakuModule.closeAiFinUploadModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Target Tahun Buku -->
          <div class="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
            <span class="text-xs font-bold text-purple-900 block">Target Periode Laporan Keuangan:</span>
            <div class="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label class="block text-slate-600 mb-1 font-medium">Tahun Buku 1 (Sebelumnya)</label>
                <input type="number" id="aiFinTargetYear1" value="${yr1}" class="w-full px-3 py-1.5 rounded-xl border border-purple-200 font-bold font-mono text-center focus:border-purple-500 bg-white" />
              </div>
              <div>
                <label class="block text-slate-600 mb-1 font-medium">Tahun Buku 2 (Terakhir)</label>
                <input type="number" id="aiFinTargetYear2" value="${yr2}" class="w-full px-3 py-1.5 rounded-xl border border-purple-200 font-bold font-mono text-center focus:border-purple-500 bg-white" />
              </div>
            </div>
          </div>

          <!-- Area Upload Drag and Drop -->
          <div id="aiFinDropZone" 
               ondragover="event.preventDefault(); this.classList.add('border-purple-500', 'bg-purple-50/40');" 
               ondragleave="this.classList.remove('border-purple-500', 'bg-purple-50/40');" 
               ondrop="event.preventDefault(); this.classList.remove('border-purple-500', 'bg-purple-50/40'); window.PelakuModule.handleDropAiFinFiles(event);"
               class="border-2 border-dashed border-slate-300 rounded-3xl p-6 sm:p-8 text-center space-y-3 cursor-pointer hover:border-purple-500 hover:bg-purple-50/20 transition-all group"
               onclick="document.getElementById('aiFinFileInput').click()">
            
            <input type="file" id="aiFinFileInput" multiple accept=".pdf,image/png,image/jpeg,image/webp" class="hidden" onchange="window.PelakuModule.handleSelectAiFinFiles(this)" />
            
            <div class="w-14 h-14 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
              <i data-lucide="upload-cloud" class="w-7 h-7"></i>
            </div>
            
            <div>
              <p class="text-sm font-bold text-slate-800">Seret &amp; Lepaskan Berkas Laporan Keuangan ke Sini</p>
              <p class="text-xs text-slate-500 mt-1">atau <span class="text-purple-600 font-semibold underline">pilih dari komputer Anda</span></p>
            </div>

            <div class="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-400">
              <span class="px-2 py-0.5 rounded bg-slate-100 font-mono">PDF</span>
              <span class="px-2 py-0.5 rounded bg-slate-100 font-mono">JPG / PNG / WEBP</span>
              <span>&bull; Maks 25MB per berkas &bull; Multi-halaman</span>
            </div>
          </div>

          <!-- Daftar Berkas Terpilih -->
          <div id="aiFinFileListContainer" class="space-y-2 text-xs"></div>

          <!-- Progress Bar & Status Ekstraksi (Hidden default) -->
          <div id="aiFinProgressBox" class="hidden p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 space-y-3">
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2 text-purple-900 font-bold">
                <span class="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping"></span>
                <span id="aiFinProgressText">AI Multimodal Vision sedang menganalisis dokumen...</span>
              </div>
              <span id="aiFinProgressPct" class="font-mono font-extrabold text-purple-700">45%</span>
            </div>
            <div class="w-full h-2 bg-purple-200/60 rounded-full overflow-hidden">
              <div id="aiFinProgressBar" class="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full transition-all duration-300" style="width: 45%;"></div>
            </div>
            <p class="text-[11px] text-slate-500">Mengekstrak 27 akun keuangan Neraca &amp; Laba Rugi, menjumlahkan Kas &amp; Bank, dan merekonsiliasi saldo laba...</p>
          </div>

          <!-- Tombol Aksi Modal -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="button" onclick="window.PelakuModule.closeAiFinUploadModal()" class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
              Batal
            </button>
            <button type="button" id="btnStartAiFinExtraction" onclick="window.PelakuModule.runGeminiFinExtraction()" class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 shadow-md shadow-purple-600/30 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              <i data-lucide="sparkles" class="w-4 h-4 text-amber-300"></i>
              <span>Mulai Ekstraksi AI Vision</span>
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.selectedAiFinFiles = [];
    this.renderSelectedAiFinFiles();
  },

  closeAiFinUploadModal() {
    const container = document.getElementById('pelaku-modal-container');
    if (container) container.innerHTML = '';
  },

  handleSelectAiFinFiles(input) {
    if (!input || !input.files) return;
    const files = Array.from(input.files);
    files.forEach(f => {
      if (f.size > 25 * 1024 * 1024) {
        window.askrindoApp.showToast(`Berkas ${f.name} melebihi batas 25MB!`, 'error');
        return;
      }
      this.selectedAiFinFiles.push(f);
    });
    this.renderSelectedAiFinFiles();
  },

  handleDropAiFinFiles(e) {
    if (!e.dataTransfer || !e.dataTransfer.files) return;
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => {
      if (f.size > 25 * 1024 * 1024) {
        window.askrindoApp.showToast(`Berkas ${f.name} melebihi batas 25MB!`, 'error');
        return;
      }
      this.selectedAiFinFiles.push(f);
    });
    this.renderSelectedAiFinFiles();
  },

  removeAiFinFile(idx) {
    this.selectedAiFinFiles.splice(idx, 1);
    this.renderSelectedAiFinFiles();
  },

  renderSelectedAiFinFiles() {
    const list = document.getElementById('aiFinFileListContainer');
    const btn = document.getElementById('btnStartAiFinExtraction');
    if (!list) return;

    if (this.selectedAiFinFiles.length === 0) {
      list.innerHTML = '';
      if (btn) btn.disabled = true;
      return;
    }

    if (btn) btn.disabled = false;

    list.innerHTML = `
      <div class="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
        <div class="flex items-center justify-between text-slate-700 font-bold">
          <span>Berkas Siap Dipindai (${this.selectedAiFinFiles.length}):</span>
          <span class="text-purple-600 font-mono text-[10px]">Total: ${(this.selectedAiFinFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
        <div class="space-y-1.5 max-h-36 overflow-y-auto">
          ${this.selectedAiFinFiles.map((f, i) => `
            <div class="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 text-xs">
              <div class="flex items-center gap-2 truncate">
                <i data-lucide="${f.type.includes('pdf') ? 'file-text' : 'image'}" class="w-4 h-4 text-purple-600 shrink-0"></i>
                <span class="truncate font-medium text-slate-800">${f.name}</span>
                <span class="text-[10px] text-slate-400 shrink-0 font-mono">(${(f.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button onclick="window.PelakuModule.removeAiFinFile(${i})" class="text-slate-400 hover:text-rose-600 p-1 transition" title="Hapus">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  async fileToGenerativePart(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type || 'application/pdf'
          }
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async runGeminiFinExtraction() {
    const apiKey = this.getActiveGeminiApiKey();
    if (!apiKey) {
      window.askrindoApp.showToast('Kunci Gemini API tidak ditemukan. Silakan periksa pengaturan.', 'error');
      return;
    }

    if (this.selectedAiFinFiles.length === 0) {
      window.askrindoApp.showToast('Silakan pilih minimal 1 berkas Laporan Keuangan.', 'warning');
      return;
    }

    const y1 = parseInt(document.getElementById('aiFinTargetYear1')?.value) || 2024;
    const y2 = parseInt(document.getElementById('aiFinTargetYear2')?.value) || 2025;

    const pBox = document.getElementById('aiFinProgressBox');
    const pBar = document.getElementById('aiFinProgressBar');
    const pPct = document.getElementById('aiFinProgressPct');
    const pTxt = document.getElementById('aiFinProgressText');
    const btn = document.getElementById('btnStartAiFinExtraction');

    if (pBox) pBox.classList.remove('hidden');
    if (btn) btn.disabled = true;

    const setProgress = (pct, msg) => {
      if (pBar) pBar.style.width = `${pct}%`;
      if (pPct) pPct.textContent = `${pct}%`;
      if (pTxt) pTxt.textContent = msg;
    };

    try {
      setProgress(20, 'Membaca dan mengonversi berkas dokumen...');
      const parts = await Promise.all(this.selectedAiFinFiles.map(f => this.fileToGenerativePart(f)));

      setProgress(45, 'Menghubungkan ke Google Gemini Multimodal Vision API...');

      const promptText = `
Anda adalah seorang Senior Underwriter, Akuntan Publik, dan Analis Finansial Spesialis Pemindaian Dokumen Keuangan PT Asuransi Kredit Indonesia (Askrindo).
Tugas Anda adalah membaca dan mengekstrak data Laporan Keuangan (Neraca & Laporan Laba Rugi) dari berkas dokumen/gambar terlampir secara teliti, objektif, dan presisi.

TARGET TAHUN BUKU:
- Tahun 1 (Tahun Sebelumnya): ${y1}
- Tahun 2 (Tahun Terakhir / Berjalan): ${y2}

ATURAN AKUNTANSI STANDAR INDONESIA:
1. DETEKSI FORMAT ANGKA:
   - Format angka Indonesia lazim menggunakan tanda titik (.) sebagai pemisah ribuan dan koma (,) sebagai pemisah desimal (contoh: 1.250.000,50).
   - Pastikan membaca angka secara akurat. Ubah semua nilai menjadi angka nominal murni (number/integer) dalam satuan Rupiah penuh.
   - Bila laporan tertulis dalam ribuan ("Rp dalam ribuan / in thousands"), kalikan dengan 1.000.
   - Bila laporan tertulis dalam jutaan ("Rp dalam jutaan / in millions"), kalikan dengan 1.000.000.

2. ATURAN PENGGABUNGAN KAS & BANK:
   - Pos "Kas & Bank (Kas dan Setara Kas)" (kode: cash) WAJIB menampung seluruh saldo kas fisik dan rekening bank.
   - Jika laporan menyajikan baris terpisah untuk Kas dan Bank, JUMLAHKAN KEDUANYA menjadi satu nilai total pada "cash".
   - Jelaskan rinciannya di field "cash_breakdown" (contoh: "Kas Rp 50.000.000 + Bank Mandiri Rp 450.000.000 = Rp 500.000.000").

3. ATURAN PENYUSUTAN (depr):
   - Nilai akumulasi penyusutan wajib bernilai POSITIF pada data JSON, karena sistem akan otomatis menguranginya dari Aktiva Tetap (fa - depr).

4. DETEKSI STATUS AUDIT LAPORAN KEUANGAN:
   - Identifikasi apakah Laporan Keuangan merupakan laporan AUDITED KAP (ada laporan auditor independen, opini auditor, nama KAP) atau IN-HOUSE / UNAUDITED.
   - Tentukan nilai audit_status: "audited" atau "unaudited".
   - Jika audited, temukan: auditor_kap_name, auditor_opinion (WTP, WDP, Tidak Wajar, dll.), dan audit_report_date.

OUTPUT WAJIB HANYA FORMAT JSON MURNI TANPA BLOK MARKDOWN ATAU TEKS LAIN:
{
  "company_name": "Nama Perusahaan Calon Debitur / Rekanan",
  "year1": ${y1},
  "year2": ${y2},
  "audit_status": "audited" atau "unaudited",
  "auditor_kap_name": "Nama KAP atau '-'",
  "auditor_opinion": "Opini Auditor (contoh: Wajar Tanpa Pengecualian (WTP)) atau '-'",
  "audit_report_date": "Tanggal laporan audit atau '-'",
  "audit_detection_reason": "Alasan singkat deteksi audit",
  "data_year1": {
    "cash": 0, "cash_breakdown": "", "otherCa": 0, "ar": 0, "inv": 0, "otherAr": 0, "prepaid": 0,
    "fa": 0, "depr": 0, "invest": 0, "taxAsset": 0,
    "ap": 0, "stDebt": 0, "otherAp": 0, "accrued": 0, "ltDebt": 0,
    "capital": 0, "otherCap": 0, "retEarn": 0, "re": 0,
    "rev": 0, "cogs": 0, "opex": 0, "otherInc": 0, "otherExp": 0, "intExp": 0, "tax": 0, "div": 0
  },
  "data_year2": {
    "cash": 0, "cash_breakdown": "", "otherCa": 0, "ar": 0, "inv": 0, "otherAr": 0, "prepaid": 0,
    "fa": 0, "depr": 0, "invest": 0, "taxAsset": 0,
    "ap": 0, "stDebt": 0, "otherAp": 0, "accrued": 0, "ltDebt": 0,
    "capital": 0, "otherCap": 0, "retEarn": 0, "re": 0,
    "rev": 0, "cogs": 0, "opex": 0, "otherInc": 0, "otherExp": 0, "intExp": 0, "tax": 0, "div": 0
  }
}
      `.trim();

      const contents = [{
        role: 'user',
        parts: [...parts, { text: promptText }]
      }];

      setProgress(65, 'Menganalisis pos-pos neraca & laba rugi dengan Gemini Vision...');

      const candidateModels = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
      let response = null;
      let usedModel = '';

      for (const m of candidateModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: {
                temperature: 0.1,
                topP: 0.8,
                maxOutputTokens: 8192
              }
            })
          });

          if (res.ok) {
            response = await res.json();
            usedModel = m;
            break;
          }
        } catch (err) {
          console.warn(`Gagal memanggil model ${m}:`, err);
        }
      }

      if (!response) {
        throw new Error('Gagal menghubungi Gemini Vision API. Periksa kuota API Anda.');
      }

      setProgress(85, 'Memverifikasi dan merekonsiliasi saldo akuntansi...');

      const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();

      let parsedData = null;
      try {
        parsedData = JSON.parse(cleanJson);
      } catch (e) {
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Format balasan AI tidak dapat diuraikan sebagai JSON.');
        }
      }

      setProgress(100, 'Selesai! Menyiapkan tabel tinjauan verifikasi...');

      this.currentExtractedFinData = this.reconcileExtractedFinancialData(parsedData);
      
      setTimeout(() => {
        this.renderAiFinReviewTable();
      }, 500);

    } catch (err) {
      console.error(err);
      if (pBox) pBox.classList.add('hidden');
      if (btn) btn.disabled = false;
      window.askrindoApp.showToast(`Ekstraksi gagal: ${err.message}`, 'error');
    }
  },

  reconcileExtractedFinancialData(raw) {
    const d1 = raw.data_year1 || {};
    const d2 = raw.data_year2 || {};

    const cleanNum = (val) => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      return this.parseFormattedNumber(val);
    };

    FIN_ACCOUNT_KEYS.forEach(k => {
      d1[k] = cleanNum(d1[k]);
      d2[k] = cleanNum(d2[k]);
    });

    return {
      company_name: (raw.company_name || '').trim(),
      year1: raw.year1 || 2024,
      year2: raw.year2 || 2025,
      audit_status: raw.audit_status === 'audited' ? 'audited' : 'unaudited',
      auditor_kap_name: (raw.auditor_kap_name || '-').trim(),
      auditor_opinion: (raw.auditor_opinion || 'Wajar Tanpa Pengecualian (WTP)').trim(),
      audit_report_date: (raw.audit_report_date || '-').trim(),
      audit_detection_reason: raw.audit_detection_reason || '',
      data_year1: d1,
      data_year2: d2
    };
  },

  renderAiFinReviewTable() {
    const container = document.getElementById('pelaku-modal-container');
    if (!container || !this.currentExtractedFinData) return;

    const data = this.currentExtractedFinData;
    const y1 = data.year1;
    const y2 = data.year2;
    const d1 = data.data_year1;
    const d2 = data.data_year2;

    const rows = [
      { section: 'I. ASET LANCAR' },
      { k: 'cash', code: 'a', label: 'Kas & Bank (Kas dan Setara Kas)' },
      { k: 'otherCa', code: 'a2', label: 'Uang Jaminan / Aset Lancar Lainnya' },
      { k: 'ar', code: 'b', label: 'Piutang Usaha' },
      { k: 'inv', code: 'c', label: 'Persediaan Barang' },
      { k: 'otherAr', code: 'd', label: 'Piutang Lain-lain' },
      { k: 'prepaid', code: 'e', label: 'Biaya Dibayar Dimuka' },
      { subtotal: 'ca', label: 'TOTAL ASET LANCAR' },

      { section: 'II. ASET TETAP & LAIN-LAIN' },
      { k: 'fa', code: 'h', label: 'Aset Tetap (Fixed Assets)' },
      { k: 'depr', code: 'i', label: 'Penyusutan (Akumulasi Penyusutan)' },
      { k: 'invest', code: 'g', label: 'Investasi Saham' },
      { k: 'taxAsset', code: 'j', label: 'Aset Lain / Pajak Tangguhan' },
      { subtotal: 'nca', label: 'TOTAL ASET TETAP & LAINNYA' },
      { total: 'ta', label: 'TOTAL AKTIVA (ASET)' },

      { section: 'III. KEWAJIBAN / HUTANG' },
      { k: 'ap', code: 'm1', label: 'Hutang Usaha (Trade AP)' },
      { k: 'stDebt', code: 'm2', label: 'Hutang Jk. Pendek (Bank)' },
      { k: 'otherAp', code: 'm3', label: 'Hutang Lancar Lainnya' },
      { k: 'accrued', code: 'm4', label: 'Biaya YMH Dibayar' },
      { subtotal: 'cl', label: 'TOTAL HUTANG LANCAR' },
      { k: 'ltDebt', code: 'n', label: 'Hutang Jk. Panjang' },
      { subtotal: 'tl', label: 'TOTAL HUTANG' },

      { section: 'IV. EKUITAS / MODAL' },
      { k: 'capital', code: 'p', label: 'Modal / Saham Disetor' },
      { k: 'otherCap', code: 'q', label: 'Setoran Modal Lainnya' },
      { k: 'retEarn', code: 'q1', label: 'Laba Ditahan Periode Lalu' },
      { k: 're', code: 'q2', label: 'Laba Tahun Berjalan' },
      { subtotal: 'eq', label: 'TOTAL EKUITAS' },
      { total: 'pass', label: 'TOTAL PASSIVA (HUTANG + EKUITAS)' },

      { section: 'V. LAPORAN LABA RUGI' },
      { k: 'rev', code: 't', label: 'Pendapatan Netto (Omset)' },
      { k: 'cogs', code: 'u', label: 'Harga Pokok Penjualan (HPP)' },
      { subtotal: 'gp', label: 'LABA KOTOR' },
      { k: 'opex', code: 'v', label: 'Beban Operasional & Umum' },
      { k: 'otherInc', code: 'x', label: 'Pendapatan Lain-lain' },
      { k: 'otherExp', code: 'x2', label: 'Beban Lain-lain' },
      { k: 'intExp', code: 'y3', label: 'Biaya Bunga' },
      { k: 'tax', code: 'z1', label: 'Pajak Penghasilan' },
      { k: 'div', code: 'z2', label: 'Deviden' },
      { total: 'eat', label: 'LABA BERSIH (EAT)' }
    ];

    container.innerHTML = `
      <div id="aiFinModalBackdrop" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[92vh] overflow-y-auto">
          
          <!-- Header Review -->
          <div class="flex items-center justify-between border-b border-slate-100 pb-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <i data-lucide="check-check" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-extrabold text-slate-800">Verifikasi Hasil Ekstraksi AI Vision</h3>
                <p class="text-xs text-slate-500">Tinjau 27 pos keuangan Neraca &amp; Laba Rugi sebelum diterapkan ke modul PELAKU</p>
              </div>
            </div>
            <button onclick="window.PelakuModule.closeAiFinUploadModal()" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition">
              <i data-lucide="x" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Metadata Entitas & Status Audit -->
          <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900">${data.company_name || 'Rekanan Terdeteksi'}</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${data.audit_status === 'audited' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}">
                  ${data.audit_status === 'audited' ? 'Audited KAP' : 'In-House / Unaudited'}
                </span>
              </div>
              <p class="text-slate-500 text-[11px] mt-0.5">
                KAP: <strong>${data.auditor_kap_name}</strong> &bull; Opini: <strong>${data.auditor_opinion}</strong>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <span id="previewBalanceBadge1" class="px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                Th ${y1}: &check; BALANCE
              </span>
              <span id="previewBalanceBadge2" class="px-2.5 py-1 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                Th ${y2}: &check; BALANCE
              </span>
            </div>
          </div>

          <!-- Tabel Akun Laporan Keuangan 27 Pos -->
          <div class="max-h-96 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-sm">
            <table class="w-full text-left text-xs border-collapse">
              <thead class="bg-slate-100 text-slate-700 font-bold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th class="p-2.5 w-5/12">Uraian Akun Keuangan</th>
                  <th class="p-2.5 w-3.5/12 text-right">Tahun ${y1} (Rp)</th>
                  <th class="p-2.5 w-3.5/12 text-right">Tahun ${y2} (Rp)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-mono">
                ${rows.map((r) => {
                  if (r.section) {
                    return `
                      <tr class="bg-gradient-to-r from-[#002B49] to-indigo-900 text-white font-sans font-bold text-[11px]">
                        <td colspan="3" class="px-3 py-1.5 uppercase tracking-wide">${r.section}</td>
                      </tr>
                    `;
                  }
                  if (r.subtotal || r.total) {
                    const isTotal = !!r.total;
                    return `
                      <tr class="${isTotal ? 'bg-purple-100/70 font-black text-purple-950 border-t-2 border-b-2 border-purple-300' : 'bg-slate-50 font-bold text-slate-800'}">
                        <td class="p-2 font-sans">${r.label}</td>
                        <td class="p-2 text-right font-mono" id="ai_subtot_${r.subtotal || r.total}_1">0,00</td>
                        <td class="p-2 text-right font-mono" id="ai_subtot_${r.subtotal || r.total}_2">0,00</td>
                      </tr>
                    `;
                  }
                  const v1 = d1[r.k] !== undefined ? d1[r.k] : 0;
                  const v2 = d2[r.k] !== undefined ? d2[r.k] : 0;
                  return `
                    <tr class="hover:bg-slate-50/80 transition-colors">
                      <td class="p-2 font-sans text-slate-700">
                        <span class="inline-block w-6 text-slate-400 font-bold font-mono">${r.code || ''}</span>
                        ${r.label}
                      </td>
                      <td class="p-1.5">
                        <input type="text" id="ai_rev_${r.k}_1" value="${this.formatNumberWithDots(v1, true)}" oninput="window.PelakuModule.recalculateAiReviewBalances()" class="w-full px-2 py-1 rounded border border-slate-200 text-right font-mono text-xs focus:border-purple-500" />
                      </td>
                      <td class="p-1.5">
                        <input type="text" id="ai_rev_${r.k}_2" value="${this.formatNumberWithDots(v2, true)}" oninput="window.PelakuModule.recalculateAiReviewBalances()" class="w-full px-2 py-1 rounded border border-slate-200 text-right font-mono text-xs focus:border-purple-500" />
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Tombol Aksi Bawah Modal Review -->
          <div class="flex flex-col gap-3 pt-3 border-t border-slate-100">
            <label class="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none sm:self-end">
              <input type="checkbox" id="chkAiAutoSaveArchive" checked class="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500">
              <span>Simpan langsung ke <strong>Arsip Perusahaan</strong> setelah diterapkan</span>
            </label>
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-2">
                <button type="button" onclick="window.PelakuModule.openAiFinUploadModal()" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
                  &larr; Pindai Berkas Lain
                </button>
                <button type="button" onclick="window.PelakuModule.autoBalanceAiReviewRetainedEarnings()" class="px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition flex items-center gap-1.5" title="Seimbangkan Saldo Laba Otomatis">
                  <i data-lucide="scale" class="w-3.5 h-3.5"></i>
                  <span>Seimbangkan Neraca Otomatis</span>
                </button>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" onclick="window.PelakuModule.closeAiFinUploadModal()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">
                  Batal
                </button>
                <button type="button" onclick="window.PelakuModule.applyExtractedFinDataToForm()" class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/30 transition flex items-center gap-2">
                  <i data-lucide="check" class="w-4 h-4"></i>
                  <span>Terapkan ke Form Laporan Keuangan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.recalculateAiReviewBalances();
  },

  recalculateAiReviewBalances() {
    const getVal = (k, yr) => this.parseFormattedNumber(document.getElementById(`ai_rev_${k}_${yr}`)?.value) || 0;
    const y1 = this.currentExtractedFinData?.year1 || 2024;
    const y2 = this.currentExtractedFinData?.year2 || 2025;

    // Tahun 1
    const ca1 = getVal('cash', 1) + getVal('otherCa', 1) + getVal('ar', 1) + getVal('inv', 1) + getVal('otherAr', 1) + getVal('prepaid', 1);
    const nca1 = getVal('fa', 1) - Math.abs(getVal('depr', 1)) + getVal('invest', 1) + getVal('taxAsset', 1);
    const ta1 = ca1 + nca1;
    const cl1 = getVal('ap', 1) + getVal('stDebt', 1) + getVal('otherAp', 1) + getVal('accrued', 1);
    const lt1 = getVal('ltDebt', 1);
    const tl1 = cl1 + lt1;
    const eq1 = getVal('capital', 1) + getVal('otherCap', 1) + getVal('retEarn', 1) + getVal('re', 1);
    const pass1 = tl1 + eq1;
    const gp1 = getVal('rev', 1) - getVal('cogs', 1);
    const eat1 = gp1 - getVal('opex', 1) + getVal('otherInc', 1) - getVal('otherExp', 1) - getVal('intExp', 1) - getVal('tax', 1) - getVal('div', 1);

    // Tahun 2
    const ca2 = getVal('cash', 2) + getVal('otherCa', 2) + getVal('ar', 2) + getVal('inv', 2) + getVal('otherAr', 2) + getVal('prepaid', 2);
    const nca2 = getVal('fa', 2) - Math.abs(getVal('depr', 2)) + getVal('invest', 2) + getVal('taxAsset', 2);
    const ta2 = ca2 + nca2;
    const cl2 = getVal('ap', 2) + getVal('stDebt', 2) + getVal('otherAp', 2) + getVal('accrued', 2);
    const lt2 = getVal('ltDebt', 2);
    const tl2 = cl2 + lt2;
    const eq2 = getVal('capital', 2) + getVal('otherCap', 2) + getVal('retEarn', 2) + getVal('re', 2);
    const pass2 = tl2 + eq2;
    const gp2 = getVal('rev', 2) - getVal('cogs', 2);
    const eat2 = gp2 - getVal('opex', 2) + getVal('otherInc', 2) - getVal('otherExp', 2) - getVal('intExp', 2) - getVal('tax', 2) - getVal('div', 2);

    const updateEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = this.formatNumberWithDots(val, true);
    };

    updateEl('ai_subtot_ca_1', ca1);
    updateEl('ai_subtot_ca_2', ca2);
    updateEl('ai_subtot_nca_1', nca1);
    updateEl('ai_subtot_nca_2', nca2);
    updateEl('ai_subtot_ta_1', ta1);
    updateEl('ai_subtot_ta_2', ta2);
    updateEl('ai_subtot_cl_1', cl1);
    updateEl('ai_subtot_cl_2', cl2);
    updateEl('ai_subtot_tl_1', tl1);
    updateEl('ai_subtot_tl_2', tl2);
    updateEl('ai_subtot_eq_1', eq1);
    updateEl('ai_subtot_eq_2', eq2);
    updateEl('ai_subtot_pass_1', pass1);
    updateEl('ai_subtot_pass_2', pass2);
    updateEl('ai_subtot_gp_1', gp1);
    updateEl('ai_subtot_gp_2', gp2);
    updateEl('ai_subtot_eat_1', eat1);
    updateEl('ai_subtot_eat_2', eat2);

    const diff1 = Math.abs(ta1 - pass1);
    const isBal1 = diff1 < 1.0;
    const diff2 = Math.abs(ta2 - pass2);
    const isBal2 = diff2 < 1.0;

    const badge1 = document.getElementById('previewBalanceBadge1');
    const badge2 = document.getElementById('previewBalanceBadge2');

    if (badge1) {
      badge1.className = `px-2.5 py-1 rounded-full font-bold text-[11px] ${isBal1 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`;
      badge1.textContent = 'Th ' + y1 + ': ' + (isBal1 ? '✓ Neraca Balance' : ('Selisih ' + this.fmtRp(diff1)));
    }
    if (badge2) {
      badge2.className = `px-2.5 py-1 rounded-full font-bold text-[11px] ${isBal2 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}`;
      badge2.textContent = 'Th ' + y2 + ': ' + (isBal2 ? '✓ Neraca Balance' : ('Selisih ' + this.fmtRp(diff2)));
    }
  },

  autoBalanceAiReviewRetainedEarnings() {
    const getVal = (k, yr) => this.parseFormattedNumber(document.getElementById(`ai_rev_${k}_${yr}`)?.value) || 0;
    const setVal = (k, yr, v) => {
      const el = document.getElementById(`ai_rev_${k}_${yr}`);
      if (el) el.value = this.formatNumberWithDots(Math.round(v * 100) / 100, true);
    };

    [1, 2].forEach((yr) => {
      const act = getVal('cash', yr) + getVal('otherCa', yr) + getVal('ar', yr) + getVal('inv', yr) + getVal('otherAr', yr) + getVal('prepaid', yr) + getVal('fa', yr) - Math.abs(getVal('depr', yr)) + getVal('invest', yr) + getVal('taxAsset', yr);
      const liab = getVal('ap', yr) + getVal('stDebt', yr) + getVal('otherAp', yr) + getVal('accrued', yr) + getVal('ltDebt', yr);
      const cap = getVal('capital', yr) + getVal('otherCap', yr);
      const re = getVal('re', yr);
      
      const targetEquity = act - liab;
      const neededRetEarn = targetEquity - cap - re;
      setVal('retEarn', yr, neededRetEarn);
    });

    this.recalculateAiReviewBalances();
    window.askrindoApp.showToast('Saldo Laba berhasil diseimbangkan otomatis (Aktiva = Passiva)!', 'success');
  },

  applyExtractedFinDataToForm() {
    if (!this.currentExtractedFinData) return;

    // Ambil nilai terbaru dari input modal review (jika diedit analis)
    const d1 = {};
    const d2 = {};
    FIN_ACCOUNT_KEYS.forEach(k => {
      const el1 = document.getElementById(`ai_rev_${k}_1`);
      const el2 = document.getElementById(`ai_rev_${k}_2`);
      d1[k] = el1 ? this.parseFormattedNumber(el1.value) : (this.currentExtractedFinData.data_year1?.[k] || 0);
      d2[k] = el2 ? this.parseFormattedNumber(el2.value) : (this.currentExtractedFinData.data_year2?.[k] || 0);
    });

    const y1 = this.currentExtractedFinData.year1 || 2024;
    const y2 = this.currentExtractedFinData.year2 || 2025;
    const autoSaveArchive = document.getElementById('chkAiAutoSaveArchive')?.checked ?? true;

    this.formSourceMode = 'ocr';
    this.loadedCompanyId = null;
    this.preAutoMatchState = null;
    this.autoLoadedCompanyId = null;
    this.dismissedBannerForId = null;

    // Terapkan ke Form Utama
    const compInp = document.getElementById('pelaku-company');
    if (compInp && this.currentExtractedFinData.company_name) {
      compInp.value = this.currentExtractedFinData.company_name;
    }

    const y1Inp = document.getElementById('inp_year1');
    const y2Inp = document.getElementById('inp_year2');
    if (y1Inp) y1Inp.value = y1;
    if (y2Inp) y2Inp.value = y2;

    const auditSel = document.getElementById('pelaku-audit-status');
    if (auditSel) {
      auditSel.value = this.currentExtractedFinData.audit_status === 'audited' ? 'audited' : 'unaudited';
    }

    const kapInp = document.getElementById('pelaku-kap-name');
    if (kapInp) kapInp.value = this.currentExtractedFinData.auditor_kap_name || '-';

    const opInp = document.getElementById('pelaku-opinion');
    if (opInp) opInp.value = this.currentExtractedFinData.auditor_opinion || '-';

    // Isi 27 Pos Finansial untuk Kedua Tahun
    FIN_ACCOUNT_KEYS.forEach(k => {
      const el1 = document.getElementById(`inp_${k}_1`);
      const el2 = document.getElementById(`inp_${k}_2`);
      if (el1) el1.value = this.formatNumberWithDots(d1[k] || 0, true);
      if (el2) el2.value = this.formatNumberWithDots(d2[k] || 0, true);
    });

    this.closeAiFinUploadModal();
    this.updateYearLabels();
    this.calculateRatios();

    const companyName = document.getElementById('pelaku-company')?.value.trim() || '';
    const normId = companyName && window.askrindoDB ? window.askrindoDB.normalizeCompanyId(companyName) : '';
    const existingBeforeSave = normId && window.askrindoDB ? window.askrindoDB.getPelakuAnalysis(normId) : null;

    let savedRes = null;
    if (autoSaveArchive && companyName && normId) {
      savedRes = this.saveCurrentAnalysis(true);
    } else {
      this.historyBannerMatch = existingBeforeSave || null;
      this.historyBannerAutoLoaded = false;
      this.updateCompanyIdBadgeAndBanner();
      this.updateSaveIndicators();
    }

    const bd1 = (this.currentExtractedFinData?.data_year1?.cash_breakdown || '').trim();
    const bd2 = (this.currentExtractedFinData?.data_year2?.cash_breakdown || '').trim();
    const isMerged = (bd1 && !bd1.toLowerCase().includes('gabungan')) || (bd2 && !bd2.toLowerCase().includes('gabungan'));
    const extraMsg = isMerged ? ' (Termasuk penggabungan otomatis Kas + Bank)' : '';
    const saveMsg = savedRes ? ` & tersimpan otomatis ke Arsip (ID: ${savedRes.savedRecord.id})` : '';

    window.askrindoApp.showToast(`Laporan Keuangan Th ${y1} & ${y2} berhasil diterapkan ke 27 pos${extraMsg}${saveMsg}!`, 'success');
  },

  // =========================================================================
  // CETAK HASIL EVALUASI PDF RESMI ASKRINDO
  // =========================================================================
  printAnalysis() {
    this.calculateRatios();
    const c = this.currentAnalysis;
    if (!c) return;

    const modal = document.getElementById('pelaku-modal-container');
    if (!modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[92vh] overflow-y-auto printable-document">
          
          <!-- Kop Surat Resmi Askrindo -->
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div class="flex items-center gap-3">
              <img src="assets/images/logo-corporate.png" alt="Askrindo Logo" class="h-12 object-contain" />
              <div>
                <h2 class="text-sm font-extrabold text-[#002B49]">PT ASURANSI KREDIT INDONESIA</h2>
                <p class="text-[10px] text-slate-500 font-semibold">Lembar Evaluasi Rasio &amp; Laporan Keuangan Underwriting (Model 27 Pos Komparatif)</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-purple-600">MODUL PELAKU</span>
              <p class="text-[10px] text-slate-400">Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>

          <!-- Informasi Calon Debitur / Rekanan -->
          <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div class="flex items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <h3 class="font-bold text-slate-900 text-sm">${this.escapeHtml(c.company || '-')}</h3>
                <span class="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono text-[10px] font-bold">ID: ${this.escapeHtml(c.companyId || '-')}</span>
              </div>
              <span class="px-2.5 py-0.5 rounded font-black text-xs shrink-0 ${c.score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">
                ${this.escapeHtml(c.grade)} (Skor: ${c.score.toFixed(1)}/100)
              </span>
            </div>
            <p class="text-slate-600">
              Nilai Proyek: <strong>${this.fmtRp(c.projectVal, false)}</strong> &bull; Periode Buku: <strong>Th ${this.escapeHtml(c.year1)} &amp; ${this.escapeHtml(c.year2)}</strong> &bull; Status Laporan: <strong>${this.escapeHtml(c.auditStatus)}</strong>
            </p>
          </div>

          <!-- Matriks Kepatuhan Standar Risk Acceptance Criteria (RAC) Askrindo - Rasio Utama -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Kepatuhan Standar Risk Acceptance Criteria (RAC) &bull; Rasio Utama</h4>
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                ${c.passRacCount} RAC LULUS &bull; Indikator Utama: Current Ratio (&ge; 100%)
              </span>
            </div>
            <table class="w-full text-xs border border-slate-200">
              <tr class="bg-slate-100 font-bold">
                <th class="p-2 text-center w-7">No</th>
                <th class="p-2 text-left">Indikator Rasio Utama</th>
                <th class="p-2 text-left">Rumus Perhitungan</th>
                <th class="p-2 text-center">Standar RAC</th>
                <th class="p-2 text-center">Tahun ${c.year1}</th>
                <th class="p-2 text-center">Tahun ${c.year2} (Eval)</th>
                <th class="p-2 text-center">Status RAC</th>
                <th class="p-2 text-left">Analisis &amp; Keterangan Komparasi</th>
              </tr>
              ${c.racList.map(r => `
                <tr class="border-b">
                  <td class="p-2 text-center font-bold text-slate-500">${r.no}</td>
                  <td class="p-2 font-bold text-slate-800">${r.name}</td>
                  <td class="p-2 text-slate-600 font-mono text-[10px]">${r.formula}</td>
                  <td class="p-2 text-center font-mono font-bold">${r.rac}</td>
                  <td class="p-2 text-center font-mono">${r.v1}</td>
                  <td class="p-2 text-center font-mono font-bold ${r.pass ? 'text-emerald-700' : 'text-rose-700'}">${r.v2}</td>
                  <td class="p-2 text-center">
                    <span class="inline-block px-2 py-0.5 rounded text-[9px] font-bold ${r.pass ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
                      ${r.pass ? 'LULUS' : 'TIDAK LULUS'}
                    </span>
                  </td>
                  <td class="p-2 text-[10px] leading-relaxed">${r.ket}</td>
                </tr>
              `).join('')}
            </table>
          </div>

          <!-- Tabel Rasio Keuangan Utama -->
          <div>
            <h4 class="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Hasil Analisis Rasio Finansial Utama (Tahun ${c.year2})</h4>
            <table class="w-full text-xs border border-slate-200">
              <tr class="bg-slate-100 font-bold">
                <th class="p-2 text-left">Indikator Rasio</th>
                <th class="p-2 text-right">Hasil Analisis</th>
                <th class="p-2 text-left">Parameter Acuan Askrindo</th>
              </tr>
              <tr class="border-b"><td class="p-2">Current Ratio (Likuiditas)</td><td class="p-2 text-right font-mono font-bold">${c.currentRatio.toFixed(2)}%</td><td class="p-2 text-slate-500">&ge; 120% (Aman)</td></tr>
              <tr class="border-b"><td class="p-2">Quick Ratio (Acid Test)</td><td class="p-2 text-right font-mono font-bold">${c.quickRatio.toFixed(2)}%</td><td class="p-2 text-slate-500">&ge; 100% (Aman)</td></tr>
              <tr class="border-b"><td class="p-2">Cash Ratio (Ketersediaan Kas Cepat)</td><td class="p-2 text-right font-mono font-bold">${c.cashRatio.toFixed(2)}%</td><td class="p-2 text-slate-500">Likuiditas Cepat Kas &amp; Bank</td></tr>
              <tr class="border-b"><td class="p-2">Debt to Equity Ratio (DER)</td><td class="p-2 text-right font-mono font-bold">${c.der.toFixed(2)}x</td><td class="p-2 text-slate-500">&lt; 2.50x (Toleransi Maksimal)</td></tr>
              <tr class="border-b"><td class="p-2">Debt to Asset Ratio (DAR)</td><td class="p-2 text-right font-mono font-bold">${c.dar.toFixed(2)}%</td><td class="p-2 text-slate-500">Porsi Pengungkit Hutang</td></tr>
              <tr class="border-b"><td class="p-2">Net Profit Margin (NPM)</td><td class="p-2 text-right font-mono font-bold">${c.npm.toFixed(2)}%</td><td class="p-2 text-slate-500">Margin Laba Positif</td></tr>
              <tr class="border-b"><td class="p-2">Return on Equity (ROE)</td><td class="p-2 text-right font-mono font-bold">${c.roe.toFixed(2)}%</td><td class="p-2 text-slate-500">Efisiensi Imbal Modal</td></tr>
              <tr class="border-b"><td class="p-2">Pertumbuhan Omset (Sales Growth)</td><td class="p-2 text-right font-mono font-bold">${c.salesGrowth >= 0 ? '+' : ''}${c.salesGrowth.toFixed(2)}%</td><td class="p-2 text-slate-500">Pertumbuhan YoY (${c.year1} &rarr; ${c.year2})</td></tr>
              <tr><td class="p-2">Pertumbuhan Laba Bersih (Net Growth)</td><td class="p-2 text-right font-mono font-bold">${c.netProfitGrowth >= 0 ? '+' : ''}${c.netProfitGrowth.toFixed(2)}%</td><td class="p-2 text-slate-500">Pertumbuhan Laba Bersih YoY</td></tr>
            </table>
          </div>

          <!-- Rekomendasi Naratif Underwriting -->
          <div class="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-1 text-xs">
            <span class="font-bold text-purple-900 block uppercase tracking-wider text-[10px]">Kesimpulan &amp; Rekomendasi Underwriting:</span>
            <p class="text-slate-700 leading-relaxed font-medium">${c.narrative}</p>
          </div>

          <!-- Tombol Aksi Bawah -->
          <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 no-print">
            <button onclick="document.getElementById('pelaku-modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition text-xs">
              Tutup
            </button>
            <button onclick="window.print()" class="px-5 py-2 rounded-xl text-white font-semibold bg-purple-600 hover:bg-purple-700 transition text-xs flex items-center gap-1.5 shadow-md">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
