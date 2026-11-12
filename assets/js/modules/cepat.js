/**
 * Askrindo SATU - CEPAT Module (Cover Note Pertanggungan Asuransi Terintegrasi)
 * Fast Digital Insurance Cover Note Generator for Banking & Urgent Coverage
 */

window.CepatModule = {
  currentTab: 'create', // 'create' | 'list'
  currentStep: 1, // 1 to 4
  searchFilter: '',
  statusFilter: 'all',
  activeCoverNoteId: null,

  formData: {
    insuredType: 'Badan Usaha (PT)',
    insuredName: 'PT Mega Baja Konstruksi',
    nikNpwp: '01.456.789.2-014.000',
    phone: '021-89721100',
    email: 'legal@megabaja.co.id',
    address: 'Kawasan Industri MM2100 Blok C-3, Cikarang Barat, Bekasi',
    bankName: 'PT Bank Mandiri (Persero) Tbk',
    bankBranch: 'Cabang Jakarta Kebon Sirih',
    creditRefNo: 'PK-KMK/MDR/2026/11-042',
    productType: 'Asuransi Kebakaran & Property All Risks (FLEXAS/PAR)',
    riskObjectDescription: 'Bangunan Gudang Penyimpanan Besi Baja, Pabrik Fabrikasi & Seluruh Mesin Crane',
    riskLocation: 'Kawasan Industri MM2100 Blok C-3, Cikarang Barat, Bekasi, Jawa Barat',
    validDays: 30,
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalTsi: 15000000000,
    estimatedPremium: 22500000,
    deductible: '10% dari nilai klaim yang disetujui, minimum Rp 15.000.000,- per kejadian',
    specialClauses: "Banker's Clause QQ PT Bank Mandiri (Persero) Tbk, Klausula Standar Asuransi Kebakaran Indonesia, RSMDCC 4.1A, Earthquake EQVET Zona 3",
    notes: 'Cover Note ini diterbitkan sebagai bukti penutupan asuransi sementara untuk pemenuhan klausula pencairan fasilitas kredit dan berlaku mengikat sampai diterbitkannya Polis Asuransi Definitif.',
    signatoryName: 'Ahmad Faisal, S.E., M.M.',
    signatoryTitle: 'Kepala Cabang / Authorized Underwriter'
  },

  render() {
    const user = window.authService.getCurrentUser();
    if (!user || !window.authService.hasAccess('cepat')) {
      return window.askrindoApp.renderUnauthorized('CEPAT');
    }

    const coverNotes = window.askrindoDB.getCoverNotes();

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Module Header -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-cyan-600">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-cyan-500/20">
              <i data-lucide="file-check-2" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-black text-slate-800 tracking-tight">CEPAT</h1>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-200">
                  Cover Note Pertanggungan Asuransi Terintegrasi
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Penerbitan Nota Penutupan Asuransi Sementara (Cover Note) kilat, berstempel digital resmi, Banker's Clause QQ Bank, dan QR code keabsahan dokumen.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.CepatModule.setTab('create')" class="px-3.5 py-2 rounded-xl text-xs font-semibold transition ${this.currentTab === 'create' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
              + Buat Cover Note Kilat
            </button>
            <button onclick="window.CepatModule.setTab('list')" class="px-3.5 py-2 rounded-xl text-xs font-semibold transition ${this.currentTab === 'list' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
              Arsip Cover Note (${coverNotes.length})
            </button>
          </div>
        </div>

        <!-- Admin Testing Mode Notice -->
        <div class="bg-gradient-to-r from-amber-500 to-cyan-600 text-white p-3.5 rounded-2xl flex items-center justify-between text-xs shadow-md shadow-amber-500/15">
          <div class="flex items-center gap-2.5 font-medium">
            <div class="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center shrink-0">
              <i data-lucide="flask-conical" class="w-4 h-4 text-amber-200"></i>
            </div>
            <div>
              <span class="font-bold">Mode Pengujian Administrator (Testing Mode)</span>
              <p class="text-[11px] text-amber-100 mt-0.5">Modul ini dinonaktifkan untuk pengguna umum dan hanya dapat diakses oleh Administrator untuk uji coba integrasi.</p>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-lg bg-black/20 text-[10px] font-mono font-bold tracking-wider uppercase shrink-0">
            Admin Test
          </span>
        </div>

        <!-- Tab Body -->
        <div>
          ${this.currentTab === 'create' ? this.renderCreateWizard() : this.renderCoverNoteList(coverNotes)}
        </div>
      </div>
    `;
  },

  setTab(tab) {
    this.currentTab = tab;
    if (tab === 'create' && !this.activeCoverNoteId) {
      this.currentStep = 1;
    }
    window.askrindoApp.renderCurrentRoute();
  },

  setStep(step) {
    this.currentStep = step;
    window.askrindoApp.renderCurrentRoute();
  },

  // --- TAB 1: 4-STEP WIZARD ---
  renderCreateWizard() {
    const s = this.currentStep;

    return `
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Wizard Step Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm no-print">
          <div class="grid grid-cols-4 gap-2 text-center text-xs">
            <div class="flex flex-col items-center gap-1.5 p-2 rounded-xl ${s >= 1 ? 'text-cyan-700 font-bold bg-cyan-50' : 'text-slate-400'}">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${s >= 1 ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-600'}">1</span>
              <span>1. Tertanggung & Bank</span>
            </div>
            <div class="flex flex-col items-center gap-1.5 p-2 rounded-xl ${s >= 2 ? 'text-cyan-700 font-bold bg-cyan-50' : 'text-slate-400'}">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${s >= 2 ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-600'}">2</span>
              <span>2. Objek & Periode</span>
            </div>
            <div class="flex flex-col items-center gap-1.5 p-2 rounded-xl ${s >= 3 ? 'text-cyan-700 font-bold bg-cyan-50' : 'text-slate-400'}">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${s >= 3 ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-600'}">3</span>
              <span>3. Syarat & Banker's Clause</span>
            </div>
            <div class="flex flex-col items-center gap-1.5 p-2 rounded-xl ${s >= 4 ? 'text-cyan-700 font-bold bg-cyan-50' : 'text-slate-400'}">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${s >= 4 ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-600'}">4</span>
              <span>4. Pratinjau & Cetak Cover Note</span>
            </div>
          </div>
        </div>

        <!-- Wizard Step Content -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
          ${s === 1 ? this.renderStep1() : ''}
          ${s === 2 ? this.renderStep2() : ''}
          ${s === 3 ? this.renderStep3() : ''}
          ${s === 4 ? this.renderStep4() : ''}
        </div>
      </div>
    `;
  },

  // Step 1: Data Tertanggung & Bank (Kreditur)
  renderStep1() {
    const f = this.formData;
    return `
      <div class="space-y-6">
        <div>
          <h3 class="text-base font-bold text-slate-800">Langkah 1: Identitas Tertanggung & Penerima Jaminan (Bank)</h3>
          <p class="text-xs text-slate-500 mt-1">Masukkan data lengkap calon tertanggung dan rincian bank kreditur untuk klausula Banker's Clause.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Bentuk Badan Usaha / Pemohon</label>
            <select id="cn-step1-type" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500">
              <option value="Badan Usaha (PT)" ${f.insuredType === 'Badan Usaha (PT)' ? 'selected' : ''}>Badan Usaha (PT)</option>
              <option value="Badan Usaha (CV)" ${f.insuredType === 'Badan Usaha (CV)' ? 'selected' : ''}>Badan Usaha (CV)</option>
              <option value="BUMN / BUMD" ${f.insuredType === 'BUMN / BUMD' ? 'selected' : ''}>BUMN / BUMD</option>
              <option value="Perorangan / Usaha Dagang (UD)" ${f.insuredType === 'Perorangan / Usaha Dagang (UD)' ? 'selected' : ''}>Perorangan / Usaha Dagang (UD)</option>
              <option value="Koperasi / Yayasan" ${f.insuredType === 'Koperasi / Yayasan' ? 'selected' : ''}>Koperasi / Yayasan</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Nama Tertanggung / Debitur</label>
            <input type="text" id="cn-step1-name" value="${f.insuredName}" placeholder="Contoh: PT Mega Baja Konstruksi" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500" required />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">NPWP / NIK Tertanggung</label>
            <input type="text" id="cn-step1-nik" value="${f.nikNpwp}" placeholder="Nomor Pokok Wajib Pajak / KTP" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500" required />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp</label>
            <input type="text" id="cn-step1-phone" value="${f.phone}" placeholder="021-xxxx / 0812xxxx" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500" required />
          </div>

          <div class="md:col-span-2">
            <label class="block font-semibold text-slate-700 mb-1">Alamat Email Tertanggung</label>
            <input type="email" id="cn-step1-email" value="${f.email}" placeholder="finance@perusahaan.co.id" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500" />
          </div>

          <div class="md:col-span-2">
            <label class="block font-semibold text-slate-700 mb-1">Alamat Domisili / Kantor Pusat</label>
            <textarea id="cn-step1-address" rows="2" class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500">${f.address}</textarea>
          </div>
        </div>

        <!-- Banker's Clause Details Box -->
        <div class="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 space-y-3 text-xs">
          <div class="flex items-center gap-2 text-cyan-900 font-bold">
            <i data-lucide="landmark" class="w-4 h-4 text-cyan-700"></i>
            <span>Rincian Penerima Jaminan (Banker's Clause QQ Bank)</span>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Bank / Kreditur</label>
              <select id="cn-step1-bank" class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500 bg-white">
                <option value="PT Bank Mandiri (Persero) Tbk" ${f.bankName.includes('Mandiri') ? 'selected' : ''}>PT Bank Mandiri (Persero) Tbk</option>
                <option value="PT Bank Rakyat Indonesia (Persero) Tbk" ${f.bankName.includes('Rakyat Indonesia') ? 'selected' : ''}>PT Bank Rakyat Indonesia (Persero) Tbk</option>
                <option value="PT Bank Negara Indonesia (Persero) Tbk" ${f.bankName.includes('Negara Indonesia') ? 'selected' : ''}>PT Bank Negara Indonesia (Persero) Tbk</option>
                <option value="PT Bank Tabungan Negara (Persero) Tbk" ${f.bankName.includes('Tabungan Negara') ? 'selected' : ''}>PT Bank Tabungan Negara (Persero) Tbk</option>
                <option value="PT Bank Central Asia Tbk" ${f.bankName.includes('Central Asia') ? 'selected' : ''}>PT Bank Central Asia Tbk</option>
                <option value="PT Bank Syariah Indonesia Tbk" ${f.bankName.includes('Syariah Indonesia') ? 'selected' : ''}>PT Bank Syariah Indonesia Tbk</option>
                <option value="PT Bank Pembangunan Daerah (BPD / Bank Jatim / BJB / Bank DKI)" ${f.bankName.includes('Pembangunan Daerah') ? 'selected' : ''}>Bank Daerah (BPD)</option>
                <option value="Lembaga Pembiayaan / Multifinance Lainnya" ${f.bankName.includes('Lembaga') ? 'selected' : ''}>Lembaga Pembiayaan Lainnya</option>
              </select>
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Kantor Cabang Bank</label>
              <input type="text" id="cn-step1-branch" value="${f.bankBranch}" placeholder="Contoh: Cabang Jakarta Thamrin" class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500 bg-white" required />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nomor PK / Ref. Kredit Bank</label>
              <input type="text" id="cn-step1-ref" value="${f.creditRefNo}" placeholder="Contoh: PK-KMK/MDR/2026/11-042" class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500 bg-white" />
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100">
          <button onclick="window.CepatModule.saveStep1()" class="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-cyan-600 hover:bg-cyan-700 transition flex items-center gap-2">
            <span>Lanjut ke Objek Pertanggungan</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  saveStep1() {
    this.formData.insuredType = document.getElementById('cn-step1-type').value;
    this.formData.insuredName = document.getElementById('cn-step1-name').value.trim() || 'PT Tertanggung Demo';
    this.formData.nikNpwp = document.getElementById('cn-step1-nik').value.trim() || '01.234.567.8-000.000';
    this.formData.phone = document.getElementById('cn-step1-phone').value.trim() || '021-5000000';
    this.formData.email = document.getElementById('cn-step1-email').value.trim() || 'info@tertanggung.co.id';
    this.formData.address = document.getElementById('cn-step1-address').value.trim() || 'Alamat Belum Diisi';
    this.formData.bankName = document.getElementById('cn-step1-bank').value;
    this.formData.bankBranch = document.getElementById('cn-step1-branch').value.trim() || 'Kantor Cabang Utama';
    this.formData.creditRefNo = document.getElementById('cn-step1-ref').value.trim() || 'REF-KREDIT/2026';

    // Auto-update Banker's Clause in formData
    this.formData.specialClauses = `Banker's Clause QQ ${this.formData.bankName} ${this.formData.bankBranch}, Klausula Standar Asuransi Kebakaran Indonesia, RSMDCC 4.1A`;

    this.setStep(2);
  },

  // Step 2: Objek & Risiko & Periode Cover Note
  renderStep2() {
    const f = this.formData;
    return `
      <div class="space-y-6">
        <div>
          <h3 class="text-base font-bold text-slate-800">Langkah 2: Rincian Objek Pertanggungan & Masa Berlaku Cover Note</h3>
          <p class="text-xs text-slate-500 mt-1">Pilih lini produk asuransi umum, deskripsi objek yang ditutup sementara, dan jangka waktu berlakunya nota penutupan.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Lini Produk Asuransi Umum</label>
            <select id="cn-step2-product" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500">
              <option value="Asuransi Kebakaran & Property All Risks (FLEXAS/PAR)" ${f.productType.includes('Kebakaran') ? 'selected' : ''}>Asuransi Kebakaran & Property All Risks (FLEXAS/PAR)</option>
              <option value="Asuransi Kendaraan Bermotor (Comprehensive & TLO)" ${f.productType.includes('Kendaraan') ? 'selected' : ''}>Asuransi Kendaraan Bermotor (Comprehensive & TLO)</option>
              <option value="Asuransi Konstruksi & Rekayasa Teknik (CAR / EAR)" ${f.productType.includes('Konstruksi') ? 'selected' : ''}>Asuransi Konstruksi & Rekayasa Teknik (CAR / EAR)</option>
              <option value="Asuransi Pengangkutan Barang (Marine Cargo)" ${f.productType.includes('Pengangkutan') ? 'selected' : ''}>Asuransi Pengangkutan Barang (Marine Cargo)</option>
              <option value="Asuransi Peralatan Berat & Mesin (CPM / HE)" ${f.productType.includes('Peralatan') ? 'selected' : ''}>Asuransi Peralatan Berat & Mesin (CPM / HE)</option>
              <option value="Asuransi Penjaminan Proyek (Surety Bond)" ${f.productType.includes('Surety') ? 'selected' : ''}>Asuransi Penjaminan Proyek (Surety Bond)</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Jangka Waktu Cover Note (Masa Berlaku Sementara)</label>
            <div class="grid grid-cols-4 gap-2">
              ${[14, 30, 60, 90].map(days => `
                <button type="button" onclick="window.CepatModule.updateValidDays(${days})" class="py-2.5 rounded-xl border font-bold text-center transition ${f.validDays === days ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}">
                  ${days} Hari
                </button>
              `).join('')}
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Tanggal Mulai Berlaku</label>
            <input type="date" id="cn-step2-start" value="${f.periodStart}" onchange="window.CepatModule.recalcPeriodEnd()" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500" />
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Tanggal Berakhir Cover Note</label>
            <input type="date" id="cn-step2-end" value="${f.periodEnd}" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-100 text-slate-600 font-semibold cursor-not-allowed" readonly />
          </div>

          <div class="md:col-span-2">
            <label class="block font-semibold text-slate-700 mb-1">Deskripsi Objek yang Dipertanggungkan</label>
            <input type="text" id="cn-step2-desc" value="${f.riskObjectDescription}" placeholder="Contoh: Bangunan Pabrik, Gudang Penyimpanan, Mesin Produksi, atau 10 Unit Armada Truk" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500" required />
          </div>

          <div class="md:col-span-2">
            <label class="block font-semibold text-slate-700 mb-1">Lokasi Objek / Alamat Risiko Pertanggungan</label>
            <textarea id="cn-step2-loc" rows="2" class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500">${f.riskLocation}</textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Total Nilai Pertanggungan (TSI)</label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 font-bold text-slate-400">Rp</span>
              <input type="number" id="cn-step2-tsi" value="${f.totalTsi}" step="1000000" class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 focus:outline-none focus:border-cyan-500" />
            </div>
            <p class="text-[10px] text-slate-400 mt-1">Nilai keseluruhan aset yang dijamin sementara.</p>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Estimasi Premi Sementara (Gross Premium)</label>
            <div class="relative">
              <span class="absolute left-3.5 top-2.5 font-bold text-slate-400">Rp</span>
              <input type="number" id="cn-step2-premium" value="${f.estimatedPremium}" step="50000" class="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 font-bold text-cyan-800 focus:outline-none focus:border-cyan-500" />
            </div>
            <p class="text-[10px] text-slate-400 mt-1">Premi indikatif sebelum polis definitif diterbitkan.</p>
          </div>
        </div>

        <div class="flex justify-between pt-4 border-t border-slate-100">
          <button onclick="window.CepatModule.setStep(1)" class="px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Kembali
          </button>
          <button onclick="window.CepatModule.saveStep2()" class="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-cyan-600 hover:bg-cyan-700 transition flex items-center gap-2">
            <span>Lanjut ke Klausula & Syarat</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  updateValidDays(days) {
    this.formData.validDays = days;
    this.recalcPeriodEnd();
    this.setStep(2);
  },

  recalcPeriodEnd() {
    const startInput = document.getElementById('cn-step2-start');
    if (startInput) {
      this.formData.periodStart = startInput.value;
    }
    const start = new Date(this.formData.periodStart).getTime();
    const end = new Date(start + this.formData.validDays * 24 * 60 * 60 * 1000);
    this.formData.periodEnd = end.toISOString().split('T')[0];
    const endInput = document.getElementById('cn-step2-end');
    if (endInput) endInput.value = this.formData.periodEnd;
  },

  saveStep2() {
    this.formData.productType = document.getElementById('cn-step2-product').value;
    this.formData.riskObjectDescription = document.getElementById('cn-step2-desc').value.trim() || 'Objek Pertanggungan Sesuai Polis';
    this.formData.riskLocation = document.getElementById('cn-step2-loc').value.trim() || 'Lokasi Risiko Sesuai Polis';
    this.formData.periodStart = document.getElementById('cn-step2-start').value;
    this.formData.totalTsi = parseFloat(document.getElementById('cn-step2-tsi').value || '0');
    this.formData.estimatedPremium = parseFloat(document.getElementById('cn-step2-premium').value || '0');
    this.setStep(3);
  },

  // Step 3: Klausula Banker's Clause, Deductible, & Pejabat
  renderStep3() {
    const f = this.formData;
    const user = window.authService.getCurrentUser();

    return `
      <div class="space-y-6">
        <div>
          <h3 class="text-base font-bold text-slate-800">Langkah 3: Klausula Khusus, Deductible & Pejabat Penandatangan</h3>
          <p class="text-xs text-slate-500 mt-1">Lengkapi klausula Banker's Clause perbankan, risiko sendiri, dan data pejabat penerbit kantor cabang.</p>
        </div>

        <div class="space-y-4 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Klausula Banker's Clause Resmi (Loss Payee Clause)</label>
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 leading-relaxed">
              "It is hereby noted and agreed that the indemnity under this policy shall be payable directly to <b>${f.bankName} (${f.bankBranch})</b> as Loss Payee, regarding Credit Facility No: <b>${f.creditRefNo}</b>, and that no alteration or cancellation of this policy shall be made without the prior written consent of the Bank."
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Daftar Klausula Tambahan Terlampir</label>
            <textarea id="cn-step3-clauses" rows="2" class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500 font-mono text-xs">${f.specialClauses}</textarea>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Risiko Sendiri (Deductible / Excess)</label>
            <input type="text" id="cn-step3-deductible" value="${f.deductible}" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500" />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nama Pejabat Penandatangan Cabang</label>
              <input type="text" id="cn-step3-signatory" value="${f.signatoryName || user.name}" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Jabatan / Otoritas Penandatangan</label>
              <input type="text" id="cn-step3-title" value="${f.signatoryTitle || 'Kepala Cabang / Authorized Underwriter'}" class="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500" />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Catatan Tambahan Nota Penutupan Sementara</label>
            <textarea id="cn-step3-notes" rows="2" class="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:border-cyan-500">${f.notes}</textarea>
          </div>
        </div>

        <div class="flex justify-between pt-4 border-t border-slate-100">
          <button onclick="window.CepatModule.setStep(2)" class="px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Kembali
          </button>
          <button onclick="window.CepatModule.saveStep3()" class="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-cyan-600 hover:bg-cyan-700 transition flex items-center gap-2 shadow-md shadow-cyan-600/20">
            <span>Generate & Pratinjau Cover Note</span>
            <i data-lucide="file-check-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  saveStep3() {
    this.formData.specialClauses = document.getElementById('cn-step3-clauses').value;
    this.formData.deductible = document.getElementById('cn-step3-deductible').value;
    this.formData.signatoryName = document.getElementById('cn-step3-signatory').value;
    this.formData.signatoryTitle = document.getElementById('cn-step3-title').value;
    this.formData.notes = document.getElementById('cn-step3-notes').value;
    this.setStep(4);
  },

  // Step 4: Pratinjau & Cetak Cover Note Resmi (Printable Document)
  renderStep4() {
    const f = this.formData;
    const user = window.authService.getCurrentUser();
    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
    const docNo = 'CN/ASK-' + (user.branch.includes('Surabaya') ? 'SBY' : (user.branch.includes('Medan') ? 'MDN' : 'PST')) + '/2026/11/' + Math.floor(1000 + Math.random() * 9000);

    return `
      <div class="space-y-6">
        <!-- Top Action Bar for Document -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-cyan-50 rounded-2xl border border-cyan-200 no-print">
          <div class="flex items-center gap-2 text-cyan-900 text-xs">
            <i data-lucide="check-circle-2" class="w-5 h-5 text-cyan-600 shrink-0"></i>
            <span>Nota Penutupan Sementara (Cover Note) berhasil digenerate. Siap dicetak langsung atau disimpan ke arsip.</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.print()" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 transition flex items-center gap-1.5 shadow-sm cursor-pointer">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Cetak / Download PDF</span>
            </button>
            <button onclick="window.CepatModule.finalizeAndSave('${docNo}')" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition flex items-center gap-1.5 shadow-sm cursor-pointer">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Simpan ke Database Arsip</span>
            </button>
          </div>
        </div>

        <!-- The Formal Printable Cover Note Document -->
        <div class="printable-document bg-white border border-slate-300 rounded-2xl p-8 sm:p-10 space-y-6 shadow-sm">
          <!-- Kop Surat Resmi Askrindo -->
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div class="flex items-center gap-4">
              <img src="assets/images/logo-corporate.png" alt="Askrindo Logo" class="h-14 object-contain" />
              <div>
                <h2 class="text-base font-black text-[#002B49] tracking-tight">PT ASURANSI KREDIT INDONESIA</h2>
                <p class="text-[11px] text-slate-600">Sistem Aplikasi Terpadu — Divisi Operasional & Penjaminan</p>
                <p class="text-[10px] text-slate-400">Kantor Penerbit: ${user.branch}</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-cyan-800 bg-cyan-50 px-3 py-1 rounded border border-cyan-200">
                COVER NOTE PENUTUPAN ASURANSI
              </span>
              <p class="text-xs font-mono font-bold text-slate-800 mt-2">${docNo}</p>
              <p class="text-[10px] text-slate-400">Tanggal Terbit: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            </div>
          </div>

          <!-- Judul Formal -->
          <div class="text-center py-2 border-b border-slate-100">
            <h3 class="text-base font-black text-slate-900 tracking-wider uppercase">NOTA PENUTUPAN SEMENTARA (INSURANCE COVER NOTE)</h3>
            <p class="text-[11px] text-slate-500 mt-0.5">Nomor Registrasi Sistem: <span class="font-mono font-semibold text-slate-800">${docNo}</span></p>
          </div>

          <!-- Pembukaan Sertifikasi Penutupan -->
          <div class="text-xs text-slate-700 leading-relaxed text-justify">
            Dengan ini <b>PT Asuransi Kredit Indonesia (Askrindo)</b> menerangkan dan menegaskan bahwa telah menerima dan menyetujui penutupan asuransi sementara untuk kepentingan Calon Tertanggung atas objek pertanggungan di bawah ini, sambil menunggu penyelesaian penerbitan <b>Polis Asuransi Definitif</b> sesuai syarat dan ketentuan standar yang berlaku:
          </div>

          <!-- Bagian I: Data Tertanggung & Banker's Clause -->
          <div class="space-y-2 text-xs">
            <h4 class="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded flex items-center justify-between">
              <span>I. IDENTITAS TERTANGGUNG & BANKER'S CLAUSE</span>
              <span class="text-[10px] font-normal text-slate-500">Legal Binding Reference</span>
            </h4>
            <div class="grid grid-cols-2 gap-y-2 px-3">
              <div><span class="text-slate-400">Nama Tertanggung:</span> <span class="font-bold text-slate-900">${f.insuredName}</span></div>
              <div><span class="text-slate-400">Kategori Pemohon:</span> <span class="font-semibold text-slate-800">${f.insuredType}</span></div>
              <div><span class="text-slate-400">NPWP / NIK:</span> <span class="font-mono text-slate-800">${f.nikNpwp}</span></div>
              <div><span class="text-slate-400">No. Kontak / HP:</span> <span class="text-slate-800">${f.phone}</span></div>
              <div class="col-span-2"><span class="text-slate-400">Alamat Tertanggung:</span> <span class="text-slate-800">${f.address}</span></div>
              <div class="col-span-2 pt-1 border-t border-slate-100">
                <span class="text-slate-400">Banker's Clause (Kreditur):</span> 
                <span class="font-bold text-cyan-900">${f.bankName} (${f.bankBranch})</span>
              </div>
              <div><span class="text-slate-400">Nomor PK / Ref. Kredit:</span> <span class="font-mono font-semibold text-slate-800">${f.creditRefNo}</span></div>
              <div><span class="text-slate-400">Klausula Kepentingan:</span> <span class="font-semibold text-slate-800">Loss Payee Clause QQ Bank</span></div>
            </div>
          </div>

          <!-- Bagian II: Objek Pertanggungan & Risiko -->
          <div class="space-y-2 text-xs">
            <h4 class="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded flex items-center justify-between">
              <span>II. OBJEK PERTANGGUNGAN & LOKASI RISIKO</span>
              <span class="text-[10px] font-normal text-slate-500">Lini Asuransi Umum</span>
            </h4>
            <div class="grid grid-cols-2 gap-y-2 px-3">
              <div class="col-span-2"><span class="text-slate-400">Lini Produk:</span> <span class="font-bold text-cyan-800">${f.productType}</span></div>
              <div class="col-span-2"><span class="text-slate-400">Deskripsi Objek:</span> <span class="font-semibold text-slate-800">${f.riskObjectDescription}</span></div>
              <div class="col-span-2"><span class="text-slate-400">Lokasi / Alamat Risiko:</span> <span class="text-slate-800 font-semibold">${f.riskLocation}</span></div>
            </div>
          </div>

          <!-- Bagian III: Masa Berlaku & Nilai Pertanggungan -->
          <div class="space-y-2 text-xs">
            <h4 class="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded flex items-center justify-between">
              <span>III. JANGKA WAKTU COVER NOTE & NILAI PERTANGGUNGAN (TSI)</span>
              <span class="text-[10px] font-normal text-slate-500">Masa Penutupan Sementara</span>
            </h4>
            <div class="grid grid-cols-2 gap-y-2 px-3">
              <div><span class="text-slate-400">Masa Berlaku Nota:</span> <span class="font-bold text-cyan-800">${f.validDays} Hari Kalender</span></div>
              <div><span class="text-slate-400">Jatuh Tempo Cover Note:</span> <span class="font-bold text-rose-700 font-mono">${f.periodEnd}</span></div>
              <div><span class="text-slate-400">Tanggal Mulai Berlaku:</span> <span class="text-slate-800 font-mono">${f.periodStart}</span> Pukul 12.00 WIB</div>
              <div><span class="text-slate-400">Tanggal Berakhir:</span> <span class="text-slate-800 font-mono">${f.periodEnd}</span> Pukul 12.00 WIB</div>
              
              <div class="col-span-2 pt-2">
                <table class="w-full border border-slate-200">
                  <tr class="bg-slate-50 border-b border-slate-200">
                    <th class="py-2 px-3 text-left">Komponen Finansial</th>
                    <th class="py-2 px-3 text-right">Rincian Nominal</th>
                  </tr>
                  <tr class="border-b border-slate-100">
                    <td class="py-2 px-3 text-slate-700">Total Nilai Pertanggungan (TSI)</td>
                    <td class="py-2 px-3 text-right font-mono font-bold text-slate-900">${fmt(f.totalTsi)}</td>
                  </tr>
                  <tr class="border-b border-slate-100 bg-cyan-50/40">
                    <td class="py-2 px-3 font-semibold text-cyan-900">Estimasi Premi Sementara</td>
                    <td class="py-2 px-3 text-right font-mono font-bold text-cyan-800">${fmt(f.estimatedPremium)}</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 text-slate-600">Risiko Sendiri (Deductible)</td>
                    <td class="py-2 px-3 text-right text-slate-700 text-[11px]">${f.deductible}</td>
                  </tr>
                </table>
              </div>
            </div>
          </div>

          <!-- Bagian IV: Ketentuan Hukum Cover Note -->
          <div class="space-y-1.5 text-[11px] text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p class="font-bold text-slate-800">KETENTUAN & PERSYARATAN PENUTUPAN SEMENTARA:</p>
            <ol class="list-decimal pl-4 space-y-1">
              <li>Cover Note ini berfungsi sebagai bukti jaminan penutupan asuransi sementara yang sah dan mengikat sebelum polis definitif dicetak.</li>
              <li>Jaminan asuransi tunduk pada syarat dan kondisi polis standar yang berlaku di PT Asuransi Kredit Indonesia.</li>
              <li>Cover Note ini batal demi hukum dan tidak berlaku lagi secara otomatis sejak diterbitkannya Polis Asuransi Definitif atau berakhirnya jangka waktu masa berlaku di atas.</li>
              <li>Dalam hal terjadi klaim pada masa berlakunya Cover Note ini, ganti rugi dibayarkan langsung kepada <b>${f.bankName}</b> sesuai klausula Banker's Clause.</li>
            </ol>
          </div>

          <!-- Tanda Tangan & QR Code Digital -->
          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-xs">
            <div class="flex items-center gap-3">
              <div class="w-20 h-20 bg-slate-100 border border-slate-300 rounded-xl p-1 flex items-center justify-center shrink-0">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ASKRINDO-COVER-NOTE-${docNo}" alt="QR Validasi" class="w-full h-full object-contain" />
              </div>
              <div class="text-[10px] text-slate-400 space-y-0.5">
                <p class="font-bold text-slate-700">QR Code Verifikasi Resmi</p>
                <p>Dokumen ini telah ditandatangani secara elektronik melalui Portal Terpadu Askrindo SATU.</p>
                <p class="font-mono text-cyan-700">Keabsahan Terverifikasi</p>
              </div>
            </div>

            <div class="text-right space-y-1">
              <p class="text-slate-500">${user.branch}, ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              <p class="font-bold text-slate-800">PT ASURANSI KREDIT INDONESIA</p>
              
              <!-- Stempel & Tanda Tangan Digital -->
              <div class="py-2 relative flex justify-end">
                <div class="relative w-40 h-16 flex items-center justify-center">
                  <div class="absolute inset-0 border-2 border-dashed border-cyan-300 rounded-lg flex items-center justify-center text-[9px] text-cyan-600 uppercase font-bold transform -rotate-3 bg-cyan-50/50">
                    DIGITALLY SIGNED & STAMPED
                  </div>
                  <span class="font-serif italic text-slate-800 font-bold relative z-10">${f.signatoryName}</span>
                </div>
              </div>

              <p class="font-bold text-slate-900 underline">${f.signatoryName}</p>
              <p class="text-[10px] text-slate-500">${f.signatoryTitle}</p>
            </div>
          </div>
        </div>

        <div class="flex justify-between pt-2 no-print">
          <button onclick="window.CepatModule.setStep(3)" class="px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Kembali ke Edit Form
          </button>
          <div class="flex items-center gap-2">
            <button onclick="window.CepatModule.finalizeAndSave('${docNo}')" class="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-slate-800 hover:bg-slate-900 transition flex items-center gap-2">
              <i data-lucide="check" class="w-4 h-4"></i>
              <span>Selesai & Masukkan ke Arsip</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  finalizeAndSave(docNo) {
    const user = window.authService.getCurrentUser();
    const newCn = {
      coverNoteNo: docNo,
      issuedDate: new Date().toISOString().split('T')[0],
      validUntil: this.formData.periodEnd,
      validDays: this.formData.validDays,
      insuredType: this.formData.insuredType,
      insuredName: this.formData.insuredName,
      nikNpwp: this.formData.nikNpwp,
      phone: this.formData.phone,
      email: this.formData.email,
      address: this.formData.address,
      bankName: this.formData.bankName,
      bankBranch: this.formData.bankBranch,
      creditRefNo: this.formData.creditRefNo,
      productType: this.formData.productType,
      riskObjectDescription: this.formData.riskObjectDescription,
      riskLocation: this.formData.riskLocation,
      totalTsi: this.formData.totalTsi,
      estimatedPremium: this.formData.estimatedPremium,
      deductible: this.formData.deductible,
      specialClauses: this.formData.specialClauses,
      notes: this.formData.notes,
      signatoryName: this.formData.signatoryName,
      signatoryTitle: this.formData.signatoryTitle,
      status: 'Aktif',
      registeredBy: user.name,
      branch: user.branch
    };

    window.askrindoDB.saveCoverNote(newCn);
    window.askrindoDB.logActivity('CEPAT', 'Penerbitan Cover Note', `Menerbitkan Cover Note nomor ${docNo} untuk tertanggung ${this.formData.insuredName} (QQ ${this.formData.bankName})`);

    window.askrindoApp.showToast(`Cover Note nomor ${docNo} berhasil disimpan ke arsip!`, 'success');
    this.setTab('list');
  },

  // --- TAB 2: COVER NOTE ARCHIVE LIST ---
  renderCoverNoteList(list) {
    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    const filtered = list.filter(item => {
      const matchSearch = !this.searchFilter || 
        item.insuredName.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        item.coverNoteNo.toLowerCase().includes(this.searchFilter.toLowerCase()) ||
        item.bankName.toLowerCase().includes(this.searchFilter.toLowerCase());

      const matchStatus = this.statusFilter === 'all' || item.status === this.statusFilter;
      return matchSearch && matchStatus;
    });

    const totalTsiActive = list.filter(i => i.status === 'Aktif').reduce((acc, curr) => acc + (Number(curr.totalTsi) || 0), 0);

    return `
      <div class="space-y-6">
        <!-- Summary Cards for Cover Notes -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Cover Note Terbit</p>
              <h4 class="text-2xl font-bold text-slate-800">${list.length} <span class="text-xs font-normal text-slate-400">dokumen</span></h4>
              <p class="text-[11px] text-cyan-600 font-medium">Arsip Operasional Terpusat</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <i data-lucide="file-check-2" class="w-6 h-6"></i>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Status Aktif (Berjalan)</p>
              <h4 class="text-2xl font-bold text-emerald-600">${list.filter(i => i.status === 'Aktif').length} <span class="text-xs font-normal text-slate-400">nota</span></h4>
              <p class="text-[11px] text-slate-500">Menunggu Polis Definitif</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i data-lucide="clock" class="w-6 h-6"></i>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Penjaminan Sementara</p>
              <h4 class="text-xl font-bold text-slate-800 truncate max-w-[170px]" title="${fmt(totalTsiActive)}">
                ${fmt(totalTsiActive)}
              </h4>
              <p class="text-[11px] text-cyan-600 font-medium">TSI Cover Note Aktif</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <i data-lucide="shield" class="w-6 h-6"></i>
            </div>
          </div>
        </div>

        <!-- Filter and Search Bar -->
        <div class="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div class="relative w-full sm:w-80">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3"></i>
            <input 
              type="text" 
              placeholder="Cari nama tertanggung, nomor CN, atau nama bank..." 
              value="${this.searchFilter}"
              oninput="window.CepatModule.setSearchFilter(this.value)"
              class="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-cyan-500 text-xs"
            />
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button onclick="window.CepatModule.setStatusFilter('all')" class="px-3 py-1.5 rounded-xl font-medium transition ${this.statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Semua (${list.length})
            </button>
            <button onclick="window.CepatModule.setStatusFilter('Aktif')" class="px-3 py-1.5 rounded-xl font-medium transition ${this.statusFilter === 'Aktif' ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Aktif (${list.filter(i => i.status === 'Aktif').length})
            </button>
            <button onclick="window.CepatModule.setStatusFilter('Dikonversi ke Polis')" class="px-3 py-1.5 rounded-xl font-medium transition ${this.statusFilter === 'Dikonversi ke Polis' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
              Telah Terbit Polis
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th class="py-3.5 px-4">Nomor Cover Note</th>
                  <th class="py-3.5 px-4">Tertanggung & Banker's Clause</th>
                  <th class="py-3.5 px-4">Lini Asuransi</th>
                  <th class="py-3.5 px-4">Nilai TSI</th>
                  <th class="py-3.5 px-4">Masa Berlaku</th>
                  <th class="py-3.5 px-4">Status</th>
                  <th class="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="7" class="py-12 text-center text-slate-400">
                      <i data-lucide="inbox" class="w-10 h-10 mx-auto text-slate-300 mb-2"></i>
                      <p>Tidak ada data Cover Note yang cocok dengan pencarian.</p>
                    </td>
                  </tr>
                ` : filtered.map(item => `
                  <tr class="hover:bg-slate-50/80 transition">
                    <td class="py-3.5 px-4">
                      <span class="font-mono font-bold text-cyan-800">${item.coverNoteNo}</span>
                      <span class="block text-[10px] text-slate-400">Terbit: ${item.issuedDate}</span>
                    </td>
                    <td class="py-3.5 px-4">
                      <p class="font-bold text-slate-800">${item.insuredName}</p>
                      <p class="text-[11px] text-cyan-700 font-medium">QQ ${item.bankName}</p>
                      <span class="text-[10px] text-slate-400">${item.bankBranch} · Ref: ${item.creditRefNo || '-'}</span>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="font-medium text-slate-700">${item.productType}</span>
                      <span class="block text-[10px] text-slate-400 truncate max-w-[200px]" title="${item.riskLocation}">${item.riskLocation}</span>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="font-mono font-bold text-slate-800">${fmt(item.totalTsi)}</span>
                      <span class="block text-[10px] text-slate-400">Est. Premi: ${fmt(item.estimatedPremium)}</span>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="font-semibold text-slate-700">${item.validDays} Hari</span>
                      <span class="block text-[10px] text-rose-600 font-mono">s.d. ${item.validUntil}</span>
                    </td>
                    <td class="py-3.5 px-4">
                      <span class="px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'Aktif' 
                          ? 'bg-cyan-100 text-cyan-800 border border-cyan-200' 
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }">
                        ${item.status}
                      </span>
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button onclick="window.CepatModule.previewSavedCoverNote('${item.id}')" title="Cetak / Pratinjau Dokumen" class="p-1.5 rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition">
                          <i data-lucide="printer" class="w-4 h-4"></i>
                        </button>
                        <button onclick="window.CepatModule.convertToSppa('${item.id}')" title="Teruskan ke SPPA Definitif (Modul BUSET)" class="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition">
                          <i data-lucide="file-plus" class="w-4 h-4"></i>
                        </button>
                        <button onclick="window.CepatModule.deleteItem('${item.id}')" title="Hapus Dokumen" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  },

  setSearchFilter(val) {
    this.searchFilter = val;
    window.askrindoApp.renderCurrentRoute();
  },

  setStatusFilter(status) {
    this.statusFilter = status;
    window.askrindoApp.renderCurrentRoute();
  },

  previewSavedCoverNote(id) {
    const item = window.askrindoDB.getCoverNote(id);
    if (!item) return;

    this.formData = { ...item };
    this.setTab('create');
    this.setStep(4);
  },

  convertToSppa(id) {
    const item = window.askrindoDB.getCoverNote(id);
    if (!item) return;

    // Pass data into pending SPPA session
    sessionStorage.setItem('askrindo_pending_sppa_from_kabar', JSON.stringify({
      productType: item.productType,
      riskLocation: item.riskLocation,
      totalTsi: item.totalTsi,
      estimatedPremium: item.estimatedPremium,
      notes: `Dikonversi dari Cover Note ${item.coverNoteNo}. Banker's Clause: ${item.bankName} (${item.bankBranch}).`
    }));

    // Update status in Cover Note
    item.status = 'Dikonversi ke Polis';
    window.askrindoDB.saveCoverNote(item);
    window.askrindoDB.logActivity('CEPAT', 'Konversi ke SPPA', `Cover Note ${item.coverNoteNo} berhasil dialihkan ke penerbitan SPPA modul BUSET.`);

    window.askrindoApp.showToast(`Data Cover Note ${item.coverNoteNo} dialihkan ke modul BUSET untuk penerbitan Polis Definitif!`, 'success');
    window.location.hash = '#/buset';
  },

  deleteItem(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data Cover Note ini?')) {
      window.askrindoDB.deleteCoverNote(id);
      window.askrindoDB.logActivity('CEPAT', 'Hapus Cover Note', `Menghapus arsip Cover Note ID: ${id}`);
      window.askrindoApp.showToast('Data Cover Note berhasil dihapus dari arsip.', 'info');
      window.askrindoApp.renderCurrentRoute();
    }
  }
};
