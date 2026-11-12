/**
 * Askrindo SATU - Dashboard Module
 * Central portal hub displaying all accessible sub-applications, statistics, and quick actions.
 */

window.DashboardModule = {
  render() {
    const user = window.authService.getCurrentUser();
    if (!user) return '';

    const apps = window.SUB_APPS_CATALOG;
    const sppaList = window.askrindoDB.getSppaList();
    const auditLogs = window.askrindoDB.getAuditLogs().slice(0, 5);

    // Calculate quick stats
    const totalSppaCount = sppaList.length;
    const totalTsiValue = sppaList.reduce((acc, curr) => acc + (Number(curr.totalTsi) || 0), 0);
    const formattedTsi = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalTsiValue);

    // Helper for app cards
    const renderAppCard = (appKey) => {
      const app = apps[appKey];
      const hasAccess = window.authService.hasAccess(app.id);

      const colorMap = {
        orange: {
          bg: 'hover:border-orange-500/80 group-hover:text-orange-600',
          badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
          iconBg: 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white',
          btnBg: 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white',
          borderAccent: 'border-l-4 border-l-orange-500'
        },
        blue: {
          bg: 'hover:border-blue-500/80 group-hover:text-blue-600',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
          iconBg: 'bg-gradient-to-tr from-blue-700 to-cyan-500 text-white',
          btnBg: 'bg-gradient-to-r from-blue-700 to-cyan-700 hover:from-blue-800 hover:to-cyan-800 text-white',
          borderAccent: 'border-l-4 border-l-blue-600'
        },
        emerald: {
          bg: 'hover:border-emerald-500/80 group-hover:text-emerald-600',
          badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          iconBg: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white',
          btnBg: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white',
          borderAccent: 'border-l-4 border-l-emerald-600'
        },
        purple: {
          bg: 'hover:border-purple-500/80 group-hover:text-purple-600',
          badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
          iconBg: 'bg-gradient-to-tr from-purple-700 to-indigo-500 text-white',
          btnBg: 'bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white',
          borderAccent: 'border-l-4 border-l-purple-600'
        }
      };

      const styling = colorMap[app.color] || colorMap.blue;

      return `
        <div class="group relative bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${styling.borderAccent} flex flex-col justify-between">
          <div>
            <!-- Header Card -->
            <div class="flex items-start justify-between mb-4">
              <div class="w-14 h-14 rounded-xl flex items-center justify-center ${styling.iconBg} shadow-md shadow-slate-200">
                <i data-lucide="${app.icon}" class="w-7 h-7"></i>
              </div>
              <div class="flex flex-col items-end">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styling.badgeBg} border">
                  ${app.badge}
                </span>
                ${hasAccess 
                  ? `<span class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
                      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Akses Diizinkan
                     </span>`
                  : `<span class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 mt-1">
                      <i data-lucide="lock" class="w-3 h-3 text-slate-400"></i> Akses Terbatas
                     </span>`
                }
              </div>
            </div>

            <!-- Title & Tagline -->
            <div class="mb-3">
              <div class="flex items-baseline gap-2">
                <h3 class="text-2xl font-black text-slate-800 tracking-tight transition-colors ${styling.bg}">
                  ${app.name}
                </h3>
                <span class="text-xs font-medium text-slate-400">· ${app.category}</span>
              </div>
              <p class="text-sm font-semibold text-slate-600 mt-0.5">${app.tagline}</p>
            </div>

            <!-- Description -->
            <p class="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
              ${app.description}
            </p>

            <!-- Feature Tags -->
            <div class="space-y-1.5 mb-6">
              ${app.features.map(f => `
                <div class="flex items-center gap-2 text-xs text-slate-600">
                  <i data-lucide="check" class="w-3.5 h-3.5 text-emerald-500 shrink-0"></i>
                  <span>${f}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Action Button -->
          <div class="pt-4 border-t border-slate-100">
            ${hasAccess ? `
              <a href="${app.route}" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm shadow-sm transition-all duration-200 ${styling.btnBg}">
                <span>Buka Aplikasi ${app.name}</span>
                <i data-lucide="arrow-right" class="w-4 h-4 transition-transform group-hover:translate-x-1"></i>
              </a>
            ` : `
              <button onclick="window.askrindoApp.requestAccessModal('${app.name}')" class="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors">
                <i data-lucide="lock" class="w-4 h-4 text-slate-400"></i>
                <span>Minta Hak Akses</span>
              </button>
            `}
          </div>
        </div>
      `;
    };

    return `
      <div class="space-y-8 animate-fadeIn">
        <!-- Hero Banner Askrindo SATU -->
        <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#002B49] via-[#0A3D62] to-[#002B49] p-8 text-white shadow-xl">
          <div class="absolute -right-10 -bottom-10 w-96 h-96 bg-[#F37021]/15 rounded-full blur-3xl pointer-events-none"></div>
          <div class="absolute right-32 top-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>

          <div class="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div class="max-w-2xl space-y-3">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs text-amber-300 font-medium">
                <span class="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
                <span>Askrindo SATU — Sistem Aplikasi Terpadu</span>
              </div>
              <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Selamat Datang, <span class="text-amber-400">${user.name}</span>
              </h1>
              <p class="text-sm sm:text-base text-slate-200 leading-relaxed">
                Kelola simulasi penjaminan, kalkulasi tarif OJK, analisis rasio finansial, dan penerbitan SPPA dalam satu portal terintegrasi.
              </p>
              <div class="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
                <div class="flex items-center gap-1.5">
                  <i data-lucide="badge-check" class="w-4 h-4 text-emerald-400"></i>
                  <span>${user.role}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <i data-lucide="building" class="w-4 h-4 text-cyan-300"></i>
                  <span>${user.branch}</span>
                </div>
                <div class="flex items-center gap-1.5">
                  <i data-lucide="shield" class="w-4 h-4 text-amber-400"></i>
                  <span>Hak Akses: ${user.allowedApps.length} Modul Aktif</span>
                </div>
              </div>
            </div>

            <!-- Quick Action Shortcut Card -->
            <div class="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl w-full lg:w-auto shrink-0 space-y-3 text-slate-100">
              <div class="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-2">
                <i data-lucide="zap" class="w-4 h-4 text-amber-400"></i>
                <span>Aksi Cepat</span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-xs font-medium">
                <a href="#/kabar" class="flex items-center gap-2 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <i data-lucide="flame" class="w-4 h-4 text-orange-400"></i>
                  <span>Hitung KABAR</span>
                </a>
                <a href="#/bus" class="flex items-center gap-2 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <i data-lucide="file-plus" class="w-4 h-4 text-emerald-400"></i>
                  <span>Buat SPPA Baru</span>
                </a>
                <a href="#/ttk" class="flex items-center gap-2 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <i data-lucide="help-circle" class="w-4 h-4 text-blue-400"></i>
                  <span>Tanya KUR (TTK)</span>
                </a>
                <a href="#/pelaku" class="flex items-center gap-2 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors">
                  <i data-lucide="trending-up" class="w-4 h-4 text-purple-400"></i>
                  <span>Analisis PELAKU</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Penerbitan SPPA</p>
              <h4 class="text-2xl font-bold text-slate-800">${totalSppaCount} <span class="text-xs font-normal text-slate-400">dokumen</span></h4>
              <p class="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <i data-lucide="trending-up" class="w-3 h-3"></i> +12% dari bulan lalu
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i data-lucide="file-check-2" class="w-6 h-6"></i>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Nilai Penjaminan</p>
              <h4 class="text-xl font-bold text-slate-800 truncate max-w-[170px]" title="${formattedTsi}">
                ${formattedTsi}
              </h4>
              <p class="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                <i data-lucide="shield-check" class="w-3 h-3"></i> Portofolio Askrindo
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <i data-lucide="coins" class="w-6 h-6"></i>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Katalog Aplikasi</p>
              <h4 class="text-2xl font-bold text-slate-800">4 <span class="text-xs font-normal text-slate-400">Modul Kerja</span></h4>
              <p class="text-[11px] text-orange-600 font-medium flex items-center gap-1">
                <i data-lucide="layers" class="w-3 h-3"></i> KABAR, TTK, BUSET, PELAKU
              </p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <i data-lucide="grid" class="w-6 h-6"></i>
            </div>
          </div>

          <div class="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex items-center justify-between">
            <div class="space-y-1">
              <p class="text-xs font-medium text-slate-500 uppercase tracking-wider">Status Portal</p>
              <h4 class="text-2xl font-bold text-emerald-600 flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-full bg-emerald-500"></span> Online
              </h4>
              <p class="text-[11px] text-slate-400 font-medium">Sistem Terpadu v2.4 (2026)</p>
            </div>
            <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <i data-lucide="server" class="w-6 h-6"></i>
            </div>
          </div>
        </div>

        <!-- Section Header: Aplikasi-Aplikasi Terpadu -->
        <div class="space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 class="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <i data-lucide="layout-grid" class="w-5 h-5 text-orange-500"></i>
                <span>Katalog Aplikasi Askrindo SATU</span>
              </h2>
              <p class="text-xs text-slate-500 mt-0.5">Pilih aplikasi kerja terpadu di bawah untuk langsung menuju modul kerja.</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-slate-400">Menampilkan 4 Aplikasi Aktif</span>
            </div>
          </div>

          <!-- Application Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            ${renderAppCard('kabar')}
            ${renderAppCard('ttk')}
            ${renderAppCard('bus')}
            ${renderAppCard('pelaku')}
          </div>
        </div>

        <!-- Section: Tambah / Ekstensi Aplikasi Mendatang ("dsb") -->
        <div class="bg-gradient-to-r from-slate-100 via-white to-slate-100 rounded-2xl p-6 border-2 border-dashed border-slate-300 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0">
              <i data-lucide="sparkles" class="w-6 h-6 text-orange-500"></i>
            </div>
            <div>
              <h4 class="text-base font-bold text-slate-800">Butuh Aplikasi atau Modul Kerja Baru?</h4>
              <p class="text-xs text-slate-500 mt-0.5">
                Arsitektur Askrindo SATU dirancang modular. Fitur seperti Sistem Monitoring Klaim, Dashboard Suretyship, dan Portofolio Reasuransi dapat diintegrasikan dengan mudah.
              </p>
            </div>
          </div>
          <button onclick="window.askrindoApp.requestNewAppModal()" class="px-5 py-2.5 rounded-xl font-semibold text-xs text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm shrink-0 transition-colors">
            Ajukan Modul Aplikasi Baru
          </button>
        </div>

        <!-- Bottom Grid: Aktivitas Terkini & Informasi Operasional -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Kolom 1-2: Aktivitas Terkini -->
          <div class="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <i data-lucide="activity" class="w-5 h-5 text-blue-600"></i>
                <h3 class="font-bold text-slate-800 text-base">Aktivitas Terkini di Portal</h3>
              </div>
              <a href="#/admin" class="text-xs font-semibold text-blue-600 hover:underline">Lihat Semua Audit Log &rarr;</a>
            </div>

            <div class="divide-y divide-slate-100">
              ${auditLogs.map(log => `
                <div class="py-3 flex items-start justify-between gap-4">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 text-xs font-bold">
                      ${log.subApp}
                    </div>
                    <div>
                      <p class="text-xs font-semibold text-slate-800">${log.action}</p>
                      <p class="text-xs text-slate-500 mt-0.5">${log.details}</p>
                      <p class="text-[10px] text-slate-400 mt-1">Oleh: <span class="font-medium text-slate-600">${log.user}</span> (${log.role})</p>
                    </div>
                  </div>
                  <span class="text-[10px] text-slate-400 whitespace-nowrap">
                    ${new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Kolom 3: Pengumuman & Bantuan Askrindo -->
          <div class="bg-gradient-to-b from-white to-slate-50 rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div class="flex items-center gap-2 text-slate-800">
              <i data-lucide="bell-ring" class="w-5 h-5 text-amber-500"></i>
              <h3 class="font-bold text-base">Pemberitahuan Resmi</h3>
            </div>

            <div class="space-y-3">
              <div class="p-3.5 rounded-xl bg-orange-50 border border-orange-200/70 text-xs text-orange-900 space-y-1">
                <p class="font-bold flex items-center gap-1.5">
                  <i data-lucide="info" class="w-4 h-4 text-orange-600"></i>
                  Pembaruan Tarif Kebakaran OJK
                </p>
                <p class="text-[11px] text-orange-800 leading-relaxed">
                  Perhitungan di modul KABAR telah disesuaikan dengan Surat Edaran OJK No. 6/SEOJK.05/2017 mengenai penetapan tarif premi lini asuransi harta benda.
                </p>
              </div>

              <div class="p-3.5 rounded-xl bg-blue-50 border border-blue-200/70 text-xs text-blue-900 space-y-1">
                <p class="font-bold flex items-center gap-1.5">
                  <i data-lucide="check-circle" class="w-4 h-4 text-blue-600"></i>
                  Suku Bunga Subsidi KUR 2026
                </p>
                <p class="text-[11px] text-blue-800 leading-relaxed">
                  Skema KUR Super Mikro tetap 3% efektif per tahun. KUR Mikro dan KUR Kecil 6% untuk nasabah pertama kali. Gunakan modul TTK untuk simulasi.
                </p>
              </div>

              <div class="pt-2 text-center">
                <p class="text-[11px] text-slate-500">Butuh bantuan teknis portal?</p>
                <p class="text-xs font-semibold text-slate-700">Call Center Askrindo: 1500-405</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
