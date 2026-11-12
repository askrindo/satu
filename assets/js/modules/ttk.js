/**
 * Askrindo SATU - TTK Module (Tanya-Tanya KUR)
 * Interactive KUR installment calculator, debtor eligibility checker, and smart knowledge base.
 */

window.TtkModule = {
  currentTab: 'calc', // 'calc' | 'eligibility' | 'faq'

  render() {
    const user = window.authService.getCurrentUser();
    if (!user || !window.authService.hasAccess('ttk')) {
      return window.askrindoApp.renderUnauthorized('TTK');
    }

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Module Header -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-blue-600">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <i data-lucide="help-circle" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-black text-slate-800 tracking-tight">TTK</h1>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Tanya-Tanya KUR
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Pusat simulasi angsuran Kredit Usaha Rakyat (KUR), cek kelayakan debitur, dan basis pengetahuan penjaminan Askrindo.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.TtkModule.setTab('calc')" class="px-3.5 py-2 rounded-xl text-xs font-semibold transition ${this.currentTab === 'calc' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
              Kalkulator KUR
            </button>
            <button onclick="window.TtkModule.setTab('eligibility')" class="px-3.5 py-2 rounded-xl text-xs font-semibold transition ${this.currentTab === 'eligibility' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
              Cek Kelayakan Debitur
            </button>
            <button onclick="window.TtkModule.setTab('faq')" class="px-3.5 py-2 rounded-xl text-xs font-semibold transition ${this.currentTab === 'faq' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
              Tanya Askrindo KUR
            </button>
          </div>
        </div>

        <!-- Tab Body -->
        <div>
          ${this.currentTab === 'calc' ? this.renderCalculatorTab() : ''}
          ${this.currentTab === 'eligibility' ? this.renderEligibilityTab() : ''}
          ${this.currentTab === 'faq' ? this.renderFaqTab() : ''}
        </div>
      </div>
    `;
  },

  setTab(tab) {
    this.currentTab = tab;
    window.askrindoApp.renderCurrentRoute();
  },

  // --- TAB 1: KALKULATOR KUR ---
  renderCalculatorTab() {
    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Input Form (6 cols) -->
        <div class="lg:col-span-6 space-y-6">
          <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
              <i data-lucide="sliders" class="w-4 h-4 text-blue-600"></i>
              <span>Parameter Simulasi Penjaminan KUR</span>
            </h3>

            <!-- Skema KUR -->
            <div class="space-y-2 text-xs">
              <label class="block font-semibold text-slate-700">Skema Kredit Usaha Rakyat (KUR)</label>
              <div class="grid grid-cols-3 gap-2">
                <button type="button" onclick="window.TtkModule.setScheme('super_mikro')" id="scheme-super-btn" class="p-3 rounded-xl border border-blue-500 bg-blue-50/50 text-blue-900 font-bold text-center transition">
                  <span class="block text-xs">Super Mikro</span>
                  <span class="text-[10px] text-blue-600 font-normal">s.d 10 Juta (3%)</span>
                </button>
                <button type="button" onclick="window.TtkModule.setScheme('mikro')" id="scheme-mikro-btn" class="p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-center transition hover:border-slate-300">
                  <span class="block text-xs">KUR Mikro</span>
                  <span class="text-[10px] text-slate-400 font-normal">10 - 100 Jt (6%)</span>
                </button>
                <button type="button" onclick="window.TtkModule.setScheme('kecil')" id="scheme-kecil-btn" class="p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-center transition hover:border-slate-300">
                  <span class="block text-xs">KUR Kecil</span>
                  <span class="text-[10px] text-slate-400 font-normal">100 - 500 Jt (6%)</span>
                </button>
              </div>
            </div>

            <!-- Plafond Input & Slider -->
            <div class="space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <label class="font-semibold text-slate-700">Plafon Pinjaman</label>
                <span id="ttk-plafon-text" class="font-mono font-bold text-blue-600 text-sm">Rp 10.000.000</span>
              </div>
              <input 
                type="range" 
                id="ttk-plafon-range" 
                min="1000000" 
                max="10000000" 
                step="500000" 
                value="10000000"
                oninput="window.TtkModule.handlePlafonChange(this.value)"
                class="w-full accent-blue-600 cursor-pointer"
              />
              <div class="flex justify-between text-[10px] text-slate-400">
                <span id="range-min-label">Rp 1.000.000</span>
                <span id="range-max-label">Rp 10.000.000</span>
              </div>
            </div>

            <!-- Tenor & Keperluan -->
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Jangka Waktu (Tenor)</label>
                <select id="ttk-tenor" onchange="window.TtkModule.calcInstallment()" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white">
                  <option value="6">6 Bulan</option>
                  <option value="12" selected>12 Bulan (1 Tahun)</option>
                  <option value="18">18 Bulan</option>
                  <option value="24">24 Bulan (2 Tahun)</option>
                  <option value="36">36 Bulan (3 Tahun)</option>
                  <option value="48">48 Bulan (4 Tahun)</option>
                  <option value="60">60 Bulan (5 Tahun - Khusus KI)</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Jenis Keperluan Kredit</label>
                <select id="ttk-purpose" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white">
                  <option value="KMK">Kredit Modal Kerja (KMK)</option>
                  <option value="KI">Kredit Investasi (KI)</option>
                </select>
              </div>
            </div>

            <!-- Bank Penyalur KUR -->
            <div class="text-xs">
              <label class="block font-semibold text-slate-700 mb-1">Bank Mitra Penyalur KUR</label>
              <select id="ttk-bank" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 bg-white">
                <option value="BRI">PT Bank Rakyat Indonesia (Persero) Tbk</option>
                <option value="Mandiri">PT Bank Mandiri (Persero) Tbk</option>
                <option value="BNI">PT Bank Negara Indonesia (Persero) Tbk</option>
                <option value="BSI">PT Bank Syariah Indonesia Tbk (KUR Syariah)</option>
                <option value="BPD">Bank Pembangunan Daerah (BPD Mitra)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Output Result & Summary (6 cols) -->
        <div class="lg:col-span-6 space-y-6">
          <div class="bg-white rounded-3xl p-6 border-2 border-blue-500/20 shadow-xl space-y-6">
            <div class="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600">Simulasi Angsuran & Penjaminan</span>
                <h3 class="text-lg font-black text-slate-800">Estimasi Kewajiban Bulanan</h3>
              </div>
              <div class="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Suku Bunga: <span id="ttk-rate-label">3.00%</span>
              </div>
            </div>

            <!-- Big Monthly Installment Card -->
            <div class="p-5 rounded-2xl bg-gradient-to-br from-[#002B49] via-blue-900 to-[#0A3D62] text-white shadow-lg space-y-1">
              <span class="text-[11px] font-medium text-cyan-300 uppercase tracking-wider">Total Angsuran Per Bulan</span>
              <div id="ttk-monthly-install" class="text-3xl font-black font-mono tracking-tight text-white">
                Rp 858.333
              </div>
              <p class="text-[10px] text-slate-300">Terdiri dari angsuran pokok dan bunga flat/efektif bersubsidi.</p>
            </div>

            <!-- Rincian -->
            <div class="space-y-3 text-xs">
              <div class="flex items-center justify-between py-1 border-b border-slate-100">
                <span class="text-slate-500">Angsuran Pokok / Bulan:</span>
                <span id="ttk-res-pokok" class="font-mono font-bold text-slate-800">Rp 833.333</span>
              </div>
              <div class="flex items-center justify-between py-1 border-b border-slate-100">
                <span class="text-slate-500">Angsuran Bunga Debitur / Bulan:</span>
                <span id="ttk-res-bunga" class="font-mono font-bold text-blue-600">Rp 25.000</span>
              </div>
              <div class="flex items-center justify-between py-1 border-b border-slate-100">
                <span class="text-slate-500">Total Bunga Selama Tenor:</span>
                <span id="ttk-res-total-bunga" class="font-mono font-semibold text-slate-800">Rp 300.000</span>
              </div>
              <div class="flex items-center justify-between py-1 border-b border-slate-100">
                <span class="text-slate-500">Estimasi Subsidi Bunga Pemerintah (10%):</span>
                <span id="ttk-res-subsidi" class="font-mono font-semibold text-emerald-600">Rp 1.000.000</span>
              </div>
              <div class="flex items-center justify-between py-1 border-b border-slate-100">
                <span class="text-slate-500">Estimasi IJP (Imbal Jasa Penjaminan Askrindo):</span>
                <span id="ttk-res-ijp" class="font-mono font-bold text-amber-600">Rp 175.000</span>
              </div>
            </div>

            <button onclick="window.TtkModule.showAmortizationTable()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition">
              <i data-lucide="table" class="w-4 h-4"></i>
              <span>Lihat Rincian Jadwal Angsuran (Tabel Amortisasi)</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Amortization Modal Container -->
      <div id="ttk-amort-modal-container"></div>
    `;
  },

  // State for scheme
  activeScheme: 'super_mikro',

  setScheme(scheme) {
    this.activeScheme = scheme;
    const btnSuper = document.getElementById('scheme-super-btn');
    const btnMikro = document.getElementById('scheme-mikro-btn');
    const btnKecil = document.getElementById('scheme-kecil-btn');
    const range = document.getElementById('ttk-plafon-range');
    const minLabel = document.getElementById('range-min-label');
    const maxLabel = document.getElementById('range-max-label');
    const rateLabel = document.getElementById('ttk-rate-label');

    // Reset styles
    [btnSuper, btnMikro, btnKecil].forEach(btn => {
      btn.className = 'p-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-center transition hover:border-slate-300';
    });

    if (scheme === 'super_mikro') {
      btnSuper.className = 'p-3 rounded-xl border border-blue-500 bg-blue-50/50 text-blue-900 font-bold text-center transition';
      range.min = 1000000;
      range.max = 10000000;
      range.step = 500000;
      range.value = 10000000;
      minLabel.innerText = 'Rp 1.000.000';
      maxLabel.innerText = 'Rp 10.000.000';
      rateLabel.innerText = '3.00%';
    } else if (scheme === 'mikro') {
      btnMikro.className = 'p-3 rounded-xl border border-blue-500 bg-blue-50/50 text-blue-900 font-bold text-center transition';
      range.min = 10000000;
      range.max = 100000000;
      range.step = 5000000;
      range.value = 50000000;
      minLabel.innerText = 'Rp 10.000.000';
      maxLabel.innerText = 'Rp 100.000.000';
      rateLabel.innerText = '6.00%';
    } else if (scheme === 'kecil') {
      btnKecil.className = 'p-3 rounded-xl border border-blue-500 bg-blue-50/50 text-blue-900 font-bold text-center transition';
      range.min = 100000000;
      range.max = 500000000;
      range.step = 10000000;
      range.value = 250000000;
      minLabel.innerText = 'Rp 100.000.000';
      maxLabel.innerText = 'Rp 500.000.000';
      rateLabel.innerText = '6.00%';
    }

    this.handlePlafonChange(range.value);
  },

  handlePlafonChange(val) {
    const textEl = document.getElementById('ttk-plafon-text');
    if (textEl) {
      textEl.innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    }
    this.calcInstallment();
  },

  calcInstallment() {
    const plafon = parseFloat(document.getElementById('ttk-plafon-range')?.value || '10000000');
    const tenor = parseInt(document.getElementById('ttk-tenor')?.value || '12', 10);
    const annualRate = this.activeScheme === 'super_mikro' ? 0.03 : 0.06;

    // Monthly interest & principal
    const pokokPerBulan = plafon / tenor;
    const bungaPerBulan = (plafon * annualRate) / 12;
    const totalInstallment = pokokPerBulan + bungaPerBulan;
    const totalBunga = bungaPerBulan * tenor;
    const totalSubsidi = (plafon * 0.10) * (tenor / 12);
    const ijpAskrindo = plafon * 0.0175 * (tenor / 12);

    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    const elMonth = document.getElementById('ttk-monthly-install');
    const elPokok = document.getElementById('ttk-res-pokok');
    const elBunga = document.getElementById('ttk-res-bunga');
    const elTotalBunga = document.getElementById('ttk-res-total-bunga');
    const elSubsidi = document.getElementById('ttk-res-subsidi');
    const elIjp = document.getElementById('ttk-res-ijp');

    if (elMonth) elMonth.innerText = fmt(totalInstallment);
    if (elPokok) elPokok.innerText = fmt(pokokPerBulan);
    if (elBunga) elBunga.innerText = fmt(bungaPerBulan);
    if (elTotalBunga) elTotalBunga.innerText = fmt(totalBunga);
    if (elSubsidi) elSubsidi.innerText = fmt(totalSubsidi);
    if (elIjp) elIjp.innerText = fmt(ijpAskrindo);

    this.lastCalculation = { plafon, tenor, annualRate, pokokPerBulan, bungaPerBulan, totalInstallment };
  },

  showAmortizationTable() {
    if (!this.lastCalculation) this.calcInstallment();
    const c = this.lastCalculation;
    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    let rows = '';
    let sisaPokok = c.plafon;
    for (let i = 1; i <= c.tenor; i++) {
      sisaPokok -= c.pokokPerBulan;
      if (sisaPokok < 0) sisaPokok = 0;
      rows += `
        <tr class="hover:bg-slate-50 border-b border-slate-100">
          <td class="py-2 px-3 font-semibold text-slate-700 text-center">Bulan ${i}</td>
          <td class="py-2 px-3 font-mono text-slate-800 text-right">${fmt(c.pokokPerBulan)}</td>
          <td class="py-2 px-3 font-mono text-blue-600 text-right">${fmt(c.bungaPerBulan)}</td>
          <td class="py-2 px-3 font-mono font-bold text-slate-900 text-right">${fmt(c.totalInstallment)}</td>
          <td class="py-2 px-3 font-mono text-slate-500 text-right">${fmt(sisaPokok)}</td>
        </tr>
      `;
    }

    const modal = document.getElementById('ttk-amort-modal-container');
    if (!modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 class="text-base font-bold text-slate-800">Tabel Jadwal Angsuran KUR (Amortisasi)</h3>
              <p class="text-xs text-slate-500">Plafon: ${fmt(c.plafon)} | Tenor: ${c.tenor} Bulan</p>
            </div>
            <button onclick="document.getElementById('ttk-amort-modal-container').innerHTML=''" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="overflow-x-auto rounded-xl border border-slate-200">
            <table class="w-full text-xs">
              <thead class="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th class="py-2 px-3 text-center">Periode</th>
                  <th class="py-2 px-3 text-right">Angsuran Pokok</th>
                  <th class="py-2 px-3 text-right">Bunga Subsidi</th>
                  <th class="py-2 px-3 text-right">Total Angsuran</th>
                  <th class="py-2 px-3 text-right">Sisa Pokok</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </div>

          <div class="flex justify-end pt-2">
            <button onclick="document.getElementById('ttk-amort-modal-container').innerHTML=''" class="px-5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition">
              Tutup
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  // --- TAB 2: ELIGIBILITY CHECKER ---
  renderEligibilityTab() {
    return `
      <div class="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div class="border-b border-slate-100 pb-4">
          <span class="text-[10px] font-bold uppercase tracking-wider text-blue-600">Underwriting Assessment</span>
          <h2 class="text-xl font-black text-slate-800">Pengecekan Kelayakan Debitur KUR</h2>
          <p class="text-xs text-slate-500 mt-1">
            Gunakan panduan 5 parameter kelayakan sesuai Permenko Perekonomian untuk menilai apakah calon debitur memenuhi kriteria penjaminan kredit Askrindo.
          </p>
        </div>

        <form onsubmit="window.TtkModule.checkDebtorEligibility(event)" class="space-y-4 text-xs">
          <!-- Parameter 1: Usia Usaha -->
          <div class="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50">
            <label class="block font-bold text-slate-800">1. Lama Usaha Aktif Berjalan</label>
            <div class="space-y-1.5">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="param_usaha" value="10" checked class="text-blue-600" />
                <span>Usaha telah berjalan aktif minimal 6 (enam) bulan secara berkelanjutan</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="param_usaha" value="5" class="text-blue-600" />
                <span>Usaha kurang dari 6 bulan, namun telah mengikuti pelatihan kewirausahaan resmi / memiliki pendampingan UMKM (Syarat Khusus Super Mikro)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="param_usaha" value="0" class="text-blue-600" />
                <span>Usaha baru / belum berjalan</span>
              </label>
            </div>
          </div>

          <!-- Parameter 2: SLIK OJK -->
          <div class="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50">
            <label class="block font-bold text-slate-800">2. Riwayat Kolektibilitas SLIK OJK (BI Checking)</label>
            <div class="space-y-1.5">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="param_slik" value="10" checked class="text-blue-600" />
                <span>Kolektibilitas 1 (Lancar) pada seluruh fasilitas kredit perbankan / lembaga keuangan</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="param_slik" value="5" class="text-blue-600" />
                <span>Pernah menunggak (Kol 2), namun saat ini telah lunas dan memiliki Surat Keterangan Lunas (SKL) resmi</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="param_slik" value="0" class="text-blue-600" />
                <span>Sedang tercatat macet (Kolektibilitas 3, 4, atau 5)</span>
              </label>
            </div>
          </div>

          <!-- Parameter 3: Kredit Produktif Lain -->
          <div class="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50">
            <label class="block font-bold text-slate-800">3. Kepemilikan Fasilitas Kredit Komersial Produktif</label>
            <div class="space-y-1.5">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="param_kredit" value="10" checked class="text-blue-600" />
                <span>Tidak sedang menerima kredit modal kerja / investasi komersial di bank lain (Hanya memiliki kredit konsumtif seperti KPR/KKB yang lancar)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="param_kredit" value="0" class="text-blue-600" />
                <span>Sedang aktif menikmati fasilitas kredit modal kerja komersial di bank lain</span>
              </label>
            </div>
          </div>

          <!-- Parameter 4: Legalitas Usaha -->
          <div class="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/50">
            <label class="block font-bold text-slate-800">4. Legalitas & Izin Usaha</label>
            <div class="space-y-1.5">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="param_legalitas" value="10" checked class="text-blue-600" />
                <span>Memiliki Nomor Induk Berusaha (NIB) berbasis risiko dari OSS atau Surat Keterangan Usaha (SKU) dari Kelurahan/Desa</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="param_legalitas" value="0" class="text-blue-600" />
                <span>Tidak memiliki surat izin usaha maupun keterangan domisili usaha</span>
              </label>
            </div>
          </div>

          <div class="pt-2">
            <button type="submit" class="w-full py-3 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md transition">
              Analisis Kelayakan Debitur Sekarang
            </button>
          </div>
        </form>

        <!-- Eligibility Result Box -->
        <div id="eligibility-result-box" class="hidden"></div>
      </div>
    `;
  },

  checkDebtorEligibility(e) {
    e.preventDefault();
    const p1 = parseInt(document.querySelector('input[name="param_usaha"]:checked').value, 10);
    const p2 = parseInt(document.querySelector('input[name="param_slik"]:checked').value, 10);
    const p3 = parseInt(document.querySelector('input[name="param_kredit"]:checked').value, 10);
    const p4 = parseInt(document.querySelector('input[name="param_legalitas"]:checked').value, 10);

    const totalScore = p1 + p2 + p3 + p4;
    const box = document.getElementById('eligibility-result-box');
    box.classList.remove('hidden');

    let badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    let statusTitle = 'SANGAT LAYAK (DIREKOMENDASIKAN PENJAMINAN)';
    let recommendation = 'Calon debitur memenuhi seluruh kriteria operasional Permenko dan underwriting Askrindo. Dapat langsung diproses penjaminan otomatis melalui bank mitra.';

    if (p2 === 0 || p3 === 0 || p4 === 0) {
      badgeClass = 'bg-rose-50 text-rose-800 border-rose-200';
      statusTitle = 'TIDAK LAYAK / DITOLAK';
      recommendation = 'Calon debitur terhalang oleh regulasi KUR (catatan macet di SLIK / sedang memiliki pinjaman produktif komersial / tidak memiliki izin usaha). Tidak dapat diberikan penjaminan KUR.';
    } else if (totalScore < 35) {
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
      statusTitle = 'LAYAK BERSYARAT';
      recommendation = 'Calon debitur dapat dipertimbangkan untuk skema KUR Super Mikro dengan pendampingan, atau melengkapi dokumen SKL lunas terlebih dahulu.';
    }

    box.innerHTML = `
      <div class="p-6 rounded-2xl border ${badgeClass} space-y-3 animate-fadeIn">
        <div class="flex items-center justify-between">
          <span class="text-xs font-black uppercase tracking-wider">Hasil Uji Kelayakan</span>
          <span class="text-xs font-mono font-bold">Skor: ${totalScore} / 40</span>
        </div>
        <h3 class="text-base font-extrabold">${statusTitle}</h3>
        <p class="text-xs leading-relaxed opacity-90">${recommendation}</p>
      </div>
    `;
  },

  // --- TAB 3: SMART FAQ ---
  renderFaqTab() {
    const faqs = [
      {
        q: 'Apakah nasabah yang memiliki KPR (Kredit Pemilikan Rumah) boleh mengajukan KUR?',
        a: 'Boleh! Sesuai Permenko Perekonomian No. 1 Tahun 2023, calon debitur KUR diperbolehkan sedang menerima kredit konsumtif seperti KPR, KKB (Kendaraan Bermotor), Kartu Kredit, atau kredit pensiun, asalkan riwayat pembayarannya berstatus lancar (Kol 1).'
      },
      {
        q: 'Berapa batas plafon pinjaman KUR tanpa memerlukan agunan tambahan fisik?',
        a: 'Plafon KUR s.d Rp 100.000.000 (KUR Super Mikro dan KUR Mikro) TIDAK DIKENAKAN AGUNAN TAMBAHAN (tanpa sertifikat/BPKB). Agunan utamanya adalah kelayakan usaha itu sendiri. Agunan tambahan hanya dapat dimintakan untuk KUR Kecil (di atas Rp 100 juta s.d 500 juta).'
      },
      {
        q: 'Bagaimana ketentuan suku bunga berjenjang untuk KUR Mikro?',
        a: 'Penyaluran KUR Mikro pertama kali dikenakan suku bunga 6% efektif per tahun. Jika nasabah melakukan suplesi (penambahan plafon) atau meminjam kedua kalinya, suku bunga menjadi 7%, pinjaman ketiga 8%, dan pinjaman keempat 9% per tahun.'
      },
      {
        q: 'Kapan bank mitra dapat mengajukan klaim penjaminan KUR ke Askrindo?',
        a: 'Bank penyalur dapat mengajukan klaim penjaminan setelah debitur menunggak dan kredit digolongkan macet (Kolektibilitas 5), serta bank telah melakukan upaya penagihan (Restrukturisasi/SP 1 s.d SP 3) sesuai ketentuan perjanjian kerja sama (PKS) penjaminan.'
      }
    ];

    return `
      <div class="max-w-3xl mx-auto space-y-6">
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <h3 class="text-base font-bold text-slate-800 flex items-center gap-2">
            <i data-lucide="book-open" class="w-5 h-5 text-blue-600"></i>
            <span>Pusat Informasi & Aturan Operasional KUR Askrindo</span>
          </h3>
          <p class="text-xs text-slate-500">
            Pertanyaan dan jawaban penting mengenai pedoman teknis penjaminan Kredit Usaha Rakyat di cabang Askrindo.
          </p>
        </div>

        <div class="space-y-3">
          ${faqs.map((f, idx) => `
            <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
              <h4 class="text-xs font-bold text-slate-800 flex items-start gap-2">
                <span class="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-[11px] font-bold">${idx + 1}</span>
                <span>${f.q}</span>
              </h4>
              <p class="text-xs text-slate-600 pl-7 leading-relaxed">${f.a}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
};
