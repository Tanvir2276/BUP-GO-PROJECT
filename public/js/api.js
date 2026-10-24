/**
 * BUPGO - Client API Helper & Auth Manager
 */

const API_BASE = '/api';

const Auth = {
  getToken() {
    return localStorage.getItem('bupgo_token');
  },
  getUser() {
    const raw = localStorage.getItem('bupgo_user');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },
  setSession(token, user) {
    localStorage.setItem('bupgo_token', token);
    localStorage.setItem('bupgo_user', JSON.stringify(user));
  },
  clearSession() {
    localStorage.removeItem('bupgo_token');
    localStorage.removeItem('bupgo_user');
  },
  isLoggedIn() {
    return !!this.getToken();
  }
};

async function apiRequest(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'API Request failed');
    }
    return data;
  } catch (err) {
    console.error(`API Error on ${endpoint}:`, err);
    throw err;
  }
}

// Toast Notification System
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '✓';
  if (type === 'error') icon = '✕';
  if (type === 'info') icon = 'ℹ';

  toast.innerHTML = `<span style="font-size: 1.1rem; font-weight: bold;">${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Check NoSQL DB status on load and show pill in footer
async function updateDbStatusPill() {
  try {
    const statusData = await apiRequest('/system/status');
    const pill = document.getElementById('footer-db-status');
    if (pill && statusData.database) {
      pill.innerHTML = `🟢 NoSQL Database: ${statusData.database.mode === 'mongodb' ? 'MongoDB (Mongoose)' : 'NoSQL JSON Engine'} (Active)`;
    }
  } catch (e) {
    // silently ignore
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateDbStatusPill();
});
