/* ===================================================
   RentEase Dashboard — dashboard.js
   ERD-enforced Property → Room Management
   =================================================== */

const API = '/api';

// ─── Auth Guard ───────────────────────────────────────
function getAuthToken() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = 'index.html';
    return null;
  }
  return token;
}

function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Returns headers with JWT bearer token for protected endpoints
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAuthToken()}`,
  };
}

// ─── State ───────────────────────────────────────────
let properties = [];
let rooms      = [];
let pendingDeleteId   = null;
let pendingDeleteType = null; // 'property' | 'room'

// ─── Init ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // 🔒 Auth guard — redirect to login if no token
  if (!getAuthToken()) return;

  // Show logged-in user info in topbar
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      const emailEl = document.getElementById('topbar-user-email');
      if (emailEl) emailEl.textContent = user.email || 'User';
    } catch { /* ignore */ }
  }

  await checkApi();
  await loadProperties();
  await loadRooms();

  document.getElementById('propertyForm').addEventListener('submit', handleCreateProperty);
  document.getElementById('roomForm').addEventListener('submit', handleCreateRoom);
});

// ─── API Health Check ─────────────────────────────────
async function checkApi() {
  const dot  = document.getElementById('api-status-dot');
  const text = document.getElementById('api-status-text');
  try {
    const res = await fetch(`${API}/properties`);
    if (res.ok || res.status === 401) {
      dot.classList.add('online');
      text.textContent = 'API Online';
    } else { throw new Error(); }
  } catch {
    dot.classList.add('offline');
    text.textContent = 'API Offline';
  }
}

// ─── Page Navigation ──────────────────────────────────
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(`page-${page}`).classList.add('active');
  document.getElementById(`nav-${page}`)?.classList.add('active');

  const titles = { properties: 'Properties', rooms: 'Rooms', overview: 'ERD View' };
  document.getElementById('page-title').textContent = titles[page] || page;

  if (page === 'rooms')    refreshRoomPage();
  if (page === 'overview') loadOverview();
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ─── PROPERTIES ───────────────────────────────────────
async function loadProperties() {
  try {
    const res = await fetch(`${API}/properties`);
    if (!res.ok) throw new Error('Failed to load properties');
    properties = await res.json();
    renderProperties();
    updateBadges();
    updateStats();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

function renderProperties() {
  const list  = document.getElementById('properties-list');
  const empty = document.getElementById('properties-empty');

  if (!properties.length) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.classList.remove('hidden');
    return;
  }

  const html = properties.map(p => {
    const roomCount = Array.isArray(p.rooms) ? p.rooms.length : 0;
    const statusTag = `<span class="tag tag-${p.status || 'pending'}">${p.status || 'pending'}</span>`;
    return `
      <div class="property-item" id="prop-${p.property_id}">
        <div class="property-icon">🏢</div>
        <div class="property-info">
          <div class="property-name">${escHtml(p.name || 'Unnamed Property')}</div>
          <div class="property-address">📍 ${escHtml(p.address || '—')}${p.city ? ', ' + escHtml(p.city) : ''}</div>
          <div class="property-tags">
            ${statusTag}
            <span class="tag tag-rooms">🚪 ${roomCount} room${roomCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="property-actions">
          <button class="icon-btn" title="Add room to this property"
            onclick="goAddRoomFor(${p.property_id})">➕</button>
          <button class="icon-btn danger" title="Delete property"
            onclick="confirmDelete('property', ${p.property_id}, '${escHtml(p.name || '')}')">🗑️</button>
        </div>
      </div>`;
  }).join('');

  list.innerHTML = html;
}

async function handleCreateProperty(e) {
  e.preventDefault();
  const btn  = document.getElementById('prop-submit-btn');
  const name    = document.getElementById('prop-name').value.trim();
  const address = document.getElementById('prop-address').value.trim();
  const city    = document.getElementById('prop-city').value.trim();
  const status  = document.getElementById('prop-status').value;

  if (!name || !address) {
    showAlert('Name and Address are required', 'error'); return;
  }

  setLoading(btn, true, '⏳ Creating...');
  try {
    const res = await fetch(`${API}/properties`, {
      method: 'POST',
      headers: authHeaders(),                          // 🔒 JWT required
      body: JSON.stringify({ name, address, city, status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create property');

    showAlert(`Property "${name}" created successfully!`, 'success');
    document.getElementById('propertyForm').reset();
    await loadProperties();
    await loadRooms();
  } catch (err) {
    showAlert(err.message, 'error');
  } finally {
    setLoading(btn, false, '<span class="btn-icon">🏢</span> Create Property');
  }
}

// ─── ROOMS ────────────────────────────────────────────
async function loadRooms() {
  try {
    const res = await fetch(`${API}/rooms`);
    if (!res.ok) throw new Error('Failed to load rooms');
    rooms = await res.json();
    renderRooms();
    updateBadges();
    updateStats();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

function renderRooms() {
  const list  = document.getElementById('rooms-list');
  const empty = document.getElementById('rooms-empty');

  if (!rooms.length) {
    list.innerHTML = '';
    list.appendChild(empty);
    empty.classList.remove('hidden');
    return;
  }

  const statusColors = { available: 'tag-active', occupied: 'tag-pending', maintenance: 'tag-inactive' };
  const html = rooms.map(r => {
    const propName = r.property?.name || '—';
    const price    = r.price != null ? `$${Number(r.price).toLocaleString()}` : '—';
    const stClass  = statusColors[r.status] || 'tag-pending';
    return `
      <div class="room-item" id="room-${r.room_id}">
        <div class="room-icon">🚪</div>
        <div class="room-info">
          <div class="room-name">${escHtml(r.name || 'Unnamed Room')}</div>
          <div class="room-prop">🏢 ${escHtml(propName)}</div>
        </div>
        <span class="tag ${stClass}">${r.status || 'unknown'}</span>
        <div class="room-price">${price}</div>
        <button class="icon-btn danger" title="Delete room"
          onclick="confirmDelete('room', ${r.room_id}, '${escHtml(r.name || '')}')">🗑️</button>
      </div>`;
  }).join('');

  list.innerHTML = html;
}

function refreshRoomPage() {
  const warn   = document.getElementById('no-property-warning');
  const form   = document.getElementById('roomForm');
  const propSel = document.getElementById('room-property');

  if (!properties.length) {
    warn.classList.remove('hidden');
    // disable all inputs
    form.querySelectorAll('input, select, button').forEach(el => el.disabled = true);
  } else {
    warn.classList.add('hidden');
    form.querySelectorAll('input, select, button').forEach(el => el.disabled = false);
    populatePropertyDropdown();
  }
}

function populatePropertyDropdown(selectedId = null) {
  const sel = document.getElementById('room-property');
  const current = selectedId || sel.value;
  sel.innerHTML = '<option value="" disabled>— Select a Property —</option>';
  properties.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.property_id;
    opt.textContent = `🏢 ${p.name || 'Property #' + p.property_id}`;
    if (String(p.property_id) === String(current)) opt.selected = true;
    sel.appendChild(opt);
  });
  if (!current) sel.selectedIndex = 0;
}

// Jump to Rooms page with property pre-selected
function goAddRoomFor(propertyId) {
  showPage('rooms');
  populatePropertyDropdown(propertyId);
  document.getElementById('room-property').value = propertyId;
  document.getElementById('room-name').focus();
}

async function handleCreateRoom(e) {
  e.preventDefault();
  const btn        = document.getElementById('room-submit-btn');
  const property_id = Number(document.getElementById('room-property').value);
  const name        = document.getElementById('room-name').value.trim();
  const price       = Number(document.getElementById('room-price').value);
  const quantity    = Number(document.getElementById('room-quantity').value) || 1;
  const status      = document.getElementById('room-status').value;

  if (!property_id) {
    showAlert('Please select a property first', 'error'); return;
  }
  if (!name || !price) {
    showAlert('Room name and price are required', 'error'); return;
  }

  setLoading(btn, true, '⏳ Creating...');
  try {
    const res = await fetch(`${API}/rooms`, {
      method: 'POST',
      headers: authHeaders(),                          // 🔒 JWT required
      body: JSON.stringify({ name, price, quantity, status, property_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create room');

    showAlert(`Room "${name}" created successfully!`, 'success');
    document.getElementById('roomForm').reset();
    populatePropertyDropdown(property_id);
    document.getElementById('room-property').value = property_id;
    await loadRooms();
    await loadProperties(); // refresh room counts
  } catch (err) {
    showAlert(err.message, 'error');
  } finally {
    setLoading(btn, false, '<span class="btn-icon">🚪</span> Create Room');
  }
}

// ─── ERD OVERVIEW ────────────────────────────────────
async function loadOverview() {
  await loadProperties();
  await loadRooms();

  const tree = document.getElementById('erd-tree');

  if (!properties.length) {
    tree.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏗️</div>
        <h3>No data yet</h3>
        <p>Create properties and rooms to see the ERD tree.</p>
      </div>`;
    return;
  }

  // Build a map: property_id → [rooms]
  const roomsByProp = {};
  properties.forEach(p => { roomsByProp[p.property_id] = []; });
  rooms.forEach(r => {
    if (r.property?.property_id && roomsByProp[r.property.property_id] !== undefined) {
      roomsByProp[r.property.property_id].push(r);
    }
  });

  const html = properties.map(p => {
    const pRooms = roomsByProp[p.property_id] || (Array.isArray(p.rooms) ? p.rooms : []);
    const count  = pRooms.length;

    const roomNodes = pRooms.length
      ? pRooms.map(r => `
          <div class="erd-connector">
            <div class="erd-connector-line">
              <div class="v-line"></div>
            </div>
            <div class="h-line-wrap" style="display:flex;flex-direction:column;flex:1">
              <div style="display:flex;align-items:center;gap:0">
                <div style="width:20px;height:2px;background:var(--border-light);flex-shrink:0;margin-top:18px"></div>
                <div class="erd-room-node">
                  <span class="erd-room-type-label">ROOM</span>
                  <span class="erd-room-name">${escHtml(r.name || 'Unnamed')}</span>
                  <span class="tag tag-${r.status === 'available' ? 'active' : r.status === 'occupied' ? 'pending' : 'inactive'}" style="margin-left:auto;margin-right:8px">${r.status || '—'}</span>
                  <span class="erd-room-price">$${Number(r.price || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>`).join('')
      : `<div class="erd-no-rooms">↳ No rooms yet — <a href="#" onclick="goAddRoomFor(${p.property_id});return false;" style="color:var(--brand);">Add a room</a></div>`;

    return `
      <div class="erd-property-node">
        <div class="erd-property-header">
          <span class="erd-type-label">PROPERTY</span>
          <span class="erd-property-name">🏢 ${escHtml(p.name || 'Unnamed Property')}</span>
          <span class="erd-count-badge">🚪 ${count} room${count !== 1 ? 's' : ''}</span>
        </div>
        <div class="erd-property-meta">📍 ${escHtml(p.address || '—')}${p.city ? ', ' + escHtml(p.city) : ''} &nbsp;|&nbsp; Status: ${p.status || 'pending'}</div>
        <div class="erd-rooms-container">${roomNodes}</div>
      </div>`;
  }).join('');

  tree.innerHTML = html;
}

