/**
 * BUPGO - Login & Registration Controller
 */

function toggleAuthTab(mode) {
  const loginBtn = document.getElementById('tab-login-btn');
  const regBtn = document.getElementById('tab-register-btn');
  const formLogin = document.getElementById('form-login');
  const formReg = document.getElementById('form-register');

  if (mode === 'login') {
    loginBtn.classList.add('active');
    regBtn.classList.remove('active');
    formLogin.style.display = 'block';
    formReg.style.display = 'none';
  } else {
    regBtn.classList.add('active');
    loginBtn.classList.remove('active');
    formLogin.style.display = 'none';
    formReg.style.display = 'block';
  }
}

async function quickLogin(loginId, password) {
  try {
    const res = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ loginId, password })
    });

    Auth.setSession(res.token, res.user);
    window.location.href = 'index.html';
  } catch (err) {
    showToast(err.message || 'Login failed', 'error');
  }
}

function selectRegAvatar(card, avatarUrl) {
  document.querySelectorAll('.avatar-option-card').forEach(c => c.classList.remove('selected'));
  if (card) card.classList.add('selected');
  const input = document.getElementById('reg-avatar');
  if (input) input.value = avatarUrl;
}

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect
  if (Auth.isLoggedIn()) {
    window.location.href = 'index.html';
  }

  // Handle Login form
  const loginForm = document.getElementById('form-login');
  const loginSubmit = document.getElementById('btn-login-submit');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const loginId = document.getElementById('login-id').value.trim();
      const password = document.getElementById('login-pass').value;

      loginSubmit.disabled = true;
      loginSubmit.textContent = 'Verifying credentials...';

      try {
        const res = await apiRequest('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ loginId, password })
        });

        Auth.setSession(res.token, res.user);
        window.location.href = 'index.html';
      } catch (err) {
        showToast(err.message || 'Invalid credentials', 'error');
        loginSubmit.disabled = false;
        loginSubmit.textContent = 'Sign In to BUPGO';
      }
    });
  }

  // Handle Register form
  const regForm = document.getElementById('form-register');
  const regSubmit = document.getElementById('btn-reg-submit');

  if (regForm) {
    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const studentId = document.getElementById('reg-studentid').value.trim();
      const department = document.getElementById('reg-dept').value.trim();
      const batch = document.getElementById('reg-batch').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const role = document.getElementById('reg-role').value;
      const vehicleType = document.getElementById('reg-vehicle').value.trim();
      const password = document.getElementById('reg-pass').value;
      const avatar = document.getElementById('reg-avatar')?.value || '';

      regSubmit.disabled = true;
      regSubmit.textContent = 'Creating account in NoSQL DB...';

      try {
        const res = await apiRequest('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            name,
            studentId,
            department,
            batch,
            phone,
            email,
            role,
            vehicleType,
            password,
            avatar
          })
        });

        Auth.setSession(res.token, res.user);
        showToast(res.message || 'Registration complete! Welcome.', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 800);
      } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
        regSubmit.disabled = false;
        regSubmit.textContent = 'Create Student Account';
      }
    });
  }
});
