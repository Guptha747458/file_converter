#!/bin/bash

# Function to exit on error
function error_exit {
    echo "Error: $1"
    exit 1
}

# 1. Install Node.js dependencies
echo "--- Installing Node.js dependencies ---"
npm install || error_exit "Failed to install npm dependencies"

# 2. Install Puppeteer Chrome browser binary
echo "--- Installing Puppeteer Chrome ---"
npx puppeteer browsers install chrome || error_exit "Failed to install Puppeteer Chrome"

# 3. Install LibreOffice
# NOTE: Render build containers run as root, so 'sudo' is not available/needed.
echo "--- Installing LibreOffice ---"
apt-get update -qq || error_exit "Failed to update package list"
apt-get install -y --no-install-recommends libreoffice || error_exit "Failed to install LibreOffice"
echo "LibreOffice installed at: $(which soffice)"

# 4. Install 7-Zip
echo "--- Installing 7-Zip ---"
apt-get install -y --no-install-recommends p7zip-full || error_exit "Failed to install 7-Zip"
echo "7-Zip installed at: $(which 7z)"

echo "--- All installations completed successfully! ---"