/**
 * owner-api.js — Owner App API Layer
 * Automatically attaches JWT, enforces OWNER role
 */

/**
 * Tự động phát hiện BASE_URL của backend.
 * - localhost / 127.0.0.1 / file:// → http://localhost:3000
 * - GitHub Pages / production      → đọc <meta name="api-base"> hoặc cùng origin
 */
function getBaseUrl() {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') {
    return 'http://localhost:3000';
  }
  const metaEl = document.querySelector('meta[name="api-base"]');
  if (metaEl && metaEl.content) return metaEl.content.replace(/\/$/, '');
  return `${window.location.protocol}//${window.location.hostname}`;
}
const BASE_URL = getBaseUrl();

const OwnerApi = {
  getToken() { return localStorage.getItem('owner_token'); },
  getUser() { try { return JSON.parse(localStorage.getItem('owner_user') || 'null'); } catch { return null; } },
  isLoggedIn() { return !!this.getToken(); },

  logout() {
    localStorage.removeItem('owner_token');
    localStorage.removeItem('owner_user');
    window.location.href = 'index.html';
  },

  async _fetch(path, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Lỗi không xác định');
      throw new Error(msg);
    }
    return data;
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  async login(email, password) {
    const data = await this._fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.user?.role !== 'OWNER') {
      throw new Error('Tài khoản này không có quyền OWNER. Vui lòng dùng tài khoản chủ trọ.');
    }
    return data;
  },

  // ── Properties ────────────────────────────────────────────────────────────
  getProperties() { return this._fetch('/properties'); },
  getProperty(id) { return this._fetch(`/properties/${id}`); },
  createProperty(dto) { return this._fetch('/properties', { method: 'POST', body: JSON.stringify(dto) }); },
  updateProperty(id, dto) { return this._fetch(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }); },
  deleteProperty(id) { return this._fetch(`/properties/${id}`, { method: 'DELETE' }); },

  // ── Rooms ─────────────────────────────────────────────────────────────────
  getRooms() { return this._fetch('/rooms'); },
  getRoom(id) { return this._fetch(`/rooms/${id}`); },
  createRoom(dto) { return this._fetch('/rooms', { method: 'POST', body: JSON.stringify(dto) }); },
  updateRoom(id, dto) { return this._fetch(`/rooms/${id}`, { method: 'PATCH', body: JSON.stringify(dto) }); },
  deleteRoom(id) { return this._fetch(`/rooms/${id}`, { method: 'DELETE' }); },

  // ── Orders ────────────────────────────────────────────────────────────────
  getOrders() { return this._fetch('/orders'); },
  updateOrderStatus(id, status) {
    return this._fetch(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
  },
};
