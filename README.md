# FileForge - Ultimate File Conversion Platform

FileForge is a powerful, full-stack web application designed to handle high-performance file conversions across a wide range of formats. From documents and images to video, audio, and archives, FileForge provides a seamless, professional experience with a modern glassmorphism design.

![FileForge Banner](https://img.shields.io/badge/FileForge-Conversion_API-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

## 🚀 Key Features

- **Multi-Format Support**: 
  - **Documents**: PDF, DOCX, PPTX (High-fidelity), XLSX, TXT, etc.
  - **Images**: PNG, JPG, WEBP, HEIC, BMP, etc.
  - **Media**: MP4, MKV, MP3, WAV, etc. (Powered by FFmpeg).
  - **Archives**: ZIP, 7Z, TAR.
- **High-Fidelity Conversions**: Precision PPTX to PDF rendering and office document support via LibreOffice integration.
- **Secure Persistence**: File storage leveraging MongoDB GridFS to ensure data integrity across sessions.
- **Modern UI/UX**: Responsive React frontend featuring:
  - Glassmorphism design aesthetics.
  - Floating sidebar navigation.
  - Real-time progress tracking.
  - Dark/Light mode support.
- **User Authentication**: Secure login and signup system.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Vanilla CSS with Glassmorphism
- **Icons**: Lucide React
- **Components**: Material Web Components

### Backend
- **Runtime**: Node.js (Express)
- **Database**: MongoDB (Mongoose) + GridFS for storage
- **Processing Engines**:
  - **FFmpeg**: Video/Audio processing
  - **LibreOffice**: Office document conversion
  - **Puppeteer**: PDF generation and web scraping
  - **Sharp**: Image optimization
  - **Node-7z**: Archive management

## 📦 Project Structure

```text
file_converter/
├── client/           # React Frontend (Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   └── pages/       # Page layouts (Convert, History, Auth, etc.)
└── server/           # Node.js Backend
    ├── index.js      # Core API logic and conversion engine
    ├── uploads/      # Temporary storage for uploaded files
    └── outputs/      # Temporary storage for converted files
```

## 🚀 Getting Started

### Prerequisites

To run FileForge locally, you need the following installed on your system:

- **Node.js**: v18 or higher
- **MongoDB**: A running instance (local or MongoDB Atlas)
- **System Dependencies**:
  - **FFmpeg**: Required for media conversions.
  - **LibreOffice**: Required for office document conversions (ensure `soffice` is in your PATH).
  - **7-Zip**: Required for archive management.

### Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Guptha747458/file_converter.git
    cd file_converter
    ```

2.  **Environment Configuration**:
    Create a `.env` file in the `server/` directory:
    ```env
    PORT=4000
    DATABASE_URL=mongodb://your-mongodb-uri
    ```

3.  **Install & Run Backend**:
    ```bash
    cd server
    npm install
    npm run dev
    ```
    The server will start on `http://localhost:4000`.

4.  **Install & Run Frontend**:
    ```bash
    cd client
    npm install
    npm run dev
    ```
    The client will start on `http://localhost:5173`.

## ☁️ Deployment (Render)

FileForge is optimized for easy deployment on **Render** using the provided Blueprint configuration. The deployment consists of two services:
1. **Frontend (`file-forge-ui`)**: A lightning-fast static site.
2. **Backend API (`file-forge-api`)**: A Dockerized Node.js environment packed with system dependencies (LibreOffice, FFmpeg, Puppeteer).

### How to Deploy
1. Create an account on [Render.com](https://render.com).
2. Go to your Render Dashboard and click **New +** -> **Blueprint**.
3. Connect your GitHub repository containing FileForge.
4. Render will automatically read the `render.yaml` file and provision both the frontend and backend.
5. Once created, go to the **`file-forge-api`** service in your dashboard and add your MongoDB Atlas connection string as the `DATABASE_URL` environment variable.

## 📄 License

This project is licensed under the ISC License.

---
Built with ❤️ for high-performance file processing.
