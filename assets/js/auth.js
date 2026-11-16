/**
 * Askrindo SATU - Authentication & Access Control
 * Handles login, session tokens, role-based permissions, and route security.
 */

class AuthService {
  constructor() {
    this.currentUser = null;
    this.init();
  }

  init() {
    this.currentUser = window.askrindoDB.getCurrentSession();
  }

  isAuthenticated() {
    this.currentUser = this.getCurrentUser();
    return !!this.currentUser;
  }

  getCurrentUser() {
    if (window.askrindoDB) {
      const sess = window.askrindoDB.getCurrentSession();
      if (sess) {
        this.currentUser = sess;
      }
    }
    return this.currentUser;
  }

  login(nipOrEmail, password) {
    const user = window.askrindoDB.findUserByNipOrEmail(nipOrEmail);
    if (!user) {
      return { success: false, message: 'NIP atau Email tidak terdaftar dalam sistem Askrindo SATU.' };
    }

    if (user.status !== 'active') {
      return { success: false, message: 'Akun Anda sedang dinonaktifkan oleh Administrator. Hubungi Divisi TI.' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Kata sandi tidak sesuai. Silakan periksa kembali.' };
    }

    // Update lastLogin
    user.lastLogin = new Date().toISOString();
    window.askrindoDB.saveUser(user);

    // Save session
    this.currentUser = user;
    window.askrindoDB.setSession(user);

    // Log to audit trail
    window.askrindoDB.logActivity('AUTH', 'User Login', `Pengguna ${user.name} (NIP ${user.nip}) berhasil masuk ke portal Askrindo SATU.`, user);

    // Dispatch event
    window.dispatchEvent(new CustomEvent('askrindo:auth-changed', { detail: { user } }));

    return { success: true, user };
  }

  quickLogin(userId) {
    const user = window.askrindoDB.getUser(userId);
    if (user) {
      user.lastLogin = new Date().toISOString();
      window.askrindoDB.saveUser(user);
      this.currentUser = user;
      window.askrindoDB.setSession(user);
      window.askrindoDB.logActivity('AUTH', 'Quick Demo Login', `Login demonstrasi sebagai ${user.name} (${user.role})`, user);
      window.dispatchEvent(new CustomEvent('askrindo:auth-changed', { detail: { user } }));
      return { success: true, user };
    }
    return { success: false, message: 'Pengguna demo tidak ditemukan.' };
  }

  changePassword(oldPassword, newPassword) {
    if (!this.currentUser) {
      return { success: false, message: 'Sesi pengguna tidak valid.' };
    }
    const currentPass = this.currentUser.password || 'password123';
    if (currentPass !== oldPassword) {
      return { success: false, message: 'Kata sandi saat ini tidak cocok. Silakan periksa kembali.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Kata sandi baru minimal 6 karakter.' };
    }
    if (newPassword === oldPassword) {
      return { success: false, message: 'Kata sandi baru tidak boleh sama dengan kata sandi lama.' };
    }

    this.currentUser.password = newPassword;
    window.askrindoDB.saveUser(this.currentUser);
    window.askrindoDB.setSession(this.currentUser);
    window.askrindoDB.logActivity('AUTH', 'Ubah Password', `Pengguna ${this.currentUser.name} (NIP ${this.currentUser.nip}) berhasil memperbarui kata sandi.`, this.currentUser);

    return { success: true, message: 'Kata sandi berhasil diperbarui!' };
  }

  logout() {
    if (this.currentUser) {
      window.askrindoDB.logActivity('AUTH', 'User Logout', `Pengguna ${this.currentUser.name} keluar dari portal Askrindo SATU.`, this.currentUser);
    }
    this.currentUser = null;
    window.askrindoDB.clearSession();
    window.dispatchEvent(new CustomEvent('askrindo:auth-changed', { detail: { user: null } }));
    window.location.hash = '#/login';
  }

  isAppInDevelopment(appId) {
    const rawKey = (appId || '').toLowerCase();
    const aliasMap = {
      'buset': 'sedia',
      'bus': 'sedia',
      'ttk': 'akur',
      'pelaku': 'lapor'
    };
    const key = aliasMap[rawKey] || rawKey;
    const devMap = window.APP_DEPLOYMENT_STATUS;
    if (devMap && devMap[key]) {
      return devMap[key].status === 'coming_soon' || devMap[key].status === 'development';
    }
    return ['kabar', 'akur', 'ttk', 'sedia', 'bus', 'cepat'].includes(key);
  }

  isAppComingSoon(appId) {
    return this.isAppInDevelopment(appId);
  }

  hasAccess(appId) {
    const user = this.getCurrentUser();
    if (!user) return false;

    // Super Administrator memiliki akses universal
    if (this.canAccessAdmin()) return true;

    const rawKey = (appId || '').toLowerCase().trim();
    const aliasGroups = {
      kabar: ['kabar'],
      akur: ['akur', 'ttk'],
      ttk: ['akur', 'ttk'],
      sedia: ['sedia', 'bus', 'buset'],
      bus: ['sedia', 'bus', 'buset'],
      buset: ['sedia', 'bus', 'buset'],
      cepat: ['cepat'],
      lapor: ['lapor', 'pelaku'],
      pelaku: ['lapor', 'pelaku'],
      admin: ['admin']
    };
    const validKeys = aliasGroups[rawKey] || [rawKey];
    const allowed = Array.isArray(user.allowedApps) ? user.allowedApps.map(a => String(a).toLowerCase().trim()) : [];

    return validKeys.some(k => allowed.includes(k));
  }

  canAccessAdmin() {
    const user = this.getCurrentUser();
    return !!(user && (user.role === 'Super Administrator' || (Array.isArray(user.allowedApps) && user.allowedApps.includes('admin'))));
  }
}

// Global Export
window.authService = new AuthService();
