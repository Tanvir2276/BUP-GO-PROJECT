/**
 * BUPGO - Universal Navbar, Header, Theme & Notification Component
 */

// Theme Handler (Night Mode / Light Mode)
function initTheme() {
  const savedTheme = localStorage.getItem('bupgo_theme') || 'light';
  const isDark = savedTheme === 'dark';
  if (isDark) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  updateThemeIcon(isDark);
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark-mode');
  localStorage.setItem('bupgo_theme', isDark ? 'dark' : 'light');
  updateThemeIcon(isDark);
  showToast(`Switched to ${isDark ? 'Night / Dark' : 'Light'} Mode`, 'info');
}

function updateThemeIcon(isDark) {
  const pill = document.querySelector('.theme-switch-pill');
  if (pill) {
    if (isDark) {
      pill.classList.add('dark');
    } else {
      pill.classList.remove('dark');
    }
  }
  const logo = document.querySelector('.bupgo-custom-logo');
  if (logo) {
    logo.src = isDark ? 'assets/bupgo_logo_dark.png' : 'assets/bupgo_logo.png';
  }
}

// User Profile Dropdown Menu Handler
let userDropdownOpen = false;
function toggleUserDropdown(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
  }
  const menu = document.getElementById('user-dropdown-menu');
  if (!menu) return;
  userDropdownOpen = !userDropdownOpen;
  if (userDropdownOpen) {
    menu.style.setProperty('display', 'block', 'important');
  } else {
    menu.style.setProperty('display', 'none', 'important');
  }

  // Close notifications if open
  const notifPanel = document.getElementById('notifications-panel');
  if (notifPanel && userDropdownOpen) {
    notifPanel.style.display = 'none';
    notificationsOpen = false;
  }
}

function handleSignOut() {
  Auth.clearSession();
  showToast('Logged out successfully.', 'info');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 500);
}

// Notification Drawer Toggle
let notificationsOpen = false;
async function toggleNotifications() {
  const panel = document.getElementById('notifications-panel');
  if (!panel) return;

  notificationsOpen = !notificationsOpen;
  panel.style.display = notificationsOpen ? 'block' : 'none';

  if (notificationsOpen) {
    await loadNotifications();
  }
}

