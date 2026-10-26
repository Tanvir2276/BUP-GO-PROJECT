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

  // Date input defaults to optional (any upcoming date) unless specified
  const dateInput = document.getElementById('search-date');
  if (dateInput) {
    // Keep placeholder or empty so passenger finds all active rides across dates
    dateInput.value = '';
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
  const vehEmoji = ride.transportationType === 'Bike' ? '🏍️' : ride.transportationType === 'CNG' ? '🛺' : '🚗';
  const vehAccent = ride.transportationType === 'Bike' ? 'var(--bup-gold)' : ride.transportationType === 'CNG' ? 'var(--bup-blue)' : 'var(--bup-primary)';

  return `
    <div class="ride-card" style="border-top: 4px solid ${vehAccent}; position: relative;">
      <div class="ride-card-top" style="align-items: flex-start;">
        <div class="driver-mini-info">
          <div style="position: relative;">
            <img src="${ride.driverAvatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(ride.driverName)}" 
                 alt="${ride.driverName}" class="driver-mini-avatar" style="border: 2px solid ${vehAccent};">
            <span style="position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; background: #10b981; border: 2px solid var(--bg-card); border-radius: 50%;"></span>
          </div>
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="driver-name-text" style="font-size: 1.05rem;">${ride.driverName}</span>
              <span class="badge ${rating >= 4.9 ? 'badge-yellow' : 'badge-green'}" style="font-size: 0.72rem; padding: 2px 7px;">
                ⭐ ${rating.toFixed(1)} ${rating >= 4.9 ? 'Top Rated' : ''}
              </span>
              <span class="badge badge-blue" style="font-size: 0.72rem; padding: 2px 7px;">
                ${vehEmoji} ${ride.transportationType}
              </span>
            </div>
            <div class="driver-dept-text" style="margin-top: 2px;">
              ${ride.driverDept} • ID: ${ride.driverStudentId} • ${ride.vehicleModel || 'Campus Carpool'}
            </div>
          </div>
        </div>

        <div class="ride-fare-box">
          <div class="fare-amount" style="font-size: 1.6rem;">৳ ${ride.estimatedCost}</div>
          <div class="fare-per-seat" style="font-weight: 700; color: var(--text-muted);">per seat</div>
          <div style="font-size: 0.65rem; color: var(--bup-primary); font-weight: 700; margin-top: 2px;">🛡️ 10% Guarantee</div>
        </div>
      </div>

      <!-- Route Timeline -->
      <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 16px; margin: 4px 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted);">Route & Time</span>
          <span style="font-size: 0.75rem; font-weight: 700; color: var(--bup-primary);">📅 ${ride.travelDate}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 8px; position: relative; padding-left: 22px;">
          <div style="position: absolute; left: 5px; top: 6px; bottom: 6px; width: 2px; border-left: 2px dashed #94a3b8;"></div>
          <div>
            <span style="position: absolute; left: -22px; top: 1px;">🟢</span>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Pickup:</div>
            <div style="font-size: 0.92rem; font-weight: 800; color: var(--text-main);">${ride.startingLocation}</div>
            <span class="badge badge-yellow" style="font-size: 0.68rem; padding: 1px 6px;">⏰ ${ride.departureTime}</span>
          </div>
          <div style="margin-top: 4px;">
            <span style="position: absolute; left: -22px; top: 48px;">🏁</span>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Destination:</div>
            <div style="font-size: 0.92rem; font-weight: 800; color: var(--text-main);">${ride.destination}</div>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span>💺 <strong>Seats:</strong></span>
          <span class="badge ${isFull ? 'badge-red' : 'badge-green'}">
            ${isFull ? 'Full (0 Left)' : `${seatsLeft} of ${ride.totalSeats} seats left`}
          </span>
        </div>
        <div style="color: var(--text-muted); font-size: 0.76rem;">
          <em>${ride.additionalInfo || 'BUP Commute'}</em>
        </div>
      </div>

      <div class="ride-card-actions" style="margin-top: 6px; padding-top: 8px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="openLiveRideTracker({ startLoc: '${ride.startingLocation.replace(/'/g, "\\'")}', destLoc: '${ride.destination.replace(/'/g, "\\'")}', driverName: '${ride.driverName.replace(/'/g, "\\'")}', driverAvatar: '${ride.driverAvatar || ''}', vehicleType: '${ride.transportationType}', vehicleModel: '${(ride.vehicleModel || '').replace(/'/g, "\\'")}', fare: ${ride.estimatedCost} })" style="display: inline-flex; align-items: center; gap: 4px;">
          <span>🗺️ Map & Track</span>
        </button>
        <a href="find-ride.html?rideId=${ride._id}" class="btn btn-primary btn-sm" style="font-weight: 700;">
          <span>Request Seat ➔</span>
        </a>
      </div>
    </div>
  `;
}

/* =========================================================
   HOME PAGE QUICK FARE ESTIMATOR
   ========================================================= */

let homeFareTimer = null;
function debounceHomeFareCalc() {
  clearTimeout(homeFareTimer);
  homeFareTimer = setTimeout(calculateHomeFare, 400);
}

async function calculateHomeFare() {
  const start = document.getElementById('home-fare-start')?.value.trim();
  const dest = document.getElementById('home-fare-dest')?.value.trim();
  const vehicle = document.getElementById('home-fare-vehicle')?.value || 'Car';

  if (!start || !dest) return;

  try {
    const res = await apiRequest('/fares/calculate', {
      method: 'POST',
      body: JSON.stringify({
        startingLocation: start,
        destination: dest,
        vehicleType: vehicle,
        city: 'nationwide'
      })
    });

    if (res.success && res.fare) {
      const f = res.fare;
      const fareEl = document.getElementById('home-fare-val');
      const distEl = document.getElementById('home-dist-val');
      const formulaEl = document.getElementById('home-formula-val');

      if (fareEl) fareEl.textContent = `৳ ${f.totalFare}`;
      if (distEl) distEl.textContent = `(Distance: ~${f.distanceKm} km)`;
      if (formulaEl) formulaEl.textContent = `${f.breakdown.formula} • 🛡️ 3 mins free waiting included`;
    }
  } catch (err) {
    console.warn('Home fare calculation error:', err.message);
  }
}

// Run initial estimate on home page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(calculateHomeFare, 300);
});
