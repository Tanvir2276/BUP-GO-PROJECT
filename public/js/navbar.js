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

// Notification Drawer & Preference Management
let notificationsOpen = false;
let currentUnreadCount = 0;
let lastKnownNotifIds = new Set();
let notifPollInterval = null;

// Get Notification Preference (ON, SNOOZE, OFF)
function getNotificationPref() {
  try {
    const raw = localStorage.getItem('bupgo_notif_pref');
    if (!raw) return { status: 'on', snoozedUntil: null };
    const pref = JSON.parse(raw);
    if (pref.status === 'snooze' && pref.snoozedUntil) {
      if (Date.now() > pref.snoozedUntil) {
        // Snooze expired, auto-resume
        const resumed = { status: 'on', snoozedUntil: null };
        localStorage.setItem('bupgo_notif_pref', JSON.stringify(resumed));
        return resumed;
      }
    }
    return pref;
  } catch (e) {
    return { status: 'on', snoozedUntil: null };
  }
}

function setNotificationPref(status, durationHours = 0) {
  let snoozedUntil = null;
  if (status === 'snooze' && durationHours > 0) {
    snoozedUntil = Date.now() + (durationHours * 3600 * 1000);
  }

  const pref = { status, snoozedUntil };
  localStorage.setItem('bupgo_notif_pref', JSON.stringify(pref));

  // Sync to backend if logged in
  if (Auth.isLoggedIn()) {
    apiRequest('/notifications/preferences', {
      method: 'PUT',
      body: JSON.stringify(pref)
    }).catch(() => {});
  }

  const msg = status === 'snooze' 
    ? `Notifications snoozed for ${durationHours} hour(s) 🔕` 
    : status === 'off' 
      ? 'Notifications turned OFF 🔕' 
      : 'Notifications turned ON 🔔';
  showToast(msg, 'info');

  renderNotifPrefBar();
  updateBadgeDisplay();
}

async function toggleNotifications() {
  const panel = document.getElementById('notifications-panel');
  if (!panel) return;

  notificationsOpen = !notificationsOpen;
  panel.style.display = notificationsOpen ? 'block' : 'none';

  if (notificationsOpen) {
    renderNotifPrefBar();
    await loadNotifications();
  }
}

