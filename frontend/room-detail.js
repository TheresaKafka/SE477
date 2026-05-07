// room-detail.js — Room detail + booking sidebar logic

const FMT = new Intl.NumberFormat('vi-VN');

// ── Helpers ──────────────────────────────────────────────────────────────────
function getRoomId() {
  return new URLSearchParams(window.location.search).get('id');
}

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

// ── Status helpers ────────────────────────────────────────────────────────────
function getStatusBadge(status) {
  const map = {
    available:   ['badge-green',  '✅ Còn phòng'],
    rented:      ['badge-red',    '🚫 Đã thuê'],
    unavailable: ['badge-gray',   '⛔ Không có sẵn'],
    pending:     ['badge-orange', '⏳ Chờ duyệt'],
  };
  const [cls, txt] = map[status] || map.available;
  return `<span class="badge ${cls}" style="font-size:14px;padding:6px 14px">${txt}</span>`;
}

// ── Render room detail ────────────────────────────────────────────────────────
function renderRoom(room) {
  const prop  = room.property || {};
  const price = room.price ? FMT.format(room.price) + ' ₫' : 'Liên hệ';
  const isLoggedIn = Api.isLoggedIn();
  const canBook = room.status === 'available' || !room.status;

  document.title = `${room.name || 'Phòng trọ'} - PhongTro`;
  document.getElementById('breadcrumbName').textContent = room.name || 'Chi tiết phòng';

  document.getElementById('detailContent').innerHTML = `
    <!-- LEFT COLUMN -->
    <div class="detail-main">

      <!-- Gallery -->
      <div class="gallery">
        🏠
        <div class="gallery-badge">${getStatusBadge(room.status)}</div>
      </div>

      <!-- Header -->
      <div class="detail-header">
        <div>
          <h1 class="detail-title">${room.name || 'Phòng trọ'}</h1>
          <p class="detail-location">
            📍 ${prop.address || ''}${prop.city ? ', ' + prop.city : ''}
            ${!prop.address && !prop.city ? 'Chưa có thông tin địa chỉ' : ''}
          </p>
        </div>
        <div class="detail-price-block">
          <div class="detail-price">${price}</div>
          <div class="detail-price-sub">/ tháng</div>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="info-grid">
        <div class="info-item">
          <span class="info-icon">📦</span>
          <span class="info-label">Số lượng còn</span>
          <span class="info-value">${room.quantity ?? '—'} phòng</span>
        </div>
        <div class="info-item">
          <span class="info-icon">🏷️</span>
          <span class="info-label">Trạng thái</span>
          <span class="info-value">${room.status || 'Còn trống'}</span>
        </div>
        <div class="info-item">
          <span class="info-icon">🏢</span>
          <span class="info-label">Tòa nhà</span>
          <span class="info-value" style="font-size:13px">${prop.name || '—'}</span>
        </div>
      </div>

      <!-- Description -->
      <div class="detail-section">
        <h3>📝 Mô tả phòng</h3>
        <p>Phòng trọ chất lượng cao với đầy đủ tiện nghi cần thiết. Vị trí thuận tiện, gần các tiện ích công cộng, giao thông dễ dàng. Phòng thoáng mát, sạch sẽ, an ninh đảm bảo 24/7.</p>
      </div>

      <!-- Amenities -->
      <div class="detail-section">
        <h3>✨ Tiện ích</h3>
        <div class="amenities-list">
          <span class="amenity-tag">⚡ Điện nước riêng</span>
          <span class="amenity-tag">🌐 Wifi miễn phí</span>
          <span class="amenity-tag">📹 Camera an ninh</span>
          <span class="amenity-tag">🏍️ Chỗ để xe</span>
          <span class="amenity-tag">🛗 Thang máy</span>
          <span class="amenity-tag">🔒 Khóa từ</span>
        </div>
      </div>

      <!-- Property Info -->
      ${prop.property_id ? `
      <div class="detail-section">
        <h3>🏢 Thông tin tòa nhà</h3>
        <div class="property-info-card">
          <div class="property-info-row">🏢 <strong>Tên tòa:</strong> ${prop.name || 'Chưa cập nhật'}</div>
          <div class="property-info-row">📍 <strong>Địa chỉ:</strong> ${prop.address || 'Chưa cập nhật'}</div>
          <div class="property-info-row">🏙️ <strong>Thành phố:</strong> ${prop.city || 'Chưa cập nhật'}</div>
          <div class="property-info-row">✅ <strong>Trạng thái:</strong> ${prop.status || 'Hoạt động'}</div>
        </div>
      </div>` : ''}

    </div>

    <!-- RIGHT COLUMN: Booking Sidebar -->
    <aside class="booking-sidebar">
      <div class="booking-card">
        <div class="booking-card-title">${price}</div>
        <div class="booking-card-sub">/ tháng • Thanh toán an toàn</div>

        <div class="form-group">
          <label class="form-label">Số phòng muốn đặt</label>
          <select class="form-select" id="bookQty">
            <option value="1">1 phòng</option>
            <option value="2">2 phòng</option>
            <option value="3">3 phòng</option>
          </select>
        </div>

        <hr class="booking-divider">

        <div class="booking-summary-row">
          <span>Giá phòng</span>
          <span>${price}/tháng</span>
        </div>
        <div class="booking-summary-row">
          <span>Phí dịch vụ</span>
          <span>Miễn phí</span>
        </div>
        <div class="booking-summary-row total">
          <span>Tổng cộng</span>
          <span id="totalPrice">${price}/tháng</span>
        </div>

        <div id="bookingAlert"></div>

        ${canBook ? (
          isLoggedIn
            ? `<button class="btn-book" id="btnBook" onclick="doBooking(${room.room_id}, ${room.price || 0})">
                 🏠 Đặt phòng ngay
               </button>`
            : `<button class="btn-book" onclick="window.location.href='home.html'">
                 🏠 Đặt phòng ngay
               </button>
               <div class="login-prompt">
                 Bạn cần <a href="home.html">đăng nhập</a> để đặt phòng
               </div>`
        ) : `<button class="btn-book" disabled>🚫 Phòng không khả dụng</button>`}

        <div style="margin-top:16px;text-align:center;font-size:13px;color:#94a3b8">
          🛡️ Đặt phòng an toàn · Hoàn tiền 100% nếu huỷ
        </div>
      </div>

      <!-- Share & Save -->
      <div style="display:flex;gap:10px;margin-top:14px">
        <button class="btn btn-outline" style="flex:1;font-size:13px" onclick="sharePage()">🔗 Chia sẻ</button>
        <button class="btn btn-outline" style="flex:1;font-size:13px">❤️ Lưu</button>
      </div>
    </aside>`;

  // Update total price when qty changes
  const qtyEl = document.getElementById('bookQty');
  if (qtyEl && room.price) {
    qtyEl.addEventListener('change', () => {
      const qty = parseInt(qtyEl.value);
      const total = room.price * qty;
      document.getElementById('totalPrice').textContent = `${FMT.format(total)} ₫/tháng`;
    });
  }
}

