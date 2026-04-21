# FileForge - Ultimate File Conversion Platform

FileForge is a powerful, full-stack web application designed to handle high-performance file conversions across a wide range of formats. From documents and images to video, audio, and archives, FileForge provides a seamless, professional experience with a modern glassmorphism design.

![FileForge Banner](https://img.shields.io/badge/FileForge-Conversion_API-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## 🚀 Key Features

- **Multi-Format Support**: 
  - **Documents**: PDF, DOCX, PPTX (High-fidelity), XLSX, TXT, etc.
  - **Images**: PNG, JPG, WEBP, HEIC, BMP, etc.
  - **Media**: MP4, MKV, MP3, WAV, etc. (Powered by FFmpeg).
  - **Archives**: ZIP, 7Z, TAR.
- **High-Fidelity Conversions**: Precision PPTX to PDF rendering using LibreOffice integration.
- **Asynchronous Processing**: Background job management using Redis and BullMQ for reliable long-running tasks.
- **Secure Persistence**: File storage leveraging MongoDB GridFS to ensure data integrity.
- **Modern UI/UX**: Responsive React frontend featuring:
  - Glassmorphism design aesthetics.
  - Floating sidebar navigation.
  - Real-time progress tracking.
  - Dark/Light mode support.
- **User Authentication**: Secure login and signup system.
- **Containerized**: Fully Dockerized for easy deployment.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Vanilla CSS with Glassmorphism
- **Icons**: Lucide React
- **Components**: Material Web Components

### Backend
- **Runtime**: Node.js (Express)
- **Database**: MongoDB (Mongoose) + GridFS for storage
- **Queue System**: Redis + BullMQ
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
│   │   ├── pages/       # Page layouts (Convert, History, Auth, etc.)
│   │   └── utils/       # API and helper functions
├── server/           # Node.js Backend
│   ├── modules/      # Conversion logic (FFmpeg, LibreOffice, etc.)
│   ├── models/       # MongoDB Schemas
│   └── routes/       # Express API Endpoints
├── Dockerfile        # Production build configuration
└── docker-compose.yml # Service orchestration (Server, Client, Mongo, Redis)
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- MongoDB & Redis (or use Docker)

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/Guptha747458/file_converter.git
    cd file_converter
    ```

2.  **Environment Setup**:
    Create a `.env` file in the `server/` directory:
    ```env
    PORT=4000
    DATABASE_URL=mongodb://your-mongodb-uri
    ```

3.  **Run with Docker (Recommended)**:
    ```bash
    docker-compose up --build
    ```

4.  **Local Manual Setup**:
    - **Backend**:
      ```bash
      cd server
      npm install
      npm run dev # Runs on http://localhost:4000
      ```
    - **Frontend**:
      ```bash
      cd client
      npm install
      npm run dev # Runs on http://localhost:5173
      ```

## 🐳 Docker Deployment

The project includes a multi-stage `Dockerfile` and `docker-compose.yml` for production-ready deployment. The Docker image includes all necessary system dependencies such as FFmpeg, LibreOffice, and Chrome (for Puppeteer).

```bash
docker-compose up -d
```

## 📄 License

This project is licensed under the ISC License.

---
Built with ❤️ for high-performance file processing.
