import { useState, useEffect } from 'react';
import { 
    Layers, 
    Activity, 
    Zap, 
    HardDrive,
    ArrowUp,
    ArrowDown
} from 'lucide-react';
import { fetchStats, fmtSize } from '../utils/api';
import './StatsGrid.css';

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
            icon: <Layers size={20} />,
            color: '#7c5cfc',
        },
        {
            id: 'stat-saved',
            label: 'Space Saved',
            value: saved,
            change: 'vs original',
            positive: true,
            icon: <Activity size={20} />,
            color: '#22d3a0',
        },
        {
            id: 'stat-speed',
            label: 'Avg. Speed',
            value: avgSec,
            change: 'per file',
            positive: true,
            icon: <Zap size={20} />,
            color: '#f59e0b',
        },
        {
            id: 'stat-size',
            label: 'Data Processed',
            value: stats ? fmtSize(stats.totalSize) : '—',
            change: 'total input',
            positive: true,
            icon: <HardDrive size={20} />,
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
                        <span className="stat-card__change-arrow">
                            {s.positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        </span>
                        {s.change}
                    </div>
                    <div className="stat-card__glow" style={{ background: `radial-gradient(ellipse at 100% 0%, ${s.color}22, transparent 60%)` }} />
                </div>
            ))}
        </div>
    );
}
