require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuid } = require('uuid');
const sharp = require('sharp');
const sharpBmp = require('sharp-bmp');
const archiver = require('archiver');
const XLSX = require('xlsx');
const mammoth = require('mammoth');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const pdf = require('pdf-parse');
const ffmpeg = require('fluent-ffmpeg');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const libre = require('libreoffice-convert');
const util = require('util');
const libreConvert = util.promisify(libre.convert);

const app = express();
const PORT = process.env.PORT || 4000;

// ── Directories ──────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'outputs');
[UPLOAD_DIR, OUTPUT_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ── In-memory history ─────────────────────────────────────────────────────────
const history = [];   // { id, originalName, fromFmt, toFmt, inputSize, outputSize, duration, createdAt, outputFile }

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// Serve converted outputs
app.use('/outputs', express.static(OUTPUT_DIR));

// Multer: disk storage
const storage = multer.diskStorage({
    destination: (_, __, cb) => cb(null, UPLOAD_DIR),
    filename: (_, file, cb) => cb(null, `${uuid()}-${file.originalname}`),
});
const upload = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
});

// ── PDF Extraction Helper ───────────────────────────────────────────────────
async function extractTextFromPdf(buffer) {
    // pdf-parse v1.1.1 is a function
    return await pdf(buffer);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const ext = name => path.extname(name).replace('.', '').toUpperCase();

// Clean text for PDF (WinAnsi fallback)
function cleanPdfText(text) {
    if (!text) return ' ';
    return text.trim(); // Keep Unicode symbols!
}

// Load TrueType font for Unicode support (Arial on Windows)
const FONT_PATH = 'C:/Windows/Fonts/arial.ttf';
let customFontBuffer = null;
if (fs.existsSync(FONT_PATH)) {
    customFontBuffer = fs.readFileSync(FONT_PATH);
}

// Image formats sharp can output
const SHARP_OUTPUT = ['JPEG', 'JPG', 'PNG', 'WEBP', 'AVIF', 'GIF', 'TIFF', 'BMP'];
const SHARP_READABLE = ['JPEG', 'JPG', 'PNG', 'WEBP', 'AVIF', 'GIF', 'TIFF', 'BMP', 'HEIC', 'SVG', 'ICO'];

function sharpFormat(fmt) {
    if (fmt === 'JPG') return 'jpeg';
    return fmt.toLowerCase();
}

// ── Conversion logic ──────────────────────────────────────────────────────────
async function convertFile(inputPath, originalName, fromFmt, toFmt, quality, resolution) {
    const jobId = uuid();
    const outName = `${jobId}.${toFmt.toLowerCase()}`;
    const outPath = path.join(OUTPUT_DIR, outName);
    const inExt = fromFmt.toUpperCase();
    const outExt = toFmt.toUpperCase();

    // ── HEIC → IMAGE ──────────────────────────────────────────────────────────
    if (inExt === 'HEIC') {
        const heicConvert = require('heic-convert');
        const inputBuf = fs.readFileSync(inputPath);
        const outputBuf = await heicConvert({
            buffer: inputBuf,
            format: 'PNG'
        });
        // Save as temporary PNG or continue with sharp? 
        // Let's save it to outPath if target is PNG, otherwise continue with Sharp
        if (outExt === 'PNG') {
            fs.writeFileSync(outPath, outputBuf);
            return outName;
        }
        // If not PNG, replace inputPath with the converted buffer for Sharp
        const tmpPng = path.join(UPLOAD_DIR, `${jobId}-tmp.png`);
        fs.writeFileSync(tmpPng, outputBuf);
        inputPath = tmpPng; // Redirect sharp to use the decoded buffer
    }

    // ── IMAGE → IMAGE ──────────────────────────────────────────────────────────
    if (SHARP_READABLE.includes(inExt) && SHARP_OUTPUT.includes(outExt)) {
        try {
            const qualityMap = { low: 40, medium: 70, high: 90 };
            const q = qualityMap[quality] ?? 80;
            let sharpChain = sharp(inputPath);
            if (outExt === 'JPG' || outExt === 'JPEG') {
                sharpChain = sharpChain.jpeg({ quality: q });
            } else if (outExt === 'PNG') {
                sharpChain = sharpChain.png({ compressionLevel: Math.round((100 - q) / 11) });
            } else if (outExt === 'WEBP') {
                sharpChain = sharpChain.webp({ quality: q });
            } else if (outExt === 'AVIF') {
                sharpChain = sharpChain.avif({ quality: q });
            } else if (outExt === 'GIF') {
                sharpChain = sharpChain.gif();
            } else if (outExt === 'TIFF') {
                sharpChain = sharpChain.tiff({ quality: q });
            } else if (outExt === 'BMP') {
                const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
                const bmpData = sharpBmp.encode({ data, width: info.width, height: info.height });
                fs.writeFileSync(outPath, bmpData.data);
                return outName;
            }
            await sharpChain.toFile(outPath);
            return outName;
        } catch (sharpErr) {
            console.error(`Sharp conversion error for ${originalName}:`, sharpErr);
            throw sharpErr;
        }
    }

    // ── DOCX → HTML / TXT / PDF ───────────────────────────────────────────────
    if (inExt === 'DOCX') {
        if (outExt === 'HTML') {
            const result = await mammoth.convertToHtml({ path: inputPath });
            fs.writeFileSync(outPath.replace(/\.\w+$/, '.html'), result.value, 'utf8');
            return outName.replace(/\.\w+$/, '.html');
        }
        if (outExt === 'TXT') {
            const result = await mammoth.extractRawText({ path: inputPath });
            const p = outPath.replace(/\.\w+$/, '.txt');
            fs.writeFileSync(p, result.value, 'utf8');
            return path.basename(p);
        }
        if (outExt === 'PDF') {
            try {
                const docBuf = fs.readFileSync(inputPath);
                const pdfBuf = await libreConvert(docBuf, '.pdf', undefined);
                fs.writeFileSync(outPath, pdfBuf);
                return outName;
            } catch (libreErr) {
                console.warn('LibreOffice conversion failed, falling back to basic PDF generation:', libreErr.message);
                const result = await mammoth.extractRawText({ path: inputPath });
                const pdfDoc = await PDFDocument.create();
                const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

                const lines = result.value.split('\n');
                let page = pdfDoc.addPage([600, 800]);
                let y = 750;
                for (const line of lines) {
                    if (y < 40) { page = pdfDoc.addPage([600, 800]); y = 750; }
                    const cleaned = cleanPdfText(line.slice(0, 95));
                    page.drawText(cleaned || ' ', { x: 50, y, size: 10.5, font });
                    y -= 13.5;
                }
                fs.writeFileSync(outPath, await pdfDoc.save());
                return outName;
            }
        }
    }

    // ── XLSX / XLS → CSV ──────────────────────────────────────────────────────
    if ((inExt === 'XLSX' || inExt === 'XLS') && outExt === 'CSV') {
        const wb = XLSX.readFile(inputPath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const csv = XLSX.utils.sheet_to_csv(ws);
        const csvPath = outPath.replace(/\.\w+$/, '.csv');
        fs.writeFileSync(csvPath, csv, 'utf8');
        return path.basename(csvPath);
    }

    // ── CSV → XLSX ────────────────────────────────────────────────────────────
    if (inExt === 'CSV' && outExt === 'XLSX') {
        const csv = fs.readFileSync(inputPath, 'utf8');
        const wb = XLSX.read(csv, { type: 'string' });
        const xlsxPath = outPath.replace(/\.\w+$/, '.xlsx');
        XLSX.writeFile(wb, xlsxPath);
        return path.basename(xlsxPath);
    }

    // ── XLSX → JSON ───────────────────────────────────────────────────────────
    if ((inExt === 'XLSX' || inExt === 'XLS') && outExt === 'JSON') {
        const wb = XLSX.readFile(inputPath);
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        const jsonPath = outPath.replace(/\.\w+$/, '.json');
        fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf8');
        return path.basename(jsonPath);
    }

    // ── JSON → CSV ────────────────────────────────────────────────────────────
    if (inExt === 'JSON' && outExt === 'CSV') {
        const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
        const rows = Array.isArray(data) ? data : [data];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows));
        const csvPath = outPath.replace(/\.\w+$/, '.csv');
        XLSX.writeFile(wb, csvPath, { bookType: 'csv' });
        return path.basename(csvPath);
    }

    // ── TXT → JSON / JSON → TXT ───────────────────────────────────────────────
    if (inExt === 'TXT' && outExt === 'JSON') {
        const text = fs.readFileSync(inputPath, 'utf8');
        const lines = text.split('\n').filter(Boolean);
        const jsonPath = outPath.replace(/\.\w+$/, '.json');
        fs.writeFileSync(jsonPath, JSON.stringify({ lines }, null, 2));
        return path.basename(jsonPath);
    }
    if (inExt === 'JSON' && outExt === 'TXT') {
        const json = fs.readFileSync(inputPath, 'utf8');
        const txtPath = outPath.replace(/\.\w+$/, '.txt');
        fs.writeFileSync(txtPath, json, 'utf8');
        return path.basename(txtPath);
    }

    // ── IMAGE → PDF ──────────────────────────────────────────────────────────
    if (SHARP_READABLE.includes(inExt) && outExt === 'PDF') {
        const { data, info } = await sharp(inputPath).png().toBuffer({ resolveWithObject: true });
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([info.width, info.height]);
        const img = await pdfDoc.embedPng(data);
        page.drawImage(img, { x: 0, y: 0, width: info.width, height: info.height });
        fs.writeFileSync(outPath, await pdfDoc.save());
        return outName;
    }

    // ── TXT → PDF ─────────────────────────────────────────────────────────────
    if (inExt === 'TXT' && outExt === 'PDF') {
        const text = fs.readFileSync(inputPath, 'utf8');
        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        const lines = text.split('\n');
        let page = pdfDoc.addPage([600, 800]);
        let y = 750;
        for (const line of lines) {
            if (y < 40) { page = pdfDoc.addPage([600, 800]); y = 750; }
            const cleaned = cleanPdfText(line.slice(0, 90));
            page.drawText(cleaned || ' ', { x: 50, y, size: 11, font });
            y -= 14;
        }
        fs.writeFileSync(outPath, await pdfDoc.save());
        return outName;
    }

    // ── PDF → DOCX / TXT ──────────────────────────────────────────────────────
    if (inExt === 'PDF' && (outExt === 'DOCX' || outExt === 'TXT' || outExt === 'HTML')) {
        const buffer = fs.readFileSync(inputPath);
        const data = await extractTextFromPdf(buffer);
        const text = data.text || '';

        if (outExt === 'TXT') {
            fs.writeFileSync(outPath, text, 'utf8');
            return outName;
        }
        if (outExt === 'HTML') {
            const html = `<html><body style="font-family:sans-serif; white-space:pre-wrap;">${text}</body></html>`;
            fs.writeFileSync(outPath, html, 'utf8');
            return outName;
        }
        if (outExt === 'DOCX') {
            const doc = new Document({
                sections: [{
                    children: text.split('\n').map(line => new Paragraph({
                        children: [new TextRun(line.trim() || ' ')]
                    }))
                }]
            });
            const outBuf = await Packer.toBuffer(doc);
            fs.writeFileSync(outPath, outBuf);
            return outName;
        }
    }

    // ── MEDIA (AUDIO/VIDEO) ───────────────────────────────────────────────────
    const AUDIO = ['MP3', 'WAV', 'FLAC', 'OGG', 'M4A', 'AAC'];
    const VIDEO = ['MP4', 'WEBM', 'MKV', 'AVI', 'MOV', 'FLV', 'WMV'];
    if ((AUDIO.includes(inExt) || VIDEO.includes(inExt)) && (AUDIO.includes(outExt) || VIDEO.includes(outExt))) {
        await new Promise((resolve, reject) => {
            let outputFmt = toFmt.toLowerCase();
            if (outputFmt === 'aac') outputFmt = 'adts';
            if (outputFmt === 'm4a') outputFmt = 'ipod';
            if (outputFmt === 'mkv') outputFmt = 'matroska';
            let command = ffmpeg(inputPath).toFormat(outputFmt);
            if (AUDIO.includes(outExt) && VIDEO.includes(inExt)) {
                command = command.noVideo();
            } else if (VIDEO.includes(outExt)) {
                if (resolution === '1080p') command = command.size('1920x1080');
                else if (resolution === '720p') command = command.size('1280x720');
                else if (resolution === '480p') command = command.size('854x480');
            }
            if (outExt === 'AAC' || outExt === 'M4A') {
                command = command.audioCodec('aac');
            }
            if (outExt === 'WEBM') {
                command = command.videoCodec('libvpx').audioCodec('libvorbis');
            }
            if (outExt === 'FLV') {
                command = command.videoCodec('libx264').audioCodec('aac');
            }
            command.on('end', resolve).on('error', reject).save(outPath);
        });
        return outName;
    }

    // ── ANY → ZIP / TAR (archive) ──────────────────────────────────────────────
    if (outExt === 'ZIP' || outExt === 'TAR') {
        const type = outExt.toLowerCase();
        const finalPath = outPath.replace(/\.\w+$/, `.${type}`);
        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(finalPath);
            const archive = archiver(type, { zlib: { level: 9 } });
            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);
            archive.file(inputPath, { name: originalName });
            archive.finalize();
        });
        return path.basename(finalPath);
    }

    // ── ZIP → extract first file (simplistic) ─────────────────────────────────
    if (inExt === 'ZIP' && outExt !== 'ZIP') {
        const extract = require('extract-zip');
        const tmpDir = path.join(UPLOAD_DIR, `extract-${uuid()}`);
        fs.mkdirSync(tmpDir, { recursive: true });
        
        await extract(inputPath, { dir: tmpDir });
        const files = fs.readdirSync(tmpDir);
        
        if (files.length > 0) {
            // Pick first file that isn't a directory
            const firstFile = files.find(f => fs.statSync(path.join(tmpDir, f)).isFile());
            if (firstFile) {
                const extractedPath = path.join(tmpDir, firstFile);
                const outExtFinal = path.extname(firstFile) || `.${toFmt.toLowerCase()}`;
                const finalOutPath = outPath.replace(/\.[^.]+$/, outExtFinal);
                fs.copyFileSync(extractedPath, finalOutPath);
                // Clean up tmp dir
                fs.rmSync(tmpDir, { recursive: true, force: true });
                return path.basename(finalOutPath);
            }
        }
        // Fallback: just return the zip if extraction fails or empty
        fs.rmSync(tmpDir, { recursive: true, force: true });
        const copyPath = outPath.replace(/\.\w+$/, '.zip');
        fs.copyFileSync(inputPath, copyPath);
        return path.basename(copyPath);
    }

    // ── Passthrough / copy (same format or unrecognised pair) ─────────────────
    const copyExt = path.extname(originalName) || `.${toFmt.toLowerCase()}`;
    const copyPath = outPath.replace(/\.[^.]+$/, copyExt);
    fs.copyFileSync(inputPath, copyPath);
    return path.basename(copyPath);
}

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (_, res) => res.json({ status: 'ok', version: '1.0.0' }));

