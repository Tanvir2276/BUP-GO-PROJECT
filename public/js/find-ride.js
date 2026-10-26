/**
 * BUPGO - Find a Ride Logic & Modal Interactions
 */

let currentRides = [];

function swapLocations() {
  const startEl = document.getElementById('filter-start');
  const destEl = document.getElementById('filter-dest');
  if (startEl && destEl) {
    const tmp = startEl.value;
    startEl.value = destEl.value;
    destEl.value = tmp;
    loadRides();
  }
}

function handleDirectionChange(dir) {
  const startEl = document.getElementById('filter-start');
  const destEl = document.getElementById('filter-dest');
  if (dir === 'return') {
    if (startEl) startEl.value = 'BUP Campus';
    if (destEl && destEl.value.includes('BUP')) destEl.value = '';
  } else if (dir === 'to_campus') {
    if (destEl) destEl.value = 'BUP Campus';
    if (startEl && startEl.value.includes('BUP')) startEl.value = '';
  }
  loadRides();
}

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  // Pre-fill filters from URL
  if (params.get('start')) document.getElementById('filter-start').value = params.get('start');
  if (params.get('dest')) document.getElementById('filter-dest').value = params.get('dest');
  if (params.get('date')) document.getElementById('filter-date').value = params.get('date');
  if (params.get('vehicle')) document.getElementById('filter-vehicle').value = params.get('vehicle');
  if (params.get('seats')) document.getElementById('filter-seats').value = params.get('seats');

  // Load rides
  loadRides();

  // If a specific ride was requested via URL, open its details
  if (params.get('rideId')) {
    openRideDetails(params.get('rideId'));
  }

  // Handle filter submission
  const filterForm = document.getElementById('filter-form');
  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      loadRides();
    });
  }

  // Reset filters
  const resetBtn = document.getElementById('reset-filters-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('filter-start').value = '';
      document.getElementById('filter-dest').value = '';
      document.getElementById('filter-date').value = '';
      document.getElementById('filter-vehicle').value = 'All';
      document.getElementById('filter-seats').value = '';
      loadRides();
    });
  }

  // Modal Request Form Submit
  const requestForm = document.getElementById('modal-request-form');
  if (requestForm) {
    requestForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!Auth.isLoggedIn()) {
        showToast('Please login to request a ride!', 'error');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);
        return;
      }

      const rideId = document.getElementById('modal-ride-id').value;
      const seatsRequested = document.getElementById('modal-seats-req').value;
      const pickupLocation = document.getElementById('modal-pickup-location').value.trim();
      const notes = document.getElementById('modal-notes').value.trim();

      try {
        const res = await apiRequest('/requests', {
          method: 'POST',
          body: JSON.stringify({
            rideId,
            seatsRequested,
            pickupLocation,
            notes
          })
        });

        showToast(res.message || 'Ride requested successfully!', 'success');
        closeRequestModal();
        loadRides(); // Refresh list to update status
      } catch (err) {
        showToast(err.message || 'Could not send request', 'error');
      }
    });
  }
});

