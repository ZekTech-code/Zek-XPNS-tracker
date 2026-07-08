import { useState, useEffect } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const ACCOUNT_NAMES_KEY = 'xpnsAccountNamesByEmail';

function getSavedAccountNames() {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_NAMES_KEY) || '{}'); } catch { return {}; }
}

function saveAccountName(email, name) {
  if (!email || !name) return;
  const names = getSavedAccountNames();
  names[email.trim().toLowerCase()] = name.trim();
  localStorage.setItem(ACCOUNT_NAMES_KEY, JSON.stringify(names));
}

function normalizeName(name) {
  return name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function getPasswordStrength(val) {
  let s = 0;
  if (val.length >= 6) s++;
  if (/[A-Z]/.test(val)) s++;
  if (/[0-9]/.test(val)) s++;
  if (/[^A-Za-z0-9]/.test(val)) s++;
  const levels = [
    { w: '0%', c: 'var(--border)', l: 'Enter a password' },
    { w: '25%', c: 'var(--red)', l: 'Weak password' },
    { w: '50%', c: 'var(--amber)', l: 'Medium password' },
    { w: '75%', c: 'var(--primary)', l: 'Strong password' },
    { w: '100%', c: 'var(--green)', l: 'Very strong password' },
  ];
  return val.length > 0 ? levels[s] : levels[0];
}

function getAuthErrorMessage(err, fallback) {
  const m = {
    'auth/email-already-in-use': 'This email already has an account.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/user-not-found': 'No user found with this email.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/too-many-requests': 'Too many failed attempts. Try again later.',
  };
  return m[err?.code] || fallback;
}

function LogoIcon() {
  return (
    <svg viewBox="0 0 36 36" width="34" height="34" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="lbg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0f0f18"/><stop offset="100%" stop-color="#1b1b2a"/></linearGradient>
        <linearGradient id="lup" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#10b981"/><stop offset="100%" stop-color="#34d399"/></linearGradient>
        <linearGradient id="ldn" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient>
      </defs>
      <rect width="36" height="36" rx="9" fill="url(#lbg)" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      <path d="M9 25L17 17L21 21L27 13" stroke="url(#lup)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M22 13H27V18" stroke="url(#lup)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M9 13L17 21L21 17L27 25" stroke="url(#ldn)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
      <path d="M22 25H27V20" stroke="url(#ldn)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginView() {
  const [mode, setMode] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState({ login: false, signup: false, confirm: false });
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const onOff = () => setOnline(navigator.onLine);
    window.addEventListener('offline', onOff);
    window.addEventListener('online', onOff);
    return () => {
      window.removeEventListener('offline', onOff);
      window.removeEventListener('online', onOff);
    };
  }, []);

  function setErr(field, msg) {
    setErrors(prev => ({ ...prev, [field]: msg }));
  }

  function clearFieldErr(field) {
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
  }

  const auth = firebase.auth();
  const db = firebase.firestore();

  async function handleLogin(e) {
    e.preventDefault();
    setErrors({});
    setStatus({ message: '', type: '' });
    const email = loginEmail.trim().toLowerCase();
    const pass = loginPassword;
    let valid = true;
    if (!email) { setErr('loginEmail', 'Email is required.'); valid = false; }
    if (!pass) { setErr('loginPassword', 'Password is required.'); valid = false; }
    if (!valid) return;
    if (!online) return;
    try {
      setLoading(true);
      setStatus({ message: 'Verifying credentials...', type: 'ok' });
      await auth.setPersistence(rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION);
      const cred = await auth.signInWithEmailAndPassword(email, pass);
      saveAccountName(email, (cred.user.displayName || 'User').trim());
    } catch (err) {
      setLoading(false);
      setStatus({ message: getAuthErrorMessage(err, 'Invalid email or password.'), type: 'bad' });
    }
  }

  async function handleSignup(e) {
    e.preventDefault();
    setErrors({});
    setStatus({ message: '', type: '' });
    const name = signupName.trim();
    const email = signupEmail.trim().toLowerCase();
    const pass = signupPassword;
    const confirm = signupConfirmPassword;
    let valid = true;
    if (!name) { setErr('signupName', 'Name is required.'); valid = false; }
    if (!email) { setErr('signupEmail', 'Email is required.'); valid = false; }
    if (!pass || pass.length < 6) { setErr('signupPassword', 'Minimum 6 characters.'); valid = false; }
    if (pass !== confirm) { setErr('signupConfirm', 'Passwords do not match.'); valid = false; }
    if (!agreeTerms) { setStatus({ message: 'You must agree to the Terms & Conditions.', type: 'bad' }); valid = false; }
    if (!valid) return;
    if (!online) return;
    try {
      setLoading(true);
      setStatus({ message: 'Creating account...', type: 'ok' });
      const cred = await auth.createUserWithEmailAndPassword(email, pass);
      await cred.user.updateProfile({ displayName: name });
      await db.collection('users').doc(cred.user.uid).set({
        email, displayName: name,
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        preferences: { theme: 'dark', currency: 'NGN', hideBalance: false, avatarColor: null, isSidebarCollapsed: false },
      }, { merge: true });
      saveAccountName(email, name);
    } catch (err) {
      setLoading(false);
      if (err?.code === 'auth/email-already-in-use') setErr('signupEmail', 'Email already in use.');
      else setStatus({ message: getAuthErrorMessage(err, 'Signup failed. Please try again.'), type: 'bad' });
    }
  }

  async function handleForgotPassword() {
    const email = loginEmail.trim().toLowerCase();
    setErrors({});
    if (!email) { setErr('loginEmail', 'Enter your email address first.'); return; }
    try {
      await auth.sendPasswordResetEmail(email);
      setStatus({ message: 'Password reset email sent. Check your inbox and spam folder.', type: 'ok' });
    } catch {
      setStatus({ message: 'Unable to send reset link. Check your email and try again.', type: 'bad' });
    }
  }

  async function handleGoogleLogin() {
    if (!online) return;
    try {
      setStatus({ message: 'Redirecting to Google...', type: 'ok' });
      const result = await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      const userName = (result.user.displayName || 'User').trim();
      const email = result.user.email;
      await db.collection('users').doc(result.user.uid).set({
        email, displayName: userName,
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
        preferences: { theme: 'dark', currency: 'NGN', hideBalance: false, avatarColor: null, isSidebarCollapsed: false },
      }, { merge: true });
      saveAccountName(email, userName);
    } catch (err) {
      if (err.code === 'auth/popup-blocked') setStatus({ message: 'Popup blocked. Please enable popups.', type: 'bad' });
      else if (err.code === 'auth/popup-closed-by-user') setStatus({ message: 'Sign-in cancelled.', type: 'bad' });
      else setStatus({ message: getAuthErrorMessage(err, 'Authentication failed.'), type: 'bad' });
    }
  }

  function switchMode(m) {
    setMode(m);
    setErrors({});
    setStatus({ message: '', type: '' });
  }

  function togglePw(field) {
    setShowPw(prev => ({ ...prev, [field]: !prev[field] }));
  }

  const welcomeName = (() => {
    if (mode !== 'login') return '';
    const names = getSavedAccountNames();
    const name = names[loginEmail.trim().toLowerCase()];
    return name && name.toLowerCase() !== 'user' ? normalizeName(name) : '';
  })();

  const pwStrength = getPasswordStrength(signupPassword);
  const pwMatchErr = signupConfirmPassword && signupPassword !== signupConfirmPassword;
  const btnLoading = (id) => loading && ((id === 'login' && mode === 'login') || (id === 'signup' && mode === 'signup'));

  return (
    <div className="login-view">
      <div className="split-container">
        <aside className="visual-panel">
          <div className="visual-container">
            <div className="mockup-container">
              <div className="glass-card">
                <div className="preview-card-header">
                  <span className="preview-card-title">Savings Growth</span>
                  <span className="preview-badge">+24.5% rate</span>
                </div>
                <div className="preview-card-value">{'\u20A6'}142,500.00</div>
                <div className="preview-chart">
                  <svg viewBox="0 0 200 60" className="sparkline" aria-label="Savings graph preview">
                    <defs>
                      <linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
                        <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
                      </linearGradient>
                    </defs>
                    <path d="M0 48 Q25 38 50 42 T100 24 T150 18 T200 8 L200 60 L0 60Z" fill="url(#sg)"/>
                    <path d="M0 48 Q25 38 50 42 T100 24 T150 18 T200 8" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>
                    <circle cx="200" cy="8" r="4.5" fill="#10b981"/>
                  </svg>
                </div>
              </div>
              <div className="glass-card-sm">
                <div className="preview-card-header">
                  <span className="preview-card-title">Monthly Budget</span>
                  <span className="preview-badge" style={{ background: 'rgba(99,102,241,0.1)', color: '#60a5fa', borderColor: 'rgba(99,102,241,0.15)' }}>72% spent</span>
                </div>
                <div className="preview-progress-bar">
                  <div className="preview-progress-fill" style={{ width: '72%' }} />
                </div>
                <div className="preview-card-footer">
                  <span>Remaining: {'\u20A6'}57,200.00</span>
                </div>
              </div>
            </div>
            <div className="value-prop">
              <h2>Track expenses, manage budgets, and achieve your <span className="highlight">financial goals</span>.</h2>
              <p>XPNS is a premium personal expense tracker. Sync deposits, categorize expenses, and monitor financial health in real time.</p>
            </div>
          </div>
        </aside>

        <main className="auth-panel">
          <div className="auth-content">
            <header className="brand-logo-full">
              <LogoIcon />
              <span className="brand-wordmark">XPNS<span className="accent">.</span></span>
            </header>

            <section className="auth-card">
              {welcomeName && mode === 'login' && (
                <div className="welcome-badge" style={{ display: 'flex' }}>
                  <i className="fa-solid fa-face-smile" style={{ color: 'var(--green)', marginRight: 8 }} />
                  Welcome back, <span className="accent-name" style={{ marginLeft: 4 }}>{welcomeName}</span>!
                </div>
              )}

              {!online && (
                <div className="msg bad">
                  <i className="fa-solid fa-circle-exclamation" />
                  You are offline. Check your internet connection.
                </div>
              )}
              {status.message && (
                <div className={`msg ${status.type}`}>
                  <i className={`fa-solid ${status.type === 'ok' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} />
                  {status.message}
                </div>
              )}

              <form className={`form ${mode === 'login' ? 'active' : ''}`} onSubmit={handleLogin} style={mode !== 'login' ? { display: 'none' } : undefined}>
                <div className="welcome-header">
                  <h2>Welcome back</h2>
                  <p className="form-desc-text">Log in to manage your expense tracker dashboard</p>
                </div>

                <div className="field">
                  <label htmlFor="loginEmail">Email address</label>
                  <div className="input-wrapper">
                    <input id="loginEmail" type="email" placeholder="you@example.com" autoComplete="email" value={loginEmail} onChange={e => { setLoginEmail(e.target.value); clearFieldErr('loginEmail'); }} className={errors.loginEmail ? 'has-error' : ''} />
                  </div>
                  <span className="err">{errors.loginEmail || ''}</span>
                </div>

                <div className="field">
                  <label htmlFor="loginPassword">Password</label>
                  <div className="input-wrapper">
                    <input id="loginPassword" type={showPw.login ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" value={loginPassword} onChange={e => { setLoginPassword(e.target.value); clearFieldErr('loginPassword'); }} className={errors.loginPassword ? 'has-error' : ''} />
                    <button type="button" className="pw-toggle" aria-label="Show password" onClick={() => togglePw('login')}>
                      <i className={`fa-regular ${showPw.login ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                  <span className="err">{errors.loginPassword || ''}</span>
                </div>

                <div className="action-row">
                  <label className="checkbox-label-wrapper">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="inline-link" onClick={handleForgotPassword}>Forgot password?</button>
                </div>

                <button className="btn" type="submit" disabled={btnLoading('login')}>
                  {btnLoading('login') ? <><span className="spinner" />Processing...</> : 'Sign In'}
                </button>

                <div className="divider">or continue with</div>

                <button type="button" className="btn-social" onClick={handleGoogleLogin} disabled={btnLoading('login')}>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </button>

                <footer className="auth-footer">
                  <span>Don't have an account? </span>
                  <button type="button" className="inline-link" onClick={() => switchMode('signup')}>Create one free</button>
                </footer>
              </form>

              <form className={`form ${mode === 'signup' ? 'active' : ''}`} onSubmit={handleSignup} style={mode !== 'signup' ? { display: 'none' } : undefined}>
                <div className="welcome-header">
                  <h2>Create Account</h2>
                  <p className="form-desc-text">Sign up to start tracking expenses in real time</p>
                </div>

                <div className="field">
                  <label htmlFor="signupName">Full Name</label>
                  <div className="input-wrapper">
                    <input id="signupName" type="text" placeholder="e.g. John Doe" autoComplete="name" value={signupName} onChange={e => { setSignupName(e.target.value); clearFieldErr('signupName'); }} className={errors.signupName ? 'has-error' : ''} />
                  </div>
                  <span className="err">{errors.signupName || ''}</span>
                </div>

                <div className="field">
                  <label htmlFor="signupEmail">Email address</label>
                  <div className="input-wrapper">
                    <input id="signupEmail" type="email" placeholder="you@example.com" autoComplete="email" value={signupEmail} onChange={e => { setSignupEmail(e.target.value); clearFieldErr('signupEmail'); }} className={errors.signupEmail ? 'has-error' : ''} />
                  </div>
                  <span className="err">{errors.signupEmail || ''}</span>
                </div>

                <div className="field">
                  <label htmlFor="signupPassword">Password</label>
                  <div className="input-wrapper">
                    <input id="signupPassword" type={showPw.signup ? 'text' : 'password'} placeholder="At least 6 characters" autoComplete="new-password" value={signupPassword} onChange={e => { setSignupPassword(e.target.value); clearFieldErr('signupPassword'); }} className={errors.signupPassword ? 'has-error' : ''} />
                    <button type="button" className="pw-toggle" aria-label="Show password" onClick={() => togglePw('signup')}>
                      <i className={`fa-regular ${showPw.signup ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                  <div className="strength-wrapper">
                    <div className="strength-bar-container">
                      <div className="strength-bar-fill" style={{ width: pwStrength.w, backgroundColor: pwStrength.c }} />
                    </div>
                    <span className="strength-text" style={{ color: signupPassword ? pwStrength.c : 'var(--muted)' }}>{pwStrength.l}</span>
                  </div>
                  <span className="err">{errors.signupPassword || ''}</span>
                </div>

                <div className="field">
                  <label htmlFor="signupConfirmPassword">Confirm Password</label>
                  <div className="input-wrapper">
                    <input id="signupConfirmPassword" type={showPw.confirm ? 'text' : 'password'} placeholder="Re-enter password" autoComplete="new-password" value={signupConfirmPassword} onChange={e => { setSignupConfirmPassword(e.target.value); clearFieldErr('signupConfirm'); }} className={pwMatchErr ? 'has-error' : ''} />
                    <button type="button" className="pw-toggle" aria-label="Show password" onClick={() => togglePw('confirm')}>
                      <i className={`fa-regular ${showPw.confirm ? 'fa-eye-slash' : 'fa-eye'}`} />
                    </button>
                  </div>
                  <span className="err">{pwMatchErr ? 'Passwords do not match.' : errors.signupConfirm || ''}</span>
                </div>

                <div className="action-row">
                  <label className="checkbox-label-wrapper">
                    <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
                    <span>I agree to the <a href="#" className="inline-link" onClick={e => e.preventDefault()}>Terms &amp; Conditions</a></span>
                  </label>
                </div>

                <button className="btn" type="submit" disabled={btnLoading('signup')}>
                  {btnLoading('signup') ? <><span className="spinner" />Processing...</> : 'Create Account'}
                </button>

                <div className="divider">or sign up with</div>

                <button type="button" className="btn-social" onClick={handleGoogleLogin} disabled={btnLoading('signup')}>
                  <GoogleIcon />
                  <span>Sign up with Google</span>
                </button>

                <footer className="auth-footer">
                  <span>Already have an account? </span>
                  <button type="button" className="inline-link" onClick={() => switchMode('login')}>Sign in here</button>
                </footer>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