// Supported formats mapping API
app.get('/api/supported-formats', (_, res) => {
    res.json({
        audio: [
            { from: 'mp3', to: ['aac', 'm4a'] },
            { from: 'wav', to: ['aac', 'm4a'] },
            { from: 'mp4', to: ['aac'] },
            { from: 'flac', to: ['aac', 'm4a'] }
        ],
        archive: [
            { from: 'any', to: ['zip', 'tar'] },
            { from: 'zip', to: ['extract'] }
        ],
        video: [
            { from: 'any', to: ['mp4', 'webm', 'mkv', 'avi', 'mov', 'flv', 'wmv'] }
        ]
    });
});

// Convert endpoint
app.post('/api/convert', upload.single('file'), async (req, res) => {
    const start = Date.now();
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { toFmt = 'PNG', quality = 'high', resolution = 'original' } = req.body;
    const originalName = req.file.originalname;
    const fromFmt = ext(originalName) || req.body.fromFmt || 'UNKNOWN';
    const inputPath = req.file.path;
    const inputSize = req.file.size;

    try {
        const outputFile = await convertFile(inputPath, originalName, fromFmt, toFmt, quality, resolution);
        const outputPath = path.join(OUTPUT_DIR, outputFile);
        const outputSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
        const duration = Date.now() - start;

        const record = {
            id: uuid(),
            originalName,
            fromFmt,
            toFmt: toFmt.toUpperCase(),
            inputSize,
            outputSize,
            duration,
            createdAt: new Date().toISOString(),
            outputFile,
            icon: fromFmt.match(/^(JPG|JPEG|PNG|WEBP|GIF|AVIF|BMP|TIFF|SVG)$/i) ? '🖼' :
                fromFmt.match(/^(PDF|DOCX|XLSX|PPTX|TXT|RTF|ODT|CSV)$/i) ? '📄' :
                    fromFmt.match(/^(MP3|WAV|FLAC|AAC|OGG|M4A)$/i) ? '🎵' :
                        fromFmt.match(/^(MP4|AVI|MOV|MKV|WEBM|FLV)$/i) ? '🎬' :
                            fromFmt.match(/^(ZIP|TAR|GZ|7Z|BZ2|RAR)$/i) ? '📦' : '📁',
        };
        history.unshift(record);

        // Clean up input
        fs.unlink(inputPath, () => { });

        res.json({
            success: true,
            id: record.id,
            outputFile,
            downloadUrl: `/outputs/${outputFile}`,
            outputSize,
            duration,
        });
    } catch (err) {
        console.error('Conversion error:', err);
        fs.unlink(inputPath, () => { });
        res.status(500).json({ error: err.message || 'Conversion failed' });
    }
});

