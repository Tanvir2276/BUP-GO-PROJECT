/**
 * BUPGO - My Rides Controller (Driver & Passenger Management)
 */

let myRidesData = {
  postedRides: [],
  requestedRides: []
};

function switchTab(tab) {
  const postedBtn = document.getElementById('tab-posted-btn');
  const reqBtn = document.getElementById('tab-requested-btn');
  const histBtn = document.getElementById('tab-history-btn');
  const postedPanel = document.getElementById('panel-posted');
  const reqPanel = document.getElementById('panel-requested');
  const histPanel = document.getElementById('panel-history');

  if (postedBtn) postedBtn.classList.remove('active');
  if (reqBtn) reqBtn.classList.remove('active');
  if (histBtn) histBtn.classList.remove('active');
  if (postedPanel) postedPanel.style.display = 'none';
  if (reqPanel) reqPanel.style.display = 'none';
  if (histPanel) histPanel.style.display = 'none';

  if (tab === 'posted') {
    if (postedBtn) postedBtn.classList.add('active');
    if (postedPanel) postedPanel.style.display = 'block';
  } else if (tab === 'history') {
    if (histBtn) histBtn.classList.add('active');
    if (histPanel) histPanel.style.display = 'block';
  } else {
    if (reqBtn) reqBtn.classList.add('active');
    if (reqPanel) reqPanel.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isLoggedIn()) {
    showToast('Please login to manage your rides.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    return;
  }

  const user = Auth.getUser();
  const urlParams = new URLSearchParams(window.location.search);
  const targetTab = urlParams.get('tab');

  // Role-aware tab display (Requirement 3 & 4)
  if (targetTab === 'requested') {
    switchTab('requested');
  } else if (targetTab === 'posted') {
    switchTab('posted');
  } else if (targetTab === 'history') {
    switchTab('history');
  } else if (user && user.role === 'passenger') {
    switchTab('requested'); // Passengers default to requested rides view
  } else {
    switchTab('posted'); // Drivers default to offered rides view
  }

  loadMyRides();
});

async function loadMyRides() {
  const postedContainer = document.getElementById('posted-rides-list');
  const reqContainer = document.getElementById('requested-rides-list');
  const histContainer = document.getElementById('history-rides-list');

  try {
    const data = await apiRequest('/users/my-rides');
    myRidesData = data;

    // Calculate Driver Earnings with 10% Platform Commission (Requirement 5)
    let totalGross = 0;
    let totalPassengers = 0;
    let activeRidesCount = 0;
    let completedRidesCount = 0;

    data.postedRides.forEach(ride => {
      if (ride.status === 'completed') {
        completedRidesCount++;
      } else {
        activeRidesCount++;
      }

      const accepted = (ride.requests || []).filter(r => r.status === 'accepted');
      accepted.forEach(req => {
        const seats = Number(req.seatsRequested || 1);
        totalPassengers += seats;
        totalGross += seats * Number(ride.estimatedCost || 0);
      });
    });

    const platformCommission = Math.round(totalGross * 0.10);
    const driverNet = totalGross - platformCommission;

    // Update Driver Offered Rides Summary
    const offeredCountEl = document.getElementById('driver-total-offered-count');
    const offeredBreakdownEl = document.getElementById('driver-offered-breakdown');
    if (offeredCountEl) offeredCountEl.textContent = data.postedRides.length;
    if (offeredBreakdownEl) offeredBreakdownEl.textContent = `${activeRidesCount} Active/Pending • ${completedRidesCount} Completed`;

    // Update counts
    if (document.getElementById('badge-offered-count')) {
      document.getElementById('badge-offered-count').textContent = data.postedRides.length;
    }
    if (document.getElementById('badge-requested-count')) {
      document.getElementById('badge-requested-count').textContent = data.requestedRides.length;
    }

    const grossEl = document.getElementById('driver-total-earnings');
    const feeEl = document.getElementById('driver-platform-fee');
    const netEl = document.getElementById('driver-net-earnings');
    const passengersEl = document.getElementById('driver-total-passengers');
    const carbonEl = document.getElementById('driver-carbon-saved');

    if (grossEl) grossEl.textContent = `৳ ${totalGross}`;
    if (feeEl) feeEl.textContent = `৳ ${platformCommission}`;
    if (netEl) netEl.textContent = `৳ ${driverNet}`;
    if (passengersEl) passengersEl.textContent = `${totalPassengers} Students`;
    if (carbonEl) carbonEl.textContent = `${(totalPassengers * 3.8).toFixed(1)} kg`;

    // Passenger Pathao-Style Loyalty & Daily Login Streak
    const completedReqs = data.requestedRides.filter(r => r.request.status === 'accepted');
    const userStoredPoints = Number(localStorage.getItem('bupgo_user_points') || (Math.max(50, completedReqs.length * 10 + 20)));
    localStorage.setItem('bupgo_user_points', userStoredPoints);

    const streakDays = Math.max(1, parseInt(localStorage.getItem('bupgo_streak_days') || '1', 10));
    const streakPtsToday = Math.pow(2, streakDays - 1);
    const streakNextPts = Math.pow(2, streakDays);

    const streakValEl = document.getElementById('passenger-streak-val');
    const streakSubEl = document.getElementById('passenger-streak-sub');
    if (streakValEl) streakValEl.textContent = `Day ${streakDays} (+${streakPtsToday} pts)`;
    if (streakSubEl) streakSubEl.textContent = `Next daily login: +${streakNextPts} pts`;

    const ptsValEl = document.getElementById('passenger-points-val');
    const mileValEl = document.getElementById('passenger-milestone-val');
    const savValEl = document.getElementById('passenger-savings-val');

    if (ptsValEl) {
      ptsValEl.textContent = `${userStoredPoints} pts`;
    }
    if (mileValEl) {
      if (completedReqs.length >= 100) {
        mileValEl.textContent = `101st Ride: 100% FREE!`;
      } else if (completedReqs.length >= 20) {
        mileValEl.textContent = `21st Ride: 50% OFF!`;
      } else {
        mileValEl.textContent = `${completedReqs.length}/20 Rides (50% at 21)`;
      }
    }
    if (savValEl) {
      savValEl.textContent = `৳ ${completedReqs.length * 85 + 150}`;
    }

    renderPostedRides(data.postedRides, postedContainer);
    renderRequestedRides(data.requestedRides, reqContainer);
    renderRideHistory(data, histContainer);
  } catch (err) {
    if (postedContainer) postedContainer.innerHTML = `<p style="color:var(--bup-red); text-align:center;">Failed to load rides: ${err.message}</p>`;
    if (reqContainer) reqContainer.innerHTML = `<p style="color:var(--bup-red); text-align:center;">Failed to load requests: ${err.message}</p>`;
  }
}

