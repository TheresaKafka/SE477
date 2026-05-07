// booking.js — Booking management page

const FMT = new Intl.NumberFormat('vi-VN');
let allOrders = [];

// ── Nav auth ──────────────────────────────────────────────────────────────────
function updateNavAuth() {
  const user = Api.getUser();
  const actions = document.getElementById('navActions');
  if (!actions) return;
  if (user) {
    actions.innerHTML = `
      <div class="user-menu">
        <div class="user-avatar">${user.email[0].toUpperCase()}</div>
        <span style="color:white;font-size:14px">${user.email}</span>
        <button class="btn-logout" onclick="Api.logout();window.location.href='home.html'">Đăng xuất</button>
      </div>`;
  }
}

// ── Status helpers ─────────────────────────────────────────────────────────────
function statusBadge(status) {
  const map = {
    pending:   ['badge-orange', '⏳ Chờ xác nhận'],
    confirmed: ['badge-green',  '✅ Đã xác nhận'],
    cancelled: ['badge-red',    '❌ Đã huỷ'],
  };
  const [cls, txt] = map[status] || ['badge-gray', '— Không rõ'];
  return `<span class="badge ${cls}">${txt}</span>`;
}

// ── Render order card ─────────────────────────────────────────────────────────
function buildOrderCard(order) {
  const createdAt = order.created_at
    ? new Date(order.created_at).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
    : '—';

  const total = order.total_price ? `${FMT.format(order.total_price)} ₫` : '—';

  const details = (order.orderDetails || []).map(d => {
    const room = d.room || {};
    const itemPrice = d.price ? `${FMT.format(d.price)} ₫` : '—';
    return `
      <div class="order-room-item">
        <div class="room-thumb">🏠</div>
        <div class="room-item-info">
          <div class="room-item-name">${room.name || `Phòng #${d.room_id || d.room?.room_id || '—'}`}</div>
          <div class="room-item-qty">Số lượng: ${d.quantity || 1} phòng</div>
        </div>
        <div class="room-item-price">${itemPrice}/tháng</div>
      </div>`;
  }).join('');

  const canCancel = order.status === 'pending';

  return `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <span class="order-id">Đơn #${order.order_id}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          ${statusBadge(order.status)}
          <span class="order-date">📅 ${createdAt}</span>
        </div>
      </div>

      <div class="order-card-body">
        <div class="order-details-grid">
          <div class="order-rooms">
            ${details || '<p style="color:#94a3b8;font-size:14px">Không có thông tin chi tiết</p>'}
          </div>
          <div class="order-total-block">
            <div class="order-total-label">Tổng tiền</div>
            <div class="order-total-amount">${total}</div>
          </div>
        </div>
      </div>

      <div class="order-card-footer">
        <div style="font-size:13px;color:#64748b">
          💳 Thanh toán: Chuyển khoản · 📞 Hotline: 1900 xxxx
        </div>
        <div style="display:flex;gap:8px">
          ${canCancel
            ? `<button class="btn btn-outline btn-sm" onclick="cancelOrder(${order.order_id})">Huỷ đơn</button>`
            : ''}
          <button class="btn btn-primary btn-sm" onclick="window.location.href='search.html'">🔍 Tìm thêm phòng</button>
        </div>
      </div>
    </div>`;
}

// ── Filter ────────────────────────────────────────────────────────────────────
function filterOrders(status, tabEl) {
  document.querySelectorAll('.b-tab').forEach(b => b.classList.remove('active'));
  tabEl.classList.add('active');

  const filtered = status === 'all'
    ? allOrders
    : allOrders.filter(o => o.status === status);

  renderOrders(filtered);
}

function renderOrders(orders) {
  const list = document.getElementById('ordersList');
  if (!orders.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>Chưa có đơn đặt phòng nào</h3>
        <p>Hãy tìm kiếm và đặt phòng ngay!</p>
        <a href="search.html" class="btn btn-primary" style="margin-top:16px">🔍 Tìm phòng ngay</a>
      </div>`;
    return;
  }
  list.innerHTML = orders.map(buildOrderCard).join('');
}

// ── Summary stats ─────────────────────────────────────────────────────────────
function updateSummary(orders) {
  document.getElementById('totalOrders').textContent     = orders.length;
  document.getElementById('pendingOrders').textContent   = orders.filter(o => o.status === 'pending').length;
  document.getElementById('confirmedOrders').textContent = orders.filter(o => o.status === 'confirmed').length;
  document.getElementById('cancelledOrders').textContent = orders.filter(o => o.status === 'cancelled').length;
}

// ── Cancel order (optimistic) ─────────────────────────────────────────────────
async function cancelOrder(orderId) {
  if (!confirm('Bạn có chắc muốn huỷ đơn này không?')) return;
  try {
    // PATCH /orders/:id  with status = cancelled
    await fetch(`http://localhost:3000/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Api.getToken()}`
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    // Reload to reflect change
    loadOrders();
  } catch (e) {
    alert('Không thể huỷ đơn: ' + e.message);
  }
}

// ── Load ─────────────────────────────────────────────────────────────────────
async function loadOrders() {
  const list = document.getElementById('ordersList');
  list.innerHTML = `<div class="loading-section"><div class="spinner"></div><span>Đang tải đơn đặt phòng...</span></div>`;
  try {
    const orders = await Api.getMyOrders();
    allOrders = Array.isArray(orders) ? orders : [];
    updateSummary(allOrders);
    renderOrders(allOrders);
  } catch (e) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Lỗi tải dữ liệu</h3><p>${e.message}</p><button class="btn btn-primary" onclick="loadOrders()">Thử lại</button></div>`;
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateNavAuth();
  if (!Api.isLoggedIn()) {
    document.getElementById('authGuard').classList.remove('hidden');
  } else {
    document.getElementById('bookingsContent').classList.remove('hidden');
    loadOrders();
  }
});
