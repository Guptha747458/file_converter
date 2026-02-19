import { useState, useRef } from 'react';
import './ConvertPage.css';

const FORMAT_GROUPS = [
    { group: 'Image', color: '#7c5cfc', formats: ['PNG', 'JPG', 'WEBP', 'GIF', 'AVIF', 'SVG', 'BMP', 'TIFF'] },
    { group: 'Document', color: '#00d4ff', formats: ['PDF', 'DOCX', 'XLSX', 'PPTX', 'TXT', 'ODT', 'RTF'] },
    { group: 'Audio', color: '#22d3a0', formats: ['MP3', 'WAV', 'FLAC', 'AAC', 'OGG', 'M4A'] },
    { group: 'Video', color: '#f59e0b', formats: ['MP4', 'AVI', 'MOV', 'MKV', 'WEBM', 'FLV', 'GIF'] },
    { group: 'Archive', color: '#f43f5e', formats: ['ZIP', 'TAR', 'GZ', '7Z', 'BZ2'] },
];

const QUALITY_OPTIONS = [
    { id: 'low', label: 'Low', desc: 'Smaller file size', icon: '📉' },
    { id: 'medium', label: 'Medium', desc: 'Balanced quality', icon: '⚖️' },
    { id: 'high', label: 'High', desc: 'Best quality', icon: '📈' },
];

