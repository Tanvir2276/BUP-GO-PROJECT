/**
 * BUPGO - Student Profile & Role-Specific Settings Controller
 */

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isLoggedIn()) {
    showToast('Please login to view profile and settings.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 800);
    return;
  }

  // Check URL query param for default tab (?tab=settings or ?tab=personal)
  const urlParams = new URLSearchParams(window.location.search);
  const activeTab = urlParams.get('tab') || 'personal';
  switchProfileTab(activeTab);

  await loadProfile();
  initFormListeners();
});

// Tab Switcher
function switchProfileTab(tabName) {
  const personalBtn = document.getElementById('tab-btn-personal');
  const settingsBtn = document.getElementById('tab-btn-settings');
  const personalSec = document.getElementById('tab-personal-section');
  const settingsSec = document.getElementById('tab-settings-section');

  if (tabName === 'settings') {
    personalBtn.classList.remove('active');
    settingsBtn.classList.add('active');
    personalSec.style.display = 'none';
    settingsSec.style.display = 'block';
  } else {
    settingsBtn.classList.remove('active');
    personalBtn.classList.add('active');
    settingsSec.style.display = 'none';
    personalSec.style.display = 'block';
  }

  // Update URL without reloading
  const newUrl = `${window.location.pathname}?tab=${tabName}`;
  window.history.replaceState({}, '', newUrl);
}

