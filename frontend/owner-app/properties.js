/**
 * properties.js — Owner App: Quản lý tòa nhà
 */

let allProperties = [];
let editingId = null;

// ── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (!ownerGuard()) return;
  renderSidebar('properties');
  loadProperties();
});

// ── Load all properties ────────────────────────────────────────────────────
async function loadProperties() {
  try {
    const data = await OwnerApi.getProperties();
    allProperties = Array.isArray(data) ? data : (data.data || []);
    populateCityFilter();
    renderTable(allProperties);
  } catch (err) {
    document.getElementById('propsTableWrap').innerHTML =
      `<div class="empty-state">❌ Lỗi: ${err.message}</div>`;
    document.getElementById('propCount').textContent = 'Lỗi tải dữ liệu';
  }
}

// ── Populate city dropdown ─────────────────────────────────────────────────
function populateCityFilter() {
  const sel = document.getElementById('filterCity');
  const cities = [...new Set(allProperties.map(p => p.city).filter(Boolean))].sort();
  cities.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  });
}

// ── Filter ─────────────────────────────────────────────────────────────────
function filterProperties() {
  const name = document.getElementById('filterName').value.toLowerCase();
  const city = document.getElementById('filterCity').value;
  const filtered = allProperties.filter(p => {
    const matchName = !name || (p.name || '').toLowerCase().includes(name);
    const matchCity = !city || p.city === city;
    return matchName && matchCity;
  });
  renderTable(filtered);
}

// ── Render table ──────────────────────────────────────────────────────────
function renderTable(list) {
  const wrap = document.getElementById('propsTableWrap');
  const count = document.getElementById('propCount');
  count.textContent = `${list.length} tòa nhà`;

  if (list.length === 0) {
    wrap.innerHTML = `<div class="empty-state">📭 Chưa có tòa nhà nào. Hãy thêm tòa nhà đầu tiên!</div>`;
    return;
  }

  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Tên tòa nhà</th>
          <th>Thành phố</th>
          <th>Địa chỉ</th>
          <th>Trạng thái</th>
          <th>Hành động</th>
        </tr>
      </thead>
      <tbody>
        ${list.map((p, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><strong>${p.name || '—'}</strong></td>
            <td>${p.city || '—'}</td>
            <td>${p.address || '—'}</td>
            <td>
              <span class="badge ${p.status === 'active' ? 'badge-success' : 'badge-warning'}">
                ${p.status === 'active' ? '✅ Hoạt động' : '⏸ Tạm ngưng'}
              </span>
            </td>
            <td>
              <button class="btn btn-sm btn-ghost" onclick="openModal(${p.property_id})">✏️ Sửa</button>
              <button class="btn btn-sm btn-danger" onclick="deleteProperty(${p.property_id}, '${(p.name || '').replace(/'/g, "\\'")}')">🗑️ Xoá</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ── Modal open/close ──────────────────────────────────────────────────────
function openModal(id = null) {
  editingId = id;
  const modal = document.getElementById('propModal');
  document.getElementById('modalAlert').innerHTML = '';

  if (id) {
    const p = allProperties.find(x => x.property_id === id);
    document.getElementById('modalIcon').textContent = '✏️';
    document.getElementById('modalTitle').textContent = 'Chỉnh sửa tòa nhà';
    document.getElementById('fName').value = p?.name || '';
    document.getElementById('fCity').value = p?.city || '';
    document.getElementById('fAddress').value = p?.address || '';
    document.getElementById('fStatus').value = p?.status || 'active';
  } else {
    document.getElementById('modalIcon').textContent = '➕';
    document.getElementById('modalTitle').textContent = 'Thêm tòa nhà mới';
    document.getElementById('fName').value = '';
    document.getElementById('fCity').value = '';
    document.getElementById('fAddress').value = '';
    document.getElementById('fStatus').value = 'active';
  }

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('propModal').classList.add('hidden');
  editingId = null;
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('propModal')) closeModal();
}

// ── Save (create or update) ───────────────────────────────────────────────
async function saveProperty() {
  const dto = {
    name:    document.getElementById('fName').value.trim(),
    city:    document.getElementById('fCity').value.trim(),
    address: document.getElementById('fAddress').value.trim(),
    status:  document.getElementById('fStatus').value,
  };

  if (!dto.name) {
    showModalAlert('⚠️ Vui lòng nhập tên tòa nhà.', 'error');
    return;
  }

  const btn = document.getElementById('btnSave');
  btn.disabled = true;
  btn.textContent = '⏳ Đang lưu...';

  try {
    if (editingId) {
      await OwnerApi.updateProperty(editingId, dto);
    } else {
      await OwnerApi.createProperty(dto);
    }
    closeModal();
    await loadProperties();
  } catch (err) {
    showModalAlert(`❌ ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Lưu';
  }
}

// ── Delete ────────────────────────────────────────────────────────────────
async function deleteProperty(id, name) {
  if (!confirm(`Bạn chắc chắn muốn xoá tòa nhà "${name}"?\nHành động này không thể khôi phục.`)) return;
  try {
    await OwnerApi.deleteProperty(id);
    await loadProperties();
  } catch (err) {
    alert(`❌ Xoá thất bại: ${err.message}`);
  }
}

// ── Alert helper ──────────────────────────────────────────────────────────
function showModalAlert(msg, type = 'error') {
  const el = document.getElementById('modalAlert');
  el.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}
