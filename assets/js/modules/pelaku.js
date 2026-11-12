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

window.PelakuModule = {
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

    const hasOcrData = !!this.extractedYearsData;

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Module Header with AI OCR Trigger -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-purple-600">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-700 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <i data-lucide="calculator" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-black text-slate-800 tracking-tight">PELAKU</h1>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  Perhitungan Laporan Keuangan
                </span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm flex items-center gap-1">
                  <i data-lucide="sparkles" class="w-3 h-3"></i> AI OCR Vision
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Model Finansial 27 Pos Neraca & Laba Rugi Komparatif 2 Tahun Buku (Standar ASCA / Askrindo Underwriting).
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <!-- Tombol Utama AI OCR Vision -->
            <button onclick="window.PelakuModule.openAiFinUploadModal()" class="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-indigo-700 shadow-md shadow-purple-500/25 transition flex items-center gap-2 group">
              <i data-lucide="scan-line" class="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform"></i>
              <span>Pindai AI OCR Vision</span>
            </button>
            <button onclick="window.PelakuModule.loadSampleData()" class="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition" title="Muat Data Contoh Konstruksi 27 Pos">
              Muat Contoh Rekanan
            </button>
            <button onclick="window.PelakuModule.resetForm()" class="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition">
              Reset Form
            </button>
          </div>
        </div>

        <!-- Banner Keseimbangan Neraca (Real-Time Balance Bar) -->
        <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#002B49] text-white p-4 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-center gap-4 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-300 font-semibold">Status Neraca Th <span id="lbl_balance_yr1" class="font-bold text-amber-300">2024</span>:</span>
              <span id="badge_balance_yr1" class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                &check; BALANCE
              </span>
            </div>
            <div class="h-4 w-px bg-slate-700 hidden sm:block"></div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-300 font-semibold">Status Neraca Th <span id="lbl_balance_yr2" class="font-bold text-amber-300">2025</span>:</span>
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
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <i data-lucide="building" class="w-4 h-4 text-purple-600"></i>
                  <span>1. Profil Calon Debitur / Rekanan & Legalitas Audit</span>
                </h3>
                <span class="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                  Standar Akuntansi Askrindo
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Rekanan</label>
                  <input type="text" id="pelaku-company" value="PT Adhi Bangun Persada" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 font-medium" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Sektor Industri / Bidang Usaha</label>
                  <select id="pelaku-sector" onchange="window.PelakuModule.calculateRatios()" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 bg-white">
                    <option value="konstruksi">Konstruksi & Infrastruktur</option>
                    <option value="perdagangan">Perdagangan Besar & Distributor</option>
                    <option value="manufaktur">Manufaktur & Pabrikasi</option>
                    <option value="jasa">Jasa & Pengadaan Barang/Jasa (Vendor)</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Tahun 1 (Sebelumnya)</label>
                  <input type="number" id="inp_year1" value="2024" oninput="window.PelakuModule.updateYearLabels(); window.PelakuModule.calculateRatios();" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-center font-bold font-mono" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Tahun 2 (Terakhir)</label>
                  <input type="number" id="inp_year2" value="2025" oninput="window.PelakuModule.updateYearLabels(); window.PelakuModule.calculateRatios();" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-center font-bold font-mono" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Status Audit</label>
                  <select id="pelaku-audit-status" onchange="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-medium">
                    <option value="audited">Audited KAP</option>
                    <option value="unaudited">In-House / Unaudited</option>
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Opini Auditor</label>
                  <input type="text" id="pelaku-opinion" value="Wajar Tanpa Pengecualian (WTP)" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-medium" />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Nilai Proyek yang Dijamin (Rp)</label>
                  <input type="text" id="inp_projectValue" value="15.000.000.000" oninput="window.PelakuModule.handleDotInput(this); window.PelakuModule.calculateRatios();" onblur="window.PelakuModule.handleDotBlur(this); window.PelakuModule.calculateRatios();" class="w-full px-3 py-1.5 rounded-lg border border-purple-200 font-bold font-mono focus:border-purple-500 bg-white" placeholder="Contoh: 15.000.000.000" />
                  <span class="text-[10px] text-slate-400">Dasar perhitungan rasio kecukupan modal kerja NWC / Nilai Proyek</span>
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Nama Kantor Akuntan Publik (KAP)</label>
                  <input type="text" id="pelaku-kap-name" value="KAP Tanubrata Sutanto Fahmi Bambang & Rekan (BDO Indonesia)" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-medium" />
                  <span class="text-[10px] text-slate-400">KAP terdaftar OJK / Kemenkeu</span>
                </div>
              </div>
            </div>

            <!-- Card 2: Tabel Pos-Pos Laporan Keuangan Lengkap 27 Akun (Persis ASCA) -->
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <i data-lucide="table-2" class="w-4 h-4 text-purple-600"></i>
                    <span>2. Tabel Neraca & Laba Rugi Komparatif 2 Tahun (Standar ASCA)</span>
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
                      <th class="p-2.5 w-[20%] text-right">Tahun <span id="thLabelYear1" class="font-bold">2024</span> (Rp)</th>
                      <th class="p-2.5 w-[7%] text-right">%</th>
                      <th class="p-2.5 w-[20%] text-right">Tahun <span id="thLabelYear2" class="font-bold">2025</span> (Rp)</th>
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
                    Evaluasi 6 Rasio Standar Akseptasi Penjaminan Proyek &amp; Kredit: Current Ratio, DER, ROA, ROE, NWC, dan NWC / Nilai Proyek.
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <span id="badge_rac_pass_count" class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    6 RAC LULUS
                  </span>
                  <span id="badge_rac_fail_count" class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    0 TIDAK LULUS
                  </span>
                </div>
              </div>

              <!-- Tabel Matriks RAC (Persis seperti yang diminta di gambar) -->
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr class="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                      <th class="py-2.5 px-3 w-[4%] text-center">No</th>
                      <th class="py-2.5 px-3 w-[16%]">Indikator Rasio</th>
                      <th class="py-2.5 px-3 w-[17%]">Rumus Perhitungan</th>
                      <th class="py-2.5 px-2 w-[11%] text-center">Standar <span class="underline decoration-dotted">RAC</span></th>
                      <th class="py-2.5 px-2 w-[11%] text-center">Tahun <span id="thRacYear1">2024</span></th>
                      <th class="py-2.5 px-2 w-[13%] text-center text-emerald-900 bg-emerald-50/70">Tahun <span id="thRacYear2">2025</span> (Eval)</th>
                      <th class="py-2.5 px-2 w-[10%] text-center">Status <span class="underline decoration-dotted">RAC</span></th>
                      <th class="py-2.5 px-3 w-[18%]">Analisis &amp; Keterangan Komparasi</th>
                    </tr>
                  </thead>
                  <tbody id="racTableBody" class="divide-y divide-slate-100 font-sans">
                    <!-- Dynamic Rows rendered by calculateRatios() -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Kolom Kanan: Scoring & Evaluasi Underwriting Askrindo (4 cols, Sticky) -->
          <div class="lg:col-span-4 space-y-6">
            <div class="sticky top-20 bg-white rounded-3xl p-6 border-2 border-purple-500/20 shadow-xl space-y-6">
              
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
                <!-- Progress bar -->
                <div class="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div id="pelaku-score-bar" class="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full" style="width: 88.5%;"></div>
                </div>
                <p id="pelaku-short-summary" class="text-[11px] text-slate-200 pt-1 leading-relaxed">
                  Perusahaan memiliki struktur permodalan yang sehat dan likuiditas lancar untuk mendukung proyek penjaminan.
                </p>
              </div>

              <!-- Ratio Breakdown (Likuiditas, Solvabilitas, Profitabilitas, Pertumbuhan) -->
              <div class="space-y-3 text-xs">
                <h4 class="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>Indikator Rasio Utama (Th <span id="lbl_ratio_eval_yr">2025</span>)</span>
                  <span class="text-[10px] font-normal text-slate-400">Standar Askrindo</span>
                </h4>

                <!-- Likuiditas -->
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

                <!-- Solvabilitas -->
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

                <!-- Profitabilitas -->
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

                <!-- Pertumbuhan Usaha -->
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

              <!-- Tombol Aksi -->
              <div class="space-y-2 pt-2">
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
      const defVal1 = this.defaultData1[row.k] !== undefined ? this.defaultData1[row.k] : 0;
      const defVal2 = this.defaultData2[row.k] !== undefined ? this.defaultData2[row.k] : 0;
      return `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
          <td class="py-1 px-3 text-slate-700 text-xs font-medium">
            ${row.label}
          </td>
          <td class="py-1 px-1 text-center font-mono font-bold text-[11px] text-slate-500 bg-slate-50/40">
            ${row.code}
          </td>
          <td class="py-1 px-2">
            <input type="text" id="inp_${row.k}_1" value="${this.formatNumberWithDots(defVal1, true)}" oninput="window.PelakuModule.handleDotInput(this); window.PelakuModule.calculateRatios();" onblur="window.PelakuModule.handleDotBlur(this); window.PelakuModule.calculateRatios();" class="w-full px-2 py-1 rounded-lg border border-slate-200 text-right font-mono text-xs font-semibold focus:border-purple-500 focus:outline-none bg-white" placeholder="0,00" />
          </td>
          <td class="py-1 px-1 text-right font-mono text-[11px] text-slate-500" id="pct_${row.k}_1">
            -
          </td>
          <td class="py-1 px-2">
            <input type="text" id="inp_${row.k}_2" value="${this.formatNumberWithDots(defVal2, true)}" oninput="window.PelakuModule.handleDotInput(this); window.PelakuModule.calculateRatios();" onblur="window.PelakuModule.handleDotBlur(this); window.PelakuModule.calculateRatios();" class="w-full px-2 py-1 rounded-lg border border-slate-200 text-right font-mono text-xs font-semibold focus:border-purple-500 focus:outline-none bg-white" placeholder="0,00" />
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
          <td class="py-2.5 px-3 text-center font-bold text-slate-500">${r.no}</td>
          <td class="py-2.5 px-3 font-bold text-slate-800">
            ${r.name}
          </td>
          <td class="py-2.5 px-3 text-slate-600 font-mono text-[11px]">${r.formula}</td>
          <td class="py-2.5 px-2 text-center font-bold text-slate-700 font-mono">${r.rac}</td>
          <td class="py-2.5 px-2 text-center text-slate-500 font-mono">${r.v1}</td>
          <td class="py-2.5 px-2 text-center font-bold font-mono text-xs ${r.pass ? 'text-emerald-700' : 'text-rose-700'}">${r.v2}</td>
          <td class="py-2.5 px-2 text-center">
            <span class="inline-block px-2.5 py-0.5 rounded-md font-bold text-[10px] ${r.pass ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-rose-50 text-rose-700 border border-rose-300'}">
              ${r.pass ? 'LULUS' : 'TIDAK LULUS'}
            </span>
          </td>
          <td class="py-2.5 px-3 text-[11px] leading-relaxed text-slate-700">
            ${r.ket}
          </td>
        </tr>
      `).join('');
    }

    const bPass = document.getElementById('badge_rac_pass_count');
    const bFail = document.getElementById('badge_rac_fail_count');
    if (bPass) bPass.textContent = `${passRacCount} RAC LULUS`;
    if (bFail) {
      bFail.textContent = `${failRacCount} TIDAK LULUS`;
      bFail.className = `px-2.5 py-1 rounded-full text-xs font-bold ${failRacCount === 0 ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-rose-100 text-rose-800 border border-rose-300'}`;
    }

    // Simpan objek analisis untuk lembar cetak
    this.currentAnalysis = {
      company: document.getElementById('pelaku-company')?.value || 'PT Rekanan',
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
  },

  computeRacMatrix(totals1, totals2, yr1, yr2, projectVal) {
    // 1. Current Ratio
    const isNoDebt1 = !totals1.cl || totals1.cl === 0;
    const isNoDebt2 = !totals2.cl || totals2.cl === 0;
    const cr1 = isNoDebt1 ? null : (totals1.ca / totals1.cl) * 100;
    const cr2 = isNoDebt2 ? null : (totals2.ca / totals2.cl) * 100;
    const passCR = isNoDebt2 ? true : (cr2 >= 100);

    // 2. DER (Total Liab / Total Ekuitas)
    const der1 = totals1.eq > 0 ? (totals1.tl / totals1.eq) * 100 : 0;
    const der2 = totals2.eq > 0 ? (totals2.tl / totals2.eq) * 100 : 0;
    const passDER = der2 <= 400;

    // 3. ROA (EAT / Total Aset)
    const roa1 = totals1.ta > 0 ? (totals1.eat / totals1.ta) * 100 : 0;
    const roa2 = totals2.ta > 0 ? (totals2.eat / totals2.ta) * 100 : 0;
    const passROA = roa2 >= 1.0;

    // 4. ROE (EAT / Total Ekuitas)
    const roe1 = totals1.eq > 0 ? (totals1.eat / totals1.eq) * 100 : 0;
    const roe2 = totals2.eq > 0 ? (totals2.eat / totals2.eq) * 100 : 0;
    const passROE = roe2 >= 5.0;

    // 5. NWC (Aset Lancar - Liab Lancar)
    const nwc1 = totals1.ca - totals1.cl;
    const nwc2 = totals2.ca - totals2.cl;
    const passNWC = nwc2 > 0;

    // 6. NWC / Nilai Proyek (NWC Riil / Nilai Proyek)
    const nwcToProj1 = projectVal > 0 ? (nwc1 / projectVal) * 100 : 0;
    const nwcToProj2 = projectVal > 0 ? (nwc2 / projectVal) * 100 : 0;
    const passNWCProj = projectVal > 0 && nwcToProj2 >= 10.0;

    return [
      {
        no: 1,
        name: 'Current Ratio (CR)',
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
      },
      {
        no: 2,
        name: 'Debt to Equity Ratio (DER)',
        formula: 'Total Liab. / Total Ekuitas',
        rac: '&le; 400,00%',
        v1: `${this.fmtNum(der1, 2)}%`,
        v2: `${this.fmtNum(der2, 2)}%`,
        pass: passDER,
        ket: passDER
          ? `DER ${this.fmtNum(der2, 2)}% memenuhi standar RAC (&le; 400,00%). Tingkat leverage permodalan debitur dalam toleransi risiko wajar.`
          : `DER ${this.fmtNum(der2, 2)}% melampaui standar RAC (&le; 400,00%). Beban utang terlalu dominan terhadap modal sendiri.`
      },
      {
        no: 3,
        name: 'Return on Assets (ROA)',
        formula: 'EAT / Total Aset',
        rac: '&ge; 1,00%',
        v1: `${this.fmtNum(roa1, 2)}%`,
        v2: `${this.fmtNum(roa2, 2)}%`,
        pass: passROA,
        ket: passROA
          ? `ROA ${this.fmtNum(roa2, 2)}% memenuhi standar RAC (&ge; 1,00%). Aset perusahaan bekerja produktif menghasilkan laba bersih.`
          : `ROA ${this.fmtNum(roa2, 2)}% di bawah standar RAC (&ge; 1,00%). Efisiensi pemanfaatan aset masih perlu ditingkatkan.`
      },
      {
        no: 4,
        name: 'Return on Equity (ROE)',
        formula: 'EAT / Total Ekuitas',
        rac: '&ge; 5,00%',
        v1: `${this.fmtNum(roe1, 2)}%`,
        v2: `${this.fmtNum(roe2, 2)}%`,
        pass: passROE,
        ket: passROE
          ? `ROE ${this.fmtNum(roe2, 2)}% memenuhi standar RAC (&ge; 5,00%). Imbal hasil modal memadai untuk pertumbuhan internal.`
          : `ROE ${this.fmtNum(roe2, 2)}% di bawah standar RAC (&ge; 5,00%). Kemampuan mencetak keuntungan ekuitas belum optimal.`
      },
      {
        no: 5,
        name: 'Net Working Capital (NWC)',
        formula: 'Aset Lancar &minus; Liab. Lancar',
        rac: '> Rp 0',
        v1: this.fmtRp(nwc1, true),
        v2: this.fmtRp(nwc2, true),
        pass: passNWC,
        ket: passNWC
          ? `NWC bernilai positif (${this.fmtRp(nwc2, true)}) memenuhi standar RAC (> Rp 0). Aset lancar surplus terhadap kewajiban jangka pendek.`
          : `NWC bernilai negatif (${this.fmtRp(nwc2, true)}) tidak memenuhi standar RAC (> Rp 0). Terjadi defisit modal kerja riil.`
      },
      {
        no: 6,
        name: 'NWC / Nilai Proyek',
        formula: 'NWC Riil / Nilai Proyek',
        rac: '&ge; 10,00%',
        v1: projectVal > 0 ? `${this.fmtNum(nwcToProj1, 2)}%` : 'N/A',
        v2: projectVal > 0 ? `${this.fmtNum(nwcToProj2, 2)}%` : 'N/A',
        pass: passNWCProj,
        ket: projectVal > 0
          ? (passNWCProj
            ? `Rasio NWC/Nilai Proyek ${this.fmtNum(nwcToProj2, 2)}% memenuhi standar RAC (&ge; 10,00%). Debitur memiliki penyangga modal kerja bersih memadai.`
            : `Rasio NWC/Nilai Proyek ${this.fmtNum(nwcToProj2, 2)}% di bawah standar RAC (&ge; 10,00%). Penyangga modal kerja terlalu tipis relatif terhadap nilai proyek.`)
          : 'Nilai Proyek belum ditentukan. Silakan isi nilai proyek yang dijaminkan.'
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
    const comp = document.getElementById('pelaku-company');
    if (comp) comp.value = 'PT Adhi Bangun Persada (Kontraktor BUMN / Swasta)';
    const sec = document.getElementById('pelaku-sector');
    if (sec) sec.value = 'konstruksi';
    const y1Inp = document.getElementById('inp_year1');
    const y2Inp = document.getElementById('inp_year2');
    if (y1Inp) y1Inp.value = 2024;
    if (y2Inp) y2Inp.value = 2025;

    const auditSel = document.getElementById('pelaku-audit-status');
    if (auditSel) auditSel.value = 'audited';
    const kapInp = document.getElementById('pelaku-kap-name');
    if (kapInp) kapInp.value = 'KAP Tanubrata Sutanto Fahmi Bambang & Rekan (BDO Indonesia)';
    const opInp = document.getElementById('pelaku-opinion');
    if (opInp) opInp.value = 'Wajar Tanpa Pengecualian (WTP)';
    const projInp = document.getElementById('inp_projectValue');
    if (projInp) projInp.value = '15.000.000.000';

    // Data 27 Pos Neraca & Laba Rugi Komparatif Standar ASCA
    const sample1 = {
      cash: 14200000000, otherCa: 900000000, ar: 23500000000, inv: 18100000000, otherAr: 1200000000, prepaid: 850000000,
      fa: 42000000000, depr: 6500000000, invest: 2500000000, taxAsset: 1500000000,
      ap: 15100000000, stDebt: 19500000000, otherAp: 1800000000, accrued: 2400000000, ltDebt: 18000000000,
      capital: 30000000000, otherCap: 0, retEarn: 4450000000, re: 7000000000,
      rev: 185000000000, cogs: 157250000000, opex: 14800000000, otherInc: 1200000000, otherExp: 450000000, intExp: 3800000000, tax: 2850000000, div: 500000000
    };

    const sample2 = {
      cash: 18500000000, otherCa: 1200000000, ar: 28900000000, inv: 21400000000, otherAr: 1500000000, prepaid: 1100000000,
      fa: 48000000000, depr: 8200000000, invest: 3000000000, taxAsset: 1800000000,
      ap: 17800000000, stDebt: 21000000000, otherAp: 2100000000, accrued: 2800000000, ltDebt: 22500000000,
      capital: 35000000000, otherCap: 0, retEarn: 6950000000, re: 9050000000,
      rev: 224000000000, cogs: 189500000000, opex: 17200000000, otherInc: 1600000000, otherExp: 550000000, intExp: 4200000000, tax: 3550000000, div: 1550000000
    };

    FIN_ACCOUNT_KEYS.forEach(k => {
      const el1 = document.getElementById(`inp_${k}_1`);
      const el2 = document.getElementById(`inp_${k}_2`);
      if (el1) el1.value = this.formatNumberWithDots(sample1[k] || 0, true);
      if (el2) el2.value = this.formatNumberWithDots(sample2[k] || 0, true);
    });

    this.updateYearLabels();
    this.calculateRatios();
    window.askrindoApp.showToast('Contoh data Laporan Keuangan 27 pos ASCA berhasil dimuat!', 'info');
  },

  resetForm() {
    FIN_ACCOUNT_KEYS.forEach(k => {
      const el1 = document.getElementById(`inp_${k}_1`);
      const el2 = document.getElementById(`inp_${k}_2`);
      if (el1) el1.value = '';
      if (el2) el2.value = '';
    });
    this.calculateRatios();
    window.askrindoApp.showToast('Formulir Laporan Keuangan berhasil dikosongkan.', 'info');
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
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
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

    const bd1 = (this.currentExtractedFinData?.data_year1?.cash_breakdown || '').trim();
    const bd2 = (this.currentExtractedFinData?.data_year2?.cash_breakdown || '').trim();
    const isMerged = (bd1 && !bd1.toLowerCase().includes('gabungan')) || (bd2 && !bd2.toLowerCase().includes('gabungan'));
    const extraMsg = isMerged ? ' (Termasuk penggabungan otomatis Kas + Bank)' : '';

    window.askrindoApp.showToast(`Laporan Keuangan Th ${y1} & ${y2} berhasil diterapkan ke 27 pos!${extraMsg}`, 'success');
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
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-slate-900 text-sm">${c.company}</h3>
              <span class="px-2.5 py-0.5 rounded font-black text-xs ${c.score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}">
                ${c.grade} (Skor: ${c.score.toFixed(1)}/100)
              </span>
            </div>
            <p class="text-slate-600">
              Sektor Usaha: <strong class="capitalize">${c.sector}</strong> &bull; Nilai Proyek: <strong>${this.fmtRp(c.projectVal, false)}</strong> &bull; Periode Buku: <strong>Th ${c.year1} &amp; ${c.year2}</strong> &bull; Legalitas: <strong>${c.auditStatus}</strong>
            </p>
            <p class="text-slate-500 text-[11px]">
              KAP: <strong>${c.kapName}</strong> &bull; Opini Auditor: <strong>${c.opinion}</strong>
            </p>
          </div>

          <!-- Matriks Kepatuhan Standar Risk Acceptance Criteria (RAC) Askrindo -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-bold text-slate-800 uppercase tracking-wider">Matriks Kepatuhan Standar Risk Acceptance Criteria (RAC) Askrindo</h4>
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded">
                ${c.passRacCount} RAC LULUS &bull; Nilai Proyek: ${this.fmtRp(c.projectVal, false)}
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
