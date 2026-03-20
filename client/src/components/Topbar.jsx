import './Topbar.css';

const tools = [
    { label: 'Image', icon: '🖼' },
    { label: 'PDF', icon: '📄' },
    { label: 'Audio', icon: '🎵' },
    { label: 'Video', icon: '🎬' },
    { label: 'Archive', icon: '📦' },
];

export default function Topbar({ activeNav, toggleTheme, theme }) {
    const pageTitles = {
        dashboard: 'Dashboard',
        convert: 'Convert Files',
        history: 'Conversion History',
        formats: 'Supported Formats',
        settings: 'Settings',
    };

    const isDark = theme === 'dark';

    return (
        <header className="topbar">
            <div className="topbar__left">
                <div className="topbar__page-info">
                    <h1 className="topbar__page-title">{pageTitles[activeNav] || 'Dashboard'}</h1>
                    <p className="topbar__page-sub">
                        Welcome back, HAI ·{' '}
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
            </div>

            <div className="topbar__tools">
                {tools.map(t => (
                    <button key={t.label} className="topbar__tool-btn" title={`Convert ${t.label}`}>
                        <span className="topbar__tool-icon">{t.icon}</span>
                        <span className="topbar__tool-label">{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="topbar__right">
                {/* Search */}
                <div className="topbar__search">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="topbar__search-icon">
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        id="topbar-search"
                        className="topbar__search-input"
                        type="search"
                        placeholder="Search formats, files..."
                        aria-label="Search"
                    />
                </div>

                {/* Notification button */}
                <button id="notifications-btn" className="topbar__icon-btn topbar__notif" aria-label="Notifications">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 01-3.46 0" />
                    </svg>
                    <span className="topbar__notif-badge">3</span>
                </button>

                {/* Theme toggle */}
                <button
                    id="theme-toggle-btn"
                    className={`topbar__icon-btn topbar__theme-btn ${isDark ? 'topbar__theme-btn--dark' : 'topbar__theme-btn--light'}`}
                    onClick={toggleTheme}
                    aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                    title={isDark ? 'Light Mode' : 'Dark Mode'}
                >
                    {isDark ? (
                        /* Sun icon = switch to light */
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="5" />
                            <line x1="12" y1="1" x2="12" y2="3" />
                            <line x1="12" y1="21" x2="12" y2="23" />
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                            <line x1="1" y1="12" x2="3" y2="12" />
                            <line x1="21" y1="12" x2="23" y2="12" />
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                    ) : (
                        /* Moon icon = switch to dark */
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                        </svg>
                    )}
                    <span className="topbar__theme-label">{isDark ? 'Light' : 'Dark'}</span>
                </button>
            </div>
        </header>
    );
}
