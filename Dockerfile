# Use a Node.js base image
FROM node:20-slim

# Install system dependencies for FFmpeg, LibreOffice, and Puppeteer
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libreoffice \
    fonts-liberation \
    libasound2 \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy the rest of the application
COPY server ./server

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose the API port
EXPOSE 4000

# Start the server
CMD ["node", "server/index.js"]
