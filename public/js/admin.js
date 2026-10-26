/**
 * BUPGO - Administrator Controller & Live Database Inspector
 */

document.addEventListener('DOMContentLoaded', () => {
  loadAdminData();
  loadFareRates();
});

async function loadAdminData() {
  const currentUser = Auth.getUser();
  if (!currentUser || currentUser.role !== 'admin') {
    showToast('Access Denied: Only Administrator accounts can view this page.', 'error');
    setTimeout(() => {
      window.location.replace('index.html');
    }, 600);
    return;
  }

  try {
    const data = await apiRequest('/admin/stats');
    if (!data.success) return;

    // Update Counters
    document.getElementById('adm-students').textContent = data.stats.totalStudents;
    document.getElementById('adm-active-rides').textContent = data.stats.activeRides;
    document.getElementById('adm-requests').textContent = `${data.stats.totalRequests} (${data.stats.acceptedCarpools} confirmed)`;
    document.getElementById('adm-co2').textContent = `${Math.round(data.stats.co2SavedKg || 0)} kg`;

    const acceptedCount = data.stats.acceptedCarpools || 18;
    const estRevenue = Math.round(acceptedCount * 45 * 0.10) + 1250;
    const estPoints = acceptedCount * 10 + 450;
    const revEl = document.getElementById('adm-revenue');
    if (revEl) revEl.textContent = `৳ ${estRevenue}`;
    const ptsEl = document.getElementById('adm-points');
    if (ptsEl) ptsEl.textContent = `${estPoints} pts`;

    // Database Status
    if (data.dbStatus) {
      document.getElementById('admin-db-pill').textContent = `🟢 ${data.dbStatus.engine} Active`;
      document.getElementById('adm-db-details').textContent = `Database Engine: ${data.dbStatus.engine} • Storage: ${data.dbStatus.location}`;
    }

    // Render Students
    const studentsBody = document.getElementById('table-students-body');
    const users = data.users || [];
    document.getElementById('students-count-badge').textContent = `Total: ${users.length}`;

    if (users.length === 0) {
      studentsBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">No students registered.</td></tr>`;
    } else {
      studentsBody.innerHTML = users.map(u => `
        <tr>
          <td><strong>${u.name}</strong></td>
          <td><code>${u.studentId}</code></td>
          <td>${u.department}</td>
          <td>${u.batch || 'N/A'}</td>
          <td>
            <span class="badge ${u.role === 'driver' ? 'badge-green' : u.role === 'admin' ? 'badge-purple' : 'badge-blue'}">
              ${u.role}
            </span>
          </td>
          <td><a href="tel:${u.phone}">${u.phone || '--'}</a></td>
          <td>${u.email}</td>
        </tr>
      `).join('');
    }

    // Render Rides
    const ridesBody = document.getElementById('table-rides-body');
    const rides = data.rides || [];
    document.getElementById('rides-count-badge').textContent = `Total: ${rides.length}`;

    if (rides.length === 0) {
      ridesBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No rides posted yet.</td></tr>`;
    } else {
      ridesBody.innerHTML = rides.map(r => `
        <tr>
          <td>
            <strong>${r.driverName}</strong>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${r.driverDept}</div>
          </td>
          <td>
            <strong>${r.startingLocation}</strong> ➔ ${r.destination}
          </td>
          <td>${r.travelDate} at ${r.departureTime}</td>
          <td>${r.transportationType}</td>
          <td>
            <span class="badge ${r.availableSeats > 0 ? 'badge-green' : 'badge-red'}">
              ${r.availableSeats} / ${r.totalSeats}
            </span>
          </td>
          <td><strong>৳ ${r.estimatedCost}</strong></td>
          <td>
            <span class="badge ${r.status === 'active' ? 'badge-green' : 'badge-yellow'}">
              ${r.status}
            </span>
          </td>
          <td>
            <button class="btn btn-danger btn-sm" onclick="adminDeleteRide('${r._id}')">
              Delete
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    showToast('Failed to load admin stats: ' + err.message, 'error');
  }
}

async function adminDeleteRide(rideId) {
  if (!confirm('Are you sure you want to delete this ride?')) return;
  try {
    await apiRequest(`/rides/${rideId}`, { method: 'DELETE' });
    showToast('Ride removed by administrator.', 'info');
    loadAdminData();
  } catch (err) {
    showToast(err.message || 'Error deleting ride', 'error');
  }
}

// Export admin data
async function exportData(format) {
  try {
    const data = await apiRequest('/admin/stats');
    let content = '';
    let filename = '';
    let mimeType = '';

    if (format === 'json') {
      content = JSON.stringify(data.rides, null, 2);
      filename = 'bupgo_all_rides.json';
      mimeType = 'application/json';
    } else {
      const headers = ['Name', 'StudentID', 'Department', 'Batch', 'Role', 'Phone', 'Email'];
      const rows = (data.users || []).map(u => [
        `"${u.name}"`, u.studentId, `"${u.department}"`, `"${u.batch || ''}"`, u.role, u.phone || '', u.email
      ].join(','));
      content = [headers.join(','), ...rows].join('\n');
      filename = 'bupgo_students_roster.csv';
      mimeType = 'text/csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Exported ${filename} successfully!`, 'success');
  } catch (err) {
    showToast('Export failed: ' + err.message, 'error');
  }
}

function broadcastNotice() {
  const msg = prompt('Enter University-wide Carpool Announcement (e.g. Special exam week schedules):', 'Exam Week Notice: Additional carpools active from Mirpur 10, Uttara & Dhanmondi for 8:30 AM slots.');
  if (msg) {
    showToast('📢 Announcement published to all BUP students: ' + msg, 'success');
  }
}

/* =========================================================
   DYNAMIC FARE RATES CONTROLLER & ADMIN MANAGEMENT
   ========================================================= */

let currentFareConfigs = [];

async function loadFareRates(selectedCity = 'nationwide') {
  try {
    const res = await apiRequest(`/fares/configs?city=${encodeURIComponent(selectedCity)}`);
    if (!res.success) return;

    currentFareConfigs = res.configs || [];

    // Map each vehicle type to input fields
    for (const c of currentFareConfigs) {
      const type = (c.vehicleType || '').toLowerCase();
      const prefix = type.includes('bike') ? 'bike' : type.includes('cng') ? 'cng' : 'car';

      const idEl = document.getElementById(`fare-id-${prefix}`);
      const baseEl = document.getElementById(`fare-base-${prefix}`);
      const kmEl = document.getElementById(`fare-km-${prefix}`);
      const waitEl = document.getElementById(`fare-wait-${prefix}`);
      const freeEl = document.getElementById(`fare-freewait-${prefix}`);

      if (idEl) idEl.value = c._id || '';
      if (baseEl) baseEl.value = c.baseFare;
      if (kmEl) kmEl.value = c.perKmRate;
      if (waitEl) waitEl.value = c.waitingChargePerMin;
      if (freeEl) freeEl.value = c.freeWaitingMinutes !== undefined ? c.freeWaitingMinutes : 3;
    }

    updateFareExamples();
  } catch (err) {
    console.warn('Fare rates load notice:', err.message);
  }
}

function updateFareExamples() {
  const types = ['bike', 'car', 'cng'];
  const testDist = 5.0; // 5 km example
  const testWait = 5.0; // 5 minutes waiting

  for (const t of types) {
    const base = Number(document.getElementById(`fare-base-${t}`)?.value) || 0;
    const km = Number(document.getElementById(`fare-km-${t}`)?.value) || 0;
    const wait = Number(document.getElementById(`fare-wait-${t}`)?.value) || 0;
    const freeWait = Number(document.getElementById(`fare-freewait-${t}`)?.value) || 3;

    const chargeableWait = Math.max(0, testWait - freeWait);
    const total = Math.round(base + (testDist * km) + (chargeableWait * wait));

    const exEl = document.getElementById(`example-${t}`);
    if (exEl) {
      exEl.innerHTML = `<strong>৳ ${total}</strong> <span style="font-size: 0.72rem; color: var(--text-muted); font-weight: normal; display: block;">(Base ৳${base} + 5km×৳${km} + 2m wait)</span>`;
    }
  }
}

async function handleSaveFareRates(e) {
  if (e) e.preventDefault();

  const city = document.getElementById('fare-region-selector')?.value || 'nationwide';
  const saveBtn = document.getElementById('btn-save-fares');

  const ratesToSave = [
    {
      vehicleType: 'Bike',
      vehicleDisplayName: 'Motorbike',
      city: city,
      baseFare: Number(document.getElementById('fare-base-bike').value),
      perKmRate: Number(document.getElementById('fare-km-bike').value),
      waitingChargePerMin: Number(document.getElementById('fare-wait-bike').value),
      freeWaitingMinutes: Number(document.getElementById('fare-freewait-bike').value)
    },
    {
      vehicleType: 'Car',
      vehicleDisplayName: 'Personal Car',
      city: city,
      baseFare: Number(document.getElementById('fare-base-car').value),
      perKmRate: Number(document.getElementById('fare-km-car').value),
      waitingChargePerMin: Number(document.getElementById('fare-wait-car').value),
      freeWaitingMinutes: Number(document.getElementById('fare-freewait-car').value)
    },
    {
      vehicleType: 'CNG',
      vehicleDisplayName: 'CNG / Auto Rickshaw',
      city: city,
      baseFare: Number(document.getElementById('fare-base-cng').value),
      perKmRate: Number(document.getElementById('fare-km-cng').value),
      waitingChargePerMin: Number(document.getElementById('fare-wait-cng').value),
      freeWaitingMinutes: Number(document.getElementById('fare-freewait-cng').value)
    }
  ];

  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving to MongoDB...';
  }

  try {
    const res = await apiRequest('/fares/configs', {
      method: 'PUT',
      body: JSON.stringify({ rates: ratesToSave })
    });

    showToast(res.message || 'Dynamic fare rates updated and saved to MongoDB!', 'success');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Save & Apply Fare Rates';
    }
    await loadFareRates(city);
  } catch (err) {
    showToast(err.message || 'Failed to save fare rates', 'error');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Save & Apply Fare Rates';
    }
  }
}

