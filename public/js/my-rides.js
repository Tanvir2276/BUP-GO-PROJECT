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
  const postedPanel = document.getElementById('panel-posted');
  const reqPanel = document.getElementById('panel-requested');

  if (tab === 'posted') {
    postedBtn.classList.add('active');
    reqBtn.classList.remove('active');
    postedPanel.style.display = 'block';
    reqPanel.style.display = 'none';
  } else {
    reqBtn.classList.add('active');
    postedBtn.classList.remove('active');
    reqPanel.style.display = 'block';
    postedPanel.style.display = 'none';
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

  loadMyRides();
});

async function loadMyRides() {
  const postedContainer = document.getElementById('posted-rides-list');
  const reqContainer = document.getElementById('requested-rides-list');

  try {
    const data = await apiRequest('/users/my-rides');
    myRidesData = data;

    // Update counts
    document.getElementById('badge-offered-count').textContent = data.postedRides.length;
    document.getElementById('badge-requested-count').textContent = data.requestedRides.length;

    // Calculate Driver Earnings & Metric Stats (Pathao / Uber Inspired)
    let totalEarnings = 0;
    let totalPassengers = 0;

    data.postedRides.forEach(ride => {
      const accepted = (ride.requests || []).filter(r => r.status === 'accepted');
      accepted.forEach(req => {
        const seats = Number(req.seatsRequested || 1);
        totalPassengers += seats;
        totalEarnings += seats * Number(ride.estimatedCost || 0);
      });
    });

    const earningsEl = document.getElementById('driver-total-earnings');
    const passengersEl = document.getElementById('driver-total-passengers');
    const carbonEl = document.getElementById('driver-carbon-saved');

    if (earningsEl) earningsEl.textContent = `৳ ${totalEarnings}`;
    if (passengersEl) passengersEl.textContent = `${totalPassengers} Students`;
    if (carbonEl) carbonEl.textContent = `${(totalPassengers * 3.8).toFixed(1)} kg`;

    renderPostedRides(data.postedRides, postedContainer);
    renderRequestedRides(data.requestedRides, reqContainer);
  } catch (err) {
    postedContainer.innerHTML = `<p style="color:var(--bup-red); text-align:center;">Failed to load rides: ${err.message}</p>`;
    reqContainer.innerHTML = `<p style="color:var(--bup-red); text-align:center;">Failed to load requests: ${err.message}</p>`;
  }
}

function renderPostedRides(rides, container) {
  if (!rides || rides.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 50px; background: #ffffff; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
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

    return `
      <div class="ride-card">
        <div class="ride-card-top">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge ${ride.status === 'active' ? 'badge-green' : 'badge-yellow'}">
                ${ride.status.toUpperCase()}
              </span>
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
      <div style="text-align: center; padding: 50px; background: #ffffff; border-radius: var(--radius-lg); border: 1px dashed var(--border-color);">
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
          ${isPending ? `
            <button class="btn btn-secondary btn-sm" onclick="cancelMyRequest('${req._id}')">
              Cancel Request
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Driver updates request status (accept / reject)
async function updateRequestStatus(requestId, status) {
  try {
    const res = await apiRequest(`/requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast(res.message || `Request ${status}!`, 'success');
    loadMyRides();
  } catch (err) {
    showToast(err.message || 'Error updating status', 'error');
  }
}

// Passenger cancels request
async function cancelMyRequest(requestId) {
  if (!confirm('Are you sure you want to cancel this ride request?')) return;
  try {
    const res = await apiRequest(`/requests/${requestId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' })
    });
    showToast('Ride request cancelled.', 'info');
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
async function updateRideTripStatus(rideId, status) {
  try {
    await apiRequest(`/rides/${rideId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    showToast(`Trip status updated: ${status.toUpperCase()}!`, 'success');
    loadMyRides();
  } catch (err) {
    showToast(err.message || 'Failed to update trip status', 'error');
  }
}

// Passenger rates driver
function rateDriver(driverName) {
  const stars = prompt(`Rate ${driverName} (1 to 5 stars):`, '5');
  if (stars) {
    showToast(`Thank you! You gave ${driverName} a ${stars}⭐ rating.`, 'success');
  }
}
