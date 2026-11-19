/**
 * Askrindo SATU - Core Application Router & Shell
 * Handles hash navigation, layout rendering, modals, command palette, and UI state.
 */

class AskrindoApp {
  constructor() {
    this.currentRoute = '#/dashboard';
    this.sidebarCollapsed = window.innerWidth < 1024;
    this.init();
  }

  init() {
    // Listen to hash changes
    window.addEventListener('hashchange', () => this.handleRouting());

    // Listen to auth state changes
    window.addEventListener('askrindo:auth-changed', () => this.handleRouting());

    // Listen to Supabase cloud sync events
    window.addEventListener('askrindo:db-synced', () => {
      if (window.authService) window.authService.init();
      this.updateActiveNavs();
      if (this.currentRoute.startsWith('#/lapor') && window.LaporModule?.handleDbSynced) {
        window.LaporModule.handleDbSynced();
      } else {
        this.renderCurrentRoute();
      }
    });

    // Keyboard shortcut for command palette (Ctrl+K) and LAPOR quick save (Ctrl+S)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.openCommandPalette();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        if (this.currentRoute.startsWith('#/lapor') && window.LaporModule?.currentTab === 'workspace') {
          e.preventDefault();
          window.LaporModule.saveCurrentAnalysis();
        }
      }
      if (e.key === 'Escape' || e.key === 'Esc') {
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

    // Normalize legacy route hashes transparently
    if (hash.startsWith('#/pelaku')) hash = hash.replace(/^#\/pelaku/, '#/lapor');
    else if (hash.startsWith('#/ttk')) hash = hash.replace(/^#\/ttk/, '#/akur');
    else if (hash.startsWith('#/buset')) hash = hash.replace(/^#\/buset/, '#/sedia');
    else if (hash.startsWith('#/bus')) hash = hash.replace(/^#\/bus/, '#/sedia');
    if (hash !== (window.location.hash || '#/dashboard')) {
      window.location.hash = hash;
      return;
    }

    const prevRoute = this.currentRoute;
    this.currentRoute = hash;
    this.previousRoute = prevRoute;
    if (this.currentRoute.startsWith('#/lapor') && (!prevRoute || !prevRoute.startsWith('#/lapor'))) {
      if (window.LaporModule) window.LaporModule.currentTab = 'archive';
    }
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
          <div class="bg-[#002B49] text-white text-[11px] py-1 pl-4 pr-0 flex items-center justify-between border-b border-white/10 no-print">
            <div class="flex items-center gap-2 overflow-hidden w-full">
              <span class="px-2 py-0.5 rounded font-extrabold bg-[#F37021] text-white text-[9px] uppercase tracking-wider shrink-0">Info SATU</span>
              <div class="ticker-wrap flex-1 min-w-0">
                <span class="ticker-content text-slate-200">
                  ${settings.notificationBanner} &nbsp; • &nbsp; Hotline Cabang Askrindo 24/7: 1500-405 &nbsp; • &nbsp; PT Asuransi Kredit Indonesia terdaftar dan diawasi oleh OJK.
                </span>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="flex flex-1 overflow-hidden">
          <!-- Left Sidebar -->
          <aside id="app-sidebar" class="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 transition-all duration-300 z-30 no-print ${this.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
            <div class="p-3.5 space-y-3.5 overflow-y-auto">
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
              <nav class="space-y-3 text-xs font-semibold">
                <!-- Section 1: Utama -->
                <div class="space-y-1">
                  <p class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">Portal Utama</p>
                  <a href="#/dashboard" id="nav-dashboard" title="Beranda Terpadu" class="flex items-center gap-3 px-3 py-1.5 rounded-xl transition text-slate-600 hover:text-slate-900 hover:bg-slate-100">
                    <i data-lucide="layout-dashboard" class="w-4 h-4 text-slate-500 shrink-0"></i>
                    <span class="sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">Beranda Terpadu</span>
                  </a>
                </div>

                <!-- Section 2: Aplikasi Askrindo SATU -->
                <div class="space-y-1">
                  <p class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">Aplikasi-Aplikasi Terpadu</p>
                  
                  <!-- KABAR -->
                  <a href="#/kabar" id="nav-kabar" title="KABAR (Kalkulator Asuransi Kebakaran)" class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl transition text-slate-600 hover:text-orange-600 hover:bg-orange-50">
                    <div class="flex items-center gap-3 min-w-0">
                      <i data-lucide="flame" class="w-4 h-4 text-orange-500 shrink-0"></i>
                      <div class="sidebar-text min-w-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                        <span class="font-bold">KABAR</span>
                        <span class="text-[10px] block font-normal text-slate-400 leading-snug">Kalkulator Asuransi Kebakaran</span>
                      </div>
                    </div>
                    <span id="nav-badge-kabar" class="sidebar-text shrink-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''} px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${window.authService.hasAccess('kabar') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-200'}">${window.authService.hasAccess('kabar') ? 'Aktif' : 'Terkunci'}</span>
                  </a>

                  <!-- AKUR -->
                  <a href="#/akur" id="nav-akur" title="AKUR (Asisten AI Regulasi KUR)" class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl transition text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                    <div class="flex items-center gap-3 min-w-0">
                      <i data-lucide="help-circle" class="w-4 h-4 text-blue-500 shrink-0"></i>
                      <div class="sidebar-text min-w-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                        <span class="font-bold">AKUR</span>
                        <span class="text-[10px] block font-normal text-slate-400 leading-snug">Asisten AI Regulasi KUR</span>
                      </div>
                    </div>
                    <span id="nav-badge-akur" class="sidebar-text shrink-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''} px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${window.authService.hasAccess('akur') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-200'}">${window.authService.hasAccess('akur') ? 'Aktif' : 'Terkunci'}</span>
                  </a>

                  <!-- SEDIA -->
                  <a href="#/sedia" id="nav-sedia" title="SEDIA (Sistem Elektronik Dokumen dan Informasi Asuransi)" class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl transition text-slate-600 hover:text-emerald-600 hover:bg-emerald-50">
                    <div class="flex items-center gap-3 min-w-0">
                      <i data-lucide="file-text" class="w-4 h-4 text-emerald-500 shrink-0"></i>
                      <div class="sidebar-text min-w-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                        <span class="font-bold">SEDIA</span>
                        <span class="text-[10px] block font-normal text-slate-400 leading-snug">Sistem Elektronik Dokumen dan Informasi Asuransi</span>
                      </div>
                    </div>
                    <span id="nav-badge-sedia" class="sidebar-text shrink-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''} px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${window.authService.hasAccess('sedia') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-200'}">${window.authService.hasAccess('sedia') ? 'Aktif' : 'Terkunci'}</span>
                  </a>

                  <!-- CEPAT -->
                  <a href="#/cepat" id="nav-cepat" title="CEPAT (Cover Note Pertanggungan Asuransi Terintegrasi)" class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl transition text-slate-600 hover:text-cyan-600 hover:bg-cyan-50">
                    <div class="flex items-center gap-3 min-w-0">
                      <i data-lucide="file-check-2" class="w-4 h-4 text-cyan-500 shrink-0"></i>
                      <div class="sidebar-text min-w-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                        <span class="font-bold">CEPAT</span>
                        <span class="text-[10px] block font-normal text-slate-400 leading-snug">Cover Note Pertanggungan Asuransi Terintegrasi</span>
                      </div>
                    </div>
                    <span id="nav-badge-cepat" class="sidebar-text shrink-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''} px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${window.authService.hasAccess('cepat') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-200'}">${window.authService.hasAccess('cepat') ? 'Aktif' : 'Terkunci'}</span>
                  </a>

                  <!-- LAPOR -->
                  <a href="#/lapor" id="nav-lapor" title="LAPOR (Layanan Analisis dan Perhitungan Rasio Keuangan)" class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl transition text-slate-600 hover:text-purple-600 hover:bg-purple-50">
                    <div class="flex items-center gap-3 min-w-0">
                      <i data-lucide="calculator" class="w-4 h-4 text-purple-500 shrink-0"></i>
                      <div class="sidebar-text min-w-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                        <span class="font-bold">LAPOR</span>
                        <span class="text-[10px] block font-normal text-slate-400 leading-snug">Layanan Analisis dan Perhitungan Rasio Keuangan</span>
                      </div>
                    </div>
                    <span id="nav-badge-lapor" class="sidebar-text shrink-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''} px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${window.authService.hasAccess('lapor') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-200'}">${window.authService.hasAccess('lapor') ? 'Aktif' : 'Terkunci'}</span>
                  </a>

                  <!-- PASTI -->
                  <a href="#/pasti" id="nav-pasti" title="PASTI (Pemeriksaan Administrasi SPKMGR Terintegrasi)" class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl transition text-slate-600 hover:text-indigo-600 hover:bg-indigo-50">
                    <div class="flex items-center gap-3 min-w-0">
                      <i data-lucide="file-search" class="w-4 h-4 text-indigo-500 shrink-0"></i>
                      <div class="sidebar-text min-w-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                        <span class="font-bold">PASTI</span>
                        <span class="text-[10px] block font-normal text-slate-400 leading-snug">Pemeriksaan Administrasi SPKMGR Terintegrasi</span>
                      </div>
                    </div>
                    <span id="nav-badge-pasti" class="sidebar-text shrink-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''} px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${window.authService.hasAccess('pasti') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-200'}">${window.authService.hasAccess('pasti') ? 'Aktif' : 'Terkunci'}</span>
                  </a>

                  <!-- CEKLIST -->
                  <a href="#/ceklist" id="nav-ceklist" title="CEKLIST (Cek Entitas dan Kelola List Informasi Status Terblokir)" class="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl transition text-slate-600 hover:text-rose-600 hover:bg-rose-50">
                    <div class="flex items-center gap-3 min-w-0">
                      <i data-lucide="shield-alert" class="w-4 h-4 text-rose-500 shrink-0"></i>
                      <div class="sidebar-text min-w-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''}">
                        <span class="font-bold">CEKLIST</span>
                        <span class="text-[10px] block font-normal text-slate-400 leading-snug">Cek Entitas dan Kelola List Informasi Status Terblokir</span>
                      </div>
                    </div>
                    <span id="nav-badge-ceklist" class="sidebar-text shrink-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''} px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${window.authService.hasAccess('ceklist') ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-200'}">${window.authService.hasAccess('ceklist') ? 'Aktif' : 'Terkunci'}</span>
                  </a>
                </div>

                <!-- Section 3: Administrasi -->
                ${canAdmin ? `
                  <div class="space-y-1">
                    <p class="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">Administrasi &amp; User</p>
                    <a href="#/admin" id="nav-admin" title="Web Admin Portal" class="flex items-center gap-3 px-3 py-1.5 rounded-xl transition text-slate-600 hover:text-amber-700 hover:bg-amber-50">
                      <i data-lucide="shield-check" class="w-4 h-4 text-amber-500 shrink-0"></i>
                      <span class="sidebar-text ${this.sidebarCollapsed ? 'lg:hidden' : ''}">Web Admin Portal</span>
                    </a>
                  </div>
                ` : ''}
              </nav>
            </div>

            <!-- Bottom User Profile Card -->
            <div class="p-3 border-t border-slate-200 shrink-0">
              <div class="p-2.5 rounded-2xl bg-slate-50 flex items-center gap-2.5">
                <img data-user-avatar="${user.id}" src="${window.askrindoDB.getUserAvatar(user)}" onerror="this.src='assets/images/default-avatar.svg'" alt="${user.name}" class="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100" />
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
            <header id="app-topbar" class="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-4 no-print">
              <div class="flex items-center gap-3 min-w-0">
                <button onclick="window.askrindoApp.toggleSidebar()" class="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition shrink-0">
                  <i data-lucide="menu" class="w-5 h-5"></i>
                </button>

                <!-- Breadcrumb -->
                <div id="app-breadcrumb" class="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500 min-w-0 whitespace-nowrap">
                  <span>Askrindo SATU</span>
                  <span>/</span>
                  <span id="breadcrumb-current" class="text-slate-800 font-bold truncate max-w-[260px] lg:max-w-xs">Beranda</span>
                </div>
              </div>

              <!-- Center: Command Palette Trigger Button -->
              <button onclick="window.askrindoApp.openCommandPalette()" class="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs text-slate-500 transition w-64 lg:w-72 justify-between shrink-0 whitespace-nowrap">
                <div class="flex items-center gap-2">
                  <i data-lucide="search" class="w-3.5 h-3.5 shrink-0"></i>
                  <span>Pencarian Cepat Modul...</span>
                </div>
                <kbd class="px-1.5 py-0.5 rounded bg-white border border-slate-300 font-mono text-[10px] text-slate-600 shrink-0">Ctrl K</kbd>
              </button>

              <!-- Right: Alerts, Unit Kerja, User Profile -->
              <div class="flex items-center gap-2.5 shrink-0">
                <!-- Unit Kerja Pill -->
                <div class="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700 max-w-[230px]" title="${window.askrindoDB.getUserUnitKerja(user)}">
                  <i data-lucide="map-pin" class="w-3.5 h-3.5 text-orange-500 shrink-0"></i>
                  <span class="truncate">${window.askrindoDB.getUserUnitKerja(user)}</span>
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
                    class="flex items-center gap-2 pl-2 py-0.5 pr-1 border-l border-slate-200 hover:bg-slate-50 rounded-xl transition focus:outline-none cursor-pointer"
                    title="Menu Profil Pengguna"
                  >
                    <img data-user-avatar="${user.id}" src="${window.askrindoDB.getUserAvatar(user)}" onerror="this.src='assets/images/default-avatar.svg'" alt="${user.name}" class="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm shrink-0 bg-slate-100" />
                    <div class="hidden sm:block text-left whitespace-nowrap">
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
                        <img data-user-avatar="${user.id}" src="${window.askrindoDB.getUserAvatar(user)}" onerror="this.src='assets/images/default-avatar.svg'" alt="${user.name}" class="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm shrink-0 bg-slate-100" />
                        <div class="min-w-0 flex-1">
                          <p class="text-xs font-bold text-slate-900 truncate" title="${user.name}">${user.name}</p>
                          <p class="text-[11px] text-slate-600 truncate mt-0.5">${user.role}</p>
                          <div class="flex items-center gap-1.5 mt-1 min-w-0">
                            <span class="inline-block px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-mono text-[9px] font-bold shrink-0">NIP ${user.nip}</span>
                            <span class="text-[9px] text-slate-400 truncate" title="${window.askrindoDB.getUserUnitKerja(user)}">${window.askrindoDB.getUserUnitKerja(user)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Menu List -->
                    <div class="p-1.5 space-y-1">
                      <button 
                        onclick="window.askrindoApp.showChangeAvatarModal(); window.askrindoApp.closeProfileMenu();" 
                        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 transition text-left group cursor-pointer"
                      >
                        <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                          <i data-lucide="camera" class="w-4 h-4"></i>
                        </div>
                        <div class="min-w-0">
                          <p class="font-bold text-slate-800 group-hover:text-blue-600">Ubah Foto Profil</p>
                          <p class="text-[10px] text-slate-400 font-normal">Unggah foto baru atau reset ke default</p>
                        </div>
                      </button>

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
            <main id="main-content" class="flex-1 p-4 lg:px-6 lg:py-4 max-w-7xl w-full mx-auto">
              <!-- Content rendered dynamically here -->
            </main>

            <!-- Footer -->
            <footer class="bg-white border-t border-slate-200 py-2.5 px-6 text-center text-xs text-slate-500 no-print flex flex-col sm:flex-row items-center justify-between gap-2">
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
      { id: 'nav-dashboard', hashes: ['#/dashboard'], title: 'Beranda Terpadu', activeCls: 'text-slate-900 font-bold bg-slate-100 shadow-sm' },
      { id: 'nav-kabar', hashes: ['#/kabar'], title: 'KABAR (Kalkulator Asuransi Kebakaran)', activeCls: 'text-orange-600 font-bold bg-orange-50 shadow-sm' },
      { id: 'nav-akur', hashes: ['#/akur'], title: 'AKUR (Asisten AI Regulasi KUR)', activeCls: 'text-blue-600 font-bold bg-blue-50 shadow-sm' },
      { id: 'nav-sedia', hashes: ['#/sedia'], title: 'SEDIA (Sistem Elektronik Dokumen dan Informasi Asuransi)', activeCls: 'text-emerald-600 font-bold bg-emerald-50 shadow-sm' },
      { id: 'nav-cepat', hashes: ['#/cepat'], title: 'CEPAT (Cover Note Pertanggungan Asuransi Terintegrasi)', activeCls: 'text-cyan-600 font-bold bg-cyan-50 shadow-sm' },
      { id: 'nav-lapor', hashes: ['#/lapor'], title: 'LAPOR (Layanan Analisis dan Perhitungan Rasio Keuangan)', activeCls: 'text-purple-600 font-bold bg-purple-50 shadow-sm' },
      { id: 'nav-pasti', hashes: ['#/pasti'], title: 'PASTI (Pemeriksaan Administrasi SPKMGR Terintegrasi)', activeCls: 'text-indigo-600 font-bold bg-indigo-50 shadow-sm' },
      { id: 'nav-ceklist', hashes: ['#/ceklist'], title: 'CEKLIST (Cek Entitas dan Kelola List Informasi Status Terblokir)', activeCls: 'text-rose-600 font-bold bg-rose-50 shadow-sm' },
      { id: 'nav-admin', hashes: ['#/admin'], title: 'Web Admin Portal', activeCls: 'text-amber-700 font-bold bg-amber-50 shadow-sm' }
    ];

    navItems.forEach(item => {
      const el = document.getElementById(item.id);
      if (!el) return;
      const isMatch = item.hashes.some(h => route.startsWith(h));
      if (isMatch) {
        if (!el.className.includes(item.activeCls)) {
          el.className = el.className.replace('text-slate-600', item.activeCls);
        }
        const bc = document.getElementById('breadcrumb-current');
        if (bc) bc.innerText = item.title;
      } else {
        el.className = el.className.replace(item.activeCls, 'text-slate-600');
      }
    });

    // Sync sidebar access status badges dynamically
    ['kabar', 'akur', 'sedia', 'cepat', 'lapor', 'pasti', 'ceklist'].forEach(appId => {
      const badgeEl = document.getElementById(`nav-badge-${appId}`);
      if (!badgeEl || !window.authService) return;
      const allowed = window.authService.hasAccess(appId);
      badgeEl.innerText = allowed ? 'Aktif' : 'Terkunci';
      badgeEl.className = `sidebar-text shrink-0 ${this.sidebarCollapsed ? 'lg:hidden' : ''} px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${allowed ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-200'}`;
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // Render the current sub-application inside #main-content
  renderCurrentRoute() {
    const main = document.getElementById('main-content');
    if (!main) return;

    const route = this.currentRoute;

    // Centralized Route-Level RBAC Guard (Single Source of Truth — mencegah bypass akses di semua modul)
    const routeGuardMap = [
      { prefix: '#/kabar', appId: 'kabar', label: 'KABAR' },
      { prefix: '#/akur', appId: 'akur', label: 'AKUR' },
      { prefix: '#/sedia', appId: 'sedia', label: 'SEDIA' },
      { prefix: '#/cepat', appId: 'cepat', label: 'CEPAT' },
      { prefix: '#/lapor', appId: 'lapor', label: 'LAPOR' },
      { prefix: '#/pasti', appId: 'pasti', label: 'PASTI' },
      { prefix: '#/ceklist', appId: 'ceklist', label: 'CEKLIST' }
    ];

    const matchedGuard = routeGuardMap.find(g => route.startsWith(g.prefix));
    if (matchedGuard && !window.authService.hasAccess(matchedGuard.appId)) {
      main.innerHTML = this.renderUnauthorized(matchedGuard.label);
      this.updateActiveNavs();
      if (window.lucide) window.lucide.createIcons();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (route.startsWith('#/admin') && !window.authService.canAccessAdmin()) {
      main.innerHTML = this.renderUnauthorized('Web Admin Portal');
      this.updateActiveNavs();
      if (window.lucide) window.lucide.createIcons();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (route === '#/dashboard' || route === '') {
      main.innerHTML = window.DashboardModule.render();
    } else if (route.startsWith('#/kabar')) {
      main.innerHTML = window.KabarModule.render();
      window.KabarModule.calculate();
    } else if (route.startsWith('#/akur')) {
      main.innerHTML = window.AkurModule.render();
    } else if (route.startsWith('#/sedia')) {
      main.innerHTML = window.SediaModule.render();
    } else if (route.startsWith('#/cepat')) {
      main.innerHTML = window.CepatModule.render();
    } else if (route.startsWith('#/lapor')) {
      main.innerHTML = window.LaporModule.render();
      window.LaporModule.updateYearLabels();
      window.LaporModule.calculateRatios();
    } else if (route.startsWith('#/pasti')) {
      main.innerHTML = window.PastiModule.render();
    } else if (route.startsWith('#/ceklist')) {
      main.innerHTML = window.CeklistModule.render();
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
                <img src="assets/images/logo-satu-white.png" alt="Askrindo SATU" class="h-11 object-contain" />
              </div>

              <div>
                <span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-[#F37021] text-white uppercase tracking-wider mb-2">
                  PORTAL TERPADU
                </span>
                <h2 class="text-2xl font-black tracking-tight leading-tight">
                  Satu Pintu Untuk Seluruh Kebutuhan Operasional
                </h2>
                <p class="text-xs text-slate-300 mt-2 leading-relaxed">
                  Platform tunggal terintegrasi bagi insan Askrindo. Saat ini modul <b>LAPOR</b> telah aktif untuk operasional penuh, dan modul lainnya dalam tahap pengujian bertahap oleh Administrator.
                </p>
              </div>

              <!-- 2-Column Modular App Ecosystem Grid (Scalable & Elegant) -->
              <div class="space-y-2 pt-1">
                <div class="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span class="flex items-center gap-1.5 text-amber-300">
                    <i data-lucide="layers" class="w-3.5 h-3.5 text-amber-400"></i>
                    <span>Ekosistem Aplikasi Terpadu</span>
                  </span>
                  <span class="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    1 Aktif · 4 Segera Hadir
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-2 text-xs">
                  <!-- LAPOR (AKTIF PENUH) -->
                  <div class="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-purple-500/25 to-indigo-500/25 hover:from-purple-500/35 hover:to-indigo-500/35 transition border border-purple-400/40 shadow-sm relative overflow-hidden" title="LAPOR: Layanan Analisis dan Perhitungan Rasio Keuangan">
                    <div class="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center shrink-0 shadow-md">
                      <i data-lucide="calculator" class="w-4 h-4 text-white"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-1">
                        <span class="font-black text-purple-200 text-xs">LAPOR</span>
                        <span class="px-1.5 py-0.2 rounded text-[7px] font-extrabold bg-emerald-500 text-white uppercase tracking-wider">Aktif</span>
                      </div>
                      <span class="text-[10px] text-slate-200 block leading-snug">Layanan Analisis dan Perhitungan Rasio Keuangan</span>
                    </div>
                  </div>

                  <!-- PASTI (AKTIF PENUH) -->
                  <div class="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-indigo-500/25 to-cyan-500/25 hover:from-indigo-500/35 hover:to-cyan-500/35 transition border border-indigo-400/40 shadow-sm relative overflow-hidden" title="PASTI: Pemeriksaan Administrasi SPKMGR Terintegrasi">
                    <div class="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0 shadow-md">
                      <i data-lucide="file-search" class="w-4 h-4 text-white"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-1">
                        <span class="font-black text-indigo-200 text-xs">PASTI</span>
                        <span class="px-1.5 py-0.2 rounded text-[7px] font-extrabold bg-emerald-500 text-white uppercase tracking-wider">Aktif</span>
                      </div>
                      <span class="text-[10px] text-slate-200 block leading-snug">Pemeriksaan Administrasi SPKMGR Terintegrasi</span>
                    </div>
                  </div>

                  <!-- CEKLIST (AKTIF PENUH) -->
                  <div class="flex items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-rose-500/25 to-red-500/25 hover:from-rose-500/35 hover:to-red-500/35 transition border border-rose-400/40 shadow-sm relative overflow-hidden" title="CEKLIST: Cek Entitas dan Kelola List Informasi Status Terblokir">
                    <div class="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center shrink-0 shadow-md">
                      <i data-lucide="shield-alert" class="w-4 h-4 text-white"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-1">
                        <span class="font-black text-rose-200 text-xs">CEKLIST</span>
                        <span class="px-1.5 py-0.2 rounded text-[7px] font-extrabold bg-emerald-500 text-white uppercase tracking-wider">Aktif</span>
                      </div>
                      <span class="text-[10px] text-slate-200 block leading-snug">Cek Entitas dan Kelola List Informasi Status Terblokir</span>
                    </div>
                  </div>

                  <!-- KABAR (SEGERA HADIR) -->
                  <div class="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-dashed border-white/20 hover:bg-white/10 transition group" title="KABAR: Kalkulator Asuransi Kebakaran">
                    <div class="w-7 h-7 rounded-lg bg-orange-500/20 border border-orange-400/30 flex items-center justify-center shrink-0">
                      <i data-lucide="flame" class="w-4 h-4 text-orange-300"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-1">
                        <span class="font-bold text-slate-300 text-xs">KABAR</span>
                        <span class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">Segera</span>
                      </div>
                      <span class="text-[10px] text-slate-400 block leading-snug">Kalkulator Asuransi Kebakaran</span>
                    </div>
                  </div>

                  <!-- AKUR (SEGERA HADIR) -->
                  <div class="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-dashed border-white/20 hover:bg-white/10 transition group" title="AKUR: Asisten AI Regulasi KUR">
                    <div class="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
                      <i data-lucide="help-circle" class="w-4 h-4 text-blue-300"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-1">
                        <span class="font-bold text-slate-300 text-xs">AKUR</span>
                        <span class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">Segera</span>
                      </div>
                      <span class="text-[10px] text-slate-400 block leading-snug">Asisten AI Regulasi KUR</span>
                    </div>
                  </div>

                  <!-- SEDIA (SEGERA HADIR) -->
                  <div class="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-dashed border-white/20 hover:bg-white/10 transition group" title="SEDIA: Sistem Elektronik Dokumen dan Informasi Asuransi">
                    <div class="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
                      <i data-lucide="file-text" class="w-4 h-4 text-emerald-300"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-1">
                        <span class="font-bold text-slate-300 text-xs">SEDIA</span>
                        <span class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">Segera</span>
                      </div>
                      <span class="text-[10px] text-slate-400 block leading-snug">Sistem Elektronik Dokumen dan Informasi Asuransi</span>
                    </div>
                  </div>

                  <!-- CEPAT (SEGERA HADIR) -->
                  <div class="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-dashed border-white/20 hover:bg-white/10 transition group" title="CEPAT: Cover Note Pertanggungan Asuransi Terintegrasi">
                    <div class="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0">
                      <i data-lucide="file-check-2" class="w-4 h-4 text-cyan-300"></i>
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-1">
                        <span class="font-bold text-slate-300 text-xs">CEPAT</span>
                        <span class="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">Segera</span>
                      </div>
                      <span class="text-[10px] text-slate-400 block leading-snug">Cover Note Pertanggungan Asuransi Terintegrasi</span>
                    </div>
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
            <div class="flex items-center justify-between gap-4">
              <img src="assets/images/logo-corporate.png" alt="Askrindo Corporate Logo" class="h-20 sm:h-24 object-contain" />
              <span class="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full shrink-0">Single Sign-On (SSO)</span>
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
                      placeholder="Contoh: 1922 atau nama@askrindo.co.id" 
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
                      class="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#F37021] bg-slate-50 focus:bg-white text-xs transition"
                    />
                    <button
                      type="button"
                      id="toggle-login-password"
                      onclick="window.askrindoApp.togglePasswordVisibility('login-password', this)"
                      aria-label="Tampilkan atau sembunyikan kata sandi"
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabindex="-1"
                    >
                      <i data-lucide="eye" class="w-4 h-4"></i>
                    </button>
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
    this.updateSidebarDom();
  }

  updateSidebarDom() {
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    sidebar.classList.toggle('sidebar-collapsed', !!this.sidebarCollapsed);

    // Mobile backdrop management (< 1024px)
    let backdrop = document.getElementById('sidebar-backdrop');
    if (!this.sidebarCollapsed && window.innerWidth < 1024) {
      if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.id = 'sidebar-backdrop';
        backdrop.className = 'fixed inset-0 bg-slate-900/50 z-20 backdrop-blur-xs lg:hidden transition-opacity';
        backdrop.onclick = () => this.toggleSidebar();
        sidebar.parentNode.insertBefore(backdrop, sidebar);
      }
    } else if (backdrop) {
      backdrop.remove();
    }

    if (window.lucide) window.lucide.createIcons();
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
              placeholder="Ketik nama aplikasi (KABAR, AKUR, SEDIA, CEPAT, LAPOR, PASTI) atau aksi..." 
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

            <a href="#/akur" onclick="window.askrindoApp.closeAllModals()" class="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 text-slate-800 transition">
              <div class="flex items-center gap-3">
                <i data-lucide="help-circle" class="w-4 h-4 text-blue-500"></i>
                <div>
                  <span class="font-bold">AKUR</span> — Asisten AI Regulasi KUR
                </div>
              </div>
              <span class="text-[10px] text-slate-400">Buka Modul &rarr;</span>
            </a>

            <a href="#/sedia" onclick="window.askrindoApp.closeAllModals()" class="flex items-center justify-between p-3 rounded-xl hover:bg-emerald-50 text-slate-800 transition">
              <div class="flex items-center gap-3">
                <i data-lucide="file-text" class="w-4 h-4 text-emerald-500"></i>
                <div>
                  <span class="font-bold">SEDIA</span> — Sistem Elektronik Dokumen dan Informasi Asuransi
                </div>
              </div>
              <span class="text-[10px] text-slate-400">Buka Modul &rarr;</span>
            </a>

            <a href="#/cepat" onclick="window.askrindoApp.closeAllModals()" class="flex items-center justify-between p-3 rounded-xl hover:bg-cyan-50 text-slate-800 transition">
              <div class="flex items-center gap-3">
                <i data-lucide="file-check-2" class="w-4 h-4 text-cyan-500"></i>
                <div>
                  <span class="font-bold">CEPAT</span> — Cover Note Pertanggungan Asuransi Terintegrasi
                </div>
              </div>
              <span class="text-[10px] text-slate-400">Buka Modul &rarr;</span>
            </a>

            <a href="#/lapor" onclick="window.askrindoApp.closeAllModals()" class="flex items-center justify-between p-3 rounded-xl hover:bg-purple-50 text-slate-800 transition">
              <div class="flex items-center gap-3">
                <i data-lucide="calculator" class="w-4 h-4 text-purple-500"></i>
                <div>
                  <span class="font-bold">LAPOR</span> — Layanan Analisis dan Perhitungan Rasio Keuangan
                </div>
              </div>
              <span class="text-[10px] text-slate-400">Buka Modul &rarr;</span>
            </a>

            <a href="#/pasti" onclick="window.askrindoApp.closeAllModals()" class="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 text-slate-800 transition">
              <div class="flex items-center gap-3">
                <i data-lucide="file-search" class="w-4 h-4 text-indigo-500"></i>
                <div>
                  <span class="font-bold">PASTI</span> — Pemeriksaan Administrasi SPKMGR Terintegrasi
                </div>
              </div>
              <span class="text-[10px] text-slate-400">Buka Modul &rarr;</span>
            </a>

            <a href="#/ceklist" onclick="window.askrindoApp.closeAllModals()" class="flex items-center justify-between p-3 rounded-xl hover:bg-rose-50 text-slate-800 transition">
              <div class="flex items-center gap-3">
                <i data-lucide="shield-alert" class="w-4 h-4 text-rose-500"></i>
                <div>
                  <span class="font-bold">CEKLIST</span> — Cek Entitas dan Kelola List Informasi Status Terblokir
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
    [
      'global-modal-container',
      'lapor-modal-container',
      'kabar-modal-container',
      'admin-modal-container',
      'akur-amort-modal-container',
      'ceklist-modal-container',
      'ceklist-popup-container'
    ].forEach(id => {
      const modal = document.getElementById(id);
      if (modal) modal.innerHTML = '';
    });
  }

  renderUnauthorized(appName) {
    const user = window.authService.getCurrentUser() || { name: 'Pengguna', role: '-', allowedApps: [] };
    const canonicalApps = window.askrindoDB
      ? window.askrindoDB.normalizeAllowedApps(user.allowedApps)
      : [...new Set(user.allowedApps || [])];

    return `
      <div class="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4 animate-fadeIn">
        <div class="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <i data-lucide="lock" class="w-8 h-8"></i>
        </div>
        <h2 class="text-xl font-black text-slate-800">Akses Terbatas: ${appName}</h2>
        <p class="text-xs text-slate-500 leading-relaxed">
          Akun Anda (<b>${user.name}</b>, ${user.role}) saat ini belum memiliki hak akses untuk membuka modul <b>${appName}</b>. Hubungi Administrator untuk mengaktifkan izin akses modul ini pada Matriks Hak Akses.
        </p>
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
          <p class="font-bold text-slate-700">Aplikasi yang Anda miliki saat ini:</p>
          <div class="flex flex-wrap gap-1 pt-1">
            ${canonicalApps.length > 0
              ? canonicalApps.map(a => `<span class="px-2 py-0.5 rounded bg-white border text-[10px] font-bold text-slate-700 uppercase">${a}</span>`).join('')
              : `<span class="text-[11px] text-slate-400 italic">Belum ada modul aktif</span>`
            }
          </div>
        </div>
        <div class="flex items-center justify-center gap-3 pt-2">
          <a href="#/dashboard" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Kembali ke Beranda
          </a>
          <button onclick="window.askrindoApp.requestAccessModal('${appName}')" class="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition cursor-pointer">
            Minta Akses ke Admin
          </button>
        </div>
      </div>
    `;
  }

  showDevelopmentNoticeModal(appName) {
    const modal = document.getElementById('global-modal-container');
    if (!modal) return;

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
          <div class="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <i data-lucide="sparkles" class="w-7 h-7 text-amber-500"></i>
          </div>
          <span class="inline-block px-3 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
            Segera Hadir
          </span>
          <h3 class="text-lg font-bold text-slate-800">Modul ${appName} Segera Hadir</h3>
          <p class="text-xs text-slate-500 leading-relaxed">
            Modul <b>${appName}</b> sedang disiapkan dan akan segera hadir dalam pembaruan berikutnya di portal Askrindo SATU.
          </p>
          <div class="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-left text-xs space-y-1">
            <p class="font-bold text-purple-900 flex items-center gap-1.5">
              <i data-lucide="check-circle" class="w-4 h-4 text-purple-600"></i>
              Modul Aktif Operasional:
            </p>
            <p class="text-slate-600 text-[11px]">Gunakan modul <b>LAPOR (Layanan Analisis dan Perhitungan Rasio Keuangan)</b> yang sudah rilis penuh.</p>
          </div>
          <div class="flex items-center justify-center gap-2 pt-2">
            <button onclick="window.askrindoApp.closeAllModals()" class="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
              Tutup
            </button>
            <a href="#/lapor" onclick="window.askrindoApp.closeAllModals()" class="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 transition">
              Buka Modul LAPOR
            </a>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
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

  showChangeAvatarModal() {
    const modal = document.getElementById('global-modal-container');
    if (!modal) return;

    const user = window.authService.getCurrentUser();
    if (!user) return;

    const currentAvatar = window.askrindoDB.getUserAvatar(user);
    const isDefault = currentAvatar === (window.DEFAULT_AVATAR || 'assets/images/default-avatar.svg');
    this._pendingAvatarDataUrl = null;
    this._pendingAvatarBlob = null;

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
          <!-- Header -->
          <div class="flex items-center justify-between border-b pb-3 border-slate-100">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <i data-lucide="camera" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-800">Ubah Foto Profil</h3>
                <p class="text-[11px] text-slate-400">Pengguna: ${user.name.split(',')[0]} (NIP: ${user.nip})</p>
              </div>
            </div>
            <button onclick="window.askrindoApp.closeAllModals()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Preview -->
          <div class="flex flex-col items-center gap-3 py-2">
            <div class="relative">
              <img id="avatar-modal-preview" src="${currentAvatar}" onerror="this.src='assets/images/default-avatar.svg'" alt="${user.name}" class="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md bg-slate-100" />
            </div>
            <span id="avatar-modal-status" class="px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${isDefault ? 'bg-slate-100 text-slate-600' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
              ${isDefault ? 'Menggunakan Foto Default' : 'Foto Profil Kustom Aktif'}
            </span>
          </div>

          <!-- File Picker -->
          <label class="block border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/40 rounded-2xl p-4 text-center cursor-pointer transition">
            <input type="file" id="avatar-file-input" accept="image/png,image/jpeg,image/webp" class="hidden" onchange="window.askrindoApp.handleAvatarFileSelect(this)" />
            <div class="flex flex-col items-center gap-1.5 text-xs">
              <i data-lucide="upload-cloud" class="w-6 h-6 text-blue-500"></i>
              <span class="font-bold text-slate-700">Pilih Foto Baru (JPG / PNG / WEBP)</span>
              <span class="text-[10px] text-slate-400">Otomatis dipotong persegi &amp; dikompresi agar ringan</span>
            </div>
          </label>

          <!-- Alert -->
          <div id="avatar-modal-alert" class="hidden p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-500"></i>
            <span id="avatar-modal-alert-text"></span>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-slate-100">
            ${!isDefault ? `
              <button type="button" onclick="window.askrindoApp.resetProfileAvatar()" class="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 transition cursor-pointer">
                Reset ke Default
              </button>
            ` : `<span></span>`}
            <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button type="button" onclick="window.askrindoApp.closeAllModals()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer">
                Batal
              </button>
              <button type="button" id="btn-save-avatar" onclick="window.askrindoApp.saveProfileAvatar()" disabled class="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 transition cursor-pointer">
                Simpan Foto
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  handleAvatarFileSelect(input) {
    const file = input && input.files && input.files[0];
    if (!file) return;

    const alertBox = document.getElementById('avatar-modal-alert');
    const alertText = document.getElementById('avatar-modal-alert-text');
    const showErr = (msg) => {
      if (alertBox && alertText) {
        alertText.textContent = msg;
        alertBox.classList.remove('hidden');
      }
    };
    if (alertBox) alertBox.classList.add('hidden');

    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      showErr('Format file harus berupa JPG, PNG, atau WEBP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showErr('Ukuran file maksimal 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Center-crop ke persegi
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        this._pendingAvatarDataUrl = dataUrl;
        canvas.toBlob((blob) => {
          this._pendingAvatarBlob = blob;
        }, 'image/jpeg', 0.82);

        const prev = document.getElementById('avatar-modal-preview');
        if (prev) prev.src = dataUrl;
        const statusEl = document.getElementById('avatar-modal-status');
        if (statusEl) {
          statusEl.textContent = 'Siap disimpan (256×256 px terkompresi)';
          statusEl.className = 'px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200';
        }
        const saveBtn = document.getElementById('btn-save-avatar');
        if (saveBtn) saveBtn.disabled = false;
      };
      img.onerror = () => showErr('Gagal membaca berkas gambar.');
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async saveProfileAvatar() {
    const user = window.authService.getCurrentUser();
    if (!user || !this._pendingAvatarDataUrl) return;

    const btn = document.getElementById('btn-save-avatar');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Menyimpan...';
    }

    const res = await window.askrindoDB.updateUserAvatar(user.id, this._pendingAvatarDataUrl, this._pendingAvatarBlob);
    if (res && res.success) {
      this.refreshAvatarElements(user.id, res.avatar);
      this.closeAllModals();
      this.showToast('Foto profil berhasil diperbarui!', 'success');
      if (window.location.hash === '#/admin') {
        this.renderCurrentRoute();
      }
    } else {
      this.showToast(res?.message || 'Gagal memperbarui foto profil.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Simpan Foto';
      }
    }
  }

  async resetProfileAvatar() {
    const user = window.authService.getCurrentUser();
    if (!user) return;
    const res = await window.askrindoDB.updateUserAvatar(user.id, null);
    if (res && res.success) {
      this.refreshAvatarElements(user.id, res.avatar);
      this.closeAllModals();
      this.showToast('Foto profil dikembalikan ke default.', 'info');
      if (window.location.hash === '#/admin') {
        this.renderCurrentRoute();
      }
    }
  }

  refreshAvatarElements(userId, avatarSrc) {
    document.querySelectorAll(`img[data-user-avatar="${userId}"]`).forEach(img => {
      img.src = avatarSrc;
    });
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

  showMyActivityModal() {
    const modal = document.getElementById('global-modal-container');
    if (!modal) return;

    const user = window.authService.getCurrentUser();
    if (!user) return;

    const logs = window.askrindoDB.getAuditLogsForUser(user);

    modal.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between border-b pb-3 border-slate-100 shrink-0">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <i data-lucide="history" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="text-base font-bold text-slate-800">Riwayat Aktivitas Saya</h3>
                <p class="text-[11px] text-slate-400">
                  Akun: <span class="font-medium text-slate-700">${user.name}</span> &bull; NIP: <span class="font-mono text-slate-700">${user.nip}</span> &bull; Role: <span class="text-slate-700">${user.role}</span>
                </p>
              </div>
            </div>
            <button onclick="window.askrindoApp.closeAllModals()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer" title="Tutup Modal">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Search & Filter bar -->
          <div class="flex items-center gap-3 shrink-0">
            <div class="relative flex-1">
              <i data-lucide="search" class="w-4 h-4 absolute left-3 top-2.5 text-slate-400"></i>
              <input 
                type="text" 
                id="my-activity-search" 
                oninput="window.askrindoApp.filterMyActivityList()" 
                placeholder="Cari aktivitas, modul, atau kata kunci..." 
                class="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
              />
            </div>
            <span class="text-xs font-semibold text-slate-600 shrink-0 bg-slate-100 px-3 py-2 rounded-xl">
              Total: <span id="my-activity-count">${logs.length}</span> log
            </span>
          </div>

          <!-- Scrollable Log List -->
          <div id="my-activity-list" class="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-1">
            ${logs.length === 0 ? `
              <div class="py-12 text-center flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 my-2">
                <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <i data-lucide="inbox" class="w-6 h-6"></i>
                </div>
                <p class="text-xs font-semibold text-slate-700">Belum Ada Riwayat Aktivitas</p>
                <p class="text-[11px] text-slate-400 max-w-sm mt-0.5">
                  Aktivitas yang Anda lakukan pada modul portal akan otomatis tercatat dan muncul di sini.
                </p>
              </div>
            ` : logs.map(log => {
                const dateObj = new Date(log.timestamp);
                const formattedDate = isNaN(dateObj.getTime()) ? log.timestamp : dateObj.toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });
                const formattedTime = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit'
                }) + ' WIB';

                return `
                  <div class="activity-item py-3 flex items-start justify-between gap-3 text-left">
                    <div class="flex items-start gap-3 min-w-0">
                      <div class="w-9 h-9 rounded-xl bg-slate-100 text-blue-700 border border-slate-200/80 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                        ${log.subApp || 'PORTAL'}
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <p class="text-xs font-bold text-slate-800">${log.action}</p>
                          <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">${log.id}</span>
                        </div>
                        <p class="text-xs text-slate-600 mt-0.5 break-words">${log.details}</p>
                        <p class="text-[10px] text-slate-400 mt-1">
                          Dicatat pada: <span class="font-medium text-slate-600">${formattedDate} ${formattedTime}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between pt-3 border-t border-slate-100 shrink-0">
            <span class="text-[11px] text-slate-400">
              Menampilkan data audit log khusus untuk akun Anda
            </span>
            <button 
              type="button" 
              onclick="window.askrindoApp.closeAllModals()" 
              class="px-5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
    setTimeout(() => document.getElementById('my-activity-search')?.focus(), 50);
  }

  filterMyActivityList() {
    const searchInput = document.getElementById('my-activity-search');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const container = document.getElementById('my-activity-list');
    if (!container) return;
    const items = container.querySelectorAll('.activity-item');
    let visibleCount = 0;

    items.forEach(item => {
      const text = item.textContent.toLowerCase();
      if (!query || text.includes(query)) {
        item.style.display = 'flex';
        visibleCount++;
      } else {
        item.style.display = 'none';
      }
    });

    const countSpan = document.getElementById('my-activity-count');
    if (countSpan) countSpan.textContent = visibleCount;
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