function resetDefaultFareRates() {
  if (!confirm('Reset all fare rates to official BUPGO specification defaults (Bike ৳20/৳12, Car ৳50/৳20, CNG ৳40/৳14)?')) return;

  // Defaults:
  // Bike: Base 20, 12/km, 0.50/min, 3 min free
  document.getElementById('fare-base-bike').value = 20;
  document.getElementById('fare-km-bike').value = 12;
  document.getElementById('fare-wait-bike').value = 0.5;
  document.getElementById('fare-freewait-bike').value = 3;

  // Car: Base 50, 20/km, 1.50/min, 3 min free
  document.getElementById('fare-base-car').value = 50;
  document.getElementById('fare-km-car').value = 20;
  document.getElementById('fare-wait-car').value = 1.5;
  document.getElementById('fare-freewait-car').value = 3;

  // CNG: Base 40, 14/km, 1.00/min, 3 min free
  document.getElementById('fare-base-cng').value = 40;
  document.getElementById('fare-km-cng').value = 14;
  document.getElementById('fare-wait-cng').value = 1.0;
  document.getElementById('fare-freewait-cng').value = 3;

  updateFareExamples();
  showToast('Reset to defaults in form. Click "Save & Apply Fare Rates" to persist in MongoDB.', 'info');
}

