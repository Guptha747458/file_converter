import './StatsGrid.css';

const stats = [
    {
        id: 'stat-total',
        label: 'Total Converted',
        value: '1,284',
        change: '+12%',
        positive: true,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
        ),
        color: '#7c5cfc',
    },
    {
        id: 'stat-saved',
        label: 'Space Saved',
        value: '2.3 GB',
        change: '+340MB',
        positive: true,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
        color: '#22d3a0',
    },
    {
        id: 'stat-speed',
        label: 'Avg. Speed',
        value: '1.8s',
        change: '-0.3s',
        positive: true,
        icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
        ),
        color: '#f59e0b',
    },
];

export default function StatsGrid() {
    return (
        <div className="stats-grid">
            {stats.map((s, i) => (
                <div
                    key={s.id}
                    id={s.id}
                    className="stat-card glass-card"
                    style={{ animationDelay: `${i * 80}ms` }}
                >
                    <div className="stat-card__icon" style={{ color: s.color, background: `${s.color}18` }}>
                        {s.icon}
                    </div>
                    <div className="stat-card__content">
                        <span className="stat-card__label">{s.label}</span>
                        <span className="stat-card__value">{s.value}</span>
                    </div>
                    <div className={`stat-card__change ${s.positive ? 'stat-card__change--up' : 'stat-card__change--down'}`}>
                        <span className="stat-card__change-arrow">{s.positive ? '↑' : '↓'}</span>
                        {s.change}
                    </div>
                    <div className="stat-card__glow" style={{ background: `radial-gradient(ellipse at 100% 0%, ${s.color}22, transparent 60%)` }} />
                </div>
            ))}
        </div>
    );
}
