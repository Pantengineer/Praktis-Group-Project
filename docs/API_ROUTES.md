# API Routes & RBAC

This document lists all API routes discovered in the repository and their required protections.
The **Source** column links to the route file.

| Method | Path | Auth Required | Allowed Roles | Notes                    | Source           |
| ------ | ---- | ------------- | ------------- | ------------------------ | ---------------- |
| GET    | /    | No            | -             | Server root health check | server/server.js |

---

## `/api/auth`

| Method | Path                                | Auth Required | Allowed Roles     | Notes                                   | Source        |
| ------ | ----------------------------------- | ------------- | ----------------- | --------------------------------------- | ------------- |
| POST   | /api/auth/login                     | No            | -                 | User login                              | authRoutes.js |
| POST   | /api/auth/logout                    | No            | -                 | Clear HttpOnly auth cookie              | authRoutes.js |
| GET    | /api/auth/me                        | Yes           | Any authenticated | Token test / current user               | authRoutes.js |
| POST   | /api/auth/forgot-password           | No            | -                 | Request password reset email            | authRoutes.js |
| GET    | /api/auth/verify-reset-token/:token | No            | -                 | Validate reset token expiry and status  | authRoutes.js |
| POST   | /api/auth/reset-password            | No            | -                 | Execute password update via reset token | authRoutes.js |

---

## `/api/settings`

| Method | Path                  | Auth Required | Allowed Roles     | Notes                                   | Source           |
| ------ | --------------------- | ------------- | ----------------- | --------------------------------------- | ---------------- |
| GET    | /api/settings/contact | No            | Any / Public      | Retrieve lab contact & WhatsApp info    | settingRoutes.js |
| PUT    | /api/settings/contact | Yes           | admin             | Update lab contact info & WhatsApp msg  | settingRoutes.js |
| GET    | /api/settings/all     | Yes           | admin             | Retrieve all system settings key-values | settingRoutes.js |

---

## `/api/users`

*(Router uses `verifyToken` globally)*

| Method | Path                           | Auth Required | Allowed Roles     | Notes                                  | Source        |
| ------ | ------------------------------ | ------------- | ----------------- | -------------------------------------- | ------------- |
| GET    | /api/users/profile             | Yes           | Any authenticated | Get user profile                       | userRoutes.js |
| PUT    | /api/users/profile             | Yes           | Any authenticated | Update profile                         | userRoutes.js |
| GET    | /api/users/asdos-dashboard     | Yes           | Any authenticated | Asdos dashboard data                   | userRoutes.js |
| GET    | /api/users/mahasiswa-dashboard | Yes           | Any authenticated | Mahasiswa dashboard data               | userRoutes.js |
| GET    | /api/users/admin/users/:id     | Yes           | Intended: admin   | **RBAC commented out** – security risk | userRoutes.js |
| PUT    | /api/users/admin/users/:id     | Yes           | Intended: admin   | **RBAC commented out** – security risk | userRoutes.js |
| POST   | /api/users/admin/enroll        | Yes           | Intended: admin   | **RBAC commented out** – security risk | userRoutes.js |
| POST   | /api/users/admin/unenroll      | Yes           | Intended: admin   | **RBAC commented out** – security risk | userRoutes.js |

---

## `/api/admin`

| Method | Path                     | Auth Required | Allowed Roles   | Notes                              | Source         |
| ------ | ------------------------ | ------------- | --------------- | ---------------------------------- | -------------- |
| GET    | /api/admin/stats         | Yes           | admin           | Dashboard statistics               | adminRoutes.js |
| GET    | /api/admin/asdos         | Yes           | admin           | List asdos (query: `id_praktikum`) | adminRoutes.js |
| POST   | /api/admin/asdos         | Yes           | admin           | Assign asdos                       | adminRoutes.js |
| DELETE | /api/admin/asdos         | Yes           | admin           | Remove asdos                       | adminRoutes.js |
| GET    | /api/admin/users         | Yes           | admin           | List users                         | adminRoutes.js |
| POST   | /api/admin/users         | Yes           | admin           | Create user                        | adminRoutes.js |
| DELETE | /api/admin/users/:id     | Yes           | admin           | Delete user                        | adminRoutes.js |
| GET    | /api/admin/praktikum     | Yes           | admin           | List classes                       | adminRoutes.js |
| POST   | /api/admin/praktikum     | **No**        | Intended: admin | ❗ **Missing verifyToken & RBAC**   | adminRoutes.js |
| DELETE | /api/admin/praktikum/:id | Yes           | admin           | Delete class                       | adminRoutes.js |

---

## `/api/content`

*(Router uses `verifyToken` globally)*

| Method | Path                                              | Auth Required | Allowed Roles     | Notes                | Source           |
| ------ | ------------------------------------------------- | ------------- | ----------------- | -------------------- | ---------------- |
| POST   | /api/content/session                              | Yes           | asdos, admin      | Create session       | contentRoutes.js |
| GET    | /api/content/session/list/:id_praktikum           | Yes           | Any authenticated | List sessions        | contentRoutes.js |
| PUT    | /api/content/session/:id                          | Yes           | asdos, admin      | Update session       | contentRoutes.js |
| DELETE | /api/content/session/:id                          | Yes           | asdos, admin      | Delete session       | contentRoutes.js |
| POST   | /api/content/materi                               | Yes           | asdos, admin      | Upload material      | contentRoutes.js |
| POST   | /api/content/tugas                                | Yes           | asdos, admin      | Create task          | contentRoutes.js |
| GET    | /api/content/materi/session/:pertemuan_id         | Yes           | Any authenticated | Materials by session | contentRoutes.js |
| GET    | /api/content/tugas/session/:pertemuan_id          | Yes           | Any authenticated | Tasks by session     | contentRoutes.js |
| GET    | /api/content/materi/:materiId/download/:fileIndex | Yes           | Any authenticated | Download material    | contentRoutes.js |
| GET    | /api/content/tugas/:id/download/:index            | Yes           | Any authenticated | Download task file   | contentRoutes.js |
| GET    | /api/content/tugas/:id                            | Yes           | Any authenticated | Get task detail      | contentRoutes.js |
| GET    | /api/content/me/:taskId                           | Yes           | Any authenticated | Get my submission    | contentRoutes.js |
| GET    | /api/content/session/:id                          | Yes           | Any authenticated | Get session detail   | contentRoutes.js |

---

## `/api/submission`

*(Router uses `verifyToken` globally)*

| Method | Path                                   | Auth Required | Allowed Roles     | Notes             | Source              |
| ------ | -------------------------------------- | ------------- | ----------------- | ----------------- | ------------------- |
| POST   | /api/submission                        | Yes           | Any authenticated | Submit work       | submissionRoutes.js |
| PUT    | /api/submission/:submissionId/grade    | Yes           | asdos, admin      | Grade submission  | submissionRoutes.js |
| GET    | /api/submission/:submissionId/download | Yes           | Any authenticated | Ownership checked | submissionRoutes.js |
| GET    | /api/submission/task/:taskId           | Yes           | asdos, admin      | List submissions  | submissionRoutes.js |
| GET    | /api/submission/me/:taskId             | Yes           | Any authenticated | My submission     | submissionRoutes.js |
| POST   | /api/submission/me/bulk-check          | Yes           | Any authenticated | Bulk fetch        | submissionRoutes.js |
| GET    | /api/submission/download/:submissionId | Yes           | Any authenticated | Alias route       | submissionRoutes.js |
