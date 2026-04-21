import { useState, useEffect } from 'react';
import { 
    Image as ImageIcon, 
    FileText, 
    Music, 
    Video, 
    Package, 
    Download,
    ArrowRight,
    Folder
} from 'lucide-react';
import { fetchHistory, downloadFile, fmtSize } from '../utils/api';
import './RecentActivity.css';

const ICON_MAP = {
    image: <ImageIcon size={20} />,
    document: <FileText size={20} />,
    audio: <Music size={20} />,
    video: <Video size={20} />,
    archive: <Package size={20} />,
    other: <Folder size={20} />
};

function relativeTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString();
}

const FormatTag = ({ label, color }) => (
    <span className="format-tag" style={{ color, borderColor: `${color}40`, background: `${color}14` }}>
        {label}
    </span>
);

export default function RecentActivity() {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                // Fetch top 5 recent activities
                const data = await fetchHistory({ limit: 5 });
                setActivities(data.items || []);
            } catch (err) {
                console.error('Failed to load recent activity:', err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const getTypeFromFmt = (fmt) => {
        const f = fmt.toUpperCase();
        if (f.match(/^(JPG|JPEG|PNG|WEBP|GIF|AVIF|BMP|TIFF|SVG)$/)) return 'image';
        if (f.match(/^(PDF|DOCX|XLSX|XLS|TXT|RTF|ODT|CSV|HTML)$/)) return 'document';
        if (f.match(/^(MP3|WAV|FLAC|AAC|OGG|M4A)$/)) return 'audio';
        if (f.match(/^(MP4|AVI|MOV|MKV|WEBM|FLV)$/)) return 'video';
        if (f.match(/^(ZIP|TAR|GZ|7Z|BZ2|RAR)$/)) return 'archive';
        return 'other';
    };

    return (
        <div className="recent-activity">
            <div className="recent-activity__header">
                <h3 className="recent-activity__title">Recent Conversions</h3>
                <button id="view-all-history-btn" className="recent-activity__view-all">
                    View All <ArrowRight size={14} style={{ marginLeft: '4px' }} />
                </button>
            </div>
            <div className="recent-activity__list">
                {loading ? (
                    <div className="recent-activity__loading">
                         <span className="fq-spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
                         <p>Loading activity...</p>
                    </div>
                ) : activities.length > 0 ? (
                    activities.map((item, i) => (
                        <div
                            key={item.id}
                            id={item.id}
                            className="activity-item"
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            <div className="activity-item__icon">{ICON_MAP[getTypeFromFmt(item.fromFmt)]}</div>
                            <div className="activity-item__body">
                                <p className="activity-item__name">{item.originalName}</p>
                                <p className="activity-item__meta">{fmtSize(item.inputSize)} → {fmtSize(item.outputSize)}</p>
                            </div>
                            <div className="activity-item__conversion">
                                <FormatTag label={item.fromFmt} color="#7c5cfc" />
                                <ArrowRight size={12} className="activity-item__arrow-icon" style={{ margin: '0 8px', color: 'var(--clr-text-muted)' }} />
                                <FormatTag label={item.toFmt} color="#00d4ff" />
                            </div>
                            <div className="activity-item__time">{relativeTime(item.createdAt)}</div>
                            <button 
                                className="activity-item__download" 
                                title="Download converted file"
                                onClick={() => downloadFile(`/outputs/${item.outputFile}`, item.outputFile)}
                            >
                                <Download size={14} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="recent-activity__empty">
                        <Folder size={32} style={{ opacity: 0.2, marginBottom: '8px' }} />
                        <p>No recent files</p>
                    </div>
                )}
            </div>
        </div>
    );
}
