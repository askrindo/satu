/**
 * Askrindo SATU - Web Admin Module
 * User management, permission matrix, sub-app access control, and audit logs.
 */

window.AdminModule = {
  currentTab: 'users', // 'users' | 'matrix' | 'audit' | 'settings'
  searchQuery: '',
  roleFilter: 'all',

  render() {
    const user = window.authService.getCurrentUser();
    if (!user || !window.authService.canAccessAdmin()) {
      return this.renderAccessDenied();
    }

    const users = window.askrindoDB.getUsers();
    const activeCount = users.filter(u => u.status === 'active').length;
    const auditLogs = window.askrindoDB.getAuditLogs();
    const settings = window.askrindoDB.getSettings();

    // Filtered users for tab 1
    const filteredUsers = users.filter(u => {
      const matchSearch = !this.searchQuery || 
        u.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        u.nip.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        u.branch.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchRole = this.roleFilter === 'all' || u.role === this.roleFilter;
      return matchSearch && matchRole;
    });

    const uniqueRoles = Array.from(new Set(users.map(u => u.role)));

    return `
      <div class="space-y-6 animate-fadeIn">
        <!-- Top Admin Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#002B49] to-blue-800 text-white flex items-center justify-center shadow-md">
              <i data-lucide="shield-check" class="w-6 h-6 text-amber-400"></i>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h1 class="text-2xl font-black text-slate-800 tracking-tight">Portal Web Admin</h1>
                <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Super Administrator
                </span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">
                Kelola master pengguna, konfigurasi hak akses sub-aplikasi (KABAR, TTK, BUSET, PELAKU), dan pantau audit trail operasional.
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="window.AdminModule.openAddUserModal()" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-md shadow-orange-500/20 transition-all">
              <i data-lucide="user-plus" class="w-4 h-4"></i>
              <span>Tambah User Baru</span>
            </button>
            <button onclick="window.AdminModule.resetDefaultData()" title="Reset ke Data Bawaan" class="p-2.5 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
            </button>
          </div>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Terdaftar</p>
              <h3 class="text-2xl font-black text-slate-800 mt-1">${users.length} <span class="text-xs font-normal text-slate-400">Pengguna</span></h3>
            </div>
            <div class="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <i data-lucide="users" class="w-5 h-5"></i>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pengguna Aktif</p>
              <h3 class="text-2xl font-black text-emerald-600 mt-1">${activeCount} <span class="text-xs font-normal text-slate-400">Akun</span></h3>
            </div>
            <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i data-lucide="user-check" class="w-5 h-5"></i>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sub-Aplikasi Dikelola</p>
              <h3 class="text-2xl font-black text-orange-600 mt-1">4 + 1 <span class="text-xs font-normal text-slate-400">Aplikasi</span></h3>
            </div>
            <div class="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <i data-lucide="layers" class="w-5 h-5"></i>
            </div>
          </div>

          <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Audit Log</p>
              <h3 class="text-2xl font-black text-purple-600 mt-1">${auditLogs.length} <span class="text-xs font-normal text-slate-400">Aktivitas</span></h3>
            </div>
            <div class="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <i data-lucide="file-clock" class="w-5 h-5"></i>
            </div>
          </div>
        </div>

        <!-- Admin Tab Navigation -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div class="flex items-center border-b border-slate-200 px-6 pt-3 gap-6 text-sm font-semibold">
            <button onclick="window.AdminModule.setTab('users')" class="pb-3 border-b-2 transition-all flex items-center gap-2 ${this.currentTab === 'users' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}">
              <i data-lucide="users" class="w-4 h-4"></i>
              <span>Manajemen Pengguna</span>
              <span class="px-2 py-0.5 rounded-full text-[11px] bg-slate-100 text-slate-600">${users.length}</span>
            </button>
            <button onclick="window.AdminModule.setTab('matrix')" class="pb-3 border-b-2 transition-all flex items-center gap-2 ${this.currentTab === 'matrix' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}">
              <i data-lucide="table-2" class="w-4 h-4"></i>
              <span>Matriks Hak Akses Sub-Aplikasi</span>
              <span class="px-2 py-0.5 rounded-full text-[11px] bg-amber-50 text-amber-700 font-bold">Live Matrix</span>
            </button>
            <button onclick="window.AdminModule.setTab('audit')" class="pb-3 border-b-2 transition-all flex items-center gap-2 ${this.currentTab === 'audit' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}">
              <i data-lucide="history" class="w-4 h-4"></i>
              <span>Audit Trail & Log Aktivitas</span>
            </button>
            <button onclick="window.AdminModule.setTab('settings')" class="pb-3 border-b-2 transition-all flex items-center gap-2 ${this.currentTab === 'settings' ? 'border-orange-500 text-orange-600' : 'border-transparent text-slate-500 hover:text-slate-800'}">
              <i data-lucide="settings" class="w-4 h-4"></i>
              <span>Pengaturan Sistem</span>
            </button>
          </div>

          <!-- Tab Contents -->
          <div class="p-6">
            ${this.renderActiveTab(filteredUsers, users, uniqueRoles, auditLogs, settings)}
          </div>
        </div>

        <!-- Container for Admin Modals -->
        <div id="admin-modal-container"></div>
      </div>
    `;
  },

  renderActiveTab(filteredUsers, allUsers, roles, auditLogs, settings) {
    if (this.currentTab === 'users') {
      return this.renderUsersTab(filteredUsers, roles);
    } else if (this.currentTab === 'matrix') {
      return this.renderMatrixTab(allUsers);
    } else if (this.currentTab === 'audit') {
      return this.renderAuditTab(auditLogs);
    } else if (this.currentTab === 'settings') {
      return this.renderSettingsTab(settings);
    }
  },

  renderUsersTab(filteredUsers, roles) {
    return `
      <div class="space-y-4">
        <!-- Search & Filter Controls -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div class="relative w-full sm:w-96">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3"></i>
            <input 
              type="text" 
              placeholder="Cari nama, NIP, email, cabang..." 
              value="${this.searchQuery}"
              oninput="window.AdminModule.handleSearch(this.value)"
              class="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto">
            <label class="text-xs font-medium text-slate-500 whitespace-nowrap">Filter Role:</label>
            <select 
              onchange="window.AdminModule.handleRoleFilter(this.value)"
              class="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-orange-500 font-medium text-slate-700"
            >
              <option value="all" ${this.roleFilter === 'all' ? 'selected' : ''}>Semua Role</option>
              ${roles.map(r => `<option value="${r}" ${this.roleFilter === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
          </div>
        </div>

        <!-- Users Table -->
        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Pengguna</th>
                <th class="py-3 px-4">NIP & Divisi</th>
                <th class="py-3 px-4">Cabang</th>
                <th class="py-3 px-4">Role</th>
                <th class="py-3 px-4">Akses Aplikasi</th>
                <th class="py-3 px-4 text-center">Status</th>
                <th class="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${filteredUsers.length === 0 ? `
                <tr>
                  <td colspan="7" class="text-center py-8 text-slate-400">
                    <i data-lucide="user-x" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                    Tidak ada pengguna yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ` : filteredUsers.map(user => `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <img src="${user.avatar}" alt="${user.name}" class="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      <div>
                        <p class="font-bold text-slate-800">${user.name}</p>
                        <p class="text-[11px] text-slate-400">${user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="font-mono font-medium text-slate-700">${user.nip}</span>
                    <p class="text-[11px] text-slate-500 line-clamp-1">${user.division}</p>
                  </td>
                  <td class="py-3 px-4 text-slate-700 font-medium">
                    ${user.branch}
                  </td>
                  <td class="py-3 px-4">
                    <span class="px-2.5 py-1 rounded-md text-[11px] font-semibold ${user.role.includes('Admin') ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-slate-100 text-slate-700'}">
                      ${user.role}
                    </span>
                  </td>
                  <td class="py-3 px-4">
                    <div class="flex flex-wrap gap-1">
                      ${user.allowedApps.map(app => {
                        const appBadgeColors = {
                          kabar: 'bg-orange-100 text-orange-800 border-orange-200',
                          ttk: 'bg-blue-100 text-blue-800 border-blue-200',
                          bus: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                          pelaku: 'bg-purple-100 text-purple-800 border-purple-200',
                          admin: 'bg-amber-100 text-amber-800 border-amber-200'
                        };
                        return `
                          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${appBadgeColors[app] || 'bg-slate-100 text-slate-600'}">
                            ${app}
                          </span>
                        `;
                      }).join('')}
                    </div>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${user.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}">
                      <span class="w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : 'bg-rose-500'}"></span>
                      ${user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td class="py-3 px-4 text-center">
                    <div class="inline-flex items-center gap-1">
                      <button onclick="window.AdminModule.openEditUserModal('${user.id}')" title="Edit Pengguna & Hak Akses" class="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                      </button>
                      <button onclick="window.AdminModule.toggleUserStatus('${user.id}')" title="${user.status === 'active' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}" class="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors">
                        <i data-lucide="${user.status === 'active' ? 'user-x' : 'user-check'}" class="w-4 h-4"></i>
                      </button>
                      ${user.id !== 'USR-001' ? `
                        <button onclick="window.AdminModule.confirmDeleteUser('${user.id}', '${user.name}')" title="Hapus Pengguna" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      ` : ''}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderMatrixTab(allUsers) {
    const appsList = [
      { id: 'kabar', name: 'KABAR', label: 'Asuransi Kebakaran', color: 'text-orange-600' },
      { id: 'ttk', name: 'TTK', label: 'Tanya-Tanya KUR', color: 'text-blue-600' },
      { id: 'bus', name: 'BUSET', label: 'Buat SPPA Elektronik', color: 'text-emerald-600' },
      { id: 'pelaku', name: 'PELAKU', label: 'Laporan Keuangan', color: 'text-purple-600' },
      { id: 'admin', name: 'ADMIN', label: 'Web Admin Portal', color: 'text-amber-600' }
    ];

    return `
      <div class="space-y-4">
        <div class="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
          <i data-lucide="info" class="w-5 h-5 text-amber-600 shrink-0 mt-0.5"></i>
          <div>
            <h4 class="text-xs font-bold text-amber-900">Matriks Hak Akses Sub-Aplikasi Terintegrasi</h4>
            <p class="text-xs text-amber-800 mt-0.5">
              Klik pada tombol centang di bawah untuk langsung memberikan atau mencabut izin akses sub-aplikasi kepada setiap pegawai. Perubahan tersimpan secara realtime ke basis data.
            </p>
          </div>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th class="py-3.5 px-4 w-72">Pegawai / NIP</th>
                <th class="py-3.5 px-4">Jabatan & Cabang</th>
                ${appsList.map(app => `
                  <th class="py-3.5 px-4 text-center">
                    <div class="font-extrabold ${app.color}">${app.name}</div>
                    <div class="text-[10px] font-normal text-slate-400">${app.label}</div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${allUsers.map(user => `
                <tr class="hover:bg-slate-50/60 transition-colors">
                  <td class="py-3 px-4">
                    <div class="flex items-center gap-3">
                      <img src="${user.avatar}" class="w-8 h-8 rounded-full object-cover border" />
                      <div>
                        <p class="font-bold text-slate-800">${user.name}</p>
                        <p class="text-[11px] font-mono text-slate-400">NIP: ${user.nip}</p>
                      </div>
                    </div>
                  </td>
                  <td class="py-3 px-4">
                    <span class="font-semibold text-slate-700">${user.role}</span>
                    <p class="text-[11px] text-slate-500">${user.branch}</p>
                  </td>
                  ${appsList.map(app => {
                    const isChecked = user.allowedApps && user.allowedApps.includes(app.id);
                    const isSuperAdminUser = user.id === 'USR-001' && app.id === 'admin';
                    return `
                      <td class="py-3 px-4 text-center">
                        <label class="inline-flex items-center justify-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            ${isChecked ? 'checked' : ''} 
                            ${isSuperAdminUser ? 'disabled title="Super Admin utama tidak dapat dinonaktifkan"' : ''}
                            onchange="window.AdminModule.toggleMatrixPermission('${user.id}', '${app.id}', this.checked)"
                            class="w-5 h-5 rounded text-orange-600 focus:ring-orange-500 border-slate-300 transition cursor-pointer disabled:opacity-50"
                          />
                        </label>
                      </td>
                    `;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderAuditTab(auditLogs) {
    return `
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <p class="text-xs text-slate-500">
            Merekam seluruh jejak aktivitas pengguna di portal Askrindo SATU demi kepatuhan tata kelola (Governance, Risk, and Compliance / GRC).
          </p>
          <button onclick="window.AdminModule.exportLogsCsv()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
            <i data-lucide="download" class="w-3.5 h-3.5"></i>
            <span>Export CSV</span>
          </button>
        </div>

        <div class="overflow-x-auto rounded-xl border border-slate-200">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th class="py-3 px-4">Waktu</th>
                <th class="py-3 px-4">User</th>
                <th class="py-3 px-4">Modul</th>
                <th class="py-3 px-4">Aksi</th>
                <th class="py-3 px-4">Rincian Log</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${auditLogs.map(log => `
                <tr class="hover:bg-slate-50/60">
                  <td class="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                    ${new Date(log.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td class="py-3 px-4">
                    <p class="font-bold text-slate-800">${log.user}</p>
                    <p class="text-[11px] text-slate-400">${log.role}</p>
                  </td>
                  <td class="py-3 px-4">
                    <span class="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700 border">
                      ${log.subApp}
                    </span>
                  </td>
                  <td class="py-3 px-4 font-semibold text-slate-700">
                    ${log.action}
                  </td>
                  <td class="py-3 px-4 text-slate-600">
                    ${log.details}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderSettingsTab(settings) {
    return `
      <div class="max-w-2xl space-y-6">
        <div class="space-y-4">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Identitas Portal Perusahaan</h3>
          
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Aplikasi Terpadu</label>
            <input type="text" id="setting-app-name" value="${settings.appName || 'Askrindo SATU'}" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Nama Entitas / Perusahaan</label>
            <input type="text" id="setting-company-name" value="${settings.companyName || 'PT Asuransi Kredit Indonesia'}" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Running Banner / Pengumuman Terpadu</label>
            <textarea id="setting-banner" rows="3" class="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500">${settings.notificationBanner || ''}</textarea>
          </div>

          <div class="pt-2">
            <button onclick="window.AdminModule.saveSettings()" class="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 transition">
              Simpan Pengaturan Portal
            </button>
          </div>
        </div>

        <div class="pt-6 border-t border-slate-200 space-y-3">
          <h3 class="text-sm font-bold text-slate-800 uppercase tracking-wider">Pemulihan & Backup Basis Data</h3>
          <p class="text-xs text-slate-500">
            Anda dapat mengekspor seluruh data simulasi SPPA, pengguna, dan audit log ke berkas JSON atau mengembalikan data ke bawaan pabrik.
          </p>
          <div class="flex items-center gap-3 pt-1">
            <button onclick="window.AdminModule.exportBackupJson()" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition flex items-center gap-1.5">
              <i data-lucide="download" class="w-4 h-4"></i>
              <span>Download Backup Data JSON</span>
            </button>
            <button onclick="window.AdminModule.resetDefaultData()" class="px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1.5">
              <i data-lucide="refresh-cw" class="w-4 h-4"></i>
              <span>Reset Semua Data</span>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderAccessDenied() {
    return `
      <div class="max-w-md mx-auto my-12 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
        <div class="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <i data-lucide="shield-alert" class="w-8 h-8"></i>
        </div>
        <h2 class="text-xl font-bold text-slate-800">Akses Administrator Terbatas</h2>
        <p class="text-xs text-slate-500 leading-relaxed">
          Akun Anda tidak memiliki hak akses Administrator untuk mengelola pengguna dan matriks hak akses. Silakan hubungi Divisi TI Askrindo untuk peningkatan wewenang.
        </p>
        <div class="pt-2">
          <a href="#/dashboard" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs text-white bg-slate-800 hover:bg-slate-900 transition">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            <span>Kembali ke Beranda Terpadu</span>
          </a>
        </div>
      </div>
    `;
  },

  // Handlers
  setTab(tab) {
    this.currentTab = tab;
    window.askrindoApp.renderCurrentRoute();
  },

  handleSearch(val) {
    this.searchQuery = val;
    window.askrindoApp.renderCurrentRoute();
  },

  handleRoleFilter(role) {
    this.roleFilter = role;
    window.askrindoApp.renderCurrentRoute();
  },

  toggleMatrixPermission(userId, appId, isChecked) {
    const user = window.askrindoDB.getUser(userId);
    if (!user) return;

    let apps = [...user.allowedApps];
    if (isChecked) {
      if (!apps.includes(appId)) apps.push(appId);
    } else {
      apps = apps.filter(a => a !== appId);
    }

    window.askrindoDB.updateUserPermissions(userId, apps);
    window.askrindoDB.logActivity('ADMIN', 'Update Hak Akses (Matrix)', `Akses modul ${appId.toUpperCase()} untuk ${user.name} diubah menjadi: ${isChecked ? 'Diberikan' : 'Dicabut'}`);
    
    window.askrindoApp.showToast(`Hak akses modul ${appId.toUpperCase()} berhasil diperbarui!`, 'success');
  },

  toggleUserStatus(userId) {
    const user = window.askrindoDB.getUser(userId);
    if (!user) return;
    if (user.id === 'USR-001') {
      window.askrindoApp.showToast('Super Administrator utama tidak dapat dinonaktifkan.', 'warning');
      return;
    }

    user.status = user.status === 'active' ? 'inactive' : 'active';
    window.askrindoDB.saveUser(user);
    window.askrindoDB.logActivity('ADMIN', 'Ubah Status Akun', `Status akun ${user.name} diubah menjadi ${user.status}`);
    window.askrindoApp.showToast(`Status pengguna ${user.name} berhasil diubah ke ${user.status}.`, 'info');
    window.askrindoApp.renderCurrentRoute();
  },

  confirmDeleteUser(userId, userName) {
    if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${userName}"? Tindakan ini tidak dapat dibatalkan.`)) {
      window.askrindoDB.deleteUser(userId);
      window.askrindoDB.logActivity('ADMIN', 'Hapus Pengguna', `Pengguna ${userName} (ID: ${userId}) telah dihapus dari sistem.`);
      window.askrindoApp.showToast(`Pengguna ${userName} berhasil dihapus.`, 'info');
      window.askrindoApp.renderCurrentRoute();
    }
  },

  openAddUserModal() {
    this.showUserModal();
  },

  openEditUserModal(userId) {
    const user = window.askrindoDB.getUser(userId);
    if (user) this.showUserModal(user);
  },

  showUserModal(user = null) {
    const isEdit = !!user;
    const container = document.getElementById('admin-modal-container');
    if (!container) return;

    const allowedApps = user ? user.allowedApps : ['kabar'];

    container.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b pb-3 border-slate-100">
            <h3 class="text-base font-bold text-slate-800">
              ${isEdit ? 'Edit Pengguna & Hak Akses' : 'Tambah Pengguna Baru'}
            </h3>
            <button onclick="document.getElementById('admin-modal-container').innerHTML=''" class="p-1 rounded-lg text-slate-400 hover:text-slate-600">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <form onsubmit="window.AdminModule.submitUserForm(event, '${user ? user.id : ''}')" class="space-y-3 text-xs">
            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nomor Induk Pegawai (NIP)</label>
              <input type="text" id="modal-nip" required value="${user ? user.nip : ''}" placeholder="Contoh: 19950812" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Nama Lengkap & Gelar</label>
              <input type="text" id="modal-name" required value="${user ? user.name : ''}" placeholder="Contoh: Muhammad Ihsan, S.E." class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500" />
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Email Askrindo (@askrindo.co.id)</label>
              <input type="email" id="modal-email" required value="${user ? user.email : ''}" placeholder="nama.depan@askrindo.co.id" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500" />
            </div>

            ${!isEdit ? `
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Kata Sandi Awal</label>
                <input type="password" id="modal-password" required value="password123" class="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500" />
              </div>
            ` : ''}

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-semibold text-slate-700 mb-1">Divisi Kerja</label>
                <select id="modal-division" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-white">
                  <option value="Divisi Underwriting & Penjaminan Non-Bank" ${user && user.division.includes('Underwriting') ? 'selected' : ''}>Divisi Underwriting</option>
                  <option value="Divisi Penjaminan Perbankan & Program KUR" ${user && user.division.includes('KUR') ? 'selected' : ''}>Divisi Penjaminan KUR</option>
                  <option value="Divisi Pemasaran Korporasi & Broker" ${user && user.division.includes('Pemasaran') ? 'selected' : ''}>Divisi Pemasaran</option>
                  <option value="Divisi Pelayanan & Operasional Cabang" ${user && user.division.includes('Operasional') ? 'selected' : ''}>Divisi Operasional</option>
                  <option value="Divisi Teknologi Informasi & Digitalisasi" ${user && user.division.includes('Teknologi') ? 'selected' : ''}>Divisi TI & Digital</option>
                  <option value="Divisi Manajemen Risiko & Kepatuhan" ${user && user.division.includes('Risiko') ? 'selected' : ''}>Divisi Manajemen Risiko</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-700 mb-1">Kantor Cabang</label>
                <select id="modal-branch" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-white">
                  <option value="Kantor Pusat - Jakarta" ${user && user.branch.includes('Pusat') ? 'selected' : ''}>Kantor Pusat</option>
                  <option value="Kantor Cabang Utama Jakarta Gambir" ${user && user.branch.includes('Gambir') ? 'selected' : ''}>KCU Jakarta Gambir</option>
                  <option value="Kantor Cabang Surabaya" ${user && user.branch.includes('Surabaya') ? 'selected' : ''}>KC Surabaya</option>
                  <option value="Kantor Cabang Medan" ${user && user.branch.includes('Medan') ? 'selected' : ''}>KC Medan</option>
                  <option value="Kantor Cabang Bandung" ${user && user.branch.includes('Bandung') ? 'selected' : ''}>KC Bandung</option>
                  <option value="Kantor Cabang Semarang" ${user && user.branch.includes('Semarang') ? 'selected' : ''}>KC Semarang</option>
                  <option value="Kantor Cabang Makassar" ${user && user.branch.includes('Makassar') ? 'selected' : ''}>KC Makassar</option>
                  <option value="Kantor Cabang Balikpapan" ${user && user.branch.includes('Balikpapan') ? 'selected' : ''}>KC Balikpapan</option>
                  <option value="Kantor Cabang Denpasar" ${user && user.branch.includes('Denpasar') ? 'selected' : ''}>KC Denpasar</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block font-semibold text-slate-700 mb-1">Jabatan / Role</label>
              <select id="modal-role" class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 bg-white">
                <option value="Super Administrator" ${user && user.role === 'Super Administrator' ? 'selected' : ''}>Super Administrator</option>
                <option value="Senior Underwriter" ${user && user.role === 'Senior Underwriter' ? 'selected' : ''}>Senior Underwriter</option>
                <option value="Account Officer KUR & UMKM" ${user && user.role.includes('Account Officer') ? 'selected' : ''}>Account Officer KUR & UMKM</option>
                <option value="Marketing & Relationship Officer" ${user && user.role.includes('Marketing') ? 'selected' : ''}>Marketing Officer</option>
                <option value="Staff Operasional (Junior)" ${user && user.role.includes('Staff Operasional') ? 'selected' : ''}>Staff Operasional</option>
              </select>
            </div>

            <!-- Granular Application Permissions Checkboxes -->
            <div class="pt-2 border-t border-slate-100">
              <label class="block font-bold text-slate-800 mb-2">Izin Akses Sub-Aplikasi Terpadu</label>
              <div class="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="perm-kabar" value="kabar" ${allowedApps.includes('kabar') ? 'checked' : ''} class="w-4 h-4 text-orange-600 rounded" />
                  <span class="font-semibold text-slate-800">KABAR</span>
                  <span class="text-slate-500 text-[11px]">— Kalkulator Asuransi Kebakaran</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="perm-ttk" value="ttk" ${allowedApps.includes('ttk') ? 'checked' : ''} class="w-4 h-4 text-blue-600 rounded" />
                  <span class="font-semibold text-slate-800">TTK</span>
                  <span class="text-slate-500 text-[11px]">— Tanya-Tanya KUR (Kredit Usaha Rakyat)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="perm-bus" value="bus" ${allowedApps.includes('bus') ? 'checked' : ''} class="w-4 h-4 text-emerald-600 rounded" />
                  <span class="font-semibold text-slate-800">BUSET</span>
                  <span class="text-slate-500 text-[11px]">— Buat SPPA Elektronik Terpadu (Surat Permohonan Penutupan Asuransi)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" id="perm-pelaku" value="pelaku" ${allowedApps.includes('pelaku') ? 'checked' : ''} class="w-4 h-4 text-purple-600 rounded" />
                  <span class="font-semibold text-slate-800">PELAKU</span>
                  <span class="text-slate-500 text-[11px]">— Perhitungan Laporan Keuangan</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer pt-1 border-t border-slate-200">
                  <input type="checkbox" id="perm-admin" value="admin" ${allowedApps.includes('admin') ? 'checked' : ''} class="w-4 h-4 text-amber-600 rounded" />
                  <span class="font-semibold text-amber-900">ADMIN</span>
                  <span class="text-amber-700 text-[11px]">— Akses Portal Web Admin & Kelola User</span>
                </label>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button type="button" onclick="document.getElementById('admin-modal-container').innerHTML=''" class="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition">
                Batal
              </button>
              <button type="submit" class="px-5 py-2 rounded-xl text-white font-semibold bg-orange-600 hover:bg-orange-700 transition">
                ${isEdit ? 'Simpan Perubahan' : 'Daftarkan Pengguna'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();
  },

  submitUserForm(e, existingId) {
    e.preventDefault();
    const nip = document.getElementById('modal-nip').value.trim();
    const name = document.getElementById('modal-name').value.trim();
    const email = document.getElementById('modal-email').value.trim();
    const division = document.getElementById('modal-division').value;
    const branch = document.getElementById('modal-branch').value;
    const role = document.getElementById('modal-role').value;

    const allowedApps = [];
    if (document.getElementById('perm-kabar').checked) allowedApps.push('kabar');
    if (document.getElementById('perm-ttk').checked) allowedApps.push('ttk');
    if (document.getElementById('perm-bus').checked) allowedApps.push('bus');
    if (document.getElementById('perm-pelaku').checked) allowedApps.push('pelaku');
    if (document.getElementById('perm-admin').checked) allowedApps.push('admin');

    const userData = {
      nip,
      name,
      email,
      division,
      branch,
      role,
      allowedApps
    };

    if (existingId) {
      userData.id = existingId;
      window.askrindoDB.saveUser(userData);
      window.askrindoDB.logActivity('ADMIN', 'Edit Pengguna', `Memperbarui data dan hak akses pengguna ${name}`);
      window.askrindoApp.showToast(`Data pengguna ${name} berhasil diperbarui.`, 'success');
    } else {
      userData.password = document.getElementById('modal-password').value || 'password123';
      window.askrindoDB.saveUser(userData);
      window.askrindoDB.logActivity('ADMIN', 'Tambah Pengguna Baru', `Menambahkan pengguna baru ${name} (NIP ${nip}) dengan role ${role}`);
      window.askrindoApp.showToast(`Pengguna baru ${name} berhasil didaftarkan.`, 'success');
    }

    document.getElementById('admin-modal-container').innerHTML = '';
    window.askrindoApp.renderCurrentRoute();
  },

  saveSettings() {
    const appName = document.getElementById('setting-app-name').value;
    const companyName = document.getElementById('setting-company-name').value;
    const notificationBanner = document.getElementById('setting-banner').value;

    window.askrindoDB.updateSettings({ appName, companyName, notificationBanner });
    window.askrindoDB.logActivity('ADMIN', 'Update Pengaturan Sistem', 'Memperbarui konfigurasi portal & pengumuman');
    window.askrindoApp.showToast('Pengaturan sistem berhasil disimpan.', 'success');
    window.askrindoApp.renderCurrentRoute();
  },

  exportBackupJson() {
    const backup = {
      timestamp: new Date().toISOString(),
      users: window.askrindoDB.getUsers(),
      sppa: window.askrindoDB.getSppaList(),
      auditLogs: window.askrindoDB.getAuditLogs(),
      settings: window.askrindoDB.getSettings()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backup, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `Askrindo_SATU_Backup_${new Date().toISOString().split('T')[0]}.json`);
    dlAnchor.click();
    window.askrindoApp.showToast('Berkas backup JSON berhasil diunduh.', 'success');
  },

  exportLogsCsv() {
    const logs = window.askrindoDB.getAuditLogs();
    let csvContent = "data:text/csv;charset=utf-8,ID,Timestamp,User,Role,SubApp,Action,Details\n";
    logs.forEach(l => {
      csvContent += `"${l.id}","${l.timestamp}","${l.user}","${l.role}","${l.subApp}","${l.action}","${l.details.replace(/"/g, '""')}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Audit_Trail_Askrindo_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.askrindoApp.showToast('Log audit berhasil diekspor ke CSV.', 'success');
  },

  resetDefaultData() {
    if (confirm('Apakah Anda yakin ingin mengembalikan semua data pengguna, SPPA, dan audit log ke kondisi awal (default)?')) {
      window.askrindoDB.resetAll();
      window.askrindoApp.showToast('Data sistem telah direset ke bawaan awal.', 'info');
      window.location.hash = '#/dashboard';
      location.reload();
    }
  }
};
