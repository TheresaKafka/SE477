// rooms.js — Room CRUD management
const FMT = new Intl.NumberFormat('vi-VN');

const STATUS_MAP = {
  available:   ['badge-green',  'Còn trống'],
  rented:      ['badge-red',    'Đã thuê'],
  pending:     ['badge-orange', 'Chờ duyệt'],
  unavailable: ['badge-gray',   'Không có sẵn'],
};

let allRooms = [];
let editingId = null;

// ── Render table ──────────────────────────────────────────────────────────────
function renderTable(rooms) {
  const wrap = document.getElementById('roomsTableWrap');
  document.getElementById('roomCount').textContent = `${rooms.length} phòng`;

  if (!rooms.length) {
    wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">🚪</div><h3>Chưa có phòng nào</h3><p>Nhấn "+ Thêm phòng mới" để bắt đầu</p></div>`;
    return;
  }

  wrap.innerHTML = `<table class="data-table">
    <thead><tr>
      <th>ID</th><th>Tên phòng</th><th>Tòa nhà</th><th>Giá/tháng</th><th>Số lượng</th><th>Trạng thái</th><th>Hành động</th>
    </tr></thead>
    <tbody>
      ${rooms.map(r => {
        const [cls, txt] = STATUS_MAP[r.status] || STATUS_MAP.available;
        const price = r.price ? FMT.format(r.price) + ' ₫' : 'Liên hệ';
        return `<tr>
          <td style="color:var(--text-dim);font-size:13px">#${r.room_id}</td>
          <td><strong>${r.name || '—'}</strong></td>
          <td style="color:var(--text-muted)">${r.property?.name || '—'}</td>
          <td style="color:var(--orange);font-weight:700">${price}</td>
          <td>${r.quantity ?? '—'}</td>
          <td><span class="badge ${cls}">${txt}</span></td>
          <td style="display:flex;gap:6px">
            <button class="btn btn-ghost btn-sm" onclick="openModal(${r.room_id})">✏️ Sửa</button>
            <button class="btn btn-danger btn-sm" onclick="deleteRoom(${r.room_id})">🗑️</button>
          </td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>`;
}

// ── Filter ────────────────────────────────────────────────────────────────────
function filterRooms() {
  const name   = document.getElementById('filterName').value.toLowerCase();
  const status = document.getElementById('filterStatus').value;
  const filtered = allRooms.filter(r =>
    (!name   || (r.name || '').toLowerCase().includes(name)) &&
    (!status || r.status === status)
  );
  renderTable(filtered);
}

// ── Modal ─────────────────────────────────────────────────────────────────────
async function openModal(roomId = null) {
  editingId = roomId;
  document.getElementById('roomModal').classList.remove('hidden');
  document.getElementById('modalAlert').innerHTML = '';
  document.getElementById('modalIcon').textContent  = roomId ? '✏️' : '➕';
  document.getElementById('modalTitle').textContent = roomId ? 'Sửa phòng' : 'Thêm phòng mới';

  // Load properties into select
  try {
    const props = await OwnerApi.getProperties();
    const sel = document.getElementById('fPropertyId');
    sel.innerHTML = '<option value="">— Chọn tòa nhà —</option>' +
      props.map(p => `<option value="${p.property_id}">${p.name || 'Tòa #' + p.property_id} (${p.city || ''})</option>`).join('');
  } catch {}

  if (roomId) {
    const room = allRooms.find(r => r.room_id === roomId) || await OwnerApi.getRoom(roomId);
    document.getElementById('fName').value   = room.name || '';
    document.getElementById('fPrice').value  = room.price || '';
    document.getElementById('fQty').value    = room.quantity || '';
    document.getElementById('fStatus').value = room.status || 'available';
    const pid = room.property?.property_id;
    if (pid) document.getElementById('fPropertyId').value = pid;
  } else {
    ['fName','fPrice','fQty'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('fStatus').value = 'available';
    document.getElementById('fPropertyId').value = '';
  }
}

function closeModal() {
  document.getElementById('roomModal').classList.add('hidden');
  editingId = null;
}

function closeModalOutside(e) {
  if (e.target.id === 'roomModal') closeModal();
}

function showModalAlert(msg, type = 'error') {
  document.getElementById('modalAlert').innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}

// ── Save ──────────────────────────────────────────────────────────────────────
async function saveRoom() {
  const dto = {
    name:        document.getElementById('fName').value.trim() || undefined,
    price:       parseFloat(document.getElementById('fPrice').value) || undefined,
    quantity:    parseInt(document.getElementById('fQty').value) || undefined,
    status:      document.getElementById('fStatus').value || undefined,
    property_id: parseInt(document.getElementById('fPropertyId').value) || undefined,
  };

  const btn = document.getElementById('btnSave');
  btn.disabled = true; btn.textContent = 'Đang lưu...';
  try {
    if (editingId) {
      await OwnerApi.updateRoom(editingId, dto);
      showModalAlert('Cập nhật phòng thành công!', 'success');
    } else {
      await OwnerApi.createRoom(dto);
      showModalAlert('Thêm phòng thành công!', 'success');
    }
    setTimeout(() => { closeModal(); loadRooms(); }, 700);
  } catch (e) {
    showModalAlert(e.message);
  } finally {
    btn.disabled = false; btn.textContent = '💾 Lưu';
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteRoom(id) {
  if (!confirm('Xoá phòng này? Hành động không thể hoàn tác.')) return;
  try {
    await OwnerApi.deleteRoom(id);
    loadRooms();
  } catch (e) {
    alert('Xoá thất bại: ' + e.message);
  }
}

// ── Load ──────────────────────────────────────────────────────────────────────
async function loadRooms() {
  document.getElementById('roomsTableWrap').innerHTML =
    `<div class="loading-row"><div class="spinner"></div><span>Đang tải...</span></div>`;
  try {
    allRooms = await OwnerApi.getRooms();
    filterRooms();
  } catch (e) {
    document.getElementById('roomsTableWrap').innerHTML =
      `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Lỗi tải dữ liệu</h3><p style="color:var(--red)">${e.message}</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!ownerGuard()) return;
  renderSidebar('rooms');
  loadRooms();
});
