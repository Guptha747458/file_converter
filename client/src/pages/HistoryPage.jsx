import { useState } from 'react';
import './HistoryPage.css';

const HISTORY_DATA = [
    { id: 'h1', icon: '🖼', name: 'vacation_photo.jpg', from: 'JPG', to: 'PNG', size: '2.3 MB', result: '3.1 MB', time: '2 min ago', status: 'done', saved: '+800 KB' },
    { id: 'h2', icon: '📄', name: 'contract_2025.pdf', from: 'PDF', to: 'DOCX', size: '1.8 MB', result: '0.9 MB', time: '14 min ago', status: 'done', saved: '-900 KB' },
    { id: 'h3', icon: '🎵', name: 'podcast_ep34.mp3', from: 'MP3', to: 'WAV', size: '48 MB', result: '210 MB', time: '1 hr ago', status: 'done', saved: '-162 MB' },
    { id: 'h4', icon: '🎬', name: 'product_demo.mp4', from: 'MP4', to: 'GIF', size: '120 MB', result: '18 MB', time: '3 hr ago', status: 'done', saved: '-102 MB' },
    { id: 'h5', icon: '📦', name: 'archive_Q1.zip', from: 'ZIP', to: 'TAR.GZ', size: '340 MB', result: '290 MB', time: 'Yesterday', status: 'done', saved: '-50 MB' },
    { id: 'h6', icon: '🖼', name: 'banner_design.png', from: 'PNG', to: 'WEBP', size: '4.2 MB', result: '1.1 MB', time: 'Yesterday', status: 'done', saved: '-3.1 MB' },
    { id: 'h7', icon: '📄', name: 'report_annual.docx', from: 'DOCX', to: 'PDF', size: '3.4 MB', result: '2.8 MB', time: '2 days ago', status: 'done', saved: '-600 KB' },
    { id: 'h8', icon: '🎵', name: 'track_master.flac', from: 'FLAC', to: 'MP3', size: '82 MB', result: '9.2 MB', time: '3 days ago', status: 'done', saved: '-72.8 MB' },
    { id: 'h9', icon: '🖼', name: 'logo_vector.svg', from: 'SVG', to: 'PNG', size: '420 KB', result: '180 KB', time: '4 days ago', status: 'done', saved: '-240 KB' },
    { id: 'h10', icon: '🎬', name: 'tutorial_final.mov', from: 'MOV', to: 'MP4', size: '670 MB', result: '210 MB', time: '1 week ago', status: 'done', saved: '-460 MB' },
];

const FILTERS = ['All', 'Image', 'Document', 'Audio', 'Video', 'Archive'];

const typeMap = {
    JPG: 'Image', PNG: 'Image', WEBP: 'Image', SVG: 'Image', GIF: 'Image', AVIF: 'Image',
    PDF: 'Document', DOCX: 'Document', XLSX: 'Document', TXT: 'Document',
    MP3: 'Audio', WAV: 'Audio', FLAC: 'Audio', AAC: 'Audio',
    MP4: 'Video', MOV: 'Video', AVI: 'Video', MKV: 'Video',
    ZIP: 'Archive', 'TAR.GZ': 'Archive', GZ: 'Archive',
};

export default function HistoryPage() {
    const [filter, setFilter] = useState('All');
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState([]);

    const toggle = (id) =>
        setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const filtered = HISTORY_DATA.filter(h => {
        const matchFilter = filter === 'All' || typeMap[h.from] === filter || typeMap[h.to] === filter;
        const matchSearch = h.name.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

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
                    <p className="history-page__sub">{HISTORY_DATA.length} conversions · last 30 days</p>
                </div>
                {selected.length > 0 && (
                    <div className="history-page__bulk">
                        <span>{selected.length} selected</span>
                        <button className="hist-btn hist-btn--outline" onClick={() => setSelected([])}>Deselect</button>
                        <button className="hist-btn hist-btn--danger">🗑 Delete</button>
                        <button className="hist-btn hist-btn--primary">⬇ Download All</button>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            <div className="history-stats">
                {[
                    { label: 'Total Files', value: '1,284', icon: '📁', color: '#7c5cfc' },
                    { label: 'Data Processed', value: '48.6 GB', icon: '💾', color: '#00d4ff' },
                    { label: 'Space Saved', value: '2.3 GB', icon: '⚡', color: '#22d3a0' },
                    { label: 'This Month', value: '187', icon: '📅', color: '#f59e0b' },
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
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
                <button className="hist-btn hist-btn--outline" style={{ marginLeft: 'auto' }}>⬇ Export CSV</button>
            </div>

            {/* Table */}
            <div className="history-table-wrap glass-card">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th><input type="checkbox" onChange={e => setSelected(e.target.checked ? filtered.map(x => x.id) : [])} /></th>
                            <th>File</th>
                            <th>Conversion</th>
                            <th>Original</th>
                            <th>Result</th>
                            <th>Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((h, i) => (
                            <tr key={h.id} className={`history-row ${selected.includes(h.id) ? 'history-row--selected' : ''}`}
                                style={{ animationDelay: `${i * 40}ms` }}>
                                <td><input type="checkbox" checked={selected.includes(h.id)} onChange={() => toggle(h.id)} /></td>
                                <td>
                                    <div className="history-row__file">
                                        <span className="history-row__file-icon">{h.icon}</span>
                                        <span className="history-row__file-name">{h.name}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="history-row__conv">
                                        {fmtTag(h.from, '#7c5cfc')}
                                        <span className="history-row__arrow">→</span>
                                        {fmtTag(h.to, '#00d4ff')}
                                    </div>
                                </td>
                                <td className="history-row__size">{h.size}</td>
                                <td>
                                    <div className="history-row__result">
                                        <span>{h.result}</span>
                                        <span className={`history-row__saved ${h.saved.startsWith('-') ? 'neg' : 'pos'}`}>{h.saved}</span>
                                    </div>
                                </td>
                                <td className="history-row__time">{h.time}</td>
                                <td>
                                    <div className="history-row__actions">
                                        <button className="history-row__action-btn history-row__action-btn--dl" title="Download">⬇</button>
                                        <button className="history-row__action-btn history-row__action-btn--del" title="Delete">🗑</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr><td colSpan={7} className="history-empty">No results found</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
