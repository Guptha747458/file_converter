# ── Stage 1: System dependencies + Node app ──────────────────────────────────
FROM node:20-bookworm-slim

# Install system packages: LibreOffice, FFmpeg, 7-Zip, and Puppeteer Chrome deps
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        # LibreOffice (for ODT/RTF/ODS/ODP → PDF)
        libreoffice \
        # FFmpeg (for audio/video conversion)
        ffmpeg \
        # 7-Zip
        p7zip-full \
        # Puppeteer / Chromium runtime dependencies
        ca-certificates \
        fonts-liberation \
        libappindicator3-1 \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libcups2 \
        libdbus-1-3 \
        libdrm2 \
        libgbm1 \
        libgtk-3-0 \
        libnspr4 \
        libnss3 \
        libx11-xcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxkbcommon0 \
        libxrandr2 \
        libxss1 \
        libxtst6 \
        wget \
        xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --omit=dev

# Install Puppeteer Chrome binary
RUN npx puppeteer browsers install chrome

# Copy the rest of the application source
COPY . .

# Environment defaults (can be overridden by Render env vars)
ENV NODE_ENV=production \
    PORT=4000 \
    SOFFICE_PATH=/usr/bin/soffice \
    PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

EXPOSE 4000

CMD ["node", "index.js"]
