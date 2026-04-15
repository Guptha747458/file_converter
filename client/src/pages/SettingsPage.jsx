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
    Camera
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './SettingsPage.css';

const SECTIONS = [
    { id: 'General', icon: Settings },
    { id: 'Conversion', icon: RefreshCw },
    { id: 'Storage', icon: HardDrive },
    { id: 'Notifications', icon: Bell },
    { id: 'Account', icon: User },
    { id: 'Advanced', icon: Zap }
];

export default function SettingsPage() {
    const [activeSection, setActiveSection] = useState('General');
    const { theme, setDark, setLight } = useTheme();
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
        name: 'HAI',
        email: 'hai@example.com',
        plan: 'Pro',
        twoFactor: false,
        autoUpdate: true,
        debugMode: false,
        clearOnExit: false,
    });

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
                    <div className="settings-group__title">Storage Overview</div>
                    <div className="storage-overview">
                        <div className="storage-overview__bar-wrap">
                            <div className="storage-overview__bar">
                                <div className="storage-overview__fill" style={{ width: '68%' }} />
                            </div>
                            <div className="storage-overview__labels">
                                <span>3.4 GB used</span>
                                <span>{settings.storageLimit} GB total</span>
                            </div>
                        </div>
                        <div className="storage-overview__types">
                            {[
                                { label: 'Images', pct: 45, color: '#7c5cfc' },
                                { label: 'Videos', pct: 30, color: '#f59e0b' },
                                { label: 'Docs', pct: 15, color: '#00d4ff' },
                                { label: 'Audio', pct: 10, color: '#22d3a0' },
                            ].map(t => (
                                <div key={t.label} className="storage-type">
                                    <span className="storage-type__dot" style={{ background: t.color }} />
                                    <span className="storage-type__label">{t.label}</span>
                                    <span className="storage-type__pct">{t.pct}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="settings-divider" />
                    <div className="settings-group__title">Management</div>
                    <Slider settingKey="storageLimit" label="Storage Limit" desc="Set your personal storage quota" min={1} max={100} unit="GB" />
                    <Toggle settingKey="clearOnExit" label="Clear Temp Files on Exit" desc="Remove temporary conversion files when closing" />
                    <div className="settings-divider" />
                    <button className="danger-btn"><Trash2 size={16} style={{ marginRight: '8px' }} /> Clear All History &amp; Files</button>
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
                <div className="settings-group">
                    <div className="settings-group__title">Profile</div>
                    <div className="account-avatar-row">
                        <div className="account-avatar">
                            <User size={32} />
                        </div>
                        <button className="hist-btn hist-btn--outline" style={{ fontSize: '0.78rem' }}>
                            <Camera size={14} style={{ marginRight: '6px' }} /> Change Photo
                        </button>
                    </div>
                    <div className="setting-row">
                        <div className="setting-row__info">
                            <p className="setting-row__label">Display Name</p>
                        </div>
                        <input className="settings-input" value={settings.name} onChange={e => set('name', e.target.value)} />
                    </div>
                    <div className="setting-row">
                        <div className="setting-row__info">
                            <p className="setting-row__label">Email Address</p>
                        </div>
                        <input className="settings-input" value={settings.email} onChange={e => set('email', e.target.value)} />
                    </div>
                    <div className="settings-divider" />
                    <div className="settings-group__title">Security</div>
                    <Toggle settingKey="twoFactor" label="Two-Factor Authentication" desc="Add an extra layer of security to your account" />
                    <div className="setting-row">
                        <div className="setting-row__info">
                            <p className="setting-row__label">Current Plan</p>
                            <p className="setting-row__desc">Your subscription tier</p>
                        </div>
                        <span className="plan-badge">{settings.plan}</span>
                    </div>
                    <div className="settings-divider" />
                    <button className="danger-btn"><AlertTriangle size={16} style={{ marginRight: '8px' }} /> Delete Account</button>
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
