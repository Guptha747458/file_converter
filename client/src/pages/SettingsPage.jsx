import { useState } from 'react';
import {
    Settings,
    RefreshCw,
    HardDrive,
    Bell,
    User,
    Zap,
    Save,
    Trash2,
    AlertTriangle,
    Download,
    Upload,
    RotateCcw,
    Camera,
    Lock,
    Eye,
    EyeOff,
    Shield,
    CreditCard,
    Monitor,
    Smartphone,
    LogOut,
    CheckCircle2,
    XCircle,
    ChevronRight,
    Mail,
    Phone,
    Globe,
    Edit3,
    Star,
    Cpu,
    Clock,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import './SettingsPage.css';

const SECTIONS = [
    { id: 'General', icon: Settings },
    { id: 'Conversion', icon: RefreshCw },
    { id: 'Storage', icon: HardDrive },
    { id: 'Notifications', icon: Bell },
    { id: 'Account', icon: User },
    { id: 'Advanced', icon: Zap }
];

// ─── Password strength helper ──────────────────────────────────
function getPwStrength(pw) {
    if (!pw) return null;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return 'weak';
    if (score === 2) return 'fair';
    if (score === 3) return 'good';
    return 'strong';
}
const PW_META = {
    weak:   { label: 'Weak',   bars: 1, color: '#f43f5e' },
    fair:   { label: 'Fair',   bars: 2, color: '#f59e0b' },
    good:   { label: 'Good',   bars: 3, color: '#22d3a0' },
    strong: { label: 'Strong', bars: 4, color: '#7c5cfc' },
};

function StrengthBar({ password }) {
    const s = getPwStrength(password);
    if (!s) return null;
    const { label, bars, color } = PW_META[s];
    return (
        <div className="acc-pw-strength">
            {[1, 2, 3, 4].map(n => (
                <div
                    key={n}
                    className="acc-pw-strength__bar"
                    style={{ background: n <= bars ? color : undefined }}
                />
            ))}
            <span className="acc-pw-strength__label" style={{ color }}>{label}</span>
        </div>
    );
}

// ─── Google & GitHub SVG icons ─────────────────────────────────
function GoogleSVG() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
    );
}
function GitHubSVG() {
    return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
    );
}

