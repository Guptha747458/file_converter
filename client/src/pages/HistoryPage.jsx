import { useState, useEffect, useCallback } from 'react';
import { 
    Search, 
    Trash2, 
    Download, 
    Image as ImageIcon, 
    FileText, 
    FileSpreadsheet, 
    Music, 
    Video, 
    Package, 
    Folder,
    HardDrive,
    Zap,
    BarChart3,
    ArrowRight
} from 'lucide-react';
import { fetchHistory, deleteHistoryItem, downloadFile, fmtSize } from '../utils/api';
import './HistoryPage.css';

const FILTERS = ['All', 'Image', 'Document', 'Audio', 'Video', 'Archive'];

const typeMap = {
    JPG: 'Image', JPEG: 'Image', PNG: 'Image', WEBP: 'Image', SVG: 'Image', GIF: 'Image', AVIF: 'Image', BMP: 'Image', TIFF: 'Image',
    PDF: 'Document', DOCX: 'Document', XLSX: 'Document', XLS: 'Document', TXT: 'Document', RTF: 'Document', CSV: 'Document', HTML: 'Document', JSON: 'Document',
    MP3: 'Audio', WAV: 'Audio', FLAC: 'Audio', AAC: 'Audio', OGG: 'Audio', M4A: 'Audio',
    MP4: 'Video', MOV: 'Video', AVI: 'Video', MKV: 'Video', WEBM: 'Video', FLV: 'Video',
    ZIP: 'Archive', TAR: 'Archive', GZ: 'Archive', '7Z': 'Archive', BZ2: 'Archive', RAR: 'Archive',
};

// Fallback static data shown when server has no history yet
const DEMO_DATA = [
    { id: 'd1', type: 'image', originalName: 'vacation_photo.jpg', fromFmt: 'JPG', toFmt: 'PNG', inputSize: 2411725, outputSize: 3251200, duration: 420, createdAt: new Date(Date.now() - 2 * 60000).toISOString(), outputFile: null },
    { id: 'd2', type: 'doc', originalName: 'contract_2025.pdf', fromFmt: 'PDF', toFmt: 'DOCX', inputSize: 1887437, outputSize: 943718, duration: 280, createdAt: new Date(Date.now() - 14 * 60000).toISOString(), outputFile: null },
    { id: 'd3', type: 'spreadsheet', originalName: 'sales_data.xlsx', fromFmt: 'XLSX', toFmt: 'CSV', inputSize: 524288, outputSize: 102400, duration: 150, createdAt: new Date(Date.now() - 60 * 60000).toISOString(), outputFile: null },
    { id: 'd4', type: 'archive', originalName: 'project_assets.zip', fromFmt: 'ZIP', toFmt: 'TAR', inputSize: 524288000, outputSize: 524288000, duration: 1200, createdAt: new Date(Date.now() - 3 * 3600000).toISOString(), outputFile: null },
    { id: 'd5', type: 'image', originalName: 'banner_design.png', fromFmt: 'PNG', toFmt: 'WEBP', inputSize: 4404019, outputSize: 1152922, duration: 310, createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), outputFile: null },
];

const getIcon = (item) => {
    const ext = item.fromFmt || '';
    if (typeMap[ext] === 'Image') return <ImageIcon size={18} />;
    if (typeMap[ext] === 'Document') return <FileText size={18} />;
    if (typeMap[ext] === 'Audio') return <Music size={18} />;
    if (typeMap[ext] === 'Video') return <Video size={18} />;
    if (typeMap[ext] === 'Archive') return <Package size={18} />;
    return <Folder size={18} />;
};

function relativeTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
}