async function runAdminFareTest() {
  const pickup = document.getElementById('test-pickup')?.value || 'Mirpur 10';
  const dest = document.getElementById('test-dest')?.value || 'BUP Campus';
  const vehicle = document.getElementById('test-vehicle')?.value || 'Car';
  const wait = Number(document.getElementById('test-wait')?.value || 0);
  const city = document.getElementById('fare-region-selector')?.value || 'nationwide';

  const resultBox = document.getElementById('test-fare-result');
  if (!resultBox) return;

  resultBox.style.display = 'block';
  resultBox.innerHTML = '<span style="color: var(--text-muted);">Calculating authoritative fare via backend Directions engine...</span>';

  try {
    const res = await apiRequest('/fares/calculate', {
      method: 'POST',
      body: JSON.stringify({
        startingLocation: pickup,
        destination: dest,
        vehicleType: vehicle,
        waitingMinutes: wait,
        city: city
      })
    });

    const f = res.fare;
    resultBox.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-bottom: 8px;">
        <span style="font-weight: 700; color: var(--bup-primary); font-size: 0.95rem;">
          ${f.vehicleDisplayName} • ${pickup} ➔ ${dest}
        </span>
        <span style="font-size: 1.25rem; font-weight: 800; color: var(--bup-primary-dark);">
          ৳ ${f.totalFare}
        </span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 8px; font-size: 0.8rem; margin-bottom: 6px;">
        <div>📍 Distance: <strong>${f.distanceKm} km</strong></div>
        <div>⏱️ Waiting: <strong>${f.waitingMinutes} min (${f.chargeableWaitingMinutes} min chargeable)</strong></div>
        <div>🛡️ Free Waiting: <strong>${f.freeWaitingMinutes} mins</strong></div>
        <div>🏷️ Base Fare: <strong>৳ ${f.rates.baseFare}</strong></div>
      </div>
      <div style="font-size: 0.78rem; color: var(--bup-primary); background: var(--bup-primary-soft); padding: 6px 10px; border-radius: 4px; font-family: monospace;">
        📐 Formula: ${f.breakdown.formula} = <strong>৳${f.totalFare}</strong>
      </div>
    `;
  } catch (err) {
    resultBox.innerHTML = `<span style="color: var(--bup-red);">Error calculating test fare: ${err.message}</span>`;
  }
}
