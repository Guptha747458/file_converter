import { useState } from 'react';
import './FormatsPage.css';

const FORMAT_CATEGORIES = [
    {
        id: 'images',
        label: 'Image Formats',
        icon: '🖼',
        color: '#7c5cfc',
        desc: 'Raster, vector, and animated image formats',
        formats: [
            { ext: 'JPG', name: 'JPEG Image', desc: 'Lossy compressed photos', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'PNG', name: 'Portable Network Graphic', desc: 'Lossless with transparency', canFrom: true, canTo: true, size: 'Medium', quality: 'Excellent' },
            { ext: 'WEBP', name: 'WebP Image', desc: 'Modern web format by Google', canFrom: true, canTo: true, size: 'Small', quality: 'Excellent' },
            { ext: 'AVIF', name: 'AV1 Image File', desc: 'Next-gen high-efficiency image', canFrom: true, canTo: true, size: 'Tiny', quality: 'Excellent' },
            { ext: 'GIF', name: 'Graphics Interchange Format', desc: 'Animated & static images', canFrom: true, canTo: true, size: 'Large', quality: 'Fair' },
            { ext: 'BMP', name: 'Bitmap Image', desc: 'Uncompressed raster image', canFrom: true, canTo: true, size: 'Large', quality: 'Excellent' },
            { ext: 'TIFF', name: 'Tagged Image Format', desc: 'Professional print quality', canFrom: true, canTo: true, size: 'Large', quality: 'Excellent' },
            { ext: 'SVG', name: 'Scalable Vector Graphic', desc: 'Infinite-resolution vector art', canFrom: true, canTo: false, size: 'Tiny', quality: 'Excellent' },
            { ext: 'HEIC', name: 'High Efficiency Image', desc: 'Apple device photos', canFrom: true, canTo: true, size: 'Tiny', quality: 'Excellent' },
            { ext: 'ICO', name: 'Icon Format', desc: 'Windows icons & favicons', canFrom: false, canTo: true, size: 'Tiny', quality: 'Good' },
            { ext: 'PSD', name: 'Photoshop Document', desc: 'Adobe Photoshop layered file', canFrom: true, canTo: false, size: 'Large', quality: 'Excellent' },
            { ext: 'RAW', name: 'Camera RAW', desc: 'Unprocessed sensor data', canFrom: true, canTo: false, size: 'Huge', quality: 'Excellent' },
        ],
    },
    {
        id: 'documents',
        label: 'Document Formats',
        icon: '📄',
        color: '#00d4ff',
        desc: 'Office documents, PDFs, and text files',
        formats: [
            { ext: 'PDF', name: 'Portable Document Format', desc: 'Universal document format', canFrom: true, canTo: true, size: 'Medium', quality: 'Excellent' },
            { ext: 'DOCX', name: 'Word Document', desc: 'Microsoft Word 2007+', canFrom: true, canTo: true, size: 'Small', quality: 'Excellent' },
            { ext: 'XLSX', name: 'Excel Spreadsheet', desc: 'Microsoft Excel 2007+', canFrom: true, canTo: true, size: 'Small', quality: 'Excellent' },
            { ext: 'PPTX', name: 'PowerPoint Presentation', desc: 'Microsoft PowerPoint 2007+', canFrom: true, canTo: true, size: 'Medium', quality: 'Excellent' },
            { ext: 'ODT', name: 'OpenDocument Text', desc: 'LibreOffice / OpenOffice', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'ODS', name: 'OpenDocument Spreadsheet', desc: 'LibreOffice Calc format', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'TXT', name: 'Plain Text', desc: 'Simple unformatted text', canFrom: true, canTo: true, size: 'Tiny', quality: 'Fair' },
            { ext: 'RTF', name: 'Rich Text Format', desc: 'Cross-platform formatted text', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'CSV', name: 'Comma-Separated Values', desc: 'Tabular data text format', canFrom: true, canTo: true, size: 'Tiny', quality: 'Fair' },
            { ext: 'HTML', name: 'HyperText Markup Language', desc: 'Web page document', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'MD', name: 'Markdown Document', desc: 'Lightweight markup language', canFrom: true, canTo: true, size: 'Tiny', quality: 'Good' },
            { ext: 'EPUB', name: 'Electronic Publication', desc: 'Standard eBook format', canFrom: true, canTo: true, size: 'Small', quality: 'Excellent' },
        ],
    },
    {
        id: 'audio',
        label: 'Audio Formats',
        icon: '🎵',
        color: '#22d3a0',
        desc: 'Lossless, lossy, and streaming audio',
        formats: [
            { ext: 'MP3', name: 'MPEG Audio Layer III', desc: 'Universal compressed audio', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'WAV', name: 'Waveform Audio', desc: 'Uncompressed PCM audio', canFrom: true, canTo: true, size: 'Large', quality: 'Excellent' },
            { ext: 'FLAC', name: 'Free Lossless Audio Codec', desc: 'Lossless compressed audio', canFrom: true, canTo: true, size: 'Medium', quality: 'Excellent' },
            { ext: 'AAC', name: 'Advanced Audio Coding', desc: 'Better compression than MP3', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'OGG', name: 'Ogg Vorbis', desc: 'Open source audio codec', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'M4A', name: 'MPEG-4 Audio', desc: 'Apple audio format', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'OPUS', name: 'Opus Audio', desc: 'Low-latency internet audio', canFrom: true, canTo: true, size: 'Tiny', quality: 'Excellent' },
            { ext: 'WMA', name: 'Windows Media Audio', desc: 'Microsoft audio format', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'AIFF', name: 'Audio Interchange File Format', desc: 'Apple uncompressed audio', canFrom: true, canTo: true, size: 'Large', quality: 'Excellent' },
        ],
    },
    {
        id: 'video',
        label: 'Video Formats',
        icon: '🎬',
        color: '#f59e0b',
        desc: 'Standard, HD, and streaming video containers',
        formats: [
            { ext: 'MP4', name: 'MPEG-4 Video', desc: 'Universal video container', canFrom: true, canTo: true, size: 'Medium', quality: 'Excellent' },
            { ext: 'WEBM', name: 'WebM Video', desc: 'Open web video format', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'MKV', name: 'Matroska Video', desc: 'Multi-track open container', canFrom: true, canTo: true, size: 'Large', quality: 'Excellent' },
            { ext: 'AVI', name: 'Audio Video Interleave', desc: 'Classic Windows video', canFrom: true, canTo: true, size: 'Large', quality: 'Good' },
            { ext: 'MOV', name: 'QuickTime Movie', desc: 'Apple QuickTime format', canFrom: true, canTo: true, size: 'Large', quality: 'Excellent' },
            { ext: 'FLV', name: 'Flash Video', desc: 'Legacy web video format', canFrom: true, canTo: true, size: 'Small', quality: 'Fair' },
            { ext: 'WMV', name: 'Windows Media Video', desc: 'Microsoft video format', canFrom: true, canTo: true, size: 'Medium', quality: 'Good' },
            { ext: 'GIF', name: 'Animated GIF', desc: 'Convert video to animation', canFrom: true, canTo: true, size: 'Large', quality: 'Fair' },
            { ext: 'M4V', name: 'iTunes Video', desc: 'Apple iTunes video', canFrom: true, canTo: false, size: 'Medium', quality: 'Excellent' },
        ],
    },
    {
        id: 'archives',
        label: 'Archive Formats',
        icon: '📦',
        color: '#f43f5e',
        desc: 'Compressed archive and package formats',
        formats: [
            { ext: 'ZIP', name: 'ZIP Archive', desc: 'Universal compressed archive', canFrom: true, canTo: true, size: 'Varies', quality: 'Good' },
            { ext: 'TAR', name: 'Tape Archive', desc: 'Unix bundle (no compression)', canFrom: true, canTo: true, size: 'Varies', quality: 'N/A' },
            { ext: 'GZ', name: 'GNU Zip', desc: 'Gzip compressed file', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: '7Z', name: '7-Zip Archive', desc: 'High compression ratio', canFrom: true, canTo: true, size: 'Tiny', quality: 'Excellent' },
            { ext: 'BZ2', name: 'Bzip2 Compressed', desc: 'High-ratio Unix compress', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'RAR', name: 'Roshal Archive', desc: 'Popular Windows archive', canFrom: true, canTo: false, size: 'Small', quality: 'Good' },
            { ext: 'XZ', name: 'XZ Compressed', desc: 'LZMA2-based compression', canFrom: true, canTo: true, size: 'Tiny', quality: 'Excellent' },
        ],
    },
    {
        id: 'ebooks',
        label: 'eBook Formats',
        icon: '📚',
        color: '#818cf8',
        desc: 'Digital reading and publishing formats',
        formats: [
            { ext: 'EPUB', name: 'Electronic Publication', desc: 'Open eBook standard', canFrom: true, canTo: true, size: 'Small', quality: 'Excellent' },
            { ext: 'MOBI', name: 'Mobipocket eBook', desc: 'Kindle predecessor format', canFrom: true, canTo: true, size: 'Small', quality: 'Good' },
            { ext: 'AZW3', name: 'Kindle Format 8', desc: 'Modern Amazon Kindle', canFrom: true, canTo: true, size: 'Small', quality: 'Excellent' },
            { ext: 'FB2', name: 'FictionBook 2.0', desc: 'Russian eBook standard', canFrom: true, canTo: true, size: 'Tiny', quality: 'Good' },
            { ext: 'LIT', name: 'Microsoft Reader', desc: 'Legacy Microsoft eBook', canFrom: true, canTo: false, size: 'Small', quality: 'Fair' },
            { ext: 'PDF', name: 'PDF eBook', desc: 'Fixed-layout digital book', canFrom: true, canTo: true, size: 'Medium', quality: 'Excellent' },
        ],
    },
];

