#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install Node.js dependencies
echo "--- Installing Node.js dependencies ---"
npm install

# 2. Install Puppeteer Chrome
echo "--- Installing Puppeteer Chrome ---"
npx puppeteer browsers install chrome

# 3. Install LibreOffice via apt-get (reliable, no tarball download needed)
if ! command -v soffice &> /dev/null; then
  echo "--- Installing LibreOffice via apt-get ---"
  apt-get update -qq
  apt-get install -y --no-install-recommends libreoffice
  echo "LibreOffice installed at: $(which soffice)"
else
  echo "--- LibreOffice already available: $(which soffice) ---"
fi

# 4. Install 7-Zip via apt-get
if ! command -v 7z &> /dev/null && ! command -v 7zz &> /dev/null; then
  echo "--- Installing 7-Zip via apt-get ---"
  apt-get install -y --no-install-recommends p7zip-full
  echo "7-Zip installed at: $(which 7z)"
else
  echo "--- 7-Zip already available ---"
fi

echo "--- Build complete ---"
