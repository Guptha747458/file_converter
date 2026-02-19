import './RecentActivity.css';

const activities = [
    {
        id: 'act-1',
        icon: '🖼',
        name: 'vacation_photo.jpg',
        from: 'JPG',
        to: 'PNG',
        size: '2.3 MB → 3.1 MB',
        time: '2 min ago',
        status: 'done',
    },
    {
        id: 'act-2',
        icon: '📄',
        name: 'contract_2025.pdf',
        from: 'PDF',
        to: 'DOCX',
        size: '1.8 MB → 0.9 MB',
        time: '14 min ago',
        status: 'done',
    },
    {
        id: 'act-3',
        icon: '🎵',
        name: 'podcast_episode_34.mp3',
        from: 'MP3',
        to: 'WAV',
        size: '48 MB → 210 MB',
        time: '1 hr ago',
        status: 'done',
    },
    {
        id: 'act-4',
        icon: '🎬',
        name: 'product_demo.mp4',
        from: 'MP4',
        to: 'GIF',
        size: '120 MB → 18 MB',
        time: '3 hr ago',
        status: 'done',
    },
    {
        id: 'act-5',
        icon: '📦',
        name: 'archive_Q1.zip',
        from: 'ZIP',
        to: 'TAR.GZ',
        size: '340 MB → 290 MB',
        time: 'Yesterday',
        status: 'done',
    },
];

const FormatTag = ({ label, color }) => (
    <span className="format-tag" style={{ color, borderColor: `${color}40`, background: `${color}14` }}>
        {label}
    </span>
);

export default function RecentActivity() {
    return (
        <div className="recent-activity">
            <div className="recent-activity__header">
                <h3 className="recent-activity__title">Recent Conversions</h3>
                <button id="view-all-history-btn" className="recent-activity__view-all">View All →</button>
            </div>
            <div className="recent-activity__list">
                {activities.map((item, i) => (
                    <div
                        key={item.id}
                        id={item.id}
                        className="activity-item"
                        style={{ animationDelay: `${i * 60}ms` }}
                    >
                        <div className="activity-item__icon">{item.icon}</div>
                        <div className="activity-item__body">
                            <p className="activity-item__name">{item.name}</p>
                            <p className="activity-item__meta">{item.size}</p>
                        </div>
                        <div className="activity-item__conversion">
                            <FormatTag label={item.from} color="#7c5cfc" />
                            <span className="activity-item__arrow">→</span>
                            <FormatTag label={item.to} color="#00d4ff" />
                        </div>
                        <div className="activity-item__time">{item.time}</div>
                        <button className="activity-item__download" title="Download converted file">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                <polyline points="7,10 12,15 17,10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
