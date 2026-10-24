/**
 * BUPGO - Home Page Interactions
 */

let currentDirection = 'to_bup';

const CAMPUS_LOC = 'BUP Campus (Main Gate)';

const TO_BUP_CHIPS = [
  'Mirpur 10 Circle', 'Uttara Sector 7 (House Building)', 'Dhanmondi 27 (Rapa Plaza)',
  'Farmgate Metro Station', 'Mohakhali Bus Terminal', 'ECB Chattar (Matikata)',
  'Savar Cantonment (Sena Auditorium)', 'Bashundhara R/A (Main Gate 1)'
];

const FROM_BUP_CHIPS = [
  'Mirpur 10 Circle', 'Uttara Sector 7 (House Building)', 'Dhanmondi 27 (Rapa Plaza)',
  'Savar Bazar Bus Stand', 'Banani Kakoli Mor', 'Farmgate Metro Station',
  'Mohakhali DOHS Gate', 'Gazipur Chourasta', 'Jahangirnagar University (Main Gate)'
];

function setTripDirection(dir) {
  currentDirection = dir;
  const toBtn = document.getElementById('dir-to-bup-btn');
  const fromBtn = document.getElementById('dir-from-bup-btn');
  const startInput = document.getElementById('search-start');
  const destInput = document.getElementById('search-dest');
  const lblStart = document.getElementById('lbl-search-start');
  const lblDest = document.getElementById('lbl-search-dest');

  if (dir === 'to_bup') {
    if (toBtn) { toBtn.className = 'btn btn-sm btn-primary'; }
    if (fromBtn) { fromBtn.className = 'btn btn-sm btn-secondary'; }
    if (lblStart) lblStart.textContent = 'Starting Point (Pickup in City)';
    if (lblDest) lblDest.textContent = 'Destination (BUP Campus)';
    if (destInput) destInput.value = CAMPUS_LOC;
    if (startInput && startInput.value === CAMPUS_LOC) startInput.value = '';
    renderChips('to_bup');
  } else {
    if (toBtn) { toBtn.className = 'btn btn-sm btn-secondary'; }
    if (fromBtn) { fromBtn.className = 'btn btn-sm btn-primary'; }
    if (lblStart) lblStart.textContent = 'Starting Point (From Campus)';
    if (lblDest) lblDest.textContent = 'Destination (Return Drop-off)';
    if (startInput) startInput.value = CAMPUS_LOC;
    if (destInput && destInput.value === CAMPUS_LOC) destInput.value = '';
    renderChips('from_bup');
  }
}

function renderChips(dir) {
  const container = document.getElementById('popular-chips-container');
  if (!container) return;

  const chips = dir === 'to_bup' ? TO_BUP_CHIPS : FROM_BUP_CHIPS;
  const label = dir === 'to_bup' ? 'Popular City Pickups:' : 'Popular Return Routes from BUP:';

  container.innerHTML = `
    <span style="color: var(--text-muted);">${label}</span>
    ${chips.map(loc => `
      <button type="button" class="route-tag-pill" onclick="quickFill('${loc}')">
        ${dir === 'from_bup' ? '➔ ' : ''}${loc}
      </button>
    `).join('')}
  `;
}

