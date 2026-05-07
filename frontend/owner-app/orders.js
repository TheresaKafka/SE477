// orders.js — Order management for owner
const FMT = new Intl.NumberFormat('vi-VN');
let allOrders = [];
let currentTab = 'all';

const STATUS_MAP = {
  pending:   ['badge-orange', '⏳ Chờ xác nhận'],
  confirmed: ['badge-green',  '✅ Đã xác nhận'],
  cancelled: ['badge-red',    '❌ Đã huỷ'],
};

function setTab(tab) {
  currentTab = tab;
  ['all','pending','confirmed','cancelled'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    el.className = t === tab ? 'btn btn-primary' : 'btn btn-ghost';
  });
  renderOrders();
}

function renderOrders() {
  const filtered = currentTab === 'all'
    ? allOrders
    : allOrders.filter(o => o.status === currentTab);

  document.getElementById('orderCount').textContent = `${filtered.length} đơn`;
  const wrap = document.getElementById('ordersTableWrap');

  if (!filtered.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h3>Không có đơn nào</h3></div>`;
    return;
  }

  wrap.innerHTML = `<table class="data-table">
    <thead><tr>
      <th>Đơn #</th>
      <th>Khách hàng</th>
      <th>Phòng đặt</th>
      <th>Tổng tiền</th>
      <th>Trạng thái</th>
      <th>Ngày đặt</th>
      <th>Hành động</th>
    </tr></thead>
    <tbody>
      ${filtered.map(o => {
        const [bc, bt] = STATUS_MAP[o.status] || ['badge-gray', o.status || '—'];
        const rooms = (o.orderDetails || []).map(d => d.room?.name || `#${d.room_id || '?'}`).join(', ') || '—';
        const date = o.created_at ? new Date(o.created_at).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';
        const total = o.total_price ? FMT.format(o.total_price) + ' ₫' : '—';
        return `<tr>
          <td><strong style="color:var(--accent-lt)">#${o.order_id}</strong></td>
          <td style="font-size:13px">${o.user?.email || '—'}</td>
          <td style="color:var(--text-muted);font-size:13px;max-width:160px">${rooms}</td>
          <td style="color:var(--orange);font-weight:700">${total}</td>
          <td><span class="badge ${bc}">${bt}</span></td>
          <td style="color:var(--text-muted);font-size:13px">${date}</td>
          <td>
            ${o.status === 'pending' ? `
              <button class="btn btn-success btn-sm" onclick="updateStatus(${o.order_id},'confirmed')">✅ Xác nhận</button>
              <button class="btn btn-danger btn-sm" onclick="updateStatus(${o.order_id},'cancelled')" style="margin-left:4px">❌ Huỷ</button>
            ` : '<span style="color:var(--text-dim);font-size:13px">—</span>'}
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

async function updateStatus(id, status) {
  const action = status === 'confirmed' ? 'Xác nhận' : 'Huỷ';
  if (!confirm(`${action} đơn #${id}?`)) return;
  try {
    await OwnerApi.updateOrderStatus(id, status);
    loadOrders();
  } catch (e) {
    alert('Lỗi: ' + e.message);
  }
}

async function loadOrders() {
  document.getElementById('ordersTableWrap').innerHTML =
    `<div class="loading-row"><div class="spinner"></div><span>Đang tải...</span></div>`;
  try {
    allOrders = await OwnerApi.getOrders() || [];
    renderOrders();
  } catch (e) {
    document.getElementById('ordersTableWrap').innerHTML =
      `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Lỗi tải dữ liệu</h3><p style="color:var(--red)">${e.message}</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!ownerGuard()) return;
  renderSidebar('orders');
  loadOrders();
  setTab('all');
});
