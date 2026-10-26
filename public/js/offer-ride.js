/**
 * BUPGO - Offer a Ride Controller
 */

const CAMPUS_NAME = 'BUP Campus (Main Gate)';

function setOfferDirection(dir) {
  const startEl = document.getElementById('offer-start');
  const destEl = document.getElementById('offer-dest');
  const container = document.getElementById('offer-chips-container');

  if (dir === 'to_campus') {
    if (destEl) destEl.value = CAMPUS_NAME;
    if (startEl && startEl.value === CAMPUS_NAME) startEl.value = '';

    if (container) {
      container.innerHTML = `
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('Mirpur 10 Circle', '${CAMPUS_NAME}', 40)">Mirpur 10 ➔ BUP (৳40)</button>
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('Uttara Sector 7 (House Building)', '${CAMPUS_NAME}', 70)">Uttara ➔ BUP (৳70)</button>
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('Dhanmondi 27 (Rapa Plaza)', '${CAMPUS_NAME}', 80)">Dhanmondi ➔ BUP (৳80)</button>
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('Savar Cantonment (Sena Auditorium)', '${CAMPUS_NAME}', 90)">Savar ➔ BUP (৳90)</button>
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('Farmgate Metro Station', '${CAMPUS_NAME}', 50)">Farmgate ➔ BUP (৳50)</button>
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('Mohakhali Bus Terminal', '${CAMPUS_NAME}', 60)">Mohakhali ➔ BUP (৳60)</button>
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('ECB Chattar (Matikata)', '${CAMPUS_NAME}', 30)">ECB Chattar ➔ BUP (৳30)</button>
      `;
    }
  } else {
    if (startEl) startEl.value = CAMPUS_NAME;
    if (destEl && destEl.value === CAMPUS_NAME) destEl.value = '';

    if (container) {
      container.innerHTML = `
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('${CAMPUS_NAME}', 'Mirpur 10 Circle', 40)">BUP ➔ Mirpur 10 (৳40)</button>
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('${CAMPUS_NAME}', 'Uttara Sector 7 (House Building)', 70)">BUP ➔ Uttara (৳70)</button>
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('${CAMPUS_NAME}', 'Dhanmondi 27 (Rapa Plaza)', 80)">BUP ➔ Dhanmondi (৳80)</button>
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('${CAMPUS_NAME}', 'Savar Bazar Bus Stand', 90)">BUP ➔ Savar (৳90)</button>
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('${CAMPUS_NAME}', 'Banani Kakoli Mor', 60)">BUP ➔ Banani (৳60)</button>
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('${CAMPUS_NAME}', 'Farmgate Metro Station', 50)">BUP ➔ Farmgate (৳50)</button>
        <button type="button" class="hotspot-chip" onclick="applyRouteTemplate('${CAMPUS_NAME}', 'Gazipur Chourasta', 95)">BUP ➔ Gazipur (৳95)</button>
      `;
    }
  }
}

function applyRouteTemplate(start, dest, cost) {
  document.getElementById('offer-start').value = start;
  document.getElementById('offer-dest').value = dest;
  if (cost) {
    document.getElementById('offer-cost').value = cost;
  }
  calculateDynamicFare();
}

let fareDebounceTimer = null;
async function calculateDynamicFare() {
  const start = document.getElementById('offer-start')?.value.trim();
  const dest = document.getElementById('offer-dest')?.value.trim();
  const vehicle = document.getElementById('offer-vehicle')?.value || 'Car';

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
      const costInput = document.getElementById('offer-cost');
      if (costInput) costInput.value = f.totalFare;

      const totalDisplay = document.getElementById('fare-total-display');
      if (totalDisplay) totalDisplay.textContent = `৳ ${f.totalFare}`;

      const distPill = document.getElementById('fare-dist-pill');
      if (distPill) distPill.textContent = `Est. Distance: ~${f.distanceKm} km`;

      const formulaDisplay = document.getElementById('fare-formula-display');
      if (formulaDisplay) formulaDisplay.textContent = f.breakdown.formula;

      const baseEl = document.getElementById('breakdown-base');
      if (baseEl) baseEl.textContent = `৳${f.rates.baseFare}`;

      const rateEl = document.getElementById('breakdown-rate');
      if (rateEl) rateEl.textContent = `৳${f.rates.perKmRate}/km`;

      const waitEl = document.getElementById('breakdown-wait');
      if (waitEl) waitEl.textContent = `৳${f.rates.waitingChargePerMin}/min`;
    }
  } catch (err) {
    console.warn('Fare calculation notice:', err.message);
  }
}