// ─── Delete-account confirmation modal ────────────────────────
function DeleteModal({ name, onConfirm, onCancel }) {
    const [typed, setTyped] = useState('');
    const confirmed = typed === name;
    return (
        <div className="acc-modal-overlay" onClick={onCancel}>
            <div className="acc-modal" onClick={e => e.stopPropagation()}>
                <div className="acc-modal__icon"><AlertTriangle size={28} /></div>
                <h3 className="acc-modal__title">Delete your account?</h3>
                <p className="acc-modal__body">
                    This will permanently erase all your files, history, and settings. This cannot be undone.
                </p>
                <p className="acc-modal__hint">Type <strong>{name}</strong> to confirm:</p>
                <input
                    className="acc-modal__input"
                    value={typed}
                    onChange={e => setTyped(e.target.value)}
                    placeholder={name}
                    id="delete-confirm-input"
                    autoFocus
                />
                <div className="acc-modal__actions">
                    <button className="hist-btn hist-btn--outline" onClick={onCancel}>Cancel</button>
                    <button
                        className="danger-btn"
                        disabled={!confirmed}
                        onClick={onConfirm}
                        id="delete-account-confirm-btn"
                    >
                        <Trash2 size={14} style={{ marginRight: 6 }} /> Delete permanently
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState('General');
    const { theme, setDark, setLight } = useTheme();
    const { user } = useAuth();

    // Derive display name + initials from auth or fallback
    const displayName = user?.name || 'HAI';
    const displayEmail = user?.email || 'hai@example.com';
    const initials = displayName
        .split(' ')
        .map(w => w[0]?.toUpperCase())
        .slice(0, 2)
        .join('');

    const [settings, setSettings] = useState({
        theme: theme === 'dark' ? 'Dark' : 'Light',
        language: 'English',
        autoDownload: true,
        keepOriginal: true,
        defaultQuality: 'high',
        defaultFormat: 'PNG',
        compressionLevel: 7,
        maxFileSize: 500,
        storageLimit: 5,
        notifyEmail: true,
        notifyBrowser: true,
        notifyOnComplete: true,
        notifyOnError: true,
        autoUpdate: true,
        debugMode: false,
        clearOnExit: false,
    });

    // Account-specific state
    const [profile, setProfile] = useState({
        name: displayName,
        email: displayEmail,
        phone: '',
        bio: '',
        website: '',
    });
    const [profileSaved, setProfileSaved] = useState(false);

    const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
    const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });
    const [pwError, setPwError] = useState('');
    const [pwSaved, setPwSaved] = useState(false);

    const [twoFactor, setTwoFactor] = useState(false);
    const [googleConnected, setGoogleConnected] = useState(false);
    const [githubConnected, setGithubConnected] = useState(true);

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const toggle = (key) => setSettings(s => ({ ...s, [key]: !s[key] }));
    const set = (key, val) => {
        setSettings(s => ({ ...s, [key]: val }));
        if (key === 'theme') {
            if (val === 'Dark') setDark();
            else if (val === 'Light') setLight();
            else {
                // System preference
                if (window.matchMedia('(prefers-color-scheme: light)').matches) setLight();
                else setDark();
            }
        }
    };

    const Toggle = ({ settingKey, label, desc }) => (
        <div className="setting-row">
            <div className="setting-row__info">
                <p className="setting-row__label">{label}</p>
                {desc && <p className="setting-row__desc">{desc}</p>}
            </div>
            <button
                className={`toggle-switch ${settings[settingKey] ? 'toggle-switch--on' : ''}`}
                onClick={() => toggle(settingKey)}
                role="switch"
                aria-checked={settings[settingKey]}
            >
                <span className="toggle-switch__thumb" />
            </button>
        </div>
    );

    const Select = ({ settingKey, label, desc, options }) => (
        <div className="setting-row">
            <div className="setting-row__info">
                <p className="setting-row__label">{label}</p>
                {desc && <p className="setting-row__desc">{desc}</p>}
            </div>
            <select
                className="settings-select"
                value={settings[settingKey]}
                onChange={e => set(settingKey, e.target.value)}
            >
                {options.map(o => <option key={o}>{o}</option>)}
            </select>
        </div>
    );

    const Slider = ({ settingKey, label, desc, min, max, unit }) => (
        <div className="setting-row setting-row--col">
            <div className="setting-row__info">
                <p className="setting-row__label">{label} <span className="setting-row__value">{settings[settingKey]} {unit}</span></p>
                {desc && <p className="setting-row__desc">{desc}</p>}
            </div>
            <input
                type="range" min={min} max={max}
                value={settings[settingKey]}
                onChange={e => set(settingKey, +e.target.value)}
                className="settings-range"
            />
        </div>
    );

    const renderSection = () => {
        switch (activeSection) {
            case 'General': return (
                <div className="settings-group">
                    <div className="settings-group__title">Appearance</div>
                    <Select settingKey="theme" label="Theme" desc="Choose your preferred color scheme" options={['Dark', 'Light', 'System']} />
                    <Select settingKey="language" label="Language" desc="Interface display language" options={['English', 'Spanish', 'French', 'German', 'Japanese']} />
                    <div className="settings-divider" />
                    <div className="settings-group__title">Behavior</div>
                    <Toggle settingKey="autoDownload" label="Auto-Download" desc="Automatically start downloading after conversion completes" />
                    <Toggle settingKey="keepOriginal" label="Keep Original Files" desc="Retain original files after conversion" />
                </div>
            );
            case 'Conversion': return (
                <div className="settings-group">
                    <div className="settings-group__title">Output Defaults</div>
                    <Select settingKey="defaultQuality" label="Default Quality" desc="Quality level applied to new conversions" options={['Low', 'Medium', 'High']} />
                    <Select settingKey="defaultFormat" label="Default Output Format" desc="Pre-selected output format" options={['PNG', 'JPG', 'WEBP', 'PDF', 'DOCX', 'MP3', 'MP4']} />
                    <div className="settings-divider" />
                    <div className="settings-group__title">Limits</div>
                    <Slider settingKey="compressionLevel" label="Compression Level" desc="Higher compression = smaller file but slower conversion" min={1} max={10} unit="/10" />
                    <Slider settingKey="maxFileSize" label="Max File Size" desc="Maximum size per upload" min={50} max={2000} unit="MB" />
                </div>
            );
            case 'Storage': return (
                <div className="settings-group">
                    <div className="settings-group__title">Management</div>
                    <Toggle settingKey="clearOnExit" label="Clear Temp Files on Exit" desc="Remove temporary conversion files when closing" />
                    <div className="settings-divider" />
                    <button 
                        className="danger-btn"
                        onClick={async () => {
                            if (window.confirm('Are you sure you want to delete ALL history and files? This cannot be undone.')) {
                                try {
                                    await fetch('/api/history', { method: 'DELETE' });
                                    alert('History cleared successfully!');
                                } catch (err) {
                                    alert('Failed to clear history.');
                                }
                            }
                        }}
                    >
                        <Trash2 size={16} style={{ marginRight: '8px' }} /> Clear All History &amp; Files
                    </button>
                </div>
            );
            case 'Notifications': return (
                <div className="settings-group">
                    <div className="settings-group__title">Channels</div>
                    <Toggle settingKey="notifyEmail" label="Email Notifications" desc="Send conversion results to your email" />
                    <Toggle settingKey="notifyBrowser" label="Browser Notifications" desc="Display browser push notifications" />
                    <div className="settings-divider" />
                    <div className="settings-group__title">Triggers</div>
                    <Toggle settingKey="notifyOnComplete" label="Notify on Complete" desc="Alert when a conversion finishes" />
                    <Toggle settingKey="notifyOnError" label="Notify on Error" desc="Alert when a conversion fails" />
                </div>
            );
            case 'Account': return (
                <div className="acc-page">

                    {/* ── Profile Card ── */}
                    <div className="acc-card">
                        <div className="acc-card__head">
                            <div className="acc-avatar">
                                <span className="acc-avatar__initials">{initials}</span>
                                <button className="acc-avatar__cam" title="Change photo" id="change-photo-btn">
                                    <Camera size={13} />
                                </button>
                            </div>
                            <div>
                                <p className="acc-card__name">{profile.name || 'Your Name'}</p>
                                <p className="acc-card__email">{profile.email}</p>
                                <span className="plan-badge plan-badge--free" style={{ marginTop: 6, display: 'inline-block' }}>
                                    Free Account
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── Profile Details ── */}
                    <div className="acc-card">
                        <div className="acc-card__section-title"><Edit3 size={14} /> Edit Profile</div>
                        <div className="acc-fields">
                            <div className="acc-field">
                                <label className="acc-field__label" htmlFor="acc-name">
                                    <User size={13} /> Display Name
                                </label>
                                <input
                                    id="acc-name"
                                    className="acc-field__input"
                                    placeholder="Your full name"
                                    value={profile.name}
                                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                                />
                            </div>
                            <div className="acc-field">
                                <label className="acc-field__label" htmlFor="acc-email">
                                    <Mail size={13} /> Email Address
                                </label>
                                <input
                                    id="acc-email"
                                    type="email"
                                    className="acc-field__input"
                                    placeholder="you@example.com"
                                    value={profile.email}
                                    onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                                />
                            </div>
                            <div className="acc-field">
                                <label className="acc-field__label" htmlFor="acc-phone">
                                    <Phone size={13} /> Phone
                                </label>
                                <input
                                    id="acc-phone"
                                    type="tel"
                                    className="acc-field__input"
                                    placeholder="+1 (555) 000-0000"
                                    value={profile.phone}
                                    onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                            <div className="acc-field acc-field--full">
                                <label className="acc-field__label" htmlFor="acc-bio">
                                    <Edit3 size={13} /> Bio
                                </label>
                                <textarea
                                    id="acc-bio"
                                    className="acc-field__input acc-field__textarea"
                                    placeholder="A short bio about yourself…"
                                    rows={3}
                                    value={profile.bio}
                                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                                />
                            </div>
                            <div className="acc-field">
                                <label className="acc-field__label" htmlFor="acc-website">
                                    <Globe size={13} /> Website
                                </label>
                                <input
                                    id="acc-website"
                                    type="url"
                                    className="acc-field__input"
                                    placeholder="https://yoursite.com"
                                    value={profile.website}
                                    onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="acc-card__footer">
                            {profileSaved && (
                                <span className="acc-saved-badge">
                                    <CheckCircle2 size={14} /> Saved!
                                </span>
                            )}
                            <button
                                id="save-profile-btn"
                                className="hist-btn hist-btn--primary"
                                onClick={() => {
                                    setProfileSaved(true);
                                    setTimeout(() => setProfileSaved(false), 2500);
                                }}
                            >
                                <Save size={14} style={{ marginRight: 6 }} /> Save Profile
                            </button>
                        </div>
                    </div>

                    {/* ── Password Change ── */}
                    <div className="acc-card">
                        <div className="acc-card__section-title"><Lock size={14} /> Change Password</div>
                        <div className="acc-fields">
                            <div className="acc-field acc-field--full">
                                <label className="acc-field__label" htmlFor="acc-pw-current">Current Password</label>
                                <div className="acc-pw-wrap">
                                    <input
                                        id="acc-pw-current"
                                        type={showPw.current ? 'text' : 'password'}
                                        className="acc-field__input"
                                        placeholder="Enter current password"
                                        value={pwForm.current}
                                        onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
                                    />
                                    <button
                                        type="button"
                                        className="acc-pw-toggle"
                                        onClick={() => setShowPw(s => ({ ...s, current: !s.current }))}
                                        aria-label="toggle visibility"
                                    >
                                        {showPw.current ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                            <div className="acc-field">
                                <label className="acc-field__label" htmlFor="acc-pw-new">New Password</label>
                                <div className="acc-pw-wrap">
                                    <input
                                        id="acc-pw-new"
                                        type={showPw.next ? 'text' : 'password'}
                                        className="acc-field__input"
                                        placeholder="Min. 8 characters"
                                        value={pwForm.next}
                                        onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                                    />
                                    <button
                                        type="button"
                                        className="acc-pw-toggle"
                                        onClick={() => setShowPw(s => ({ ...s, next: !s.next }))}
                                        aria-label="toggle visibility"
                                    >
                                        {showPw.next ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                                {pwForm.next && <StrengthBar password={pwForm.next} />}
                            </div>
                            <div className="acc-field">
                                <label className="acc-field__label" htmlFor="acc-pw-confirm">Confirm New Password</label>
                                <div className="acc-pw-wrap">
                                    <input
                                        id="acc-pw-confirm"
                                        type={showPw.confirm ? 'text' : 'password'}
                                        className="acc-field__input"
                                        placeholder="Repeat new password"
                                        value={pwForm.confirm}
                                        onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                                    />
                                    <button
                                        type="button"
                                        className="acc-pw-toggle"
                                        onClick={() => setShowPw(s => ({ ...s, confirm: !s.confirm }))}
                                        aria-label="toggle visibility"
                                    >
                                        {showPw.confirm ? <EyeOff size={15} /> : <Eye size={15} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        {pwError && (
                            <p className="acc-pw-error"><XCircle size={13} /> {pwError}</p>
                        )}
                        <div className="acc-card__footer">
                            {pwSaved && <span className="acc-saved-badge"><CheckCircle2 size={14} /> Password updated!</span>}
                            <button
                                id="update-password-btn"
                                className="hist-btn hist-btn--primary"
                                onClick={() => {
                                    setPwError('');
                                    if (!pwForm.current) { setPwError('Enter your current password.'); return; }
                                    if (pwForm.next.length < 8) { setPwError('New password must be at least 8 characters.'); return; }
                                    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
                                    setPwForm({ current: '', next: '', confirm: '' });
                                    setPwSaved(true);
                                    setTimeout(() => setPwSaved(false), 2500);
                                }}
                            >
                                <Lock size={14} style={{ marginRight: 6 }} /> Update Password
                            </button>
                        </div>
                    </div>

                    {/* ── Plan & Usage ── */}
                    <div className="acc-card">
                        <div className="acc-card__section-title"><CreditCard size={14} /> Account Status</div>
                        <div className="acc-plan-info">
                            <span className="plan-badge plan-badge--free" style={{ fontSize: '0.82rem', padding: '6px 16px' }}>
                                Free Account
                            </span>
                            <p className="acc-plan-renew">Standard processing enabled</p>
                            <ul className="acc-plan-features">
                                {['Unlimited basic conversions', 'Secure temporary storage', 'Automatic logout cleanup'].map(f => (
                                    <li key={f}><CheckCircle2 size={13} className="acc-feature-check" /> {f}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* ── Security ── */}
                    <div className="acc-card">
                        <div className="acc-card__section-title"><Shield size={14} /> Security</div>
                        <div className="setting-row">
                            <div className="setting-row__info">
                                <p className="setting-row__label">Two-Factor Authentication</p>
                                <p className="setting-row__desc">Add an extra layer of protection at sign-in</p>
                            </div>
                            <button
                                id="2fa-toggle-btn"
                                className={`toggle-switch ${twoFactor ? 'toggle-switch--on' : ''}`}
                                onClick={() => setTwoFactor(v => !v)}
                                role="switch"
                                aria-checked={twoFactor}
                            >
                                <span className="toggle-switch__thumb" />
                            </button>
                        </div>
                    </div>

                    {/* ── Connected Accounts ── */}
                    <div className="acc-card">
                        <div className="acc-card__section-title"><Cpu size={14} /> Connected Accounts</div>
                        <div className="acc-connected-list">
                            {[
                                {
                                    id: 'google',
                                    icon: <GoogleSVG />,
                                    label: 'Google',
                                    desc: 'Sign in with your Google account',
                                    connected: googleConnected,
                                    toggle: () => setGoogleConnected(v => !v),
                                },
                                {
                                    id: 'github',
                                    icon: <GitHubSVG />,
                                    label: 'GitHub',
                                    desc: 'Link your GitHub profile',
                                    connected: githubConnected,
                                    toggle: () => setGithubConnected(v => !v),
                                },
                            ].map(acc => (
                                <div key={acc.id} className="acc-connected-item">
                                    <div className="acc-connected-icon">{acc.icon}</div>
                                    <div className="acc-connected-info">
                                        <p className="acc-connected-label">{acc.label}</p>
                                        <p className="acc-connected-desc">{acc.desc}</p>
                                    </div>
                                    <button
                                        id={`${acc.id}-connect-btn`}
                                        className={acc.connected ? 'acc-connect-btn acc-connect-btn--active' : 'acc-connect-btn'}
                                        onClick={acc.toggle}
                                    >
                                        {acc.connected ? <><CheckCircle2 size={13} /> Connected</> : 'Connect'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Active Sessions ── */}
                    <div className="acc-card">
                        <div className="acc-card__section-title"><Monitor size={14} /> Active Sessions</div>
                        <div className="acc-sessions">
                            {[
                                { icon: <Monitor size={18} />, device: 'Windows PC — Chrome', location: 'Hyderabad, IN', time: 'Active now', current: true },
                                { icon: <Smartphone size={18} />, device: 'iPhone 15 — Safari', location: 'Hyderabad, IN', time: '2 hours ago', current: false },
                            ].map((s, i) => (
                                <div key={i} className={`acc-session ${s.current ? 'acc-session--current' : ''}`}>
                                    <div className="acc-session__icon">{s.icon}</div>
                                    <div className="acc-session__info">
                                        <p className="acc-session__device">{s.device} {s.current && <span className="acc-session__badge">This device</span>}</p>
                                        <p className="acc-session__meta">{s.location} · {s.time}</p>
                                    </div>
                                    {!s.current && (
                                        <button
                                            className="acc-session__revoke"
                                            id={`revoke-session-${i}`}
                                            title="Revoke session"
                                        >
                                            <LogOut size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Danger Zone ── */}
                    <div className="acc-card acc-card--danger">
                        <div className="acc-card__section-title" style={{ color: 'var(--clr-danger)' }}>
                            <AlertTriangle size={14} /> Danger Zone
                        </div>
                        <p className="acc-danger-desc">Permanently delete your account and all associated data. This action cannot be undone.</p>
                        <button
                            id="delete-account-btn"
                            className="danger-btn"
                            onClick={() => setShowDeleteModal(true)}
                        >
                            <Trash2 size={14} style={{ marginRight: 6 }} /> Delete Account
                        </button>
                    </div>

                    {showDeleteModal && (
                        <DeleteModal
                            name={profile.name || displayName}
                            onConfirm={() => setShowDeleteModal(false)}
                            onCancel={() => setShowDeleteModal(false)}
                        />
                    )}
                </div>
            );
            case 'Advanced': return (
                <div className="settings-group">
                    <div className="settings-group__title">System</div>
                    <Toggle settingKey="autoUpdate" label="Auto Updates" desc="Automatically update FileForge when new versions are available" />
                    <Toggle settingKey="debugMode" label="Debug Mode" desc="Enable verbose logging for troubleshooting" />
                    <div className="settings-divider" />
                    <div className="settings-group__title">Data</div>
                    <div className="setting-row">
                        <div className="setting-row__info">
                            <p className="setting-row__label">Export Settings</p>
                            <p className="setting-row__desc">Download all your preferences as a JSON file</p>
                        </div>
                        <button className="hist-btn hist-btn--outline" style={{ fontSize: '0.78rem' }}>
                            <Download size={14} style={{ marginRight: '6px' }} /> Export
                        </button>
                    </div>
                    <div className="setting-row">
                        <div className="setting-row__info">
                            <p className="setting-row__label">Import Settings</p>
                            <p className="setting-row__desc">Restore preferences from a backup file</p>
                        </div>
                        <button className="hist-btn hist-btn--outline" style={{ fontSize: '0.78rem' }}>
                            <Upload size={14} style={{ marginRight: '6px' }} /> Import
                        </button>
                    </div>
                    <div className="settings-divider" />
                    <button className="danger-btn"><RotateCcw size={16} style={{ marginRight: '8px' }} /> Reset All Settings to Default</button>
                </div>
            );
            default: return null;
        }
    };

    return (
        <main className="settings-page">
            <div className="settings-page__bg-glow" aria-hidden="true" />

            <div className="settings-page__header">
                <h2 className="settings-page__title">Settings</h2>
                <p className="settings-page__sub">Manage your preferences, account, and application behaviour</p>
            </div>

            <div className="settings-page__body">
                {/* Left: Section Nav */}
                <nav className="settings-nav glass-card">
                    {SECTIONS.map(s => (
                        <button
                            key={s.id}
                            className={`settings-nav__item ${activeSection === s.id ? 'settings-nav__item--active' : ''}`}
                            onClick={() => setActiveSection(s.id)}
                        >
                            <s.icon size={16} style={{ marginRight: '10px' }} />
                            {s.id}
                        </button>
                    ))}
                </nav>

                {/* Right: Content */}
                <div className="settings-content glass-card">
                    <div className="settings-content__title">{activeSection}</div>
                    {renderSection()}
                    <div className="settings-content__footer">
                        <button className="hist-btn hist-btn--outline">Cancel</button>
                        <button className="hist-btn hist-btn--primary">
                            <Save size={16} style={{ marginRight: '8px' }} /> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}
