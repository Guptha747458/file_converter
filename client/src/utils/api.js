// ── Base URL ──────────────────────────────────────────────────────────────────
// In dev, Vite proxies /api → http://localhost:4000. In prod, VITE_API_URL is
// set to the backend hostname by Render (e.g. "file-forge-api.onrender.com").
const HOST = import.meta.env.VITE_API_URL
    ? `https://${import.meta.env.VITE_API_URL}`
    : '';
const BASE = HOST ? `${HOST}/api` : '/api';

function fmtSize(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(2)} MB`;
    return `${(bytes / 1073741824).toFixed(2)} GB`;
}

// ── Auth Helper ───────────────────────────────────────────────────────────────
function getAuthHeaders() {
    const headers = {};
    try {
        const stored = localStorage.getItem('fileforge_user');
        if (stored) {
            const user = JSON.parse(stored);
            if (user && user.email) headers['x-user-email'] = user.email;
        }
    } catch {}
    return headers;
}

// ── Health ────────────────────────────────────────────────────────────────────
export async function checkHealth() {
    const r = await fetch(`${BASE}/health`);
    return r.json();
}

// ── Single file convert ───────────────────────────────────────────────────────
export async function convertFile({ file, toFmt, quality = 'high', onProgress }) {
    const form = new FormData();
    form.append('file', file);
    form.append('toFmt', toFmt);
    form.append('quality', quality);

    // Use XMLHttpRequest to get upload progress
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${BASE}/convert`);
        
        const authHeaders = getAuthHeaders();
        if (authHeaders['x-user-email']) {
            xhr.setRequestHeader('x-user-email', authHeaders['x-user-email']);
        }
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 50));
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const data = JSON.parse(xhr.responseText);
                if (onProgress) onProgress(100);
                resolve(data);
            } else {
                try { reject(new Error(JSON.parse(xhr.responseText).error || 'Conversion failed')); }
                catch { reject(new Error('Conversion failed')); }
            }
        };
        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(form);
    });
}

// ── Batch convert ─────────────────────────────────────────────────────────────
export async function convertBatch({ files, toFmt, quality = 'high' }) {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    form.append('toFmt', toFmt);
    form.append('quality', quality);
    const r = await fetch(`${BASE}/convert/batch`, { 
        method: 'POST', 
        body: form,
        headers: getAuthHeaders()
    });
    if (!r.ok) throw new Error((await r.json()).error || 'Batch conversion failed');
    return r.json();
}

// ── History ───────────────────────────────────────────────────────────────────
export async function fetchHistory({ limit = 50, offset = 0, search = '', filter = 'All' } = {}) {
    const params = new URLSearchParams({ limit, offset, search, filter });
    const r = await fetch(`${BASE}/history?${params}`, {
        headers: getAuthHeaders()
    });
    return r.json();  // { items, total, totalInputSize, totalOutputSize }
}

export async function deleteHistoryItem(id) {
    const r = await fetch(`${BASE}/history/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    return r.json();
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export async function fetchStats() {
    const r = await fetch(`${BASE}/stats`, {
        headers: getAuthHeaders()
    });
    return r.json();
}

// ── Download helper ───────────────────────────────────────────────────────────
export function downloadFile(downloadUrl, filename) {
    const a = document.createElement('a');
    a.href = downloadUrl.startsWith('/') ? `${HOST}${downloadUrl}` : downloadUrl;
    a.download = filename;
    a.click();
}

// ── Authentication ────────────────────────────────────────────────────────────
export async function signupUser(userData) {
    const r = await fetch(`${BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
    });
    const data = await r.json();
    if (!r.ok) throw data;
    return data;
}

export async function loginUser(credentials) {
    const r = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    const data = await r.json();
    if (!r.ok) throw data;
    return data;
}

export { fmtSize };