// Batch convert: multiple files
app.post('/api/convert/batch', upload.array('files', 50), async (req, res) => {
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files' });
    const { toFmt = 'PNG', quality = 'high', resolution = 'original' } = req.body;
    const results = [];

    for (const file of req.files) {
        const fromFmt = ext(file.originalname) || 'UNKNOWN';
        const start = Date.now();
        try {
            const outputFile = await convertFile(file.path, file.originalname, fromFmt, toFmt, quality, resolution);
            const outputPath = path.join(OUTPUT_DIR, outputFile);
            const outputSize = fs.existsSync(outputPath) ? fs.statSync(outputPath).size : 0;
            const record = {
                id: uuid(),
                originalName: file.originalname,
                fromFmt,
                toFmt: toFmt.toUpperCase(),
                inputSize: file.size,
                outputSize,
                duration: Date.now() - start,
                createdAt: new Date().toISOString(),
                outputFile,
                icon: fromFmt.match(/^(JPG|JPEG|PNG|WEBP|GIF|AVIF|BMP|TIFF|SVG)$/i) ? '🖼' :
                    fromFmt.match(/^(PDF|DOCX|XLSX|PPTX|TXT|RTF|ODT|CSV)$/i) ? '📄' :
                        fromFmt.match(/^(MP3|WAV|FLAC|AAC|OGG|M4A)$/i) ? '🎵' :
                            fromFmt.match(/^(MP4|AVI|MOV|MKV|WEBM|FLV)$/i) ? '🎬' :
                                fromFmt.match(/^(ZIP|TAR|GZ|7Z|BZ2|RAR)$/i) ? '📦' : '📁',
            };
            history.unshift(record);
            results.push({ success: true, id: record.id, originalName: file.originalname, outputFile, downloadUrl: `/outputs/${outputFile}`, outputSize });
        } catch (err) {
            results.push({ success: false, originalName: file.originalname, error: err.message });
        }
        fs.unlink(file.path, () => { });
    }
    res.json({ results });
});