function quickFill(location) {
  if (currentDirection === 'to_bup') {
    const startInput = document.getElementById('search-start');
    if (startInput) startInput.value = location;
  } else {
    const destInput = document.getElementById('search-dest');
    if (destInput) destInput.value = location;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  renderChips('to_bup');

  // Set default date to today
  const dateInput = document.getElementById('search-date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }

  // Handle hero search form submit
  const searchForm = document.getElementById('hero-search-form');
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const start = document.getElementById('search-start').value.trim();
      const dest = document.getElementById('search-dest').value.trim();
      const date = document.getElementById('search-date').value;
      const vehicle = document.getElementById('search-vehicle').value;

      const params = new URLSearchParams();
      if (start) params.set('start', start);
      if (dest) params.set('dest', dest);
      if (date) params.set('date', date);
      if (vehicle && vehicle !== 'All') params.set('vehicle', vehicle);
      if (currentDirection === 'from_bup') params.set('tripType', 'return');

      window.location.href = `find-ride.html?${params.toString()}`;
    });
  }

  // Load live statistics
  try {
    const statsData = await apiRequest('/admin/stats');
    if (statsData.success && statsData.stats) {
      const activeEl = document.getElementById('stat-active-rides');
      const studentsEl = document.getElementById('stat-students');
      const co2El = document.getElementById('stat-co2');

      if (activeEl) activeEl.textContent = `${statsData.stats.activeRides}`;
      if (studentsEl) studentsEl.textContent = `${statsData.stats.totalStudents}`;
      if (co2El) co2El.textContent = `${Math.round(statsData.stats.co2SavedKg || 45)} kg`;
    }
  } catch (err) {
    console.warn('Could not load dynamic stats:', err);
  }

  // Load featured rides
  const featuredContainer = document.getElementById('featured-rides-list');
  if (featuredContainer) {
    try {
      const ridesData = await apiRequest('/rides');
      if (ridesData.success && ridesData.rides.length > 0) {
        const topRides = ridesData.rides.slice(0, 3);
        featuredContainer.innerHTML = topRides.map(renderRideCard).join('');
      } else {
        featuredContainer.innerHTML = `
          <div style="text-align: center; padding: 40px; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1;">
            <p style="color: var(--text-muted); font-size: 1.1rem; margin-bottom: 12px;">No active rides posted right now.</p>
            <a href="offer-ride.html" class="btn btn-primary btn-sm">Be the first to offer a ride!</a>
          </div>
        `;
      }
    } catch (err) {
      featuredContainer.innerHTML = `<p style="color: var(--bup-red); text-align: center;">Unable to load rides from server.</p>`;
    }
  }
});

function renderRideCard(ride) {
  const seatsLeft = ride.availableSeats;
  const isFull = seatsLeft <= 0;
  const rating = Number(ride.driverRating !== undefined ? ride.driverRating : 4.9);

  return `
    <div class="ride-card">
      <div class="ride-card-top">
        <div class="driver-mini-info">
          <img src="${ride.driverAvatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(ride.driverName)}" 
               alt="${ride.driverName}" class="driver-mini-avatar">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="driver-name-text">${ride.driverName}</span>
              <span class="badge ${rating >= 4.9 ? 'badge-yellow' : 'badge-green'}" style="font-size: 0.72rem; padding: 2px 7px;">
                ⭐ ${rating.toFixed(1)} ${rating >= 4.9 ? 'Top Rated' : ''}
              </span>
            </div>
            <div class="driver-dept-text">${ride.driverDept} • ID: ${ride.driverStudentId} • ${ride.driverReviews || 18} rides</div>
          </div>
        </div>

        <div class="ride-fare-box">
          <div class="fare-amount">৳ ${ride.estimatedCost}</div>
          <div class="fare-per-seat">per student</div>
        </div>
      </div>

      <div class="route-timeline">
        <div class="route-point start">
          <div class="route-point-label">Departure From</div>
          <div class="route-point-name">${ride.startingLocation}</div>
        </div>
        <div class="route-point end">
          <div class="route-point-label">Destination</div>
          <div class="route-point-name">${ride.destination}</div>
        </div>
      </div>

      <div class="ride-card-meta">
        <div class="meta-item">
          <span>📅 Date:</span>
          <strong>${ride.travelDate}</strong>
        </div>
        <div class="meta-item">
          <span>⏰ Time:</span>
          <strong>${ride.departureTime}</strong>
        </div>
        <div class="meta-item">
          <span>🚘 Type:</span>
          <strong>${ride.transportationType}</strong>
        </div>
        <div class="meta-item">
          <span>🪑 Seats:</span>
          <span class="badge ${isFull ? 'badge-red' : 'badge-green'}">
            ${isFull ? 'Full' : `${seatsLeft} available`}
          </span>
        </div>
      </div>

      <div class="ride-card-actions">
        <span style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">
          "${ride.additionalInfo || 'BUP Student Commute'}"
        </span>
        <a href="find-ride.html?rideId=${ride._id}" class="btn btn-primary btn-sm">
          <span>View & Request</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </div>
  `;
}