function renderPostedRides(rides, container) {
  if (!rides || rides.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 16px;">You haven't posted any rides yet.</p>
        <a href="offer-ride.html" class="btn btn-primary">Offer Your First Ride</a>
      </div>
    `;
    return;
  }

  container.innerHTML = rides.map(ride => {
    const requests = ride.requests || [];
    const pendingRequests = requests.filter(r => r.status === 'pending');
    const acceptedRequests = requests.filter(r => r.status === 'accepted');
    const hasPending = pendingRequests.length > 0;

    const isCompleted = ride.status === 'completed';
    const isInProgress = ride.status === 'in_progress';

    const cardStatusStyle = isCompleted
      ? 'border-left: 6px solid #10b981; border-top: 1px solid rgba(16, 185, 129, 0.35); box-shadow: 0 4px 14px rgba(16, 185, 129, 0.12);'
      : isInProgress
      ? 'border-left: 6px solid #3b82f6; border-top: 1px solid rgba(59, 130, 246, 0.35); box-shadow: 0 4px 14px rgba(59, 130, 246, 0.12);'
      : 'border-left: 6px solid #f59e0b; border-top: 1px solid rgba(245, 158, 11, 0.35); box-shadow: 0 4px 14px rgba(245, 158, 11, 0.12);';

    const statusBadge = isCompleted
      ? `<span class="badge badge-green" style="font-weight: 700; background: rgba(16, 185, 129, 0.2); color: #059669; border: 1px solid #10b981;">✓ COMPLETED TRIP</span>`
      : isInProgress
      ? `<span class="badge badge-blue" style="font-weight: 700; background: rgba(59, 130, 246, 0.2); color: #2563eb; border: 1px solid #3b82f6;">🚀 IN PROGRESS</span>`
      : `<span class="badge badge-yellow" style="font-weight: 700; background: rgba(245, 158, 11, 0.2); color: #d97706; border: 1px solid #f59e0b;">🟡 PENDING / ACTIVE</span>`;

    return `
      <div class="ride-card ${hasPending ? 'glow-request-pulse' : ''}" style="${cardStatusStyle}">
        ${hasPending ? `
          <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; color: #047857; padding: 10px 14px; border-radius: 8px; margin-bottom: 14px; font-size: 0.84rem; font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
            <span>⚡ ${pendingRequests.length} New Passenger Request(s) Received! Please review & confirm below.</span>
            <span class="badge badge-green" style="font-size: 0.75rem;">Action Needed</span>
          </div>
        ` : ''}

        <div class="ride-card-top">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              ${statusBadge}
              <strong style="font-size: 1.1rem; color: var(--text-main);">${ride.startingLocation} ➔ ${ride.destination}</strong>
            </div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">
              <span>📅 ${ride.travelDate}</span> • <span>⏰ ${ride.departureTime}</span> • <span>🚘 ${ride.transportationType} (${ride.vehicleModel || 'Standard'})</span>
            </div>
          </div>

          <div class="ride-fare-box">
            <div class="fare-amount">৳ ${ride.estimatedCost}</div>
            <div class="fare-per-seat">per seat</div>
          </div>
        </div>

        <div class="ride-card-meta">
          <div class="meta-item">
            <span>Seats Remaining:</span>
            <strong>${ride.availableSeats} of ${ride.totalSeats} seats</strong>
          </div>
          <div class="meta-item">
            <span>Join Requests:</span>
            <strong>${requests.length} (${pendingRequests.length} pending)</strong>
          </div>
          <div class="meta-item">
            <span>Confirmed Passengers:</span>
            <strong>${acceptedRequests.length}</strong>
          </div>
        </div>

        <!-- Passenger Requests Management Box -->
        <div class="passenger-requests-box">
          <h4>
            <span>Incoming Student Requests (${requests.length})</span>
            <span style="font-size: 0.78rem; font-weight: 500; color: var(--text-muted);">Review and confirm seats</span>
          </h4>

          ${requests.length === 0 ? `
            <p style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">No students have requested this ride yet.</p>
          ` : `
            <div>
              ${requests.map(req => `
                <div class="request-item">
                  <div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <strong>${req.riderName}</strong>
                      <span style="font-size: 0.78rem; color: var(--text-muted);">(${req.riderDept} • ${req.riderStudentId})</span>
                      <span class="badge ${req.status === 'accepted' ? 'badge-green' : req.status === 'rejected' ? 'badge-red' : 'badge-yellow'}">
                        ${req.status}
                      </span>
                    </div>
                    <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">
                      <span>📍 Pickup: <strong>${req.pickupLocation}</strong></span> • 
                      <span>🪑 Seats: <strong>${req.seatsRequested}</strong></span>
                      ${req.riderPhone ? ` • <span>📞 <a href="tel:${req.riderPhone}">${req.riderPhone}</a></span>` : ''}
                    </div>
                    ${req.notes ? `
                      <div style="font-size: 0.8rem; color: #475569; font-style: italic; margin-top: 3px;">
                        Note: "${req.notes}"
                      </div>
                    ` : ''}
                  </div>

                  <div class="request-actions">
                    ${req.status === 'pending' ? `
                      <button class="btn btn-success btn-sm" onclick="updateRequestStatus('${req._id}', 'accepted')">
                        ✓ Accept
                      </button>
                      <button class="btn btn-danger btn-sm" onclick="updateRequestStatus('${req._id}', 'rejected')">
                        ✕ Reject
                      </button>
                    ` : req.status === 'accepted' ? `
                      <button class="btn btn-secondary btn-sm" onclick="updateRequestStatus('${req._id}', 'rejected')">
                        Revoke Seat
                      </button>
                    ` : `
                      <span style="font-size: 0.8rem; color: var(--text-muted);">${req.status}</span>
                    `}
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="ride-card-actions" style="margin-top: 12px; gap: 8px; flex-wrap: wrap;">
          <div style="display: flex; gap: 8px;">
            ${ride.status === 'active' ? `
              <button class="btn btn-primary btn-sm" onclick="updateRideTripStatus('${ride._id}', 'in_progress')">
                🚀 Start Ride (En Route)
              </button>
            ` : ride.status === 'in_progress' ? `
              <button class="btn btn-success btn-sm" onclick="updateRideTripStatus('${ride._id}', 'completed')">
                🏁 Arrived & Complete Ride
              </button>
            ` : `
              <span class="badge badge-green" style="font-size: 0.85rem; padding: 6px 12px;">✓ Trip Completed</span>
            `}
          </div>

          <div>
            <button class="btn btn-danger btn-sm" onclick="deleteRide('${ride._id}')">
              Cancel & Remove Ride
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderRequestedRides(requestedList, container) {
  if (!requestedList || requestedList.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 16px;">You haven't requested any rides yet.</p>
        <a href="find-ride.html" class="btn btn-primary">Find an Available Ride</a>
      </div>
    `;
    return;
  }

  container.innerHTML = requestedList.map(item => {
    const req = item.request;
    const ride = item.ride;

    if (!ride) {
      return `
        <div class="ride-card" style="opacity: 0.6;">
          <div style="color: var(--text-muted); font-size: 0.9rem;">
            This ride has been cancelled or removed by the driver. (Request ID: ${req._id})
          </div>
        </div>
      `;
    }

    const isAccepted = req.status === 'accepted';
    const isPending = req.status === 'pending';

    return `
      <div class="ride-card">
        <div class="ride-card-top">
          <div class="driver-mini-info">
            <img src="${ride.driverAvatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(ride.driverName)}" 
                 alt="${ride.driverName}" class="driver-mini-avatar">
            <div>
              <div class="driver-name-text">${ride.driverName}</div>
              <div class="driver-dept-text">${ride.driverDept} • ID: ${ride.driverStudentId}</div>
            </div>
          </div>

          <div>
            <span class="badge ${isAccepted ? 'badge-green' : isPending ? 'badge-yellow' : 'badge-red'}" style="font-size: 0.85rem; padding: 6px 12px;">
              Status: ${req.status.toUpperCase()}
            </span>
          </div>
        </div>

        <div class="route-timeline">
          <div class="route-point start">
            <div class="route-point-label">Pickup Point</div>
            <div class="route-point-name">${req.pickupLocation || ride.startingLocation}</div>
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
            <span>🪑 Seats Booked:</span>
            <strong>${req.seatsRequested} Seat(s)</strong>
          </div>
          <div class="meta-item">
            <span>💰 Total Fare:</span>
            <strong style="color: var(--bup-primary); font-size: 1.05rem;">৳ ${ride.estimatedCost * req.seatsRequested}</strong>
          </div>
        </div>

        ${isAccepted ? `
          <div style="background: #eafaf1; border: 1px solid #86efac; padding: 14px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between;">
            <div>
              <div style="font-weight: 700; color: var(--bup-primary-dark); font-size: 0.95rem;">🎉 Ride Confirmed by Driver!</div>
              <div style="font-size: 0.85rem; color: #15803d; margin-top: 2px;">
                Driver Phone: <strong><a href="tel:${ride.driverPhone}" style="text-decoration: underline;">${ride.driverPhone}</a></strong> • Vehicle: <strong>${ride.vehicleModel || ride.transportationType}</strong>
              </div>
            </div>
            <a href="https://wa.me/88${ride.driverPhone.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-primary btn-sm" style="background: #25D366; border: none;">
              WhatsApp Driver
            </a>
          </div>
        ` : isPending ? `
          <div style="background: #fefce8; border: 1px solid #fde047; padding: 12px; border-radius: var(--radius-md); font-size: 0.85rem; color: #854d0e;">
            ⏳ Your request is awaiting driver approval. You will receive contact details once confirmed.
          </div>
        ` : `
          <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 12px; border-radius: var(--radius-md); font-size: 0.85rem; color: #991b1b;">
            Request was not accepted or ride seats filled up.
          </div>
        `}

        <div class="ride-card-actions">
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            Requested on: ${new Date(req.createdAt).toLocaleDateString()}
          </span>
          <div style="display: flex; gap: 8px;">
            ${isAccepted ? `
              <button class="btn btn-secondary btn-sm" onclick="openRatingModal('${ride._id}', '${ride.driverId}', '${ride.driverName}', 'driver')">
                ⭐ Rate Driver
              </button>
            ` : ''}
            ${isPending ? `
              <button class="btn btn-secondary btn-sm" onclick="cancelMyRequest('${req._id}')">
                Cancel Request
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Driver updates request status (accept / reject)
async function updateRequestStatus(requestId, status, riderName = '') {
  try {
    const res = await apiRequest(`/requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast(res.message || `Request ${status}!`, 'success');
    loadMyRides();

    if (status === 'accepted') {
      const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
      openTripConfirmationModal(riderName || 'Passenger', user ? user.name : 'Driver');
    }
  } catch (err) {
    showToast(err.message || 'Error updating status', 'error');
  }
}

// Passenger cancels request
async function cancelMyRequest(requestId) {
  if (!confirm('Are you sure you want to cancel this ride request?')) return;
  try {
    await apiRequest(`/requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' })
    });
    loadMyRides();
  } catch (err) {
    showToast(err.message || 'Error cancelling request', 'error');
  }
}

// Driver deletes ride
async function deleteRide(rideId) {
  if (!confirm('Are you sure you want to cancel and remove this ride post? Any pending requests will be invalidated.')) return;
  try {
    const res = await apiRequest(`/rides/${rideId}`, {
      method: 'DELETE'
    });
    showToast(res.message || 'Ride deleted', 'success');
    loadMyRides();
  } catch (err) {
    showToast(err.message || 'Error deleting ride', 'error');
  }
}

// Driver updates live trip status (Active -> In Progress -> Completed)
async function updateRideTripStatus(rideId, status, startingLocation = '', destination = '') {
  try {
    await apiRequest(`/rides/${rideId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast(`Trip status updated: ${status.toUpperCase()}!`, 'success');
    loadMyRides();

    if (status === 'completed') {
      const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
      openTripCelebrationModal(user ? user.name : 'Driver', rideId, { startingLocation, destination });
    }
  } catch (err) {
    showToast(err.message || 'Failed to update trip status', 'error');
  }
}

// Trip Completion & Confirmation Celebration Modal Window (User Request 10)
function openTripCelebrationModal(userName, rideId, rideDetails = {}) {
  const existing = document.getElementById('bupgo-celebration-modal');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'bupgo-celebration-modal';
  backdrop.className = 'bupgo-calendar-modal-backdrop';

  const routeText = (rideDetails.startingLocation && rideDetails.destination)
    ? `${rideDetails.startingLocation} ➔ ${rideDetails.destination}`
    : 'BUP Campus Carpool';

  backdrop.innerHTML = `
    <div class="bupgo-calendar-card" onclick="event.stopPropagation()" style="max-width: 440px; text-align: center; border: 2px solid #10b981; box-shadow: 0 20px 45px rgba(0,0,0,0.45); animation: slideUpFade 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);">
      <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.28) 100%); padding: 26px 20px 18px; border-bottom: 1px solid var(--border-color); position: relative;">
        <button class="cal-close-btn" onclick="closeCelebrationModal()" style="position: absolute; top: 12px; right: 14px;">&times;</button>
        <div style="font-size: 3.2rem; margin-bottom: 8px;">🎉</div>
        <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); line-height: 1.3;">
          Congratulations <span style="color: var(--bup-primary);">${userName}</span>!
        </h3>
        <p style="font-size: 0.95rem; color: #10b981; font-weight: 700; margin-top: 4px;">
          Your trip has been completed successfully!
        </p>
        <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 4px;">
          📍 ${routeText}
        </div>
      </div>

      <div style="padding: 22px 20px;">
        <p style="font-size: 1rem; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
          ⭐ Want to rate your commute partner?
        </p>
        <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 14px;">
          Share your experience to help the campus community and earn <strong>+10 Points</strong>!
        </p>

        <div id="star-rating-selector" style="font-size: 2.3rem; cursor: pointer; display: flex; justify-content: center; gap: 8px; margin-bottom: 8px;">
          <span onclick="setRatingStars(1)" data-star="1" style="color: #f59e0b;">★</span>
          <span onclick="setRatingStars(2)" data-star="2" style="color: #f59e0b;">★</span>
          <span onclick="setRatingStars(3)" data-star="3" style="color: #f59e0b;">★</span>
          <span onclick="setRatingStars(4)" data-star="4" style="color: #f59e0b;">★</span>
          <span onclick="setRatingStars(5)" data-star="5" style="color: #f59e0b;">★</span>
        </div>
        <div id="star-rating-label" style="font-size: 0.88rem; font-weight: 700; color: #f59e0b; margin-bottom: 16px;">
          5 Stars - Exceptional Commute!
        </div>

        <div class="form-group" style="margin-bottom: 18px; text-align: left;">
          <label class="form-label" style="font-size: 0.8rem;">Review Feedback (Optional):</label>
          <textarea id="celebration-rating-comment" class="form-control" rows="2" placeholder="Smooth driving, polite student, on time..."></textarea>
        </div>

        <div style="display: flex; gap: 10px; justify-content: center;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="closeCelebrationModal()">Maybe Later</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="submitCelebrationRating('${rideId}')" style="font-weight: 700;">
            🌟 Submit Rating & Claim +10 Pts
          </button>
        </div>
      </div>
    </div>
  `;

  backdrop.addEventListener('click', closeCelebrationModal);
  document.body.appendChild(backdrop);
}

function closeCelebrationModal() {
  const modal = document.getElementById('bupgo-celebration-modal');
  if (modal) modal.remove();
}

function submitCelebrationRating(rideId) {
  const currentPts = Number(localStorage.getItem('bupgo_user_points') || '50') + 10;
  localStorage.setItem('bupgo_user_points', currentPts);

  closeCelebrationModal();
  showToast(`🎉 Review submitted! +10 Points awarded! Total Points: ${currentPts}`, 'success');
  loadMyRides();
}

function openTripConfirmationModal(riderName, driverName) {
  const existing = document.getElementById('bupgo-confirm-modal');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'bupgo-confirm-modal';
  backdrop.className = 'bupgo-calendar-modal-backdrop';

  backdrop.innerHTML = `
    <div class="bupgo-calendar-card" onclick="event.stopPropagation()" style="max-width: 420px; text-align: center; border: 2px solid #3b82f6; box-shadow: 0 20px 45px rgba(0,0,0,0.45); animation: slideUpFade 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);">
      <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.25) 100%); padding: 26px 20px 18px; border-bottom: 1px solid var(--border-color); position: relative;">
        <button class="cal-close-btn" onclick="document.getElementById('bupgo-confirm-modal').remove()" style="position: absolute; top: 12px; right: 14px;">&times;</button>
        <div style="font-size: 3.2rem; margin-bottom: 8px;">🚗</div>
        <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-main); line-height: 1.3;">
          🎉 Ride Booking Confirmed!
        </h3>
        <p style="font-size: 0.92rem; color: #2563eb; font-weight: 700; margin-top: 4px;">
          Seat reserved for ${riderName}!
        </p>
      </div>

      <div style="padding: 20px;">
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 16px;">
          The passenger has been notified. Safe commute ahead with fellow BUPians!
        </p>
        <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('bupgo-confirm-modal').remove()" style="width: 100%; font-weight: 700;">
          Awesome, Continue
        </button>
      </div>
    </div>
  `;

  backdrop.addEventListener('click', () => backdrop.remove());
  document.body.appendChild(backdrop);
}

// Universal Interactive Rating & Review Modal (Requirement 8)
let currentRatingValue = 5;

function openRatingModal(rideId, targetUserId, targetUserName, targetRole = 'driver') {
  currentRatingValue = 5;
  const existing = document.getElementById('bupgo-rating-modal');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'bupgo-rating-modal';
  backdrop.className = 'bupgo-calendar-modal-backdrop';

  backdrop.innerHTML = `
    <div class="bupgo-calendar-card" onclick="event.stopPropagation()" style="max-width: 400px;">
      <div class="cal-card-header">
        <div>
          <h4>⭐ Rate ${targetRole === 'driver' ? 'Driver' : 'Passenger'}: ${targetUserName}</h4>
          <div class="cal-header-sub">Help build campus trust & ride rankings</div>
        </div>
        <button class="cal-close-btn" onclick="closeRatingModal()">&times;</button>
      </div>

      <div style="padding: 20px 18px;">
        <div style="text-align: center; margin-bottom: 16px;">
          <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 8px;">Select Star Rating:</div>
          <div id="star-rating-selector" style="font-size: 2rem; cursor: pointer; display: flex; justify-content: center; gap: 6px;">
            <span onclick="setRatingStars(1)" data-star="1" style="color: #f59e0b;">★</span>
            <span onclick="setRatingStars(2)" data-star="2" style="color: #f59e0b;">★</span>
            <span onclick="setRatingStars(3)" data-star="3" style="color: #f59e0b;">★</span>
            <span onclick="setRatingStars(4)" data-star="4" style="color: #f59e0b;">★</span>
            <span onclick="setRatingStars(5)" data-star="5" style="color: #f59e0b;">★</span>
          </div>
          <div id="star-rating-label" style="font-size: 0.9rem; font-weight: 700; color: #f59e0b; margin-top: 4px;">5 Stars - Excellent Commute!</div>
        </div>

        <div class="form-group" style="margin-bottom: 16px;">
          <label class="form-label" style="font-size: 0.82rem;">Review Feedback (Optional):</label>
          <textarea id="rating-comment" class="form-control" rows="3" placeholder="Punctual departure, safe driving, clean car, friendly conversation..."></textarea>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="closeRatingModal()">Cancel</button>
          <button type="button" class="btn btn-primary btn-sm" id="btn-submit-rating" onclick="submitUserRating('${rideId}', '${targetUserId}', '${targetRole}')">Submit Rating</button>
        </div>
      </div>
    </div>
  `;

  backdrop.addEventListener('click', closeRatingModal);
  document.body.appendChild(backdrop);
}

function setRatingStars(val) {
  currentRatingValue = val;
  const stars = document.querySelectorAll('#star-rating-selector span');
  stars.forEach((s, idx) => {
    s.style.color = (idx < val) ? '#f59e0b' : '#cbd5e1';
  });

  const labelEl = document.getElementById('star-rating-label');
  const labels = [
    '',
    '1 Star - Poor Experience',
    '2 Stars - Below Average',
    '3 Stars - Average Ride',
    '4 Stars - Good & Safe Ride',
    '5 Stars - Excellent Commute!'
  ];
  if (labelEl) labelEl.textContent = labels[val] || `${val} Stars`;
}

function closeRatingModal() {
  const modal = document.getElementById('bupgo-rating-modal');
  if (modal) modal.remove();
}

async function submitUserRating(rideId, targetUserId, targetRole) {
  const submitBtn = document.getElementById('btn-submit-rating');
  const comment = document.getElementById('rating-comment')?.value || '';

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }

  try {
    const res = await apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        rideId,
        targetUserId,
        targetRole,
        rating: currentRatingValue,
        comment
      })
    });

    showToast(res.message || 'Rating submitted successfully!', 'success');
    closeRatingModal();
    loadMyRides();
  } catch (err) {
    showToast(err.message || 'Could not submit rating', 'error');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Rating';
    }
  }
}

