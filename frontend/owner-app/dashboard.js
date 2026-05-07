// dashboard.js
const FMT = new Intl.NumberFormat('vi-VN');

const STATUS_MAP = {
  pending:   ['badge-orange', '⏳ Chờ xác nhận'],
  confirmed: ['badge-green',  '✅ Đã xác nhận'],
  cancelled: ['badge-red',    '❌ Đã huỷ'],
};

const ROOM_STATUS_MAP = {
  available:   ['badge-green',  'Còn trống'],
  rented:      ['badge-red',    'Đã thuê'],
  pending:     ['badge-orange', 'Chờ duyệt'],
  unavailable: ['badge-gray',   'Không có sẵn'],
};

function badge(map, key) {
  const [cls, txt] = map[key] || ['badge-gray', key || '—'];
  return `<span class="badge ${cls}">${txt}</span>`;
}

async function loadDashboard() {
  const user = OwnerApi.getUser();
  document.getElementById('ownerName').textContent = user?.email?.split('@')[0] || 'Owner';

  try {
    const [properties, rooms, orders] = await Promise.all([
      OwnerApi.getProperties(),
      OwnerApi.getRooms(),
      OwnerApi.getOrders(),
    ]);

    // Stats
    const pending = (orders || []).filter(o => o.status === 'pending').length;
    document.getElementById('statProps').textContent   = (properties || []).length;
    document.getElementById('statRooms').textContent   = (rooms || []).length;
    document.getElementById('statOrders').textContent  = (orders || []).length;
    document.getElementById('statPending').textContent = pending;

    // Recent orders table
    const recentOrders = (orders || []).slice(0, 8);
    document.getElementById('recentOrders').innerHTML = recentOrders.length
      ? `<table class="data-table">
          <thead><tr>
            <th>Đơn #</th><th>Khách hàng</th><th>Tổng tiền</th><th>Trạng thái</th><th>Ngày đặt</th><th>Hành động</th>
          </tr></thead>
          <tbody>
            ${recentOrders.map(o => `
              <tr>
                <td><strong style="color:var(--accent-lt)">#${o.order_id}</strong></td>
                <td>${o.user?.email || '—'}</td>
                <td style="color:var(--orange);font-weight:700">${o.total_price ? FMT.format(o.total_price) + ' ₫' : '—'}</td>
                <td>${badge(STATUS_MAP, o.status)}</td>
                <td style="color:var(--text-muted);font-size:13px">${o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN') : '—'}</td>
                <td>
                  ${o.status === 'pending' ? `
                    <button class="btn btn-success btn-sm" onclick="confirmOrder(${o.order_id})">✅ Xác nhận</button>
                    <button class="btn btn-danger btn-sm" onclick="cancelOrder(${o.order_id})" style="margin-left:4px">❌ Huỷ</button>
                  ` : '—'}
                </td>
              </tr>`).join('')}
          </tbody>
        </table>`
      : `<div class="empty-state"><div class="empty-icon">📋</div><h3>Chưa có đơn đặt phòng</h3></div>`;

    // Recent rooms
    const recentRooms = (rooms || []).slice(0, 6);
    document.getElementById('recentRooms').innerHTML = recentRooms.length
      ? `<table class="data-table">
          <thead><tr><th>Tên phòng</th><th>Tòa nhà</th><th>Giá/tháng</th><th>Số lượng</th><th>Trạng thái</th></tr></thead>
          <tbody>
            ${recentRooms.map(r => `
              <tr>
                <td><strong>${r.name || 'Phòng #' + r.room_id}</strong></td>
                <td style="color:var(--text-muted)">${r.property?.name || '—'}</td>
                <td style="color:var(--orange);font-weight:700">${r.price ? FMT.format(r.price) + ' ₫' : 'Liên hệ'}</td>
                <td>${r.quantity ?? '—'}</td>
                <td>${badge(ROOM_STATUS_MAP, r.status)}</td>
              </tr>`).join('')}
          </tbody>
        </table>`
      : `<div class="empty-state"><div class="empty-icon">🚪</div><h3>Chưa có phòng nào</h3><p><a href="rooms.html" style="color:var(--accent-lt)">Thêm phòng ngay →</a></p></div>`;

  } catch (e) {
    document.getElementById('recentOrders').innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Lỗi tải dữ liệu</h3><p style="color:var(--red)">${e.message}</p></div>`;
  }
}

async function confirmOrder(id) {
  if (!confirm('Xác nhận đơn đặt phòng này?')) return;
  try { await OwnerApi.updateOrderStatus(id, 'confirmed'); loadDashboard(); }
  catch (e) { alert(e.message); }
}

async function cancelOrder(id) {
  if (!confirm('Huỷ đơn đặt phòng này?')) return;
  try { await OwnerApi.updateOrderStatus(id, 'cancelled'); loadDashboard(); }
  catch (e) { alert(e.message); }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!ownerGuard()) return;
  renderSidebar('dashboard');
  loadDashboard();
});