// ─── DELETE ───────────────────────────────────────────
function confirmDelete(type, id, name) {
  pendingDeleteId   = id;
  pendingDeleteType = type;

  const isProperty = type === 'property';
  document.getElementById('modal-title').textContent =
    isProperty ? `Delete Property?` : `Delete Room?`;
  document.getElementById('modal-body').textContent = isProperty
    ? `"${name}" and ALL its rooms will be permanently deleted.`
    : `Room "${name}" will be permanently deleted.`;

  document.getElementById('modal-confirm-btn').onclick = executeDelete;
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  pendingDeleteId   = null;
  pendingDeleteType = null;
}

async function executeDelete() {
  closeModal();
  if (!pendingDeleteId || !pendingDeleteType) return;
  const id   = pendingDeleteId;
  const type = pendingDeleteType;

  try {
    const endpoint = type === 'property' ? `${API}/properties/${id}` : `${API}/rooms/${id}`;
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: authHeaders(),                          // 🔒 JWT required
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Delete failed');
    }
    showAlert(
      type === 'property' ? 'Property and its rooms deleted.' : 'Room deleted.',
      'success'
    );
    await loadProperties();
    await loadRooms();
  } catch (err) {
    showAlert(err.message, 'error');
  }
}

// ─── HELPERS ──────────────────────────────────────────
function updateBadges() {
  document.getElementById('badge-properties').textContent = properties.length;
  document.getElementById('badge-rooms').textContent = rooms.length;
}

function updateStats() {
  const totalRooms = rooms.length;
  const avg = properties.length ? (totalRooms / properties.length).toFixed(1) : 0;
  document.getElementById('stat-total-properties').textContent = properties.length;
  document.getElementById('stat-total-rooms').textContent = totalRooms;
  document.getElementById('stat-avg-rooms').textContent = avg;
}

function showAlert(msg, type = 'success') {
  const banner = document.getElementById('alert-banner');
  document.getElementById('alert-message').textContent = msg;
  banner.className = `alert-banner ${type}`;
  banner.classList.remove('hidden');
  clearTimeout(window._alertTimer);
  window._alertTimer = setTimeout(hideAlert, 5000);
}

function hideAlert() {
  document.getElementById('alert-banner').classList.add('hidden');
}

function setLoading(btn, loading, text) {
  btn.disabled = loading;
  btn.innerHTML = text;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
