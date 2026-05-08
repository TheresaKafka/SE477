const API_URL = '/api/auth';

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const submitBtn = document.getElementById('submitBtn');
  const alertBox = document.getElementById('alert');

  const signupForm = document.getElementById('signupForm');
  const signupEmailInput = document.getElementById('signupEmail');
  const signupPasswordInput = document.getElementById('signupPassword');
  const confirmPasswordInput = document.getElementById('confirmPassword');
  const signupBtn = document.getElementById('signupBtn');

  const loginFooter = document.getElementById('loginFooter');
  const signupFooter = document.getElementById('signupFooter');
  const showSignupBtn = document.getElementById('showSignup');
  const showLoginBtn = document.getElementById('showLogin');
  const cardHeaderTitle = document.querySelector('.header h2');
  const cardHeaderDesc = document.querySelector('.header p');

  const loginCard = document.querySelector('.login-card');
  const profileSection = document.getElementById('profileSection');
  const userEmailSpan = document.getElementById('userEmail');
  const userRoleSpan = document.getElementById('userRole');
  const logoutBtn = document.getElementById('logoutBtn');
  const testApiBtn = document.getElementById('testApiBtn');
  const apiResultBox = document.getElementById('apiResult');

  // If already logged in, skip login page
  checkAuthStatus();

  showSignupBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    loginFooter.classList.add('hidden');
    signupForm.classList.remove('hidden');
    signupFooter.classList.remove('hidden');
    cardHeaderTitle.textContent = 'Create an Account';
    cardHeaderDesc.textContent = 'Sign up to get started.';
    alertBox.classList.add('hidden');
  });

  showLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    signupForm.classList.add('hidden');
    signupFooter.classList.add('hidden');
    loginForm.classList.remove('hidden');
    loginFooter.classList.remove('hidden');
    cardHeaderTitle.textContent = 'Welcome Back';
    cardHeaderDesc.textContent = 'Please enter your details to sign in.';
    alertBox.classList.add('hidden');
  });

  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = signupEmailInput.value.trim();
    const password = signupPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!email || !password || !confirmPassword) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters long', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match', 'error');
      return;
    }

    const payload = { email, password, confirmPassword };

    setLoading(true, signupBtn, 'Signing Up...');
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Registration success → go to dashboard
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showAlert('Registration successful! Redirecting...', 'success');
      setTimeout(() => { window.location.href = 'home.html'; }, 1000);

    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false, signupBtn, 'Sign Up');
    }
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Basic validation
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAlert('Please fill in all fields', 'error');
      return;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters long', 'error');
      return;
    }

    // Attempt login
    setLoading(true, submitBtn, 'Signing In...');
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Login success → go to dashboard
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => {
        window.location.href = 'home.html';
      }, 1000);

    } catch (error) {
      showAlert(error.message, 'error');
    } finally {
      setLoading(false, submitBtn, 'Sign In');
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    showLogin();
  });

  testApiBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('access_token');
    apiResultBox.textContent = 'Loading...';

    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      apiResultBox.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
      apiResultBox.textContent = `Error: ${error.message}`;
    }
  });

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = `alert ${type}`;
    alertBox.classList.remove('hidden');

    // Hide after 5 seconds
    setTimeout(() => {
      alertBox.classList.add('hidden');
    }, 5000);
  }

  function setLoading(isLoading, button, text) {
    button.disabled = isLoading;
    button.textContent = text;
  }

  function checkAuthStatus() {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      // Already authenticated — go to new homepage
      window.location.href = 'home.html';
    } else {
      showLogin();
    }
  }

  function showProfile(user) {
    loginCard.classList.add('hidden');
    profileSection.classList.remove('hidden');
    userEmailSpan.textContent = user.email;
    userRoleSpan.textContent = user.role || 'N/A';
    apiResultBox.textContent = '';
  }

  function showLogin() {
    loginCard.classList.remove('hidden');
    profileSection.classList.add('hidden');
    loginForm.reset();
  }
});
