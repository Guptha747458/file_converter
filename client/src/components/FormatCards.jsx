import './FormatCards.css';

const formats = [
    {
        id: 'fmt-images',
        label: 'Image Converter',
        icon: '🖼',
        desc: 'JPG, PNG, WEBP, GIF, AVIF, SVG, BMP and more',
        tag: '24 formats',
        color: '#7c5cfc',
        gradient: 'linear-gradient(135deg, rgba(124,92,252,0.15), rgba(124,92,252,0.04))',
    },
    {
        id: 'fmt-docs',
        label: 'Document Converter',
        icon: '📄',
        desc: 'PDF, DOCX, XLSX, PPTX, TXT, ODT and more',
        tag: '18 formats',
        color: '#00d4ff',
        gradient: 'linear-gradient(135deg, rgba(0,212,255,0.12), rgba(0,212,255,0.03))',
    },
    {
        id: 'fmt-audio',
        label: 'Audio Converter',
        icon: '🎵',
        desc: 'MP3, WAV, FLAC, AAC, OGG, M4A and more',
        tag: '15 formats',
        color: '#22d3a0',
        gradient: 'linear-gradient(135deg, rgba(34,211,160,0.12), rgba(34,211,160,0.03))',
    },
    {
        id: 'fmt-video',
        label: 'Video Converter',
        icon: '🎬',
        desc: 'MP4, AVI, MOV, MKV, WEBM, FLV and more',
        tag: '12 formats',
        color: '#f59e0b',
        gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.03))',
    },
    {
        id: 'fmt-archive',
        label: 'Archive Converter',
        icon: '📦',
        desc: 'ZIP, TAR, GZ, 7Z, RAR, BZ2 and more',
        tag: '8 formats',
        color: '#f43f5e',
        gradient: 'linear-gradient(135deg, rgba(244,63,94,0.12), rgba(244,63,94,0.03))',
    },
    {
        id: 'fmt-ebook',
        label: 'eBook Converter',
        icon: '📚',
        desc: 'EPUB, MOBI, AZW3, PDF, FB2 and more',
        tag: '10 formats',
        color: '#818cf8',
        gradient: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(129,140,248,0.03))',
    },
];

export default function FormatCards() {
    return (
        <div className="format-cards-section">
            <div className="format-cards-section__header">
                <h3 className="format-cards-section__title">Supported Categories</h3>
                <span className="format-cards-section__badge">80+ formats</span>
            </div>
            <div className="format-cards">
                {formats.map((f, i) => (
                    <button
                        key={f.id}
                        id={f.id}
                        className="format-card"
                        style={{ background: f.gradient, animationDelay: `${i * 70}ms` }}
                    >
                        <div className="format-card__top">
                            <span className="format-card__icon">{f.icon}</span>
                            <span className="format-card__tag" style={{ color: f.color, borderColor: `${f.color}30`, background: `${f.color}12` }}>
                                {f.tag}
                            </span>
                        </div>
                        <p className="format-card__label" style={{ color: f.color }}>{f.label}</p>
                        <p className="format-card__desc">{f.desc}</p>
                        <div className="format-card__arrow" style={{ color: f.color }}>→</div>
                        <div className="format-card__glow" style={{ background: `radial-gradient(circle at 0% 100%, ${f.color}25, transparent 65%)` }} />
                    </button>
                ))}
            </div>
        </div>
    );
}
