# 🛠️ Backend Refactoring Backlog & Architecture Roadmap

This document tracks technical debt, design decisions, and the phased roadmap for refactoring the **Praktis** backend architecture.

---

## 🎯 Architectural Vision: Domain-Driven Services

### Why Move to Domain-Driven (Feature-Based) Architecture?

Currently, the backend has an arbitrary split between root services and `services/admin/` (e.g. `praktikumService.js` vs `admin/praktikumService.js`, `userService.js` vs `admin/userService.js`). This leads to:
1. **Split Responsibilities:** Business logic for a single entity (e.g., Course / Praktikum) is fragmented based on *who* makes the request (Admin vs User) rather than *what domain* it belongs to.
2. **Logic Duplication:** Course enrollment and role assignment logic were duplicated across 3 separate files.
3. **Scattered Authorization:** Role verification (Asdos vs Mahasiswa vs Admin) is repeated across multiple services.

### Target Domain-Driven Service Structure
```
server/services/
├── auth/          # Login, tokens, session verification
├── user/          # User profile, user master CRUD
├── course/        # Praktikum master, 10-session generation, class enrollment (asdos & mahasiswa)
├── content/       # Materi, Tugas, deadlines, student timeline aggregation
├── submission/    # Student submissions, grading, score validation (0-100), comments
├── attendance/    # Presensi sheets, bulk recording, student attendance summaries
├── media/         # File retrieval, MIME headers, storage usage calculation, file explorer
├── analytics/     # Admin stats, Asdos dashboard, Mahasiswa dashboard, API traffic metrics
├── security/      # Active sessions, IP ban management, self-ban protection
└── common/        # Shared helpers: authorization/role checks, file helpers (safeUnlink, path resolution)
```

---

## 📋 Phased Refactoring Roadmap

### Phase 1: Controller Slimdown & Initial Service Extraction *(Completed)*
- [x] Extract heavy database queries and business logic from controllers into dedicated services.
- [x] Keep controllers focused as thin HTTP orchestrators (request validation -> service call -> response).
- [x] Fix relative ESM import paths (ensure explicit `.js` extensions).
- [x] Fix missing `await` statements on async service calls (`getMyClassRole`, `banIp`, `createPraktikum`).
- [x] Fix incorrect method calls (`adminController.getAsdos` calling `assignAsdos`).
- [x] Standardize admin user detail/edit routing to `/api/admin/users/:id`.
- [x] Replace legacy `diskService.js` with `utils/fileHelper.js`.

---

### Phase 2: Domain-Driven Service Restructuring *(Next Step)*
- [ ] **Consolidate Enrollment:** Merge duplicated enrollment/assignment logic from `assignmentService.js`, `userService.js`, and `praktikumService.js` into `course/enrollmentService.js`.
- [ ] **Unify Course & Session Management:** Group class creation, update, deletion, and auto-generated 10-session cascades under `course/courseService.js` and `course/sessionService.js`.
- [ ] **Centralize Dashboard & Analytics:** Group Admin, Asdos, and Mahasiswa dashboard aggregations into `analytics/dashboardService.js`.
- [ ] **Unified File Operations:** Combine file download prep, safe unlinking, and storage explorer into `media/mediaService.js` and `media/storageService.js`.
- [ ] **Shared Authorization Helper:** Centralize `resolveUserClassRole` and staff access checks into `common/authorizationHelper.js`.

---

### Phase 3: Service HTTP Isolation & Centralized Error Handling
- [ ] **HTTP-Agnostic Services:** Refactor services to throw domain error objects or custom Error classes (`NotFoundError`, `ForbiddenError`, `ValidationError`) instead of HTTP status codes like `{ status: 403, message: ... }`.
- [ ] **Universal `next(error)` in Controllers:** Remove boilerplate `res.status(500).json(...)` from controller catch blocks; delegate entirely to `next(error)`.
- [ ] **Dedicated `errorHandler` Middleware:** Enhance `middleware/errorHandler.js` to automatically map custom Error classes, Sequelize validation errors, and MongoDB CastErrors to clean HTTP responses (400, 403, 404, 500).

---

### Phase 4: Node.js Modernization & I/O Hardening
- [ ] **Non-Blocking I/O (`node:fs/promises`):** Replace synchronous filesystem calls (`fs.unlinkSync`, `fs.readdirSync`, `fs.statSync`) with `node:fs/promises` (`await fs.unlink()`, `await fs.stat()`) to prevent blocking the single-threaded Node.js Event Loop.
- [ ] **Modern Built-in Import Prefix:** Standardize all Node built-in imports to use the `node:` protocol prefix (`import fs from 'node:fs/promises'`, `import path from 'node:path'`).
- [ ] **Stream Leak Prevention:** Replace legacy `stream.pipe(res)` in file downloads with `pipeline(readStream, res)` from `node:stream/promises` to ensure sockets and file descriptors are properly closed when downloads are aborted.
- [ ] **Clean Path Resolution:** Simplify redundant `path.resolve(path.join(...))` patterns down to clean `path.resolve(...)`.
- [ ] **Path Traversal Security:** Validate resolved paths against strict white-listed base directories (`uploads/`) to prevent directory traversal exploits.