// Get history
app.get('/api/history', (req, res) => {
    const { limit = 50, offset = 0, search = '', filter = 'All' } = req.query;
    let data = history;
    if (search) data = data.filter(h => h.originalName.toLowerCase().includes(search.toLowerCase()));
    if (filter !== 'All') {
        const grpMap = {
            Image: /^(JPG|JPEG|PNG|WEBP|GIF|AVIF|BMP|TIFF|SVG|HEIC)$/i,
            Document: /^(PDF|DOCX|XLSX|XLS|PPTX|TXT|RTF|ODT|CSV|HTML|MD)$/i,
            Audio: /^(MP3|WAV|FLAC|AAC|OGG|M4A|OPUS|WMA)$/i,
            Video: /^(MP4|AVI|MOV|MKV|WEBM|FLV|WMV)$/i,
            Archive: /^(ZIP|TAR|GZ|7Z|BZ2|RAR|XZ)$/i,
        };
        const rx = grpMap[filter];
        if (rx) data = data.filter(h => rx.test(h.fromFmt) || rx.test(h.toFmt));
    }
    const total = data.length;
    const page = data.slice(Number(offset), Number(offset) + Number(limit));
    const totalInputSize = history.reduce((s, h) => s + h.inputSize, 0);
    const totalOutputSize = history.reduce((s, h) => s + h.outputSize, 0);
    res.json({ items: page, total, totalInputSize, totalOutputSize });
});