// Load and populate profile data
async function loadProfile() {
  try {
    const data = await apiRequest('/auth/me');
    currentUser = data.user;

    // 1. Populate Personal Information View
    document.getElementById('prof-name').textContent = currentUser.name;
    document.getElementById('prof-sub').textContent = `${currentUser.department || 'BUP Student'} • Batch: ${currentUser.batch || 'N/A'}`;
    document.getElementById('prof-email').textContent = `Email: ${currentUser.email}`;
    document.getElementById('prof-id').textContent = currentUser.studentId;
    document.getElementById('prof-dept').textContent = currentUser.department || 'Not specified';
    document.getElementById('prof-batch').textContent = `${currentUser.batch || 'N/A'} (Session: ${currentUser.session || '2022-23'})`;
    document.getElementById('prof-phone').textContent = currentUser.phone || 'Not provided';
    document.getElementById('prof-role').textContent = currentUser.role === 'admin' ? 'System Administrator' : currentUser.role === 'driver' ? 'Student Driver' : 'Student Passenger';
    document.getElementById('prof-vehicle').textContent = currentUser.vehicleModel || (currentUser.vehicleType || 'None (Passenger)');
    document.getElementById('prof-bio').textContent = currentUser.bio ? `"${currentUser.bio}"` : 'No commuting routine bio added yet.';

    const avatarUrl = currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`;
    document.getElementById('prof-avatar').src = avatarUrl;
    const editPreview = document.getElementById('edit-avatar-preview');
    if (editPreview) editPreview.src = avatarUrl;

    // Role badge
    const roleBadge = document.getElementById('prof-role-badge');
    if (currentUser.role === 'admin') {
      roleBadge.textContent = '🛡️ System Admin';
      roleBadge.className = 'badge badge-purple';
    } else if (currentUser.role === 'driver') {
      roleBadge.textContent = '🚗 Verified Driver';
      roleBadge.className = 'badge badge-green';
    } else {
      roleBadge.textContent = '🎓 Verified Student';
      roleBadge.className = 'badge badge-blue';
    }

    // 2. Populate Edit Personal Form
    document.getElementById('edit-name').value = currentUser.name || '';
    document.getElementById('edit-phone').value = currentUser.phone || '';
    if (currentUser.department) {
      document.getElementById('edit-dept').value = currentUser.department;
    }
    document.getElementById('edit-batch').value = currentUser.batch || '';
    document.getElementById('edit-session').value = currentUser.session || '';
    document.getElementById('edit-vehicle').value = currentUser.vehicleModel || '';
    document.getElementById('edit-bio').value = currentUser.bio || '';

    // 3. Populate Settings Header & Dynamic Content
    document.getElementById('settings-role-title').textContent =
      currentUser.role === 'admin' ? 'System Administrator Control' :
      currentUser.role === 'driver' ? 'Verified Driver Account' : 'Student Passenger Account';

    renderRoleSettings(currentUser);

    // Activity stats
    try {
      const myRides = await apiRequest('/users/my-rides');
      document.getElementById('prof-rides-offered-badge').textContent = `🚘 Rides Offered: ${myRides.postedRides ? myRides.postedRides.length : 0}`;
      document.getElementById('prof-rides-taken-badge').textContent = `🎫 Bookings Made: ${myRides.requestedRides ? myRides.requestedRides.length : 0}`;
    } catch (e) {}

  } catch (err) {
    showToast('Failed to load profile details: ' + err.message, 'error');
  }
}

// Render dynamic settings based on role (Passenger vs Driver vs Admin)
function renderRoleSettings(user) {
  const container = document.getElementById('role-settings-content');
  if (!container) return;

  const role = user.role || 'passenger';
  const settings = user.settings || {};
  const emergency = user.emergencyContact || {};

  if (role === 'passenger') {
    container.innerHTML = `
      <!-- Passenger Commute Preferences -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-card-title">
            <span>🪑</span> Passenger Commute Preferences
          </div>
          <span class="badge badge-blue">Passenger Features</span>
        </div>

        <form id="passenger-prefs-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Preferred Vehicle For Commuting</label>
              <select id="pref-transport" class="form-control">
                <option value="All" ${settings.preferredTransport === 'All' ? 'selected' : ''}>Any Available Vehicle</option>
                <option value="Car" ${settings.preferredTransport === 'Car' ? 'selected' : ''}>Car Only (AC Comfortable)</option>
                <option value="Motorbike" ${settings.preferredTransport === 'Motorbike' ? 'selected' : ''}>Motorbike (Fast Commute)</option>
                <option value="CNG" ${settings.preferredTransport === 'CNG' ? 'selected' : ''}>CNG / Auto</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Preferred Morning Pickup Window</label>
              <select id="pref-window" class="form-control">
                <option value="7:00-7:30" ${settings.pickupWindow === '7:00-7:30' ? 'selected' : ''}>Early Morning (07:00 - 07:30 AM)</option>
                <option value="7:30-8:00" ${settings.pickupWindow === '7:30-8:00' ? 'selected' : ''}>Standard (07:30 - 08:00 AM)</option>
                <option value="8:00-8:30" ${settings.pickupWindow === '8:00-8:30' ? 'selected' : ''}>Late Morning (08:00 - 08:30 AM)</option>
                <option value="flexible" ${settings.pickupWindow === 'flexible' ? 'selected' : ''}>Flexible Anytime</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Default Home / Pickup Area</label>
            <input type="text" id="pref-pickup" class="form-control" value="${settings.defaultPickup || ''}" placeholder="e.g. Mirpur 10 / Uttara Sector 7 / ECB Chattar">
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-primary btn-sm" style="padding: 8px 18px; font-weight: 700;">
              Save Commute Preferences
            </button>
          </div>
        </form>
      </div>

      <!-- Upgrade Power: Become a Driver -->
      <div class="settings-card" style="border: 2px dashed var(--bup-primary); background: rgba(0, 72, 43, 0.03);">
        <div class="settings-card-header">
          <div class="settings-card-title">
            <span>🚀</span> Upgrade to Driver & Offer Rides
          </div>
          <span class="badge badge-green">Driver Power</span>
        </div>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 15px;">
          Have a car, motorcycle, or CNG? Upgrade your account to a Driver to post rides, share travel costs, and earn fuel contributions from classmates.
        </p>

        <form id="upgrade-driver-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Vehicle Type</label>
              <select id="upg-vehicle-type" class="form-control" required>
                <option value="Car">Car</option>
                <option value="Motorbike">Motorbike</option>
                <option value="CNG">CNG / Auto</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Vehicle Model & Registration</label>
              <input type="text" id="upg-vehicle-model" class="form-control" placeholder="e.g. Toyota Axio (Dhaka Metro Ga 21-4321)" required>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="font-weight: 700;">
            🚗 Activate Driver Account & Offer Rides
          </button>
        </form>
      </div>

      <!-- Emergency Campus Safety Contact -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-card-title">
            <span>🚨</span> Campus Commute Emergency Safety Contact
          </div>
          <span style="font-size: 0.78rem; color: var(--text-muted);">Optional</span>
        </div>
        <form id="emergency-contact-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Emergency Contact Name</label>
              <input type="text" id="em-name" class="form-control" value="${emergency.name || ''}" placeholder="Guardian or close classmate">
            </div>
            <div class="form-group">
              <label class="form-label">Emergency Contact Phone</label>
              <input type="tel" id="em-phone" class="form-control" value="${emergency.phone || ''}" placeholder="017xxxxxxxx">
            </div>
          </div>
          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-secondary btn-sm" style="padding: 8px 16px; font-weight: 700;">
              Save Emergency Contact
            </button>
          </div>
        </form>
      </div>
    `;
  } else if (role === 'driver') {
    container.innerHTML = `
      <!-- Driver Vehicle & Ride Offering Powers -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-card-title">
            <span>🚘</span> Driver Vehicle & Ride Offering Powers
          </div>
          <span class="badge badge-green">Active Driver</span>
        </div>

        <form id="driver-settings-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Vehicle Type</label>
              <select id="drv-vehicle-type" class="form-control">
                <option value="Car" ${user.vehicleType === 'Car' ? 'selected' : ''}>Car</option>
                <option value="Motorbike" ${user.vehicleType === 'Motorbike' ? 'selected' : ''}>Motorbike</option>
                <option value="CNG" ${user.vehicleType === 'CNG' ? 'selected' : ''}>CNG / Auto</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Vehicle Model & Number Plate</label>
              <input type="text" id="drv-vehicle-model" class="form-control" value="${user.vehicleModel || ''}" placeholder="e.g. Toyota Axio (Dhaka Metro Ga 21-4321)">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Standard Seats Offered</label>
              <select id="drv-seats" class="form-control">
                <option value="1" ${settings.defaultSeats === 1 ? 'selected' : ''}>1 Seat (Motorbike / Car)</option>
                <option value="2" ${settings.defaultSeats === 2 ? 'selected' : ''}>2 Seats</option>
                <option value="3" ${settings.defaultSeats === 3 || !settings.defaultSeats ? 'selected' : ''}>3 Seats (Standard Car)</option>
                <option value="4" ${settings.defaultSeats === 4 ? 'selected' : ''}>4 Seats</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Default Fuel Share Fare (৳)</label>
              <input type="number" id="drv-cost" class="form-control" value="${settings.defaultCost || 50}" min="20" max="150">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">In-Car AC / Comfort Preference</label>
              <select id="drv-ac" class="form-control">
                <option value="ac_on" ${settings.acPolicy === 'ac_on' ? 'selected' : ''}>❄️ AC Always On</option>
                <option value="on_demand" ${settings.acPolicy === 'on_demand' ? 'selected' : ''}>🌬️ AC On Demand</option>
                <option value="windows" ${settings.acPolicy === 'windows' ? 'selected' : ''}>🚗 Windows Down / Natural Air</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Punctuality Rule at Pickup Point</label>
              <select id="drv-wait" class="form-control">
                <option value="exact" ${settings.waitRule === 'exact' ? 'selected' : ''}>⏰ Sharp Departure (Zero wait time)</option>
                <option value="5mins" ${settings.waitRule === '5mins' || !settings.waitRule ? 'selected' : ''}>⏳ Wait up to 5 minutes maximum</option>
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" class="btn btn-primary btn-sm" style="padding: 9px 20px; font-weight: 700;">
              💾 Save Driver Preferences
            </button>
          </div>
        </form>
      </div>

      <!-- Role Mode Switch -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-card-title">
            <span>🔄</span> Driver Status & Role Switch
          </div>
          <span style="font-size: 0.78rem; color: var(--text-muted);">Role Control</span>
        </div>
        <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 15px;">
          Want to switch off driving duties and use BUPGO solely as a passenger?
        </p>
        <button type="button" onclick="switchRoleToPassenger()" class="btn btn-secondary" style="font-weight: 700;">
          🎓 Switch Role to Passenger
        </button>
      </div>
    `;
  } else if (role === 'admin') {
    container.innerHTML = `
      <!-- Admin Controls & Powers -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-card-title">
            <span>🛡️</span> BUPGO Administrator Powers & Controls
          </div>
          <span class="badge badge-purple">System Admin</span>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 15px; margin-bottom: 20px;">
          <div style="padding: 14px; background: var(--bg-main); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Service State</div>
            <strong style="color: #15803d; font-size: 1.1rem; display: block; margin-top: 4px;">🟢 Live & Operating</strong>
          </div>
          <div style="padding: 14px; background: var(--bg-main); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Max Fare Cap</div>
            <strong style="color: var(--bup-primary); font-size: 1.1rem; display: block; margin-top: 4px;">৳ 150 / seat</strong>
          </div>
          <div style="padding: 14px; background: var(--bg-main); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Verification Rule</div>
            <strong style="color: var(--text-main); font-size: 1.1rem; display: block; margin-top: 4px;">BUP ID Check Active</strong>
          </div>
        </div>

        <a href="admin.html" class="btn btn-primary" style="font-weight: 700; display: inline-flex; align-items: center; gap: 8px;">
          <span>🛡️ Open Full Admin Dashboard</span>
          <span>→</span>
        </a>
      </div>

      <!-- Instant Campus Broadcast Notification Tool -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-card-title">
            <span>📢</span> Instant Campus Broadcast Notification Tool
          </div>
          <span class="badge badge-yellow">Admin Power</span>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 15px;">
          Broadcast an urgent safety, weather, or road alert directly to all BUP students' app notification drawers.
        </p>

        <form id="admin-broadcast-form">
          <div class="form-group">
            <label class="form-label">Alert Title</label>
            <input type="text" id="bc-title" class="form-control" placeholder="e.g. ⚠️ Traffic Delay at Mirpur 10 / Campus Notice" required>
          </div>
          <div class="form-group">
            <label class="form-label">Alert Message</label>
            <textarea id="bc-msg" class="form-control" placeholder="Provide clear instructions for students and drivers..." required></textarea>
          </div>
          <button type="submit" class="btn btn-gold" id="btn-send-broadcast" style="font-weight: 700;">
            📢 Broadcast Alert to All Students
          </button>
        </form>
      </div>
    `;
  }

  attachDynamicSettingsEvents();
}

// Attach listeners for settings forms
function attachDynamicSettingsEvents() {
  // Passenger preferences form
  const passForm = document.getElementById('passenger-prefs-form');
  if (passForm) {
    passForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const preferredTransport = document.getElementById('pref-transport').value;
      const pickupWindow = document.getElementById('pref-window').value;
      const defaultPickup = document.getElementById('pref-pickup').value.trim();

      try {
        const res = await apiRequest('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({
            settings: { preferredTransport, pickupWindow, defaultPickup }
          })
        });
        Auth.setSession(Auth.getToken(), res.user);
        showToast('Commute preferences saved successfully!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Upgrade to Driver form
  const upgForm = document.getElementById('upgrade-driver-form');
  if (upgForm) {
    upgForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const vehicleType = document.getElementById('upg-vehicle-type').value;
      const vehicleModel = document.getElementById('upg-vehicle-model').value.trim();

      try {
        const res = await apiRequest('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({
            role: 'driver',
            vehicleType,
            vehicleModel
          })
        });
        Auth.setSession(Auth.getToken(), res.user);
        showToast('🎉 Congratulations! You are now an active BUP Driver.', 'success');
        setTimeout(() => loadProfile(), 600);
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Emergency contact form
  const emForm = document.getElementById('emergency-contact-form');
  if (emForm) {
    emForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('em-name').value.trim();
      const phone = document.getElementById('em-phone').value.trim();

      try {
        const res = await apiRequest('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ emergencyContact: { name, phone } })
        });
        Auth.setSession(Auth.getToken(), res.user);
        showToast('Emergency contact saved.', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Driver settings form
  const drvForm = document.getElementById('driver-settings-form');
  if (drvForm) {
    drvForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const vehicleType = document.getElementById('drv-vehicle-type').value;
      const vehicleModel = document.getElementById('drv-vehicle-model').value.trim();
      const defaultSeats = Number(document.getElementById('drv-seats').value);
      const defaultCost = Number(document.getElementById('drv-cost').value);
      const acPolicy = document.getElementById('drv-ac').value;
      const waitRule = document.getElementById('drv-wait').value;

      try {
        const res = await apiRequest('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({
            vehicleType,
            vehicleModel,
            settings: { defaultSeats, defaultCost, acPolicy, waitRule }
          })
        });
        Auth.setSession(Auth.getToken(), res.user);
        showToast('Driver preferences saved!', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  // Admin broadcast tool form
  const bcForm = document.getElementById('admin-broadcast-form');
  if (bcForm) {
    bcForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('bc-title').value.trim();
      const message = document.getElementById('bc-msg').value.trim();
      const btn = document.getElementById('btn-send-broadcast');

      btn.disabled = true;
      btn.textContent = 'Broadcasting...';

      try {
        // Send alert via notifications API endpoint
        await apiRequest('/rides', {
          method: 'POST',
          body: JSON.stringify({
            startingLocation: 'BUP Campus (Main Gate)',
            destination: 'All Routes (Campus Announcement)',
            travelDate: new Date().toISOString().split('T')[0],
            departureTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            totalSeats: 1,
            availableSeats: 1,
            estimatedCost: 0,
            transportationType: 'Car',
            additionalInfo: `${title}: ${message}`
          })
        });

        showToast('📢 Campus broadcast notification sent to all students!', 'success');
        document.getElementById('bc-title').value = '';
        document.getElementById('bc-msg').value = '';
        btn.disabled = false;
        btn.textContent = '📢 Broadcast Alert to All Students';
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = '📢 Broadcast Alert to All Students';
      }
    });
  }
}

// Switch role back to passenger
async function switchRoleToPassenger() {
  if (!confirm('Are you sure you want to switch your primary mode to Passenger?')) return;
  try {
    const res = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ role: 'passenger' })
    });
    Auth.setSession(Auth.getToken(), res.user);
    showToast('Switched to Passenger mode.', 'info');
    setTimeout(() => loadProfile(), 600);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// Form listeners for Personal Info edit and Password change
function initFormListeners() {
  // 1. Save Personal Information
  const editForm = document.getElementById('profile-edit-form');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('edit-name').value.trim();
      const phone = document.getElementById('edit-phone').value.trim();
      const department = document.getElementById('edit-dept').value;
      const batch = document.getElementById('edit-batch').value.trim();
      const session = document.getElementById('edit-session').value.trim();
      const vehicleModel = document.getElementById('edit-vehicle').value.trim();
      const bio = document.getElementById('edit-bio').value.trim();
      const saveBtn = document.getElementById('btn-save-profile');

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const res = await apiRequest('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ name, phone, department, batch, session, vehicleModel, bio })
        });

        Auth.setSession(Auth.getToken(), res.user);
        showToast('Personal information updated successfully!', 'success');
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save & Update Information';
        await loadProfile();

        // Refresh navbar user details
        if (typeof renderNavbar === 'function') renderNavbar();
      } catch (err) {
        showToast(err.message || 'Error updating profile', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 Save & Update Information';
      }
    });
  }

  // 2. Change Password
  const pwForm = document.getElementById('change-password-form');
  if (pwForm) {
    pwForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('pw-current').value;
      const newPassword = document.getElementById('pw-new').value;
      const btn = document.getElementById('btn-change-password');

      btn.disabled = true;
      btn.textContent = 'Updating...';

      try {
        const res = await apiRequest('/auth/change-password', {
          method: 'POST',
          body: JSON.stringify({ currentPassword, newPassword })
        });
        showToast(res.message || 'Password changed successfully!', 'success');
        document.getElementById('pw-current').value = '';
        document.getElementById('pw-new').value = '';
        btn.disabled = false;
        btn.textContent = '🔑 Update Password';
      } catch (err) {
        showToast(err.message || 'Failed to change password', 'error');
        btn.disabled = false;
        btn.textContent = '🔑 Update Password';
      }
    });
  }
}

// Photo Upload Handler (Supports Phone Gallery/Camera & PC)
async function handlePhotoUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select a valid image file (JPG, PNG, WEBP).', 'error');
    return;
  }

  showToast('Processing photo...', 'info');

  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = async function() {
      // Scale down image to max 320x320 with JPEG compression for lightning fast loading
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 320;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round(height * (MAX_SIZE / width));
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round(width * (MAX_SIZE / height));
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const base64Data = canvas.toDataURL('image/jpeg', 0.85);

      // Instant preview
      const profAvatar = document.getElementById('prof-avatar');
      if (profAvatar) profAvatar.src = base64Data;
      const editPreview = document.getElementById('edit-avatar-preview');
      if (editPreview) editPreview.src = base64Data;

      try {
        const res = await apiRequest('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ avatar: base64Data })
        });
        Auth.setSession(Auth.getToken(), res.user);
        currentUser = res.user;
        showToast('Profile photo uploaded and saved successfully!', 'success');
        if (typeof renderNavbar === 'function') renderNavbar();
      } catch (err) {
        showToast(err.message || 'Failed to save photo', 'error');
      }
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
}

// Avatar changer helper
async function chooseNewAvatar() {
  const seeds = ['Tanvir', 'Hossain', 'Alex', 'Sarah', 'Jessica', 'David', 'Rahul', 'Farhan'];
  const randomSeed = seeds[Math.floor(Math.random() * seeds.length)] + Math.floor(Math.random() * 99);
  const newAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(randomSeed)}`;

  try {
    const res = await apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ avatar: newAvatar })
    });
    Auth.setSession(Auth.getToken(), res.user);
    showToast('New avatar generated & saved!', 'info');
    await loadProfile();
    if (typeof renderNavbar === 'function') renderNavbar();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