export default function ConvertPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);
    const [fromFmt, setFromFmt] = useState('JPG');
    const [toFmt, setToFmt] = useState('PNG');
    const [quality, setQuality] = useState('high');
    const [converting, setConverting] = useState(false);
    const fileRef = useRef(null);

    const allFormats = FORMAT_GROUPS.flatMap(g => g.formats);

    const addFiles = (newFiles) =>
        setFiles(prev => [
            ...prev,
            ...Array.from(newFiles).map(f => ({
                id: `${f.name}-${Date.now()}-${Math.random()}`,
                file: f, name: f.name, size: f.size, status: 'ready', progress: 0,
            })),
        ]);

    const handleDrop = (e) => {
        e.preventDefault(); setIsDragging(false);
        addFiles(e.dataTransfer.files);
    };

    const fmtSize = b => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(2)} MB`;

    const handleConvert = () => {
        if (!files.length) return;
        setConverting(true);
        const ids = files.map(f => f.id);
        let step = 0;
        const iv = setInterval(() => {
            step++;
            setFiles(prev => prev.map(f => ids.includes(f.id) ? { ...f, status: 'converting', progress: Math.min(step * 10, 100) } : f));
            if (step >= 10) {
                clearInterval(iv);
                setFiles(prev => prev.map(f => ids.includes(f.id) ? { ...f, status: 'done', progress: 100 } : f));
                setConverting(false);
            }
        }, 220);
    };

    const swap = () => { setFromFmt(toFmt); setToFmt(fromFmt); };

    const statusColor = { ready: 'var(--clr-text-muted)', converting: 'var(--clr-warning)', done: 'var(--clr-success)' };
    const statusLabel = { ready: 'Ready', converting: 'Converting…', done: '✓ Done' };

    return (
        <main className="convert-page">
            <div className="convert-page__bg-glow" aria-hidden="true" />

            {/* Header */}
            <div className="convert-page__header">
                <div>
                    <h2 className="convert-page__title">File Converter</h2>
                    <p className="convert-page__sub">Upload files, choose your target format, and convert instantly</p>
                </div>
            </div>

            <div className="convert-page__body">
                {/* Left: Controls + Drop Zone */}
                <div className="convert-page__left">

                    {/* Format Selector */}
                    <div className="format-selector glass-card">
                        <div className="format-selector__slot">
                            <label className="format-selector__label">From</label>
                            <select className="format-selector__select" value={fromFmt} onChange={e => setFromFmt(e.target.value)}>
                                {allFormats.map(f => <option key={f}>{f}</option>)}
                            </select>
                        </div>
                        <button className="format-selector__swap" onClick={swap} title="Swap formats">⇄</button>
                        <div className="format-selector__slot">
                            <label className="format-selector__label">To</label>
                            <select className="format-selector__select" value={toFmt} onChange={e => setToFmt(e.target.value)}>
                                {allFormats.map(f => <option key={f}>{f}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Quality */}
                    <div className="quality-selector glass-card">
                        <p className="quality-selector__label">Output Quality</p>
                        <div className="quality-selector__options">
                            {QUALITY_OPTIONS.map(q => (
                                <button
                                    key={q.id}
                                    className={`quality-option ${quality === q.id ? 'quality-option--active' : ''}`}
                                    onClick={() => setQuality(q.id)}
                                >
                                    <span className="quality-option__icon">{q.icon}</span>
                                    <span className="quality-option__name">{q.label}</span>
                                    <span className="quality-option__desc">{q.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Drop Zone */}
                    <div
                        className={`convert-dropzone ${isDragging ? 'convert-dropzone--dragging' : ''}`}
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileRef.current?.click()}
                        role="button" tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
                    >
                        <input ref={fileRef} type="file" multiple className="convert-dropzone__input"
                            onChange={e => addFiles(e.target.files)} />
                        <div className="convert-dropzone__content">
                            <div className="convert-dropzone__icon">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="url(#cpGrad)" strokeWidth="1.8" strokeLinecap="round" />
                                    <polyline points="17,8 12,3 7,8" stroke="url(#cpGrad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                    <line x1="12" y1="3" x2="12" y2="15" stroke="url(#cpGrad)" strokeWidth="1.8" strokeLinecap="round" />
                                    <defs>
                                        <linearGradient id="cpGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#7c5cfc" /><stop offset="1" stopColor="#00d4ff" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <p className="convert-dropzone__headline">
                                {isDragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
                            </p>
                            <p className="convert-dropzone__sub">Max 500 MB per file · All major formats supported</p>
                        </div>
                    </div>
                </div>

                {/* Right: File Queue */}
                <div className="convert-page__right">
                    <div className="file-queue glass-card">
                        <div className="file-queue__header">
                            <h3 className="file-queue__title">File Queue</h3>
                            {files.length > 0 && (
                                <button className="file-queue__clear" onClick={() => setFiles([])}>Clear</button>
                            )}
                        </div>

                        {files.length === 0 ? (
                            <div className="file-queue__empty">
                                <span className="file-queue__empty-icon">📂</span>
                                <p>No files added yet</p>
                                <p>Upload files from the left panel</p>
                            </div>
                        ) : (
                            <div className="file-queue__list">
                                {files.map(f => (
                                    <div key={f.id} className="fq-item">
                                        <span className="fq-item__icon">
                                            {f.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? '🖼' :
                                                f.name.match(/\.pdf$/i) ? '📄' :
                                                    f.name.match(/\.(mp3|wav|ogg|flac)$/i) ? '🎵' :
                                                        f.name.match(/\.(mp4|avi|mov|mkv)$/i) ? '🎬' : '📁'}
                                        </span>
                                        <div className="fq-item__info">
                                            <span className="fq-item__name">{f.name}</span>
                                            <div className="fq-item__meta">
                                                <span>{fmtSize(f.size)}</span>
                                                {f.status === 'converting' && (
                                                    <div className="fq-item__bar">
                                                        <div className="fq-item__bar-fill" style={{ width: `${f.progress}%` }} />
                                                    </div>
                                                )}
                                                <span style={{ color: statusColor[f.status] }}>{statusLabel[f.status]}</span>
                                            </div>
                                        </div>
                                        <button className="fq-item__remove" onClick={() => setFiles(p => p.filter(x => x.id !== f.id))}>×</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {files.length > 0 && (
                            <button
                                id="convert-start-btn"
                                className={`fq-convert-btn ${converting ? 'fq-convert-btn--loading' : ''}`}
                                onClick={handleConvert}
                                disabled={converting || files.every(f => f.status === 'done')}
                            >
                                {converting ? <><span className="fq-spinner" />Converting…</>
                                    : files.every(f => f.status === 'done') ? '✓ Complete — Download All'
                                        : `⇄ Convert ${files.length} File${files.length !== 1 ? 's' : ''} → ${toFmt}`}
                            </button>
                        )}
                    </div>

                    {/* Supported Formats panel */}
                    <div className="supported-formats glass-card">
                        <h3 className="supported-formats__title">Supported Formats</h3>
                        <div className="supported-formats__groups">
                            {FORMAT_GROUPS.map(g => (
                                <div key={g.group} className="sf-group">
                                    <span className="sf-group__name" style={{ color: g.color }}>{g.group}</span>
                                    <div className="sf-group__tags">
                                        {g.formats.map(f => (
                                            <span key={f} className="sf-tag" style={{ borderColor: `${g.color}30`, color: g.color, background: `${g.color}10` }}>{f}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
