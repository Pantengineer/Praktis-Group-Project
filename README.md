# Praktis Group Project 🎓

## Overview

**Praktis** is a full-stack Learning Management System (LMS) and Practical Management Platform designed for university computer science courses. It features multi-role access control, interactive session scheduling, real-time schedule conflict detection, file storage anti-abuse systems, and student task submission workflows.

- **Frontend**: Single-Page Application built with React, Vite, React Router, Bootstrap 5, and Framer Motion (`client/`).
- **Backend**: Express REST API (`server/`) utilizing a dual-database architecture:
  - **Relational DB (MySQL / MariaDB via Sequelize)**: Core relational data (Users, Roles, Praktikum Classes, Pertemuan Sessions).
  - **NoSQL DB (MongoDB via Mongoose)**: Flexible document storage (Materi, Tugas, Submissions, User Sessions, APM Logs).

---

## Key Features ✨

- **Role-Based Access Control (RBAC)**: Distinct views and capabilities for **Admin**, **Asdos (Assistant)**, and **Mahasiswa (Student)** with dynamic SQL `PraktikumUserRole` enrollment validation.
- **Interactive Timeline**: Visual course timeline with collapsible date nodes, interactive tick markers with counter badges, and global expand/collapse toolbar.
- **Schedule & Room Conflict Detector**: Real-time room and time overlap detection on the Admin Dashboard calendar with 1-click deep-linking into session management modals.
- **5-Layer File Upload Anti-Abuse System**:
  - 🛑 **Per-User Quota Guard**: Strict 100 MB total active upload cap per student across all assignments (`MAX_USER_QUOTA_MB`).
  - ⏱️ **Upload Rate Limiter**: Max 10 file upload requests per 15 minutes per IP.
  - 🔒 **Double MIME & Extension Validation**: Validates file extensions (`.pdf`, `.docx`, `.pptx`, `.jpg`, `.png`, `.zip`) alongside browser MIME types.
  - ⚙️ **Global Storage Cap**: 5 GB system-wide upload limit (`MAX_STORAGE_LIMIT_MB`).
  - 💥 **Graceful `ENOSPC` Handling**: Intercepts disk-full OS errors with HTTP 507 without crashing Node.js.
- **Universal File Unloading & Unsubmit**:
  - Student assignment unsubmit (`Batal Kumpul & Hapus Berkas`) with instant quota recovery.
  - Automatic old file cleanup from disk when students re-submit assignments.
  - Inline file deletion across Asdos & Admin views (Materi, Tugas, SessionDetail, and Penilaian grading table).
- **Human-Readable File Name Obfuscation**: Strips internal storage timestamp prefixes (`userId-timestamp-`) from browser download headers (`Content-Disposition`) and UI cards while maintaining collision-free disk storage.
- **APM Observability & Security Monitoring**: Live refresh status badges, IP ban enforcement, active session tracking, and storage quota statistics.

---

## Architecture & Tech Stack 🛠️

- **Frontend**: React 18, Vite, React Router v6, Axios, Bootstrap 5, Framer Motion, Recharts, React Calendar.
- **Backend**: Node.js, Express, Sequelize (MySQL/MariaDB), Mongoose (MongoDB), Multer, Express Rate Limit, JWT, Cookie-Parser, Helmet, Winston.
- **File Storage**: Local disk storage (`server/uploads/materi/`, `server/uploads/submissions/`, `server/uploads/tasks/`).

---

## Project Structure 📂

```text
Praktis-Group-Project/
├── client/                      # React SPA Frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components (ClassHeaderBanner, etc.)
│   │   ├── context/             # AuthContext & state providers
│   │   ├── pages/               # Role-based views
│   │   │   ├── admin/           # Dashboard, ManajemenPraktikum, ManajemenBerkas, ManajemenSesiIP
│   │   │   ├── asdos/           # Dashboard, Materi, Tugas, SessionDetail, Penilaian
│   │   │   ├── mahasiswa/       # Dashboard, Jadwal, Materi, TugasUpload, SessionDetail
│   │   │   └── common/          # Timeline, Login, Profile
│   │   ├── utils/               # Axios API instance, role helpers, fileHelpers.js
│   │   └── App.jsx              # Main routes & protected layout routing
│   └── vite.config.js
│
├── server/                      # Express REST API Backend
│   ├── config/                  # DB connection configs (SQL & Mongo) & env loaders
│   ├── controllers/             # Request handlers (auth, content, submission, admin)
│   ├── middleware/              # authMiddleware, rbacMiddleware, uploadMiddleware, rateLimiter, errorHandler
│   ├── models/                  # SQL (Sequelize) & NoSQL (Mongoose) schemas
│   ├── routes/                  # Express endpoints (auth, admin, content, submission, user, attendance)
│   ├── uploads/                 # Storage folders (materi, submissions, tasks)
│   ├── seed.js                  # Database seeder script
│   └── server.js                # App entry point & HTTP listener
│
└── docker-compose.yml           # Docker Compose orchestration
```

