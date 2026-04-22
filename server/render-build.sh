#!/bin/bash

# Function to exit on error
function error_exit {
    echo "Error: $1"
    exit 1
}

# Update package list
sudo apt-get update || error_exit "Failed to update package list"

# Install Node.js
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash - || error_exit "Failed to set up Node.js repository"
sudo apt-get install -y nodejs || error_exit "Failed to install Node.js"

# Install Puppeteer
npm install puppeteer || error_exit "Failed to install Puppeteer"

# Install LibreOffice
sudo apt-get install -y libreoffice || error_exit "Failed to install LibreOffice"

# Install 7-Zip
sudo apt-get install -y p7zip-full || error_exit "Failed to install 7-Zip"

echo "All installations completed successfully!"