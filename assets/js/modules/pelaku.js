/**
 * Askrindo SATU - PELAKU Module (Perhitungan Laporan Keuangan)
 * Financial Statement & Ratio Analysis Engine for Underwriting, Surety, and Credit Assessment.
 */

window.PelakuModule = {
  currentAnalysis: null,

  render() {
    const user = window.authService.getCurrentUser();
    if (!user || !window.authService.hasAccess('pelaku')) {
      return window.askrindoApp.renderUnauthorized('PELAKU');
    }

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Module Header -->
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
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Analisis rasio finansial (Likuiditas, Solvabilitas DER/DAR, Profitabilitas ROA/ROE) & scoring otomatis kelayakan penjaminan.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.PelakuModule.loadSampleData()" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition">
              Muat Contoh Rekanan Konstruksi
            </button>
            <button onclick="window.PelakuModule.resetForm()" class="px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition">
              Reset Form
            </button>
          </div>
        </div>

        <!-- Input & Ratio Dashboard Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left Column: Inputs (7 cols) -->
          <div class="lg:col-span-7 space-y-6">
            <!-- Profil Entitas -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                <i data-lucide="building" class="w-4 h-4 text-purple-600"></i>
                <span>1. Profil Calon Debitur / Rekanan Penjaminan</span>
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Rekanan</label>
                  <input type="text" id="pelaku-company" value="PT Graha Cipta Konstruksi" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500" />
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
                  <input type="text" id="pelaku-year" value="Tahun Buku 2025 (Audited)" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Opini Auditor (Jika Ada)</label>
                  <input type="text" id="pelaku-opinion" value="Wajar Tanpa Pengecualian (WTP)" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-purple-500" />
                </div>
              </div>
            </div>

            <!-- Komponen Neraca -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                <i data-lucide="scale" class="w-4 h-4 text-purple-600"></i>
                <span>2. Pos Neraca Keuangan (Balance Sheet)</span>
              </h3>

              <div class="space-y-4 text-xs">
                <!-- Aset Lancar -->
                <div class="p-4 rounded-xl bg-purple-50/40 border border-purple-100 space-y-3">
                  <span class="font-bold text-purple-900 block text-xs uppercase tracking-wide">Aset Lancar (Current Assets)</span>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-slate-600 mb-1">Kas & Setara Kas</label>
                      <input type="number" id="bal-cash" value="1200000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs" />
                    </div>
                    <div>
                      <label class="block text-slate-600 mb-1">Piutang Usaha</label>
                      <input type="number" id="bal-receivable" value="3800000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs" />
                    </div>
                    <div>
                      <label class="block text-slate-600 mb-1">Persediaan Barang</label>
                      <input type="number" id="bal-inventory" value="1500000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs" />
                    </div>
                    <div>
                      <label class="block text-slate-600 mb-1">Aset Lancar Lainnya</label>
                      <input type="number" id="bal-other-ca" value="500000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs" />
                    </div>
                  </div>
                </div>

                <!-- Aset Tetap & Non-Lancar -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Aset Tetap & Peralatan</label>
                    <input type="number" id="bal-fixed-assets" value="4500000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs" />
                  </div>
                  <div>
                    <label class="block font-semibold text-slate-700 mb-1">Akumulasi Penyusutan (-)</label>
                    <input type="number" id="bal-depreciation" value="800000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs" />
                  </div>
                </div>

                <!-- Kewajiban Lancar & Panjang -->
                <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                  <span class="font-bold text-slate-800 block text-xs uppercase tracking-wide">Kewajiban & Ekuitas (Liabilities & Equity)</span>
                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-slate-600 mb-1">Hutang Usaha / Lancar</label>
                      <input type="number" id="bal-current-liab" value="3200000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs" />
                    </div>
                    <div>
                      <label class="block text-slate-600 mb-1">Hutang Bank Jangka Panjang</label>
                      <input type="number" id="bal-long-liab" value="2100000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs" />
                    </div>
                    <div>
                      <label class="block text-slate-600 mb-1">Modal Disetor & Saham</label>
                      <input type="number" id="bal-capital" value="3000000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs" />
                    </div>
                    <div>
                      <label class="block text-slate-600 mb-1">Laba Ditahan / Saldo Laba</label>
                      <input type="number" id="bal-retained" value="2400000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-xs" />
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
                  <input type="number" id="inc-cogs" value="14200000000" oninput="window.PelakuModule.calculateRatios()" class="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs" />
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
                    <span class="block text-[10px] text-slate-400">Standar aman: ≥ 120%</span>
                  </div>
                  <span id="ratio-cr" class="font-mono font-bold text-emerald-600 text-sm">218.75%</span>
                </div>

                <div class="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <div>
                    <span class="font-semibold text-slate-700">Quick Ratio (Acid Test)</span>
                    <span class="block text-[10px] text-slate-400">Standar aman: ≥ 100%</span>
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
                  <span id="ratio-roe" class="font-mono font-bold text-blue-600 text-sm">30.56%</span>
                </div>
              </div>

              <!-- Rekomendasi Naratif Underwriting -->
              <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <span class="font-bold text-slate-800 block uppercase tracking-wider text-[10px]">Rekomendasi Underwriter:</span>
                <p id="pelaku-narrative" class="text-slate-600 leading-relaxed text-[11px]">
                  Berdasarkan analisis rasio, rekanan memenuhi kriteria penjaminan Surety Bond dan Asuransi Proyek tanpa memerlukan jaminan tambahan (collateral). Kapasitas penjaminan maksimum direkomendasikan hingga Rp 15 Miliar.
                </p>
              </div>

              <!-- Export Button -->
              <button onclick="window.PelakuModule.printAnalysis()" class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-700 shadow-md transition">
                <i data-lucide="printer" class="w-4 h-4"></i>
                <span>Cetak Lembar Analisis Finansial (PDF)</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Print Modal Container -->
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
    window.askrindoApp.showToast('Data PT Wijaya Karya Pradana berhasil dimuat!', 'info');
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
              <tr class="border-b"><td class="p-2">Current Ratio (Likuiditas)</td><td class="p-2 text-right font-mono font-bold">${c.currentRatio.toFixed(2)}%</td><td class="p-2 text-slate-500">≥ 120% (Aman)</td></tr>
              <tr class="border-b"><td class="p-2">Quick Ratio (Acid Test)</td><td class="p-2 text-right font-mono font-bold">${c.quickRatio.toFixed(2)}%</td><td class="p-2 text-slate-500">≥ 100% (Aman)</td></tr>
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
