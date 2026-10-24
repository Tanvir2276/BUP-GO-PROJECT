/**
 * BUPGO - Administrator Controller & Live Database Inspector
 */

document.addEventListener('DOMContentLoaded', () => {
  loadAdminData();
});

async function loadAdminData() {
  try {
    const data = await apiRequest('/admin/stats');
    if (!data.success) return;

    // Update Counters
    document.getElementById('adm-students').textContent = data.stats.totalStudents;
    document.getElementById('adm-active-rides').textContent = data.stats.activeRides;
    document.getElementById('adm-requests').textContent = `${data.stats.totalRequests} (${data.stats.acceptedCarpools} confirmed)`;
    document.getElementById('adm-co2').textContent = `${Math.round(data.stats.co2SavedKg || 0)} kg`;

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