function updateBadgeCount(count) {
  const badge = document.getElementById('notif-badge');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : String(count);
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

async function initNotificationBadge() {
  const user = Auth.getUser();
  if (!user) {
    updateBadgeCount(0);
    return;
  }
  try {
    const res = await apiRequest('/notifications');
    const count = (res.notifications || []).length;
    updateBadgeCount(count);
  } catch (e) {
    updateBadgeCount(0);
  }
}

function formatNotifTime(dateStr) {
  if (!dateStr) return 'Just now';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Recently';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function loadNotifications() {
  const listEl = document.getElementById('notif-items-list');
  if (!listEl) return;

  try {
    const res = await apiRequest('/notifications');
    const notifs = res.notifications || [];
    updateBadgeCount(notifs.length);

    if (notifs.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding: 25px; color: var(--text-muted); font-size: 0.85rem;">No recent notifications</div>`;
      return;
    }

    listEl.innerHTML = notifs.map(n => `
      <div style="padding: 12px 14px; border-bottom: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 4px; transition: background 0.2s; cursor: pointer;" onmouseover="this.style.background='var(--bup-primary-soft)'" onmouseout="this.style.background='transparent'">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="font-size: 0.88rem; color: var(--bup-primary);">${n.title}</strong>
          <span style="font-size: 0.72rem; color: var(--text-muted);">${formatNotifTime(n.createdAt)}</span>
        </div>
        <p style="font-size: 0.82rem; color: var(--text-main); margin: 0; line-height: 1.4;">${n.message}</p>
      </div>
    `).join('');
  } catch (err) {
    listEl.innerHTML = `<div style="padding: 15px; color: var(--bup-red); font-size: 0.8rem; text-align:center;">Could not load alerts</div>`;
  }
}

// Render Universal Navbar
function renderNavbar() {
  const navContainer = document.getElementById('navbar-mount');
  if (!navContainer) return;

  const currentPath = window.location.pathname;
  const user = Auth.getUser();
  const isDark = document.body.classList.contains('dark-mode');

  navContainer.innerHTML = `
    <!-- Main Navigation Bar -->
    <header class="navbar">
      <div class="container navbar-inner">
        <!-- Exact Logo Matching Reference Image with Dark/Light Support -->
        <a href="index.html" class="brand-logo" title="BUPGO Campus Ride Sharing">
          <img src="${isDark ? 'assets/bupgo_logo_dark.png' : 'assets/bupgo_logo.png'}" alt="BUPGO Campus Ride Sharing" class="bupgo-custom-logo">
        </a>

        <!-- Navigation Links with Icons & Modern Active Highlight -->
        <ul class="nav-links">
          <li><a href="index.html" class="nav-link ${currentPath.endsWith('index.html') || currentPath === '/' ? 'active' : ''}">🏠 Home</a></li>
          <li><a href="find-ride.html" class="nav-link ${currentPath.includes('find-ride') ? 'active' : ''}">🔍 Find a Ride</a></li>
          <li><a href="offer-ride.html" class="nav-link ${currentPath.includes('offer-ride') ? 'active' : ''}">➕ Offer a Ride</a></li>
          <li><a href="my-rides.html" class="nav-link ${currentPath.includes('my-rides') ? 'active' : ''}">📅 My Rides</a></li>
          ${user && user.role === 'admin' ? `<li><a href="admin.html" class="nav-link ${currentPath.includes('admin') ? 'active' : ''}">🛡️ Admin Panel</a></li>` : ''}
        </ul>

        <div class="nav-auth" style="display: flex; align-items: center; gap: 14px; position: relative;">
          <!-- Day / Night Slider Switch Pill Matching Reference Image -->
          <div class="theme-switch-wrapper" onclick="toggleTheme()" title="${isDark ? 'Switch to Light Mode' : 'Switch to Night Mode'}">
            <div class="theme-switch-pill ${isDark ? 'dark' : ''}">
              <span class="theme-icon sun">☀️</span>
              <span class="theme-slider"></span>
              <span class="theme-icon moon">🌙</span>
            </div>
          </div>

          <!-- Notification Bell with Alert Dropdown -->
          <div style="position: relative;">
            <button class="notif-bell-btn" id="notif-bell-btn" onclick="toggleNotifications()" title="Live Ride Alerts & Notifications">
              <svg width="21" height="21" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span id="notif-badge" class="notif-pill-counter" style="display: none;">0</span>
            </button>

            <!-- Dropdown Notification Menu -->
            <div id="notifications-panel" class="notifications-dropdown">
              <div style="padding: 12px 16px; background: var(--bup-primary); color: white; display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 0.9rem;">🔔 Live BUP Carpool Alerts</strong>
                <button onclick="toggleNotifications()" style="background: none; border: none; color: white; font-size: 1.3rem; line-height: 1; cursor: pointer; padding: 0 4px;">&times;</button>
              </div>
              <div id="notif-items-list" style="max-height: 340px; overflow-y: auto;">
                <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">Loading alerts...</div>
              </div>
              <div style="padding: 10px 14px; background: var(--bg-card); border-top: 1px solid var(--border-color); text-align: center;">
                <a href="find-ride.html" style="font-size: 0.82rem; font-weight: 700; color: var(--bup-primary);">Browse All Active Rides →</a>
              </div>
            </div>
          </div>

          <!-- Professional User Pill & Dropdown Menu -->
          ${user ? `
            <div class="user-profile-wrapper" style="position: relative;">
              <button class="user-badge-pill" id="user-profile-btn" onclick="toggleUserDropdown(event)" title="Account Menu">
                <img src="${user.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(user.name)}" alt="${user.name}">
                <div class="user-badge-text">
                  <span class="user-badge-title">${user.name.split(' ')[0]}</span>
                  <span class="user-badge-sub">${user.studentId}</span>
                </div>
                <span class="user-badge-chevron">⌵</span>
              </button>

              <!-- Dropdown Menu (Guaranteed Hidden by Default) -->
              <div id="user-dropdown-menu" class="user-menu-dropdown" style="display: none !important;">
                <div class="user-dropdown-header">
                  <img src="${user.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(user.name)}" alt="${user.name}" class="dropdown-header-avatar">
                  <div class="dropdown-header-info">
                    <strong class="dropdown-user-name">${user.name}</strong>
                    <span class="dropdown-user-id">ID: ${user.studentId}</span>
                    <span class="dropdown-role-tag ${user.role || 'passenger'}">
                      ${user.role === 'admin' ? '🛡️ Administrator' : user.role === 'driver' ? '🚗 Verified Driver' : '🎓 Student Passenger'}
                    </span>
                  </div>
                </div>

                <div class="user-dropdown-divider"></div>

                <div class="user-dropdown-links">
                  <a href="profile.html?tab=personal" class="user-dropdown-link-item">
                    <span class="dropdown-link-icon">👤</span>
                    <div>
                      <div class="dropdown-link-title">Personal Information</div>
                      <div class="dropdown-link-desc">View and edit personal details</div>
                    </div>
                  </a>

                  <a href="profile.html?tab=settings" class="user-dropdown-link-item">
                    <span class="dropdown-link-icon">⚙️</span>
                    <div>
                      <div class="dropdown-link-title">Settings</div>
                      <div class="dropdown-link-desc">${user.role === 'admin' ? 'Admin controls & powers' : user.role === 'driver' ? 'Vehicle & driver rules' : 'Ride & safety preferences'}</div>
                    </div>
                  </a>

                  ${user.role === 'admin' ? `
                  <a href="admin.html" class="user-dropdown-link-item">
                    <span class="dropdown-link-icon">🛡️</span>
                    <div>
                      <div class="dropdown-link-title">Admin Dashboard</div>
                      <div class="dropdown-link-desc">System moderation & user management</div>
                    </div>
                  </a>
                  ` : ''}

                  <div class="user-dropdown-divider"></div>

                  <button type="button" class="user-dropdown-link-item logout-link-btn" onclick="handleSignOut()">
                    <span class="dropdown-link-icon" style="color: var(--bup-red);">🚪</span>
                    <div>
                      <div class="dropdown-link-title" style="color: var(--bup-red); font-weight: 700;">Sign Out</div>
                      <div class="dropdown-link-desc">Log out of your BUPGO account</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          ` : `
            <a href="login.html" class="btn btn-primary btn-sm btn-nav-auth" style="border-radius: var(--radius-full); padding: 8px 18px; white-space: nowrap;">
              <span>Sign In</span>
            </a>
          `}
        </div>
      </div>
    </header>

    <!-- Mobile App Bottom Navigation Bar (Pathao / Uber Style) -->
    <nav class="mobile-bottom-nav">
      <a href="index.html" class="mobile-nav-item ${currentPath.endsWith('index.html') || currentPath === '/' ? 'active' : ''}">
        <span class="mobile-nav-icon">🏠</span>
        <span class="mobile-nav-label">Home</span>
      </a>
      <a href="find-ride.html" class="mobile-nav-item ${currentPath.includes('find-ride') ? 'active' : ''}">
        <span class="mobile-nav-icon">🔍</span>
        <span class="mobile-nav-label">Find Ride</span>
      </a>
      <a href="offer-ride.html" class="mobile-nav-item ${currentPath.includes('offer-ride') ? 'active' : ''}">
        <span class="mobile-nav-icon">➕</span>
        <span class="mobile-nav-label">Offer</span>
      </a>
      <a href="my-rides.html" class="mobile-nav-item ${currentPath.includes('my-rides') ? 'active' : ''}">
        <span class="mobile-nav-icon">📅</span>
        <span class="mobile-nav-label">My Rides</span>
      </a>
      <a href="${user ? 'profile.html' : 'login.html'}" class="mobile-nav-item ${currentPath.includes('profile') || currentPath.includes('login') ? 'active' : ''}">
        <span class="mobile-nav-icon">${user ? '👤' : '🔑'}</span>
        <span class="mobile-nav-label">${user ? 'Profile' : 'Login'}</span>
      </a>
    </nav>
  `;

  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.clearSession();
      showToast('Logged out successfully.', 'info');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    });
  }

  // Close dropdowns on outer click
  document.addEventListener('click', (e) => {
    const userMenu = document.getElementById('user-dropdown-menu');
    const userBtn = document.getElementById('user-profile-btn');
    if (userMenu && userBtn && !userMenu.contains(e.target) && !userBtn.contains(e.target)) {
      userMenu.style.setProperty('display', 'none', 'important');
      userDropdownOpen = false;
    }

    const panel = document.getElementById('notifications-panel');
    const bell = document.getElementById('notif-bell-btn');
    if (panel && bell && !panel.contains(e.target) && !bell.contains(e.target)) {
      panel.style.display = 'none';
      notificationsOpen = false;
    }
  });
}

