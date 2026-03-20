import { useState, useEffect } from 'react';
import { fetchStats, fmtSize } from '../utils/api';
import './StatsGrid.css';

const ICON_LAYERS = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
);
const ICON_WAVE = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);
const ICON_BOLT = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
);
const ICON_DISK = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="14" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 2v4h10V2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
);

export default function StatsGrid() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchStats()
            .then(setStats)
            .catch(() => setStats({ totalFiles: 0, totalSize: 0, savedSize: 0, avgDuration: 0 }));
    }, []);

    const avgSec = stats ? (stats.avgDuration / 1000).toFixed(1) + 's' : '—';
    const saved = stats ? (stats.savedSize > 0 ? `-${fmtSize(stats.savedSize)}` : '0 B') : '—';

    const rows = [
        {
            id: 'stat-total',
            label: 'Total Converted',
            value: stats ? stats.totalFiles.toLocaleString() : '—',
            change: 'All time',
            positive: true,
            icon: ICON_LAYERS,
            color: '#7c5cfc',
        },
        {
            id: 'stat-saved',
            label: 'Space Saved',
            value: saved,
            change: 'vs original',
            positive: true,
            icon: ICON_WAVE,
            color: '#22d3a0',
        },
        {
            id: 'stat-speed',
            label: 'Avg. Speed',
            value: avgSec,
            change: 'per file',
            positive: true,
            icon: ICON_BOLT,
            color: '#f59e0b',
        },
        {
            id: 'stat-size',
            label: 'Data Processed',
            value: stats ? fmtSize(stats.totalSize) : '—',
            change: 'total input',
            positive: true,
            icon: ICON_DISK,
            color: '#00d4ff',
        },
    ];

    return (
        <div className="stats-grid">
            {rows.map((s, i) => (
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
