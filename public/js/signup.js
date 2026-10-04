// =========================================================
// SoundWave - Sign Up Page Script
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signupForm');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirmPassword');

  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPasswordBtn');

  const strengthBar = document.getElementById('strengthBar');
  const strengthLabel = document.getElementById('strengthLabel');

  const submitBtn = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  const formAlert = document.getElementById('formAlert');

  // Show/Hide Password Toggle
  setupPasswordToggle(togglePasswordBtn, passwordInput);
  setupPasswordToggle(toggleConfirmPasswordBtn, confirmPasswordInput);

  // Live Password Strength Meter
  passwordInput.addEventListener('input', () => {
    updatePasswordStrength(passwordInput.value);
    clearFieldError('password');
  });

  // Clear errors on input
  nameInput.addEventListener('input', () => clearFieldError('name'));
  emailInput.addEventListener('input', () => clearFieldError('email'));
  confirmPasswordInput.addEventListener('input', () => clearFieldError('confirmPassword'));

  // Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Client-side Validation
    let hasError = false;

    if (!name || name.length < 2 || name.length > 60) {
      showFieldError('name', 'Full name must be between 2 and 60 characters.');
      hasError = true;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showFieldError('email', 'Please enter a valid email address.');
      hasError = true;
    }

    const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
    if (!password || !passwordRegex.test(password)) {
      showFieldError('password', 'Password must be at least 8 characters with 1 letter & 1 number.');
      hasError = true;
    }

    if (password !== confirmPassword) {
      showFieldError('confirmPassword', 'Passwords do not match.');
      hasError = true;
    }

    if (hasError) return;

    // Send POST /api/auth/signup
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, confirmPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          // Inline duplicate email error
          showFieldError('email', data.error || 'An account with this email already exists.');
        } else {
          showFormAlert(data.error || 'Registration failed. Please check your information.', 'danger');
        }
        setLoading(false);
        return;
      }

      // Success: Auto-login cookie is set, redirect to /dashboard
      showFormAlert('Account created! Redirecting to your dashboard...', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 700);
    } catch (err) {
      console.error('Signup error:', err);
      showFormAlert('Network error. Please verify your connection and try again.', 'danger');
      setLoading(false);
    }
  });

  // Helpers
  function setupPasswordToggle(btn, input) {
    if (!btn || !input) return;
    btn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      btn.innerHTML = isPassword
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

  function updatePasswordStrength(val) {
    if (!val) {
      strengthBar.style.width = '0%';
      strengthBar.style.backgroundColor = 'transparent';
      strengthLabel.textContent = 'Enter password';
      strengthLabel.style.color = 'var(--text-muted)';
      return;
    }

    let score = 0;
    if (val.length >= 8) score++;
    if (/[a-z]/.test(val) && /[A-Z]/.test(val)) score++;
    if (/\d/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    switch (score) {
      case 1:
        strengthBar.style.width = '25%';
        strengthBar.style.backgroundColor = '#e91429';
        strengthLabel.textContent = 'Weak';
        strengthLabel.style.color = '#e91429';
        break;
      case 2:
        strengthBar.style.width = '50%';
        strengthBar.style.backgroundColor = '#ffa116';
        strengthLabel.textContent = 'Fair';
        strengthLabel.style.color = '#ffa116';
        break;
      case 3:
        strengthBar.style.width = '75%';
        strengthBar.style.backgroundColor = '#1db954';
        strengthLabel.textContent = 'Good';
        strengthLabel.style.color = '#1db954';
        break;
      case 4:
        strengthBar.style.width = '100%';
        strengthBar.style.backgroundColor = '#1ed760';
        strengthLabel.textContent = 'Strong';
        strengthLabel.style.color = '#1ed760';
        break;
      default:
        strengthBar.style.width = '10%';
        strengthBar.style.backgroundColor = '#e91429';
        strengthLabel.textContent = 'Very Weak';
        strengthLabel.style.color = '#e91429';
    }
  }

  function showFieldError(field, message) {
    const errorEl = document.getElementById(`${field}Error`);
    const inputEl = document.getElementById(field);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
    if (inputEl) {
      inputEl.classList.add('input-error');
    }
  }

  function clearFieldError(field) {
    const errorEl = document.getElementById(`${field}Error`);
    const inputEl = document.getElementById(field);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
    if (inputEl) {
      inputEl.classList.remove('input-error');
    }
  }

  function clearAllErrors() {
    clearFieldError('name');
    clearFieldError('email');
    clearFieldError('password');
    clearFieldError('confirmPassword');
    if (formAlert) {
      formAlert.textContent = '';
      formAlert.className = 'form-alert';
    }
  }

  function showFormAlert(message, type) {
    if (!formAlert) return;
    formAlert.textContent = message;
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