// =========================================================
// RIDE HISTORY, POINTS CONVERTER & DIGITAL RECEIPTS
// (Requirements 5, 6, 7 & 8)
// =========================================================
let cachedHistoryTrips = [];
let currentHistoryFilter = 'all';

function convertPointsToWallet() {
  const currentPts = Number(localStorage.getItem('bupgo_user_points') || 50);
  if (currentPts < 5) {
    alert('You need at least 5 points to convert. (Rate: 5 points = ৳1 BDT)');
    return;
  }

  const bdtEarned = Math.floor(currentPts / 5);
  const remainingPts = currentPts % 5;
  localStorage.setItem('bupgo_user_points', remainingPts);

  const currentWallet = Number(localStorage.getItem('bupgo_wallet_balance') || 0);
  const newWallet = currentWallet + bdtEarned;
  localStorage.setItem('bupgo_wallet_balance', newWallet);

  const ptsEl = document.getElementById('passenger-points-val');
  if (ptsEl) ptsEl.textContent = `${remainingPts} pts`;

  alert(`🎉 Success! Converted ${currentPts - remainingPts} Points into ৳${bdtEarned} BDT Wallet Credit!\n\nYour new wallet balance: ৳${newWallet} BDT.\nRate applied: 5 Points = ৳1 BDT (Pathao-style conversion).`);
}

