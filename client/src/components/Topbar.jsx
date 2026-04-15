import { 
    Image as ImageIcon, 
    FileText, 
    Music, 
    Video, 
    Package, 
    Search, 
    Bell, 
    Sun, 
    Moon 
} from 'lucide-react';
import './Topbar.css';

const tools = [
    { label: 'Image', type: 'image' },
    { label: 'PDF', type: 'doc' },
    { label: 'Audio', type: 'audio' },
    { label: 'Video', type: 'video' },
    { label: 'Archive', type: 'archive' },
];

const ICON_MAP = {
    image: <ImageIcon size={16} />,
    doc: <FileText size={16} />,
    audio: <Music size={16} />,
    video: <Video size={16} />,
    archive: <Package size={16} />
};

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
                        <span className="topbar__tool-icon">{ICON_MAP[t.type]}</span>
                        <span className="topbar__tool-label">{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="topbar__right">
                {/* Search */}
                <div className="topbar__search">
                    <Search className="topbar__search-icon" size={15} />
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
                    <Bell size={18} />
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
                        <Sun size={18} />
                    ) : (
                        /* Moon icon = switch to dark */
                        <Moon size={18} />
                    )}
                    <span className="topbar__theme-label">{isDark ? 'Light' : 'Dark'}</span>
                </button>
            </div>
        </header>
    );
}
