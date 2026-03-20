import { useState } from 'react';
import './Sidebar.css';

const navItems = [
    { id: 'dashboard', icon: '⊞', label: 'Dashboard' },
    { id: 'convert', icon: '⇄', label: 'Convert' },
    { id: 'formats', icon: '◈', label: 'Formats' },
    { id: 'history', icon: '◷', label: 'History' },
    { id: 'settings', icon: '⚙', label: 'Settings' },
];

const formatBadges = [
    { label: 'Images', color: '#7c5cfc', count: 12 },
    { label: 'Docs', color: '#00d4ff', count: 8 },
    { label: 'Audio', color: '#22d3a0', count: 5 },
    { label: 'Video', color: '#f59e0b', count: 3 },
];

export default function Sidebar({ activeNav, setActiveNav }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <aside className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}>
            {/* Logo */}
            <div className="sidebar__logo">
                <div className="sidebar__logo-icon">
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <path d="M4 8L14 4L24 8V20L14 24L4 20V8Z" fill="url(#logoGrad)" opacity="0.15" />
                        <path d="M4 8L14 4L24 8" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M14 4V24" stroke="url(#logoGrad)" strokeWidth="1.5" />
                        <path d="M4 8V20L14 24L24 20V8" stroke="url(#logoGrad)" strokeWidth="1.5" strokeLinejoin="round" />
                        <path d="M9 13L13 17L19 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <defs>
                            <linearGradient id="logoGrad" x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                                <stop stopColor="#7c5cfc" />
                                <stop offset="1" stopColor="#00d4ff" />
                            </linearGradient>
                        </defs>
                    </svg>
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
                    {collapsed ? '›' : '‹'}
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

            {/* Storage usage */}
            {!collapsed && (
                <div className="sidebar__storage">
                    <div className="sidebar__storage-header">
                        <span className="sidebar__section-label" style={{ marginBottom: 0 }}>Storage</span>
                        <span className="sidebar__storage-pct">68%</span>
                    </div>
                    <div className="sidebar__storage-bar">
                        <div className="sidebar__storage-fill" style={{ width: '68%' }} />
                    </div>
                    <p className="sidebar__storage-info">3.4 GB of 5 GB used</p>
                </div>
            )}

            {/* User */}
            <div className="sidebar__user">
                <div className="sidebar__user-avatar">H</div>
                {!collapsed && (
                    <div className="sidebar__user-info">
                        <span className="sidebar__user-name">HAI</span>
                        <span className="sidebar__user-plan">Pro Plan</span>
                    </div>
                )}
            </div>
        </aside>
    );
}
