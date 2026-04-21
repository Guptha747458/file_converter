import { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Box, Zap, Layers, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { loginUser, signupUser } from '../utils/api';
import '../pages/Auth.css';

// ---- Helpers ----
function getPasswordStrength(password) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return 'weak';
  if (score === 2) return 'fair';
  if (score === 3) return 'good';
  return 'strong';
}

const strengthMeta = {
  weak:   { label: 'Weak',   bars: 1 },
  fair:   { label: 'Fair',   bars: 2 },
  good:   { label: 'Good',   bars: 3 },
  strong: { label: 'Strong', bars: 4 },
};

function PasswordStrengthBar({ password }) {
  const strength = getPasswordStrength(password);
  if (!strength) return null;
  const { label, bars } = strengthMeta[strength];
  return (
    <div className="auth-strength">
      <div className="auth-strength__bars">
        {[1, 2, 3, 4].map(n => (
          <div
            key={n}
            className={`auth-strength__bar ${n <= bars ? `auth-strength__bar--${strength}` : ''}`}
          />
        ))}
      </div>
      <span className={`auth-strength__label auth-strength__label--${strength}`}>{label} password</span>
    </div>
  );
}

// ---- Google SVG icon ----
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ---- GitHub SVG icon ----
function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
    </svg>
  );
}

// ---- Login Form ----
function LoginForm({ onSuccess }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setAlert(null);
    try {
        const res = await loginUser({ email: form.email, password: form.password });
        login(res.user);
        onSuccess?.();
    } catch (err) {
        if (err.error === 'USER_NOT_FOUND') {
            setAlert({ type: 'warning', msg: err.message });
        } else {
            setAlert({ type: 'danger', msg: err.error || 'Login failed' });
        }
    } finally {
        setLoading(false);
    }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="auth-card">
        {alert && (
          <div className={`auth-alert auth-alert--${alert.type}`}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {alert.msg}
          </div>
        )}

        {/* Email */}
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="login-email">Email Address</label>
          <div className="auth-field__input-wrap">
            <span className="auth-field__icon"><Mail size={16} /></span>
            <input
              id="login-email"
              type="email"
              className="auth-field__input"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
          </div>
          {errors.email && <span className="auth-field__error"><AlertCircle size={13} />{errors.email}</span>}
        </div>

        {/* Password */}
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="login-password">Password</label>
          <div className="auth-field__input-wrap">
            <span className="auth-field__icon"><Lock size={16} /></span>
            <input
              id="login-password"
              type={showPw ? 'text' : 'password'}
              className="auth-field__input"
              placeholder="Enter your password"
              value={form.password}
              onChange={set('password')}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="auth-field__eye"
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <span className="auth-field__error"><AlertCircle size={13} />{errors.password}</span>}
        </div>

        {/* Extras */}
        <div className="auth-extras">
          <label className="auth-checkbox">
            <input type="checkbox" checked={form.remember} onChange={set('remember')} />
            Remember me
          </label>
          <button type="button" className="auth-forgot">Forgot password?</button>
        </div>

        <button id="login-submit-btn" type="submit" className="auth-btn" disabled={loading}>
          {loading ? <span className="auth-btn__spinner" /> : null}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>

        <div className="auth-divider">or continue with</div>

        <div className="auth-socials">
          <button type="button" className="auth-social-btn" id="login-google-btn">
            <GoogleIcon /> Google
          </button>
          <button type="button" className="auth-social-btn" id="login-github-btn">
            <GitHubIcon /> GitHub
          </button>
        </div>
      </div>
    </form>
  );
}

// ---- Signup Form ----
function SignupForm({ onSuccess }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Full name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 8) errs.password = 'Must be at least 8 characters';
    if (!form.confirm) errs.confirm = 'Please confirm your password';
    else if (form.confirm !== form.password) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    setAlert(null);
    try {
        const res = await signupUser({ name: form.name, email: form.email, password: form.password });
        login(res.user);
        onSuccess?.();
    } catch (err) {
        setAlert({ type: 'danger', msg: err.error || 'Signup failed' });
    } finally {
        setLoading(false);
    }
  };

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="auth-card">
        {alert && (
          <div className={`auth-alert auth-alert--${alert.type}`}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            {alert.msg}
          </div>
        )}

        {/* Name */}
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="signup-name">Full Name</label>
          <div className="auth-field__input-wrap">
            <span className="auth-field__icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              id="signup-name"
              type="text"
              className="auth-field__input"
              placeholder="John Doe"
              value={form.name}
              onChange={set('name')}
              autoComplete="name"
            />
          </div>
          {errors.name && <span className="auth-field__error"><AlertCircle size={13} />{errors.name}</span>}
        </div>

        {/* Email */}
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="signup-email">Email Address</label>
          <div className="auth-field__input-wrap">
            <span className="auth-field__icon"><Mail size={16} /></span>
            <input
              id="signup-email"
              type="email"
              className="auth-field__input"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              autoComplete="email"
            />
          </div>
          {errors.email && <span className="auth-field__error"><AlertCircle size={13} />{errors.email}</span>}
        </div>

        {/* Password */}
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="signup-password">Password</label>
          <div className="auth-field__input-wrap">
            <span className="auth-field__icon"><Lock size={16} /></span>
            <input
              id="signup-password"
              type={showPw ? 'text' : 'password'}
              className="auth-field__input"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-field__eye"
              onClick={() => setShowPw(v => !v)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <span className="auth-field__error"><AlertCircle size={13} />{errors.password}</span>}
          {form.password && <PasswordStrengthBar password={form.password} />}
        </div>

        {/* Confirm Password */}
        <div className="auth-field">
          <label className="auth-field__label" htmlFor="signup-confirm">Confirm Password</label>
          <div className="auth-field__input-wrap">
            <span className="auth-field__icon"><Lock size={16} /></span>
            <input
              id="signup-confirm"
              type={showConfirm ? 'text' : 'password'}
              className="auth-field__input"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={set('confirm')}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="auth-field__eye"
              onClick={() => setShowConfirm(v => !v)}
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirm && <span className="auth-field__error"><AlertCircle size={13} />{errors.confirm}</span>}
        </div>

        <button id="signup-submit-btn" type="submit" className="auth-btn" disabled={loading}>
          {loading ? <span className="auth-btn__spinner" /> : null}
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <div className="auth-divider">or sign up with</div>

        <div className="auth-socials">
          <button type="button" className="auth-social-btn" id="signup-google-btn">
            <GoogleIcon /> Google
          </button>
          <button type="button" className="auth-social-btn" id="signup-github-btn">
            <GitHubIcon /> GitHub
          </button>
        </div>

        <p className="auth-terms">
          By creating an account you agree to our{' '}
          <a href="#terms">Terms of Service</a> and{' '}
          <a href="#privacy">Privacy Policy</a>.
        </p>
      </div>
    </form>
  );
}

