/**
 * api.js — Centralized API layer for PhongTro platform
 * All backend calls go through here, JWT is attached automatically.
 */
const BASE_URL = '/api';

const Api = {
  // ─── Helpers ────────────────────────────────────────────────────────────────
  getToken() {
    return localStorage.getItem('access_token');
  },

  getUser() {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch { return null; }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  async _fetch(path, options = {}) {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg = Array.isArray(data.message) ? data.message.join(', ') : (data.message || 'Request failed');
      throw new Error(msg);
    }
    return data;
  },

  // ─── Auth ────────────────────────────────────────────────────────────────────
  login(email, password) {
    return this._fetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register(payload) {
    return this._fetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getProfile() {
    return this._fetch('/auth/profile');
  },

  // ─── Search ──────────────────────────────────────────────────────────────────
  searchRooms({ location = '', minPrice = '', maxPrice = '', page = 1, limit = 12, sort = '' } = {}) {
    const params = new URLSearchParams();
    if (location)  params.set('location', location);
    if (minPrice)  params.set('minPrice', minPrice);
    if (maxPrice)  params.set('maxPrice', maxPrice);
    if (page)      params.set('page', page);
    if (limit)     params.set('limit', limit);
    if (sort)      params.set('sort', sort);
    return this._fetch(`/search?${params.toString()}`);
  },

  // ─── Rooms ───────────────────────────────────────────────────────────────────
  getRooms() {
    return this._fetch('/rooms');
  },

  getRoomById(id) {
    return this._fetch(`/rooms/${id}`);
  },

  // ─── Bookings (Orders) ────────────────────────────────────────────────────────
  createBooking(roomId, quantity = 1) {
    return this._fetch('/orders', {
      method: 'POST',
      body: JSON.stringify({ items: [{ room_id: roomId, quantity }] }),
    });
  },

  getMyOrders() {
    return this._fetch('/orders');
  },
};