function renderNotifPrefBar() {
  const bar = document.getElementById('notif-pref-controls');
  if (!bar) return;

  const pref = getNotificationPref();
  const isSnoozed = pref.status === 'snooze';
  const isOff = pref.status === 'off';
  const isOn = pref.status === 'on';

  let remainingText = '';
  if (isSnoozed && pref.snoozedUntil) {
    const mins = Math.max(1, Math.round((pref.snoozedUntil - Date.now()) / 60000));
    remainingText = `(${mins}m left)`;
  }

  bar.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.76rem; width: 100%;">
      <span style="font-weight: 700; color: var(--text-muted);">Alert Status:</span>
      <div style="display: flex; gap: 4px;">
        <button type="button" class="notif-pref-pill ${isOn ? 'active' : ''}" onclick="setNotificationPref('on')" title="Receive all live alerts">🔔 ON</button>
        <button type="button" class="notif-pref-pill ${isSnoozed ? 'active' : ''}" onclick="setNotificationPref('snooze', 1)" title="Snooze alerts for 1 hour">⏱️ Snooze 1h ${remainingText}</button>
        <button type="button" class="notif-pref-pill ${isOff ? 'active' : ''}" onclick="setNotificationPref('off')" title="Turn off notifications">🔕 OFF</button>
      </div>
    </div>
  `;
}

function updateBadgeDisplay() {
  const badge = document.getElementById('notif-badge');
  const bell = document.getElementById('notif-bell-btn');
  if (!badge) return;

  const pref = getNotificationPref();
  if (pref.status === 'off') {
    badge.textContent = '✕';
    badge.style.display = 'inline-flex';
    badge.style.background = '#64748b';
    if (bell) bell.classList.remove('glow-pulse-ring');
    return;
  }

  if (pref.status === 'snooze') {
    badge.textContent = '🔕';
    badge.style.display = 'inline-flex';
    badge.style.background = '#d97706';
    if (bell) bell.classList.remove('glow-pulse-ring');
    return;
  }

  if (currentUnreadCount > 0) {
    badge.textContent = currentUnreadCount > 99 ? '99+' : String(currentUnreadCount);
    badge.style.display = 'inline-flex';
    badge.style.background = 'var(--bup-red, #dc2626)';
    if (bell) bell.classList.add('glow-pulse-ring');
  } else {
    badge.style.display = 'none';
    if (bell) bell.classList.remove('glow-pulse-ring');
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
    currentUnreadCount = res.unreadCount !== undefined ? res.unreadCount : 0;
    updateBadgeDisplay();

    // Track known IDs for live notification broadcasts
    notifs.forEach(n => lastKnownNotifIds.add(n._id));

    if (notifs.length === 0) {
      listEl.innerHTML = `<div style="text-align:center; padding: 25px; color: var(--text-muted); font-size: 0.85rem;">No recent notifications</div>`;
      return;
    }

    listEl.innerHTML = notifs.map(n => {
      const isUnread = !n.isRead;
      const isRequest = n.type === 'seat_request';
      const isConfirmed = n.type === 'request_status';
      const isRidePost = n.type === 'ride_posted';

      return `
        <div class="notif-drawer-item ${isUnread ? 'unread' : 'read'} ${isRequest && isUnread ? 'glow-request-item' : ''}" 
             id="notif-item-${n._id}"
             onclick="handleNotifClick('${n._id}', ${isUnread}, '${n.type || 'general'}')">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              ${isUnread ? `<span class="notif-unread-dot" title="Unread">●</span>` : `<span class="notif-read-check">✓</span>`}
              <strong class="notif-title-text">${n.title}</strong>
              ${isUnread ? `<span class="badge ${isRequest ? 'badge-yellow' : 'badge-green'}" style="font-size: 0.68rem; padding: 1px 6px;">NEW</span>` : ''}
            </div>
            <span class="notif-time-text">${formatNotifTime(n.createdAt)}</span>
          </div>

          <p class="notif-message-text">${n.message}</p>

          ${isRequest ? `
            <div style="margin-top: 6px; display: flex; align-items: center; gap: 8px;">
              <a href="my-rides.html" class="btn btn-primary btn-sm" style="font-size: 0.72rem; padding: 3px 8px; border-radius: 4px;">
                ⚡ Review & Accept Request
              </a>
              <span style="font-size: 0.72rem; color: var(--bup-primary); font-weight: 600;">Passenger Waiting</span>
            </div>
          ` : ''}

          ${isRidePost ? `
            <div style="margin-top: 4px;">
              <a href="find-ride.html" style="font-size: 0.74rem; font-weight: 700; color: var(--bup-primary);">
                View Available Ride ➔
              </a>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    listEl.innerHTML = `<div style="padding: 15px; color: var(--bup-red); font-size: 0.8rem; text-align:center;">Could not load alerts</div>`;
  }
}

// Mark single notification as read on click (Requirement 2 & 11)
async function handleNotifClick(notifId, wasUnread, type) {
  if (wasUnread) {
    // Optimistically decrement count instantly in UI
    currentUnreadCount = Math.max(0, currentUnreadCount - 1);
    updateBadgeDisplay();

    // Update item styling to read
    const itemEl = document.getElementById(`notif-item-${notifId}`);
    if (itemEl) {
      itemEl.classList.remove('unread', 'glow-request-item');
      itemEl.classList.add('read');
      const dot = itemEl.querySelector('.notif-unread-dot');
      if (dot) dot.outerHTML = `<span class="notif-read-check">✓</span>`;
      const badge = itemEl.querySelector('.badge');
      if (badge) badge.remove();
    }

    try {
      await apiRequest(`/notifications/${notifId}/read`, { method: 'PUT' });
    } catch (e) {
      console.warn('Could not sync read status to server:', e.message);
    }
  }

  // Navigate if relevant
  if (type === 'seat_request') {
    window.location.href = 'my-rides.html';
  }
}

// Mark All Notifications as Read (Requirement 2)
async function markAllNotificationsAsRead() {
  currentUnreadCount = 0;
  updateBadgeDisplay();

  const items = document.querySelectorAll('.notif-drawer-item.unread');
  items.forEach(el => {
    el.classList.remove('unread', 'glow-request-item');
    el.classList.add('read');
    const dot = el.querySelector('.notif-unread-dot');
    if (dot) dot.outerHTML = `<span class="notif-read-check">✓</span>`;
    const badge = el.querySelector('.badge');
    if (badge) badge.remove();
  });

  try {
    await apiRequest('/notifications/mark-all-read', { method: 'PUT' });
    showToast('All notifications marked as read', 'info');
  } catch (e) {
    console.warn('Error marking all as read:', e.message);
  }
}

async function initNotificationBadge() {
  const user = Auth.getUser();
  if (!user) {
    currentUnreadCount = 0;
    updateBadgeDisplay();
    return;
  }
  try {
    const res = await apiRequest('/notifications');
    currentUnreadCount = res.unreadCount !== undefined ? res.unreadCount : 0;
    updateBadgeDisplay();

    (res.notifications || []).forEach(n => lastKnownNotifIds.add(n._id));

    // Start background poller if not already active
    if (!notifPollInterval) {
      notifPollInterval = setInterval(pollLiveNotifications, 25000);
    }
  } catch (e) {
    currentUnreadCount = 0;
    updateBadgeDisplay();
  }
}

// Background polling for new ride alerts and seat requests (Requirement 7 & 9)
async function pollLiveNotifications() {
  if (!Auth.isLoggedIn()) return;
  const pref = getNotificationPref();
  if (pref.status === 'off' || pref.status === 'snooze') return;

  try {
    const res = await apiRequest('/notifications');
    const notifs = res.notifications || [];
    currentUnreadCount = res.unreadCount !== undefined ? res.unreadCount : 0;
    updateBadgeDisplay();

    // Check for brand new notifications
    const newItems = notifs.filter(n => !lastKnownNotifIds.has(n._id));
    if (newItems.length > 0) {
      newItems.forEach(n => {
        lastKnownNotifIds.add(n._id);
        // Show glowing toast
        if (n.type === 'seat_request') {
          showToast(`⚡ ${n.title}: ${n.message}`, 'success');
        } else if (n.type === 'ride_posted') {
          showToast(`🚗 ${n.title}: ${n.message}`, 'info');
        }
      });
    }
  } catch (e) {}
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
              <div class="notif-dropdown-header">
                <div>
                  <strong style="font-size: 0.92rem; display: flex; align-items: center; gap: 6px;">
                    🔔 Live Notifications
                  </strong>
                  <div style="font-size: 0.72rem; color: #a7f3d0; margin-top: 1px;">Real-time ride requests & campus alerts</div>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <button type="button" class="btn-mark-all-read" onclick="markAllNotificationsAsRead()" title="Mark all as read">
                    ✓ Read All
                  </button>
                  <button onclick="toggleNotifications()" style="background: none; border: none; color: white; font-size: 1.3rem; line-height: 1; cursor: pointer; padding: 0 4px;">&times;</button>
                </div>
              </div>

              <!-- Alert Preferences Bar (ON / SNOOZE / OFF) -->
              <div id="notif-pref-controls" class="notif-pref-bar"></div>

              <div id="notif-items-list" class="notif-scroll-area">
                <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 0.85rem;">Loading alerts...</div>
              </div>

              <div style="padding: 10px 14px; background: var(--bg-card); border-top: 1px solid var(--border-color); text-align: center; display: flex; justify-content: space-between; align-items: center;">
                <a href="my-rides.html" style="font-size: 0.78rem; font-weight: 700; color: var(--bup-primary);">Manage My Rides →</a>
                <a href="find-ride.html" style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">Browse Rides →</a>
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
