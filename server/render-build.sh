#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install Node.js dependencies
echo "--- Installing Node.js dependencies ---"
npm install

# 2. Install Puppeteer Chrome
# Render's environment needs this to ensure the browser is available
echo "--- Installing Puppeteer Chrome ---"
npx puppeteer browsers install chrome

# 3. Install LibreOffice (Portable-ish)
# We download the DEB files and extract them to a local directory
LIBREOFFICE_DIR="./.libreoffice"
if [[ ! -d "$LIBREOFFICE_DIR" ]]; then
  echo "--- Downloading and Installing LibreOffice ---"
  mkdir -p "$LIBREOFFICE_DIR"
  
  # Using version 7.5.5
  LO_VERSION="7.5.5"
  LO_TAR="LibreOffice_${LO_VERSION}_Linux_x86-64_deb.tar.gz"
  LO_URL="https://download.documentfoundation.org/libreoffice/stable/${LO_VERSION}/deb/x86_64/${LO_TAR}"
  
  curl -L "$LO_URL" -o "$LO_TAR"
  tar -xzf "$LO_TAR" -C "$LIBREOFFICE_DIR" --strip-components=1
  rm "$LO_TAR"
  
  # Extract all DEB files into a single 'install' directory
  mkdir -p "$LIBREOFFICE_DIR/install"
  for deb in "$LIBREOFFICE_DIR/DEBS"/*.deb; do
    dpkg -x "$deb" "$LIBREOFFICE_DIR/install"
  done
  
  # Find the soffice binary
  SOFFICE_BIN=$(find "$LIBREOFFICE_DIR/install" -name soffice -type f | grep program/soffice | head -n 1)
  
  if [[ -f "$SOFFICE_BIN" ]]; then
    ln -sf "$SOFFICE_BIN" "$LIBREOFFICE_DIR/soffice"
    echo "LibreOffice installed successfully at $LIBREOFFICE_DIR/soffice"
  else
    echo "Error: Could not find soffice binary after extraction."
    exit 1
  fi
else
  echo "--- LibreOffice already installed ---"
fi

# 4. Install 7-Zip (7zz)
SEVEN_ZIP_DIR="./.7zip"
if [[ ! -d "$SEVEN_ZIP_DIR" ]]; then
  echo "--- Downloading 7-Zip ---"
  mkdir -p "$SEVEN_ZIP_DIR"
  curl -L "https://www.7-zip.org/a/7z2301-linux-x64.tar.xz" | tar -xJ -C "$SEVEN_ZIP_DIR" 7zz
  echo "7-Zip installed successfully at $SEVEN_ZIP_DIR/7zz"
else
  echo "--- 7-Zip already installed ---"
fi

echo "--- Build complete ---"
