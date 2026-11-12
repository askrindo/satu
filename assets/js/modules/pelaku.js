/**
 * Askrindo SATU - PELAKU Module (Perhitungan Laporan Keuangan)
 * Financial Statement & Ratio Analysis Engine for Underwriting, Surety, and Credit Assessment.
 * Integrated with AI Financial Statement Scanner (Gemini Multimodal Vision OCR).
 */

const BUILTIN_GEMINI_API_KEY = (function() {
  try {
    return atob('QVEuQWI4Uk42STE0WTRhNkZkRzduNFZjdzZSWWRJMjVuZGg5bXhnUTYwOGhqMTUxbFFOMEE=');
  } catch (e) {
    return '';
  }
})();

window.PelakuModule = {
  currentAnalysis: null,
  selectedAiFinFiles: [],
  currentExtractedFinData: null,
  extractedYearsData: null,
  activeYear: 2, // 1 = Year 1 (Tahun Sebelumnya), 2 = Year 2 (Tahun Terakhir)

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
          cleanNumStr = s.replace(/\./g, '');
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

  fmtRp(val) {
    return 'Rp ' + this.formatNumberWithDots(val, false);
  },

  render() {
    const user = window.authService.getCurrentUser();
    if (!user || !window.authService.hasAccess('pelaku')) {
      return window.askrindoApp.renderUnauthorized('PELAKU');
    }

    const currentYear = new Date().getFullYear();
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
                Analisis rasio finansial (Likuiditas, Solvabilitas DER/DAR, Profitabilitas ROA/ROE) & scoring otomatis kelayakan penjaminan.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 flex-wrap">
            <!-- Tombol Utama AI OCR Vision -->
            <button onclick="window.PelakuModule.openAiFinUploadModal()" class="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-700 via-indigo-600 to-purple-800 hover:from-purple-800 hover:to-indigo-700 shadow-md shadow-purple-500/25 transition flex items-center gap-2 group">
              <i data-lucide="scan-line" class="w-4 h-4 text-amber-300 group-hover:scale-110 transition-transform"></i>
              <span>Pindai Lapkeu (AI OCR)</span>
            </button>
            <button onclick="window.PelakuModule.loadSampleData()" class="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition">
              Muat Contoh Rekanan
            </button>
            <button onclick="window.PelakuModule.resetForm()" class="px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition">
              Reset Form
            </button>
          </div>
        </div>

        <!-- OCR Status Banner (Muncul jika ada data hasil scan AI) -->
        <div id="pelaku-ocr-banner" class="${hasOcrData ? 'block' : 'hidden'}">
          <div class="bg-gradient-to-r from-emerald-50 via-teal-50 to-purple-50 p-4 rounded-2xl border border-emerald-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <i data-lucide="check-circle" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-bold text-xs text-emerald-950" id="ocr-banner-title">Data Diekstrak dari Laporan Keuangan (AI OCR)</span>
                  <span id="ocr-banner-audit-badge" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Audited KAP</span>
                  <span id="ocr-banner-balance-badge" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Neraca Balance</span>
                </div>
                <p class="text-[11px] text-slate-600 mt-0.5" id="ocr-banner-sub">
                  Perusahaan: <strong id="ocr-banner-company">PT Rekanan</strong> &bull; Tersedia Data Perbandingan 2 Tahun Buku.
                </p>
              </div>
            </div>

            <!-- Switcher Tahun Laporan yang Aktif di Form -->
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-slate-600">Pilih Periode:</span>
              <div class="inline-flex p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
                <button type="button" id="btn-toggle-yr2" onclick="window.PelakuModule.switchActiveYear(2)" class="px-3 py-1.5 rounded-lg text-xs font-bold transition bg-purple-600 text-white shadow-sm">
                  Tahun Terakhir (${this.extractedYearsData?.year2 || currentYear})
                </button>
                <button type="button" id="btn-toggle-yr1" onclick="window.PelakuModule.switchActiveYear(1)" class="px-3 py-1.5 rounded-lg text-xs font-bold transition text-slate-600 hover:text-purple-600">
                  Tahun Sebelumnya (${this.extractedYearsData?.year1 || currentYear - 1})
                </button>
              </div>
              <button onclick="window.PelakuModule.openAiFinUploadModal(true)" class="p-2 rounded-xl text-slate-600 hover:text-purple-700 bg-white border border-slate-200 hover:border-purple-300 transition" title="Tinjau Ulang Hasil Ekstraksi OCR">
                <i data-lucide="table" class="w-4 h-4"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Input & Ratio Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left Column: Inputs (7 cols) -->
          <div class="lg:col-span-7 space-y-6">
            <!-- Profil Entitas -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <i data-lucide="building" class="w-4 h-4 text-purple-600"></i>
                  <span>1. Profil Calon Debitur / Rekanan Penjaminan</span>
                </h3>
                <span id="pelaku-active-period-label" class="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100">
                  Mode: Input Data Aktif
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Rekanan</label>
                  <input type="text" id="pelaku-company" value="PT Graha Cipta Konstruksi" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 font-medium" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Sektor Industri / Bidang Usaha</label>
                  <select id="pelaku-sector" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 bg-white">
                    <option value="konstruksi">Konstruksi & Infrastruktur</option>
                    <option value="perdagangan">Perdagangan Besar & Distributor</option>
                    <option value="manufaktur">Manufaktur & Pabrikasi</option>
                    <option value="jasa">Jasa & Pengadaan Barang/Jasa (Vendor)</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Tahun Laporan Keuangan</label>
                  <input type="text" id="pelaku-year" value="Tahun Buku 2025 (Audited)" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 font-medium" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Opini Auditor (Jika Ada)</label>
                  <input type="text" id="pelaku-opinion" value="Wajar Tanpa Pengecualian (WTP)" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500 font-medium" />
                </div>
              </div>
            </div>

            <!-- Komponen Neraca -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <i data-lucide="scale" class="w-4 h-4 text-purple-600"></i>
                  <span>2. Pos Neraca Keuangan (Balance Sheet)</span>
                </h3>
                <span class="text-[10px] text-slate-400 font-mono">Format angka: IDR</span>
              </div>

              <div class="space-y-4 text-xs">
                <!-- Aset Lancar -->
                <div class="p-4 rounded-xl bg-purple-50/40 border border-purple-100 space-y-3">
                  <span class="font-bold text-purple-900 block text-xs uppercase tracking-wide">Aset Lancar (Current Assets)</span>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-slate-600 mb-1">Kas & Setara Kas</label>
                      <input type="number" id="bal-cash" value="1200000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-semibold" />
                    </div>
                    <div>
                      <label class="block text-slate-600 mb-1">Piutang Usaha</label>
                      <input type="number" id="bal-receivable" value="3800000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-semibold" />
                    </div>
                    <div>
                      <label class="block text-slate-600 mb-1">Persediaan Barang</label>
                      <input type="number" id="bal-inventory" value="1500000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-semibold" />
                    </div>
                    <div>
                      <label class="block text-slate-600 mb-1">Aset Lancar Lainnya</label>
                      <input type="number" id="bal-other-ca" value="500000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-semibold" />
                    </div>
                  </div>
                </div>

                <!-- Aset Tetap & Non-Lancar -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Aset Tetap & Peralatan</label>
                    <input type="number" id="bal-fixed-assets" value="4500000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-semibold" />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Akumulasi Penyusutan (-)</label>
                    <input type="number" id="bal-depreciation" value="800000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-semibold text-rose-600" />
                  </div>
                </div>

                <!-- Kewajiban Lancar & Panjang -->
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span class="font-bold text-slate-800 block text-xs uppercase tracking-wide">Kewajiban & Ekuitas (Liabilities & Equity)</span>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-slate-600 mb-1">Hutang Usaha / Lancar</label>
                      <input type="number" id="bal-current-liab" value="3200000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-semibold" />
                    </div>
                    <div>
                      <label class="block text-slate-600 mb-1">Hutang Bank Jangka Panjang</label>
                      <input type="number" id="bal-long-liab" value="2100000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-semibold" />
                    </div>
                    <div>
                      <label class="block text-slate-600 mb-1">Modal Disetor & Saham</label>
                      <input type="number" id="bal-capital" value="3000000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-semibold" />
                    </div>
                    <div>
                      <label class="block text-slate-600 mb-1">Laba Ditahan / Saldo Laba</label>
                      <input type="number" id="bal-retained" value="2400000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs font-semibold" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Komponen Laba Rugi -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                <i data-lucide="trending-up" class="w-4 h-4 text-purple-600"></i>
                <span>3. Laporan Laba Rugi (Income Statement)</span>
              </h3>

              <div class="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Penjualan Bersih (Omset)</label>
                  <input type="number" id="inc-revenue" value="18500000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Harga Pokok Penjualan (HPP)</label>
                  <input type="number" id="inc-cogs" value="14200000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Beban Operasional & Umum</label>
                  <input type="number" id="inc-opex" value="2100000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Laba Bersih Tahun Berjalan (EAT)</label>
                  <input type="number" id="inc-net-profit" value="1650000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold text-emerald-700" />
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Results & Underwriting Assessment (5 cols) -->
          <div class="lg:col-span-5 space-y-6">
            <div class="sticky top-20 bg-white rounded-3xl p-6 border-2 border-purple-500/20 shadow-xl space-y-6">
              <!-- Header Score -->
              <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-purple-600">Evaluasi Finansial Askrindo</span>
                  <h3 class="text-lg font-black text-slate-800">Scoring & Kelayakan Rekanan</h3>
                </div>
                <div id="pelaku-grade-badge" class="px-3.5 py-1.5 rounded-xl font-black text-sm bg-emerald-100 text-emerald-800 border border-emerald-300">
                  GRADE A (SEHAT)
                </div>
              </div>

              <!-- Composite Score Banner -->
              <div class="p-5 rounded-2xl bg-gradient-to-br from-[#002B49] via-indigo-900 to-[#0A3D62] text-white shadow-lg space-y-2">
                <div class="flex items-center justify-between text-xs text-indigo-200">
                  <span>Skor Finansial Komposit:</span>
                  <span id="pelaku-score-num" class="font-mono font-bold text-amber-300 text-sm">84.5 / 100</span>
                </div>
                <!-- Progress bar -->
                <div class="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div id="pelaku-score-bar" class="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full" style="width: 84.5%;"></div>
                </div>
                <p id="pelaku-short-summary" class="text-[11px] text-slate-200 pt-1 leading-relaxed">
                  Perusahaan memiliki struktur permodalan yang sehat dan likuiditas lancar untuk mendukung proyek penjaminan.
                </p>
              </div>

              <!-- Ratio Breakdown -->
              <div class="space-y-3 text-xs">
                <h4 class="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Rasio Keuangan Utama</h4>

                <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <div>
                    <span class="font-semibold text-slate-700">Current Ratio (Likuiditas)</span>
                    <span class="block text-[10px] text-slate-400">Standar aman: &ge; 120%</span>
                  </div>
                  <span id="ratio-cr" class="font-mono font-bold text-emerald-600 text-sm">218.75%</span>
                </div>

                <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <div>
                    <span class="font-semibold text-slate-700">Quick Ratio (Acid Test)</span>
                    <span class="block text-[10px] text-slate-400">Standar aman: &ge; 100%</span>
                  </div>
                  <span id="ratio-qr" class="font-mono font-bold text-emerald-600 text-sm">171.88%</span>
                </div>

                <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <div>
                    <span class="font-semibold text-slate-700">Debt to Equity (DER)</span>
                    <span class="block text-[10px] text-slate-400">Batas maks penjaminan: &lt; 2.50x</span>
                  </div>
                  <span id="ratio-der" class="font-mono font-bold text-slate-800 text-sm">0.98x</span>
                </div>

                <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <div>
                    <span class="font-semibold text-slate-700">Net Profit Margin (NPM)</span>
                    <span class="block text-[10px] text-slate-400">Profitabilitas laba bersih</span>
                  </div>
                  <span id="ratio-npm" class="font-mono font-bold text-blue-600 text-sm">8.92%</span>
                </div>

                <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <div>
                    <span class="font-semibold text-slate-700">Return on Equity (ROE)</span>
                    <span class="block text-[10px] text-slate-400">Imbal hasil atas modal</span>
                  </div>
                  <span id="ratio-roe" class="font-mono font-bold text-purple-600 text-sm">30.56%</span>
                </div>
              </div>

              <!-- Narasi Underwriting -->
              <div class="p-4 rounded-2xl bg-purple-50 border border-purple-200/70 space-y-2">
                <span class="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <i data-lucide="shield-check" class="w-4 h-4 text-purple-600"></i>
                  Rekomendasi Komite Underwriting
                </span>
                <p id="pelaku-narrative" class="text-xs text-slate-700 leading-relaxed font-medium">
                  Rekanan memenuhi seluruh parameter underwriting penjaminan kredit & surety bond Askrindo. Layak diberikan persetujuan.
                </p>
              </div>

              <!-- Tombol Aksi -->
              <div class="flex items-center gap-3 pt-2">
                <button onclick="window.PelakuModule.printAnalysis()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-600/30 transition">
                  <i data-lucide="printer" class="w-4 h-4"></i>
                  <span>Cetak Lembar Evaluasi PDF</span>
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

  calculateRatios() {
    const cash = parseFloat(document.getElementById('bal-cash')?.value || '0');
    const rec = parseFloat(document.getElementById('bal-receivable')?.value || '0');
    const inv = parseFloat(document.getElementById('bal-inventory')?.value || '0');
    const otherCa = parseFloat(document.getElementById('bal-other-ca')?.value || '0');
    const totalCa = cash + rec + inv + otherCa;

    const fixed = parseFloat(document.getElementById('bal-fixed-assets')?.value || '0');
    const depr = parseFloat(document.getElementById('bal-depreciation')?.value || '0');
    const netFixed = fixed - depr;
    const totalAssets = totalCa + netFixed;

    const curLiab = parseFloat(document.getElementById('bal-current-liab')?.value || '1');
    const longLiab = parseFloat(document.getElementById('bal-long-liab')?.value || '0');
    const totalLiab = curLiab + longLiab;

    const cap = parseFloat(document.getElementById('bal-capital')?.value || '0');
    const ret = parseFloat(document.getElementById('bal-retained')?.value || '0');
    const totalEquity = cap + ret > 0 ? cap + ret : 1;

    const rev = parseFloat(document.getElementById('inc-revenue')?.value || '1');
    const netProfit = parseFloat(document.getElementById('inc-net-profit')?.value || '0');

    // Ratios
    const currentRatio = (totalCa / (curLiab || 1)) * 100;
    const quickRatio = ((totalCa - inv) / (curLiab || 1)) * 100;
    const der = totalLiab / totalEquity;
    const npm = (netProfit / (rev || 1)) * 100;
    const roe = (netProfit / totalEquity) * 100;

    // Composite Score
    let score = 50;
    if (currentRatio >= 150) score += 15;
    else if (currentRatio >= 120) score += 10;

    if (quickRatio >= 100) score += 10;

    if (der < 1.5) score += 15;
    else if (der <= 2.5) score += 10;
    else score -= 10;

    if (npm >= 8) score += 10;
    else if (npm >= 4) score += 5;

    score = Math.min(Math.max(score, 10), 100);

    let grade = 'GRADE A (SEHAT)';
    let gradeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    let summaryText = 'Kondisi keuangan perusahaan sangat sehat. Likuiditas tinggi dan solvabilitas sangat terkendali.';
    let narrative = 'Rekanan memenuhi seluruh parameter underwriting penjaminan kredit & surety bond Askrindo. Layak diberikan persetujuan.';

    if (score < 50) {
      grade = 'GRADE D (RISIKO TINGGI)';
      gradeClass = 'bg-rose-100 text-rose-800 border-rose-300';
      summaryText = 'Perusahaan menghadapi tekanan beban hutang berat atau likuiditas di bawah batas aman penjaminan.';
      narrative = 'TIDAK DIREKOMENDASIKAN untuk penjaminan tanpa agunan fisik 100% dan persetujuan komite kredit.';
    } else if (score < 65) {
      grade = 'GRADE C (CUKUP SEHAT)';
      gradeClass = 'bg-amber-100 text-amber-800 border-amber-300';
      summaryText = 'Tingkat leverage mendekati batas toleransi. Diperlukan mitigasi risiko tambahan.';
      narrative = 'Dapat dipertimbangkan bersyarat dengan jaminan tambahan atau batasan plafon penjaminan.';
    } else if (score < 80) {
      grade = 'GRADE B (SEHAT STANDAR)';
      gradeClass = 'bg-blue-100 text-blue-800 border-blue-300';
      summaryText = 'Profil keuangan memenuhi standar wajar industri dengan kinerja laba yang positif.';
      narrative = 'Layak penjaminan dengan syarat dan pemantauan standar.';
    }

    // Update UI elements
    const elCr = document.getElementById('ratio-cr');
    const elQr = document.getElementById('ratio-qr');
    const elDer = document.getElementById('ratio-der');
    const elNpm = document.getElementById('ratio-npm');
    const elRoe = document.getElementById('ratio-roe');
    const elBadge = document.getElementById('pelaku-grade-badge');
    const elScoreNum = document.getElementById('pelaku-score-num');
    const elScoreBar = document.getElementById('pelaku-score-bar');
    const elSumm = document.getElementById('pelaku-short-summary');
    const elNarr = document.getElementById('pelaku-narrative');

    if (elCr) elCr.innerText = currentRatio.toFixed(2) + '%';
    if (elQr) elQr.innerText = quickRatio.toFixed(2) + '%';
    if (elDer) elDer.innerText = der.toFixed(2) + 'x';
    if (elNpm) elNpm.innerText = npm.toFixed(2) + '%';
    if (elRoe) elRoe.innerText = roe.toFixed(2) + '%';

    if (elBadge) {
      elBadge.innerText = grade;
      elBadge.className = `px-3.5 py-1.5 rounded-xl font-black text-xs ${gradeClass} border`;
    }
    if (elScoreNum) elScoreNum.innerText = score.toFixed(1) + ' / 100';
    if (elScoreBar) elScoreBar.style.width = score + '%';
    if (elSumm) elSumm.innerText = summaryText;
    if (elNarr) elNarr.innerText = narrative;

    this.currentAnalysis = {
      company: document.getElementById('pelaku-company')?.value || 'PT Graha Cipta Konstruksi',
      year: document.getElementById('pelaku-year')?.value || '2025',
      currentRatio,
      quickRatio,
      der,
      npm,
      roe,
      score,
      grade,
      narrative
    };
  },

  loadSampleData() {
    document.getElementById('pelaku-company').value = 'PT Wijaya Karya Pradana';
    document.getElementById('bal-cash').value = '2500000000';
    document.getElementById('bal-receivable').value = '6800000000';
    document.getElementById('bal-inventory').value = '2200000000';
    document.getElementById('bal-fixed-assets').value = '8000000000';
    document.getElementById('bal-current-liab').value = '4500000000';
    document.getElementById('bal-long-liab').value = '3000000000';
    document.getElementById('bal-capital').value = '6000000000';
    document.getElementById('bal-retained').value = '4000000000';
    document.getElementById('inc-revenue').value = '28000000000';
    document.getElementById('inc-net-profit').value = '2450000000';
    this.calculateRatios();
    window.askrindoApp.showToast('Data contoh rekanan konstruksi berhasil dimuat!', 'info');
  },

  resetForm() {
    document.getElementById('bal-cash').value = '500000000';
    document.getElementById('bal-receivable').value = '1000000000';
    document.getElementById('bal-inventory').value = '500000000';
    document.getElementById('bal-current-liab').value = '1000000000';
    document.getElementById('bal-long-liab').value = '500000000';
    document.getElementById('bal-capital').value = '1000000000';
    document.getElementById('bal-retained').value = '200000000';
    document.getElementById('inc-revenue').value = '5000000000';
    document.getElementById('inc-net-profit').value = '300000000';
    this.calculateRatios();
    window.askrindoApp.showToast('Formulir berhasil direset.', 'info');
  },

  // ============================================================================
  // AI OCR VISION ENGINE & MODAL METHODS
  // ============================================================================

  openAiFinUploadModal(reopenReview = false) {
    const modalContainer = document.getElementById('pelaku-modal-container');
    if (!modalContainer) return;

    const currentYear = new Date().getFullYear();
    const targetYr1 = this.currentExtractedFinData?.year1 || currentYear - 1;
    const targetYr2 = this.currentExtractedFinData?.year2 || currentYear;

    modalContainer.innerHTML = `
      <div id="modalAiFinExtractor" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
          <!-- Modal Header -->
          <div class="bg-gradient-to-r from-[#002B49] via-indigo-950 to-[#0A3D62] text-white p-5 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-400/40 flex items-center justify-center text-amber-300">
                <i data-lucide="sparkles" class="w-5 h-5"></i>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-base font-extrabold tracking-tight">Pindai Laporan Keuangan (AI OCR Vision)</h3>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase">Gemini Multimodal</span>
                </div>
                <p class="text-xs text-slate-300 mt-0.5">
                  Ekstraksi otomatis 27 pos Neraca & Laba Rugi dari dokumen PDF / Foto Scan laporan keuangan.
                </p>
              </div>
            </div>
            <button onclick="window.PelakuModule.closeAiFinUploadModal()" class="w-8 h-8 rounded-lg bg-white/10 hover:bg-rose-600 text-slate-300 hover:text-white transition flex items-center justify-center text-lg font-bold">
              &times;
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 overflow-y-auto flex-grow space-y-5">
            <!-- Engine Status Bar -->
            <div class="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 text-xs">
              <div class="flex items-center gap-2 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Engine Google Gemini Vision Aktif</span>
              </div>
              <div class="flex items-center gap-3 text-slate-500 text-[11px]">
                <span>Mendukung multi-dokumen PDF Audit & Foto Scan (Neraca + Laba Rugi)</span>
                <button type="button" onclick="window.PelakuModule.promptCustomApiKey()" class="text-purple-600 hover:underline font-semibold">
                  API Key Kustom
                </button>
              </div>
            </div>

            <!-- Upload Section -->
            <div id="aiOcrUploadSection">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block font-bold text-xs text-slate-700 mb-1">Target Periode Tahun 1 (Tahun Sebelumnya):</label>
                  <input type="number" id="aiOcrYear1" value="${targetYr1}" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold focus:border-purple-500" placeholder="Contoh: ${currentYear - 1}" />
                </div>
                <div>
                  <label class="block font-bold text-xs text-slate-700 mb-1">Target Periode Tahun 2 (Tahun Terakhir / Audited):</label>
                  <input type="number" id="aiOcrYear2" value="${targetYr2}" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs font-bold focus:border-purple-500" placeholder="Contoh: ${currentYear}" />
                </div>
              </div>

              <!-- Dropzone -->
              <div id="aiOcrDropzone" onclick="document.getElementById('aiOcrFileInput').click()" class="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/30 hover:bg-purple-50/60 transition p-8 rounded-2xl text-center cursor-pointer space-y-2">
                <input type="file" id="aiOcrFileInput" accept=".pdf,image/png,image/jpeg,image/webp" multiple class="hidden" onchange="window.PelakuModule.handleAiFinFileSelect(event)" />
                <div class="w-14 h-14 mx-auto rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <i data-lucide="upload-cloud" class="w-7 h-7"></i>
                </div>
                <h4 class="text-sm font-bold text-slate-800">Pilih atau Seret Dokumen Laporan Keuangan ke Sini</h4>
                <p class="text-xs text-slate-500">
                  Dapat mengunggah beberapa berkas sekaligus (PDF, JPG, PNG) misal berkas Neraca dan Laba Rugi terpisah.
                </p>
                <div id="aiOcrSelectedFileInfo" class="hidden text-left pt-2"></div>
              </div>

              <div class="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <p class="text-slate-500 text-[11px] leading-relaxed max-w-xl">
                  💡 <strong>Fitur Cerdas Askrindo:</strong> Jika pos <strong>Kas</strong> dan <strong>Bank</strong> dipisah di dokumen, AI akan otomatis menjumlahkannya ke pos Kas & Setara Kas. Skala angka (jutaan/ribuan) & tanda minus kerugian dideteksi presisi.
                </p>
                <button type="button" id="btnStartAiExtraction" onclick="window.PelakuModule.runGeminiFinExtraction()" class="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-700 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 shadow-md shadow-purple-600/30 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0" disabled>
                  <i data-lucide="zap" class="w-4 h-4 text-amber-300"></i>
                  <span>Mulai Ekstraksi AI</span>
                </button>
              </div>
            </div>

            <!-- Loading Section -->
            <div id="aiOcrLoadingSection" class="hidden py-12 text-center space-y-4">
              <div class="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
              <div class="space-y-1">
                <h4 id="aiOcrLoadingStatus" class="text-sm font-bold text-purple-900">Membaca berkas dokumen...</h4>
                <p id="aiOcrLoadingSub" class="text-xs text-slate-500">Mohon tunggu, AI sedang menganalisa tabel Neraca & Laba Rugi.</p>
              </div>
            </div>

            <!-- Review & Verification Section -->
            <div id="aiOcrReviewSection" class="hidden"></div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    this.setupAiOcrDragDrop();

    // If reopening existing reviewed data
    if (reopenReview && this.currentExtractedFinData) {
      document.getElementById('aiOcrUploadSection').style.display = 'none';
      this.renderAiFinReviewTable(this.currentExtractedFinData);
    }
  },

  closeAiFinUploadModal() {
    const modalContainer = document.getElementById('pelaku-modal-container');
    if (modalContainer) modalContainer.innerHTML = '';
  },

  promptCustomApiKey() {
    const existing = localStorage.getItem('gemini_api_key') || '';
    const key = prompt('Masukkan Google Gemini API Key Anda (opsional, kosongkan untuk menggunakan kunci bawaan):', existing);
    if (key !== null) {
      if (key.trim()) {
        localStorage.setItem('gemini_api_key', key.trim());
        alert('API Key tersimpan!');
      } else {
        localStorage.removeItem('gemini_api_key');
        alert('Menggunakan API Key bawaan.');
      }
    }
  },

  setupAiOcrDragDrop() {
    const dropzone = document.getElementById('aiOcrDropzone');
    if (!dropzone) return;

    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('border-purple-600', 'bg-purple-100/50');
      }, false);
    });

    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('border-purple-600', 'bg-purple-100/50');
      }, false);
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = Array.from(dt.files || []);
      if (files.length) {
        this.handleAiFinFileSelect({ target: { files } });
      }
    }, false);
  },

  handleAiFinFileSelect(event) {
    const files = Array.from(event.target?.files || []);
    if (!files.length) return;

    const maxMb = 25;
    for (const file of files) {
      if (file.size > maxMb * 1024 * 1024) {
        alert(`Berkas "${file.name}" (${(file.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas 25 MB.`);
        continue;
      }
      if (!this.selectedAiFinFiles.some((f) => f.name === file.name && f.size === file.size)) {
        this.selectedAiFinFiles.push(file);
      }
    }

    if (event.target) event.target.value = '';
    this.renderSelectedFilesList();
  },

  removeAiFinFile(idx) {
    this.selectedAiFinFiles.splice(idx, 1);
    this.renderSelectedFilesList();
  },

  renderSelectedFilesList() {
    const infoEl = document.getElementById('aiOcrSelectedFileInfo');
    const btnStart = document.getElementById('btnStartAiExtraction');
    if (!infoEl) return;

    if (this.selectedAiFinFiles.length === 0) {
      infoEl.classList.add('hidden');
      infoEl.innerHTML = '';
      if (btnStart) btnStart.disabled = true;
      return;
    }

    let totalBytes = 0;
    const itemsHtml = this.selectedAiFinFiles.map((file, idx) => {
      totalBytes += file.size;
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      const icon = isPdf ? 'file-text' : 'image';
      const szStr = file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.round(file.size / 1024)} KB`;
      return `
        <div class="flex items-center justify-between p-2 rounded-xl bg-white border border-purple-200 text-xs shadow-sm mb-1.5">
          <div class="flex items-center gap-2 min-w-0">
            <span class="text-purple-600 font-bold">${isPdf ? '📕' : '🖼️'}</span>
            <span class="font-bold text-slate-800 truncate max-w-xs" title="${file.name}">${file.name}</span>
            <span class="text-[10px] text-slate-400">(${szStr})</span>
          </div>
          <button type="button" onclick="event.stopPropagation(); window.PelakuModule.removeAiFinFile(${idx})" class="w-6 h-6 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition font-bold text-xs flex items-center justify-center" title="Hapus berkas ini">&times;</button>
        </div>
      `;
    }).join('');

    const totalMb = (totalBytes / (1024 * 1024)).toFixed(2);
    infoEl.classList.remove('hidden');
    infoEl.innerHTML = `
      <div class="flex items-center justify-between text-xs font-bold text-purple-900 mb-2">
        <span>📂 <strong>${this.selectedAiFinFiles.length} Berkas Terpilih</strong> (${totalMb} MB)</span>
        <span class="text-emerald-600 text-[11px] font-semibold">✓ Siap Diproses</span>
      </div>
      <div class="space-y-1">${itemsHtml}</div>
    `;

    if (btnStart) btnStart.disabled = false;
  },

  resetAiFinUploadState() {
    this.selectedAiFinFiles = [];
    this.currentExtractedFinData = null;

    const fileInput = document.getElementById('aiOcrFileInput');
    if (fileInput) fileInput.value = '';

    this.renderSelectedFilesList();

    const uploadSec = document.getElementById('aiOcrUploadSection');
    const loadingSec = document.getElementById('aiOcrLoadingSection');
    const reviewSec = document.getElementById('aiOcrReviewSection');

    if (uploadSec) uploadSec.style.display = 'block';
    if (loadingSec) loadingSec.style.display = 'none';
    if (reviewSec) {
      reviewSec.style.display = 'none';
      reviewSec.innerHTML = '';
    }
  },

  async runGeminiFinExtraction() {
    const apiKey = this.getActiveGeminiApiKey();
    if (!apiKey) {
      alert('Google Gemini API Key belum terkonfigurasi pada sistem.');
      return;
    }

    if (!this.selectedAiFinFiles || this.selectedAiFinFiles.length === 0) {
      alert('Silakan pilih minimal 1 berkas dokumen Laporan Keuangan (PDF atau Gambar) terlebih dahulu.');
      return;
    }

    const uploadSec = document.getElementById('aiOcrUploadSection');
    const loadingSec = document.getElementById('aiOcrLoadingSection');
    const statusEl = document.getElementById('aiOcrLoadingStatus');
    const subEl = document.getElementById('aiOcrLoadingSub');

    if (uploadSec) uploadSec.style.display = 'none';
    if (loadingSec) loadingSec.style.display = 'block';

    const updateStatus = (text, sub = '') => {
      if (statusEl) statusEl.textContent = text;
      if (subEl) subEl.textContent = sub;
    };

    try {
      const currentYear = new Date().getFullYear();
      const targetYr1 = parseInt(document.getElementById('aiOcrYear1')?.value, 10) || (currentYear - 1);
      const targetYr2 = parseInt(document.getElementById('aiOcrYear2')?.value, 10) || currentYear;

      const parts = [];

      for (let i = 0; i < this.selectedAiFinFiles.length; i++) {
        const file = this.selectedAiFinFiles[i];
        updateStatus(`1. Membaca berkas ${i + 1} dari ${this.selectedAiFinFiles.length}...`, `Mengonversi "${file.name}" ke format transmisi aman.`);

        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = () => reject(new Error(`Gagal membaca berkas: ${file.name}`));
          reader.readAsDataURL(file);
        });

        const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
        const mimeType = isPdf ? 'application/pdf' : (file.type || 'image/jpeg');

        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });
      }

      updateStatus(`2. Mengirim ${this.selectedAiFinFiles.length} dokumen ke AI...`, 'AI sedang menganalisis gabungan halaman Neraca (Aktiva & Passiva) serta Laporan Laba Rugi.');

      const promptText = `Anda adalah seorang auditor independen & analis kredit senior PT Askrindo.
Tugas Anda adalah membaca Laporan Keuangan audited / in-house dari seluruh dokumen yang dilampirkan (${this.selectedAiFinFiles.length} berkas).
Dokumen terlampir dapat terdiri dari beberapa berkas terpisah (misal: berkas Neraca dan berkas Laba Rugi terpisah, atau tahun buku yang berbeda).
Analisis seluruh berkas yang dilampirkan secara komprehensif untuk mengekstrak 2 tahun buku terakhir.
Prioritaskan pencocokan pada periode tahun ${targetYr1} dan ${targetYr2}. Jika tidak tertera persis, gunakan 2 tahun buku terbaru yang tercantum di dokumen.

ATURAN KRUSIAL PEMBACAAN ANGKA, KOMA, & DESIMAL (WAJIB SANGAT TELITI!):
1. PEMBACAAN DESIMAL DAN KOMA:
   - Dokumen Laporan Keuangan Indonesia umumnya menggunakan: TITIK (.) sebagai pemisah ribuan dan KOMA (,) sebagai pemisah DESIMAL (sen / 2 angka di belakang koma). Contoh: "Rp 15.420.350,75" atau "2.500.000,00".
   - SANGAT PENTING: JANGAN PERNAH membaca koma desimal (seperti ",00", ",50", ",75") sebagai digit ribuan!
     Contoh kesalahan fatal: Angka "1.500.000,00" JANGAN SAMPAI dibaca menjadi "150.000.000" (seratus lima puluh juta)! Angka tersebut adalah "1500000.00" (satu juta lima ratus ribu).
   - Jika dokumen menggunakan format standar internasional/Inggris (koma sebagai ribuan dan titik sebagai desimal, contoh "15,420,350.75"), sesuaikan interpretasi secara benar.
   - Ekstrak seluruh nominal hingga presisi 2 ANGKA DI BELAKANG KOMA (format number/float JSON menggunakan tanda titik sebagai desimal, contoh: 21352397620.50 atau 5000000.00).
   - Hilangkan simbol "Rp", spasi, dan tanda pemisah ribuan saat memasukkan angka ke JSON.
2. SATUAN PENYAJIAN (SCALE):
   - Periksa header tabel: jika tertera "Dalam Rupiah" / "In IDR", gunakan angka aslinya.
   - Jika tertera "Dalam Ribuan Rupiah" / "In Thousands IDR", kalikan angka dengan 1.000 (contoh: 1.250,50 menjadi 1250500.00).
   - Jika tertera "Dalam Jutaan Rupiah" / "In Millions IDR", kalikan angka dengan 1.000.000 (contoh: 12,75 menjadi 12750000.00).
   - Jika tertera "Dalam Miliar Rupiah", kalikan dengan 1.000.000.000.
3. POS BERARAH MINUS / RUGI:
   - Pos dalam tanda kurung "(...)" atau bertanda minus "-", seperti Laba Bersih yang Rugi atau Akumulasi Rugi, WAJIB bernilai negatif (-).

4. ATURAN KHUSUS KAS & BANK (PENJUMLAHAN OTOMATIS JIKA TERPISAH):
   - Sistem memiliki SATU baris/kolom tunggal untuk aktiva kas likuid, yaitu "cash" (Kas & Bank / Kas dan Setara Kas).
   - Apabila di dokumen Laporan Keuangan pos "Kas" (Kas di Tangan / Kas Kecil / Petty Cash) dan "Bank" (Kas di Bank / Rekening Bank / Giro / Deposito) disajikan SECARA TERPISAH:
     -> SISTEM WAJIB MENJUMLAHKAN Kas dan seluruh Bank tersebut: (Kas + Bank).
     -> Masukkan hasil total penjumlahannya ke dalam field "cash" untuk masing-masing tahun buku.
     -> JANGAN SEKALI-KALI hanya memasukkan salah satu (misalnya hanya kas saja atau bank saja), keduanya WAJIB dijumlahkan menjadi nominal gabungan pada "cash".
     -> Tuliskan teks rincian penjumlahannya pada field "cash_breakdown" (contoh: "Kas Rp 15.000.000 + Bank Rp 85.000.000 = Total Rp 100.000.000") dan rincian angka pada "kas_detail": {"kas": 15000000.00, "bank": 85000000.00}.
   - Jika dokumen sudah menyajikan gabungan ("Kas dan Setara Kas" atau "Kas dan Bank"), gunakan nominal gabungan tersebut, "cash_breakdown": "Disajikan Gabungan di Dokumen", dan "kas_detail": null.

KLASIFIKASI STRUKTUR LAPORAN KEUANGAN:
Kelompok 1: AKTIVA LANCAR (Current Assets)
- cash: Kas dan Setara Kas / Bank (WAJIB otomatis jumlahkan seluruh Kas + Bank jika di dokumen disajikan terpisah baris/kolomnya!)
- otherCa: Uang Jaminan / Aset Lancar Lainnya
- ar: Piutang Usaha / Piutang Dagang (Trade Accounts Receivable)
- inv: Persediaan Barang (Inventory)
- otherAr: Piutang Lain-lain
- prepaid: Biaya Dibayar Dimuka / Uang Muka Pajak / Pekerjaan dlm Proses

Kelompok 2: AKTIVA TETAP & AKTIVA TIDAK LANCAR (Fixed & Non-Current Assets)
- fa: Aset Tetap (Fixed Assets)
- depr: Akumulasi Penyusutan (jika dipisah, atau 0 jika Aset Tetap sudah disajikan Nilai Buku Bersih)
- invest: Investasi Saham / Investasi Jangka Panjang
- taxAsset: Tagihan Pajak / Aset Pajak Tangguhan / Aset Tidak Lancar Lainnya

Kelompok 3: HUTANG LANCAR / JANGKA PENDEK (Current Liabilities)
- ap: Utang Usaha / Utang Dagang (Trade Accounts Payable)
- stDebt: Utang Bank Jangka Pendek
- otherAp: Utang Lain-lain / Liabilitas Lancar Lainnya / Utang Pajak
- accrued: Beban Akrual / Biaya YMH Dibayar

Kelompok 4: HUTANG JANGKA PANJANG (Long-Term Liabilities)
- ltDebt: Utang Bank Jangka Panjang / Liabilitas Jangka Panjang

Kelompok 5: MODAL SENDIRI / EKUITAS (Equity)
- capital: Modal Saham / Modal Disetor
- otherCap: Tambahan Modal Disetor / Agio Saham / Modal Lainnya
- retEarn: Saldo Laba Ditahan (Retained Earnings) periode lalu / awal
- re: Laba (Rugi) Bersih Tahun Berjalan (Net Income / EAT dari Laba Rugi)

Kelompok 6: LAPORAN LABA RUGI (Income Statement)
- rev: Pendapatan Usaha Netto / Penjualan Bersih
- cogs: Beban Pokok Penjualan / Harga Pokok Produksi (HPP)
- opex: Beban Operasional / Beban Usaha / Beban Umum & Administrasi
- otherInc: Pendapatan Lain-lain
- otherExp: Beban Lain-lain
- intExp: Biaya Bunga / Keuangan
- tax: Beban Pajak Penghasilan
- div: Dividen

ATURAN KRUSIAL KESEIMBANGAN NERACA & PEMETAAN SALDO LABA (WAJIB BALANCE!):
- Total Ekuitas = capital + otherCap + retEarn + re
- Neraca HARUS Seimbang: Total Aktiva = Total Liabilitas (Hutang Lancar + Hutang Jk. Panjang) + Total Ekuitas.
- "re": Wajib diisi LABA (RUGI) BERSIH TAHUN BERJALAN (Net Income / EAT dari Laporan Laba Rugi). Jika rugi, beri minus (-).
- "retEarn": Wajib diisi SALDO LABA DITAHAN PERIODE LALU / AWAL.
- JANGAN DOUBLE COUNTING: Jika Saldo Laba di Neraca adalah Saldo Akhir, maka "retEarn" = (Total Saldo Laba Akhir) - ("re").
- ASET TETAP & DEPRESIASI: Jika "fa" sudah disajikan Nilai Buku Bersih (Net Book Value), maka isi "depr": 0.

ATURAN DETEKSI STATUS AUDIT LAPORAN KEUANGAN:
- Tentukan "audit_status": "audited" jika dokumen memuat lembar "Laporan Auditor Independen", opini audit KAP, nama KAP, tanda tangan AP, nomor registrasi KAP/AP, atau kop resmi KAP.
- Tentukan "audit_status": "unaudited" jika berupa kompilasi in-house internal manajemen.
- Jika "audited", baca nama KAP ("auditor_kap_name"), opini auditor ("auditor_opinion"), tanggal laporan audit ("audit_report_date"), dan alasan pembacaan ("audit_detection_reason").

Petakan secara presisi ke dalam struktur JSON berikut:
{
  "company_name": "Nama PT / Debitur di dokumen",
  "year1": ${targetYr1},
  "year2": ${targetYr2},
  "audit_status": "audited atau unaudited",
  "auditor_kap_name": "Nama KAP atau -",
  "auditor_opinion": "Wajar Tanpa Pengecualian (WTP) / -",
  "audit_report_date": "Tanggal laporan auditor atau -",
  "audit_detection_reason": "Ringkasan bukti status audit",
  "data_year1": {
    "cash": 0.00, "cash_breakdown": "Rincian jika Kas & Bank terpisah atau Disajikan Gabungan", "kas_detail": {"kas": 0.00, "bank": 0.00},
    "otherCa": 0.00, "ar": 0.00, "inv": 0.00, "otherAr": 0.00, "prepaid": 0.00,
    "fa": 0.00, "depr": 0.00, "invest": 0.00, "taxAsset": 0.00,
    "ap": 0.00, "stDebt": 0.00, "otherAp": 0.00, "accrued": 0.00,
    "ltDebt": 0.00,
    "capital": 0.00, "otherCap": 0.00, "retEarn": 0.00, "re": 0.00,
    "rev": 0.00, "cogs": 0.00, "opex": 0.00, "otherInc": 0.00, "otherExp": 0.00, "intExp": 0.00, "tax": 0.00, "div": 0.00
  },
  "data_year2": {
    "cash": 0.00, "cash_breakdown": "Rincian jika Kas & Bank terpisah atau Disajikan Gabungan", "kas_detail": {"kas": 0.00, "bank": 0.00},
    "otherCa": 0.00, "ar": 0.00, "inv": 0.00, "otherAr": 0.00, "prepaid": 0.00,
    "fa": 0.00, "depr": 0.00, "invest": 0.00, "taxAsset": 0.00,
    "ap": 0.00, "stDebt": 0.00, "otherAp": 0.00, "accrued": 0.00,
    "ltDebt": 0.00,
    "capital": 0.00, "otherCap": 0.00, "retEarn": 0.00, "re": 0.00,
    "rev": 0.00, "cogs": 0.00, "opex": 0.00, "otherInc": 0.00, "otherExp": 0.00, "intExp": 0.00, "tax": 0.00, "div": 0.00
  }
}
Balas HANYA format JSON valid tanpa tanda kutip markdown (\`\`\`json) atau teks pengantar apapun.`;

      parts.push({ text: promptText });

      const modelsToTry = ['gemini-2.5-flash', 'gemini-3.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
      let lastError = null;
      let rawText = '';

      for (const modelName of modelsToTry) {
        try {
          updateStatus('3. Memproses analisa data Laporan Keuangan...', `Mengekstrak tabel dan angka finansial menggunakan ${modelName}...`);
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;

          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: parts }],
              generationConfig: {
                temperature: 0.1,
                response_mime_type: 'application/json'
              }
            })
          });

          if (!response.ok) {
            const errBody = await response.text();
            throw new Error(`HTTP ${response.status}: ${errBody}`);
          }

          const resData = await response.json();
          rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) break;
        } catch (err) {
          lastError = err;
          console.warn(`Model ${modelName} gagal:`, err);
        }
      }

      if (!rawText) {
        throw lastError || new Error('Tidak ada respon teks yang diterima dari Gemini API.');
      }

      updateStatus('4. Menyusun pratinjau verifikasi...', 'Memvalidasi keseimbangan Neraca & Laba Rugi.');

      let parsed = null;
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        const cleaned = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      this.reconcileExtractedFinancialData(parsed);
      this.currentExtractedFinData = parsed;
      this.renderAiFinReviewTable(parsed);

    } catch (err) {
      console.error('Error ekstraksi AI:', err);
      if (loadingSec) loadingSec.style.display = 'none';
      if (uploadSec) uploadSec.style.display = 'block';

      let msg = err.message || 'Terjadi kesalahan saat memproses dokumen.';
      if (msg.includes('API_KEY_INVALID') || msg.includes('403') || msg.includes('401')) {
        msg = 'Gemini API Key tidak valid. Mohon periksa kembali API Key Anda dari Google AI Studio.';
      } else if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
        msg = 'Batas kuota gratis Gemini API tercapai sementara. Silakan tunggu beberapa detik dan coba lagi.';
      }

      alert('Gagal mengekstrak Laporan Keuangan:\n\n' + msg);
    }
  },

  reconcileExtractedFinancialData(parsed) {
    if (!parsed) return;
    ['data_year1', 'data_year2'].forEach((yearKey) => {
      const d = parsed[yearKey];
      if (!d) return;

      // 1. Penggabungan Otomatis Kas & Bank jika terpisah di dokumen
      let kasVal = 0;
      let bankVal = 0;
      let hasSepDetail = false;

      if (d.kas_detail && typeof d.kas_detail === 'object') {
        kasVal = typeof d.kas_detail.kas === 'number' ? d.kas_detail.kas : (this.parseFormattedNumber(d.kas_detail.kas) || 0);
        bankVal = typeof d.kas_detail.bank === 'number' ? d.kas_detail.bank : (this.parseFormattedNumber(d.kas_detail.bank) || 0);
        if (kasVal > 0 || bankVal > 0) hasSepDetail = true;
      }

      if (!hasSepDetail) {
        const sepKas = d.kas !== undefined ? (typeof d.kas === 'number' ? d.kas : this.parseFormattedNumber(d.kas)) : 0;
        const sepBank = d.bank !== undefined ? (typeof d.bank === 'number' ? d.bank : this.parseFormattedNumber(d.bank)) : 0;
        if (sepKas > 0 || sepBank > 0) {
          kasVal = sepKas || 0;
          bankVal = sepBank || 0;
          hasSepDetail = true;
        }
      }

      if (hasSepDetail && (kasVal > 0 || bankVal > 0)) {
        const combinedCash = Math.round((kasVal + bankVal) * 100) / 100;
        if (!d.cash || Math.abs(d.cash - kasVal) < 0.01 || Math.abs(d.cash - bankVal) < 0.01) {
          d.cash = combinedCash;
        }
        if (!d.cash_breakdown || d.cash_breakdown.includes('Disajikan Gabungan')) {
          d.cash_breakdown = 'Kas: Rp ' + this.formatNumberWithDots(kasVal) + ' + Bank: Rp ' + this.formatNumberWithDots(bankVal) + ' = Rp ' + this.formatNumberWithDots(d.cash);
        }
      }

      Object.keys(d).forEach((k) => {
        if (k === 'cash_breakdown' || k === 'kas_detail') return;
        if (typeof d[k] !== 'number' || isNaN(d[k])) {
          d[k] = this.parseFormattedNumber(d[k]) || 0;
        } else {
          d[k] = Math.round(d[k] * 100) / 100;
        }
      });

      const rev = d.rev || 0;
      const cogs = d.cogs || 0;
      const opex = d.opex || 0;
      const otherInc = d.otherInc || 0;
      const otherExp = d.otherExp || 0;
      const intExp = d.intExp || 0;
      const tax = d.tax || 0;
      const div = d.div || 0;
      const isHasIncomeStatement = (rev !== 0 || cogs !== 0 || opex !== 0);
      const computedEat = Math.round((rev - cogs - opex + otherInc - otherExp - intExp - tax - div) * 100) / 100;

      const act = (d.cash || 0) + (d.otherCa || 0) + (d.ar || 0) + (d.inv || 0) + (d.otherAr || 0) + (d.prepaid || 0) + (d.fa || 0) - Math.abs(d.depr || 0) + (d.invest || 0) + (d.taxAsset || 0);
      const liab = (d.ap || 0) + (d.stDebt || 0) + (d.otherAp || 0) + (d.accrued || 0) + (d.ltDebt || 0);
      const cap = (d.capital || 0) + (d.otherCap || 0);
      let pass = liab + cap + (d.retEarn || 0) + (d.re || 0);
      let diff = Math.round((pass - act) * 100) / 100;

      if (Math.abs(diff) > 0.05) {
        if (d.re !== 0 && Math.abs(diff - d.re) < 1) {
          d.retEarn = Math.round(((d.retEarn || 0) - d.re) * 100) / 100;
        } else if (d.depr !== 0 && Math.abs(diff - Math.abs(d.depr)) < 1) {
          d.depr = 0;
        } else if (d.re !== 0 && Math.abs(diff - 2 * d.re) < 1) {
          d.re = -Math.abs(d.re);
        } else if (d.retEarn !== 0 && Math.abs(diff - 2 * d.retEarn) < 1) {
          d.retEarn = -Math.abs(d.retEarn);
        } else if (d.re === 0 && d.retEarn !== 0 && isHasIncomeStatement && computedEat !== 0) {
          d.re = computedEat;
          d.retEarn = Math.round((d.retEarn - computedEat) * 100) / 100;
        } else if (act > 0 && (d.retEarn !== 0 || d.re !== 0)) {
          const targetEquity = act - liab;
          const targetTotalRetEarn = targetEquity - cap;
          if (isHasIncomeStatement && computedEat !== 0) {
            d.re = computedEat;
            d.retEarn = Math.round((targetTotalRetEarn - d.re) * 100) / 100;
          } else if (d.re !== 0) {
            d.retEarn = Math.round((targetTotalRetEarn - d.re) * 100) / 100;
          } else {
            d.re = Math.round(targetTotalRetEarn * 100) / 100;
            d.retEarn = 0;
          }
        }
      }
    });
  },

  renderAiFinReviewTable(data) {
    const loadingSec = document.getElementById('aiOcrLoadingSection');
    const reviewSec = document.getElementById('aiOcrReviewSection');

    if (loadingSec) loadingSec.style.display = 'none';
    if (!reviewSec) return;
    reviewSec.style.display = 'block';

    const y1 = data.year1 || 2024;
    const y2 = data.year2 || 2025;
    const d1 = data.data_year1 || {};
    const d2 = data.data_year2 || {};

    const ca1 = (d1.cash||0) + (d1.otherCa||0) + (d1.ar||0) + (d1.inv||0) + (d1.otherAr||0) + (d1.prepaid||0);
    const nca1 = (d1.fa||0) - Math.abs(d1.depr||0) + (d1.invest||0) + (d1.taxAsset||0);
    const ta1 = ca1 + nca1;
    const cl1 = (d1.ap||0) + (d1.stDebt||0) + (d1.otherAp||0) + (d1.accrued||0);
    const lt1 = (d1.ltDebt||0);
    const tl1 = cl1 + lt1;
    const eq1 = (d1.capital||0) + (d1.otherCap||0) + (d1.retEarn||0) + (d1.re||0);
    const pass1 = tl1 + eq1;
    const eat1 = (d1.rev||0) - (d1.cogs||0) - (d1.opex||0) + (d1.otherInc||0) - (d1.otherExp||0) - (d1.intExp||0) - (d1.tax||0) - (d1.div||0);

    const ca2 = (d2.cash||0) + (d2.otherCa||0) + (d2.ar||0) + (d2.inv||0) + (d2.otherAr||0) + (d2.prepaid||0);
    const nca2 = (d2.fa||0) - Math.abs(d2.depr||0) + (d2.invest||0) + (d2.taxAsset||0);
    const ta2 = ca2 + nca2;
    const cl2 = (d2.ap||0) + (d2.stDebt||0) + (d2.otherAp||0) + (d2.accrued||0);
    const lt2 = (d2.ltDebt||0);
    const tl2 = cl2 + lt2;
    const eq2 = (d2.capital||0) + (d2.otherCap||0) + (d2.retEarn||0) + (d2.re||0);
    const pass2 = tl2 + eq2;
    const eat2 = (d2.rev||0) - (d2.cogs||0) - (d2.opex||0) + (d2.otherInc||0) - (d2.otherExp||0) - (d2.intExp||0) - (d2.tax||0) - (d2.div||0);
    const gp1 = (d1.rev||0) - (d1.cogs||0);
    const gp2 = (d2.rev||0) - (d2.cogs||0);

    const diff1 = Math.abs(ta1 - pass1);
    const isBal1 = diff1 < 1.0;
    const diff2 = Math.abs(ta2 - pass2);
    const isBal2 = diff2 < 1.0;

    const isExtAudited = (data.audit_status || 'audited').toLowerCase() !== 'unaudited';
    const extKap = data.auditor_kap_name && data.auditor_kap_name !== '-' ? data.auditor_kap_name : (isExtAudited ? 'KAP Terdaftar' : '-');
    const extOpinion = data.auditor_opinion && data.auditor_opinion !== '-' ? data.auditor_opinion : (isExtAudited ? 'Wajar Tanpa Pengecualian (WTP)' : '-');

    const rows = [
      { section: 'I. AKTIVA LANCAR (CURRENT ASSETS)', type: 'header' },
      { k: 'cash', label: 'Kas & Setara Kas (Bank)', code: 'a' },
      { k: 'otherCa', label: 'Uang Jaminan & Aset Lancar Lain', code: 'a2' },
      { k: 'ar', label: 'Piutang Usaha (Trade AR)', code: 'b' },
      { k: 'inv', label: 'Persediaan Barang (Inventory)', code: 'c' },
      { k: 'otherAr', label: 'Piutang Lain-lain', code: 'd' },
      { k: 'prepaid', label: 'Biaya / Pajak Dibayar Dimuka', code: 'e' },
      { subtotal: 'ca', label: 'TOTAL AKTIVA LANCAR', code: 'f', val1: ca1, val2: ca2 },

      { section: 'II. AKTIVA TETAP & NON-LANCAR', type: 'header' },
      { k: 'fa', label: 'Aktiva Tetap (Fixed Assets)', code: 'h' },
      { k: 'depr', label: 'Akumulasi Penyusutan (-)', code: 'i' },
      { k: 'invest', label: 'Investasi Saham / Jk. Panjang', code: 'g' },
      { k: 'taxAsset', label: 'Aset Pajak Tangguhan / Lain-lain', code: 'j' },
      { subtotal: 'nca', label: 'TOTAL AKTIVA TETAP & LAINNYA', code: 'k', val1: nca1, val2: nca2 },
      { total: 'ta', label: 'TOTAL AKTIVA (LANCAR + TETAP)', code: 'l', val1: ta1, val2: ta2 },

      { section: 'III. HUTANG LANCAR / JANGKA PENDEK', type: 'header' },
      { k: 'ap', label: 'Hutang Usaha (Trade AP)', code: 'm1' },
      { k: 'stDebt', label: 'Hutang Bank Jangka Pendek', code: 'm2' },
      { k: 'otherAp', label: 'Hutang Lancar Lainnya', code: 'm3' },
      { k: 'accrued', label: 'Biaya YMH Dibayar (Akrual)', code: 'm4' },
      { subtotal: 'cl', label: 'TOTAL HUTANG LANCAR', code: 'm', val1: cl1, val2: cl2 },

      { section: 'IV. HUTANG JANGKA PANJANG', type: 'header' },
      { k: 'ltDebt', label: 'Hutang Bank Jangka Panjang', code: 'n' },
      { total: 'tl', label: 'TOTAL HUTANG', code: 'o', val1: tl1, val2: tl2 },

      { section: 'V. MODAL SENDIRI / EKUITAS', type: 'header' },
      { k: 'capital', label: 'Modal Saham Disetor', code: 'p' },
      { k: 'otherCap', label: 'Setoran Modal Lainnya / Agio', code: 'q' },
      { k: 'retEarn', label: 'Laba Ditahan Periode Lalu', code: 'q1' },
      { k: 're', label: 'Laba Bersih Tahun Berjalan (EAT)', code: 'q2' },
      { subtotal: 'eq', label: 'TOTAL EKUITAS', code: 'r', val1: eq1, val2: eq2 },
      { total: 'pass', label: 'TOTAL PASSIVA (HUTANG + EKUITAS)', code: 's', val1: pass1, val2: pass2 },

      { section: 'VI. LAPORAN LABA RUGI', type: 'header' },
      { k: 'rev', label: 'Pendapatan Netto (Omset)', code: 't' },
      { k: 'cogs', label: 'Harga Pokok Penjualan (HPP)', code: 'u' },
      { subtotal: 'gp', label: 'LABA KOTOR (GROSS PROFIT)', code: 'w', val1: gp1, val2: gp2 },
      { k: 'opex', label: 'Beban Operasional & Umum', code: 'v' },
      { k: 'otherInc', label: 'Pendapatan Lain-lain', code: 'x1' },
      { k: 'otherExp', label: 'Beban Lain-lain', code: 'x2' },
      { k: 'intExp', label: 'Biaya Bunga / Keuangan', code: 'x' },
      { k: 'tax', label: 'Pajak Penghasilan', code: 'y' },
      { subtotal: 'eat', label: 'LABA BERSIH TAHUN BERJALAN (EAT)', code: 'z', val1: eat1, val2: eat2 }
    ];

    reviewSec.innerHTML = `
      <div class="space-y-4 text-xs">
        <!-- Banner Hasil Ekstraksi -->
        <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
              <h4 class="font-bold text-sm text-emerald-950">Ekstraksi Laporan Keuangan Berhasil</h4>
            </div>
            <p class="text-xs text-slate-600 mt-1">
              Entitas: <strong class="text-slate-900">${data.company_name || 'Sesuai Dokumen'}</strong> &bull; Periode: <strong>Tahun ${y1} & ${y2}</strong>
            </p>
          </div>
          <div class="flex items-center gap-2 flex-wrap">
            <span id="previewBalanceBadge1" class="px-2.5 py-1 rounded-full font-bold text-[11px] ${isBal1 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
              Th ${y1}: ${isBal1 ? '✓ Neraca Balance' : ('Selisih ' + this.fmtRp(diff1))}
            </span>
            <span id="previewBalanceBadge2" class="px-2.5 py-1 rounded-full font-bold text-[11px] ${isBal2 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'}">
              Th ${y2}: ${isBal2 ? '✓ Neraca Balance' : ('Selisih ' + this.fmtRp(diff2))}
            </span>
          </div>
        </div>

        <!-- Status Audit & Penyesuaian Analis -->
        <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-bold text-slate-700">Status Audit Terdeteksi:</span>
            <span class="px-2.5 py-0.5 rounded-full font-bold text-[11px] ${isExtAudited ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}">
              ${isExtAudited ? `AUDITED (${extKap})` : 'IN-HOUSE / UNAUDITED'}
            </span>
            ${isExtAudited ? `<span class="text-[11px] font-semibold text-emerald-700">&bull; Opini: ${extOpinion}</span>` : ''}
          </div>
          <div class="flex items-center gap-2">
            <label class="text-[11px] font-bold text-slate-600">Sesuaikan Status:</label>
            <select id="aiReviewAuditAdjustSelect" onchange="window.PelakuModule.handleAiReviewAuditStatusChange(this.value)" class="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-xs font-bold">
              <option value="audited" ${isExtAudited ? 'selected' : ''}>Audited KAP (Terpercaya)</option>
              <option value="unaudited" ${!isExtAudited ? 'selected' : ''}>In-House / Unaudited</option>
            </select>
          </div>
        </div>

        <!-- Tabel Akun Laporan Keuangan -->
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
                      <td class="p-2 text-right font-mono" id="ai_subtot_${r.subtotal || r.total}_1">${this.formatNumberWithDots(r.val1, true)}</td>
                      <td class="p-2 text-right font-mono" id="ai_subtot_${r.subtotal || r.total}_2">${this.formatNumberWithDots(r.val2, true)}</td>
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

        <!-- Tombol Aksi Bawah Modal -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.PelakuModule.resetAiFinUploadState()" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
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
            <button type="button" onclick="window.PelakuModule.applyExtractedFinDataToForm(2)" class="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/30 transition flex items-center gap-2">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Terapkan ke Form Laporan Keuangan</span>
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
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

  handleAiReviewAuditStatusChange(val) {
    if (!this.currentExtractedFinData) return;
    const isAudited = val === 'audited';
    this.currentExtractedFinData.audit_status = isAudited ? 'audited' : 'unaudited';
    this.currentExtractedFinData.audit_detection_reason = isAudited
      ? 'Disesuaikan oleh Analis: Laporan Keuangan Audited KAP'
      : 'Disesuaikan oleh Analis: Laporan Keuangan In-House / Unaudited';
  },

  applyExtractedFinDataToForm(defaultYear = 2) {
    if (!this.currentExtractedFinData) return;

    // Collect latest edited values from review inputs
    const fields = [
      'rev', 'cogs', 'opex', 'otherInc', 'otherExp', 'intExp', 'tax', 'div',
      'cash', 'otherCa', 'ar', 'inv', 'otherAr', 'prepaid',
      'fa', 'depr', 'invest', 'taxAsset',
      'ap', 'stDebt', 'otherAp', 'accrued', 'ltDebt',
      'capital', 'otherCap', 'retEarn', 're'
    ];

    const d1 = {};
    const d2 = {};

    fields.forEach((k) => {
      const el1 = document.getElementById(`ai_rev_${k}_1`);
      const el2 = document.getElementById(`ai_rev_${k}_2`);
      d1[k] = el1 ? this.parseFormattedNumber(el1.value) : (this.currentExtractedFinData.data_year1?.[k] || 0);
      d2[k] = el2 ? this.parseFormattedNumber(el2.value) : (this.currentExtractedFinData.data_year2?.[k] || 0);
    });

    const auditAdjustSelect = document.getElementById('aiReviewAuditAdjustSelect');
    const auditStatus = auditAdjustSelect ? auditAdjustSelect.value : (this.currentExtractedFinData.audit_status || 'audited');

    this.extractedYearsData = {
      company_name: this.currentExtractedFinData.company_name,
      year1: this.currentExtractedFinData.year1 || 2024,
      year2: this.currentExtractedFinData.year2 || 2025,
      audit_status: auditStatus,
      auditor_kap_name: this.currentExtractedFinData.auditor_kap_name || 'KAP Terdaftar',
      auditor_opinion: this.currentExtractedFinData.auditor_opinion || 'Wajar Tanpa Pengecualian (WTP)',
      data_year1: d1,
      data_year2: d2
    };

    // Close modal
    this.closeAiFinUploadModal();

    // Populate data for the target year (default year 2)
    this.switchActiveYear(defaultYear);

    // Update OCR Status Banner in PELAKU
    this.updateOcrBannerUI();

    window.askrindoApp.showToast(`Berhasil menerapkan data Laporan Keuangan hasil AI OCR!`, 'success');
  },

  switchActiveYear(targetYrNumber) {
    this.activeYear = targetYrNumber;
    if (!this.extractedYearsData) return;

    const isYear2 = targetYrNumber === 2;
    const yearVal = isYear2 ? this.extractedYearsData.year2 : this.extractedYearsData.year1;
    const d = isYear2 ? this.extractedYearsData.data_year2 : this.extractedYearsData.data_year1;
    const isAudited = this.extractedYearsData.audit_status === 'audited';

    // Update Company Name if present
    if (this.extractedYearsData.company_name) {
      const compInp = document.getElementById('pelaku-company');
      if (compInp) compInp.value = this.extractedYearsData.company_name;
    }

    // Update Year & Opinion
    const yrInp = document.getElementById('pelaku-year');
    if (yrInp) {
      yrInp.value = `Tahun Buku ${yearVal} (${isAudited ? 'Audited' : 'In-House'})`;
    }

    const opInp = document.getElementById('pelaku-opinion');
    if (opInp) {
      opInp.value = isAudited
        ? `${this.extractedYearsData.auditor_opinion} - ${this.extractedYearsData.auditor_kap_name}`
        : 'Laporan Keuangan In-House / Intern Manajemen';
    }

    // Populate Form Fields
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = Math.round(val || 0);
    };

    setVal('bal-cash', d.cash);
    setVal('bal-receivable', d.ar);
    setVal('bal-inventory', d.inv);
    setVal('bal-other-ca', (d.otherCa || 0) + (d.otherAr || 0) + (d.prepaid || 0));

    setVal('bal-fixed-assets', (d.fa || 0) + (d.invest || 0) + (d.taxAsset || 0));
    setVal('bal-depreciation', Math.abs(d.depr || 0));

    setVal('bal-current-liab', (d.ap || 0) + (d.stDebt || 0) + (d.otherAp || 0) + (d.accrued || 0));
    setVal('bal-long-liab', d.ltDebt);
    setVal('bal-capital', (d.capital || 0) + (d.otherCap || 0));
    setVal('bal-retained', (d.retEarn || 0) + (d.re || 0));

    setVal('inc-revenue', d.rev);
    setVal('inc-cogs', d.cogs);
    setVal('inc-opex', (d.opex || 0) + (d.otherExp || 0) - (d.otherInc || 0));
    setVal('inc-net-profit', d.re);

    // Update toggle buttons styling
    const btn2 = document.getElementById('btn-toggle-yr2');
    const btn1 = document.getElementById('btn-toggle-yr1');
    const activeLabel = document.getElementById('pelaku-active-period-label');

    if (btn2 && btn1) {
      if (isYear2) {
        btn2.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-purple-600 text-white shadow-sm';
        btn1.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition text-slate-600 hover:text-purple-600';
      } else {
        btn1.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition bg-purple-600 text-white shadow-sm';
        btn2.className = 'px-3 py-1.5 rounded-lg text-xs font-bold transition text-slate-600 hover:text-purple-600';
      }
    }

    if (activeLabel) {
      activeLabel.textContent = `Data Aktif: Tahun Buku ${yearVal}`;
    }

    // Recalculate Ratios & Assessment
    this.calculateRatios();
  },

  updateOcrBannerUI() {
    const banner = document.getElementById('pelaku-ocr-banner');
    if (!banner || !this.extractedYearsData) return;

    banner.classList.remove('hidden');

    const compEl = document.getElementById('ocr-banner-company');
    const auditEl = document.getElementById('ocr-banner-audit-badge');
    const subEl = document.getElementById('ocr-banner-sub');
    const btn2 = document.getElementById('btn-toggle-yr2');
    const btn1 = document.getElementById('btn-toggle-yr1');

    if (compEl) compEl.textContent = this.extractedYearsData.company_name || 'Rekanan Penjaminan';
    if (auditEl) {
      const isAudited = this.extractedYearsData.audit_status === 'audited';
      auditEl.textContent = isAudited ? `Audited (${this.extractedYearsData.auditor_kap_name})` : 'In-House / Unaudited';
      auditEl.className = `px-2 py-0.5 rounded text-[10px] font-bold ${isAudited ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`;
    }
    if (btn2) btn2.textContent = `Tahun Terakhir (${this.extractedYearsData.year2})`;
    if (btn1) btn1.textContent = `Tahun Sebelumnya (${this.extractedYearsData.year1})`;

    if (subEl) {
      subEl.innerHTML = `Perusahaan: <strong>${this.extractedYearsData.company_name || 'Terdeteksi'}</strong> &bull; Tersedia Data Perbandingan Tahun ${this.extractedYearsData.year1} & ${this.extractedYearsData.year2}.`;
    }
  },

  printAnalysis() {
    if (!this.currentAnalysis) this.calculateRatios();
    const c = this.currentAnalysis;

    const modal = document.getElementById('pelaku-modal-container');
    if (!modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto printable-document">
          <!-- Kop -->
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div class="flex items-center gap-3">
              <img src="assets/images/logo-corporate.png" alt="Askrindo Logo" class="h-12 object-contain" />
              <div>
                <h2 class="text-sm font-extrabold text-[#002B49]">PT ASURANSI KREDIT INDONESIA</h2>
                <p class="text-[10px] text-slate-500">Lembar Evaluasi Rasio & Laporan Keuangan Underwriting</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-purple-600">MODUL PELAKU</span>
              <p class="text-[10px] text-slate-400">Tanggal: ${new Date().toLocaleDateString('id-ID')}</p>
            </div>
          </div>

          <div class="space-y-4 text-xs text-slate-700">
            <div class="p-4 rounded-xl bg-slate-50 space-y-1">
              <h3 class="font-bold text-slate-900 text-sm">${c.company}</h3>
              <p class="text-slate-500">Periode Evaluasi: ${c.year} | Hasil Scoring: <b>${c.score.toFixed(1)}/100 (${c.grade})</b></p>
            </div>

            <table class="w-full text-xs border border-slate-200">
              <tr class="bg-slate-100 font-bold"><th class="p-2 text-left">Indikator Rasio</th><th class="p-2 text-right">Hasil Analisis</th><th class="p-2 text-left">Parameter Acuan</th></tr>
              <tr class="border-b"><td class="p-2">Current Ratio (Likuiditas)</td><td class="p-2 text-right font-mono font-bold">${c.currentRatio.toFixed(2)}%</td><td class="p-2 text-slate-500">&ge; 120% (Aman)</td></tr>
              <tr class="border-b"><td class="p-2">Quick Ratio (Acid Test)</td><td class="p-2 text-right font-mono font-bold">${c.quickRatio.toFixed(2)}%</td><td class="p-2 text-slate-500">&ge; 100% (Aman)</td></tr>
              <tr class="border-b"><td class="p-2">Debt to Equity Ratio (DER)</td><td class="p-2 text-right font-mono font-bold">${c.der.toFixed(2)}x</td><td class="p-2 text-slate-500">&lt; 2.50x (Toleransi Maksimal)</td></tr>
              <tr class="border-b"><td class="p-2">Net Profit Margin (NPM)</td><td class="p-2 text-right font-mono font-bold">${c.npm.toFixed(2)}%</td><td class="p-2 text-slate-500">Margin Laba Positif</td></tr>
              <tr><td class="p-2">Return on Equity (ROE)</td><td class="p-2 text-right font-mono font-bold">${c.roe.toFixed(2)}%</td><td class="p-2 text-slate-500">Efisiensi Modal</td></tr>
            </table>

            <div class="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-1">
              <span class="font-bold text-purple-900 block uppercase tracking-wider text-[10px]">Kesimpulan & Rekomendasi Underwriting:</span>
              <p class="text-slate-700 leading-relaxed">${c.narrative}</p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 no-print">
            <button onclick="document.getElementById('pelaku-modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition text-xs">
              Tutup
            </button>
            <button onclick="window.print()" class="px-5 py-2 rounded-xl text-white font-semibold bg-purple-600 hover:bg-purple-700 transition text-xs flex items-center gap-1.5 shadow-md">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Cetak Hasil Evaluasi PDF</span>
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }
};