// Universal Footer (Removed Academic Project Student Box as requested)
function renderFooter() {
  const footerContainer = document.getElementById('footer-mount');
  if (!footerContainer) return;

  footerContainer.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-brand">
            <h3>BUP<span>GO</span> Carpool</h3>
            <p>
              Dedicated campus carpooling platform exclusively designed for Bangladesh University of Professionals (BUP) students to reduce commuting cost, Dhaka traffic delays, and carbon emissions.
            </p>
            <div style="margin-top: 15px;">
              <span class="db-pill" id="footer-db-status">🟢 NoSQL Database: Connected</span>
            </div>
          </div>

          <div class="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="index.html">Home</a></li>
              <li><a href="find-ride.html">Find a Ride</a></li>
              <li><a href="offer-ride.html">Offer a Ride</a></li>
              <li><a href="my-rides.html">My Rides & Bookings</a></li>
              <li><a href="profile.html">Student Profile</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h4>Popular Routes</h4>
            <ul>
              <li><a href="find-ride.html?start=Mirpur 10">Mirpur 10 ⇄ BUP</a></li>
              <li><a href="find-ride.html?start=Uttara">Uttara ⇄ BUP</a></li>
              <li><a href="find-ride.html?start=Dhanmondi">Dhanmondi ⇄ BUP</a></li>
              <li><a href="find-ride.html?start=Farmgate">Farmgate ⇄ BUP</a></li>
              <li><a href="find-ride.html?start=Savar">Savar ⇄ BUP</a></li>
            </ul>
          </div>

          <!-- Replaced with Safety & Campus Hotline Support -->
          <div class="footer-col">
            <h4>🛡️ Campus Safety & Help</h4>
            <div style="background: rgba(255, 255, 255, 0.05); padding: 16px; border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="font-size: 0.85rem; margin-bottom: 4px;"><strong>BUP Security Control Desk:</strong></p>
              <p style="font-size: 0.95rem; font-weight: 700; color: #4ade80;">📞 02-8000441-5</p>
              <p style="font-size: 0.85rem; margin-top: 8px; margin-bottom: 4px;"><strong>Emergency Proctor Hotline:</strong></p>
              <p style="font-size: 0.85rem; color: #facc15;">🚨 Ext 105 (Campus Emergency)</p>
              <p style="font-size: 0.78rem; color: #94a3b8; margin-top: 8px;">Mirpur Cantonment, Dhaka-1216</p>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p>© 2026 BUPGO - Bangladesh University of Professionals Student Network</p>
          <p>Verified Student Carpooling & Safety First</p>
        </div>
      </div>
    </footer>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderNavbar();
  renderFooter();
  initNotificationBadge();
});