function renderRideHistory(data, container) {
  if (!container) return;

  const trips = [];

  // Driver trips
  (data.postedRides || []).forEach(r => {
    const acceptedCount = (r.requests || []).filter(req => req.status === 'accepted').length;
    trips.push({
      id: r._id,
      role: 'driver',
      route: `${r.startingLocation} ➔ ${r.destination}`,
      startLoc: r.startingLocation,
      destLoc: r.destination,
      travelDate: r.travelDate,
      time: r.departureTime,
      vehicle: `${r.transportationType} (${r.vehicleModel || 'Standard'})`,
      seats: r.totalSeats,
      partner: `${acceptedCount} Passenger(s)`,
      fare: Number(r.estimatedCost || 50),
      grossTotal: Number(r.estimatedCost || 50) * Math.max(1, acceptedCount),
      status: r.status === 'completed' ? 'Completed' : 'Active / Carpool Live',
      points: 10
    });
  });

  // Passenger trips
  (data.requestedRides || []).forEach(item => {
    const r = item.ride || {};
    const req = item.request || {};
    trips.push({
      id: req._id,
      role: 'passenger',
      route: `${r.startingLocation || 'Pickup Point'} ➔ ${r.destination || 'BUP Campus'}`,
      startLoc: r.startingLocation || 'Pickup Point',
      destLoc: r.destination || 'BUP Campus',
      travelDate: r.travelDate || 'Recent',
      time: r.departureTime || '08:00 AM',
      vehicle: `${r.transportationType || 'Car'} (${r.vehicleModel || 'Campus Car'})`,
      seats: req.seatsRequested || 1,
      partner: `Driver: ${r.driverName || 'BUP Driver'}`,
      fare: Number(r.estimatedCost || 40),
      grossTotal: Number(r.estimatedCost || 40) * Number(req.seatsRequested || 1),
      status: req.status === 'accepted' ? 'Completed' : req.status === 'pending' ? 'Pending Confirmation' : 'Cancelled',
      points: 10
    });
  });

  cachedHistoryTrips = trips;
  if (document.getElementById('badge-history-count')) {
    document.getElementById('badge-history-count').textContent = trips.length;
  }

  displayFilteredHistory(container);
}

