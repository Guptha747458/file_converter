import { useState, useRef, useCallback } from 'react';
import { 
    Image as ImageIcon, 
    FileText, 
    FileSpreadsheet, 
    Music, 
    Video, 
    Package, 
    Folder, 
    UploadCloud, 
    FileCheck, 
    AlertCircle, 
    Download, 
    RefreshCw, 
    X, 
    ArrowRight,
    CheckCircle2,
    XCircle,
    Layout
} from 'lucide-react';
import { convertFile, convertBatch, downloadFile, fmtSize } from '../utils/api';
import './ConvertPage.css';

// ── Format catalogue ──────────────────────────────────────────────────────────
const FORMAT_GROUPS = [
    { group: 'Image', color: '#7c5cfc', formats: ['PNG', 'JPG', 'WEBP', 'GIF', 'AVIF', 'BMP', 'TIFF'] },
    { group: 'Document', color: '#00d4ff', formats: ['PDF', 'DOCX', 'PPTX', 'XLSX', 'PPT', 'TXT', 'CSV', 'HTML'] },
    { group: 'Audio', color: '#22d3a0', formats: ['MP3', 'WAV', 'FLAC', 'AAC', 'OGG', 'M4A'] },
    { group: 'Video', color: '#f59e0b', formats: ['MP4', 'AVI', 'MOV', 'MKV', 'WEBM', 'FLV'] },
    { group: 'Archive', color: '#f43f5e', formats: ['ZIP', 'TAR', 'GZ', '7Z', 'BZ2'] },
];

const ALL_FORMATS = FORMAT_GROUPS.flatMap(g => g.formats);

