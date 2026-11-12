/**
 * Askrindo SATU - KABAR Module (Kalkulator Asuransi Kebakaran)
 * Fire Insurance Premium Calculator compliant with OJK Regulation SEOJK 6/2017.
 */

window.KabarModule = {
  // Predefined OJK tariff rates per mil (‰) based on Occupation and Construction Class
  TARIFF_RATES: {
    // 2976 Rumah Tinggal
    residential: { name: 'Rumah Tinggal (Kode 2976)', class1: 0.294, class2: 0.353, class3: 0.470 },
    // 2938 Toko / Ruko
    shophouse: { name: 'Ruko / Toko Bahan Bukan Berbahaya (Kode 2938)', class1: 0.540, class2: 0.675, class3: 0.945 },
    // 2935 Perkantoran
    office: { name: 'Gedung Perkantoran / Institusi (Kode 2935)', class1: 0.380, class2: 0.475, class3: 0.665 },
    // 2940 Hotel & Penginapan
    hotel: { name: 'Hotel & Apartemen Komersial (Kode 2940)', class1: 0.480, class2: 0.600, class3: 0.840 },
    // 2921 Gudang
    warehouse: { name: 'Gudang Barang Non-B3 (Kode 2921)', class1: 0.650, class2: 0.812, class3: 1.137 },
    // 2111 Pabrik Tekstil & Garmen
    textile: { name: 'Pabrik Tekstil, Garmen & Konveksi (Kode 2111)', class1: 1.450, class2: 1.812, class3: 2.537 },
    // 2937 Rumah Sakit
    hospital: { name: 'Rumah Sakit & Fasilitas Kesehatan (Kode 2937)', class1: 0.420, class2: 0.525, class3: 0.735 },
    // 2939 Restoran & Kafe
    restaurant: { name: 'Restoran / Rumah Makan / Kafe (Kode 2939)', class1: 0.850, class2: 1.062, class3: 1.487 }
  },

  // Extension perils rates per mil (‰)
  EXTENSION_RATES: {
    rsmdd: { name: 'RSMDCC 4.1A (Kerusuhan, Pemogokan & Huru-hara)', rate: 0.050, selected: true },
    ts: { name: 'Terorisme & Sabotase (TS Clause)', rate: 0.050, selected: false },
    tsfwd: { name: 'Banjir, Angin Topan & Kerusakan Air (TSFWD)', rate: 0.200, selected: true },
    eqvet: { name: 'Gempa Bumi, Letusan Gunung Api & Tsunami (EQVET Zona 3)', rate: 0.850, selected: true },
    aircraft: { name: 'Tertimpa Pesawat Terbang (Aircraft Damage)', rate: 0.010, selected: true },
    debris: { name: 'Biaya Pembersihan Puing (Removal of Debris 10% TSI)', rate: 0.020, selected: false }
  },

  currentCalc: null,

  render() {
    const user = window.authService.getCurrentUser();
    if (!user || !window.authService.hasAccess('kabar')) {
      return window.askrindoApp.renderUnauthorized('KABAR');
    }

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Module Header -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-orange-500">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <i data-lucide="flame" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-black text-slate-800 tracking-tight">KABAR</h1>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                  Kalkulator Asuransi Kebakaran
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Simulasi perhitungan premi asuransi kebakaran dan klausula perluasan jaminan sesuai regulasi OJK (SEOJK No. 6/SEOJK.05/2017).
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.KabarModule.loadSampleData()" class="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition">
              Muat Contoh Data
            </button>
            <button onclick="window.KabarModule.resetForm()" class="px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition">
              Reset Form
            </button>
          </div>
        </div>

        <!-- Main Form & Real-time Calculation Result -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Left Column: Input Form (7 cols) -->
          <div class="lg:col-span-7 space-y-6">
            <!-- Box 1: Parameter Okupasi & Konstruksi -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                <i data-lucide="building-2" class="w-4 h-4 text-orange-600"></i>
                <span>1. Parameter Okupasi & Konstruksi Objek</span>
              </h3>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Jenis Okupasi / Penggunaan</label>
                  <select id="kabar-okupasi" onchange="window.KabarModule.calculate()" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-white">
                    <option value="residential">Rumah Tinggal (Kode 2976)</option>
                    <option value="shophouse" selected>Ruko / Toko Bahan Bukan Berbahaya (Kode 2938)</option>
                    <option value="office">Gedung Perkantoran / Institusi (Kode 2935)</option>
                    <option value="hotel">Hotel & Apartemen Komersial (Kode 2940)</option>
                    <option value="warehouse">Gudang Barang Non-B3 (Kode 2921)</option>
                    <option value="textile">Pabrik Tekstil & Garmen (Kode 2111)</option>
                    <option value="hospital">Rumah Sakit & Faskes (Kode 2937)</option>
                    <option value="restaurant">Restoran / Rumah Makan (Kode 2939)</option>
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Kelas Konstruksi Bangunan</label>
                  <select id="kabar-konstruksi" onchange="window.KabarModule.calculate()" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-white">
                    <option value="class1" selected>Kelas 1 (Beton Bertulang & Dinding Bata)</option>
                    <option value="class2">Kelas 2 (Sebagian Rangka Kayu / Komposit)</option>
                    <option value="class3">Kelas 3 (Mayoritas Material Kayu / Semi Permanen)</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Jangka Waktu Pertanggungan</label>
                  <select id="kabar-period" onchange="window.KabarModule.calculate()" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-white">
                    <option value="1">1 Tahun (Standar 100%)</option>
                    <option value="2">2 Tahun (Multi-years 185%)</option>
                    <option value="3">3 Tahun (Multi-years 270%)</option>
                    <option value="5">5 Tahun (Multi-years 425%)</option>
                    <option value="0.5">6 Bulan (Short Period 70%)</option>
                  </select>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Lokasi Risiko / Wilayah Cabang</label>
                  <input type="text" id="kabar-location" value="Jl. MH Thamrin No. 28, Jakarta Pusat" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs" />
                </div>
              </div>
            </div>

            <!-- Box 2: Nilai Pertanggungan (TSI) -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <i data-lucide="calculator" class="w-4 h-4 text-orange-600"></i>
                  <span>2. Rincian Nilai Pertanggungan (Total Sum Insured - TSI)</span>
                </h3>
                <span class="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                  Satuan Rupiah (IDR)
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Bangunan Fisik</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-slate-400 font-semibold">Rp</span>
                    <input type="number" id="tsi-building" value="1500000000" oninput="window.KabarModule.calculate()" class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs font-mono font-medium" />
                  </div>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Mesin & Perlengkapan</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-slate-400 font-semibold">Rp</span>
                    <input type="number" id="tsi-machinery" value="300000000" oninput="window.KabarModule.calculate()" class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs font-mono font-medium" />
                  </div>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Stok & Persediaan Dagangan</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-slate-400 font-semibold">Rp</span>
                    <input type="number" id="tsi-stock" value="500000000" oninput="window.KabarModule.calculate()" class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs font-mono font-medium" />
                  </div>
                </div>

                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Perabot, Fixtures & Fitting</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2 text-slate-400 font-semibold">Rp</span>
                    <input type="number" id="tsi-furniture" value="100000000" oninput="window.KabarModule.calculate()" class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 text-xs font-mono font-medium" />
                  </div>
                </div>
              </div>

              <!-- Live Total TSI Pill -->
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <span class="text-xs font-bold text-slate-600 uppercase tracking-wide">Total Nilai Pertanggungan (TSI):</span>
                <span id="display-total-tsi" class="text-base font-extrabold text-slate-900 font-mono">Rp 2.400.000.000</span>
              </div>
            </div>

            <!-- Box 3: Perluasan Jaminan (Klausula Tambahan) -->
            <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <i data-lucide="shield-plus" class="w-4 h-4 text-orange-600"></i>
                  <span>3. Perluasan Jaminan (Endorsement Clauses)</span>
                </h3>
                <span class="text-[11px] text-slate-400">Pilih klausula tambahan yang dikehendaki</span>
              </div>

              <div class="space-y-2.5 text-xs">
                ${Object.entries(this.EXTENSION_RATES).map(([key, item]) => `
                  <label class="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-orange-50/50 hover:border-orange-200 transition cursor-pointer">
                    <div class="flex items-center gap-2.5">
                      <input 
                        type="checkbox" 
                        id="ext-${key}" 
                        ${item.selected ? 'checked' : ''} 
                        onchange="window.KabarModule.calculate()" 
                        class="w-4 h-4 text-orange-600 rounded border-slate-300"
                      />
                      <span class="font-semibold text-slate-700">${item.name}</span>
                    </div>
                    <span class="font-mono text-slate-500 font-medium">${item.rate.toFixed(3)} ‰</span>
                  </label>
                `).join('')}
              </div>

              <div class="grid grid-cols-2 gap-4 pt-2 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Diskon / Penyesuaian Underwriting (%)</label>
                  <input type="number" id="kabar-discount" value="10" min="0" max="50" oninput="window.KabarModule.calculate()" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 font-mono" />
                </div>
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">Biaya Polis & Materai</label>
                  <input type="text" disabled value="Rp 60.000 (Polis: Rp 50k, Materai: Rp 10k)" class="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono" />
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Calculation Summary Slip (5 cols) -->
          <div class="lg:col-span-5 space-y-6">
            <div class="sticky top-20 bg-white rounded-3xl p-6 border-2 border-orange-500/20 shadow-xl space-y-6 relative overflow-hidden">
              <div class="absolute -right-8 -top-8 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>

              <!-- Top Quotation Header -->
              <div class="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-orange-600">Slip Penawaran Premi</span>
                  <h3 class="text-lg font-black text-slate-800">Simulasi Asuransi Kebakaran</h3>
                </div>
                <div class="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  OJK
                </div>
              </div>

              <!-- Breakdown Table -->
              <div class="space-y-3 text-xs">
                <div class="flex items-center justify-between py-1 border-b border-slate-100">
                  <span class="text-slate-500">Rate Dasar OJK:</span>
                  <span id="res-base-rate" class="font-mono font-bold text-slate-800">0.540 ‰</span>
                </div>
                <div class="flex items-center justify-between py-1 border-b border-slate-100">
                  <span class="text-slate-500">Premi Dasar Standar:</span>
                  <span id="res-base-premium" class="font-mono font-semibold text-slate-800">Rp 1.296.000</span>
                </div>
                <div class="flex items-center justify-between py-1 border-b border-slate-100">
                  <span class="text-slate-500">Total Rate Perluasan:</span>
                  <span id="res-ext-rate" class="font-mono font-bold text-blue-600">1.110 ‰</span>
                </div>
                <div class="flex items-center justify-between py-1 border-b border-slate-100">
                  <span class="text-slate-500">Premi Perluasan Jaminan:</span>
                  <span id="res-ext-premium" class="font-mono font-semibold text-blue-600">Rp 2.664.000</span>
                </div>
                <div class="flex items-center justify-between py-1 border-b border-slate-100">
                  <span class="text-slate-500">Diskon Underwriting:</span>
                  <span id="res-discount-amount" class="font-mono font-semibold text-rose-500">- Rp 396.000</span>
                </div>
                <div class="flex items-center justify-between py-1 border-b border-slate-100">
                  <span class="text-slate-500">Biaya Administrasi & Materai:</span>
                  <span class="font-mono font-semibold text-slate-800">Rp 60.000</span>
                </div>
              </div>

              <!-- Grand Total Box -->
              <div class="p-5 rounded-2xl bg-gradient-to-br from-[#002B49] to-[#0A3D62] text-white shadow-lg space-y-1">
                <span class="text-[11px] font-medium text-amber-300 uppercase tracking-wider">Total Premi Bruto Yang Dibayar</span>
                <div id="res-grand-total" class="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                  Rp 3.624.000
                </div>
                <p class="text-[10px] text-slate-300">Termasuk pajak, bea materai Rp 10.000 & biaya pencetakan polis.</p>
              </div>

              <!-- Actions inside Quotation Slip -->
              <div class="space-y-2 pt-2">
                <button onclick="window.KabarModule.forwardToBus()" class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md transition-all">
                  <i data-lucide="file-plus" class="w-4 h-4"></i>
                  <span>Lanjutkan Terbitkan SPPA (Modul BUS)</span>
                </button>

                <button onclick="window.KabarModule.printQuotation()" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition">
                  <i data-lucide="printer" class="w-4 h-4"></i>
                  <span>Cetak Slip Penawaran Premi (Quotation)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Quotation Print Modal Container -->
        <div id="kabar-modal-container"></div>
      </div>
    `;
  },

  calculate() {
    const okupasiKey = document.getElementById('kabar-okupasi')?.value || 'shophouse';
    const konstruksiClass = document.getElementById('kabar-konstruksi')?.value || 'class1';
    const periodFactor = parseFloat(document.getElementById('kabar-period')?.value || '1');
    const discountPct = parseFloat(document.getElementById('kabar-discount')?.value || '0') / 100;

    const building = parseFloat(document.getElementById('tsi-building')?.value || '0');
    const machinery = parseFloat(document.getElementById('tsi-machinery')?.value || '0');
    const stock = parseFloat(document.getElementById('tsi-stock')?.value || '0');
    const furniture = parseFloat(document.getElementById('tsi-furniture')?.value || '0');

    const totalTsi = building + machinery + stock + furniture;

    // Display total TSI
    const displayTsi = document.getElementById('display-total-tsi');
    if (displayTsi) {
      displayTsi.innerText = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalTsi);
    }

    // Base rate
    const okupasiObj = this.TARIFF_RATES[okupasiKey] || this.TARIFF_RATES.shophouse;
    const baseRate = okupasiObj[konstruksiClass] || 0.540;

    // Extension rates
    let totalExtRate = 0;
    const selectedExtensions = [];
    for (const [key, item] of Object.entries(this.EXTENSION_RATES)) {
      const chk = document.getElementById(`ext-${key}`);
      if (chk && chk.checked) {
        totalExtRate += item.rate;
        selectedExtensions.push({ name: item.name, rate: item.rate });
      }
    }

    // Multi-year or short period multiplier
    let durationMultiplier = 1;
    if (periodFactor === 2) durationMultiplier = 1.85;
    else if (periodFactor === 3) durationMultiplier = 2.70;
    else if (periodFactor === 5) durationMultiplier = 4.25;
    else if (periodFactor === 0.5) durationMultiplier = 0.70;

    // Premium computations
    const basePremium = (totalTsi * (baseRate / 1000)) * durationMultiplier;
    const extPremium = (totalTsi * (totalExtRate / 1000)) * durationMultiplier;
    const subtotal = basePremium + extPremium;
    const discountAmount = subtotal * discountPct;
    const policyFee = 50000;
    const stampDuty = 10000;
    const grandTotal = (subtotal - discountAmount) + policyFee + stampDuty;

    this.currentCalc = {
      okupasiName: okupasiObj.name,
      konstruksiClass: konstruksiClass.toUpperCase(),
      totalTsi,
      baseRate,
      basePremium,
      totalExtRate,
      selectedExtensions,
      extPremium,
      discountAmount,
      policyFee,
      stampDuty,
      grandTotal,
      location: document.getElementById('kabar-location')?.value || 'Kantor Cabang Jakarta'
    };

    // Update result UI elements
    const elBaseRate = document.getElementById('res-base-rate');
    const elBasePrem = document.getElementById('res-base-premium');
    const elExtRate = document.getElementById('res-ext-rate');
    const elExtPrem = document.getElementById('res-ext-premium');
    const elDisc = document.getElementById('res-discount-amount');
    const elGrand = document.getElementById('res-grand-total');

    const fmt = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

    if (elBaseRate) elBaseRate.innerText = baseRate.toFixed(3) + ' ‰';
    if (elBasePrem) elBasePrem.innerText = fmt(basePremium);
    if (elExtRate) elExtRate.innerText = totalExtRate.toFixed(3) + ' ‰';
    if (elExtPrem) elExtPrem.innerText = fmt(extPremium);
    if (elDisc) elDisc.innerText = '- ' + fmt(discountAmount);
    if (elGrand) elGrand.innerText = fmt(grandTotal);
  },

  loadSampleData() {
    document.getElementById('kabar-okupasi').value = 'warehouse';
    document.getElementById('kabar-konstruksi').value = 'class1';
    document.getElementById('tsi-building').value = '5000000000';
    document.getElementById('tsi-machinery').value = '1500000000';
    document.getElementById('tsi-stock').value = '3500000000';
    document.getElementById('tsi-furniture').value = '200000000';
    document.getElementById('kabar-discount').value = '15';
    this.calculate();
    window.askrindoApp.showToast('Contoh data Gudang Industri berhasil dimuat ke KABAR.', 'info');
  },

  resetForm() {
    document.getElementById('tsi-building').value = '1000000000';
    document.getElementById('tsi-machinery').value = '0';
    document.getElementById('tsi-stock').value = '0';
    document.getElementById('tsi-furniture').value = '0';
    document.getElementById('kabar-discount').value = '0';
    this.calculate();
  },

  forwardToBus() {
    if (!this.currentCalc) this.calculate();
    // Save to temp storage for BUS module
    sessionStorage.setItem('askrindo_pending_sppa_from_kabar', JSON.stringify({
      productType: 'Asuransi Kebakaran Standar Indonesia (FLEXAS)',
      riskLocation: this.currentCalc.location,
      totalTsi: this.currentCalc.totalTsi,
      estimatedPremium: this.currentCalc.grandTotal,
      notes: `Dihitung via modul KABAR. Okupasi: ${this.currentCalc.okupasiName}, Rate Dasar: ${this.currentCalc.baseRate}‰`
    }));

    window.askrindoDB.logActivity('KABAR', 'Transfer ke SPPA (BUS)', `Meneruskan simulasi premi kebakaran TSI ${this.currentCalc.totalTsi} ke modul penerbitan SPPA.`);
    window.askrindoApp.showToast('Data kalkulasi berhasil diteruskan ke formulir SPPA!', 'success');
    window.location.hash = '#/bus';
  },

  printQuotation() {
    if (!this.currentCalc) this.calculate();
    const c = this.currentCalc;
    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    const modal = document.getElementById('kabar-modal-container');
    if (!modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto printable-document">
          <!-- Kop Penawaran -->
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div class="flex items-center gap-3">
              <img src="assets/images/logo-corporate.png" alt="Askrindo SATU" class="h-12 object-contain" />
              <div>
                <h2 class="text-sm font-extrabold text-[#002B49]">PT ASURANSI KREDIT INDONESIA</h2>
                <p class="text-[10px] text-slate-500">Sistem Aplikasi Terpadu</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-orange-600">QUOTATION / SLIP PENAWARAN</span>
              <p class="text-[10px] text-slate-400">Ref: QUO-F-${Date.now().toString().slice(-6)}</p>
            </div>
          </div>

          <div class="space-y-4 text-xs text-slate-700">
            <div class="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
              <div>
                <p class="text-[10px] text-slate-400 uppercase font-semibold">Jenis Asuransi</p>
                <p class="font-bold text-slate-800">Kebakaran Standar Indonesia (FLEXAS)</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-400 uppercase font-semibold">Okupasi Objek</p>
                <p class="font-bold text-slate-800">${c.okupasiName}</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-400 uppercase font-semibold">Kelas Konstruksi</p>
                <p class="font-bold text-slate-800">${c.konstruksiClass}</p>
              </div>
              <div>
                <p class="text-[10px] text-slate-400 uppercase font-semibold">Lokasi Risiko</p>
                <p class="font-bold text-slate-800">${c.location}</p>
              </div>
            </div>

            <table class="w-full text-xs">
              <tr class="border-b py-2"><td class="py-1 text-slate-500">Total Sum Insured (TSI):</td><td class="py-1 text-right font-mono font-bold">${fmt(c.totalTsi)}</td></tr>
              <tr class="border-b py-2"><td class="py-1 text-slate-500">Tarif Premi Dasar Kebakaran:</td><td class="py-1 text-right font-mono">${c.baseRate.toFixed(3)} ‰ (${fmt(c.basePremium)})</td></tr>
              <tr class="border-b py-2"><td class="py-1 text-slate-500">Perluasan Jaminan Tambahan:</td><td class="py-1 text-right font-mono">${c.totalExtRate.toFixed(3)} ‰ (${fmt(c.extPremium)})</td></tr>
              <tr class="border-b py-2"><td class="py-1 text-slate-500">Diskon Underwriting:</td><td class="py-1 text-right font-mono text-rose-600">- ${fmt(c.discountAmount)}</td></tr>
              <tr class="border-b py-2"><td class="py-1 text-slate-500">Biaya Administrasi & Materai:</td><td class="py-1 text-right font-mono">${fmt(c.policyFee + c.stampDuty)}</td></tr>
              <tr class="font-bold text-sm bg-orange-50/80"><td class="p-2 text-slate-900">Total Premi Yang Dibayar:</td><td class="p-2 text-right font-mono text-orange-700 font-black">${fmt(c.grandTotal)}</td></tr>
            </table>

            <p class="text-[10px] text-slate-400 italic">
              *Penawaran ini mengacu pada batasan tarif premi OJK SEOJK No. 6/SEOJK.05/2017 dan berlaku selama 14 hari kalender sejak diterbitkan.
            </p>
          </div>

          <div class="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 no-print">
            <button onclick="document.getElementById('kabar-modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition text-xs">
              Tutup
            </button>
            <button onclick="window.print()" class="px-5 py-2 rounded-xl text-white font-semibold bg-orange-600 hover:bg-orange-700 transition text-xs flex items-center gap-1.5 shadow-md">
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
