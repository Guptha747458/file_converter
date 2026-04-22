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
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
ffmpeg.setFfmpegPath(ffmpegInstaller.path);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const { Document, Packer, Paragraph, TextRun } = require('docx');
const libre = require('libreoffice-convert');
const librePath = process.env.SOFFICE_PATH || null;
const util = require('util');
const libreConvert = (buf, targetExt) => new Promise((resolve, reject) => {
    const options = librePath ? { sofficePath: librePath } : undefined;
    libre.convert(buf, targetExt, options, (err, data) => {
        if (err) reject(err);
        else resolve(data);
    });
});
const JSZip = require('jszip');
const xml2js = require('xml2js');

// ── Puppeteer PDF helper ──────────────────────────────────────────────────────
async function htmlToPdf(htmlContent, outPath, opts = {}) {
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    try {
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        await page.pdf({
            path: outPath,
            format: opts.format || 'A4',
            printBackground: true,
            margin: opts.margin || { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
            ...opts.pdfOpts
        });
    } finally {
        await browser.close();
    }
}

// ── PPTX text/slide extractor ────────────────────────────────────────────────
async function extractPptxSlides(filePath) {
    const data = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(data);
    const slideFiles = Object.keys(zip.files)
        .filter(n => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
        .sort((a, b) => {
            const na = parseInt(a.match(/\d+/)?.[0] || '0');
            const nb = parseInt(b.match(/\d+/)?.[0] || '0');
            return na - nb;
        });

    const slides = [];
    for (const slideFile of slideFiles) {
        const xmlStr = await zip.files[slideFile].async('string');
        const parsed = await xml2js.parseStringPromise(xmlStr, { explicitArray: false });
        const texts = [];
        // Recursively extract all <a:t> text nodes
        function extractText(obj) {
            if (!obj || typeof obj !== 'object') return;
            if (obj['a:t']) {
                const t = obj['a:t'];
                if (typeof t === 'string') texts.push(t);
                else if (Array.isArray(t)) t.forEach(v => typeof v === 'string' && texts.push(v));
            }
            Object.values(obj).forEach(v => {
                if (Array.isArray(v)) v.forEach(extractText);
                else extractText(v);
            });
        }
        extractText(parsed);
        slides.push(texts.join('\n').trim());
    }
    return slides;
}

const app = express();
const PORT = process.env.PORT || 4000;
const mongoose = require('mongoose');

// ── Database Connection ──────────────────────────────────────────────────────
const DATABASE_URL = process.env.DATABASE_URL;
let gridFSBucket;

if (DATABASE_URL) {
    mongoose.connect(DATABASE_URL)
        .then(() => {
            console.log('Connected to MongoDB');
            const db = mongoose.connection.db;
            gridFSBucket = new mongoose.mongo.GridFSBucket(db, {
                bucketName: 'outputs'
            });
        })
        .catch(err => console.error('MongoDB connection error:', err));
} else {
    console.warn('WARNING: DATABASE_URL not found in .env. Falling back to in-memory mode (not recommended for production).');
}

// ── Database Schema ──────────────────────────────────────────────────────────
const conversionSchema = new mongoose.Schema({
    id: { type: String, unique: true },
    userEmail: { type: String, default: 'anonymous' },
    originalName: String,
    fromFmt: String,
    toFmt: String,
    inputSize: Number,
    outputSize: Number,
    duration: Number,
    outputFile: String,
    icon: String,
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24h
});

const Conversion = mongoose.model('Conversion', conversionSchema);

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ── Directories ──────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'outputs');
[UPLOAD_DIR, OUTPUT_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

// ── Legacy In-memory history (for fallback or temporary cached access) ───────
let history = [];

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// Static outputs (legacy/fallback)
app.use('/outputs', express.static(OUTPUT_DIR));

// GridFS Download Route: Streams files directly from MongoDB
app.get('/api/files/:filename', async (req, res) => {
    if (!gridFSBucket) {
        const filePath = path.join(OUTPUT_DIR, req.params.filename);
        if (fs.existsSync(filePath)) return res.sendFile(filePath);
        return res.status(404).send('File not found (Server disconnected)');
    }

    try {
        const files = await gridFSBucket.find({ filename: req.params.filename }).toArray();
        if (!files || files.length === 0) {
            // Check local fallback
            const filePath = path.join(OUTPUT_DIR, req.params.filename);
            if (fs.existsSync(filePath)) return res.sendFile(filePath);
            return res.status(404).send('File not found');
        }

        const downloadStream = gridFSBucket.openDownloadStreamByName(req.params.filename);
        
        // Infer content type
        const ext = path.extname(req.params.filename).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.zip': 'application/zip',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        };
        res.set('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        downloadStream.on('error', err => {
            console.error('GridFS download error:', err);
            if (!res.headersSent) res.status(500).send('Error downloading file');
        }).pipe(res);
    } catch (err) {
        res.status(500).send('Error retrieving file from database');
    }
});

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
const IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.tiff', '.svg', '.heic'];
const DOC_EXTS = ['.pdf', '.docx', '.xlsx', '.xls', '.txt', '.rtf', '.odt', '.csv', '.html', '.ppt', '.pptx'];
const AUDIO_EXTS = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'];

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

    // ── DOCX / DOC → PDF (Mammoth → HTML → Puppeteer) ───────────────────────
    if ((inExt === 'DOCX' || inExt === 'DOC') && outExt === 'PDF') {
        try {
            const result = await mammoth.convertToHtml({ path: inputPath });
            const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12pt; line-height: 1.6;
         margin: 0; padding: 0; color: #222; }
  h1 { font-size: 22pt; font-weight: bold; margin: 16px 0 8px; color: #111; }
  h2 { font-size: 18pt; font-weight: bold; margin: 14px 0 6px; color: #222; }
  h3 { font-size: 15pt; font-weight: bold; margin: 12px 0 4px; }
  p  { margin: 0 0 8px; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; }
  th { background: #f0f0f0; font-weight: bold; }
  ul, ol { margin: 6px 0 6px 24px; }
  img { max-width: 100%; height: auto; }
  strong { font-weight: bold; } em { font-style: italic; }
</style></head>
<body>${result.value}</body></html>`;
            await htmlToPdf(html, outPath);
            return outName;
        } catch (err) {
            console.error(`DOCX→PDF error:`, err.message);
            throw new Error(`Failed to convert ${inExt} to PDF: ${err.message}`);
        }
    }

    // ── XLSX / XLS → PDF (Styled HTML Table → Puppeteer) ────────────────────
    if ((inExt === 'XLSX' || inExt === 'XLS') && outExt === 'PDF') {
        try {
            const wb = XLSX.readFile(inputPath);
            let sheetsHtml = '';
            for (const sheetName of wb.SheetNames) {
                const ws = wb.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
                if (rows.length === 0) continue;
                const header = rows[0];
                const body = rows.slice(1);
                const headerHtml = header.map(c => `<th>${String(c ?? '').replace(/</g, '&lt;')}</th>`).join('');
                const bodyHtml = body.map(r =>
                    `<tr>${header.map((_, i) => `<td>${String(r[i] ?? '').replace(/</g, '&lt;')}</td>`).join('')}</tr>`
                ).join('');
                sheetsHtml += `<h2 class="sheet-title">${sheetName.replace(/</g, '&lt;')}</h2>
<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
            }
            const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #222; margin: 0; }
  .sheet-title { font-size: 14pt; font-weight: bold; margin: 18px 0 6px; color: #1a73e8;
                 border-bottom: 2px solid #1a73e8; padding-bottom: 4px; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 24px; }
  th { background: #1a73e8; color: #fff; font-weight: bold; padding: 7px 10px;
       border: 1px solid #1558b0; text-align: left; font-size: 10pt; }
  td { padding: 5px 10px; border: 1px solid #ddd; font-size: 9.5pt; }
  tr:nth-child(even) td { background: #f8f9fa; }
  tr:hover td { background: #e8f0fe; }
</style></head>
<body>${sheetsHtml}</body></html>`;
            await htmlToPdf(html, outPath, { format: 'A3', margin: { top: '15mm', right: '10mm', bottom: '15mm', left: '10mm' } });
            return outName;
        } catch (err) {
            console.error(`XLSX→PDF error:`, err.message);
            throw new Error(`Failed to convert ${inExt} to PDF: ${err.message}`);
        }
    }

    // ── PPTX / PPT → PDF (Slide HTML → Puppeteer) ───────────────────────────
    if ((inExt === 'PPTX' || inExt === 'PPT') && outExt === 'PDF') {
        try {
            let slides;
            if (inExt === 'PPTX') {
                slides = await extractPptxSlides(inputPath);
            } else {
                // PPT (binary) — best effort text extraction via LibreOffice, else basic
                try {
                    const buf = fs.readFileSync(inputPath);
                    const pdfBuf = await libreConvert(buf, '.pdf');
                    fs.writeFileSync(outPath, pdfBuf);
                    return outName;
                } catch {
                    slides = ['[PPT binary format requires LibreOffice for conversion.\nInstall from https://www.libreoffice.org]'];
                }
            }
            if (!slides || slides.length === 0) slides = ['[No slides found in presentation]'];
            const SLIDE_COLORS = ['#1a237e', '#1b5e20', '#b71c1c', '#4a148c', '#e65100', '#006064', '#37474f'];
            const slidesHtml = slides.map((text, i) => {
                const bg = SLIDE_COLORS[i % SLIDE_COLORS.length];
                const lines = (text || '').split('\n').filter(Boolean);
                const title = lines[0] || `Slide ${i + 1}`;
                const body = lines.slice(1).map(l => `<p>${l.replace(/</g, '&lt;')}</p>`).join('');
                return `<div class="slide" style="background:${bg}">
  <div class="slide-num">Slide ${i + 1} / ${slides.length}</div>
  <div class="slide-title">${title.replace(/</g, '&lt;')}</div>
  <div class="slide-body">${body}</div>
</div>`;
            }).join('');
            const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
  * { box-sizing: border-box; margin:0; padding:0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; background:#f0f0f0; }
  .slide { width:254mm; min-height:143mm; margin:6mm auto; border-radius:8px;
           padding: 16mm 18mm; color:#fff; page-break-after: always;
           display:flex; flex-direction:column; justify-content:center;
           box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
  .slide:last-child { page-break-after: auto; }
  .slide-num { font-size: 9pt; opacity: 0.65; margin-bottom: 10px; }
  .slide-title { font-size: 22pt; font-weight: 700; margin-bottom: 14px;
                 line-height: 1.2; border-bottom: 2px solid rgba(255,255,255,0.4);
                 padding-bottom: 10px; }
  .slide-body { font-size: 13pt; line-height: 1.7; opacity: 0.9; }
  .slide-body p { margin-bottom: 6px; }
</style></head>
<body>${slidesHtml}</body></html>`;
            await htmlToPdf(html, outPath, {
                format: 'A4',
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
                pdfOpts: { landscape: true }
            });
            return outName;
        } catch (err) {
            console.error(`PPTX→PDF error:`, err.message);
            throw new Error(`Failed to convert ${inExt} to PDF: ${err.message}`);
        }
    }

    // ── ODT / RTF / ODS / ODP → PDF (LibreOffice, best-effort) ─────────────
    const LIBRE_ONLY = ['ODT', 'RTF', 'ODS', 'ODP'];
    if (LIBRE_ONLY.includes(inExt) && outExt === 'PDF') {
        try {
            const docBuf = fs.readFileSync(inputPath);
            const pdfBuf = await libreConvert(docBuf, '.pdf');
            fs.writeFileSync(outPath, pdfBuf);
            return outName;
        } catch (libreErr) {
            throw new Error(`Converting ${inExt} to PDF requires LibreOffice. Install from https://www.libreoffice.org/ and add its 'program' folder to PATH.`);
        }
    }

    // ── DOCX → HTML / TXT ───────────────────────────────────────────────────
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

    // ── TXT / MD → PDF ───────────────────────────────────────────────────────
    if ((inExt === 'TXT' || inExt === 'MD') && outExt === 'PDF') {
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

    // ── HTML → PDF (Puppeteer – full visual render) ──────────────────────────
    if (inExt === 'HTML' && outExt === 'PDF') {
        try {
            const html = fs.readFileSync(inputPath, 'utf8');
            await htmlToPdf(html, outPath);
            return outName;
        } catch (err) {
            throw new Error(`Failed to render HTML to PDF: ${err.message}`);
        }
    }

    // ── CSV → PDF (Styled HTML table → Puppeteer) ────────────────────────────
    if (inExt === 'CSV' && outExt === 'PDF') {
        try {
            const csv = fs.readFileSync(inputPath, 'utf8');
            const wb = XLSX.read(csv, { type: 'string' });
            const ws = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            const header = rows[0] || [];
            const body = rows.slice(1);
            const headerHtml = header.map(c => `<th>${String(c ?? '').replace(/</g, '&lt;')}</th>`).join('');
            const bodyHtml = body.map(r =>
                `<tr>${header.map((_, i) => `<td>${String(r[i] ?? '').replace(/</g, '&lt;')}</td>`).join('')}</tr>`
            ).join('');
            const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10pt; color: #222; }
  table { border-collapse: collapse; width: 100%; }
  th { background: #1a73e8; color: #fff; padding: 7px 10px; border: 1px solid #1558b0; font-size:10pt; }
  td { padding: 5px 10px; border: 1px solid #ddd; font-size: 9.5pt; }
  tr:nth-child(even) td { background: #f8f9fa; }
</style></head><body><table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></body></html>`;
            await htmlToPdf(html, outPath, { format: 'A3', margin: { top: '10mm', right: '8mm', bottom: '10mm', left: '8mm' } });
            return outName;
        } catch (err) {
            throw new Error(`Failed to convert CSV to PDF: ${err.message}`);
        }
    }

    // ── JSON → PDF ───────────────────────────────────────────────────────────
    if (inExt === 'JSON' && outExt === 'PDF') {
        try {
            const json = fs.readFileSync(inputPath, 'utf8');
            const text = JSON.stringify(JSON.parse(json), null, 2)
                .replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { font-family: 'Courier New', monospace; font-size: 10pt; background: #1e1e1e; color: #d4d4d4; padding: 20px; }
  pre { white-space: pre-wrap; word-break: break-all; }
  .key { color: #9cdcfe; } .str { color: #ce9178; } .num { color: #b5cea8; }
</style></head><body><pre>${text}</pre></body></html>`;
            await htmlToPdf(html, outPath, { pdfOpts: { printBackground: true } });
            return outName;
        } catch (err) {
            throw new Error(`Failed to convert JSON to PDF: ${err.message}`);
        }
    }

    // ── Generic → PDF fallback (LibreOffice or plain text embed) ─────────────
    if (outExt === 'PDF') {
        try {
            const docBuf = fs.readFileSync(inputPath);
            const pdfBuf = await libreConvert(docBuf, '.pdf');
            fs.writeFileSync(outPath, pdfBuf);
            return outName;
        } catch (libreErr) {
            console.warn(`Generic LibreOffice PDF fallback failed for ${inExt}:`, libreErr.message);
            let raw = '';
            try { raw = fs.readFileSync(inputPath, 'utf8').replace(/</g, '&lt;'); } catch { raw = `[Binary file: ${originalName}]`; }
            const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.6;
         white-space: pre-wrap; word-break: break-word; color: #222; padding: 20px; }
</style></head><body>${raw}</body></html>`;
            try {
                await htmlToPdf(html, outPath);
            } catch (puppErr) {
                // absolute last resort: pdf-lib plain text
                const pdfDoc = await PDFDocument.create();
                const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
                const lines = raw.replace(/&lt;/g, '<').split('\n').flatMap(l => l.match(/.{1,90}/g) || [' ']);
                let page = pdfDoc.addPage([600, 800]);
                let y = 750;
                for (const line of lines) {
                    if (y < 40) { page = pdfDoc.addPage([600, 800]); y = 750; }
                    page.drawText(cleanPdfText(line) || ' ', { x: 50, y, size: 10, font });
                    y -= 13;
                }
                fs.writeFileSync(outPath, await pdfDoc.save());
            }
            return outName;
        }
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

// ── Auth Routes ──────────────────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json({ success: true, user: { name: name || 'Demo User', email } });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) return res.status(400).json({ error: 'User already exists' });

        const user = await User.create({ name, email: email.toLowerCase(), password });
        res.json({ success: true, user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: 'Signup failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
        if (mongoose.connection.readyState !== 1) {
            return res.json({ success: true, user: { name: email.split('@')[0], email } });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                error: 'USER_NOT_FOUND',
                message: 'Is this your first time in login in this app? Use sign up.'
            });
        }

        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        res.json({ success: true, user: { name: user.name, email: user.email } });
    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }
});

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

        // Move to GridFS if available
        let downloadUrl = `/outputs/${outputFile}`;
        if (gridFSBucket) {
            const uploadStream = gridFSBucket.openUploadStream(outputFile, {
                metadata: { originalName, fromFmt, toFmt }
            });
            fs.createReadStream(outputPath)
                .on('error', err => console.error('Local file read error:', err))
                .pipe(uploadStream)
                .on('error', err => console.error('GridFS upload error:', err))
                .on('finish', () => {
                    fs.unlink(outputPath, () => { }); // Clear local cache after upload
                });
            downloadUrl = `/api/files/${outputFile}`;
        }

        const userEmail = req.headers['x-user-email'] || 'anonymous';

        const record = {
            id: uuid(),
            userEmail,
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

        // Save to DB if available
        if (mongoose.connection.readyState === 1) {
            await Conversion.create(record);
        } else {
            history.unshift(record);
        }

        // Clean up input
        fs.unlink(inputPath, () => { });

        res.json({
            success: true,
            id: record.id,
            outputFile,
            downloadUrl,
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
            
            let downloadUrl = `/outputs/${outputFile}`;
            if (gridFSBucket) {
                const uploadStream = gridFSBucket.openUploadStream(outputFile);
                fs.createReadStream(outputPath)
                    .on('error', err => console.error('Local file read error:', err))
                    .pipe(uploadStream)
                    .on('error', err => console.error('GridFS batch upload error:', err))
                    .on('finish', () => fs.unlink(outputPath, () => { }));
                downloadUrl = `/api/files/${outputFile}`;
            }

            const userEmail = req.headers['x-user-email'] || 'anonymous';

            const record = {
                id: uuid(),
                userEmail,
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

            if (mongoose.connection.readyState === 1) {
                await Conversion.create(record);
            } else {
                history.unshift(record);
            }
            results.push({ success: true, id: record.id, originalName: file.originalname, outputFile, downloadUrl, outputSize });
        } catch (err) {
            results.push({ success: false, originalName: file.originalname, error: err.message });
        }
        fs.unlink(file.path, () => { });
    }
    res.json({ results });
});

// Get history
app.get('/api/history', async (req, res) => {
    const { limit = 50, offset = 0, search = '', filter = 'All' } = req.query;
    const userEmail = req.headers['x-user-email'] || 'anonymous';

    let dbQuery = { userEmail };
    if (search) dbQuery.originalName = { $regex: search, $options: 'i' };

    if (filter !== 'All') {
        const grpMap = {
            Image: /^(JPG|JPEG|PNG|WEBP|GIF|AVIF|BMP|TIFF|SVG|HEIC)$/i,
            Document: /^(PDF|DOCX|XLSX|XLS|PPTX|TXT|RTF|ODT|CSV|HTML|MD)$/i,
            Audio: /^(MP3|WAV|FLAC|AAC|OGG|M4A|OPUS|WMA)$/i,
            Video: /^(MP4|AVI|MOV|MKV|WEBM|FLV|WMV)$/i,
            Archive: /^(ZIP|TAR|GZ|7Z|BZ2|RAR|XZ)$/i,
        };
        const rx = grpMap[filter];
        if (rx) dbQuery.$or = [{ fromFmt: rx }, { toFmt: rx }];
    }

    if (mongoose.connection.readyState === 1) {
        try {
            const items = await Conversion.find(dbQuery)
                .sort({ createdAt: -1 })
                .skip(Number(offset))
                .limit(Number(limit));
            const total = await Conversion.countDocuments(dbQuery);

            // For total sizes across the whole history
            const stats = await Conversion.aggregate([
                { $match: { userEmail } },
                { $group: { _id: null, totalInput: { $sum: "$inputSize" }, totalOutput: { $sum: "$outputSize" } } }
            ]);

            const historyWithUrls = items.map(item => ({
                ...item.toObject(),
                downloadUrl: gridFSBucket ? `/api/files/${item.outputFile}` : `/outputs/${item.outputFile}`
            }));

            res.json({
                items: historyWithUrls,
                total,
                totalInputSize: stats[0]?.totalInput || 0,
                totalOutputSize: stats[0]?.totalOutput || 0
            });
        } catch (err) {
            res.status(500).json({ error: 'DB Fetch failed' });
        }
    } else {
        // Fallback to in-memory filter logic
        let data = history.filter(h => h.userEmail === userEmail);
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

        const pageWithUrls = page.map(item => ({
            ...item,
            downloadUrl: gridFSBucket ? `/api/files/${item.outputFile}` : `/outputs/${item.outputFile}`
        }));

        res.json({
            items: pageWithUrls,
            total,
            totalInputSize: history.reduce((s, h) => s + h.inputSize, 0),
            totalOutputSize: history.reduce((s, h) => s + h.outputSize, 0)
        });
    }
});

// Delete history item
app.delete('/api/history/:id', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'anonymous';
    let filename;
    if (mongoose.connection.readyState === 1) {
        const record = await Conversion.findOne({ id: req.params.id, userEmail });
        if (!record) return res.status(404).json({ error: 'Not found' });
        filename = record.outputFile;
        await Conversion.deleteOne({ id: req.params.id });
    } else {
        const idx = history.findIndex(h => h.id === req.params.id && h.userEmail === userEmail);
        if (idx === -1) return res.status(404).json({ error: 'Not found' });
        const [record] = history.splice(idx, 1);
        filename = record.outputFile;
    }

    // Clear local file
    const outPath = path.join(OUTPUT_DIR, filename);
    if (fs.existsSync(outPath)) fs.unlink(outPath, () => { });

    // Clear GridFS files
    if (gridFSBucket) {
        try {
            const files = await gridFSBucket.find({ filename }).toArray();
            for (const f of files) {
                await gridFSBucket.delete(f._id);
            }
        } catch (e) { }
    }

    res.json({ success: true });
});

// Clear ALL history
app.delete('/api/history', async (req, res) => {
    try {
        // 1. Delete all physical files in OUTPUT_DIR
        const files = fs.readdirSync(OUTPUT_DIR);
        files.forEach(file => {
            const filePath = path.join(OUTPUT_DIR, file);
            try { fs.unlinkSync(filePath); } catch (e) { }
        });

        // 2. Clear DB / Memory
        const userEmail = req.headers['x-user-email'] || 'anonymous';
        if (mongoose.connection.readyState === 1) {
            await Conversion.deleteMany({ userEmail });
        } else {
            history = history.filter(h => h.userEmail !== userEmail);
        }

        res.json({ success: true, message: 'All history and files cleared.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to clear history' });
    }
});

// Stats
app.get('/api/stats', async (req, res) => {
    const userEmail = req.headers['x-user-email'] || 'anonymous';
    if (mongoose.connection.readyState === 1) {
        const totalFiles = await Conversion.countDocuments({ userEmail });
        const stats = await Conversion.aggregate([
            { $match: { userEmail } },
            { $group: { _id: null, totalSize: { $sum: "$inputSize" }, outputSize: { $sum: "$outputSize" }, avgDuration: { $avg: "$duration" } } }
        ]);

        const byTypeDocs = await Conversion.aggregate([
            { $match: { userEmail } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $regexMatch: { input: "$fromFmt", regex: /^(JPG|JPEG|PNG|WEBP|GIF|AVIF|BMP|TIFF|SVG)$/i } }, "Image",
                            {
                                $cond: [
                                    { $regexMatch: { input: "$fromFmt", regex: /^(PDF|DOCX|XLSX|XLS|PPTX|TXT|RTF|ODT|CSV|HTML)$/i } }, "Document",
                                    {
                                        $cond: [
                                            { $regexMatch: { input: "$fromFmt", regex: /^(MP3|WAV|FLAC|AAC|OGG|M4A)$/i } }, "Audio",
                                            {
                                                $cond: [
                                                    { $regexMatch: { input: "$fromFmt", regex: /^(MP4|AVI|MOV|MKV|WEBM|FLV)$/i } }, "Video", "Other"
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const byType = {};
        byTypeDocs.forEach(d => byType[d._id] = d.count);

        res.json({
            totalFiles,
            totalSize: stats[0]?.totalSize || 0,
            savedSize: Math.max(0, (stats[0]?.totalSize || 0) - (stats[0]?.outputSize || 0)),
            avgDuration: Math.round(stats[0]?.avgDuration || 0),
            byType
        });
    } else {
        const userHistory = history.filter(h => h.userEmail === userEmail);
        const totalFiles = userHistory.length;
        const totalSize = userHistory.reduce((s, h) => s + h.inputSize, 0);
        const savedSize = userHistory.reduce((s, h) => s + Math.max(0, h.inputSize - h.outputSize), 0);
        const avgDuration = userHistory.length ? Math.round(userHistory.reduce((s, h) => s + h.duration, 0) / userHistory.length) : 0;
        const byType = {};
        userHistory.forEach(h => {
            const t = h.fromFmt.match(/^(JPG|JPEG|PNG|WEBP|GIF|AVIF|BMP|TIFF|SVG)$/i) ? 'Image' :
                h.fromFmt.match(/^(PDF|DOCX|XLSX|XLS|PPTX|TXT|RTF|ODT|CSV|HTML)$/i) ? 'Document' :
                    h.fromFmt.match(/^(MP3|WAV|FLAC|AAC|OGG|M4A)$/i) ? 'Audio' :
                        h.fromFmt.match(/^(MP4|AVI|MOV|MKV|WEBM|FLV)$/i) ? 'Video' : 'Other';
            byType[t] = (byType[t] || 0) + 1;
        });
        res.json({ totalFiles, totalSize, savedSize, avgDuration, byType });
    }
});

// ── Cleanup Logic ─────────────────────────────────────────────────────────────
const CLEANUP_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

function runCleanup() {
    console.log('[Cleanup] Periodic cleanup started...');
    const now = Date.now();
    let filesDeleted = 0;
    let historyRemoved = 0;

    // 1. Clean filesystem (uploads and outputs)
    [UPLOAD_DIR, OUTPUT_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir);
        files.forEach(file => {
            const filePath = path.join(dir, file);
            try {
                const stats = fs.statSync(filePath);
                if (now - stats.mtimeMs > CLEANUP_THRESHOLD) {
                    fs.unlinkSync(filePath);
                    filesDeleted++;
                }
            } catch (err) {
                // File might have been deleted by another process
            }
        });
    });

    // 2. Clean history (Memory only fallback)
    if (mongoose.connection.readyState !== 1) {
        const initialHistoryCount = history.length;
        history = history.filter(item => {
            const itemAge = now - new Date(item.createdAt).getTime();
            return itemAge <= CLEANUP_THRESHOLD;
        });

        if (history.length !== initialHistoryCount) {
            historyRemoved = initialHistoryCount - history.length;
        }
    } else {
        // Mongo handles history cleanup via TTL index `expires: 86400`
        console.log('[Cleanup] MongoDB TTL index is managing history record expiration.');
    }

    if (filesDeleted > 0 || historyRemoved > 0) {
        console.log(`[Cleanup] Finished: Deleted ${filesDeleted} files and removed ${historyRemoved} history records.`);
    } else {
        console.log('[Cleanup] Finished: Nothing to clean.');
    }
}

// Run cleanup every hour
setInterval(runCleanup, 60 * 60 * 1000);
// Run initial cleanup after 10 seconds
setTimeout(runCleanup, 10000);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => console.log(`FileForge API running on http://localhost:${PORT}`));