// Delete history item
app.delete('/api/history/:id', (req, res) => {
    const idx = history.findIndex(h => h.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Not found' });
    const [record] = history.splice(idx, 1);
    const outPath = path.join(OUTPUT_DIR, record.outputFile);
    fs.unlink(outPath, () => { });
    res.json({ success: true });
});

// Stats
app.get('/api/stats', (_, res) => {
    const totalFiles = history.length;
    const totalSize = history.reduce((s, h) => s + h.inputSize, 0);
    const savedSize = history.reduce((s, h) => s + Math.max(0, h.inputSize - h.outputSize), 0);
    const avgDuration = history.length ? Math.round(history.reduce((s, h) => s + h.duration, 0) / history.length) : 0;
    const byType = {};
    history.forEach(h => {
        const t = h.fromFmt.match(/^(JPG|JPEG|PNG|WEBP|GIF|AVIF|BMP|TIFF|SVG)$/i) ? 'Image' :
            h.fromFmt.match(/^(PDF|DOCX|XLSX|XLS|TXT|RTF|ODT|CSV|HTML)$/i) ? 'Document' :
                h.fromFmt.match(/^(MP3|WAV|FLAC|AAC|OGG|M4A)$/i) ? 'Audio' :
                    h.fromFmt.match(/^(MP4|AVI|MOV|MKV|WEBM)$/i) ? 'Video' : 'Other';
        byType[t] = (byType[t] || 0) + 1;
    });
    res.json({ totalFiles, totalSize, savedSize, avgDuration, byType });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`FileForge API running on http://localhost:${PORT}`));

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);