// ── Booking action ────────────────────────────────────────────────────────────
async function doBooking(roomId, price) {
  const qty = parseInt(document.getElementById('bookQty')?.value || '1');
  const btn = document.getElementById('btnBook');
  const alertEl = document.getElementById('bookingAlert');

  btn.disabled = true;
  btn.textContent = '⏳ Đang xử lý...';
  alertEl.innerHTML = '';

  try {
    await Api.createBooking(roomId, qty);
    alertEl.innerHTML = `<div class="booking-alert" style="background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0">
      🎉 Đặt phòng thành công! Chúng tôi sẽ liên hệ xác nhận sớm.
    </div>`;
    btn.textContent = '✅ Đã đặt phòng';

    setTimeout(() => {
      window.location.href = 'booking.html';
    }, 2000);

  } catch (e) {
    alertEl.innerHTML = `<div class="booking-alert" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">
      ⚠️ ${e.message}
    </div>`;
    btn.disabled = false;
    btn.textContent = '🏠 Đặt phòng ngay';
  }
}

function sharePage() {
  if (navigator.share) {
    navigator.share({ title: document.title, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    alert('Đã sao chép link phòng!');
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  updateNavAuth();
  const id = getRoomId();
  const container = document.getElementById('detailContent');

  if (!id) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Không tìm thấy phòng</h3><p><a href="search.html">← Quay lại tìm kiếm</a></p></div>`;
    return;
  }

  try {
    const room = await Api.getRoomById(id);
    renderRoom(room);
  } catch (e) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Lỗi tải dữ liệu</h3><p>${e.message}</p><a href="search.html" class="btn btn-primary" style="margin-top:16px">← Quay lại</a></div>`;
  }
}

document.addEventListener('DOMContentLoaded', init);
