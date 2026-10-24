/**
 * BUPGO - Student Profile Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.isLoggedIn()) {
    showToast('Please login to view profile.', 'info');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    return;
  }

  loadProfile();

  const editForm = document.getElementById('profile-edit-form');
  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('edit-phone').value.trim();
      const vehicleModel = document.getElementById('edit-vehicle').value.trim();
      const bio = document.getElementById('edit-bio').value.trim();
      const saveBtn = document.getElementById('btn-save-profile');

      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const res = await apiRequest('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ phone, vehicleModel, bio })
        });

        // Update stored user
        const currentStored = Auth.getUser();
        Auth.setSession(Auth.getToken(), { ...currentStored, ...res.user });

        showToast('Profile updated successfully!', 'success');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
        loadProfile();
      } catch (err) {
        showToast(err.message || 'Error updating profile', 'error');
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }
    });
  }
});

async function loadProfile() {
  try {
    const data = await apiRequest('/auth/me');
    const user = data.user;

    document.getElementById('prof-name').textContent = user.name;
    document.getElementById('prof-sub').textContent = `${user.department} • Batch: ${user.batch || 'N/A'}`;
    document.getElementById('prof-email').textContent = `Email: ${user.email}`;
    document.getElementById('prof-id').textContent = user.studentId;
    document.getElementById('prof-dept').textContent = user.department;
    document.getElementById('prof-batch').textContent = `${user.batch || 'N/A'} (Session: ${user.session || '2022-23'})`;
    document.getElementById('prof-phone').textContent = user.phone || 'Not provided';
    document.getElementById('prof-role').textContent = user.role === 'driver' ? 'Student Driver / Carpooler' : 'Student Passenger';
    document.getElementById('prof-vehicle').textContent = user.vehicleModel || (user.vehicleType || 'None');
    document.getElementById('prof-bio').textContent = user.bio ? `"${user.bio}"` : 'No bio added yet.';

    const avatarUrl = user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
    document.getElementById('prof-avatar').src = avatarUrl;

    // Fill Edit Form
    document.getElementById('edit-phone').value = user.phone || '';
    document.getElementById('edit-vehicle').value = user.vehicleModel || '';
    document.getElementById('edit-bio').value = user.bio || '';

    // Fetch rides stats
    try {
      const myRides = await apiRequest('/users/my-rides');
      document.getElementById('prof-rides-offered-badge').textContent = `🚘 Rides Offered: ${myRides.postedRides.length}`;
      document.getElementById('prof-rides-taken-badge').textContent = `🎫 Bookings Made: ${myRides.requestedRides.length}`;
    } catch (e) {
      // ignore
    }
  } catch (err) {
    showToast('Failed to load profile data', 'error');
  }
}
