import { useState, useEffect } from 'react';
import { 
    LayoutDashboard, 
    RefreshCw, 
    Layers, 
    Clock, 
    Settings, 
    ChevronLeft, 
    ChevronRight,
    Box
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchStats } from '../utils/api';
import './Sidebar.css';

const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'convert', icon: <RefreshCw size={20} />, label: 'Convert' },
    { id: 'formats', icon: <Layers size={20} />, label: 'Formats' },
    { id: 'history', icon: <Clock size={20} />, label: 'History' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
];

export default function Sidebar({ activeNav, setActiveNav, collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
    const { user } = useAuth();
    const [counts, setCounts] = useState({ Image: 0, Document: 0, Audio: 0, Video: 0 });

    useEffect(() => {
        fetchStats()
            .then(data => {
                if (data.byType) setCounts(data.byType);
            })
            .catch(() => {});
    }, [activeNav]); // Refresh when navigating (e.g. back from conversion)

    const formatBadges = [
        { label: 'Images', color: '#7c5cfc', count: counts.Image || 0 },
        { label: 'Docs', color: '#00d4ff', count: counts.Document || 0 },
        { label: 'Audio', color: '#22d3a0', count: counts.Audio || 0 },
        { label: 'Video', color: '#f59e0b', count: counts.Video || 0 },
    ];

    const displayName = user?.name
        ? user.name.charAt(0).toUpperCase() + user.name.slice(1)
        : 'User';
    const avatarInitial = displayName.charAt(0).toUpperCase();

    return (
        <aside className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}${mobileOpen ? ' sidebar--mobile-open' : ''}`}>
            {/* Logo */}
            <div className="sidebar__logo">
                <div className="sidebar__logo-icon">
                    <Box size={24} color="#7c5cfc" />
                </div>
                {!collapsed && (
                    <div className="sidebar__logo-text">
                        <span className="sidebar__logo-name">FileForge</span>
                        <span className="sidebar__logo-tagline">Universal Converter</span>
                    </div>
                )}
                <button
                    className="sidebar__collapse-btn"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label="Toggle sidebar"
                    title={collapsed ? 'Expand' : 'Collapse'}
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            {/* Nav */}
            <nav className="sidebar__nav">
                {!collapsed && <span className="sidebar__section-label">Menu</span>}
                {navItems.map(item => (
                    <button
                        key={item.id}
                        id={`nav-${item.id}`}
                        className={`sidebar__nav-item ${activeNav === item.id ? 'sidebar__nav-item--active' : ''}`}
                        onClick={() => setActiveNav(item.id)}
                        title={collapsed ? item.label : ''}
                    >
                        <span className="sidebar__nav-icon">{item.icon}</span>
                        {!collapsed && <span className="sidebar__nav-label">{item.label}</span>}
                        {activeNav === item.id && !collapsed && <span className="sidebar__nav-indicator" />}
                    </button>
                ))}
            </nav>

            {/* Format badges */}
            {!collapsed && (
                <div className="sidebar__formats">
                    <span className="sidebar__section-label">File Types</span>
                    {formatBadges.map(f => (
                        <div key={f.label} className="sidebar__format-item">
                            <div className="sidebar__format-dot" style={{ background: f.color }} />
                            <span className="sidebar__format-label">{f.label}</span>
                            <span className="sidebar__format-count">{f.count}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* User — click to go to Account page */}
            <button
                className="sidebar__user"
                onClick={() => setActiveNav('account')}
                title="View Account"
                id="sidebar-account-btn"
            >
                <div className="sidebar__user-avatar">{avatarInitial}</div>
                {!collapsed && (
                    <div className="sidebar__user-info">
                        <span className="sidebar__user-name">{displayName}</span>
                        <span className="sidebar__user-plan">Free Account</span>
                    </div>
                )}
            </button>
        </aside>
    );
}
