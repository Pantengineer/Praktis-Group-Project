import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Pages - Auth
import Login from './pages/auth/login';
import RoleSelection from './pages/auth/RoleSelection';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Pages - Public
import Faq from './pages/public/Faq';

// Pages - Admin
import LayoutAdmin from './layouts/LayoutAdmin';
import DashboardAdmin from './pages/admin/Dashboard';
import ManajemenUser from './pages/admin/ManajemenUser';
import ManajemenPraktikum from './pages/admin/ManajemenPraktikum';
import ManajemenMahasiswaPraktikum from './pages/admin/ManajemenMahasiswaPraktikum';
import ManajemenBerkas from './pages/admin/ManajemenBerkas';
import ManajemenSesiIP from './pages/admin/ManajemenSesiIP';
import PengaturanKontak from './pages/admin/PengaturanKontak';

// Pages - Asdos
import LayoutAsdos from './layouts/LayoutAsdos';
import DashboardAsdos from './pages/asdos/Dashboard';
import JadwalAsdos from './pages/asdos/Jadwal'; // This is the new "Timeline" page
import MateriAsdos from './pages/asdos/Materi';
import TugasAsdos from './pages/asdos/Tugas';
import PenilaianAsdos from './pages/asdos/Penilaian';
import SessionDetail from './pages/asdos/SessionDetail';
import ClassHubAsdos from './pages/asdos/ClassHub'; // ADDED
import PresensiAsdos from './pages/asdos/Presensi'; // ADDED
// Note: 'ManajemenModul' and 'JadwalInput' are removed because they are merged into JadwalAsdos

// Pages - Mahasiswa
import LayoutMhs from './layouts/LayoutMhs';
import DashboardMhs from './pages/mahasiswa/Dashboard';
import JadwalMhs from './pages/mahasiswa/Jadwal';
import MateriMhs from './pages/mahasiswa/Materi';
import TugasMhs from './pages/mahasiswa/Tugas';
import TugasUpload from './pages/mahasiswa/TugasUpload';
import SessionDetailMhs from './pages/mahasiswa/SessionDetail';

import Profile from './pages/common/Profile';
import Timeline from './pages/common/Timeline';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Routes>

      {/* --- Public Routes --- */}
      <Route path="/" element={<Login />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/faq" element={<Faq />} />

      {/* --- Role Selection --- */}
      <Route
        path="/auth/role-selection"
        element={
          <ProtectedRoute>
            <RoleSelection />
          </ProtectedRoute>
        }
      />

      {/* --- Admin Routes --- */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <LayoutAdmin />
          </ProtectedRoute>
        }
      >
        {/* Child Routes (Rendered inside LayoutAdmin's <Outlet />) */}
        <Route path="dashboard" element={<DashboardAdmin />} />
        <Route path="profile" element={<Profile />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="users" element={<ManajemenUser />} />
        <Route path="praktikum" element={<ManajemenPraktikum />} />
        <Route path="files" element={<ManajemenBerkas />} />
        <Route path="sessions" element={<ManajemenSesiIP />} />
        {/* ✅ FIX: Move it here and use relative path "user/:id" */}
        {/* Note: It inherits the 'admin' protection from the parent route */}
        <Route path="user/:id" element={<Profile />} />
        <Route path="praktikum/:id/mahasiswa" element={<ManajemenMahasiswaPraktikum />} />
        <Route path="contact-settings" element={<PengaturanKontak />} />

      </Route>


      {/* --- Asdos Routes (UPDATED) --- */}
      <Route path="/asdos" element={<ProtectedRoute allowedRoles={['asdos']}><LayoutAsdos /></ProtectedRoute>}>

        <Route path="dashboard" element={<DashboardAsdos />} />
        <Route path="profile" element={<Profile />} />
        <Route path="timeline" element={<Timeline />} />

        {/* 0. CLASS HUB ROUTE */}
        <Route path="kelas/:id_praktikum" element={<ClassHubAsdos />} />

        {/* 1. DYNAMIC JADWAL ROUTE */}
        {/* Matches sidebar link: /asdos/kelas/1/jadwal */}
        <Route path="kelas/:id_praktikum/jadwal" element={<JadwalAsdos />} />

        {/* 2. OTHER DYNAMIC ROUTES */}
        <Route path="kelas/:id_praktikum/materi" element={<MateriAsdos />} />
        <Route path="kelas/:id_praktikum/tugas" element={<TugasAsdos />} />
        <Route path="kelas/:id_praktikum/presensi" element={<PresensiAsdos />} />

        {/* 3. SESSION DETAIL (Where we will upload files later) */}
        <Route path="kelas/:id_praktikum/session/:id_pertemuan" element={<SessionDetail />} />

        {/* Legacy/Static Routes (Keep if you still need them for generic lists) */}
        <Route path="kelas/:id_praktikum/tugas/:id_tugas/grade" element={<PenilaianAsdos />} />

      </Route>


      {/* --- Mahasiswa Routes --- */}
      <Route path="/mahasiswa" element={<ProtectedRoute allowedRoles={['mahasiswa']}><LayoutMhs /></ProtectedRoute>}>
        <Route path="dashboard" element={<DashboardMhs />} />
        <Route path="profile" element={<Profile />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="kelas/:id_praktikum/jadwal" element={<JadwalMhs />} />
        <Route path="kelas/:id_praktikum/materi" element={<MateriMhs />} />
        <Route path="kelas/:id_praktikum/tugas" element={<TugasMhs />} />
        <Route path="kelas/:id_praktikum/tugas/:id_tugas" element={<TugasUpload />} />
        <Route path="kelas/:id_praktikum" element={<JadwalMhs />} />
        <Route path="kelas/:id_praktikum/session/:id_session" element={<SessionDetailMhs />} />
      </Route>

    </Routes>
    </ErrorBoundary>
  );
}

export default App;