/**
 * Askrindo SATU - BUSET Module (Buat SPPA Elektronik Terpadu)
 * Digital Insurance Closing Application Form (SPPA) Generator with QR code and PDF print.
 */

window.BusModule = {
  currentTab: 'create', // 'create' | 'list'
  currentStep: 1, // 1 to 4
  formData: {
    insuredType: 'Badan Usaha (PT)',
    insuredName: '',
    nikNpwp: '',
    phone: '',
    email: '',
    address: '',
    productType: 'Asuransi Kebakaran Standar Indonesia (FLEXAS)',
    riskLocation: '',
    periodStart: new Date().toISOString().split('T')[0],
    periodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    totalTsi: 1500000000,
    estimatedPremium: 2500000,
    channelSource: 'Direct Sales / Pemasaran Kantor Cabang',
    specialClauses: 'Klausula Standar Kebakaran, RSMDCC 4.1A, Banjir TSFWD'
  },
  generatedSppa: null,

  render() {
    const user = window.authService.getCurrentUser();
    if (!user || !window.authService.hasAccess('bus')) {
      return window.askrindoApp.renderUnauthorized('BUSET');
    }

    // Check if there is pending data from KABAR
    const pendingFromKabar = sessionStorage.getItem('askrindo_pending_sppa_from_kabar');
    if (pendingFromKabar && !this.formData.insuredName) {
      try {
        const parsed = JSON.parse(pendingFromKabar);
        this.formData.productType = parsed.productType || this.formData.productType;
        this.formData.riskLocation = parsed.riskLocation || this.formData.riskLocation;
        this.formData.totalTsi = parsed.totalTsi || this.formData.totalTsi;
        this.formData.estimatedPremium = parsed.estimatedPremium || this.formData.estimatedPremium;
        this.formData.specialClauses = parsed.notes || this.formData.specialClauses;
      } catch (e) {}
    }

    const sppaList = window.askrindoDB.getSppaList();

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Module Header -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-l-emerald-600">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <i data-lucide="file-text" class="w-6 h-6"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-black text-slate-800 tracking-tight">BUSET</h1>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Buat SPPA Elektronik Terpadu
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Penerbitan Surat Permohonan Penutupan Asuransi secara digital, validasi tertanggung, dan cetak dokumen resmi berstandar Askrindo.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.BusModule.setTab('create')" class="px-3.5 py-2 rounded-xl text-xs font-semibold transition ${this.currentTab === 'create' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
              + Formulir SPPA Baru
            </button>
            <button onclick="window.BusModule.setTab('list')" class="px-3.5 py-2 rounded-xl text-xs font-semibold transition ${this.currentTab === 'list' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
              Daftar Riwayat SPPA (${sppaList.length})
            </button>
          </div>
        </div>

        <!-- Admin Testing Mode Notice -->
        <div class="bg-gradient-to-r from-amber-500 to-emerald-600 text-white p-3.5 rounded-2xl flex items-center justify-between text-xs shadow-md shadow-amber-500/15">
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

        <!-- Notification if forwarded from KABAR -->
        ${pendingFromKabar ? `
          <div class="p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-between gap-3 text-xs text-orange-900">
            <div class="flex items-center gap-2">
              <i data-lucide="check-check" class="w-5 h-5 text-orange-600"></i>
              <span>Data perhitungan premi asuransi kebakaran dari modul <b>KABAR</b> berhasil diintegrasikan ke formulir ini!</span>
            </div>
            <button onclick="sessionStorage.removeItem('askrindo_pending_sppa_from_kabar'); window.askrindoApp.renderCurrentRoute();" class="text-orange-700 hover:underline font-bold text-[11px]">
              Tutup Notifikasi
            </button>
          </div>
        ` : ''}

        <!-- Tab Body -->
        <div>
          ${this.currentTab === 'create' ? this.renderCreateWizard() : this.renderSppaList(sppaList)}
        </div>
      </div>
    `;
  },

  setTab(tab) {
    this.currentTab = tab;
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
        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div class="grid grid-cols-4 gap-2 text-center text-xs">
            <div class="flex flex-col items-center gap-1.5 p-2 rounded-xl ${s >= 1 ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-400'}">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${s >= 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}">1</span>
              <span>Tertanggung</span>
            </div>
            <div class="flex flex-col items-center gap-1.5 p-2 rounded-xl ${s >= 2 ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-400'}">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${s >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}">2</span>
              <span>Objek & Lini Asuransi</span>
            </div>
            <div class="flex flex-col items-center gap-1.5 p-2 rounded-xl ${s >= 3 ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-400'}">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${s >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}">3</span>
              <span>Nilai TSI & Premi</span>
            </div>
            <div class="flex flex-col items-center gap-1.5 p-2 rounded-xl ${s >= 4 ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-400'}">
              <span class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${s >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}">4</span>
              <span>Preview & Terbitkan</span>
            </div>
          </div>
        </div>

        <!-- Wizard Step Content -->
        <div class="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          ${s === 1 ? this.renderStep1() : ''}
          ${s === 2 ? this.renderStep2() : ''}
          ${s === 3 ? this.renderStep3() : ''}
          ${s === 4 ? this.renderStep4() : ''}
        </div>
      </div>
    `;
  },

  renderStep1() {
    return `
      <div class="space-y-4">
        <div class="border-b pb-3 border-slate-100">
          <h3 class="text-base font-bold text-slate-800">Langkah 1: Identitas Calon Tertanggung</h3>
          <p class="text-xs text-slate-500">Lengkapi data pribadi atau profil badan usaha yang mengajukan penutupan asuransi.</p>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Kategori Tertanggung</label>
            <div class="flex gap-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="insuredType" value="Badan Usaha (PT)" ${this.formData.insuredType.includes('PT') ? 'checked' : ''} onchange="window.BusModule.formData.insuredType=this.value" class="text-emerald-600" />
                <span>Badan Usaha (PT / CV / BUMN / Koperasi)</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="insuredType" value="Perorangan" ${this.formData.insuredType === 'Perorangan' ? 'checked' : ''} onchange="window.BusModule.formData.insuredType=this.value" class="text-emerald-600" />
                <span>Perorangan / Pribadi</span>
              </label>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nama Lengkap Tertanggung / Perusahaan *</label>
              <input type="text" id="step1-name" value="${this.formData.insuredName || 'PT Cakrawala Mega Perkasa'}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500" placeholder="Contoh: PT Cakrawala Mega Perkasa" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nomor NPWP / NIK *</label>
              <input type="text" id="step1-nik" value="${this.formData.nikNpwp || '03.881.992.4-015.000'}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono" placeholder="16 digit NIK atau NPWP" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nomor Telepon / WhatsApp *</label>
              <input type="text" id="step1-phone" value="${this.formData.phone || '0812-9988-7766'}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500" placeholder="0812..." />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Alamat Email Korespondensi</label>
              <input type="email" id="step1-email" value="${this.formData.email || 'direksi@cakrawala.co.id'}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500" placeholder="email@perusahaan.co.id" />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Alamat Domisili Tertanggung</label>
            <textarea id="step1-address" rows="2" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500">${this.formData.address || 'Gedung Menara Cakrawala Lt. 18, Jl. Jenderal Sudirman Kav. 52, Jakarta Selatan'}</textarea>
          </div>
        </div>

        <div class="flex justify-end pt-4 border-t border-slate-100">
          <button onclick="window.BusModule.saveStep1()" class="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-2">
            <span>Lanjut ke Langkah 2</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  saveStep1() {
    this.formData.insuredName = document.getElementById('step1-name').value;
    this.formData.nikNpwp = document.getElementById('step1-nik').value;
    this.formData.phone = document.getElementById('step1-phone').value;
    this.formData.email = document.getElementById('step1-email').value;
    this.formData.address = document.getElementById('step1-address').value;
    this.setStep(2);
  },

  renderStep2() {
    return `
      <div class="space-y-4">
        <div class="border-b pb-3 border-slate-100">
          <h3 class="text-base font-bold text-slate-800">Langkah 2: Objek & Lini Produk Asuransi</h3>
          <p class="text-xs text-slate-500">Pilih lini produk penutupan asuransi atau penjaminan kredit yang diajukan.</p>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-semibold text-slate-700 mb-1">Lini Produk Asuransi Askrindo</label>
            <select id="step2-product" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white">
              <option value="Asuransi Kebakaran Standar Indonesia (FLEXAS)" ${this.formData.productType.includes('Kebakaran') ? 'selected' : ''}>Asuransi Kebakaran Standar Indonesia (FLEXAS)</option>
              <option value="Property All Risks (PAR)" ${this.formData.productType.includes('PAR') ? 'selected' : ''}>Property All Risks (PAR)</option>
              <option value="Surety Bond - Jaminan Pelaksanaan (Performance Bond)" ${this.formData.productType.includes('Surety') ? 'selected' : ''}>Surety Bond - Jaminan Pelaksanaan (Performance Bond)</option>
              <option value="Kontra Bank Garansi (KBG)" ${this.formData.productType.includes('KBG') ? 'selected' : ''}>Kontra Bank Garansi (KBG)</option>
              <option value="Asuransi Kendaraan Bermotor (Comprehensive)" ${this.formData.productType.includes('Kendaraan') ? 'selected' : ''}>Asuransi Kendaraan Bermotor (Comprehensive)</option>
              <option value="Penjaminan Kredit Usaha Rakyat (KUR)" ${this.formData.productType.includes('KUR') ? 'selected' : ''}>Penjaminan Kredit Usaha Rakyat (KUR)</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Periode Pertanggungan Mulai</label>
              <input type="date" id="step2-start" value="${this.formData.periodStart}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Periode Pertanggungan Berakhir</label>
              <input type="date" id="step2-end" value="${this.formData.periodEnd}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500" />
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Lokasi Objek Pertanggungan / Risiko</label>
            <input type="text" id="step2-location" value="${this.formData.riskLocation || 'Komplek Pergudangan Kamal Muara Blok C No. 5, Jakarta Utara'}" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500" />
          </div>
        </div>

        <div class="flex justify-between pt-4 border-t border-slate-100">
          <button onclick="window.BusModule.setStep(1)" class="px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Kembali
          </button>
          <button onclick="window.BusModule.saveStep2()" class="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-2">
            <span>Lanjut ke Langkah 3</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  saveStep2() {
    this.formData.productType = document.getElementById('step2-product').value;
    this.formData.periodStart = document.getElementById('step2-start').value;
    this.formData.periodEnd = document.getElementById('step2-end').value;
    this.formData.riskLocation = document.getElementById('step2-location').value;
    this.setStep(3);
  },

  renderStep3() {
    return `
      <div class="space-y-4">
        <div class="border-b pb-3 border-slate-100">
          <h3 class="text-base font-bold text-slate-800">Langkah 3: Nilai Pertanggungan & Klausula</h3>
          <p class="text-xs text-slate-500">Tentukan nilai pertanggungan (TSI), estimasi premi, dan saluran kerja sama.</p>
        </div>

        <div class="space-y-3 text-xs">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nilai Pertanggungan Total (TSI)</label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-slate-400 font-semibold">Rp</span>
                <input type="number" id="step3-tsi" value="${this.formData.totalTsi}" class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold" />
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Estimasi Premi Bruto</label>
              <div class="relative">
                <span class="absolute left-3 top-2 text-slate-400 font-semibold">Rp</span>
                <input type="number" id="step3-premium" value="${this.formData.estimatedPremium}" class="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 font-mono font-bold text-emerald-700" />
              </div>
            </div>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Saluran Distribusi / Sumber Bisnis</label>
            <select id="step3-channel" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500 bg-white">
              <option value="Direct Sales / Pemasaran Kantor Cabang">Direct Sales Cabang Askrindo</option>
              <option value="Pialang Asuransi / Broker">Pialang Asuransi (Insurance Broker)</option>
              <option value="Kemitraan Bank BUMN (BRI / Mandiri / BNI / BSI)">Mitra Bank BUMN</option>
              <option value="Agen Resmi Askrindo">Agen Resmi Askrindo</option>
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-700 mb-1">Klausula Khusus / Endorsement yang Diminta</label>
            <textarea id="step3-clauses" rows="3" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-emerald-500">${this.formData.specialClauses}</textarea>
          </div>
        </div>

        <div class="flex justify-between pt-4 border-t border-slate-100">
          <button onclick="window.BusModule.setStep(2)" class="px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Kembali
          </button>
          <button onclick="window.BusModule.saveStep3()" class="px-6 py-2.5 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-2">
            <span>Generate & Preview Dokumen SPPA</span>
            <i data-lucide="file-check" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;
  },

  saveStep3() {
    this.formData.totalTsi = parseFloat(document.getElementById('step3-tsi').value || '0');
    this.formData.estimatedPremium = parseFloat(document.getElementById('step3-premium').value || '0');
    this.formData.channelSource = document.getElementById('step3-channel').value;
    this.formData.specialClauses = document.getElementById('step3-clauses').value;
    this.setStep(4);
  },

  renderStep4() {
    const f = this.formData;
    const user = window.authService.getCurrentUser();
    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
    const docNo = 'SPPA-2026-' + Math.floor(1000 + Math.random() * 9000);

    return `
      <div class="space-y-6">
        <!-- Top Action Bar for Document -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 no-print">
          <div class="flex items-center gap-2 text-emerald-900 text-xs">
            <i data-lucide="check-circle-2" class="w-5 h-5 text-emerald-600 shrink-0"></i>
            <span>Draf Surat Permohonan Penutupan Asuransi telah berhasil dibuat. Silakan periksa atau cetak ke PDF.</span>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="window.print()" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm">
              <i data-lucide="printer" class="w-4 h-4"></i>
              <span>Cetak / Download PDF</span>
            </button>
            <button onclick="window.BusModule.finalizeAndSave('${docNo}')" class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 transition flex items-center gap-1.5 shadow-sm">
              <i data-lucide="save" class="w-4 h-4"></i>
              <span>Simpan ke Database SPPA</span>
            </button>
          </div>
        </div>

        <!-- The Formal Printable SPPA Document -->
        <div class="printable-document bg-white border border-slate-300 rounded-2xl p-8 space-y-6 shadow-sm">
          <!-- Kop Surat Askrindo -->
          <div class="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div class="flex items-center gap-4">
              <img src="assets/images/logo-corporate.png" alt="Askrindo Logo" class="h-14 object-contain" />
              <div>
                <h2 class="text-base font-black text-[#002B49] tracking-tight">PT ASURANSI KREDIT INDONESIA</h2>
                <p class="text-[11px] text-slate-600">Sistem Aplikasi Terpadu</p>
                <p class="text-[10px] text-slate-400">Kantor Cabang Penerbit: ${user.branch}</p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                SURAT PERMOHONAN PENUTUPAN ASURANSI
              </span>
              <p class="text-xs font-mono font-bold text-slate-800 mt-2">${docNo}</p>
              <p class="text-[10px] text-slate-400">Tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
            </div>
          </div>

          <!-- Bagian I: Data Pemohon -->
          <div class="space-y-2 text-xs">
            <h4 class="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded">I. DATA CALON TERTANGGUNG</h4>
            <div class="grid grid-cols-2 gap-y-2 px-3">
              <div><span class="text-slate-400">Kategori Pemohon:</span> <span class="font-semibold text-slate-800">${f.insuredType}</span></div>
              <div><span class="text-slate-400">Nama Tertanggung:</span> <span class="font-bold text-slate-900">${f.insuredName}</span></div>
              <div><span class="text-slate-400">NPWP / NIK:</span> <span class="font-mono text-slate-800">${f.nikNpwp}</span></div>
              <div><span class="text-slate-400">No. Telepon:</span> <span class="text-slate-800">${f.phone}</span></div>
              <div class="col-span-2"><span class="text-slate-400">Alamat Domisili:</span> <span class="text-slate-800">${f.address}</span></div>
            </div>
          </div>

          <!-- Bagian II: Objek & Produk -->
          <div class="space-y-2 text-xs">
            <h4 class="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded">II. OBJEK & PERTANGGUNGAN ASURANSI</h4>
            <div class="grid grid-cols-2 gap-y-2 px-3">
              <div><span class="text-slate-400">Lini Produk:</span> <span class="font-bold text-emerald-800">${f.productType}</span></div>
              <div><span class="text-slate-400">Saluran Pemasaran:</span> <span class="text-slate-800">${f.channelSource}</span></div>
              <div><span class="text-slate-400">Periode Awal:</span> <span class="text-slate-800">${f.periodStart}</span></div>
              <div><span class="text-slate-400">Periode Akhir:</span> <span class="text-slate-800">${f.periodEnd}</span></div>
              <div class="col-span-2"><span class="text-slate-400">Lokasi Risiko:</span> <span class="text-slate-800 font-semibold">${f.riskLocation}</span></div>
            </div>
          </div>

          <!-- Bagian III: Nilai Pertanggungan -->
          <div class="space-y-2 text-xs">
            <h4 class="font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded">III. NILAI PERTANGGUNGAN (TSI) & ESTIMASI PREMI</h4>
            <table class="w-full border border-slate-200 mt-1">
              <tr class="border-b bg-slate-50">
                <th class="py-2 px-3 text-left">Komponen</th>
                <th class="py-2 px-3 text-right">Nilai Rupiah</th>
              </tr>
              <tr class="border-b">
                <td class="py-2 px-3">Total Sum Insured (TSI Pertanggungan)</td>
                <td class="py-2 px-3 text-right font-mono font-bold">${fmt(f.totalTsi)}</td>
              </tr>
              <tr class="border-b">
                <td class="py-2 px-3">Estimasi Premi Bruto</td>
                <td class="py-2 px-3 text-right font-mono font-bold text-emerald-700">${fmt(f.estimatedPremium)}</td>
              </tr>
              <tr>
                <td class="py-2 px-3 text-slate-500">Klausula Khusus:</td>
                <td class="py-2 px-3 text-right text-slate-700">${f.specialClauses}</td>
              </tr>
            </table>
          </div>

          <!-- Kolom Tanda Tangan -->
          <div class="grid grid-cols-2 gap-8 pt-8 text-xs text-center">
            <div class="space-y-16">
              <p class="font-semibold text-slate-700">Calon Tertanggung,</p>
              <div>
                <p class="font-bold underline text-slate-900">${f.insuredName}</p>
                <p class="text-[10px] text-slate-400">Cap & Tanda Tangan Pemohon</p>
              </div>
            </div>

            <div class="space-y-16">
              <p class="font-semibold text-slate-700">Petugas Pemasaran / Underwriting Askrindo,</p>
              <div>
                <p class="font-bold underline text-slate-900">${user.name}</p>
                <p class="text-[10px] text-slate-400">NIP: ${user.nip} (${user.role})</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between pt-2 no-print">
          <button onclick="window.BusModule.setStep(3)" class="px-5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Kembali Ubah Data
          </button>
        </div>
      </div>
    `;
  },

  finalizeAndSave(docNo) {
    const user = window.authService.getCurrentUser();
    const newSppa = {
      id: docNo,
      date: new Date().toISOString().split('T')[0],
      insuredName: this.formData.insuredName,
      insuredType: this.formData.insuredType,
      nikNpwp: this.formData.nikNpwp,
      phone: this.formData.phone,
      email: this.formData.email,
      address: this.formData.address,
      productType: this.formData.productType,
      periodStart: this.formData.periodStart,
      periodEnd: this.formData.periodEnd,
      riskLocation: this.formData.riskLocation,
      totalTsi: this.formData.totalTsi,
      estimatedPremium: this.formData.estimatedPremium,
      status: 'Underwriting Review',
      registeredBy: user.name,
      branch: user.branch
    };

    window.askrindoDB.saveSppa(newSppa);
    window.askrindoDB.logActivity('BUSET', 'Penerbitan SPPA', `Menerbitkan SPPA nomor ${docNo} untuk tertanggung ${this.formData.insuredName}`);
    
    // Clear pending session
    sessionStorage.removeItem('askrindo_pending_sppa_from_kabar');

    window.askrindoApp.showToast(`SPPA nomor ${docNo} berhasil didaftarkan ke arsip!`, 'success');
    this.setTab('list');
  },

  // --- TAB 2: SPPA LIST ---
  renderSppaList(sppaList) {
    const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

    return `
      <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 class="text-base font-bold text-slate-800">Daftar Arsip & Registrasi SPPA</h3>
            <p class="text-xs text-slate-500">Seluruh berkas permohonan penutupan asuransi yang tersimpan di sistem Askrindo SATU.</p>
          </div>
          <button onclick="window.BusModule.setStep(1); window.BusModule.setTab('create');" class="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-sm">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>Buat SPPA Baru</span>
          </button>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">No. Registrasi</th>
                <th class="py-3 px-4">Tertanggung</th>
                <th class="py-3 px-4">Produk Asuransi</th>
                <th class="py-3 px-4 text-right">Nilai TSI</th>
                <th class="py-3 px-4 text-right">Estimasi Premi</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${sppaList.map(sppa => `
                <tr class="hover:bg-slate-50/70 transition">
                  <td class="py-3 px-4">
                    <span class="font-mono font-bold text-slate-800">${sppa.id}</span>
                    <p class="text-[10px] text-slate-400">${sppa.date}</p>
                  </td>
                  <td class="py-3 px-4">
                    <p class="font-bold text-slate-800">${sppa.insuredName}</p>
                    <p class="text-[11px] text-slate-400">${sppa.insuredType}</p>
                  </td>
                  <td class="py-3 px-4 text-slate-700">
                    <span class="line-clamp-1">${sppa.productType}</span>
                    <p class="text-[10px] text-slate-400">${sppa.riskLocation || '-'}</p>
                  </td>
                  <td class="py-3 px-4 text-right font-mono font-semibold text-slate-800">
                    ${fmt(sppa.totalTsi)}
                  </td>
                  <td class="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                    ${fmt(sppa.estimatedPremium)}
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      sppa.status === 'Approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      sppa.status === 'Underwriting Review' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-slate-100 text-slate-700'
                    }">
                      ${sppa.status}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <button onclick="window.BusModule.viewSavedSppa('${sppa.id}')" title="Lihat Dokumen Lengkap" class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition">
                      <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  viewSavedSppa(sppaId) {
    const list = window.askrindoDB.getSppaList();
    const sppa = list.find(s => s.id === sppaId);
    if (!sppa) return;

    this.formData = {
      insuredType: sppa.insuredType,
      insuredName: sppa.insuredName,
      nikNpwp: sppa.nikNpwp,
      phone: sppa.phone,
      email: sppa.email,
      address: sppa.address,
      productType: sppa.productType,
      periodStart: sppa.periodStart,
      periodEnd: sppa.periodEnd,
      riskLocation: sppa.riskLocation,
      totalTsi: sppa.totalTsi,
      estimatedPremium: sppa.estimatedPremium,
      channelSource: 'Direct Sales Cabang Askrindo',
      specialClauses: 'Klausula Standar Askrindo'
    };
    this.currentStep = 4;
    this.currentTab = 'create';
    window.askrindoApp.renderCurrentRoute();
  }
};