function debounceCalculateFare() {
  clearTimeout(fareDebounceTimer);
  fareDebounceTimer = setTimeout(calculateDynamicFare, 400);
}

function adjustSeatDefaults(type) {
  const seatsInput = document.getElementById('offer-seats');
  if (type === 'Motorbike') {
    seatsInput.value = 1;
    seatsInput.max = 1;
  } else if (type === 'CNG') {
    seatsInput.value = 2;
    seatsInput.max = 3;
  } else if (type === 'Car') {
    seatsInput.value = 3;
    seatsInput.max = 4;
  } else {
    seatsInput.value = 4;
    seatsInput.max = 8;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Check auth
  if (!Auth.isLoggedIn()) {
    showToast('Please login to offer a ride.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
    return;
  }

  // Pre-fill default date to tomorrow
  const dateInput = document.getElementById('offer-date');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
  }

  // Auto-fill vehicle info from logged in user profile if exists
  const user = Auth.getUser();
  if (user && user.vehicleModel) {
    const modelInput = document.getElementById('offer-model');
    if (modelInput && !modelInput.value) {
      modelInput.value = user.vehicleModel;
    }
  }

  // Dynamic Fare Listeners (Auto-recalculate on change of start, destination, or vehicle)
  const startInput = document.getElementById('offer-start');
  const destInput = document.getElementById('offer-dest');
  const vehicleSelect = document.getElementById('offer-vehicle');

  if (startInput) {
    startInput.addEventListener('input', debounceCalculateFare);
    startInput.addEventListener('change', calculateDynamicFare);
  }
  if (destInput) {
    destInput.addEventListener('input', debounceCalculateFare);
    destInput.addEventListener('change', calculateDynamicFare);
  }
  if (vehicleSelect) {
    vehicleSelect.addEventListener('change', () => {
      adjustSeatDefaults(vehicleSelect.value);
      calculateDynamicFare();
    });
  }

  // Initial calculation on load
  calculateDynamicFare();

  // Form submit handler
  const form = document.getElementById('offer-ride-form');
  const submitBtn = document.getElementById('submit-ride-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const startingLocation = document.getElementById('offer-start').value.trim();
      const destination = document.getElementById('offer-dest').value.trim();
      const travelDate = document.getElementById('offer-date').value;
      const departureTime = document.getElementById('offer-time').value.trim();
      const transportationType = document.getElementById('offer-vehicle').value;
      const availableSeats = document.getElementById('offer-seats').value;
      const vehicleModel = document.getElementById('offer-model').value.trim();
      const estimatedCost = document.getElementById('offer-cost').value;
      const additionalInfo = document.getElementById('offer-info').value.trim();

      const directionRadio = document.querySelector('input[name="offer-direction"]:checked');
      const tripType = directionRadio ? directionRadio.value : (startingLocation.toLowerCase().includes('bup') ? 'return' : 'to_campus');

      submitBtn.disabled = true;
      submitBtn.textContent = 'Posting Ride to NoSQL Database...';

      try {
        const response = await apiRequest('/rides', {
          method: 'POST',
          body: JSON.stringify({
            startingLocation,
            destination,
            travelDate,
            departureTime,
            transportationType,
            availableSeats,
            vehicleModel,
            estimatedCost,
            tripType,
            additionalInfo
          })
        });

        window.location.href = 'find-ride.html';
      } catch (err) {
        showToast(err.message || 'Error posting ride', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = '🚗 Publish Ride to BUPGO';
      }
    });
  }
});
