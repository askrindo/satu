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
      this.renderCurrentRoute();
    });

    // Keyboard shortcut for command palette (Ctrl+K or Cmd+K)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      }
      if (e.key === 'Escape') {
        this.closeAllModals();
        this.closeProfileMenu();
      }
    });

    // Close profile dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const menu = document.getElementById('profile-dropdown-menu');
      const btn = document.getElementById('profile-dropdown-btn');
      if (menu && !menu.classList.contains('hidden')) {
        if (!menu.contains(e.target) && !btn?.contains(e.target)) {
          this.closeProfileMenu();
        }
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
              <div class="p-2.5 rounded-2xl bg-slate-50 flex items-center gap-2.5">
                <img src="${user.avatar}" alt="${user.name}" class="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0" />
                <div class="min-w-0 sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                  <p class="text-xs font-bold text-slate-800 truncate">${user.name}</p>
                  <p class="text-[10px] text-slate-400 truncate">${user.role}</p>
                </div>
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

                <!-- Profile Dropdown Trigger & Menu -->
                <div class="relative" id="profile-menu-container">
                  <button 
                    id="profile-dropdown-btn"
                    onclick="window.askrindoApp.toggleProfileMenu()" 
                    class="flex items-center gap-2.5 pl-2 py-1 pr-1 border-l border-slate-200 hover:bg-slate-50 rounded-xl transition focus:outline-none cursor-pointer"
                    title="Menu Profil Pengguna"
                  >
                    <img src="${user.avatar}" class="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm" />
                    <div class="hidden sm:block text-left">
                      <p class="text-xs font-bold text-slate-800 leading-tight">${user.name.split(',')[0]}</p>
                      <p class="text-[10px] font-mono text-slate-400">NIP: ${user.nip}</p>
                    </div>
                    <i data-lucide="chevron-down" id="profile-chevron" class="w-3.5 h-3.5 text-slate-400 transition-transform duration-200"></i>
                  </button>

                  <!-- Profile Dropdown Menu -->
                  <div 
                    id="profile-dropdown-menu" 
                    class="hidden absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-2xl border border-slate-200 py-2 z-50 text-slate-700 animate-fadeIn"
                  >
                    <!-- Header with user info -->
                    <div class="px-4 py-3 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-t-xl">
                      <div class="flex items-start gap-3">
                        <img src="${user.avatar}" class="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
                        <div class="min-w-0">
                          <p class="text-xs font-bold text-slate-900 truncate" title="${user.name}">${user.name}</p>
                          <p class="text-[11px] text-slate-600 truncate mt-0.5">${user.role}</p>
                          <div class="flex items-center gap-1.5 mt-1">
                            <span class="inline-block px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-mono text-[9px] font-bold">NIP ${user.nip}</span>
                            <span class="text-[9px] text-slate-400 truncate">${user.branch ? user.branch.split(' - ')[0] : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Menu List -->
                    <div class="p-1.5 space-y-1">
                      <button 
                        onclick="window.askrindoApp.showChangePasswordModal(); window.askrindoApp.closeProfileMenu();" 
                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition text-left group cursor-pointer"
                      >
                        <div class="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition">
                          <i data-lucide="key-round" class="w-4 h-4"></i>
                        </div>
                        <div class="min-w-0">
                          <p class="font-bold text-slate-800 group-hover:text-orange-600">Ubah Kata Sandi</p>
                          <p class="text-[10px] text-slate-400 font-normal">Ganti kata sandi akun Anda</p>
                        </div>
                      </button>
                    </div>

                    <!-- Divider & Logout Option -->
                    <div class="p-1.5 border-t border-slate-100">
                      <button 
                        onclick="window.askrindoApp.closeProfileMenu(); window.authService.logout();" 
                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left group cursor-pointer"
                      >
                        <div class="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition">
                          <i data-lucide="log-out" class="w-4 h-4"></i>
                        </div>
                        <div class="min-w-0">
                          <p class="font-bold text-rose-600">Keluar / Logout</p>
                          <p class="text-[10px] text-rose-400 font-normal">Akhiri sesi portal Askrindo SATU</p>
                        </div>
                      </button>
                    </div>
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

        <div class="max-w-4xl lg:max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 relative z-10 animate-fadeIn">
          <!-- Left Col: Askrindo SATU Brand & Sub-Apps Showcase (50% Width) -->
          <div class="bg-gradient-to-b from-[#002B49] to-[#0A3D62] p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
            <div class="absolute right-0 top-0 w-64 h-64 bg-[#F37021]/10 rounded-full blur-2xl pointer-events-none"></div>

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
              <div class="space-y-2 pt-1">
                <div class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition text-xs">
                  <div class="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                    <i data-lucide="flame" class="w-4 h-4 text-white"></i>
                  </div>
                  <div class="min-w-0">
                    <span class="font-bold text-amber-300">KABAR</span>
                    <span class="text-[11px] text-slate-200 block truncate">Kalkulator Asuransi Kebakaran OJK</span>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition text-xs">
                  <div class="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shrink-0">
                    <i data-lucide="help-circle" class="w-4 h-4 text-white"></i>
                  </div>
                  <div class="min-w-0">
                    <span class="font-bold text-cyan-300">TTK</span>
                    <span class="text-[11px] text-slate-200 block truncate">Tanya-Tanya KUR & Debitur UMKM</span>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition text-xs">
                  <div class="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0">
                    <i data-lucide="file-text" class="w-4 h-4 text-white"></i>
                  </div>
                  <div class="min-w-0">
                    <span class="font-bold text-emerald-300">BUS</span>
                    <span class="text-[11px] text-slate-200 block truncate">Buat SPPA Digital Terintegrasi</span>
                  </div>
                </div>

                <div class="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/10 hover:bg-white/15 transition text-xs">
                  <div class="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center shrink-0">
                    <i data-lucide="calculator" class="w-4 h-4 text-white"></i>
                  </div>
                  <div class="min-w-0">
                    <span class="font-bold text-purple-300">PELAKU</span>
                    <span class="text-[11px] text-slate-200 block truncate">Perhitungan Laporan Keuangan</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="pt-6 text-[11px] text-slate-400 flex items-center justify-between">
              <span>PT Asuransi Kredit Indonesia</span>
              <span class="text-[10px] text-slate-400 font-mono">v2.4 Enterprise</span>
            </div>
          </div>

          <!-- Right Col: Login Form (50% Width, Proportional & Centered) -->
          <div class="p-8 sm:p-10 flex flex-col justify-between bg-white">
            <div class="flex items-center justify-between">
              <img src="assets/images/logo-satu.png" alt="SATU" class="h-10 object-contain" />
              <span class="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">Single Sign-On (SSO)</span>
            </div>

            <div class="my-auto py-4">
              <h3 class="text-2xl font-black text-slate-800">Masuk ke Askrindo SATU</h3>
              <p class="text-xs text-slate-500 mt-1">Gunakan Nomor Induk Pegawai (NIP) atau alamat email resmi Askrindo.</p>

              <!-- Form -->
              <form onsubmit="window.askrindoApp.handleLoginForm(event)" class="mt-6 space-y-4 text-xs">
                <div>
                  <label class="block font-semibold text-slate-700 mb-1">NIP atau Email Askrindo</label>
                  <div class="relative">
                    <i data-lucide="user" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5"></i>
                    <input 
                      type="text" 
                      id="login-nip" 
                      required 
                      value="admin.satu@askrindo.co.id"
                      placeholder="Contoh: 19850101 atau nama@askrindo.co.id" 
                      class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F37021] bg-slate-50 focus:bg-white text-xs transition"
                    />
                  </div>
                </div>

                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="font-semibold text-slate-700">Kata Sandi</label>
                    <a href="javascript:void(0)" onclick="window.askrindoApp.showToast('Untuk bantuan akses/kata sandi, hubungi Helpdesk TI Ext. 1404.', 'info')" class="text-[11px] text-[#F37021] hover:underline font-medium">Lupa Kata Sandi?</a>
                  </div>
                  <div class="relative">
                    <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5"></i>
                    <input 
                      type="password" 
                      id="login-password" 
                      required 
                      value="password123"
                      placeholder="••••••••" 
                      class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F37021] bg-slate-50 focus:bg-white text-xs transition"
                    />
                  </div>
                </div>

                <div class="flex items-center justify-between text-xs pt-1">
                  <label class="flex items-center gap-2 cursor-pointer text-slate-600">
                    <input type="checkbox" checked class="w-4 h-4 text-orange-600 rounded" />
                    <span>Ingat Saya di Perangkat Ini</span>
                  </label>
                </div>

                <button type="submit" class="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#F37021] to-[#FF8C38] hover:from-[#D95D12] hover:to-[#F37021] shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <span>Masuk ke Portal Terpadu</span>
                  <i data-lucide="arrow-right" class="w-4 h-4"></i>
                </button>
              </form>
            </div>

            <!-- Footer on Right Col (Matches Baseline of Left Col) -->
            <div class="pt-6 text-[11px] text-slate-400 flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-slate-500">
                <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-600"></i>
                <span>Koneksi Aman TLS 1.3</span>
              </div>
              <span>Helpdesk TI Ext. 1404</span>
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
      this.showToast(res.message, 'error');
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

  toggleProfileMenu() {
    const menu = document.getElementById('profile-dropdown-menu');
    const chevron = document.getElementById('profile-chevron');
    if (!menu) return;
    const isHidden = menu.classList.contains('hidden');
    if (isHidden) {
      menu.classList.remove('hidden');
      if (chevron) chevron.style.transform = 'rotate(180deg)';
      if (window.lucide) window.lucide.createIcons();
    } else {
      menu.classList.add('hidden');
      if (chevron) chevron.style.transform = 'rotate(0deg)';
    }
  }

  closeProfileMenu() {
    const menu = document.getElementById('profile-dropdown-menu');
    const chevron = document.getElementById('profile-chevron');
    if (menu) menu.classList.add('hidden');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  }

  showChangePasswordModal() {
    const modal = document.getElementById('global-modal-container');
    if (!modal) return;

    const user = window.authService.getCurrentUser();
    if (!user) return;

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <!-- Header -->
          <div class="flex items-center justify-between border-b pb-3 border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                <i data-lucide="key-round" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-800">Ubah Kata Sandi</h3>
                <p class="text-[11px] text-slate-400">Pengguna: ${user.name.split(',')[0]} (NIP: ${user.nip})</p>
              </div>
            </div>
            <button onclick="window.askrindoApp.closeAllModals()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Alert box for errors -->
          <div id="change-pwd-alert" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-500"></i>
            <span id="change-pwd-alert-text"></span>
          </div>

          <!-- Form -->
          <form onsubmit="window.askrindoApp.handleChangePassword(event)" class="space-y-3.5 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Kata Sandi Saat Ini</label>
              <div class="relative">
                <input 
                  type="password" 
                  id="pwd-current" 
                  required 
                  placeholder="Masukkan kata sandi saat ini" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs pr-10"
                />
                <button 
                  type="button" 
                  onclick="window.askrindoApp.togglePasswordVisibility('pwd-current', this)" 
                  class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabindex="-1"
                >
                  <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
              <div class="relative">
                <input 
                  type="password" 
                  id="pwd-new" 
                  required 
                  minlength="6" 
                  placeholder="Minimal 6 karakter" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs pr-10"
                />
                <button 
                  type="button" 
                  onclick="window.askrindoApp.togglePasswordVisibility('pwd-new', this)" 
                  class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabindex="-1"
                >
                  <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
              </div>
              <p class="text-[10px] text-slate-400 mt-1">Gunakan minimal 6 karakter kombinasi huruf dan angka.</p>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Konfirmasi Kata Sandi Baru</label>
              <div class="relative">
                <input 
                  type="password" 
                  id="pwd-confirm" 
                  required 
                  minlength="6" 
                  placeholder="Ketik ulang kata sandi baru" 
                  class="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs pr-10"
                />
                <button 
                  type="button" 
                  onclick="window.askrindoApp.togglePasswordVisibility('pwd-confirm', this)" 
                  class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabindex="-1"
                >
                  <i data-lucide="eye" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button 
                type="button" 
                onclick="window.askrindoApp.closeAllModals()" 
                class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button 
                type="submit" 
                class="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#F37021] to-[#FF8C38] hover:from-[#D95D12] hover:to-[#F37021] shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Simpan Kata Sandi</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => document.getElementById('pwd-current')?.focus(), 50);
  }

  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.innerHTML = `<i data-lucide="${isPass ? 'eye-off' : 'eye'}" class="w-4 h-4"></i>`;
    if (window.lucide) window.lucide.createIcons();
  }

  handleChangePassword(e) {
    e.preventDefault();
    const currentPass = document.getElementById('pwd-current').value;
    const newPass = document.getElementById('pwd-new').value;
    const confirmPass = document.getElementById('pwd-confirm').value;
    const alertBox = document.getElementById('change-pwd-alert');
    const alertText = document.getElementById('change-pwd-alert-text');

    const showAlert = (msg) => {
      if (alertBox && alertText) {
        alertText.textContent = msg;
        alertBox.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      }
    };

    if (newPass !== confirmPass) {
      showAlert('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }

    if (newPass.length < 6) {
      showAlert('Kata sandi baru minimal 6 karakter.');
      return;
    }

    const res = window.authService.changePassword(currentPass, newPass);
    if (!res.success) {
      showAlert(res.message);
      return;
    }

    this.closeAllModals();
    this.showToast('Kata sandi berhasil diperbarui! Gunakan kata sandi baru untuk login berikutnya.', 'success');
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