const QUALITY_COLOR = {
    Excellent: '#22d3a0',
    Good: '#7c5cfc',
    Fair: '#f59e0b',
    'N/A': '#606882',
};

const SIZE_COLOR = {
    Tiny: '#22d3a0',
    Small: '#7c5cfc',
    Medium: '#00d4ff',
    Large: '#f59e0b',
    Huge: '#f43f5e',
    Varies: '#818cf8',
};

export default function FormatsPage() {
    const [activeCategory, setActiveCategory] = useState('images');
    const [search, setSearch] = useState('');

    const category = FORMAT_CATEGORIES.find(c => c.id === activeCategory);

    const filtered = category
        ? category.formats.filter(
            f =>
                f.ext.toLowerCase().includes(search.toLowerCase()) ||
                f.name.toLowerCase().includes(search.toLowerCase()) ||
                f.desc.toLowerCase().includes(search.toLowerCase())
        )
        : [];

    const totalFormats = FORMAT_CATEGORIES.reduce((n, c) => n + c.formats.length, 0);

    return (
        <main className="formats-page">
            <div className="formats-page__bg-glow" aria-hidden="true" />

            {/* Header */}
            <div className="formats-page__header">
                <div>
                    <h2 className="formats-page__title">Supported Formats</h2>
                    <p className="formats-page__sub">
                        Explore all <strong>{totalFormats}+</strong> file formats supported by FileForge
                    </p>
                </div>
                <div className="formats-page__search">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        className="formats-page__search-input"
                        type="search"
                        placeholder="Search formats…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Category tabs */}
            <div className="formats-cats">
                {FORMAT_CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`formats-cat-btn ${activeCategory === cat.id ? 'formats-cat-btn--active' : ''}`}
                        style={activeCategory === cat.id ? {
                            borderColor: cat.color,
                            color: cat.color,
                            background: `${cat.color}18`,
                            boxShadow: `0 0 20px ${cat.color}22`,
                        } : {}}
                        onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
                    >
                        <span className="formats-cat-btn__icon">{cat.icon}</span>
                        <span className="formats-cat-btn__label">{cat.label}</span>
                        <span className="formats-cat-btn__count" style={{ background: `${cat.color}18`, color: cat.color }}>
                            {cat.formats.length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Category intro */}
            {category && (
                <div className="formats-intro glass-card" style={{ borderColor: `${category.color}30` }}>
                    <span className="formats-intro__icon">{category.icon}</span>
                    <div>
                        <h3 className="formats-intro__title" style={{ color: category.color }}>{category.label}</h3>
                        <p className="formats-intro__desc">{category.desc}</p>
                    </div>
                    <div className="formats-intro__stat">
                        <span className="formats-intro__stat-num" style={{ color: category.color }}>{category.formats.length}</span>
                        <span className="formats-intro__stat-label">formats</span>
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="formats-legend">
                <span className="formats-legend__item">
                    <span className="formats-badge formats-badge--from">From</span>
                    Can convert FROM this format
                </span>
                <span className="formats-legend__item">
                    <span className="formats-badge formats-badge--to">To</span>
                    Can convert TO this format
                </span>
            </div>

            {/* Format grid */}
            <div className="formats-grid">
                {filtered.length === 0 ? (
                    <div className="formats-empty">No formats found for "{search}"</div>
                ) : (
                    filtered.map((fmt, i) => (
                        <div
                            key={fmt.ext}
                            className="fmt-card glass-card"
                            style={{ animationDelay: `${i * 40}ms`, borderColor: `${category.color}20` }}
                        >
                            <div className="fmt-card__header">
                                <div className="fmt-card__ext" style={{ background: `${category.color}18`, color: category.color }}>
                                    .{fmt.ext}
                                </div>
                                <div className="fmt-card__badges">
                                    {fmt.canFrom && <span className="formats-badge formats-badge--from">From</span>}
                                    {fmt.canTo && <span className="formats-badge formats-badge--to">To</span>}
                                </div>
                            </div>
                            <p className="fmt-card__name">{fmt.name}</p>
                            <p className="fmt-card__desc">{fmt.desc}</p>
                            <div className="fmt-card__meta">
                                <span className="fmt-card__meta-row">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21 15V6m0 0H12m9 0l-9 9-4-4-7 7" />
                                    </svg>
                                    <span style={{ color: QUALITY_COLOR[fmt.quality] }}>{fmt.quality}</span>
                                </span>
                                <span className="fmt-card__meta-row">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                                    </svg>
                                    <span style={{ color: SIZE_COLOR[fmt.size] }}>{fmt.size}</span>
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
