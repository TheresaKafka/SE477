// search.js — Search results page logic

const FMT = new Intl.NumberFormat('vi-VN');
let currentPage = 1;
const PAGE_SIZE = 12;

// ── Read URL params ───────────────────────────────────────────────────────────
function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    location: p.get('location') || '',
    minPrice: p.get('minPrice') || '',
    maxPrice: p.get('maxPrice') || '',
    page:     parseInt(p.get('page') || '1', 10),
    sort:     p.get('sort') || '',
  };
}

// ── Sync inputs from URL ──────────────────────────────────────────────────────
function syncInputsFromParams() {
  const { location, minPrice, maxPrice, sort } = getParams();
  ['searchLocation','fMinPrice'].forEach(() => {});
  const el = (id) => document.getElementById(id);
  if (el('searchLocation')) el('searchLocation').value = location;
  if (el('searchMinPrice')) el('searchMinPrice').value = minPrice;
  if (el('searchMaxPrice')) el('searchMaxPrice').value = maxPrice;
  if (el('fMinPrice'))      el('fMinPrice').value      = minPrice;
  if (el('fMaxPrice'))      el('fMaxPrice').value      = maxPrice;
  if (el('fSort'))          el('fSort').value          = sort;
  if (el('topSort'))        el('topSort').value        = sort;
}

// ── Apply search (update URL + reload) ───────────────────────────────────────
function applySearch(page = 1) {
  const location = document.getElementById('searchLocation')?.value.trim()
                || document.getElementById('fMinPrice') && '';
  const loc      = document.getElementById('searchLocation')?.value.trim() || '';
  const minP     = document.getElementById('fMinPrice')?.value || document.getElementById('searchMinPrice')?.value || '';
  const maxP     = document.getElementById('fMaxPrice')?.value || document.getElementById('searchMaxPrice')?.value || '';
  const sort     = document.getElementById('fSort')?.value || '';

  const params = new URLSearchParams();
  if (loc)  params.set('location', loc);
  if (minP) params.set('minPrice', minP);
  if (maxP) params.set('maxPrice', maxP);
  if (sort) params.set('sort', sort);
  if (page > 1) params.set('page', page);

  window.location.href = `search.html?${params.toString()}`;
}

function syncSort(val) {
  document.getElementById('fSort').value = val;
  applySearch(1);
}

function resetFilters() {
  window.location.href = 'search.html';
}

function setPrice(min, max) {
  document.getElementById('fMinPrice').value = min || '';
  document.getElementById('fMaxPrice').value = max || '';
  document.querySelectorAll('.qp-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

// ── Room card ─────────────────────────────────────────────────────────────────
function buildCard(room) {
  const prop   = room.property || {};
  const city   = prop.city || prop.address || 'Không rõ';
  const price  = room.price ? `${FMT.format(room.price)} ₫/tháng` : 'Liên hệ';
  const status = room.status || 'available';
  const badgeMap = {
    available:   ['badge-green',  'Còn phòng'],
    rented:      ['badge-red',    'Đã thuê'],
    unavailable: ['badge-gray',   'Không có sẵn'],
    pending:     ['badge-orange', 'Chờ duyệt'],
  };
  const [bc, bt] = badgeMap[status] || badgeMap.available;

  return `
    <div class="room-card" onclick="window.location.href='room-detail.html?id=${room.room_id}'">
      <div class="room-card-img-placeholder">🏠</div>
      <div class="room-card-body">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px">
          <h3 class="room-card-title">${room.name || 'Phòng trọ'}</h3>
          <span class="badge ${bc}" style="flex-shrink:0;margin-left:8px">${bt}</span>
        </div>
        <p class="room-card-location">📍 ${city}</p>
        ${prop.name ? `<p style="font-size:12px;color:#94a3b8;margin-bottom:8px">🏢 ${prop.name}</p>` : ''}
        <div class="room-card-footer">
          <span class="room-price">${price}</span>
          <button class="btn btn-primary btn-sm">Chi tiết</button>
        </div>
      </div>
    </div>`;
}

// ── Pagination ────────────────────────────────────────────────────────────────
function buildPagination(current, total) {
  const el = document.getElementById('pagination');
  if (total <= 1) { el.innerHTML = ''; return; }
  const { location, minPrice, maxPrice, sort } = getParams();

  let html = '';

  const makeBtn = (pg, label, active = false, disabled = false) => {
    if (disabled) return `<button class="page-btn" disabled>${label}</button>`;
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sort)     params.set('sort', sort);
    params.set('page', pg);
    return `<button class="page-btn${active ? ' active' : ''}" onclick="window.location.href='search.html?${params.toString()}'">${label}</button>`;
  };

  html += makeBtn(current - 1, '←', false, current === 1);
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 2) {
      html += makeBtn(i, i, i === current);
    } else if (Math.abs(i - current) === 3) {
      html += `<span style="padding:0 4px;color:#94a3b8">…</span>`;
    }
  }
  html += makeBtn(current + 1, '→', false, current === total);
  el.innerHTML = html;
}

