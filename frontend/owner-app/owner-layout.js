// owner-layout.js — Shared sidebar and guard for all owner pages
function ownerGuard() {
  if (!OwnerApi.isLoggedIn()) {
    window.location.href = 'index.html';
    return false;
  }
  const user = OwnerApi.getUser();
  if (user?.role !== 'OWNER') {
    alert('Bạn không có quyền truy cập trang này.');
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

function renderSidebar(activePage) {
  const user = OwnerApi.getUser();
  const initial = user?.email?.[0]?.toUpperCase() || 'O';

  const navItems = [
    { id: 'dashboard', icon: '📊', label: 'Tổng quan', href: 'dashboard.html' },
    { id: 'properties', icon: '🏢', label: 'Tòa nhà', href: 'properties.html' },
    { id: 'rooms', icon: '🚪', label: 'Phòng trọ', href: 'rooms.html' },
    { id: 'orders', icon: '📋', label: 'Đơn đặt phòng', href: 'orders.html' },
  ];

  const navHtml = navItems.map(item => `
    <a href="${item.href}" class="nav-item${activePage === item.id ? ' active' : ''}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </a>`).join('');

  document.getElementById('sidebar').innerHTML = `
    <div class="sidebar-brand">
      <div class="brand-icon">🏢</div>
      <div>
        <div class="brand-name">PhongTro</div>
        <div class="brand-sub">Owner Portal</div>
      </div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Menu</div>
      ${navHtml}
    </nav>
    <div class="sidebar-footer">
      <div class="owner-info">
        <div class="owner-avatar">${initial}</div>
        <div>
          <div class="owner-name" style="font-size:12px;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user?.email || 'Owner'}</div>
          <div class="owner-role">OWNER</div>
        </div>
      </div>
      <button class="btn-logout-side" onclick="OwnerApi.logout()">🚪 Đăng xuất</button>
    </div>`;
}
