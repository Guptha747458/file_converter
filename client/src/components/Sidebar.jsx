import { useState } from 'react';
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
import './Sidebar.css';

const navItems = [
    { id: 'dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { id: 'convert', icon: <RefreshCw size={20} />, label: 'Convert' },
    { id: 'formats', icon: <Layers size={20} />, label: 'Formats' },
    { id: 'history', icon: <Clock size={20} />, label: 'History' },
    { id: 'settings', icon: <Settings size={20} />, label: 'Settings' },
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