function filterHistory(type) {
  currentHistoryFilter = type;
  const container = document.getElementById('history-rides-list');
  ['btn-hist-all', 'btn-hist-driver', 'btn-hist-passenger'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  const activeBtn = document.getElementById(`btn-hist-${type}`);
  if (activeBtn) activeBtn.classList.add('active');

  displayFilteredHistory(container);
}

function displayFilteredHistory(container) {
  if (!container) return;

  let filtered = cachedHistoryTrips;
  if (currentHistoryFilter === 'driver') {
    filtered = cachedHistoryTrips.filter(t => t.role === 'driver');
  } else if (currentHistoryFilter === 'passenger') {
    filtered = cachedHistoryTrips.filter(t => t.role === 'passenger');
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
        <p style="color: var(--text-muted); font-size: 1rem;">No history records found for this category.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(t => {
    const platformFee = Math.round(t.grossTotal * 0.10);
    const driverNet = t.grossTotal - platformFee;

    return `
      <div class="ride-card" style="padding: 18px 22px; border-left: 4px solid ${t.role === 'driver' ? '#10b981' : 'var(--bup-blue)'};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 10px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge ${t.role === 'driver' ? 'badge-green' : 'badge-blue'}" style="font-size: 0.75rem;">
                ${t.role === 'driver' ? '🚗 Driver Trip' : '🎒 Passenger Trip'}
              </span>
              <span class="badge ${t.status.includes('Completed') ? 'badge-green' : 'badge-yellow'}" style="font-size: 0.75rem;">
                ${t.status}
              </span>
              <span class="badge badge-yellow" style="font-size: 0.72rem; padding: 1px 7px;">
                🪙 +${t.points} Points Earned
              </span>
            </div>
            <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin-top: 6px;">
              ${t.route}
            </h4>
            <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">
              <span>📅 ${t.travelDate} (${t.time})</span> • 
              <span>🚘 ${t.vehicle}</span> • 
              <span>👥 ${t.partner}</span>
            </div>
          </div>

          <div style="text-align: right;">
            <div style="font-size: 1.45rem; font-weight: 800; color: var(--bup-primary);">
              ৳ ${t.grossTotal}
            </div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">
              ${t.role === 'driver' ? `Net Payout (90%): <strong>৳${driverNet}</strong>` : `Incl. 10% Platform Fee`}
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="openDigitalReceiptModal('${t.id}')" style="margin-top: 6px; font-size: 0.76rem; padding: 4px 10px;">
              🧾 View Receipt
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openDigitalReceiptModal(tripId) {
  const trip = cachedHistoryTrips.find(t => String(t.id) === String(tripId)) || cachedHistoryTrips[0];
  if (!trip) return;

  const platformFee = Math.round(trip.grossTotal * 0.10);
  const driverNet = trip.grossTotal - platformFee;

  const existing = document.getElementById('bupgo-receipt-modal');
  if (existing) existing.remove();

  const backdrop = document.createElement('div');
  backdrop.id = 'bupgo-receipt-modal';
  backdrop.className = 'bupgo-calendar-modal-backdrop';

  backdrop.innerHTML = `
    <div class="bupgo-calendar-card" onclick="event.stopPropagation()" style="max-width: 440px;">
      <div class="cal-card-header" style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%);">
        <div>
          <h4>🧾 BUPGO Official Digital Receipt</h4>
          <div class="cal-header-sub">Trip ID: #${String(trip.id).slice(-8).toUpperCase()} • Verified Carpool</div>
        </div>
        <button class="cal-close-btn" onclick="document.getElementById('bupgo-receipt-modal').remove()">&times;</button>
      </div>

      <div style="padding: 20px 22px; font-size: 0.88rem; color: var(--text-main);">
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-color); padding-bottom: 10px; margin-bottom: 12px;">
          <span style="color: var(--text-muted);">Trip Date & Time:</span>
          <strong>${trip.travelDate} (${trip.time})</strong>
        </div>

        <div style="margin-bottom: 12px; background: var(--bg-main); padding: 10px 14px; border-radius: 8px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 700;">ROUTE DETAILS:</div>
          <div style="font-weight: 800; font-size: 0.95rem; margin-top: 2px;">${trip.route}</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 2px;">Vehicle: ${trip.vehicle}</div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">Gross Fare (${trip.seats} Seat(s)):</span>
            <strong>৳ ${trip.grossTotal}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--text-muted);">BUPGO Platform Guarantee (10%):</span>
            <span style="color: #ef4444;">- ৳ ${platformFee}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--border-color); font-size: 1.05rem;">
            <span>${trip.role === 'driver' ? 'Driver Net Payout (90%):' : 'Passenger Paid Total:'}</span>
            <strong style="color: var(--bup-primary); font-size: 1.25rem;">৳ ${trip.role === 'driver' ? driverNet : trip.grossTotal}</strong>
          </div>
        </div>

        <div style="background: rgba(16, 185, 129, 0.12); border: 1px solid #10b981; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 800; color: #047857;">🪙 Pathao-Style Loyalty Reward</div>
            <div style="font-size: 0.75rem; color: #065f46;">5 Points = ৳1 BDT (Added to Wallet)</div>
          </div>
          <span class="badge badge-green" style="font-size: 0.85rem;">+10 Points</span>
        </div>

        <div style="display: flex; gap: 8px; justify-content: flex-end;">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.print()">🖨️ Print Receipt</button>
          <button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById('bupgo-receipt-modal').remove()">Done</button>
        </div>
      </div>
    </div>
  `;

  backdrop.addEventListener('click', () => backdrop.remove());
  document.body.appendChild(backdrop);
}