const FILE_ICON = name => {
    if (/\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|tiff)$/i.test(name)) return <ImageIcon size={20} />;
    if (/\.(pdf)$/i.test(name)) return <FileText size={20} />;
    if (/\.(docx|doc|odt|rtf)$/i.test(name)) return <FileCheck size={20} />;
    if (/\.(xlsx|xls|csv)$/i.test(name)) return <FileSpreadsheet size={20} />;
    if (/\.(pptx|ppt)$/i.test(name)) return <Layout size={20} />;
    if (/\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(name)) return <Music size={20} />;
    if (/\.(mp4|avi|mov|mkv|webm|flv)$/i.test(name)) return <Video size={20} />;
    if (/\.(zip|tar|gz|7z|bz2|rar)$/i.test(name)) return <Package size={20} />;
    return <Folder size={20} />;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ConvertPage() {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]);
    const [toFmt, setToFmt] = useState('PNG');
    const [serverOnline, setServerOnline] = useState(null);
    const fileRef = useRef(null);

    // Check server health on mount
    useState(() => {
        fetch('/api/health')
            .then(r => r.json())
            .then(() => setServerOnline(true))
            .catch(() => setServerOnline(false));
    });

    // ── File management ────────────────────────────────────────────────────────
    const addFiles = useCallback((rawFiles) => {
        const newEntries = Array.from(rawFiles).map(f => ({
            id: `${f.name}-${Date.now()}-${Math.random()}`,
            file: f,
            name: f.name,
            size: f.size,
            status: 'ready',     // ready | uploading | converting | done | error
            progress: 0,
            error: null,
            result: null,        // { downloadUrl, outputSize, outputFile }
        }));
        setFiles(prev => [...prev, ...newEntries]);
    }, []);

    const updateFile = useCallback((id, patch) =>
        setFiles(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f)), []);

    const removeFile = useCallback(id =>
        setFiles(prev => prev.filter(f => f.id !== id)), []);

    // ── Drop zone ──────────────────────────────────────────────────────────────
    const handleDrop = (e) => {
        e.preventDefault(); setIsDragging(false);
        addFiles(e.dataTransfer.files);
    };

    // ── Convert single file ────────────────────────────────────────────────────
    const convertOne = async (entry) => {
        updateFile(entry.id, { status: 'uploading', progress: 0, error: null });
        try {
            const result = await convertFile({
                file: entry.file,
                toFmt,
                onProgress: pct => updateFile(entry.id, { progress: pct, status: pct < 100 ? 'uploading' : 'converting' }),
            });
            updateFile(entry.id, { status: 'done', progress: 100, result });
        } catch (err) {
            updateFile(entry.id, { status: 'error', error: err.message });
        }
    };

    // ── Convert all ────────────────────────────────────────────────────────────
    const handleConvertAll = async () => {
        const ready = files.filter(f => f.status === 'ready' || f.status === 'error');
        if (!ready.length) return;
        // Convert in parallel (cap at 5)
        const chunks = [];
        for (let i = 0; i < ready.length; i += 5) chunks.push(ready.slice(i, i + 5));
        for (const chunk of chunks) await Promise.all(chunk.map(convertOne));
    };

    // ── Download all done ──────────────────────────────────────────────────────
    const downloadAll = () => {
        files.filter(f => f.status === 'done' && f.result).forEach((f, i) => {
            setTimeout(() => downloadFile(f.result.downloadUrl, f.result.outputFile), i * 300);
        });
    };

    // ── Status helpers ─────────────────────────────────────────────────────────
    const readyCount = files.filter(f => f.status === 'ready').length;
    const convertingCount = files.filter(f => f.status === 'uploading' || f.status === 'converting').length;
    const doneCount = files.filter(f => f.status === 'done').length;
    const errorCount = files.filter(f => f.status === 'error').length;
    const isConverting = convertingCount > 0;
    const allDone = files.length > 0 && doneCount === files.length;

    const statusColor = { ready: 'var(--clr-text-muted)', uploading: 'var(--clr-accent)', converting: 'var(--clr-warning)', done: 'var(--clr-success)', error: 'var(--clr-danger)' };
    const statusLabel = { 
        ready: 'Ready', 
        uploading: 'Uploading…', 
        converting: 'Converting…', 
        done: <><CheckCircle2 size={14} style={{ marginRight: '4px' }} /> Done</>, 
        error: <><XCircle size={14} style={{ marginRight: '4px' }} /> Failed</> 
    };

    return (
        <main className="convert-page">
            <div className="convert-page__bg-glow" aria-hidden="true" />

            {/* Header */}
            <div className="convert-page__header">
                <div>
                    <h2 className="convert-page__title">File Converter</h2>
                    <p className="convert-page__sub">Upload files, choose your target format, and convert instantly</p>
                </div>
                {/* Server status pill */}
                <div className={`server-status ${serverOnline === true ? 'server-status--online' : serverOnline === false ? 'server-status--offline' : 'server-status--checking'}`}>
                    <span className="server-status__dot" />
                    {serverOnline === true ? 'Server Online' : serverOnline === false ? 'Server Offline' : 'Connecting…'}
                </div>
            </div>

            <div className="convert-page__body">
                {/* ── Left: Controls + Drop Zone ── */}
                <div className="convert-page__left">

                    {/* Output Format Selector */}
                    <div className="format-selector glass-card">
                        <p className="format-selector__heading">Convert To</p>
                        <div className="format-selector__groups">
                            {FORMAT_GROUPS.map(g => (
                                <div key={g.group} className="format-selector__group">
                                    <span className="format-selector__group-label" style={{ color: g.color }}>{g.group}</span>
                                    <div className="format-selector__chips">
                                        {g.formats.map(f => (
                                            <button
                                                key={f}
                                                className={`fmt-chip ${toFmt === f ? 'fmt-chip--active' : ''}`}
                                                style={toFmt === f ? { borderColor: g.color, color: g.color, background: `${g.color}18` } : {}}
                                                onClick={() => setToFmt(f)}
                                            >
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
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
                        <input
                            ref={fileRef} type="file" multiple className="convert-dropzone__input"
                            onChange={e => addFiles(e.target.files)}
                        />
                        <div className="convert-dropzone__content">
                            <div className="convert-dropzone__icon">
                                <UploadCloud size={42} color="#7c5cfc" />
                            </div>
                            <p className="convert-dropzone__headline">
                                {isDragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
                            </p>
                            <p className="convert-dropzone__sub">Max 500 MB per file · Images, Docs, Spreadsheets, Archives</p>
                        </div>
                    </div>
                </div>

                {/* ── Right: File Queue ── */}
                <div className="convert-page__right">
                    <div className="file-queue glass-card">
                        <div className="file-queue__header">
                            <h3 className="file-queue__title">
                                File Queue
                                {files.length > 0 && gaugePill(readyCount, convertingCount, doneCount, errorCount)}
                            </h3>
                            {files.length > 0 && (
                                <div className="file-queue__header-btns">
                                    {doneCount > 0 && (
                                        <button className="fq-btn fq-btn--dl" onClick={downloadAll} title="Download all done"><Download size={14} style={{ marginRight: '4px' }} /> All</button>
                                    )}
                                    <button className="fq-btn fq-btn--clear" onClick={() => setFiles([])}>Clear</button>
                                </div>
                            )}
                        </div>

                        {files.length === 0 ? (
                            <div className="file-queue__empty">
                                <span className="file-queue__empty-icon"><Folder size={48} opacity={0.5} /></span>
                                <p>No files added yet</p>
                                <p>Drop files or click browse on the left</p>
                            </div>
                        ) : (
                            <div className="file-queue__list">
                                {files.map(f => (
                                    <div key={f.id} className={`fq-item fq-item--${f.status}`}>
                                        <span className="fq-item__icon">{FILE_ICON(f.name)}</span>
                                        <div className="fq-item__info">
                                            <span className="fq-item__name" title={f.name}>{f.name}</span>
                                            <div className="fq-item__meta">
                                                <span className="fq-item__size">{fmtSize(f.size)}</span>
                                                {f.status === 'done' && f.result && (
                                                    <span className="fq-item__arrow"><ArrowRight size={12} style={{ margin: '0 4px' }} /> {fmtSize(f.result.outputSize)}</span>
                                                )}
                                                <span className="fq-item__status" style={{ color: statusColor[f.status], display: 'flex', alignItems: 'center' }}>
                                                    {statusLabel[f.status]}
                                                </span>
                                                {f.error && <span className="fq-item__error" title={f.error}><AlertCircle size={12} style={{ marginRight: '4px' }} /> {f.error.slice(0, 40)}</span>}
                                            </div>
                                            {(f.status === 'uploading' || f.status === 'converting') && (
                                                <div className="fq-item__bar">
                                                    <div className="fq-item__bar-fill" style={{ width: `${f.progress}%` }} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="fq-item__actions">
                                            {f.status === 'done' && f.result && (
                                                <button
                                                    className="fq-item__action fq-item__action--dl"
                                                    onClick={() => downloadFile(f.result.downloadUrl, f.result.outputFile)}
                                                    title="Download"
                                                ><Download size={14} /></button>
                                            )}
                                            {(f.status === 'ready' || f.status === 'error') && (
                                                <button
                                                    className="fq-item__action fq-item__action--go"
                                                    onClick={() => convertOne(f)}
                                                    title="Convert this file"
                                                ><RefreshCw size={14} /></button>
                                            )}
                                            <button
                                                className="fq-item__action fq-item__action--rm"
                                                onClick={() => removeFile(f.id)}
                                                title="Remove"
                                            ><X size={14} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {files.length > 0 && (
                            <div className="file-queue__footer">
                                {allDone ? (
                                    <button id="convert-start-btn" className="fq-convert-btn fq-convert-btn--done" onClick={downloadAll}>
                                        <Download size={18} style={{ marginRight: '8px' }} /> Download All ({doneCount} files) <ArrowRight size={18} style={{ marginLeft: '8px' }} /> {toFmt}
                                    </button>
                                ) : (
                                    <button
                                        id="convert-start-btn"
                                        className={`fq-convert-btn ${isConverting ? 'fq-convert-btn--loading' : ''}`}
                                        onClick={handleConvertAll}
                                        disabled={isConverting || readyCount === 0}
                                    >
                                        {isConverting
                                            ? <><span className="fq-spinner" /> Converting {convertingCount} file{convertingCount > 1 ? 's' : ''}…</>
                                            : <><RefreshCw size={18} style={{ marginRight: '8px' }} /> Convert {readyCount > 0 ? readyCount : files.length} File{files.length !== 1 ? 's' : ''} <ArrowRight size={18} style={{ marginLeft: '8px' }} /> {toFmt}</>}
                                    </button>
                                )}
                            </div>
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
                                            <button
                                                key={f}
                                                className="sf-tag"
                                                style={{ borderColor: `${g.color}30`, color: g.color, background: `${g.color}10` }}
                                                onClick={() => setToFmt(f)}
                                                title={`Set target to ${f}`}
                                            >{f}</button>
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

// Gauge pill helper
function gaugePill(ready, converting, done, error) {
    return (
        <div className="fq-gauge">
            {ready > 0 && <span className="fq-gauge__item fq-gauge__item--ready">{ready} ready</span>}
            {converting > 0 && <span className="fq-gauge__item fq-gauge__item--conv">{converting} converting</span>}
            {done > 0 && <span className="fq-gauge__item fq-gauge__item--done">{done} done</span>}
            {error > 0 && <span className="fq-gauge__item fq-gauge__item--err">{error} failed</span>}
        </div>
    );
}