---

## Getting Started 🚀

### Prerequisites

- **Docker Setup (Recommended)**: [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- **Manual Setup**: Node.js ($\ge 18$), npm, MongoDB instance, MySQL / MariaDB server.

---

### Installation & Setup

#### Option 1: Docker (Recommended)

1. Open a terminal at the project root directory:
   ```powershell
   docker compose up --build
   ```
2. Access the application:
   - **Frontend**: http://localhost:5173
   - **Backend API**: http://localhost:5001

*For detailed container diagnostics and database access, see the [Docker Migration Guide](docs/docker_migration_guide.md).*

---

#### Option 2: Manual Setup

**1. Backend Setup**

```powershell
cd server
npm install
```

Create a `.env` file in the `server/` directory (you can copy `.env.example`):

> [!WARNING]
> Windows users: Port 5000 is often reserved by background OS processes. To avoid `403 Forbidden` CORS errors or `EADDRINUSE` crashes, **always set the backend PORT to 5001**.

Example `server/.env`:
```env
# Server Configuration
PORT=5001
NODE_ENV=development

# MySQL / MariaDB Configuration
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASS=root
MYSQL_DB_NAME=praktis_db
MYSQL_DIALECT=mysql

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/praktis_db

# JWT Secret (Minimum 32 characters)
JWT_SECRET=your_super_secret_key_change_this_in_production_minimum_32_chars

# Default Admin Credentials
ADMIN_PASSWORD=ChangeMe@123456

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# File Upload Anti-Abuse Limits (in MB)
MAX_STORAGE_LIMIT_MB=5000
MAX_USER_QUOTA_MB=100
```

**Populate Initial Data (Seeding):**
To populate your databases (MySQL & MongoDB) with dummy classes, sessions, and multi-role test accounts:
```powershell
npm run seed
```

This populates the following test accounts:
- 👑 **Super Admin**: `admin@admin.com` (Password: `admin123`)
- 🧑‍🏫 **Mahasiswa 1 (Asdos in WEB-A, Student in SDA-B)**: `mhs1@mhs.com` (Password: `mhs123`)
- 🧑‍🏫 **Mahasiswa 2 (Asdos in SDA-B, Student in WEB-A)**: `mhs2@mhs.com` (Password: `mhs123`)
- 👨‍🎓 **Mahasiswa 3–5**: `mhs3@mhs.com`, `mhs4@mhs.com`, `mhs5@mhs.com` (Password: `mhs123`)

Start backend development server:
```powershell
npm run dev
```

---

**2. Frontend Setup**

In a new terminal:
```powershell
cd client
npm install
```

Create `.env.development` in `client/`:
```env
VITE_API_URL=http://localhost:5001
```

Start frontend development server:
```powershell
npm run dev
```

---

## Important Scripts 📜

- **Server (`server/package.json`)**:
  - `npm run dev`: Start backend with `nodemon` live-reload.
  - `npm start`: Start production Node.js server.
  - `npm run seed`: Run database seeder script (`seed.js`).
- **Client (`client/package.json`)**:
  - `npm run dev`: Start Vite development server.
  - `npm run build`: Build production assets into `client/dist/`.
  - `npm run preview`: Locally preview production build.

---

## Release History 📌

- **1.2.0**
  - Added 5-layer upload anti-abuse system (100 MB per-user cap, rate limiter, MIME double-validation, ENOSPC interceptor).
  - Added universal file unloading (student unsubmit, automatic re-upload cleanup, Asdos & Admin inline file deletion).
  - Added real-time schedule & room conflict detector with 1-click Admin Deep-Linking on Dashboard.
  - Implemented human-readable filename obfuscation (`getCleanFilename()`) across 10 components and backend download headers.
  - Upgraded interactive Timeline with collapsible date nodes and day tick counters.
- **1.1.0**
  - Fixed Bootstrap `.badge` contrast bugs in Observability / APM page.
  - Migrated Mongoose queries to `returnDocument: 'after'`.
  - Dockerized full stack (Frontend, Backend, MySQL, MongoDB).
- **1.0.0**
  - Initial Release.

---

## Authors ✍️

- **Daffa Ibnu Abdillah** - *Backend Dev*
- **Ilham Buwana Putra** - *Database & QA*
- **Lidya Stephanie Arthania** - *Product Owner*
- **Muhammad Alfi Anfahsa** - *Scrum Master*
- **Muhammad Rafli Pradana** - *Frontend Dev*
