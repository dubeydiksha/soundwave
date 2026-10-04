// =========================================================
// SoundWave - Log In Page Script
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const rememberMeInput = document.getElementById('rememberMe');
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');

  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  const formAlert = document.getElementById('formAlert');

  // Toggle Password Visibility
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.type === 'password';
      passwordInput.type = isPassword ? 'text' : 'password';

      togglePasswordBtn.innerHTML = isPassword
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
             <line x1="1" y1="1" x2="23" y2="23"></line>
           </svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
             <circle cx="12" cy="12" r="3"></circle>
           </svg>`;
    });
  }

  // Clear errors when typing
  emailInput.addEventListener('input', clearAlerts);
  passwordInput.addEventListener('input', clearAlerts);

  // Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlerts();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberMeInput.checked;

    if (!email || !password) {
      showFormAlert('Please enter both your email and password.', 'danger');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await response.json();

      if (!response.ok) {
        // Generic "Invalid email or password" error display
        showFormAlert(data.error || 'Invalid email or password', 'danger');
        setLoading(false);
        return;
      }

      // Success
      showFormAlert('Logged in successfully! Loading player...', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 600);
    } catch (err) {
      console.error('Login request error:', err);
      showFormAlert('Unable to connect to the server. Please check your network.', 'danger');
      setLoading(false);
    }
  });

  function clearAlerts() {
    if (formAlert) {
      formAlert.textContent = '';
      formAlert.className = 'form-alert';
    }
    emailInput.classList.remove('input-error');
    passwordInput.classList.remove('input-error');
  }

  function showFormAlert(message, type) {
    if (!formAlert) return;
    formAlert.textContent = message; // Safe textContent against XSS
    formAlert.className = `form-alert form-alert-${type} visible`;
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    if (isLoading) {
      btnText.style.display = 'none';
      btnSpinner.style.display = 'inline-block';
    } else {
      btnText.style.display = 'inline';
      btnSpinner.style.display = 'none';
    }
  }
});
