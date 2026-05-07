// home.js — Homepage logic

const FMT = new Intl.NumberFormat('vi-VN');

// ── Auth UI ─────────────────────────────────────────────────────────────────
function updateNavAuth() {
  const user = Api.getUser();
  const actions = document.getElementById('navActions');
  if (!actions) return;
  if (user) {
    actions.innerHTML = `
      <div class="user-menu">
        <div class="user-avatar" title="${user.email}">${user.email[0].toUpperCase()}</div>
        <span>${user.email}</span>
        <button class="btn-logout" onclick="handleLogout()">Đăng xuất</button>
      </div>`;
  }
}

function handleLogout() {
  Api.logout();
  window.location.reload();
}

// ── Modal ────────────────────────────────────────────────────────────────────
function openModal(tab = 'login') {
  document.getElementById('authModal').classList.remove('hidden');
  switchTab(tab);
}

function closeModal() {
  document.getElementById('authModal').classList.add('hidden');
  clearAlert();
}

function closeModalOutside(e) {
  if (e.target.id === 'authModal') closeModal();
}

function switchTab(tab) {
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  clearAlert();
}

function showAlert(msg, type = 'error') {
  const box = document.getElementById('alertBox');
  box.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

function clearAlert() {
  document.getElementById('alertBox').innerHTML = '';
}

// ── Auth Actions ─────────────────────────────────────────────────────────────
async function doLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass  = document.getElementById('loginPassword').value;
  if (!email || !pass) return showAlert('Vui lòng nhập đầy đủ thông tin');

  const btn = document.getElementById('btnLogin');
  btn.disabled = true; btn.textContent = 'Đang đăng nhập...';
  try {
    const data = await Api.login(email, pass);
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    showAlert('Đăng nhập thành công! 🎉', 'success');
    setTimeout(() => { closeModal(); updateNavAuth(); }, 800);
  } catch (e) {
    showAlert(e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Đăng nhập';
  }
}

async function doRegister() {
  const email    = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regConfirm').value;
  const role_id  = parseInt(document.getElementById('regRoleId').value);

  if (!email || !password || !confirm) return showAlert('Vui lòng nhập đầy đủ thông tin');
  if (password.length < 6)            return showAlert('Mật khẩu tối thiểu 6 ký tự');
  if (password !== confirm)           return showAlert('Mật khẩu xác nhận không khớp');

  const btn = document.getElementById('btnRegister');
  btn.disabled = true; btn.textContent = 'Đang đăng ký...';
  try {
    const data = await Api.register({ email, password, confirmPassword: confirm, role_id });
    localStorage.setItem('access_token', data.access_token);
    localStorage.setItem('user', JSON.stringify(data.user));
    showAlert('Đăng ký thành công! Chào mừng bạn 🎉', 'success');
    setTimeout(() => { closeModal(); updateNavAuth(); }, 800);
  } catch (e) {
    showAlert(e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Đăng ký';
  }
}

// ── Search ───────────────────────────────────────────────────────────────────
function doSearch() {
  const location = document.getElementById('heroLocation').value.trim();
  const minPrice = document.getElementById('heroMinPrice').value;
  const maxPrice = document.getElementById('heroMaxPrice').value;
  const params = new URLSearchParams();
  if (location) params.set('location', location);
  if (minPrice)  params.set('minPrice', minPrice);
  if (maxPrice)  params.set('maxPrice', maxPrice);
  window.location.href = `search.html?${params.toString()}`;
}

function searchCity(city) {
  window.location.href = `search.html?location=${encodeURIComponent(city)}`;
}

// ── Search tab UI ─────────────────────────────────────────────────────────────
document.querySelectorAll('.search-tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.search-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

// Enter key on search
document.getElementById('heroLocation')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});

// ── Room Card HTML ────────────────────────────────────────────────────────────
function buildRoomCard(room) {
  const prop    = room.property || {};
  const city    = prop.city || prop.address || 'Không rõ địa điểm';
  const price   = room.price ? `${FMT.format(room.price)} ₫/tháng` : 'Liên hệ';
  const status  = room.status || 'available';
  const badgeMap = {
    available:   ['badge-green',  'Còn phòng'],
    rented:      ['badge-red',    'Đã thuê'],
    unavailable: ['badge-gray',   'Không có sẵn'],
    pending:     ['badge-orange', 'Chờ duyệt'],
  };
  const [badgeCls, badgeTxt] = badgeMap[status] || badgeMap.available;

  return `
    <div class="room-card" onclick="window.location.href='room-detail.html?id=${room.room_id}'">
      <div class="room-card-img-placeholder">🏠</div>
      <div class="room-card-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
          <h3 class="room-card-title">${room.name || 'Phòng trọ'}</h3>
          <span class="badge ${badgeCls}" style="flex-shrink:0;margin-left:8px">${badgeTxt}</span>
        </div>
        <p class="room-card-location">📍 ${city}</p>
        ${prop.name ? `<p style="font-size:12px;color:#94a3b8;margin-bottom:8px">🏢 ${prop.name}</p>` : ''}
        <div class="room-card-footer">
          <div>
            <span class="room-price">${price}</span>
          </div>
          <button class="btn btn-primary btn-sm">Xem chi tiết</button>
        </div>
      </div>
    </div>`;
}

// ── Featured Rooms ────────────────────────────────────────────────────────────
async function loadFeaturedRooms() {
  const container = document.getElementById('featuredRooms');
  try {
    const res = await Api.searchRooms({ limit: 8 });
    const rooms = res.data || res;
    if (!rooms.length) {
      container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🏠</div><h3>Chưa có phòng nào</h3><p>Hãy quay lại sau nhé!</p></div>`;
      return;
    }
    container.innerHTML = rooms.map(buildRoomCard).join('');
  } catch {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><h3>Không tải được dữ liệu</h3><p>Vui lòng kiểm tra kết nối backend</p></div>`;
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateNavAuth();
  loadFeaturedRooms();
});
