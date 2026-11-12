/**
 * Askrindo SATU - Core Application Router & Shell
 * Handles hash navigation, layout rendering, modals, command palette, and UI state.
 */

class AskrindoApp {
  constructor() {
    this.currentRoute = '#/dashboard';
    this.sidebarCollapsed = false;
    this.init();
  }

  init() {
    // Listen to hash changes
    window.addEventListener('hashchange', () => this.handleRouting());

    // Listen to auth state changes
    window.addEventListener('askrindo:auth-changed', () => this.handleRouting());

    // Listen to Supabase cloud sync events
    window.addEventListener('askrindo:db-synced', () => {
      this.updateCloudPill();
      this.renderCurrentRoute();
    });
    window.addEventListener('askrindo:cloud-status', () => {
      this.updateCloudPill();
    });

    // Keyboard shortcut for command palette (Ctrl+K or Cmd+K)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      }
      if (e.key === 'Escape') {
        this.closeAllModals();
      }
    });

    // Initial route handling
    this.handleRouting();
  }

  handleRouting() {
    let hash = window.location.hash || '#/dashboard';
    const isAuth = window.authService.isAuthenticated();

    if (!isAuth) {
      if (hash !== '#/login') {
        window.location.hash = '#/login';
        return;
      }
      this.renderLoginPage();
      return;
    }

    // If authenticated and tries to go to login, redirect to dashboard
    if (hash === '#/login' || hash === '' || hash === '#/') {
      window.location.hash = '#/dashboard';
      return;
    }

    this.currentRoute = hash;
    this.renderAppShell();
    this.renderCurrentRoute();
  }

  // Render standard application shell (Sidebar, Topbar, Content area)
  renderAppShell() {
    const root = document.getElementById('app-root');
    if (!root) return;

    // Check if shell already rendered
    if (document.getElementById('app-sidebar')) {
      this.updateActiveNavs();
      return;
    }

    const user = window.authService.getCurrentUser();
    const canAdmin = window.authService.canAccessAdmin();
    const settings = window.askrindoDB.getSettings();

    root.innerHTML = `
      <div class="min-h-screen flex flex-col bg-[#F4F7FB]">
        <!-- Running Announcement Ticker -->
        ${settings.notificationBanner ? `
          <div class="bg-[#002B49] text-white text-[11px] py-1 px-4 flex items-center justify-between border-b border-white/10 no-print">
            <div class="flex items-center gap-2 overflow-hidden w-full">
              <span class="px-2 py-0.5 rounded font-extrabold bg-[#F37021] text-white text-[9px] uppercase tracking-wider shrink-0">Info SATU</span>
              <div class="ticker-wrap w-full">
                <span class="ticker-content text-slate-200">
                  ${settings.notificationBanner} &nbsp; • &nbsp; Hotline Cabang Askrindo 24/7: 1500-405 &nbsp; • &nbsp; PT Asuransi Kredit Indonesia terdaftar dan diawasi oleh OJK.
                </span>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="flex flex-1 overflow-hidden">
          <!-- Left Sidebar -->
          <aside id="app-sidebar" class="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-all duration-300 z-30 no-print ${this.sidebarCollapsed ? '-ml-64 lg:ml-0 lg:w-20' : ''}">
            <div class="p-4 space-y-6">
              <!-- Sidebar Brand Header -->
              <div class="flex items-center justify-between px-2">
                <a href="#/dashboard" class="flex items-center gap-3 group">
                  <img src="assets/images/logo-icon.png" alt="A" class="w-9 h-9 object-contain" />
                  <div class="sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                    <h2 class="font-extrabold text-[#002B49] text-sm tracking-tight leading-tight flex items-center gap-1.5">
                      <span>ASKRINDO</span>
                      <span class="text-[#F37021] font-black">SATU</span>
                    </h2>
                    <p class="text-[10px] text-slate-400 font-medium">Sistem Aplikasi Terpadu</p>
                  </div>
                </a>
              </div>

              <!-- Navigation Links -->
              <nav class="space-y-6 text-xs font-semibold">
                <!-- Section 1: Utama -->
                <div class="space-y-1">
                  <p class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">Portal Utama</p>
                  <a href="#/dashboard" id="nav-dashboard" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                    <i data-lucide="layout-dashboard" class="w-4 h-4 text-slate-500"></i>
                    <span class="sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">Beranda Terpadu</span>
                  </a>
                </div>

                <!-- Section 2: Aplikasi Askrindo SATU -->
                <div class="space-y-1">
                  <p class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">Aplikasi-Aplikasi Terpadu</p>
                  
                  <!-- KABAR -->
                  <a href="#/kabar" id="nav-kabar" class="flex items-center justify-between px-3 py-2.5 rounded-xl transition text-slate-600 hover:text-orange-600 hover:bg-orange-50">
                    <div class="flex items-center gap-3">
                      <i data-lucide="flame" class="w-4 h-4 text-orange-500"></i>
                      <div class="sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                        <span class="font-bold">KABAR</span>
                        <span class="text-[10px] block font-normal text-slate-400">Asuransi Kebakaran</span>
                      </div>
                    </div>
                    ${!window.authService.hasAccess('kabar') ? `<i data-lucide="lock" class="w-3 h-3 text-slate-300"></i>` : ''}
                  </a>

                  <!-- TTK -->
                  <a href="#/ttk" id="nav-ttk" class="flex items-center justify-between px-3 py-2.5 rounded-xl transition text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                    <div class="flex items-center gap-3">
                      <i data-lucide="help-circle" class="w-4 h-4 text-blue-500"></i>
                      <div class="sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                        <span class="font-bold">TTK</span>
                        <span class="text-[10px] block font-normal text-slate-400">Tanya-Tanya KUR</span>
                      </div>
                    </div>
                    ${!window.authService.hasAccess('ttk') ? `<i data-lucide="lock" class="w-3 h-3 text-slate-300"></i>` : ''}
                  </a>

                  <!-- BUS -->
                  <a href="#/bus" id="nav-bus" class="flex items-center justify-between px-3 py-2.5 rounded-xl transition text-slate-600 hover:text-emerald-600 hover:bg-emerald-50">
                    <div class="flex items-center gap-3">
                      <i data-lucide="file-text" class="w-4 h-4 text-emerald-500"></i>
                      <div class="sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                        <span class="font-bold">BUS</span>
                        <span class="text-[10px] block font-normal text-slate-400">Buat SPPA</span>
                      </div>
                    </div>
                    ${!window.authService.hasAccess('bus') ? `<i data-lucide="lock" class="w-3 h-3 text-slate-300"></i>` : ''}
                  </a>

                  <!-- PELAKU -->
                  <a href="#/pelaku" id="nav-pelaku" class="flex items-center justify-between px-3 py-2.5 rounded-xl transition text-slate-600 hover:text-purple-600 hover:bg-purple-50">
                    <div class="flex items-center gap-3">
                      <i data-lucide="calculator" class="w-4 h-4 text-purple-500"></i>
                      <div class="sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                        <span class="font-bold">PELAKU</span>
                        <span class="text-[10px] block font-normal text-slate-400">Laporan Keuangan</span>
                      </div>
                    </div>
                    ${!window.authService.hasAccess('pelaku') ? `<i data-lucide="lock" class="w-3 h-3 text-slate-300"></i>` : ''}
                  </a>
                </div>

                <!-- Section 3: Administrasi -->
                ${canAdmin ? `
                  <div class="space-y-1">
                    <p class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">Administrasi & User</p>
                    <a href="#/admin" id="nav-admin" class="flex items-center gap-3 px-3 py-2.5 rounded-xl transition text-slate-600 hover:text-amber-700 hover:bg-amber-50">
                      <i data-lucide="shield-check" class="w-4 h-4 text-amber-500"></i>
                      <span class="sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">Web Admin Portal</span>
                    </a>
                  </div>
                ` : ''}
              </nav>
            </div>

            <!-- Bottom User Profile Card -->
            <div class="p-3 border-t border-slate-200">
              <div class="p-2.5 rounded-2xl bg-slate-50 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2.5 min-w-0">
                  <img src="${user.avatar}" alt="${user.name}" class="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                  <div class="min-w-0 sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                    <p class="text-xs font-bold text-slate-800 truncate">${user.name}</p>
                    <p class="text-[10px] text-slate-400 truncate">${user.role}</p>
                  </div>
                </div>
                <button onclick="window.authService.logout()" title="Keluar / Logout" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0">
                  <i data-lucide="log-out" class="w-4 h-4"></i>
                </button>
              </div>
            </div>
          </aside>

          <!-- Main Layout Column -->
          <div class="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <!-- Topbar -->
            <header id="app-topbar" class="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 no-print">
              <div class="flex items-center gap-3">
                <button onclick="window.askrindoApp.toggleSidebar()" class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition">
                  <i data-lucide="menu" class="w-5 h-5"></i>
                </button>

                <!-- Breadcrumb -->
                <div id="app-breadcrumb" class="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
                  <span>Askrindo SATU</span>
                  <span>/</span>
                  <span id="breadcrumb-current" class="text-slate-800 font-bold">Beranda</span>
                </div>
              </div>

              <!-- Center: Command Palette Trigger Button -->
              <button onclick="window.askrindoApp.openCommandPalette()" class="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs text-slate-500 transition w-72 justify-between">
                <div class="flex items-center gap-2">
                  <i data-lucide="search" class="w-3.5 h-3.5"></i>
                  <span>Pencarian Cepat Modul...</span>
                </div>
                <kbd class="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px] text-slate-600">Ctrl K</kbd>
              </button>

              <!-- Right: Alerts, Branch, User Profile -->
              <div class="flex items-center gap-2 sm:gap-3">
                <!-- Supabase Cloud DB Status Pill -->
                <button onclick="window.askrindoApp.showCloudDbModal()" id="topbar-cloud-pill" title="Status Cloud Database Supabase" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition ${
                  window.askrindoDB.cloudStatus === 'connected' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }">
                  <span class="w-2 h-2 rounded-full ${
                    window.askrindoDB.cloudStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }"></span>
                  <span class="hidden sm:inline">${
                    window.askrindoDB.cloudStatus === 'connected' ? 'Cloud: Active' : 'Cloud: Setup'
                  }</span>
                </button>

                <!-- Branch Pill -->
                <div class="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                  <i data-lucide="map-pin" class="w-3.5 h-3.5 text-orange-500"></i>
                  <span>${user.branch}</span>
                </div>

                <!-- Notifications Button -->
                <button onclick="window.askrindoApp.showNotificationsModal()" class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 relative transition">
                  <i data-lucide="bell" class="w-5 h-5"></i>
                  <span class="w-2 h-2 rounded-full bg-orange-500 absolute top-2 right-2"></span>
                </button>

                <!-- Profile Dropdown Trigger -->
                <div class="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <img src="${user.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  <div class="hidden sm:block text-left">
                    <p class="text-xs font-bold text-slate-800 leading-tight">${user.name.split(',')[0]}</p>
                    <p class="text-[10px] font-mono text-slate-400">NIP: ${user.nip}</p>
                  </div>
                </div>
              </div>
            </header>

            <!-- Main Content Mount Point -->
            <main id="main-content" class="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
              <!-- Content rendered dynamically here -->
            </main>

            <!-- Footer -->
            <footer class="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500 no-print flex flex-col sm:flex-row items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="font-extrabold text-[#002B49]">Askrindo SATU</span>
                <span>— PT Asuransi Kredit Indonesia</span>
              </div>
              <p class="text-[11px] text-slate-400">Terdaftar dan diawasi oleh Otoritas Jasa Keuangan (OJK)</p>
            </footer>
          </div>
        </div>

        <!-- Global Toast Container -->
        <div id="toast-container" class="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none"></div>

        <!-- Global Command Palette Modal Container -->
        <div id="global-modal-container"></div>
      </div>
    `;

    this.updateActiveNavs();
    if (window.lucide) window.lucide.createIcons();
  }

  // Update active status on sidebar items
  updateActiveNavs() {
    const route = this.currentRoute;
    const navItems = [
      { id: 'nav-dashboard', hash: '#/dashboard', title: 'Beranda Terpadu' },
      { id: 'nav-kabar', hash: '#/kabar', title: 'KABAR (Kalkulator Asuransi Kebakaran)' },
      { id: 'nav-ttk', hash: '#/ttk', title: 'TTK (Tanya-Tanya KUR)' },
      { id: 'nav-bus', hash: '#/bus', title: 'BUS (Buat SPPA)' },
      { id: 'nav-pelaku', hash: '#/pelaku', title: 'PELAKU (Perhitungan Laporan Keuangan)' },
      { id: 'nav-admin', hash: '#/admin', title: 'Web Admin Portal' }
    ];

    navItems.forEach(item => {
      const el = document.getElementById(item.id);
      if (!el) return;
      if (route.startsWith(item.hash)) {
        el.className = el.className.replace('text-slate-600', 'text-orange-600 font-bold bg-orange-50/80 shadow-sm');
        const bc = document.getElementById('breadcrumb-current');
        if (bc) bc.innerText = item.title;
      } else {
        el.className = el.className.replace('text-orange-600 font-bold bg-orange-50/80 shadow-sm', 'text-slate-600');
      }
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // Render the current sub-application inside #main-content
  renderCurrentRoute() {
    const main = document.getElementById('main-content');
    if (!main) return;

    const route = this.currentRoute;

    if (route === '#/dashboard' || route === '') {
      main.innerHTML = window.DashboardModule.render();
    } else if (route.startsWith('#/kabar')) {
      main.innerHTML = window.KabarModule.render();
      window.KabarModule.calculate();
    } else if (route.startsWith('#/ttk')) {
      main.innerHTML = window.TtkModule.render();
      if (window.TtkModule.currentTab === 'calc') window.TtkModule.calcInstallment();
    } else if (route.startsWith('#/bus')) {
      main.innerHTML = window.BusModule.render();
    } else if (route.startsWith('#/pelaku')) {
      main.innerHTML = window.PelakuModule.render();
      window.PelakuModule.calculateRatios();
    } else if (route.startsWith('#/admin')) {
      main.innerHTML = window.AdminModule.render();
    } else {
      main.innerHTML = window.DashboardModule.render();
    }

    this.updateActiveNavs();
    if (window.lucide) window.lucide.createIcons();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Login Page View (Eye-catching & Modern)
  renderLoginPage() {
    const root = document.getElementById('app-root');
    if (!root) return;

    root.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#002B49] via-[#0A3D62] to-[#001B2E] p-4 relative overflow-hidden">
        <!-- Background decorative glows -->
        <div class="absolute -top-32 -left-32 w-96 h-96 bg-[#F37021]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 relative z-10 animate-fadeIn">
          <!-- Left Col: Askrindo SATU Brand & Sub-Apps Showcase (5 cols) -->
          <div class="md:col-span-5 bg-gradient-to-b from-[#002B49] to-[#0A3D62] p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div class="absolute right-0 top-0 w-64 h-64 bg-[#F37021]/10 rounded-full blur-2xl"></div>

            <div class="space-y-6 relative z-10">
              <div class="flex items-center gap-3">
                <img src="assets/images/logo-corporate-white.png" alt="Askrindo Corporate Logo" class="h-11 object-contain" />
              </div>

              <div>
                <span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[#F37021] text-white uppercase tracking-wider mb-2">
                  PORTAL TERPADU
                </span>
                <h2 class="text-2xl font-black tracking-tight leading-tight">
                  Satu Pintu Untuk Seluruh Kebutuhan Operasional
                </h2>
                <p class="text-xs text-slate-300 mt-2 leading-relaxed">
                  Platform tunggal terintegrasi bagi insan Askrindo dalam memproses kalkulasi tarif kebakaran, penjaminan KUR, penerbitan SPPA, dan analisis laporan keuangan.
                </p>
              </div>

              <!-- List of Sub-Apps Pill -->
              <div class="space-y-2 pt-2">
                <div class="flex items-center gap-2.5 p-2 rounded-xl bg-white/10 text-xs">
                  <div class="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                    <i data-lucide="flame" class="w-4 h-4 text-white"></i>
                  </div>
                  <div>
                    <span class="font-bold text-amber-300">KABAR</span>
                    <span class="text-[11px] text-slate-200 block">Kalkulator Asuransi Kebakaran OJK</span>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 p-2 rounded-xl bg-white/10 text-xs">
                  <div class="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <i data-lucide="help-circle" class="w-4 h-4 text-white"></i>
                  </div>
                  <div>
                    <span class="font-bold text-cyan-300">TTK</span>
                    <span class="text-[11px] text-slate-200 block">Tanya-Tanya KUR & Debitur UMKM</span>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 p-2 rounded-xl bg-white/10 text-xs">
                  <div class="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                    <i data-lucide="file-text" class="w-4 h-4 text-white"></i>
                  </div>
                  <div>
                    <span class="font-bold text-emerald-300">BUS</span>
                    <span class="text-[11px] text-slate-200 block">Buat SPPA Digital Terintegrasi</span>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 p-2 rounded-xl bg-white/10 text-xs">
                  <div class="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center shrink-0">
                    <i data-lucide="calculator" class="w-4 h-4 text-white"></i>
                  </div>
                  <div>
                    <span class="font-bold text-purple-300">PELAKU</span>
                    <span class="text-[11px] text-slate-200 block">Perhitungan Laporan Keuangan</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-6 border-t border-white/10 text-[10px] text-slate-400">
              PT Asuransi Kredit Indonesia (Askrindo)
            </div>
          </div>

          <!-- Right Col: Login Form & Quick Demo Pickers (7 cols) -->
          <div class="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <div class="flex items-center justify-between mb-4">
                <img src="assets/images/logo-satu.png" alt="SATU" class="h-10 object-contain" />
                <span class="text-[11px] font-semibold text-slate-400">Single Sign-On (SSO)</span>
              </div>

              <h3 class="text-xl font-black text-slate-800">Masuk ke Askrindo SATU</h3>
              <p class="text-xs text-slate-500 mt-1">Gunakan Nomor Induk Pegawai (NIP) atau alamat email resmi Askrindo.</p>

              <!-- Form -->
              <form onsubmit="window.askrindoApp.handleLoginForm(event)" class="mt-6 space-y-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">NIP atau Email Askrindo</label>
                  <div class="relative">
                    <i data-lucide="user" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3"></i>
                    <input 
                      type="text" 
                      id="login-nip" 
                      required 
                      value="admin.satu@askrindo.co.id"
                      placeholder="Contoh: 19850101 atau nama@askrindo.co.id" 
                      class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F37021] bg-slate-50 focus:bg-white text-xs transition"
                    />
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="font-semibold text-slate-700">Kata Sandi</label>
                    <a href="javascript:void(0)" onclick="alert('Untuk demonstrasi, kata sandi bawaan adalah: password123')" class="text-[11px] text-[#F37021] hover:underline font-medium">Lupa Kata Sandi?</a>
                  </div>
                  <div class="relative">
                    <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3"></i>
                    <input 
                      type="password" 
                      id="login-password" 
                      required 
                      value="password123"
                      placeholder="••••••••" 
                      class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F37021] bg-slate-50 focus:bg-white text-xs transition"
                    />
                  </div>
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                  <label class="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input type="checkbox" checked class="w-4 h-4 text-orange-600 rounded" />
                    <span>Ingat Saya di Perangkat Ini</span>
                  </label>
                </div>

                <button type="submit" class="w-full py-3 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#F37021] to-[#FF8C38] hover:from-[#D95D12] hover:to-[#F37021] shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2">
                  <span>Masuk ke Portal Terpadu</span>
                  <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
              </form>
            </div>

            <!-- Quick Demo Picker (Super handy for instant testing of all roles) -->
            <div class="pt-4 border-t border-slate-100 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pilih Cepat Pengguna Demo (1-Click Login):</span>
              </div>
              <div class="grid grid-cols-2 gap-2 text-[11px]">
                <button onclick="window.authService.quickLogin('USR-001')" class="p-2 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 text-left transition flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-[10px]">A</div>
                  <div class="min-w-0">
                    <p class="font-bold text-slate-800 truncate">Super Admin</p>
                    <p class="text-[9px] text-amber-800">Akses Penuh + Admin</p>
                  </div>
                </button>

                <button onclick="window.authService.quickLogin('USR-002')" class="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-[10px]">U</div>
                  <div class="min-w-0">
                    <p class="font-bold text-slate-800 truncate">Senior Underwriter</p>
                    <p class="text-[9px] text-slate-500">KABAR, BUS, PELAKU</p>
                  </div>
                </button>

                <button onclick="window.authService.quickLogin('USR-003')" class="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[10px]">K</div>
                  <div class="min-w-0">
                    <p class="font-bold text-slate-800 truncate">AO KUR & UMKM</p>
                    <p class="text-[9px] text-slate-500">TTK & PELAKU</p>
                  </div>
                </button>

                <button onclick="window.authService.quickLogin('USR-005')" class="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-slate-500 text-white flex items-center justify-center font-bold text-[10px]">S</div>
                  <div class="min-w-0">
                    <p class="font-bold text-slate-800 truncate">Staff Operasional</p>
                    <p class="text-[9px] text-slate-500">KABAR Saja (Terbatas)</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  handleLoginForm(e) {
    e.preventDefault();
    const nip = document.getElementById('login-nip').value.trim();
    const pass = document.getElementById('login-password').value;

    const res = window.authService.login(nip, pass);
    if (res.success) {
      this.showToast(`Selamat datang kembali, ${res.user.name}!`, 'success');
      window.location.hash = '#/dashboard';
    } else {
      alert(res.message);
    }
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.renderAppShell();
  }

  // --- Modals & Global Triggers ---
  openCommandPalette() {
    const modal = document.getElementById('global-modal-container');
    if (!modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden space-y-2">
          <div class="p-4 border-b border-slate-100 flex items-center gap-3">
            <i data-lucide="search" class="w-5 h-5 text-orange-500"></i>
            <input 
              type="text" 
              id="cmd-input" 
              autofocus 
              placeholder="Ketik nama aplikasi (KABAR, TTK, BUS, PELAKU) atau aksi..." 
              oninput="window.askrindoApp.filterCommandPalette(this.value)"
              class="w-full text-sm font-medium focus:outline-none bg-transparent"
            />
            <kbd class="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-400">ESC</kbd>
          </div>

          <div id="cmd-results" class="p-2 space-y-1 text-xs max-h-80 overflow-y-auto">
            <a href="#/kabar" onclick="window.askrindoApp.closeAllModals()" class="flex items-center justify-between p-3 rounded-xl hover:bg-orange-50 text-slate-800 transition">
              <div class="flex items-center gap-3">
                <i data-lucide="flame" class="w-4 h-4 text-orange-500"></i>
                <div>
                  <span class="font-bold">KABAR</span> — Kalkulator Asuransi Kebakaran
                </div>
              </div>
              <span class="text-[10px] text-slate-400">Buka Modul &rarr;</span>
            </a>

            <a href="#/ttk" onclick="window.askrindoApp.closeAllModals()" class="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 text-slate-800 transition">
              <div class="flex items-center gap-3">
                <i data-lucide="help-circle" class="w-4 h-4 text-blue-500"></i>
                <div>
                  <span class="font-bold">TTK</span> — Tanya-Tanya KUR (Simulasi & Kelayakan)
                </div>
              </div>
              <span class="text-[10px] text-slate-400">Buka Modul &rarr;</span>
            </a>

            <a href="#/bus" onclick="window.askrindoApp.closeAllModals()" class="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 text-slate-800 transition">
              <div class="flex items-center gap-3">
                <i data-lucide="file-text" class="w-4 h-4 text-emerald-500"></i>
                <div>
                  <span class="font-bold">BUS</span> — Buat SPPA & Cetak Dokumen Polis
                </div>
              </div>
              <span class="text-[10px] text-slate-400">Buka Modul &rarr;</span>
            </a>

            <a href="#/pelaku" onclick="window.askrindoApp.closeAllModals()" class="flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 text-slate-800 transition">
              <div class="flex items-center gap-3">
                <i data-lucide="calculator" class="w-4 h-4 text-purple-500"></i>
                <div>
                  <span class="font-bold">PELAKU</span> — Perhitungan Laporan Keuangan Rekanan
                </div>
              </div>
              <span class="text-[10px] text-slate-400">Buka Modul &rarr;</span>
            </a>

            ${window.authService.canAccessAdmin() ? `
              <a href="#/admin" onclick="window.askrindoApp.closeAllModals()" class="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 text-slate-800 transition">
                <div class="flex items-center gap-3">
                  <i data-lucide="shield-check" class="w-4 h-4 text-amber-500"></i>
                  <div>
                    <span class="font-bold">ADMIN</span> — Portal Pengelolaan User & Matriks Hak Akses
                  </div>
                </div>
                <span class="text-[10px] text-slate-400">Buka Modul &rarr;</span>
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => document.getElementById('cmd-input')?.focus(), 50);
  }

  filterCommandPalette(val) {
    const term = val.toLowerCase();
    const links = document.querySelectorAll('#cmd-results a');
    links.forEach(l => {
      if (l.innerText.toLowerCase().includes(term)) {
        l.style.display = 'flex';
      } else {
        l.style.display = 'none';
      }
    });
  }

  showNotificationsModal() {
    const modal = document.getElementById('global-modal-container');
    if (!modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <div class="flex items-center justify-between border-b pb-3 border-slate-100">
            <div class="flex items-center gap-2">
              <i data-lucide="bell" class="w-5 h-5 text-orange-500"></i>
              <h3 class="text-base font-bold text-slate-800">Pemberitahuan Sistem</h3>
            </div>
            <button onclick="window.askrindoApp.closeAllModals()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="space-y-3 text-xs">
            <div class="p-3 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 space-y-1">
              <p class="font-bold">Update Regulasi OJK 2026</p>
              <p class="text-[11px] text-orange-800">Modul KABAR telah sinkron dengan SEOJK No. 6/2017 mengenai batasan tarif batas bawah dan batas atas.</p>
            </div>
            <div class="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
              <p class="font-bold">Skema Penjaminan KUR Mikro</p>
              <p class="text-[11px] text-blue-800">Suku bunga penjaminan KUR Mikro 6% berlaku untuk debitur baru tahun anggaran 2026.</p>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <button onclick="window.askrindoApp.closeAllModals()" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white">
              Tutup
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  requestAccessModal(appName) {
    const user = window.authService.getCurrentUser();
    window.askrindoDB.logActivity('AUTH', 'Permintaan Hak Akses', `Pengguna ${user.name} mengajukan izin untuk membuka modul ${appName}`);
    this.showToast(`Permintaan izin modul ${appName} telah dikirim ke Administrator Askrindo.`, 'info');
  }

  requestNewAppModal() {
    const prompt = window.prompt('Masukkan nama dan penjelasan singkat aplikasi kerja baru yang ingin diusulkan ke Askrindo SATU:');
    if (prompt) {
      const user = window.authService.getCurrentUser();
      window.askrindoDB.logActivity('SYSTEM', 'Pengajuan Modul Baru', `Pengguna ${user.name} mengusulkan modul: "${prompt}"`);
      this.showToast('Usulan aplikasi baru berhasil dicatat dan diteruskan ke Tim TI Askrindo!', 'success');
    }
  }

  closeAllModals() {
    const modal = document.getElementById('global-modal-container');
    if (modal) modal.innerHTML = '';
  }

  updateCloudPill() {
    const pill = document.getElementById('topbar-cloud-pill');
    if (!pill) return;
    const isConn = window.askrindoDB.cloudStatus === 'connected';
    pill.className = `flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold border transition ${
      isConn ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
    }`;
    pill.innerHTML = `
      <span class="w-2 h-2 rounded-full ${isConn ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}"></span>
      <span class="hidden sm:inline">${isConn ? 'Cloud: Active' : 'Cloud: Setup'}</span>
    `;
  }

  showCloudDbModal() {
    const modal = document.getElementById('global-modal-container');
    if (!modal) return;

    const isConnected = window.askrindoDB.cloudStatus === 'connected';

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b pb-4 border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-base shadow-md">
                ⚡
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-800">Status Supabase Cloud Database</h3>
                <p class="text-xs text-slate-500">PostgreSQL Cloud Hosting (Bebas Server Lokal)</p>
              </div>
            </div>
            <button onclick="window.askrindoApp.closeAllModals()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <div class="space-y-4 text-xs">
            <!-- Project Info -->
            <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span class="text-slate-500 font-semibold">Supabase Endpoint:</span>
                <span class="font-mono font-bold text-slate-800 text-[11px] truncate max-w-[340px]">${window.SUPABASE_CONFIG.url}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-500 font-semibold">Status Sinkronisasi:</span>
                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isConnected ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                }">
                  <span class="w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}"></span>
                  ${isConnected ? 'Terhubung & Sinkronisasi Aktif' : 'Menunggu Migrasi Schema SQL'}
                </span>
              </div>
            </div>

            <!-- Petunjuk Jika Pending Schema -->
            ${!isConnected ? `
              <div class="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 space-y-3">
                <div class="flex items-start gap-2.5">
                  <i data-lucide="info" class="w-5 h-5 text-amber-600 shrink-0 mt-0.5"></i>
                  <div>
                    <h4 class="font-bold text-xs">Langkah Terakhir: Jalankan Script SQL di Dashboard Supabase</h4>
                    <p class="text-[11px] text-amber-800 mt-1 leading-relaxed">
                      Proyek Supabase Anda (<code>${window.SUPABASE_CONFIG.projectId}</code>) sudah terhubung ke aplikasi. Agar tabel <b>users</b>, <b>sppa_records</b>, dan <b>audit_logs</b> dibuat di cloud, jalankan script SQL yang telah kami siapkan di menu SQL Editor Supabase.
                    </p>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2 pt-2">
                  <a href="https://supabase.com/dashboard/project/${window.SUPABASE_CONFIG.projectId}/sql" target="_blank" class="px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20">
                    <i data-lucide="external-link" class="w-4 h-4"></i>
                    <span>Buka SQL Editor Supabase</span>
                  </a>
                  <button onclick="window.askrindoApp.copySqlSchema()" class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 transition flex items-center gap-1.5 shadow-sm">
                    <i data-lucide="copy" class="w-4 h-4 text-slate-500"></i>
                    <span>Salin Script SQL (schema.sql)</span>
                  </button>
                  <button onclick="window.askrindoDB.syncWithSupabase(); window.askrindoApp.showToast('Memeriksa koneksi Supabase...', 'info'); setTimeout(()=>window.askrindoApp.showCloudDbModal(), 1200);" class="px-4 py-2.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition flex items-center gap-1.5">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    <span>Cek Ulang Koneksi</span>
                  </button>
                </div>
              </div>
            ` : `
              <div class="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 space-y-2">
                <p class="font-bold flex items-center gap-2 text-xs">
                  <i data-lucide="check-circle-2" class="w-4 h-4 text-emerald-600"></i>
                  Database Cloud Supabase PostgreSQL Berjalan Normal
                </p>
                <p class="text-[11px] text-emerald-800 leading-relaxed">
                  Semua data tersinkronisasi otomatis secara dua arah. Anda dapat membuka portal ini dari komputer atau peramban mana pun dan data akan tetap sama secara real-time.
                </p>
              </div>
            `}
          </div>

          <div class="flex justify-end pt-3 border-t border-slate-100">
            <button onclick="window.askrindoApp.closeAllModals()" class="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition">
              Tutup
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  }

  async copySqlSchema() {
    try {
      const response = await fetch('schema.sql');
      const sqlText = await response.text();
      await navigator.clipboard.writeText(sqlText);
      this.showToast('Script schema.sql berhasil disalin ke clipboard! Silakan paste di SQL Editor Supabase.', 'success');
    } catch (e) {
      window.open('schema.sql', '_blank');
      this.showToast('Membuka schema.sql di tab baru...', 'info');
    }
  }

  renderUnauthorized(appName) {
    const user = window.authService.getCurrentUser();
    return `
      <div class="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4 animate-fadeIn">
        <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <i data-lucide="lock" class="w-8 h-8"></i>
        </div>
        <h2 class="text-xl font-black text-slate-800">Akses Terbatas: ${appName}</h2>
        <p class="text-xs text-slate-500 leading-relaxed">
          Akun Anda (<b>${user.name}</b>, ${user.role}) saat ini belum memiliki hak akses untuk membuka modul <b>${appName}</b>.
        </p>
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
          <p class="font-bold text-slate-700">Aplikasi yang Anda miliki saat ini:</p>
          <div class="flex flex-wrap gap-1 pt-1">
            ${user.allowedApps.map(a => `<span class="px-2 py-0.5 rounded bg-white border text-[10px] font-bold text-slate-700 uppercase">${a}</span>`).join('')}
          </div>
        </div>
        <div class="flex items-center justify-center gap-3 pt-2">
          <a href="#/dashboard" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Kembali ke Beranda
          </a>
          <button onclick="window.askrindoApp.requestAccessModal('${appName}')" class="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition">
            Minta Akses ke Admin
          </button>
        </div>
      </div>
    `;
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const colorMap = {
      success: 'bg-emerald-600 text-white',
      info: 'bg-[#002B49] text-white',
      warning: 'bg-amber-600 text-white',
      error: 'bg-rose-600 text-white'
    };

    toast.className = `p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold pointer-events-auto transform transition-all duration-300 translate-y-2 opacity-0 ${colorMap[type] || colorMap.info}`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle' : 'info'}" class="w-5 h-5 shrink-0"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-x-4');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Global Export & Auto Launch
window.askrindoApp = new AskrindoApp();