// ---- Main Auth Page ----
export default function AuthPage({ defaultTab = 'login', onAuthenticated }) {
  const [tab, setTab] = useState(defaultTab);

  return (
    <div className="auth-page">
      {/* Hero panel */}
      <div className="auth-hero">
        <div className="auth-hero__logo">
          <div className="auth-hero__logo-icon">
            <Box size={22} color="#fff" />
          </div>
          <span className="auth-hero__logo-name">FileForge</span>
        </div>

        <div className="auth-hero__content">
          <div className="auth-hero__badge">
            <span className="auth-hero__badge-dot" />
            Universal File Converter
          </div>

          <h1 className="auth-hero__title">
            Convert any file<br />
            <span>in seconds</span>
          </h1>

          <p className="auth-hero__desc">
            Instantly convert images, documents, audio, video, and archives with
            professional-grade quality — no limits, no watermarks.
          </p>

          <div className="auth-hero__features">
            {[
              { icon: <Zap size={15} />, text: '200+ supported formats' },
              { icon: <Layers size={15} />, text: 'Batch conversion built-in' },
              { icon: <Clock size={15} />, text: 'Full conversion history' },
            ].map(f => (
              <div className="auth-hero__feature" key={f.text}>
                <div className="auth-hero__feature-icon">{f.icon}</div>
                {f.text}
              </div>
            ))}
          </div>

          <div className="auth-hero__formats">
            {[
              { label: 'JPG', color: '#7c5cfc', bg: 'rgba(124,92,252,0.15)' },
              { label: 'PNG', color: '#7c5cfc', bg: 'rgba(124,92,252,0.15)' },
              { label: 'PDF', color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
              { label: 'DOCX', color: '#00d4ff', bg: 'rgba(0,212,255,0.12)' },
              { label: 'MP4', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
              { label: 'MP3', color: '#22d3a0', bg: 'rgba(34,211,160,0.12)' },
              { label: 'ZIP', color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
              { label: 'SVG', color: '#ff9f43', bg: 'rgba(255,159,67,0.12)' },
            ].map(f => (
              <span
                key={f.label}
                className="auth-hero__format-chip"
                style={{ color: f.color, background: f.bg, borderColor: f.color + '44' }}
              >
                {f.label}
              </span>
            ))}
          </div>
        </div>

        <div className="auth-hero__stats">
          {[
            { value: '10M+', label: 'Files Converted' },
            { value: '200+', label: 'Formats' },
            { value: '99.9%', label: 'Uptime' },
          ].map(s => (
            <div className="auth-hero__stat" key={s.label}>
              <span className="auth-hero__stat-value">{s.value}</span>
              <span className="auth-hero__stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form__header">
            {/* Mobile logo */}
            <div className="auth-form__mobile-logo">
              <div className="auth-form__mobile-logo-icon">
                <Box size={20} color="#fff" />
              </div>
              <span className="auth-form__mobile-logo-name">FileForge</span>
            </div>

            <h2 className="auth-form__title">
              {tab === 'login' ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="auth-form__subtitle">
              {tab === 'login'
                ? 'Sign in to access your FileForge dashboard'
                : 'Join millions of users converting files effortlessly'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="auth-tabs" role="tablist">
            <button
              id="tab-login"
              role="tab"
              aria-selected={tab === 'login'}
              className={`auth-tab ${tab === 'login' ? 'auth-tab--active' : ''}`}
              onClick={() => setTab('login')}
            >
              Sign In
            </button>
            <button
              id="tab-signup"
              role="tab"
              aria-selected={tab === 'signup'}
              className={`auth-tab ${tab === 'signup' ? 'auth-tab--active' : ''}`}
              onClick={() => setTab('signup')}
            >
              Sign Up
            </button>
          </div>

          {tab === 'login'
            ? <LoginForm onSuccess={onAuthenticated} />
            : <SignupForm onSuccess={onAuthenticated} />
          }
        </div>
      </div>
    </div>
  );
}
