import { useState, useRef } from 'react';
import './DropZone.css';

const SUPPORTED_TYPES = [
    { ext: 'JPG → PNG', from: 'image/jpeg' },
    { ext: 'PNG → WEBP', from: 'image/png' },
    { ext: 'PDF → DOCX', from: 'application/pdf' },
    { ext: 'MP4 → MP3', from: 'video/mp4' },
    { ext: 'DOCX → PDF', from: 'application/vnd.openxmlformats' },
];

const FORMAT_OPTIONS = ['PNG', 'JPG', 'WEBP', 'GIF', 'PDF', 'DOCX', 'MP3', 'MP4', 'AVI', 'ZIP'];

export default function DropZone() {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);
    const [targetFmt, setTargetFmt] = useState('PNG');
    const [converting, setConverting] = useState(false);
    const fileRef = useRef(null);

    const handleDrag = (e, over) => {
        e.preventDefault();
        setIsDragging(over);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = Array.from(e.dataTransfer.files);
        addFiles(dropped);
    };

    const addFiles = (newFiles) => {
        const mapped = newFiles.map(f => ({
            id: `${f.name}-${Date.now()}-${Math.random()}`,
            file: f,
            name: f.name,
            size: f.size,
            status: 'ready',
            progress: 0,
        }));
        setFiles(prev => [...prev, ...mapped]);
    };

    const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));

    const fmtSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    const handleConvert = () => {
        if (!files.length) return;
        setConverting(true);
        // Simulate conversion progress
        const ids = files.map(f => f.id);
        let step = 0;
        const interval = setInterval(() => {
            step++;
            setFiles(prev => prev.map(f =>
                ids.includes(f.id)
                    ? { ...f, status: 'converting', progress: Math.min(step * 10, 100) }
                    : f
            ));
            if (step >= 10) {
                clearInterval(interval);
                setFiles(prev => prev.map(f =>
                    ids.includes(f.id) ? { ...f, status: 'done', progress: 100 } : f
                ));
                setConverting(false);
            }
        }, 200);
    };

    const statusConfig = {
        ready: { label: 'Ready', color: 'var(--clr-text-muted)' },
        converting: { label: 'Converting', color: 'var(--clr-warning)' },
        done: { label: 'Done ✓', color: 'var(--clr-success)' },
    };

    return (
        <div className="dropzone-section">
            <div className="dropzone-section__header">
                <div>
                    <h2 className="dropzone-section__title">Convert Files</h2>
                    <p className="dropzone-section__sub">Drag & drop files to instantly convert them</p>
                </div>
                <div className="dropzone-section__format-row">
                    <label htmlFor="target-format" className="dropzone-section__format-label">Convert to:</label>
                    <select id="target-format" className="dropzone-section__format-select" value={targetFmt} onChange={e => setTargetFmt(e.target.value)}>
                        {FORMAT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
            </div>

            {/* Drop Zone */}
            <div
                className={`dropzone ${isDragging ? 'dropzone--dragging' : ''}`}
                onDragOver={e => handleDrag(e, true)}
                onDragLeave={e => handleDrag(e, false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                role="button"
                aria-label="Drop files here or click to browse"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
            >
                <input
                    ref={fileRef}
                    id="file-input"
                    type="file"
                    multiple
                    className="dropzone__input"
                    onChange={e => addFiles(Array.from(e.target.files))}
                    aria-hidden="true"
                />
                <div className="dropzone__inner">
                    <div className="dropzone__icon-wrapper">
                        <svg className="dropzone__icon" width="44" height="44" viewBox="0 0 24 24" fill="none">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="url(#dzGrad)" strokeWidth="1.8" strokeLinecap="round" />
                            <polyline points="17,8 12,3 7,8" stroke="url(#dzGrad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="12" y1="3" x2="12" y2="15" stroke="url(#dzGrad)" strokeWidth="1.8" strokeLinecap="round" />
                            <defs>
                                <linearGradient id="dzGrad" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#7c5cfc" />
                                    <stop offset="1" stopColor="#00d4ff" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <p className="dropzone__headline">
                        {isDragging ? 'Release to upload' : 'Drop files here or click to browse'}
                    </p>
                    <p className="dropzone__subtext">Supports images, PDFs, audio, video &amp; archives</p>
                    <div className="dropzone__badges">
                        {SUPPORTED_TYPES.map(t => (
                            <span key={t.ext} className="dropzone__badge">{t.ext}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="file-list">
                    <div className="file-list__header">
                        <span className="file-list__count">{files.length} file{files.length !== 1 ? 's' : ''} queued</span>
                        <button className="file-list__clear" onClick={() => setFiles([])}>Clear all</button>
                    </div>
                    <div className="file-list__items">
                        {files.map(f => (
                            <div key={f.id} className="file-item">
                                <div className="file-item__icon">
                                    {f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? '🖼' :
                                        f.name.match(/\.pdf$/i) ? '📄' :
                                            f.name.match(/\.(mp3|wav|ogg)$/i) ? '🎵' :
                                                f.name.match(/\.(mp4|avi|mov)$/i) ? '🎬' : '📁'}
                                </div>
                                <div className="file-item__info">
                                    <div className="file-item__name-row">
                                        <span className="file-item__name">{f.name}</span>
                                        <span className="file-item__size">{fmtSize(f.size)}</span>
                                    </div>
                                    {f.status === 'converting' && (
                                        <div className="file-item__progress">
                                            <div className="file-item__progress-bar">
                                                <div className="file-item__progress-fill" style={{ width: `${f.progress}%` }} />
                                            </div>
                                            <span className="file-item__progress-pct">{f.progress}%</span>
                                        </div>
                                    )}
                                    <span className="file-item__status" style={{ color: statusConfig[f.status]?.color }}>
                                        {statusConfig[f.status]?.label}
                                    </span>
                                </div>
                                <button
                                    className="file-item__remove"
                                    onClick={() => removeFile(f.id)}
                                    aria-label={`Remove ${f.name}`}
                                    title="Remove"
                                >×</button>
                            </div>
                        ))}
                    </div>
                    <button
                        id="convert-btn"
                        className={`convert-btn ${converting ? 'convert-btn--loading' : ''}`}
                        onClick={handleConvert}
                        disabled={converting || files.every(f => f.status === 'done')}
                    >
                        {converting ? (
                            <><span className="convert-btn__spinner" />Converting...</>
                        ) : files.every(f => f.status === 'done') ? (
                            '✓ All Conversions Complete'
                        ) : (
                            `⇄ Convert ${files.length} File${files.length !== 1 ? 's' : ''} to ${targetFmt}`
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