// ── Load results ──────────────────────────────────────────────────────────────
async function loadResults() {
  const { location, minPrice, maxPrice, page, sort } = getParams();
  currentPage = page;

  const grid = document.getElementById('roomsGrid');
  const countEl = document.getElementById('resultCount');
  grid.innerHTML = `<div class="loading-section" style="grid-column:1/-1"><div class="spinner"></div><span>Đang tìm kiếm...</span></div>`;

  try {
    const res = await Api.searchRooms({ location, minPrice, maxPrice, page, limit: PAGE_SIZE, sort });
    const rooms = res.data || [];
    const total = res.total || 0;
    const totalPages = res.totalPages || 1;

    // Search summary
    const locTxt = location ? `tại "<strong>${location}</strong>"` : '';
    const priceTxt = (minPrice || maxPrice)
      ? ` | Giá: ${minPrice ? FMT.format(minPrice) + '₫' : '0'} – ${maxPrice ? FMT.format(maxPrice) + '₫' : 'không giới hạn'}`
      : '';
    countEl.innerHTML = `Tìm thấy <strong>${total}</strong> phòng ${locTxt}${priceTxt}`;

    if (!rooms.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">🔍</div>
          <h3>Không tìm thấy phòng phù hợp</h3>
          <p>Hãy thử thay đổi bộ lọc hoặc tìm kiếm với từ khóa khác</p>
          <button class="btn btn-primary" style="margin-top:16px" onclick="resetFilters()">Xóa bộ lọc</button>
        </div>`;
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    grid.innerHTML = rooms.map(buildCard).join('');
    buildPagination(page, totalPages);

  } catch (err) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-icon">⚠️</div>
        <h3>Lỗi kết nối</h3>
        <p>${err.message}</p>
        <button class="btn btn-primary" style="margin-top:16px" onclick="loadResults()">Thử lại</button>
      </div>`;
  }
}

// ── Nav auth ─────────────────────────────────────────────────────────────────
function updateNavAuth() {
  const user = Api.getUser();
  const actions = document.getElementById('navActions');
  if (!actions) return;
  if (user) {
    actions.innerHTML = `
      <div class="user-menu">
        <div class="user-avatar">${user.email[0].toUpperCase()}</div>
        <span style="color:white;font-size:14px">${user.email}</span>
        <button class="btn-logout" onclick="Api.logout();location.reload()">Đăng xuất</button>
      </div>`;
  } else {
    actions.innerHTML = `
      <button class="btn-nav-login" onclick="window.location.href='home.html'">Đăng nhập</button>
      <button class="btn-nav-register" onclick="window.location.href='home.html'">Đăng ký</button>`;
  }
}

// ── Enter key ────────────────────────────────────────────────────────────────
document.getElementById('searchLocation')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') applySearch();
});

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateNavAuth();
  syncInputsFromParams();
  loadResults();
});
