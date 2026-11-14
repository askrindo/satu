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
    const blankAcc = {};
    FIN_ACCOUNT_KEYS.forEach(k => { blankAcc[k] = ''; });
    return {
      companyName: '',
      sector: 'konstruksi',
      year1: '',
      year2: '',
      auditStatus: '',
      opinion: '',
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
          const ws = parsed.workspaceState;
          const hasD1 = ws.d1 && Object.values(ws.d1).some(v => Math.abs(Number(v) || 0) > 0);
          const hasD2 = ws.d2 && Object.values(ws.d2).some(v => Math.abs(Number(v) || 0) > 0);
          if (!hasD1 && !hasD2 && (parsed.formSourceMode === 'blank' || !ws.companyName)) {
            ws.year1 = '';
            ws.year2 = '';
            ws.auditStatus = '';
          }
          this.workspaceState = ws;
          this.formSourceMode = parsed.formSourceMode || 'blank';
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
    this.workspaceState = this.buildBlankState();
    this.formSourceMode = 'blank';
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
      year1: document.getElementById('inp_year1')?.value || '',
      year2: document.getElementById('inp_year2')?.value || '',
      auditStatus: document.getElementById('pelaku-audit-status')?.value || '',
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
                <span class="text-xs text-slate-300 font-semibold">Status Neraca <span id="lbl_balance_yr1" class="font-bold text-amber-300">${ws.year1 ? `Th ${this.escapeHtml(ws.year1)}` : 'Th 1'}</span>:</span>
                <span id="badge_balance_yr1" class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">
                  MENUNGGU DATA
                </span>
              </div>
              <div class="h-4 w-px bg-slate-700 hidden sm:block"></div>
              <div class="flex items-center gap-2">
                <span class="text-xs text-slate-300 font-semibold">Status Neraca <span id="lbl_balance_yr2" class="font-bold text-amber-300">${ws.year2 ? `Th ${this.escapeHtml(ws.year2)}` : 'Th 2'}</span>:</span>
                <span id="badge_balance_yr2" class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">
                  MENUNGGU DATA
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
                    <i data-lucide="building-2" class="w-4 h-4 text-purple-600"></i>
                    <span>1. Profil Calon Debitur / Rekanan</span>
                  </h3>
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

                <!-- Baris 2: Periode Finansial, Status Audit & Nilai Proyek (Sejajar & Rapi) -->
                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs items-end">
                  <div class="flex flex-col justify-end">
                    <label class="block font-semibold text-slate-700 mb-1.5 leading-tight min-h-[28px] flex items-end">Tahun 1 (Sebelumnya)</label>
                    <input type="text" inputmode="numeric" maxlength="4" id="inp_year1" value="${this.escapeHtml(ws.year1 || '')}" placeholder="Contoh: 2024" oninput="this.value=this.value.replace(/[^0-9]/g,''); window.PelakuModule.updateYearLabels(); window.PelakuModule.calculateRatios(); window.PelakuModule.onMetaFieldChanged();" onchange="window.PelakuModule.updateYearLabels(); window.PelakuModule.calculateRatios(); window.PelakuModule.onMetaFieldChanged();" onblur="window.PelakuModule.updateYearLabels(); window.PelakuModule.calculateRatios();" class="w-full h-10 px-3 rounded-xl border border-slate-200 text-center font-bold font-mono focus:border-purple-500 focus:outline-none bg-white transition" />
                  </div>
                  <div class="flex flex-col justify-end">
                    <label class="block font-semibold text-slate-700 mb-1.5 leading-tight min-h-[28px] flex items-end">Tahun 2 (Terakhir)</label>
                    <input type="text" inputmode="numeric" maxlength="4" id="inp_year2" value="${this.escapeHtml(ws.year2 || '')}" placeholder="Contoh: 2025" oninput="this.value=this.value.replace(/[^0-9]/g,''); window.PelakuModule.updateYearLabels(); window.PelakuModule.calculateRatios(); window.PelakuModule.onMetaFieldChanged();" onchange="window.PelakuModule.updateYearLabels(); window.PelakuModule.calculateRatios(); window.PelakuModule.onMetaFieldChanged();" onblur="window.PelakuModule.updateYearLabels(); window.PelakuModule.calculateRatios();" class="w-full h-10 px-3 rounded-xl border border-slate-200 text-center font-bold font-mono focus:border-purple-500 focus:outline-none bg-white transition" />
                  </div>
                  <div class="flex flex-col justify-end">
                    <label class="block font-semibold text-slate-700 mb-1.5 leading-tight min-h-[28px] flex items-end">Status Audit</label>
                    <select id="pelaku-audit-status" onchange="window.PelakuModule.onMetaFieldChanged()" class="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-medium focus:border-purple-500 focus:outline-none text-xs transition">
                      <option value="" ${!ws.auditStatus ? 'selected' : ''}>-- Status Audit --</option>
                      <option value="audited" ${ws.auditStatus === 'audited' ? 'selected' : ''}>Audited KAP</option>
                      <option value="unaudited" ${ws.auditStatus === 'unaudited' ? 'selected' : ''}>In-House / Unaudited</option>
                    </select>
                  </div>
                  <div class="flex flex-col justify-end">
                    <label class="block font-semibold text-slate-700 mb-1.5 leading-tight min-h-[28px] flex items-end">Nilai Proyek yang Dijamin (Rp)</label>
                    <input type="text" id="inp_projectValue" value="${projFormatted}" oninput="window.PelakuModule.handleDotInput(this); window.PelakuModule.onMetaFieldChanged();" onblur="window.PelakuModule.handleDotBlur(this); window.PelakuModule.calculateRatios();" class="w-full h-10 px-3 rounded-xl border border-purple-200 font-bold font-mono focus:border-purple-500 focus:outline-none bg-white transition" placeholder="Contoh: 15.000.000.000" />
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
                        <th class="p-2.5 w-[20%] text-right"><span id="thLabelYear1" class="font-bold">${ws.year1 ? `Tahun ${this.escapeHtml(ws.year1)}` : 'Tahun 1'}</span> (Rp)</th>
                        <th class="p-2.5 w-[7%] text-right">%</th>
                        <th class="p-2.5 w-[20%] text-right"><span id="thLabelYear2" class="font-bold">${ws.year2 ? `Tahun ${this.escapeHtml(ws.year2)}` : 'Tahun 2'}</span> (Rp)</th>
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
            </div>

            <!-- Kolom Kanan: Scoring & Evaluasi Underwriting Askrindo (4 cols) -->
            <div class="lg:col-span-4 space-y-6">
              <div class="bg-white rounded-3xl p-6 border-2 border-purple-500/20 shadow-xl space-y-5">
                
                <!-- Header Score -->
                <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span class="text-[10px] font-bold uppercase tracking-wider text-purple-600">Evaluasi Finansial Askrindo</span>
                    <h3 class="text-base font-black text-slate-800">Scoring &amp; Kelayakan Rekanan</h3>
                  </div>
                  <div id="pelaku-grade-badge" class="px-3.5 py-1.5 rounded-xl font-black text-xs bg-slate-100 text-slate-500 border border-slate-200">
                    BELUM DIANALISIS
                  </div>
                </div>

                <!-- Composite Score Banner -->
                <div class="p-5 rounded-2xl bg-gradient-to-br from-[#002B49] via-indigo-900 to-[#0A3D62] text-white shadow-lg space-y-2">
                  <div class="flex items-center justify-between text-xs text-indigo-200">
                    <span>Skor Finansial Komposit:</span>
                    <span id="pelaku-score-num" class="font-mono font-bold text-slate-300 text-sm">- / 100</span>
                  </div>
                  <div class="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                    <div id="pelaku-score-bar" class="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full" style="width: 0%;"></div>
                  </div>
                  <p id="pelaku-short-summary" class="text-[11px] text-slate-200 pt-1 leading-relaxed">
                    Belum ada data laporan keuangan yang dimasukkan untuk dianalisis.
                  </p>
                </div>

                <!-- Ratio Breakdown (27 Indikator Rasio) -->
                <div class="space-y-3 text-xs">
                  <div class="flex items-center justify-between">
                    <div>
                      <h4 class="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                        Indikator Rasio<span id="lbl_ratio_eval_yr">${ws.year2 ? ` (Th ${this.escapeHtml(ws.year2)})` : ''}</span>
                      </h4>
                      <span class="text-[10px] text-slate-400">27 Parameter Rasio Finansial</span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                      Standar Askrindo
                    </span>
                  </div>

                  <!-- Quick Search Filter -->
                  <div class="relative">
                    <input type="text" id="filter_ratio_input" placeholder="Cari rasio (CR, ROA, EBITDA, dll)..." oninput="window.PelakuModule.filterRatios(this.value)" class="w-full pl-8 pr-3 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition">
                    <i data-lucide="search" class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400"></i>
                  </div>

                  <!-- Header 2 Tahun Komparasi -->
                  <div class="flex items-center justify-between px-2.5 py-1.5 bg-slate-100/90 rounded-xl text-[10px] font-extrabold text-slate-600 border border-slate-200">
                    <span class="uppercase tracking-wider">Indikator Rasio</span>
                    <div class="flex items-center gap-1.5 shrink-0 font-mono">
                      <span id="col_ratio_yr1" class="w-[72px] text-right text-slate-600 truncate">${ws.year1 ? `Th ${this.escapeHtml(ws.year1)}` : 'Th 1'}</span>
                      <span class="text-slate-300 text-[10px]">|</span>
                      <span id="col_ratio_yr2" class="w-[72px] text-right text-purple-700 font-black truncate">${ws.year2 ? `Th ${this.escapeHtml(ws.year2)}` : 'Th 2'}</span>
                    </div>
                  </div>

                  <!-- 27 Ratio Rows Container (Menjalar ke bawah tanpa scroll internal) -->
                  <div id="pelaku-ratio-list-container" class="space-y-1">
                    <!-- 1. Current Ratio% x -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Current Ratio % x</span>
                        <span class="block text-[10px] text-slate-400">Standar: &ge; 100%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-cr-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-cr" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 2. Quick Ratio % x -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Quick Ratio % x</span>
                        <span class="block text-[10px] text-slate-400">Acid Test &bull; Standar: &gt; 100%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-qr-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-qr" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 3. Working Capital To Total Asset% -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Working Capital To Total Asset%</span>
                        <span class="block text-[10px] text-slate-400">Modal Kerja Bersih / Total Aktiva &bull; Standar: &gt; 0%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-wcta-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-wcta" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 4. DER% x -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">DER% x</span>
                        <span class="block text-[10px] text-slate-400">Debt to Equity &bull; Standar: &lt; 200%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-der-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-der" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 5. DAR% x -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">DAR% x</span>
                        <span class="block text-[10px] text-slate-400">Debt to Asset &bull; Batas Toleransi: &lt; 70%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-dar-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-dar" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 6. Long Term Debt to Equity% -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Long Term Debt to Equity%</span>
                        <span class="block text-[10px] text-slate-400">Hutang Jk. Panjang / Modal Sendiri &bull; Standar: &lt; 100%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-ltde-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-ltde" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 7. Total Asset Turnover x -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Total Asset Turnover x</span>
                        <span class="block text-[10px] text-slate-400">Penjualan / Total Aset &bull; Standar: &ge; 1.0x</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-tato-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-tato" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 8. Working Capital Turnover x -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Working Capital Turnover x</span>
                        <span class="block text-[10px] text-slate-400">Penjualan / Modal Kerja Bersih (NWC)</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-wcto-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-wcto" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 9. Receivable Turnover x -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Receivable Turnover x</span>
                        <span class="block text-[10px] text-slate-400">Penjualan / Piutang Usaha &bull; Standar: &ge; 4.0x</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-rto-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-rto" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 10. Day account Recieveable /Average Collection Period(hari) -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Day account Recieveable /Average Collection Period(hari)</span>
                        <span class="block text-[10px] text-slate-400">Rata-rata Waktu Penagihan Piutang &bull; Batas: &le; 90 hari</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-acp-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-acp" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 11. Inventory Turnover Ratio X -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Inventory Turnover Ratio X</span>
                        <span class="block text-[10px] text-slate-400">HPP / Persediaan Barang &bull; Standar: &ge; 4.0x</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-ito-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-ito" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 12. Day Inventory (hari) -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Day Inventory (hari)</span>
                        <span class="block text-[10px] text-slate-400">Rata-rata Hari Persediaan Tersimpan &bull; Batas: &le; 90 hari</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-dio-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-dio" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 13. Day account payable (hari) -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Day account payable (hari)</span>
                        <span class="block text-[10px] text-slate-400">Rata-rata Pembayaran Utang Usaha</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-dpo-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-dpo" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 14. ROA % x -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">ROA % x</span>
                        <span class="block text-[10px] text-slate-400">Return on Asset &bull; Standar: &ge; 1,0%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-roa-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-roa" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 15. ROE % x -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">ROE % x</span>
                        <span class="block text-[10px] text-slate-400">Return on Equity &bull; Standar: &ge; 5,0%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-roe-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-roe" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 16. ROI % -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">ROI %</span>
                        <span class="block text-[10px] text-slate-400">Return on Investment (EBIT / Aktiva) &bull; Standar: &gt; 0%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-roi-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-roi" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 17. Gross Profit Margin % -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Gross Profit Margin %</span>
                        <span class="block text-[10px] text-slate-400">Laba Kotor / Penjualan &bull; Standar: &gt; 0%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-gpm-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-gpm" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 18. Net Profit Margin % x -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Net Profit Margin % x</span>
                        <span class="block text-[10px] text-slate-400">Laba Bersih / Penjualan &bull; Standar: &gt; 10%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-npm-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-npm" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 19. Operating Income Ratio % -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Operating Income Ratio %</span>
                        <span class="block text-[10px] text-slate-400">EBIT / Penjualan (Net Operating Margin)</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-oir-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-oir" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 20. Operating Ratio % -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Operating Ratio %</span>
                        <span class="block text-[10px] text-slate-400">(HPP + Beban Usaha) / Penjualan &bull; Batas: &le; 95%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-opr-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-opr" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 21. Cash Ratio % x -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Cash Ratio % x</span>
                        <span class="block text-[10px] text-slate-400">Kas &amp; Bank / Hutang Lancar &bull; Standar: &gt; 40%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-cash-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-cash" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 22. Sales Growth % -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Sales Growth %</span>
                        <span class="block text-[10px] text-slate-400">Tren Kondisi Keuangan (YoY) &bull; Standar: Positif</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-sales-growth-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-sales-growth" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 23. Operating Profit Margin % -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Operating Profit Margin %</span>
                        <span class="block text-[10px] text-slate-400">Laba Bruto Operasi / Penjualan</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-opm-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-opm" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 24. Ebitda -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Ebitda</span>
                        <span class="block text-[10px] text-slate-400">Laba Usaha (EBIT) + Akum. Penyusutan</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-ebitda-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-ebitda" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 25. Ebitda to interest % -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Ebitda to interest %</span>
                        <span class="block text-[10px] text-slate-400">Interest Coverage (EBITDA / Bunga) &bull; Standar: &ge; 2.0x</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-ebitda-int-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-ebitda-int" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 26. Ebitda to debt % -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Ebitda to debt %</span>
                        <span class="block text-[10px] text-slate-400">EBITDA / Total Hutang &bull; Standar: &ge; 20%</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-ebitda-debt-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-ebitda-debt" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>

                    <!-- 27. Net Working Capital -->
                    <div class="pelaku-ratio-row flex items-center justify-between py-1.5 border-b border-slate-100 hover:bg-slate-50/70 px-1.5 rounded transition">
                      <div class="pr-2">
                        <span class="font-semibold text-slate-700">Net Working Capital</span>
                        <span class="block text-[10px] text-slate-400">Modal Kerja Bersih &bull; Standar: &gt; 40% Nilai Proyek</span>
                      </div>
                      <div class="flex items-center gap-1.5 shrink-0 text-right font-mono text-xs">
                        <span id="ratio-nwc-1" class="w-[72px] font-medium text-slate-500 text-right truncate" title="Tahun 1">-</span>
                        <span class="text-slate-200 text-[10px]">|</span>
                        <span id="ratio-nwc" class="w-[72px] font-bold text-slate-400 text-right truncate" title="Tahun 2">-</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Rekomendasi Narasi Underwriting Askrindo -->
                <div class="p-4 rounded-2xl bg-purple-50 border border-purple-200/70 space-y-2">
                  <span class="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                    <i data-lucide="shield-check" class="w-4 h-4 text-purple-600"></i>
                    Rekomendasi Komite Underwriting
                  </span>
                  <p id="pelaku-narrative" class="text-xs text-slate-500 leading-relaxed font-normal">
                    Silakan lengkapi pos-pos Laporan Keuangan pada tabel di sebelah kiri untuk melihat evaluasi finansial dan rekomendasi underwriting otomatis.
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
              -
            </td>
            <td class="py-2 px-1 text-right font-mono text-[11px] font-bold text-slate-600" id="pct_${row.id}_1">
              -
            </td>
            <td class="py-2 px-2 text-right font-mono font-extrabold text-xs" id="${row.id}_2">
              -
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
              -
            </td>
            <td class="py-1.5 px-1 text-right font-mono text-slate-400">
              -
            </td>
            <td class="py-1.5 px-2 text-right font-mono" id="${row.id}_2">
              -
            </td>
            <td class="py-1.5 px-1 text-right font-mono text-slate-400">
              -
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
    const y1 = document.getElementById('inp_year1')?.value?.trim() || '';
    const y2 = document.getElementById('inp_year2')?.value?.trim() || '';

    const th1 = document.getElementById('thLabelYear1');
    const th2 = document.getElementById('thLabelYear2');
    const b1 = document.getElementById('lbl_balance_yr1');
    const b2 = document.getElementById('lbl_balance_yr2');
    const rEval = document.getElementById('lbl_ratio_eval_yr');
    const colY1 = document.getElementById('col_ratio_yr1');
    const colY2 = document.getElementById('col_ratio_yr2');

    const lblY1 = y1 ? `Th ${y1}` : 'Th 1';
    const lblY2 = y2 ? `Th ${y2}` : 'Th 2';

    if (th1) th1.textContent = y1 ? `Tahun ${y1}` : 'Tahun 1';
    if (th2) th2.textContent = y2 ? `Tahun ${y2}` : 'Tahun 2';
    if (b1) b1.textContent = lblY1;
    if (b2) b2.textContent = lblY2;
    if (rEval) rEval.textContent = (y1 && y2) ? ` (Th ${y1} & ${y2})` : (y2 ? ` (Th ${y2})` : '');
    if (colY1) colY1.textContent = lblY1;
    if (colY2) colY2.textContent = lblY2;

    const yr1Title = y1 ? `Tahun ${y1}` : 'Tahun 1';
    const yr2Title = y2 ? `Tahun ${y2}` : 'Tahun 2';
    document.querySelectorAll('[id$="-1"]').forEach(el => {
      if (el.id.startsWith('ratio-')) el.title = yr1Title;
    });
    document.querySelectorAll('.pelaku-ratio-row').forEach(row => {
      const el2 = row.querySelector('.font-bold[id^="ratio-"]');
      if (el2) el2.title = yr2Title;
    });
  },

  calculateRatios() {
    // Jangan timpa state saat tab arsip aktif (elemen input tidak dirender)
    if (!document.getElementById('pelaku-company') || !document.getElementById('finStatementInputTable')) {
      return;
    }

    this.updateYearLabels();

    const getVal = (k, yr) => this.parseFormattedNumber(document.getElementById(`inp_${k}_${yr}`)?.value) || 0;

    const y1 = document.getElementById('inp_year1')?.value || '';
    const y2 = document.getElementById('inp_year2')?.value || '';

    // 1. Hitung Subtotal Neraca & Laba Rugi untuk Kedua Tahun
    const d1 = {};
    const d2 = {};
    FIN_ACCOUNT_KEYS.forEach(k => {
      d1[k] = getVal(k, 1);
      d2[k] = getVal(k, 2);
    });

    const hasData1 = FIN_ACCOUNT_KEYS.some(k => Math.abs(d1[k]) > 0);
    const hasData2 = FIN_ACCOUNT_KEYS.some(k => Math.abs(d2[k]) > 0);

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
      if (el1) el1.textContent = hasData1 ? this.formatNumberWithDots(v1, true) : '-';
      if (el2) el2.textContent = hasData2 ? this.formatNumberWithDots(v2, true) : '-';
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
        if (!hasData1 || !base1 || base1 <= 0) {
          el1.textContent = '-';
        } else {
          const p1 = (v1 / base1) * 100;
          el1.textContent = p1.toFixed(1).replace('.', ',') + '%';
        }
      }
      if (el2) {
        if (!hasData2 || !base2 || base2 <= 0) {
          el2.textContent = '-';
        } else {
          const p2 = (v2 / base2) * 100;
          el2.textContent = p2.toFixed(1).replace('.', ',') + '%';
        }
      }
    };

    const setGrw = (id, v1, v2) => {
      const el = document.getElementById(`grw_${id}`);
      if (!el) return;
      if (!hasData1 || !hasData2 || v1 === 0) {
        el.textContent = '-';
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
    const b1 = document.getElementById('badge_balance_yr1');
    const b2 = document.getElementById('badge_balance_yr2');
    let isBal1 = false;
    let isBal2 = false;

    if (b1) {
      if (!hasData1) {
        b1.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40';
        b1.innerHTML = 'MENUNGGU DATA';
      } else {
        const diff1 = Math.abs(ta1 - pass1);
        isBal1 = diff1 < 1.0;
        b1.className = `px-2.5 py-1 rounded-full text-xs font-bold ${isBal1 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/25 text-rose-300 border border-rose-500/50'}`;
        b1.innerHTML = isBal1 ? '&check; BALANCE' : `SELISIH ${this.fmtRp(diff1)}`;
      }
    }

    if (b2) {
      if (!hasData2) {
        b2.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40';
        b2.innerHTML = 'MENUNGGU DATA';
      } else {
        const diff2 = Math.abs(ta2 - pass2);
        isBal2 = diff2 < 1.0;
        b2.className = `px-2.5 py-1 rounded-full text-xs font-bold ${isBal2 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/25 text-rose-300 border border-rose-500/50'}`;
        b2.innerHTML = isBal2 ? '&check; BALANCE' : `SELISIH ${this.fmtRp(diff2)}`;
      }
    }

    // JIKA DATA EVALUASI KOSONG / BELUM DIISI:
    // Reset seluruh 27 indikator rasio, status RAC, dan scoring komposit ke state 'BELUM DIANALISIS' / '-'
    if (!hasData2) {
      const ratioIds = [
        'ratio-cr', 'ratio-qr', 'ratio-wcta', 'ratio-der', 'ratio-dar', 'ratio-ltde',
        'ratio-tato', 'ratio-wcto', 'ratio-rto', 'ratio-acp', 'ratio-ito', 'ratio-dio',
        'ratio-dpo', 'ratio-roa', 'ratio-roe', 'ratio-roi', 'ratio-gpm', 'ratio-npm',
        'ratio-oir', 'ratio-opr', 'ratio-cash', 'ratio-sales-growth', 'ratio-opm',
        'ratio-ebitda', 'ratio-ebitda-int', 'ratio-ebitda-debt', 'ratio-nwc'
      ];
      ratioIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
          el.textContent = '-';
          el.className = 'w-[72px] font-mono font-bold text-xs shrink-0 text-right text-slate-400 truncate';
        }
        const el1 = document.getElementById(`${id}-1`);
        if (el1) {
          el1.textContent = '-';
          el1.className = 'w-[72px] font-mono font-medium text-xs shrink-0 text-right text-slate-400 truncate';
        }
      });

      const bStatus = document.getElementById('badge_rac_pass_status');
      if (bStatus) {
        bStatus.textContent = '-';
        bStatus.className = 'font-bold text-slate-400';
      }

      const bPass = document.getElementById('badge_rac_pass_count');
      const bFail = document.getElementById('badge_rac_fail_count');
      if (bPass) {
        bPass.textContent = '0 RAC LULUS';
        bPass.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200';
      }
      if (bFail) {
        bFail.textContent = '0 TIDAK LULUS';
        bFail.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200';
      }

      const elBadge = document.getElementById('pelaku-grade-badge');
      const elScoreNum = document.getElementById('pelaku-score-num');
      const elScoreBar = document.getElementById('pelaku-score-bar');
      const elSumm = document.getElementById('pelaku-short-summary');
      const elNarr = document.getElementById('pelaku-narrative');

      if (elBadge) {
        elBadge.className = 'px-3.5 py-1.5 rounded-xl font-black text-xs bg-slate-100 text-slate-500 border border-slate-200';
        elBadge.textContent = 'BELUM DIANALISIS';
      }
      if (elScoreNum) elScoreNum.textContent = '- / 100';
      if (elScoreBar) elScoreBar.style.width = '0%';
      if (elSumm) elSumm.textContent = 'Belum ada data laporan keuangan yang dimasukkan untuk dianalisis.';
      if (elNarr) elNarr.textContent = 'Silakan lengkapi pos-pos Laporan Keuangan pada tabel di sebelah kiri untuk melihat evaluasi finansial dan scoring otomatis.';

      const companyRaw = document.getElementById('pelaku-company')?.value.trim() || '';
      const companyId = window.askrindoDB ? window.askrindoDB.normalizeCompanyId(companyRaw) : '';
      const auditStatus = document.getElementById('pelaku-audit-status')?.value || '';
      const projectVal = this.parseFormattedNumber(document.getElementById('inp_projectValue')?.value) || 0;

      const emptyRac = this.computeRacMatrix(
        { ca: ca1, nca: nca1, ta: ta1, cl: cl1, tl: tl1, eq: eq1, pass: pass1, rev: rev1, gp: gp1, ebit: ebit1, ebt: ebt1, eat: eat1 },
        { ca: ca2, nca: nca2, ta: ta2, cl: cl2, tl: tl2, eq: eq2, pass: pass2, rev: rev2, gp: gp2, ebit: ebit2, ebt: ebt2, eat: eat2 },
        y1, y2, projectVal, d1, d2
      );

      this.currentAnalysis = {
        hasData: false,
        company: companyRaw,
        companyId,
        year1: y1,
        year2: y2,
        auditStatus,
        projectVal,
        score: 0,
        grade: 'BELUM DIANALISIS',
        summaryText: 'Belum ada data laporan keuangan yang dimasukkan untuk dianalisis.',
        narrative: 'Silakan lengkapi pos-pos Laporan Keuangan pada tabel di sebelah kiri untuk melihat evaluasi finansial dan scoring otomatis.',
        ratios27: [
          { no: 1, name: 'Current Ratio% x', val1: '-', val: '-', std: 'Standar: ≥ 100,00%', pass: false },
          { no: 2, name: 'Quick Ratio % x', val1: '-', val: '-', std: 'Standar: > 100,00%', pass: false },
          { no: 3, name: 'Working Capital To Total Asset%', val1: '-', val: '-', std: 'Modal Kerja Bersih / Total Aktiva (Standar: > 0%)', pass: false },
          { no: 4, name: 'DER% x', val1: '-', val: '-', std: 'Standar: < 200,00%', pass: false },
          { no: 5, name: 'DAR% x', val1: '-', val: '-', std: 'Batas Toleransi: < 70,00%', pass: false },
          { no: 6, name: 'Long Term Debt to Equity%', val1: '-', val: '-', std: 'Hutang Jk. Panjang / Modal Sendiri (Standar: < 100%)', pass: false },
          { no: 7, name: 'Total Asset Turnover x', val1: '-', val: '-', std: 'Penjualan / Total Aset (Standar: ≥ 1.0x)', pass: false },
          { no: 8, name: 'Working Capital Turnover x', val1: '-', val: '-', std: 'Penjualan / Modal Kerja Bersih (NWC)', pass: false },
          { no: 9, name: 'Receivable Turnover x', val1: '-', val: '-', std: 'Penjualan / Piutang Usaha (Standar: ≥ 4.0x)', pass: false },
          { no: 10, name: 'Day account Recieveable /Average Collection Period(hari)', val1: '-', val: '-', std: 'Rata-rata Waktu Penagihan Piutang (Batas: ≤ 90 hari)', pass: false },
          { no: 11, name: 'Inventory Turnover Ratio X', val1: '-', val: '-', std: 'HPP / Persediaan Barang (Standar: ≥ 4.0x)', pass: false },
          { no: 12, name: 'Day Inventory (hari)', val1: '-', val: '-', std: 'Rata-rata Hari Persediaan Tersimpan (Batas: ≤ 90 hari)', pass: false },
          { no: 13, name: 'Day account payable (hari)', val1: '-', val: '-', std: 'Rata-rata Hari Pembayaran Utang Usaha', pass: false },
          { no: 14, name: 'ROA % x', val1: '-', val: '-', std: 'Standar: ≥ 1,00%', pass: false },
          { no: 15, name: 'ROE % x', val1: '-', val: '-', std: 'Standar: ≥ 5,00%', pass: false },
          { no: 16, name: 'ROI %', val1: '-', val: '-', std: 'Return on Investment (EBIT / Total Aktiva) (Standar: > 0%)', pass: false },
          { no: 17, name: 'Gross Profit Margin %', val1: '-', val: '-', std: 'Laba Kotor / Penjualan (Standar: > 0%)', pass: false },
          { no: 18, name: 'Net Profit Margin % x', val1: '-', val: '-', std: 'Standar: > 10,00%', pass: false },
          { no: 19, name: 'Operating Income Ratio %', val1: '-', val: '-', std: 'EBIT / Penjualan (Net Operating Margin)', pass: false },
          { no: 20, name: 'Operating Ratio %', val1: '-', val: '-', std: '(HPP + Beban Usaha) / Penjualan (Batas: ≤ 95%)', pass: false },
          { no: 21, name: 'Cash Ratio % x', val1: '-', val: '-', std: 'Standar: > 40,00%', pass: false },
          { no: 22, name: 'Sales Growth %', val1: '-', val: '-', std: 'Pertumbuhan Penjualan YoY (Standar: Positif)', pass: false },
          { no: 23, name: 'Operating Profit Margin %', val1: '-', val: '-', std: 'Laba Bruto Operasional / Penjualan', pass: false },
          { no: 24, name: 'Ebitda', val1: '-', val: '-', std: 'Laba Usaha (EBIT) + Akum. Penyusutan', pass: false },
          { no: 25, name: 'Ebitda to interest %', val1: '-', val: '-', std: 'Interest Coverage Ratio (Standar: ≥ 2.0x)', pass: false },
          { no: 26, name: 'Ebitda to debt %', val1: '-', val: '-', std: 'EBITDA / Total Hutang (Standar: ≥ 20%)', pass: false },
          { no: 27, name: 'Net Working Capital', val1: '-', val: '-', std: 'Standar: > 40,00% Nilai Proyek', pass: false }
        ],
        racList: emptyRac,
        passRacCount: 0,
        failRacCount: 0,
        d1,
        d2,
        totals1: { ca: ca1, nca: nca1, ta: ta1, cl: cl1, tl: tl1, eq: eq1, pass: pass1, rev: rev1, gp: gp1, ebit: ebit1, ebt: ebt1, eat: eat1 },
        totals2: { ca: ca2, nca: nca2, ta: ta2, cl: cl2, tl: tl2, eq: eq2, pass: pass2, rev: rev2, gp: gp2, ebit: ebit2, ebt: ebt2, eat: eat2 }
      };

      this.syncWorkspaceFromDom();
      this.updateCompanyIdBadgeAndBanner();
      this.updateSaveIndicators();
      return;
    }

    // 4. Perhitungan Rasio Finansial Komprehensif 2 Tahun (Tahun 1 & Tahun 2)
    const curCl = cl2 > 0 ? cl2 : 1;
    const curEq = eq2 > 0 ? eq2 : 1;
    const curTa = ta2 > 0 ? ta2 : 1;
    const curRev = rev2 > 0 ? rev2 : 1;
    const cogs2 = d2.cogs || 0;
    const curCogs = cogs2 > 0 ? cogs2 : curRev;

    // Tahun 1 Helpers
    const cogs1 = d1.cogs || 0;
    const curRev1 = rev1 > 0 ? rev1 : 1;
    const curCogs1 = cogs1 > 0 ? cogs1 : curRev1;
    const nwcVal1 = ca1 - cl1;

    // 1. Current Ratio% x
    const crVal = cl2 > 0 ? (ca2 / cl2) * 100 : (ca2 > 0 ? 999 : 0);
    const crX = cl2 > 0 ? (ca2 / cl2) : (ca2 > 0 ? 99.9 : 0);
    const crTxt = cl2 > 0 ? `${crVal.toFixed(2)}% (${crX.toFixed(2)}x)` : (ca2 > 0 ? 'N/A (Bebas Utang)' : '0.00%');

    const crVal1 = cl1 > 0 ? (ca1 / cl1) * 100 : (ca1 > 0 ? 999 : 0);
    const crX1 = cl1 > 0 ? (ca1 / cl1) : (ca1 > 0 ? 99.9 : 0);
    const crTxt1 = cl1 > 0 ? `${crVal1.toFixed(2)}% (${crX1.toFixed(2)}x)` : (ca1 > 0 ? 'N/A (Bebas Utang)' : '0.00%');

    // 2. Quick Ratio % x
    const quickAssets = (d2.cash || 0) + (d2.ar || 0) + (d2.otherAr || 0);
    const qrVal = cl2 > 0 ? (quickAssets / cl2) * 100 : (quickAssets > 0 ? 999 : 0);
    const qrX = cl2 > 0 ? (quickAssets / cl2) : (quickAssets > 0 ? 99.9 : 0);
    const qrTxt = cl2 > 0 ? `${qrVal.toFixed(2)}% (${qrX.toFixed(2)}x)` : (quickAssets > 0 ? 'N/A (Bebas Utang)' : '0.00%');

    const quickAssets1 = (d1.cash || 0) + (d1.ar || 0) + (d1.otherAr || 0);
    const qrVal1 = cl1 > 0 ? (quickAssets1 / cl1) * 100 : (quickAssets1 > 0 ? 999 : 0);
    const qrX1 = cl1 > 0 ? (quickAssets1 / cl1) : (quickAssets1 > 0 ? 99.9 : 0);
    const qrTxt1 = cl1 > 0 ? `${qrVal1.toFixed(2)}% (${qrX1.toFixed(2)}x)` : (quickAssets1 > 0 ? 'N/A (Bebas Utang)' : '0.00%');

    // 3. Working Capital To Total Asset%
    const nwcVal = ca2 - cl2;
    const wctaVal = ta2 > 0 ? (nwcVal / ta2) * 100 : 0;

    const wctaVal1 = ta1 > 0 ? (nwcVal1 / ta1) * 100 : 0;
    const wctaTxt1 = `${wctaVal1.toFixed(2)}%`;

    // 4. DER% x
    const derVal = eq2 > 0 ? (tl2 / eq2) * 100 : 0;
    const derX = eq2 > 0 ? (tl2 / eq2) : 0;

    const derVal1 = eq1 > 0 ? (tl1 / eq1) * 100 : 0;
    const derX1 = eq1 > 0 ? (tl1 / eq1) : 0;
    const derTxt1 = `${derVal1.toFixed(2)}% (${derX1.toFixed(2)}x)`;

    // 5. DAR% x
    const darVal = ta2 > 0 ? (tl2 / ta2) * 100 : 0;
    const darX = ta2 > 0 ? (tl2 / ta2) : 0;

    const darVal1 = ta1 > 0 ? (tl1 / ta1) * 100 : 0;
    const darX1 = ta1 > 0 ? (tl1 / ta1) : 0;
    const darTxt1 = `${darVal1.toFixed(2)}% (${darX1.toFixed(2)}x)`;

    // 6. Long Term Debt to Equity%
    const ltDebtVal = d2.ltDebt || 0;
    const ltdeVal = eq2 > 0 ? (ltDebtVal / eq2) * 100 : 0;

    const ltDebtVal1 = d1.ltDebt || 0;
    const ltdeVal1 = eq1 > 0 ? (ltDebtVal1 / eq1) * 100 : 0;
    const ltdeTxt1 = `${ltdeVal1.toFixed(2)}%`;

    // 7. Total Asset Turnover x
    const tatoVal = ta2 > 0 ? (rev2 / ta2) : 0;

    const tatoVal1 = ta1 > 0 ? (rev1 / ta1) : 0;
    const tatoTxt1 = `${tatoVal1.toFixed(2)}x`;

    // 8. Working Capital Turnover x
    const wctoVal = nwcVal > 0 ? (rev2 / nwcVal) : 0;

    const wctoVal1 = nwcVal1 > 0 ? (rev1 / nwcVal1) : 0;
    const wctoTxt1 = nwcVal1 > 0 ? `${wctoVal1.toFixed(2)}x` : 'N/A';

    // 9. Receivable Turnover x
    const arVal = d2.ar || 0;
    const rtoVal = arVal > 0 ? (rev2 / arVal) : 0;

    const arVal1 = d1.ar || 0;
    const rtoVal1 = arVal1 > 0 ? (rev1 / arVal1) : 0;
    const rtoTxt1 = arVal1 > 0 ? `${rtoVal1.toFixed(2)}x` : 'N/A';

    // 10. Day account Recieveable /Average Collection Period(hari)
    const acpVal = rev2 > 0 && arVal > 0 ? ((arVal / rev2) * 365) : 0;

    const acpVal1 = rev1 > 0 && arVal1 > 0 ? ((arVal1 / rev1) * 365) : 0;
    const acpTxt1 = `${Math.round(acpVal1)} hari`;

    // 11. Inventory Turnover Ratio X
    const invVal = d2.inv || 0;
    const itoVal = invVal > 0 ? (curCogs / invVal) : 0;

    const invVal1 = d1.inv || 0;
    const itoVal1 = invVal1 > 0 ? (curCogs1 / invVal1) : 0;
    const itoTxt1 = invVal1 > 0 ? `${itoVal1.toFixed(2)}x` : 'N/A';

    // 12. Day Inventory (hari)
    const dioVal = curCogs > 0 && invVal > 0 ? ((invVal / curCogs) * 365) : 0;

    const dioVal1 = curCogs1 > 0 && invVal1 > 0 ? ((invVal1 / curCogs1) * 365) : 0;
    const dioTxt1 = `${Math.round(dioVal1)} hari`;

    // 13. Day account payable (hari)
    const apVal = d2.ap || 0;
    const dpoVal = curCogs > 0 && apVal > 0 ? ((apVal / curCogs) * 365) : 0;

    const apVal1 = d1.ap || 0;
    const dpoVal1 = curCogs1 > 0 && apVal1 > 0 ? ((apVal1 / curCogs1) * 365) : 0;
    const dpoTxt1 = `${Math.round(dpoVal1)} hari`;

    // 14. ROA % x
    const roaVal = ta2 > 0 ? (eat2 / ta2) * 100 : 0;
    const roaX = ta2 > 0 ? (eat2 / ta2) : 0;

    const roaVal1 = ta1 > 0 ? (eat1 / ta1) * 100 : 0;
    const roaX1 = ta1 > 0 ? (eat1 / ta1) : 0;
    const roaTxt1 = `${roaVal1.toFixed(2)}% (${roaX1.toFixed(2)}x)`;

    // 15. ROE % x
    const roeVal = eq2 > 0 ? (eat2 / eq2) * 100 : 0;
    const roeX = eq2 > 0 ? (eat2 / eq2) : 0;

    const roeVal1 = eq1 > 0 ? (eat1 / eq1) * 100 : 0;
    const roeX1 = eq1 > 0 ? (eat1 / eq1) : 0;
    const roeTxt1 = `${roeVal1.toFixed(2)}% (${roeX1.toFixed(2)}x)`;

    // 16. ROI %
    const roiVal = ta2 > 0 ? (ebit2 / ta2) * 100 : 0;

    const roiVal1 = ta1 > 0 ? (ebit1 / ta1) * 100 : 0;
    const roiTxt1 = `${roiVal1.toFixed(2)}%`;

    // 17. Gross Profit Margin %
    const gpmVal = rev2 > 0 ? (gp2 / rev2) * 100 : 0;

    const gpmVal1 = rev1 > 0 ? (gp1 / rev1) * 100 : 0;
    const gpmTxt1 = `${gpmVal1.toFixed(2)}%`;

    // 18. Net Profit Margin % x
    const npmVal = rev2 > 0 ? (eat2 / rev2) * 100 : 0;
    const npmX = rev2 > 0 ? (eat2 / rev2) : 0;

    const npmVal1 = rev1 > 0 ? (eat1 / rev1) * 100 : 0;
    const npmX1 = rev1 > 0 ? (eat1 / rev1) : 0;
    const npmTxt1 = `${npmVal1.toFixed(2)}% (${npmX1.toFixed(2)}x)`;

    // 19. Operating Income Ratio %
    const oirVal = rev2 > 0 ? (ebit2 / rev2) * 100 : 0;

    const oirVal1 = rev1 > 0 ? (ebit1 / rev1) * 100 : 0;
    const oirTxt1 = `${oirVal1.toFixed(2)}%`;

    // 20. Operating Ratio %
    const opexVal = d2.opex || 0;
    const oprVal = rev2 > 0 ? (((cogs2 + opexVal) / rev2) * 100) : 0;

    const opexVal1 = d1.opex || 0;
    const oprVal1 = rev1 > 0 ? (((cogs1 + opexVal1) / rev1) * 100) : 0;
    const oprTxt1 = `${oprVal1.toFixed(2)}%`;

    // 21. Cash Ratio % x
    const cashVal = d2.cash || 0;
    const cashRatioVal = cl2 > 0 ? (cashVal / cl2) * 100 : (cashVal > 0 ? 999 : 0);
    const cashRatioX = cl2 > 0 ? (cashVal / cl2) : (cashVal > 0 ? 99.9 : 0);
    const cashRatioTxt = cl2 > 0 ? `${cashRatioVal.toFixed(2)}% (${cashRatioX.toFixed(2)}x)` : (cashVal > 0 ? 'N/A (Bebas Utang)' : '0.00%');

    const cashVal1 = d1.cash || 0;
    const cashRatioVal1 = cl1 > 0 ? (cashVal1 / cl1) * 100 : (cashVal1 > 0 ? 999 : 0);
    const cashRatioX1 = cl1 > 0 ? (cashVal1 / cl1) : (cashVal1 > 0 ? 99.9 : 0);
    const cashRatioTxt1 = cl1 > 0 ? `${cashRatioVal1.toFixed(2)}% (${cashRatioX1.toFixed(2)}x)` : (cashVal1 > 0 ? 'N/A (Bebas Utang)' : '0.00%');

    // 22. Sales Growth %
    const salesGrowth = rev1 > 0 ? ((rev2 - rev1) / rev1) * 100 : 0;
    const netProfitGrowth = eat1 !== 0 ? ((eat2 - eat1) / Math.abs(eat1)) * 100 : 0;
    const salesGrowthTxt1 = '-';

    // 23. Operating Profit Margin %
    const opmVal = rev2 > 0 ? (opBruto2 / rev2) * 100 : 0;

    const opmVal1 = rev1 > 0 ? (opBruto1 / rev1) * 100 : 0;
    const opmTxt1 = `${opmVal1.toFixed(2)}%`;

    // 24. Ebitda
    const deprVal = d2.depr || 0;
    const ebitdaVal = ebit2 + deprVal;

    const deprVal1 = d1.depr || 0;
    const ebitdaVal1 = ebit1 + deprVal1;
    const ebitdaTxt1 = this.fmtRp(ebitdaVal1);

    // 25. Ebitda to interest %
    const intVal = d2.intExp || 0;
    const ebitdaIntVal = intVal > 0 ? ((ebitdaVal / intVal) * 100) : null;
    const ebitdaIntX = intVal > 0 ? (ebitdaVal / intVal) : null;

    const intVal1 = d1.intExp || 0;
    const ebitdaIntVal1 = intVal1 > 0 ? ((ebitdaVal1 / intVal1) * 100) : null;
    const ebitdaIntX1 = intVal1 > 0 ? (ebitdaVal1 / intVal1) : null;
    const ebitdaIntTxt1 = ebitdaIntVal1 !== null ? `${ebitdaIntVal1.toFixed(2)}% (${ebitdaIntX1.toFixed(2)}x)` : 'N/A (Bebas Bunga)';

    // 26. Ebitda to debt %
    const ebitdaDebtVal = tl2 > 0 ? ((ebitdaVal / tl2) * 100) : null;
    const ebitdaDebtX = tl2 > 0 ? (ebitdaVal / tl2) : null;

    const ebitdaDebtVal1 = tl1 > 0 ? ((ebitdaVal1 / tl1) * 100) : null;
    const ebitdaDebtTxt1 = ebitdaDebtVal1 !== null ? `${ebitdaDebtVal1.toFixed(2)}%` : 'N/A (Bebas Utang)';

    // 27. Net Working Capital (nwcVal)
    const nwcToProject = projectVal > 0 ? (nwcVal / projectVal) * 100 : 0;
    const selfFinVal = projectVal > 0 ? (eq2 / projectVal) * 100 : (ta2 > 0 ? (eq2 / ta2) * 100 : 0);

    const nwcToProject1 = projectVal > 0 ? (nwcVal1 / projectVal) * 100 : 0;
    const nwcTxt1 = `${this.fmtRp(nwcVal1)}${projectVal > 0 ? ` (${nwcToProject1.toFixed(1)}%)` : ''}`;

    // Update Ratio Badges & Texts (Tahun 1 & Tahun 2)
    const updateText = (id, txt, colorCls) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = txt;
        if (colorCls) el.className = `w-[72px] font-mono font-bold text-xs shrink-0 text-right ${colorCls} truncate`;
      }
    };
    const updateText1 = (id, txt, colorCls) => {
      const el = document.getElementById(`${id}-1`);
      if (el) {
        el.textContent = hasData1 ? txt : '-';
        if (colorCls) el.className = `w-[72px] font-mono font-medium text-xs shrink-0 text-right ${hasData1 ? colorCls : 'text-slate-400'} truncate`;
      }
    };

    updateText('ratio-cr', crTxt, (crVal >= 100 || cl2 === 0) ? 'text-emerald-600' : (crVal >= 75 ? 'text-blue-600' : 'text-rose-600'));
    updateText1('ratio-cr', crTxt1, (crVal1 >= 100 || cl1 === 0) ? 'text-emerald-600' : (crVal1 >= 75 ? 'text-blue-600' : 'text-rose-600'));

    updateText('ratio-qr', qrTxt, (qrVal > 100 || cl2 === 0) ? 'text-emerald-600' : (qrVal > 60 ? 'text-amber-600' : 'text-rose-600'));
    updateText1('ratio-qr', qrTxt1, (qrVal1 > 100 || cl1 === 0) ? 'text-emerald-600' : (qrVal1 > 60 ? 'text-amber-600' : 'text-rose-600'));

    updateText('ratio-wcta', `${wctaVal.toFixed(2)}%`, wctaVal > 0 ? 'text-slate-800' : 'text-rose-600');
    updateText1('ratio-wcta', wctaTxt1, wctaVal1 > 0 ? 'text-slate-700' : 'text-rose-600');

    updateText('ratio-der', `${derVal.toFixed(2)}% (${derX.toFixed(2)}x)`, derVal < 200 ? 'text-emerald-600' : (derVal < 300 ? 'text-amber-600' : 'text-rose-600'));
    updateText1('ratio-der', derTxt1, derVal1 < 200 ? 'text-emerald-600' : (derVal1 < 300 ? 'text-amber-600' : 'text-rose-600'));

    updateText('ratio-dar', `${darVal.toFixed(2)}% (${darX.toFixed(2)}x)`, darVal < 70 ? 'text-slate-800' : 'text-rose-600');
    updateText1('ratio-dar', darTxt1, darVal1 < 70 ? 'text-slate-700' : 'text-rose-600');

    updateText('ratio-ltde', `${ltdeVal.toFixed(2)}%`, 'text-slate-800');
    updateText1('ratio-ltde', ltdeTxt1, 'text-slate-700');

    updateText('ratio-tato', `${tatoVal.toFixed(2)}x`, 'text-slate-800');
    updateText1('ratio-tato', tatoTxt1, 'text-slate-700');

    updateText('ratio-wcto', nwcVal > 0 ? `${wctoVal.toFixed(2)}x` : 'N/A', 'text-slate-800');
    updateText1('ratio-wcto', wctoTxt1, 'text-slate-700');

    updateText('ratio-rto', arVal > 0 ? `${rtoVal.toFixed(2)}x` : 'N/A', 'text-slate-800');
    updateText1('ratio-rto', rtoTxt1, 'text-slate-700');

    updateText('ratio-acp', `${Math.round(acpVal)} hari`, acpVal <= 90 ? 'text-slate-800' : 'text-amber-600');
    updateText1('ratio-acp', acpTxt1, acpVal1 <= 90 ? 'text-slate-700' : 'text-amber-600');

    updateText('ratio-ito', invVal > 0 ? `${itoVal.toFixed(2)}x` : 'N/A', 'text-slate-800');
    updateText1('ratio-ito', itoTxt1, 'text-slate-700');

    updateText('ratio-dio', `${Math.round(dioVal)} hari`, 'text-slate-800');
    updateText1('ratio-dio', dioTxt1, 'text-slate-700');

    updateText('ratio-dpo', `${Math.round(dpoVal)} hari`, 'text-slate-800');
    updateText1('ratio-dpo', dpoTxt1, 'text-slate-700');

    updateText('ratio-roa', `${roaVal.toFixed(2)}% (${roaX.toFixed(2)}x)`, roaVal >= 1.0 ? 'text-emerald-600' : (roaVal >= 0.5 ? 'text-amber-600' : 'text-rose-600'));
    updateText1('ratio-roa', roaTxt1, roaVal1 >= 1.0 ? 'text-emerald-600' : (roaVal1 >= 0.5 ? 'text-amber-600' : 'text-rose-600'));

    updateText('ratio-roe', `${roeVal.toFixed(2)}% (${roeX.toFixed(2)}x)`, roeVal >= 5.0 ? 'text-emerald-600' : (roeVal >= 3.0 ? 'text-amber-600' : 'text-rose-600'));
    updateText1('ratio-roe', roeTxt1, roeVal1 >= 5.0 ? 'text-emerald-600' : (roeVal1 >= 3.0 ? 'text-amber-600' : 'text-rose-600'));

    updateText('ratio-roi', `${roiVal.toFixed(2)}%`, roiVal > 0 ? 'text-purple-600' : 'text-rose-600');
    updateText1('ratio-roi', roiTxt1, roiVal1 > 0 ? 'text-purple-600' : 'text-rose-600');

    updateText('ratio-gpm', `${gpmVal.toFixed(2)}%`, gpmVal > 0 ? 'text-blue-600' : 'text-rose-600');
    updateText1('ratio-gpm', gpmTxt1, gpmVal1 > 0 ? 'text-blue-600' : 'text-rose-600');

    updateText('ratio-npm', `${npmVal.toFixed(2)}% (${npmX.toFixed(2)}x)`, npmVal > 10.0 ? 'text-emerald-600' : (npmVal > 2.0 ? 'text-amber-600' : 'text-rose-600'));
    updateText1('ratio-npm', npmTxt1, npmVal1 > 10.0 ? 'text-emerald-600' : (npmVal1 > 2.0 ? 'text-amber-600' : 'text-rose-600'));

    updateText('ratio-oir', `${oirVal.toFixed(2)}%`, oirVal > 0 ? 'text-blue-600' : 'text-rose-600');
    updateText1('ratio-oir', oirTxt1, oirVal1 > 0 ? 'text-blue-600' : 'text-rose-600');

    updateText('ratio-opr', `${oprVal.toFixed(2)}%`, oprVal <= 95 ? 'text-slate-800' : 'text-rose-600');
    updateText1('ratio-opr', oprTxt1, oprVal1 <= 95 ? 'text-slate-700' : 'text-rose-600');

    updateText('ratio-cash', cashRatioTxt, (cashRatioVal > 40 || cl2 === 0) ? 'text-emerald-600' : (cashRatioVal > 20 ? 'text-amber-600' : 'text-rose-600'));
    updateText1('ratio-cash', cashRatioTxt1, (cashRatioVal1 > 40 || cl1 === 0) ? 'text-emerald-600' : (cashRatioVal1 > 20 ? 'text-amber-600' : 'text-rose-600'));

    updateText('ratio-sales-growth', `${salesGrowth >= 0 ? '+' : ''}${salesGrowth.toFixed(2)}%`, salesGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600');
    updateText1('ratio-sales-growth', salesGrowthTxt1, 'text-slate-400');

    updateText('ratio-opm', `${opmVal.toFixed(2)}%`, opmVal > 0 ? 'text-blue-600' : 'text-rose-600');
    updateText1('ratio-opm', opmTxt1, opmVal1 > 0 ? 'text-blue-600' : 'text-rose-600');

    updateText('ratio-ebitda', this.fmtRp(ebitdaVal), ebitdaVal > 0 ? 'text-indigo-700' : 'text-rose-600');
    updateText1('ratio-ebitda', ebitdaTxt1, ebitdaVal1 > 0 ? 'text-indigo-700' : 'text-rose-600');

    updateText('ratio-ebitda-int', ebitdaIntVal !== null ? `${ebitdaIntVal.toFixed(2)}% (${ebitdaIntX.toFixed(2)}x)` : 'N/A (Bebas Bunga)', (ebitdaIntX >= 2.0 || ebitdaIntVal === null) ? 'text-emerald-600' : 'text-rose-600');
    updateText1('ratio-ebitda-int', ebitdaIntTxt1, (ebitdaIntX1 >= 2.0 || ebitdaIntVal1 === null) ? 'text-emerald-600' : 'text-rose-600');

    updateText('ratio-ebitda-debt', ebitdaDebtVal !== null ? `${ebitdaDebtVal.toFixed(2)}%` : 'N/A (Bebas Utang)', 'text-indigo-600');
    updateText1('ratio-ebitda-debt', ebitdaDebtTxt1, 'text-indigo-600');

    updateText('ratio-nwc', `${this.fmtRp(nwcVal)}${projectVal > 0 ? ` (${nwcToProject.toFixed(1)}%)` : ''}`, (nwcToProject > 40 || (projectVal === 0 && nwcVal >= 0)) ? 'text-emerald-600' : (nwcToProject > 10 ? 'text-amber-600' : 'text-rose-600'));
    updateText1('ratio-nwc', nwcTxt1, (nwcToProject1 > 40 || (projectVal === 0 && nwcVal1 >= 0)) ? 'text-emerald-600' : (nwcToProject1 > 10 ? 'text-amber-600' : 'text-rose-600'));

    // 5. Composite Scoring & Grade Askrindo (Berdasarkan Parameter Rasio Finansial Penuh)
    const auditStatus = document.getElementById('pelaku-audit-status')?.value || '';
    const isAudited = auditStatus === 'audited';

    const scores = {};

    // Parameter 10: Current Ratio %
    if (crVal >= 100 || cl2 === 0) scores.cr = 100;
    else if (crVal >= 75) scores.cr = 60;
    else if (crVal >= 0.1) scores.cr = 30;
    else scores.cr = 0;

    // Parameter 11: Quick Ratio %
    if (qrVal > 100 || cl2 === 0) scores.qr = 100;
    else if (qrVal > 75) scores.qr = 80;
    else if (qrVal > 60) scores.qr = 60;
    else if (qrVal > 40) scores.qr = 40;
    else scores.qr = 20;

    // Parameter 12: Cash Ratio %
    if (cashRatioVal > 40 || cl2 === 0) scores.cash = 100;
    else if (cashRatioVal > 30) scores.cash = 80;
    else if (cashRatioVal > 20) scores.cash = 60;
    else if (cashRatioVal > 10) scores.cash = 40;
    else scores.cash = 20;

    // Parameter 13: Return on Asset %
    if (roaVal >= 1.0) scores.roa = 100;
    else if (roaVal >= 0.5) scores.roa = 60;
    else if (roaVal >= 0.1) scores.roa = 30;
    else scores.roa = 0;

    // Parameter 14: Return on Equity %
    if (roeVal >= 5.0) scores.roe = 100;
    else if (roeVal >= 3.0) scores.roe = 60;
    else if (roeVal >= 0.1) scores.roe = 30;
    else scores.roe = 0;

    // Parameter 15: Nett Profit Margin %
    if (npmVal > 10.0) scores.npm = 100;
    else if (npmVal > 5.0) scores.npm = 75;
    else if (npmVal > 2.0) scores.npm = 50;
    else if (npmVal > 0.0) scores.npm = 25;
    else scores.npm = 0;

    // Parameter 16: Debt Equity Ratio (DER) %
    if (derVal < 200) scores.der = 100;
    else if (derVal < 250) scores.der = 75;
    else if (derVal < 300) scores.der = 50;
    else scores.der = 25;

    // Parameter 17: Net Working Capital (vs Nilai Proyek)
    if (projectVal > 0) {
      if (nwcToProject > 40) scores.nwc = 100;
      else if (nwcToProject > 20) scores.nwc = 75;
      else if (nwcToProject > 10) scores.nwc = 50;
      else scores.nwc = 25;
    } else {
      scores.nwc = nwcVal > 0 ? 100 : 25;
    }

    // Parameter 18: Self Financing, Modal Internal
    if (selfFinVal > 20) scores.selfFin = 100;
    else if (selfFinVal >= 15) scores.selfFin = 80;
    else if (selfFinVal >= 10) scores.selfFin = 60;
    else if (selfFinVal >= 5) scores.selfFin = 40;
    else scores.selfFin = 20;

    // Parameter Tren Kondisi Laporan Keuangan 2 Tahun Terakhir (Auto-computed dari data Y1 vs Y2)
    let trendScore = 50; // default: belum ada data Y1 → positif stabil
    if (hasData1 && hasData2) {
      // Hitung arah tiap indikator kunci (positif = naik/membaik, negatif = turun/memburuk)
      const indikators = [
        // 1. Pertumbuhan Penjualan (bobot 2x)
        rev1 > 0 ? (rev2 > rev1 ? 2 : (rev2 === rev1 ? 0 : -2)) : 0,
        // 2. Pertumbuhan Laba Bersih (bobot 2x)
        (eat1 !== 0) ? (eat2 > eat1 && eat2 > 0 ? 2 : (eat2 === eat1 ? 0 : -2)) : (eat2 > 0 ? 2 : 0),
        // 3. Pertumbuhan Total Aset
        ta1 > 0 ? (ta2 > ta1 ? 1 : (ta2 === ta1 ? 0 : -1)) : 0,
        // 4. Pertumbuhan Net Working Capital
        (ca1 - cl1) !== 0 ? ((ca2 - cl2) > (ca1 - cl1) ? 1 : ((ca2 - cl2) === (ca1 - cl1) ? 0 : -1)) : 0,
        // 5. Pertumbuhan Ekuitas
        eq1 > 0 ? (eq2 > eq1 ? 1 : (eq2 === eq1 ? 0 : -1)) : 0
      ];
      const trendSum = indikators.reduce((a, b) => a + b, 0); // range: -7 to +7
      // A: Tren positif naik (skor 100) → mayoritas indikator membaik
      // B: Positif stabil (skor 50) → seimbang
      // C: Negatif (skor 0) → mayoritas indikator memburuk
      if (trendSum >= 3) trendScore = 100;       // ≥ 3 poin positif → Tren positif naik
      else if (trendSum >= 0) trendScore = 50;   // 0–2 → Positif stabil
      else trendScore = 0;                        // negatif → Tren negatif
    }
    scores.trend = trendScore;

    const scoreVals = Object.values(scores);
    let avgRawScore = scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length;

    if (isAudited) avgRawScore = Math.min(avgRawScore + 2, 100);
    if (isBal1 && isBal2) avgRawScore = Math.min(avgRawScore + 1, 100);

    const score = Math.round(avgRawScore * 10) / 10;

    let grade = 'GRADE A (SEHAT & SANGAT LAYAK)';
    let gradeCls = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    let summaryText = 'Profil rekanan sangat prima, memenuhi standar underwriting RAC likuiditas, solvabilitas dan kapasitas Askrindo.';
    let narrative = 'Rekanan memenuhi standar RAC dan kriteria underwriting 5C. Sangat layak diberikan persetujuan penjaminan kredit & surety bond.';

    if (score < 50) {
      grade = 'GRADE D (RISIKO TINGGI / PERTIMBANGAN KHUSUS)';
      gradeCls = 'bg-rose-100 text-rose-800 border-rose-300';
      summaryText = 'Tingkat likuiditas sangat ketat atau struktur modal berisiko tinggi melampaui batas toleransi wajar Askrindo.';
      narrative = 'TIDAK DIREKOMENDASIKAN untuk penjaminan tanpa persetujuan khusus komite penjaminan dan mitigasi agunan penuh.';
    } else if (score < 65) {
      grade = 'GRADE C (CUKUP SEHAT / BERSYARAT)';
      gradeCls = 'bg-amber-100 text-amber-800 border-amber-300';
      summaryText = 'Terdapat indikator likuiditas, modal kerja atau solvabilitas yang mendekati batas toleransi risiko.';
      narrative = 'Dapat dipertimbangkan bersyarat dengan mitigasi risiko tambahan, agunan likuid, atau pembatasan nilai penjaminan.';
    } else if (score < 80) {
      grade = 'GRADE B (SEHAT STANDAR / LAYAK)';
      gradeCls = 'bg-blue-100 text-blue-800 border-blue-300';
      summaryText = 'Profil rekanan memenuhi standar wajar industri dengan indikator likuiditas dan operasional positif.';
      narrative = 'Layak diberikan fasilitas penjaminan dengan syarat dan pemantauan standar komite kredit.';
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

    const racList = this.computeRacMatrix(totals1, totals2, y1, y2, projectVal, d1, d2);
    const passRacCount = racList.filter(r => r.pass).length;
    const failRacCount = racList.length - passRacCount;

    const racItem = racList[0] || {};
    const bStatus = document.getElementById('badge_rac_pass_status');
    if (bStatus) {
      bStatus.textContent = racItem.pass ? 'LULUS' : 'TIDAK LULUS';
      bStatus.className = `font-bold ${racItem.pass ? 'text-emerald-600' : 'text-rose-600'}`;
    }
    const crEl = document.getElementById('ratio-cr');
    if (crEl) {
      crEl.textContent = crTxt;
      crEl.className = `w-[72px] font-mono font-bold text-xs shrink-0 text-right ${racItem.pass ? 'text-emerald-600' : 'text-rose-600'} truncate`;
    }
    const crEl1 = document.getElementById('ratio-cr-1');
    if (crEl1) {
      crEl1.textContent = hasData1 ? crTxt1 : '-';
      crEl1.className = `w-[72px] font-mono font-medium text-xs shrink-0 text-right ${hasData1 ? ((crVal1 >= 100 || cl1 === 0) ? 'text-emerald-600' : (crVal1 >= 75 ? 'text-blue-600' : 'text-rose-600')) : 'text-slate-400'} truncate`;
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

    const ratios27 = [
      { no: 1, name: 'Current Ratio% x', val1: hasData1 ? crTxt1 : '-', val: crTxt, std: 'Standar: ≥ 100,00%', pass: crVal >= 100 || cl2 === 0 },
      { no: 2, name: 'Quick Ratio % x', val1: hasData1 ? qrTxt1 : '-', val: qrTxt, std: 'Standar: > 100,00%', pass: qrVal > 100 || cl2 === 0 },
      { no: 3, name: 'Working Capital To Total Asset%', val1: hasData1 ? wctaTxt1 : '-', val: `${wctaVal.toFixed(2)}%`, std: 'Modal Kerja Bersih / Total Aktiva (Standar: > 0%)', pass: wctaVal > 0 },
      { no: 4, name: 'DER% x', val1: hasData1 ? derTxt1 : '-', val: `${derVal.toFixed(2)}% (${derX.toFixed(2)}x)`, std: 'Standar: < 200,00%', pass: derVal < 200 },
      { no: 5, name: 'DAR% x', val1: hasData1 ? darTxt1 : '-', val: `${darVal.toFixed(2)}% (${darX.toFixed(2)}x)`, std: 'Batas Toleransi: < 70,00%', pass: darVal < 70 },
      { no: 6, name: 'Long Term Debt to Equity%', val1: hasData1 ? ltdeTxt1 : '-', val: `${ltdeVal.toFixed(2)}%`, std: 'Hutang Jk. Panjang / Modal Sendiri (Standar: < 100%)', pass: ltdeVal < 100 },
      { no: 7, name: 'Total Asset Turnover x', val1: hasData1 ? tatoTxt1 : '-', val: `${tatoVal.toFixed(2)}x`, std: 'Penjualan / Total Aset (Standar: ≥ 1.0x)', pass: tatoVal >= 1.0 },
      { no: 8, name: 'Working Capital Turnover x', val1: hasData1 ? wctoTxt1 : '-', val: nwcVal > 0 ? `${wctoVal.toFixed(2)}x` : 'N/A', std: 'Penjualan / Modal Kerja Bersih (NWC)', pass: wctoVal > 0 },
      { no: 9, name: 'Receivable Turnover x', val1: hasData1 ? rtoTxt1 : '-', val: arVal > 0 ? `${rtoVal.toFixed(2)}x` : 'N/A', std: 'Penjualan / Piutang Usaha (Standar: ≥ 4.0x)', pass: rtoVal >= 4.0 },
      { no: 10, name: 'Day account Recieveable /Average Collection Period(hari)', val1: hasData1 ? acpTxt1 : '-', val: `${Math.round(acpVal)} hari`, std: 'Rata-rata Waktu Penagihan Piutang (Batas: ≤ 90 hari)', pass: acpVal <= 90 },
      { no: 11, name: 'Inventory Turnover Ratio X', val1: hasData1 ? itoTxt1 : '-', val: invVal > 0 ? `${itoVal.toFixed(2)}x` : 'N/A', std: 'HPP / Persediaan Barang (Standar: ≥ 4.0x)', pass: itoVal >= 4.0 },
      { no: 12, name: 'Day Inventory (hari)', val1: hasData1 ? dioTxt1 : '-', val: `${Math.round(dioVal)} hari`, std: 'Rata-rata Hari Persediaan Tersimpan (Batas: ≤ 90 hari)', pass: dioVal <= 90 },
      { no: 13, name: 'Day account payable (hari)', val1: hasData1 ? dpoTxt1 : '-', val: `${Math.round(dpoVal)} hari`, std: 'Rata-rata Hari Pembayaran Utang Usaha', pass: true },
      { no: 14, name: 'ROA % x', val1: hasData1 ? roaTxt1 : '-', val: `${roaVal.toFixed(2)}% (${roaX.toFixed(2)}x)`, std: 'Standar: ≥ 1,00%', pass: roaVal >= 1.0 },
      { no: 15, name: 'ROE % x', val1: hasData1 ? roeTxt1 : '-', val: `${roeVal.toFixed(2)}% (${roeX.toFixed(2)}x)`, std: 'Standar: ≥ 5,00%', pass: roeVal >= 5.0 },
      { no: 16, name: 'ROI %', val1: hasData1 ? roiTxt1 : '-', val: `${roiVal.toFixed(2)}%`, std: 'Return on Investment (EBIT / Total Aktiva) (Standar: > 0%)', pass: roiVal > 0 },
      { no: 17, name: 'Gross Profit Margin %', val1: hasData1 ? gpmTxt1 : '-', val: `${gpmVal.toFixed(2)}%`, std: 'Laba Kotor / Penjualan (Standar: > 0%)', pass: gpmVal > 0 },
      { no: 18, name: 'Net Profit Margin % x', val1: hasData1 ? npmTxt1 : '-', val: `${npmVal.toFixed(2)}% (${npmX.toFixed(2)}x)`, std: 'Standar: > 10,00%', pass: npmVal > 10.0 },
      { no: 19, name: 'Operating Income Ratio %', val1: hasData1 ? oirTxt1 : '-', val: `${oirVal.toFixed(2)}%`, std: 'EBIT / Penjualan (Net Operating Margin)', pass: oirVal > 0 },
      { no: 20, name: 'Operating Ratio %', val1: hasData1 ? oprTxt1 : '-', val: `${oprVal.toFixed(2)}%`, std: '(HPP + Beban Usaha) / Penjualan (Batas: ≤ 95%)', pass: oprVal <= 95 },
      { no: 21, name: 'Cash Ratio % x', val1: hasData1 ? cashRatioTxt1 : '-', val: cashRatioTxt, std: 'Standar: > 40,00%', pass: cashRatioVal > 40 || cl2 === 0 },
      { no: 22, name: 'Sales Growth %', val1: '-', val: `${salesGrowth >= 0 ? '+' : ''}${salesGrowth.toFixed(2)}%`, std: 'Pertumbuhan Penjualan YoY (Standar: Positif)', pass: salesGrowth >= 0 },
      { no: 23, name: 'Operating Profit Margin %', val1: hasData1 ? opmTxt1 : '-', val: `${opmVal.toFixed(2)}%`, std: 'Laba Bruto Operasional / Penjualan', pass: opmVal > 0 },
      { no: 24, name: 'Ebitda', val1: hasData1 ? ebitdaTxt1 : '-', val: this.fmtRp(ebitdaVal), std: 'Laba Usaha (EBIT) + Akum. Penyusutan', pass: ebitdaVal > 0 },
      { no: 25, name: 'Ebitda to interest %', val1: hasData1 ? ebitdaIntTxt1 : '-', val: ebitdaIntVal !== null ? `${ebitdaIntVal.toFixed(2)}% (${ebitdaIntX.toFixed(2)}x)` : 'N/A (Bebas Bunga)', std: 'Interest Coverage Ratio (Standar: ≥ 2.0x)', pass: ebitdaIntX >= 2.0 || ebitdaIntVal === null },
      { no: 26, name: 'Ebitda to debt %', val1: hasData1 ? ebitdaDebtTxt1 : '-', val: ebitdaDebtVal !== null ? `${ebitdaDebtVal.toFixed(2)}%` : 'N/A (Bebas Hutang)', std: 'EBITDA / Total Hutang (Standar: ≥ 20%)', pass: ebitdaDebtVal >= 20 || ebitdaDebtVal === null },
      { no: 27, name: 'Net Working Capital', val1: hasData1 ? nwcTxt1 : '-', val: this.fmtRp(nwcVal), std: 'Standar: > 40,00% Nilai Proyek', pass: projectVal > 0 ? (nwcToProject > 40) : (nwcVal >= 0) }
    ];

    // Simpan objek analisis untuk lembar cetak
    const companyRaw = document.getElementById('pelaku-company')?.value.trim() || '';
    const companyId = window.askrindoDB ? window.askrindoDB.normalizeCompanyId(companyRaw) : '';
    this.currentAnalysis = {
      hasData: true,
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
      ratios27,
      currentRatio: crVal,
      quickRatio: qrVal,
      cashRatio: cashRatioVal,
      der: derX,
      dar: darVal,
      npm: npmVal,
      roe: roeVal,
      roa: roaVal,
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

  filterRatios(query) {
    const q = (query || '').toLowerCase().trim();
    const rows = document.querySelectorAll('.pelaku-ratio-row');
    rows.forEach(r => {
      const text = (r.textContent || '').toLowerCase();
      r.style.display = (!q || text.includes(q)) ? '' : 'none';
    });
  },

  computeRacMatrix(totals1, totals2, yr1, yr2, projectVal, d1 = {}, d2 = {}) {
    const hasData1 = totals1 && (totals1.ta > 0 || totals1.tl > 0 || totals1.rev > 0);
    const hasData2 = totals2 && (totals2.ta > 0 || totals2.tl > 0 || totals2.rev > 0);

    if (!hasData2) {
      return [
        { no: 1, name: 'Current Ratio (CR)', formula: 'Aset Lancar / Liab. Lancar', rac: '&ge; 100,00%', v1: '-', v2: '-', pass: false, ket: 'Belum ada data' },
        { no: 2, name: 'Quick Ratio (QR)', formula: '(Kas + Piutang) / Liab. Lancar', rac: '&gt; 100,00%', v1: '-', v2: '-', pass: false, ket: 'Belum ada data' },
        { no: 3, name: 'Cash Ratio', formula: 'Kas & Bank / Liab. Lancar', rac: '&gt; 40,00%', v1: '-', v2: '-', pass: false, ket: 'Belum ada data' },
        { no: 4, name: 'Debt to Equity Ratio (DER)', formula: 'Total Liabilitas / Total Ekuitas', rac: '&lt; 200,00%', v1: '-', v2: '-', pass: false, ket: 'Belum ada data' },
        { no: 5, name: 'Return on Asset (ROA)', formula: 'EAT / Total Aset', rac: '&ge; 1,00%', v1: '-', v2: '-', pass: false, ket: 'Belum ada data' },
        { no: 6, name: 'Return on Equity (ROE)', formula: 'EAT / Total Ekuitas', rac: '&ge; 5,00%', v1: '-', v2: '-', pass: false, ket: 'Belum ada data' },
        { no: 7, name: 'Nett Profit Margin (NPM)', formula: 'EAT / Penjualan', rac: '&gt; 10,00%', v1: '-', v2: '-', pass: false, ket: 'Belum ada data' },
        { no: 8, name: 'Net Working Capital (NWC)', formula: projectVal > 0 ? 'NWC Riil / Nilai Proyek' : 'Aset Lancar - Liab. Lancar', rac: projectVal > 0 ? '&gt; 40,00% Proyek' : '&gt; Rp 0', v1: '-', v2: '-', pass: false, ket: 'Belum ada data' },
        { no: 9, name: 'Self Financing (Modal Internal)', formula: projectVal > 0 ? 'Modal Sendiri / Nilai Proyek' : 'Modal Sendiri / Total Aset', rac: '&gt; 20,00%', v1: '-', v2: '-', pass: false, ket: 'Belum ada data' }
      ];
    }

    const isNoDebt1 = hasData1 && (!totals1.cl || totals1.cl === 0);
    const isNoDebt2 = !totals2.cl || totals2.cl === 0;

    // 1. Current Ratio
    const cr1 = !hasData1 ? null : (isNoDebt1 ? null : (totals1.ca / totals1.cl) * 100);
    const cr2 = isNoDebt2 ? null : (totals2.ca / totals2.cl) * 100;
    const passCR = isNoDebt2 ? true : (cr2 >= 100);

    // 2. Quick Ratio
    const quick1 = (d1.cash || 0) + (d1.ar || 0) + (d1.otherAr || 0);
    const quick2 = (d2.cash || 0) + (d2.ar || 0) + (d2.otherAr || 0);
    const qr1 = !hasData1 ? null : (isNoDebt1 ? null : (quick1 / totals1.cl) * 100);
    const qr2 = isNoDebt2 ? null : (quick2 / totals2.cl) * 100;
    const passQR = isNoDebt2 ? true : (qr2 > 100);

    // 3. Cash Ratio
    const cash1 = d1.cash || 0;
    const cash2 = d2.cash || 0;
    const cashR1 = !hasData1 ? null : (isNoDebt1 ? null : (cash1 / totals1.cl) * 100);
    const cashR2 = isNoDebt2 ? null : (cash2 / totals2.cl) * 100;
    const passCash = isNoDebt2 ? true : (cashR2 > 40);

    // 4. DER
    const der1 = (!hasData1 || totals1.eq <= 0) ? null : (totals1.tl / totals1.eq) * 100;
    const der2 = totals2.eq <= 0 ? null : (totals2.tl / totals2.eq) * 100;
    const passDER = der2 !== null && der2 < 200;

    // 5. ROA
    const roa1 = (!hasData1 || totals1.ta <= 0) ? null : (totals1.eat / totals1.ta) * 100;
    const roa2 = totals2.ta <= 0 ? null : (totals2.eat / totals2.ta) * 100;
    const passROA = roa2 !== null && roa2 >= 1.0;

    // 6. ROE
    const roe1 = (!hasData1 || totals1.eq <= 0) ? null : (totals1.eat / totals1.eq) * 100;
    const roe2 = totals2.eq <= 0 ? null : (totals2.eat / totals2.eq) * 100;
    const passROE = roe2 !== null && roe2 >= 5.0;

    // 7. NPM
    const npm1 = (!hasData1 || totals1.rev <= 0) ? null : (totals1.eat / totals1.rev) * 100;
    const npm2 = totals2.rev <= 0 ? null : (totals2.eat / totals2.rev) * 100;
    const passNPM = npm2 !== null && npm2 > 10.0;

    // 8. NWC vs Nilai Proyek
    const nwc1 = totals1.ca - totals1.cl;
    const nwc2 = totals2.ca - totals2.cl;
    const nwcPct1 = projectVal > 0 ? (nwc1 / projectVal) * 100 : null;
    const nwcPct2 = projectVal > 0 ? (nwc2 / projectVal) * 100 : null;
    const passNWC = projectVal > 0 ? (nwcPct2 > 40) : (nwc2 > 0);

    // 9. Self Financing / Modal Internal vs Nilai Proyek
    const selfFin1 = projectVal > 0 ? (totals1.eq / projectVal) * 100 : (totals1.ta > 0 ? (totals1.eq / totals1.ta) * 100 : null);
    const selfFin2 = projectVal > 0 ? (totals2.eq / projectVal) * 100 : (totals2.ta > 0 ? (totals2.eq / totals2.ta) * 100 : null);
    const passSelfFin = selfFin2 !== null && selfFin2 > 20;

    return [
      {
        no: 1,
        name: 'Current Ratio (CR)',
        formula: 'Aset Lancar / Liab. Lancar',
        rac: '&ge; 100,00%',
        v1: !hasData1 ? '-' : (isNoDebt1 ? 'N/A (Bebas Utang)' : `${this.fmtNum(cr1, 2)}%`),
        v2: isNoDebt2 ? 'N/A (Bebas Utang)' : `${this.fmtNum(cr2, 2)}%`,
        pass: passCR,
        ket: isNoDebt2
          ? 'Likuiditas Sangat Prima: Bebas utang lancar (Skor 100 / Grade A).'
          : (cr2 >= 100 ? `Current Ratio ${this.fmtNum(cr2, 2)}% memenuhi standar RAC (Skor 100 / Grade A).`
            : (cr2 >= 75 ? `Current Ratio ${this.fmtNum(cr2, 2)}% cukup memadai (Skor 60 / Grade B).`
            : `Current Ratio ${this.fmtNum(cr2, 2)}% di bawah batas aman penjaminan (Skor 30 / Grade C).`))
      },
      {
        no: 2,
        name: 'Quick Ratio (QR)',
        formula: '(Kas + Piutang) / Liab. Lancar',
        rac: '&gt; 100,00%',
        v1: !hasData1 ? '-' : (isNoDebt1 ? 'N/A' : `${this.fmtNum(qr1, 2)}%`),
        v2: isNoDebt2 ? 'N/A' : `${this.fmtNum(qr2, 2)}%`,
        pass: passQR,
        ket: isNoDebt2
          ? 'Aset cepat prima (Skor 100 / Grade A).'
          : (qr2 > 100 ? `Quick Ratio ${this.fmtNum(qr2, 2)}% memenuhi standar RAC (Skor 100 / Grade A).`
            : (qr2 > 75 ? `Quick Ratio ${this.fmtNum(qr2, 2)}% (Skor 80 / Grade B).`
            : (qr2 > 60 ? `Quick Ratio ${this.fmtNum(qr2, 2)}% (Skor 60 / Grade C).`
            : `Quick Ratio ${this.fmtNum(qr2, 2)}% (Skor ${qr2 > 40 ? '40 / Grade D' : '20 / Grade E'}).`)))
      },
      {
        no: 3,
        name: 'Cash Ratio',
        formula: 'Kas &amp; Bank / Liab. Lancar',
        rac: '&gt; 40,00%',
        v1: !hasData1 ? '-' : (isNoDebt1 ? 'N/A' : `${this.fmtNum(cashR1, 2)}%`),
        v2: isNoDebt2 ? 'N/A' : `${this.fmtNum(cashR2, 2)}%`,
        pass: passCash,
        ket: isNoDebt2
          ? 'Posisi kas tunai sangat prima (Skor 100 / Grade A).'
          : (cashR2 > 40 ? `Cash Ratio ${this.fmtNum(cashR2, 2)}% memenuhi standar RAC (Skor 100 / Grade A).`
            : (cashR2 > 30 ? `Cash Ratio ${this.fmtNum(cashR2, 2)}% (Skor 80 / Grade B).`
            : (cashR2 > 20 ? `Cash Ratio ${this.fmtNum(cashR2, 2)}% (Skor 60 / Grade C).`
            : `Cash Ratio ${this.fmtNum(cashR2, 2)}% (Skor ${cashR2 > 10 ? '40 / Grade D' : '20 / Grade E'}).`)))
      },
      {
        no: 4,
        name: 'Debt to Equity Ratio (DER)',
        formula: 'Total Liab. / Total Ekuitas',
        rac: '&lt; 200,00%',
        v1: der1 === null ? 'N/A' : `${this.fmtNum(der1, 2)}%`,
        v2: der2 === null ? 'N/A' : `${this.fmtNum(der2, 2)}%`,
        pass: passDER,
        ket: der2 === null
          ? 'Struktur modal negatif / tidak memadai.'
          : (der2 < 200 ? `DER ${this.fmtNum(der2, 2)}% sangat sehat di bawah 200% (Skor 100 / Grade A).`
            : (der2 < 250 ? `DER ${this.fmtNum(der2, 2)}% dalam batas wajar penjaminan (Skor 75 / Grade B).`
            : (der2 < 300 ? `DER ${this.fmtNum(der2, 2)}% mendekati batas risiko (Skor 50 / Grade C).`
            : `DER ${this.fmtNum(der2, 2)}% melebihi batas toleransi &ge; 300% (Skor 25 / Grade D).`)))
      },
      {
        no: 5,
        name: 'Return on Asset (ROA)',
        formula: 'EAT / Total Aset',
        rac: '&ge; 1,00%',
        v1: roa1 === null ? '-' : `${this.fmtNum(roa1, 2)}%`,
        v2: roa2 === null ? '-' : `${this.fmtNum(roa2, 2)}%`,
        pass: passROA,
        ket: roa2 === null
          ? 'Data aset tidak memadai.'
          : (roa2 >= 1.0 ? `ROA ${this.fmtNum(roa2, 2)}% memenuhi standar produktivitas aset (Skor 100 / Grade A).`
            : (roa2 >= 0.5 ? `ROA ${this.fmtNum(roa2, 2)}% berada di kisaran wajar (Skor 60 / Grade B).`
            : (roa2 >= 0.1 ? `ROA ${this.fmtNum(roa2, 2)}% relatif tipis (Skor 30 / Grade C).`
            : `ROA ${this.fmtNum(roa2, 2)}% di bawah standar minimum penjaminan.`)))
      },
      {
        no: 6,
        name: 'Return on Equity (ROE)',
        formula: 'EAT / Total Ekuitas',
        rac: '&ge; 5,00%',
        v1: roe1 === null ? '-' : `${this.fmtNum(roe1, 2)}%`,
        v2: roe2 === null ? '-' : `${this.fmtNum(roe2, 2)}%`,
        pass: passROE,
        ket: roe2 === null
          ? 'Data ekuitas tidak memadai.'
          : (roe2 >= 5.0 ? `ROE ${this.fmtNum(roe2, 2)}% memenuhi standar imbal hasil modal (Skor 100 / Grade A).`
            : (roe2 >= 3.0 ? `ROE ${this.fmtNum(roe2, 2)}% cukup memadai (Skor 60 / Grade B).`
            : (roe2 >= 0.1 ? `ROE ${this.fmtNum(roe2, 2)}% imbal modal tipis (Skor 30 / Grade C).`
            : `ROE ${this.fmtNum(roe2, 2)}% di bawah standar penjaminan.`)))
      },
      {
        no: 7,
        name: 'Nett Profit Margin (NPM)',
        formula: 'EAT / Penjualan',
        rac: '&gt; 10,00%',
        v1: npm1 === null ? '-' : `${this.fmtNum(npm1, 2)}%`,
        v2: npm2 === null ? '-' : `${this.fmtNum(npm2, 2)}%`,
        pass: passNPM,
        ket: npm2 === null
          ? 'Data penjualan nihil.'
          : (npm2 > 10.0 ? `NPM ${this.fmtNum(npm2, 2)}% sangat prima melampaui 10% (Skor 100 / Grade A).`
            : (npm2 > 5.0 ? `NPM ${this.fmtNum(npm2, 2)}% sehat (Skor 75 / Grade B).`
            : (npm2 > 2.0 ? `NPM ${this.fmtNum(npm2, 2)}% wajar (Skor 50 / Grade C).`
            : `NPM ${this.fmtNum(npm2, 2)}% margin tipis/negatif (Skor ${npm2 > 0 ? '25 / Grade D' : '0 / Grade E'}).`)))
      },
      {
        no: 8,
        name: 'Net Working Capital (NWC)',
        formula: projectVal > 0 ? 'NWC Riil / Nilai Proyek' : 'Aset Lancar - Liab. Lancar',
        rac: projectVal > 0 ? '&gt; 40,00% Proyek' : '&gt; Rp 0',
        v1: !hasData1 ? '-' : (projectVal > 0 ? `${this.fmtRp(nwc1, false)} (${this.fmtNum(nwcPct1, 2)}%)` : this.fmtRp(nwc1, false)),
        v2: projectVal > 0 ? `${this.fmtRp(nwc2, false)} (${this.fmtNum(nwcPct2, 2)}%)` : this.fmtRp(nwc2, false),
        pass: passNWC,
        ket: projectVal > 0
          ? (nwcPct2 > 40 ? `NWC ${this.fmtNum(nwcPct2, 2)}% dari Nilai Proyek (Skor 100 / Grade A). Penyangga modal kerja sangat kuat.`
            : (nwcPct2 > 20 ? `NWC ${this.fmtNum(nwcPct2, 2)}% dari Nilai Proyek (Skor 75 / Grade B). Modal kerja memadai.`
            : (nwcPct2 > 10 ? `NWC ${this.fmtNum(nwcPct2, 2)}% dari Nilai Proyek (Skor 50 / Grade C). Perlu monitoring arus kas.`
            : `NWC ${this.fmtNum(nwcPct2, 2)}% dari Nilai Proyek di bawah 10% (Skor 25 / Grade D).`)))
          : (nwc2 > 0 ? `NWC surplus Rp ${this.fmtRp(nwc2, false)}. Masukkan Nilai Proyek untuk evaluasi rasio terhadap proyek.` : `NWC defisit (Aset lancar lebih kecil dari hutang lancar).`)
      },
      {
        no: 9,
        name: 'Self Financing (Modal Internal)',
        formula: projectVal > 0 ? 'Modal Sendiri / Nilai Proyek' : 'Modal Sendiri / Total Aset',
        rac: '&gt; 20,00%',
        v1: !hasData1 || selfFin1 === null ? '-' : `${this.fmtNum(selfFin1, 2)}%`,
        v2: selfFin2 === null ? '-' : `${this.fmtNum(selfFin2, 2)}%`,
        pass: passSelfFin,
        ket: selfFin2 === null
          ? 'Data ekuitas tidak memadai.'
          : (selfFin2 > 20 ? `Modal Internal ${this.fmtNum(selfFin2, 2)}% melampaui standar 20% (Skor 100 / Grade A).`
            : (selfFin2 >= 15 ? `Modal Internal ${this.fmtNum(selfFin2, 2)}% memadai (Skor 80 / Grade B).`
            : (selfFin2 >= 10 ? `Modal Internal ${this.fmtNum(selfFin2, 2)}% cukup (Skor 60 / Grade C).`
            : `Modal Internal ${this.fmtNum(selfFin2, 2)}% di bawah batas aman (Skor ${selfFin2 >= 5 ? '40 / Grade D' : '20 / Grade E'}).`)))
      }
    ];
  },

  autoBalanceAllYears() {
    const d1Has = FIN_ACCOUNT_KEYS.some(k => (this.parseFormattedNumber(document.getElementById(`inp_${k}_1`)?.value) || 0) !== 0);
    const d2Has = FIN_ACCOUNT_KEYS.some(k => (this.parseFormattedNumber(document.getElementById(`inp_${k}_2`)?.value) || 0) !== 0);
    if (!d1Has && !d2Has) {
      window.askrindoApp.showToast('Belum ada data neraca yang dimasukkan untuk diseimbangkan.', 'warning');
      return;
    }
    [1, 2].forEach(yr => {
      this.autoBalanceYear(yr);
    });
    this.calculateRatios();
    window.askrindoApp.showToast('Neraca berhasil diseimbangkan otomatis (Aktiva = Passiva)!', 'success');
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
    if (y1Inp) y1Inp.value = '';
    if (y2Inp) y2Inp.value = '';

    const auditSel = document.getElementById('pelaku-audit-status');
    if (auditSel) auditSel.value = '';

    const kapInp = document.getElementById('pelaku-kap-name');
    if (kapInp) kapInp.value = '';
    const opInp = document.getElementById('pelaku-opinion');
    if (opInp) opInp.value = '';
    const projInp = document.getElementById('inp_projectValue');
    if (projInp) projInp.value = '';

    this.workspaceState = this.buildBlankState();
    this.saveWorkspaceDraft();

    this.updateYearLabels();
    this.calculateRatios();
    window.askrindoApp.showToast('Form Laporan Keuangan berhasil dikosongkan.', 'info');
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
    if (y1Inp) y1Inp.value = state.year1 || '';
    if (y2Inp) y2Inp.value = state.year2 || '';
    const auditSel = document.getElementById('pelaku-audit-status');
    if (auditSel) auditSel.value = state.auditStatus || '';
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
              ${rec.racPassCount}/${(Number(rec.racPassCount) || 0) + (Number(rec.racFailCount) || 0) || 9} RAC
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

    if (!c.hasData) {
      window.askrindoApp.showToast('Laporan keuangan masih kosong. Silakan lengkapi angka laporan keuangan terlebih dahulu sebelum menyimpan.', 'warning');
      return null;
    }

    const payload = {
      companyName,
      sector: c.sector,
      auditStatus: document.getElementById('pelaku-audit-status')?.value || '',
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
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold ${Number(s.racFailCount) === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                        ${s.racPassCount ?? 0}/${(Number(s.racPassCount) || 0) + (Number(s.racFailCount) || 0) || 9} RAC LULUS
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
                ${item.racPassCount ?? 0}/${(Number(item.racPassCount) || 0) + (Number(item.racFailCount) || 0) || 9} RAC
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

    if (!c.hasData) {
      window.askrindoApp.showToast('Belum ada data laporan keuangan yang dimasukkan untuk dicetak.', 'warning');
      return;
    }

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

          <!-- Matriks Kepatuhan Standar Risk Acceptance Criteria (RAC) Askrindo -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Kepatuhan Standar Risk Acceptance Criteria (RAC)</h4>
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                ${c.passRacCount} RAC LULUS &bull; Current Ratio (&ge; 100%)
              </span>
            </div>
            <table class="w-full text-xs border border-slate-200">
              <tr class="bg-slate-100 font-bold">
                <th class="p-2 text-center w-7">No</th>
                <th class="p-2 text-left">Indikator Rasio</th>
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

          <!-- Tabel Rasio Keuangan Lengkap (27 Indikator) -->
          <div>
            <h4 class="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Hasil Analisis 27 Indikator Rasio Finansial Komparatif (${c.year1 ? `Tahun ${c.year1} &amp; ${c.year2}` : `Tahun ${c.year2}`})</h4>
            <table class="w-full text-xs border border-slate-200">
              <tr class="bg-slate-100 font-bold">
                <th class="p-2 text-center w-8">No</th>
                <th class="p-2 text-left">Indikator Rasio</th>
                <th class="p-2 text-right">${c.year1 ? `Tahun ${c.year1}` : 'Tahun 1'}</th>
                <th class="p-2 text-right">${c.year2 ? `Tahun ${c.year2} (Eval)` : 'Tahun 2'}</th>
                <th class="p-2 text-left">Parameter / Standar Acuan</th>
              </tr>
              ${(c.ratios27 || []).map(r => `
                <tr class="border-b">
                  <td class="p-1.5 text-center font-bold text-slate-400 text-[11px]">${r.no}</td>
                  <td class="p-1.5 font-medium text-slate-800">${r.name}</td>
                  <td class="p-1.5 text-right font-mono text-slate-600">${r.val1 || '-'}</td>
                  <td class="p-1.5 text-right font-mono font-bold ${r.pass ? 'text-emerald-700' : 'text-slate-800'}">${r.val}</td>
                  <td class="p-1.5 text-slate-500 text-[11px]">${r.std}</td>
                </tr>
              `).join('')}
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