async function loadRides() {
  const container = document.getElementById('rides-list-container');
  const countHeading = document.getElementById('results-count-heading');

  const start = document.getElementById('filter-start').value.trim();
  const dest = document.getElementById('filter-dest').value.trim();
  const date = document.getElementById('filter-date').value;
  const vehicle = document.getElementById('filter-vehicle').value;
  const seats = document.getElementById('filter-seats').value;
  const sort = document.getElementById('filter-sort') ? document.getElementById('filter-sort').value : 'newest';
  const dir = document.getElementById('filter-direction') ? document.getElementById('filter-direction').value : 'all';

  const queryParams = new URLSearchParams();
  if (start) queryParams.set('start', start);
  if (dest) queryParams.set('destination', dest);
  if (date) queryParams.set('date', date);
  if (vehicle && vehicle !== 'All') queryParams.set('vehicle', vehicle);
  if (seats) queryParams.set('minSeats', seats);
  if (sort) queryParams.set('sort', sort);
  if (dir && dir !== 'all') queryParams.set('tripType', dir);

  container.innerHTML = `
    <div style="text-align: center; padding: 40px; color: var(--text-muted);">
      Searching active BUP rides...
    </div>
  `;

  try {
    const data = await apiRequest(`/rides?${queryParams.toString()}`);
    currentRides = data.rides || [];

    if (countHeading) {
      if (data.fallbackToRoute) {
        countHeading.innerHTML = `${currentRides.length} Available Ride${currentRides.length === 1 ? '' : 's'} <span style="font-size: 0.82rem; font-weight: 500; color: var(--bup-primary); margin-left: 8px;">(Showing upcoming dates for this route)</span>`;
      } else {
        countHeading.textContent = `${currentRides.length} Available Ride${currentRides.length === 1 ? '' : 's'}`;
      }
    }

    if (currentRides.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 50px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">🚗</div>
          <h3 style="font-size: 1.2rem; margin-bottom: 8px;">No matching rides found</h3>
          <p style="color: var(--text-muted); margin-bottom: 20px;">Try adjusting your search filters or be the first to offer a carpool on this route!</p>
          <a href="offer-ride.html" class="btn btn-primary btn-sm">Offer a Ride on this Route</a>
        </div>
      `;
      return;
    }

    container.innerHTML = currentRides.map(ride => {
      const seatsLeft = ride.availableSeats;
      const isFull = seatsLeft <= 0;
      const currentUser = Auth.getUser();
      const isOwnRide = currentUser && String(currentUser.id) === String(ride.driverId);
      const rating = Number(ride.driverRating !== undefined ? ride.driverRating : 4.9);

      const vehEmoji = ride.transportationType === 'Bike' ? '🏍️' : ride.transportationType === 'CNG' ? '🛺' : '🚗';
      const vehAccent = ride.transportationType === 'Bike' ? 'var(--bup-gold)' : ride.transportationType === 'CNG' ? 'var(--bup-blue)' : 'var(--bup-primary)';

      return `
        <div class="ride-card" style="border-top: 4px solid ${vehAccent}; position: relative; overflow: hidden;">
          <!-- Top Driver & Vehicle Header -->
          <div class="ride-card-top" style="align-items: flex-start;">
            <div class="driver-mini-info">
              <div style="position: relative;">
                <img src="${ride.driverAvatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(ride.driverName)}" 
                     alt="${ride.driverName}" class="driver-mini-avatar" style="border: 2px solid ${vehAccent};">
                <span style="position: absolute; bottom: 0; right: 0; width: 12px; height: 12px; background: #10b981; border: 2px solid var(--bg-card); border-radius: 50%;"></span>
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
                  <span>${ride.driverDept}</span> • 
                  <span>ID: ${ride.driverStudentId}</span> • 
                  <span>${ride.vehicleModel || 'Standard Campus Model'}</span>
                </div>
              </div>
            </div>

            <!-- Price Box with 10% Guarantee -->
            <div class="ride-fare-box">
              <div class="fare-amount" style="font-size: 1.7rem;">৳ ${ride.estimatedCost}</div>
              <div class="fare-per-seat" style="font-weight: 700; color: var(--text-muted);">per seat</div>
              <div style="font-size: 0.68rem; color: var(--bup-primary); font-weight: 700; margin-top: 2px;">🛡️ 10% Platform Guarantee</div>
            </div>
          </div>

          <!-- Creative Journey Timeline (Pathao / Uber Inspired) -->
          <div style="background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px 16px; margin: 4px 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px;">Trip Route & Schedule</span>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--bup-primary);">📅 ${ride.travelDate}</span>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px; position: relative; padding-left: 24px;">
              <div style="position: absolute; left: 6px; top: 8px; bottom: 8px; width: 2px; background: dashed var(--border-color); border-left: 2px dashed #94a3b8;"></div>
              
              <!-- Pickup -->
              <div style="position: relative;">
                <span style="position: absolute; left: -24px; top: 2px; font-size: 0.85rem;">🟢</span>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Pickup Spot</div>
                <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-main);">${ride.startingLocation}</div>
                <span class="badge badge-yellow" style="font-size: 0.7rem; padding: 1px 6px; margin-top: 2px;">⏰ Departs: ${ride.departureTime}</span>
              </div>

              <!-- Destination -->
              <div style="position: relative;">
                <span style="position: absolute; left: -24px; top: 2px; font-size: 0.85rem;">🏁</span>
                <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Campus Destination</div>
                <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-main);">${ride.destination}</div>
              </div>
            </div>
          </div>

          <!-- Seat Capacity & Comfort Pill -->
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; font-size: 0.82rem;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span>💺 <strong>Seat Availability:</strong></span>
              <span class="badge ${isFull ? 'badge-red' : 'badge-green'}" style="font-size: 0.78rem;">
                ${isFull ? 'Full (0 Left)' : `${seatsLeft} of ${ride.totalSeats} seats left`}
              </span>
            </div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">
              💬 <em>${ride.additionalInfo || 'BUP students carpool commute'}</em>
            </div>
          </div>

          <!-- Action Buttons Bar -->
          <div class="ride-card-actions" style="margin-top: 4px; padding-top: 10px; border-top: 1px solid var(--border-color); display: flex; gap: 8px; justify-content: space-between; flex-wrap: wrap;">
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="openLiveRideTracker({ startLoc: '${ride.startingLocation.replace(/'/g, "\\'")}', destLoc: '${ride.destination.replace(/'/g, "\\'")}', driverName: '${ride.driverName.replace(/'/g, "\\'")}', driverAvatar: '${ride.driverAvatar || ''}', vehicleType: '${ride.transportationType}', vehicleModel: '${(ride.vehicleModel || '').replace(/'/g, "\\'")}', fare: ${ride.estimatedCost} })" style="display: inline-flex; align-items: center; gap: 4px;">
                <span>🗺️ Live Route & Map</span>
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="openRideDetails('${ride._id}')">
                <span>Details</span>
              </button>
            </div>

            ${isOwnRide ? `
              <span class="badge badge-purple" style="font-size: 0.85rem; padding: 6px 12px; align-self: center;">Your Ride Post</span>
            ` : `
              <button type="button" class="btn btn-primary btn-sm" onclick="openRequestModal('${ride._id}')" ${isFull ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''} style="font-weight: 700;">
                <span>${isFull ? 'Ride Full' : 'Request Seat ➔'}</span>
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    container.innerHTML = `<div style="text-align:center; color: var(--bup-red); padding: 40px;">Failed to load rides. Please check server.</div>`;
  }
}

// Open Request Modal
function openRequestModal(rideId) {
  if (!Auth.isLoggedIn()) {
    showToast('Please sign in first to request this ride.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    return;
  }

  const ride = currentRides.find(r => String(r._id) === String(rideId));
  if (!ride) return;

  const costPerSeat = ride.estimatedCost || (ride.fareSnapshot && ride.fareSnapshot.totalFare) || 40;
  const snapshot = ride.fareSnapshot;

  document.getElementById('modal-ride-id').value = ride._id;
  document.getElementById('modal-pickup-location').value = ride.startingLocation;

  // Build seat options based on available seats
  const seatSelect = document.getElementById('modal-seats-req');
  seatSelect.innerHTML = '';
  for (let i = 1; i <= Math.min(ride.availableSeats, 4); i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${i} Seat${i > 1 ? 's' : ''} (৳ ${costPerSeat * i})`;
    seatSelect.appendChild(opt);
  }

  const updateModalFareText = () => {
    const seats = parseInt(seatSelect.value || 1, 10);
    const subtotal = costPerSeat * seats;
    
    // Milestone loyalty discount calculation (Requirement 6)
    const discountRate = 0.50; // 50% Milestone Reward
    const discountAmount = Math.round(subtotal * discountRate);
    const finalTotal = subtotal - discountAmount;

    const calcEl = document.getElementById('modal-fare-calc-text');
    if (calcEl) {
      calcEl.innerHTML = `
        <span style="text-decoration: line-through; color: var(--text-muted); font-size: 0.85rem;">৳ ${subtotal}</span>
        <span style="color: var(--bup-primary); font-size: 1.1rem; margin-left: 6px; font-weight: 800;">৳ ${finalTotal}</span>
        <span class="badge badge-green" style="font-size: 0.7rem; margin-left: 6px;">50% Milestone OFF</span>
      `;
    }
    const btn = document.getElementById('btn-submit-request');
    if (btn) btn.textContent = `Confirm & Send Join Request — ৳ ${finalTotal}`;
  };

  seatSelect.onchange = updateModalFareText;

  const summary = document.getElementById('modal-ride-summary');
  summary.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
      <span style="font-weight: 700; color: var(--bup-primary); font-size: 1rem;">${ride.startingLocation} ➔ ${ride.destination}</span>
      <span style="font-weight: 800; font-size: 1.25rem; color: var(--bup-primary-dark);">৳ ${costPerSeat} <small style="font-size:0.75rem; font-weight:normal;">/seat</small></span>
    </div>
    <div style="font-size: 0.84rem; color: var(--text-muted); margin-bottom: 10px;">
      <span>Driver: <strong>${ride.driverName}</strong> (${ride.driverDept})</span> • 
      <span>Vehicle: <strong>${ride.transportationType}</strong></span> • 
      <span>Date: <strong>${ride.travelDate}</strong> (${ride.departureTime})</span>
    </div>
    <div style="background: var(--bg-card); padding: 10px 14px; border-radius: var(--radius-sm); border: 1px dashed var(--border-color); font-size: 0.82rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <span style="color: var(--text-muted);">Authoritative Fare Total:</span>
        <strong id="modal-fare-calc-text" style="color: var(--bup-primary); font-size: 0.95rem;">1 Seat × ৳ ${costPerSeat} = ৳ ${costPerSeat}</strong>
      </div>
      <div style="font-size: 0.76rem; color: var(--bup-primary);">
        ${snapshot ? `Formula: ৳${snapshot.rates.baseFare} Base + (${snapshot.distanceKm}km × ৳${snapshot.rates.perKmRate}) • 🛡️ 3 mins free waiting time included` : 'Formula: Base Fare + Distance Rate (Authoritative BUPGO Central Store) • 🛡️ 3 mins free waiting included'}
      </div>
    </div>

    <!-- Milestone Loyalty & Points Banner (Requirements 6 & 7) -->
    <div style="margin-top: 10px; background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; border-radius: var(--radius-sm); padding: 9px 12px; font-size: 0.78rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
      <div>
        <strong style="color: var(--bup-primary);">🎉 50% Milestone Loyalty Reward Applied!</strong>
        <div style="color: var(--text-muted); font-size: 0.72rem;">Driver receives 100% full payout (subsidized by BUPGO Platform Owner).</div>
      </div>
      <span class="badge badge-yellow" style="font-size: 0.72rem;">🪙 +10 Pts on Completion</span>
    </div>
  `;

  updateModalFareText();
  document.getElementById('request-modal').classList.add('active');
}

function closeRequestModal() {
  document.getElementById('request-modal').classList.remove('active');
}

// Open Details Modal
async function openRideDetails(rideId) {
  try {
    const data = await apiRequest(`/rides/${rideId}`);
    if (!data.success || !data.ride) {
      showToast('Could not load ride details', 'error');
      return;
    }

    const ride = data.ride;
    const passengers = data.acceptedPassengers || [];
    const myReq = data.myRequest;

    const body = document.getElementById('details-modal-body');
    const footer = document.getElementById('details-modal-footer');

    body.innerHTML = `
      <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border-color);">
        <img src="${ride.driverAvatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(ride.driverName)}" 
             style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover; border: 2px solid var(--bup-primary-soft);" alt="${ride.driverName}">
        <div>
          <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">${ride.driverName}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">${ride.driverDept} • Student ID: <strong>${ride.driverStudentId}</strong></p>
          <p style="font-size: 0.85rem; color: var(--bup-primary); font-weight: 600; margin-top: 2px;">
            📞 Driver Phone: ${myReq && myReq.status === 'accepted' ? `<a href="tel:${ride.driverPhone}">${ride.driverPhone}</a>` : 'Available once request is accepted'}
          </p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px;">
        <div style="background: #f8fafc; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block;">Pickup Location</span>
          <strong style="color: var(--text-main); font-size: 0.95rem;">${ride.startingLocation}</strong>
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block;">Destination</span>
          <strong style="color: var(--text-main); font-size: 0.95rem;">${ride.destination}</strong>
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block;">Date & Time</span>
          <strong style="color: var(--text-main); font-size: 0.95rem;">${ride.travelDate} at ${ride.departureTime}</strong>
        </div>
        <div style="background: #f8fafc; padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block;">Vehicle & Fare</span>
          <strong style="color: var(--text-main); font-size: 0.95rem;">${ride.transportationType} (${ride.vehicleModel || 'Standard'}) • ৳${ride.estimatedCost}</strong>
        </div>
      </div>

      ${ride.fareSnapshot ? `
        <div style="background: var(--bg-card); padding: 12px 14px; border-radius: var(--radius-md); border: 1px dashed var(--border-color); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-size: 0.85rem; color: var(--bup-primary);">💰 Dynamic Fare Snapshot (Official BUPGO Rates):</strong>
            <span class="badge badge-green">৳ ${ride.estimatedCost} / seat</span>
          </div>
          <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.5;">
            Route Distance: <strong>${ride.fareSnapshot.distanceKm} km</strong> • Base: <strong>৳${ride.fareSnapshot.rates.baseFare}</strong> • Rate: <strong>৳${ride.fareSnapshot.rates.perKmRate}/km</strong> • Waiting: <strong>৳${ride.fareSnapshot.rates.waitingChargePerMin}/min</strong> (3 mins free waiting included)
          </div>
        </div>
      ` : ''}

      <div style="margin-bottom: 20px;">
        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 6px;">Ride Guidelines & Notes:</h4>
        <p style="font-size: 0.9rem; color: var(--text-muted); background: var(--bg-card); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
          ${ride.additionalInfo || 'Please arrive 5 minutes before departure at the designated spot.'}
        </p>
      </div>

      <div>
        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">
          Confirmed Co-Passengers (${passengers.length}/${ride.totalSeats}):
        </h4>
        ${passengers.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${passengers.map(p => `
              <div style="background: var(--bg-main); border: 1px solid var(--border-color); color: var(--text-main); padding: 8px 12px; border-radius: 6px; font-size: 0.85rem; display: flex; justify-content: space-between;">
                <span>👤 <strong>${p.riderName}</strong> (${p.riderDept})</span>
                <span class="badge badge-green">${p.seatsRequested} Seat(s) Booked</span>
              </div>
            `).join('')}
          </div>
        ` : `
          <p style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">No other students have joined yet. Be the first!</p>
        `}
      </div>
    `;

    footer.innerHTML = `
      <button class="btn btn-secondary" onclick="closeDetailsModal()">Close</button>
      ${ride.availableSeats > 0 ? `
        <button class="btn btn-primary" onclick="closeDetailsModal(); openRequestModal('${ride._id}')">
          Request to Join Ride
        </button>
      ` : `
        <button class="btn btn-secondary" disabled>Ride is Full</button>
      `}
    `;

    document.getElementById('details-modal').classList.add('active');
  } catch (err) {
    showToast('Failed to load ride details', 'error');
  }
}

function closeDetailsModal() {
  document.getElementById('details-modal').classList.remove('active');
}