export default function HistoryPage() {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState([]);
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState({ total: 0, totalInputSize: 0, totalOutputSize: 0 });
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        try {
            const data = await fetchHistory({ search, filter });
            setItems(data.items || []);
            setStats({ 
                total: data.total || 0, 
                totalInputSize: data.totalInputSize || 0, 
                totalOutputSize: data.totalOutputSize || 0 
            });
        } catch (err) {
            console.error('History load error:', err);
            setItems([]);
            setStats({ total: 0, totalInputSize: 0, totalOutputSize: 0 });
        } finally {
            setLoading(false);
        }
    }, [search, filter]);

    useEffect(() => { load(); }, [load]);

    const toggle = (id) =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const handleDelete = async (id) => {
        try { await deleteHistoryItem(id); } catch { }
        setItems(prev => prev.filter(i => i.id !== id));
        setSelected(prev => prev.filter(x => x !== id));
    };

    const handleDeleteSelected = async () => {
        await Promise.all(selected.map(id => deleteHistoryItem(id).catch(() => { })));
        setItems(prev => prev.filter(i => !selected.includes(i.id)));
        setSelected([]);
    };

    const savedSize = stats.totalInputSize - stats.totalOutputSize;

    const fmtTag = (label, color) => (
        <span className="hist-tag" style={{ color, borderColor: `${color}35`, background: `${color}12` }}>{label}</span>
    );

    return (
        <main className="history-page">
            <div className="history-page__bg-glow" aria-hidden="true" />

            {/* Header */}
            <div className="history-page__header">
                <div>
                    <h2 className="history-page__title">Conversion History</h2>
                    <p className="history-page__sub">{stats.total} conversion{stats.total !== 1 ? 's' : ''} · last 30 days</p>
                </div>
                {selected.length > 0 && (
                    <div className="history-page__bulk">
                        <span>{selected.length} selected</span>
                        <button className="hist-btn hist-btn--outline" onClick={() => setSelected([])}>Deselect</button>
                        <button className="hist-btn hist-btn--danger" onClick={handleDeleteSelected}>
                            <Trash2 size={14} style={{ marginRight: '6px' }} /> Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            <div className="history-stats">
                {[
                    { label: 'Total Files', value: stats.total.toLocaleString(), icon: <Folder size={18} />, color: '#7c5cfc' },
                    { label: 'Data Processed', value: fmtSize(stats.totalInputSize), icon: <HardDrive size={18} />, color: '#00d4ff' },
                ].map(s => (
                    <div key={s.label} className="history-stat glass-card">
                        <span className="history-stat__icon" style={{ background: `${s.color}18`, color: s.color }}>{s.icon}</span>
                        <div>
                            <p className="history-stat__value">{s.value}</p>
                            <p className="history-stat__label">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="history-toolbar glass-card">
                <div className="history-toolbar__search">
                    <Search size={14} />
                    <input
                        className="history-toolbar__search-input"
                        type="search"
                        placeholder="Search by filename…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <div className="history-toolbar__filters">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            className={`hist-filter-btn ${filter === f ? 'hist-filter-btn--active' : ''}`}
                            onClick={() => setFilter(f)}
                        >{f}</button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="history-table-wrap glass-card">
                {loading ? (
                    <div className="history-loading">
                        <span className="fq-spinner" style={{ width: 24, height: 24, borderWidth: 3 }} />
                        <p>Loading history…</p>
                    </div>
                ) : (
                    <table className="history-table">
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox"
                                        onChange={e => setSelected(e.target.checked ? items.map(x => x.id) : [])}
                                        checked={selected.length === items.length && items.length > 0}
                                    />
                                </th>
                                <th>File</th>
                                <th>Conversion</th>
                                <th>Original Size</th>
                                <th>Output Size</th>
                                <th>Time</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((h, i) => {
                                const saved = h.inputSize - h.outputSize;
                                return (
                                    <tr key={h.id}
                                        className={`history-row ${selected.includes(h.id) ? 'history-row--selected' : ''}`}
                                        style={{ animationDelay: `${i * 35}ms` }}>
                                        <td><input type="checkbox" checked={selected.includes(h.id)} onChange={() => toggle(h.id)} /></td>
                                        <td>
                                            <div className="history-row__file">
                                                <span className="history-row__file-icon">{getIcon(h)}</span>
                                                <span className="history-row__file-name" title={h.originalName}>{h.originalName}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="history-row__conv">
                                                {fmtTag(h.fromFmt, '#7c5cfc')}
                                                <ArrowRight size={12} className="history-row__arrow-icon" style={{ margin: '0 8px', color: 'var(--clr-text-muted)' }} />
                                                {fmtTag(h.toFmt, '#00d4ff')}
                                            </div>
                                        </td>
                                        <td className="history-row__size">{fmtSize(h.inputSize)}</td>
                                        <td>
                                            <div className="history-row__result">
                                                <span>{fmtSize(h.outputSize)}</span>
                                                <span className={`history-row__saved ${saved >= 0 ? 'pos' : 'neg'}`}>
                                                    {saved >= 0 ? `-${fmtSize(saved)}` : `+${fmtSize(-saved)}`}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="history-row__time">{relativeTime(h.createdAt)}</td>
                                        <td>
                                            <div className="history-row__actions">
                                                {h.downloadUrl && (
                                                    <button
                                                        className="history-row__action-btn history-row__action-btn--dl"
                                                        title="Download"
                                                        onClick={() => downloadFile(h.downloadUrl, h.originalName)}
                                                    ><Download size={14} /></button>
                                                )}
                                                <button
                                                    className="history-row__action-btn history-row__action-btn--del"
                                                    title="Delete"
                                                    onClick={() => handleDelete(h.id)}
                                                ><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {items.length === 0 && (
                                <tr><td colSpan={7} className="history-empty">No results found</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </main>
    );
}
