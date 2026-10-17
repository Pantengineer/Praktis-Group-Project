import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api'; 
import { motion } from 'framer-motion';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ErrorBoundary from '../../components/ErrorBoundary';

// Colors for the Pie Chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ff7300', '#413ea0', '#f50057'];

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalAsdos: 0,
    totalClasses: 0,
    totalStudents: 0,
    prodiDistribution: [],
    classesNeedingAttention: [],
    sessionDates: []
  });
  const [storageStats, setStorageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDateInfo, setSelectedDateInfo] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [resStats, resStorage] = await Promise.all([
          api.get('/api/admin/stats'),
          api.get('/api/admin/storage-stats')
        ]);
        setStats(resStats.data);
        setStorageStats(resStorage.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Calendar Date Formatter to match 'YYYY-MM-DD'
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        const dString = localDate.toISOString().split('T')[0];
        // stats.sessionDates is now an array of objects: { tanggal, sesi_ke, mata_kuliah, kode_kelas }
        if (stats.sessionDates && stats.sessionDates.some(s => s.tanggal === dString)) {
            return 'calendar-session-day';
        }
    }
    return null;
  };

  const handleDayClick = (value, event) => {
    const offset = value.getTimezoneOffset();
    const localDate = new Date(value.getTime() - (offset * 60 * 1000));
    const dString = localDate.toISOString().split('T')[0];
    
    if (stats.sessionDates) {
        const sessionsOnDate = stats.sessionDates.filter(s => s.tanggal === dString);
        setSelectedDateInfo({ date: dString, sessions: sessionsOnDate });
    }
  };

  // Conflict detector: checks if two sessions overlap in time AND share the same room
  const checkSessionConflict = (currentSession, allSessions) => {
    if (!currentSession || !allSessions || allSessions.length <= 1) return false;
    return allSessions.some(other => {
      if (other === currentSession) return false;
      const roomA = (currentSession.ruangan || 'Lab B').trim().toLowerCase();
      const roomB = (other.ruangan || 'Lab B').trim().toLowerCase();
      if (roomA !== roomB) return false;

      const startA = currentSession.waktu_mulai || '08:00';
      const endA = currentSession.waktu_selesai || '10:00';
      const startB = other.waktu_mulai || '08:00';
      const endB = other.waktu_selesai || '10:00';

      return (startA < endB) && (startB < endA);
    });
  };

  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300 } }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom Styles for Calendar Highlight */}
      <style>{`
        .calendar-session-day {
          background-color: #e0f2fe !important;
          color: #0284c7 !important;
          font-weight: bold;
          border-radius: 50%;
        }
        .react-calendar {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        .react-calendar__navigation button {
          min-width: 44px;
          background: none;
        }
        .react-calendar__navigation button:enabled:hover,
        .react-calendar__navigation button:enabled:focus {
          background-color: #f8f9fa;
        }
        .react-calendar__tile--active {
          background: #0d6efd !important;
          border-radius: 50%;
        }
      `}</style>

      <motion.div 
        className="container-fluid p-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants} className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold text-dark mb-0">Admin Dashboard</h2>
            <p className="text-muted mb-0">Selamat datang kembali! Ini adalah ringkasan sistem hari ini.</p>
          </div>
        </motion.div>

        {/* TOP ROW: Metrics */}
        <motion.div className="row g-4 mb-4" variants={containerVariants}>
          
          <motion.div className="col-xl-3 col-md-6" variants={itemVariants}>
            <div className="card shadow-sm border-0 bg-primary text-white h-100 rounded-4 overflow-hidden position-relative">
              <div className="card-body p-4 z-1 position-relative">
                <h6 className="opacity-75 fw-bold text-uppercase tracking-wide mb-1">Total Mahasiswa</h6>
                <h1 className="display-5 fw-bold mb-0">{stats.totalStudents}</h1>
              </div>
              <i className="bi bi-people-fill position-absolute" style={{ fontSize: '90px', right: '-10px', bottom: '-20px', opacity: 0.2, zIndex: 0 }}></i>
            </div>
          </motion.div>

          <motion.div className="col-xl-3 col-md-6" variants={itemVariants}>
            <div className="card shadow-sm border-0 bg-warning text-dark h-100 rounded-4 overflow-hidden position-relative">
              <div className="card-body p-4 z-1 position-relative">
                <h6 className="opacity-75 fw-bold text-uppercase tracking-wide mb-1">Total Kelas</h6>
                <h1 className="display-5 fw-bold mb-0">{stats.totalClasses}</h1>
              </div>
              <i className="bi bi-journal-bookmark-fill position-absolute" style={{ fontSize: '90px', right: '-10px', bottom: '-20px', opacity: 0.2, zIndex: 0 }}></i>
            </div>
          </motion.div>

          <motion.div className="col-xl-3 col-md-6" variants={itemVariants}>
            <div className="card shadow-sm border-0 bg-success text-white h-100 rounded-4 overflow-hidden position-relative">
              <div className="card-body p-4 z-1 position-relative">
                <h6 className="opacity-75 fw-bold text-uppercase tracking-wide mb-1">Total Asdos</h6>
                <h1 className="display-5 fw-bold mb-0">{stats.totalAsdos}</h1>
              </div>
              <i className="bi bi-person-badge-fill position-absolute" style={{ fontSize: '90px', right: '-10px', bottom: '-20px', opacity: 0.2, zIndex: 0 }}></i>
            </div>
          </motion.div>

          {/* STORAGE CAPACITY CARD */}
          <motion.div className="col-xl-3 col-md-6" variants={itemVariants}>
            <div className="card shadow-sm border-0 bg-dark text-white h-100 rounded-4 overflow-hidden position-relative">
              <div className="card-body p-4 z-1 position-relative d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="opacity-75 fw-bold text-uppercase tracking-wide mb-0">Penyimpanan Sistem</h6>
                    <span className="badge bg-info text-dark rounded-pill px-2 py-1 small fw-bold">
                      {storageStats?.totalFiles || 0} Berkas
                    </span>
                  </div>
                  <h3 className="fw-bold mb-2">
                    {storageStats ? `${(storageStats.totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB` : '0 GB'}
                    <span className="fs-6 opacity-50 fw-normal ms-1">/ {((storageStats?.maxStorageMB || 5000) / 1024).toFixed(1)} GB</span>
                  </h3>

                  {/* Progress Bar */}
                  <div className="progress bg-secondary bg-opacity-50 mb-2" style={{ height: '8px', borderRadius: '4px' }}>
                    <div 
                      className={`progress-bar transition-all ${
                        storageStats?.usedPercentage > 90 ? 'bg-danger' : storageStats?.usedPercentage > 70 ? 'bg-warning' : 'bg-info'
                      }`} 
                      role="progressbar" 
                      style={{ width: `${Math.min(storageStats?.usedPercentage || 0, 100)}%` }}
                    ></div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center opacity-75" style={{ fontSize: '0.75rem' }}>
                    <span>Terpakai: {storageStats?.usedPercentage || 0}%</span>
                    <span>Max: {storageStats?.maxStorageMB || 5000} MB</span>
                  </div>
                </div>

                <div className="mt-3 text-end">
                  <Link to="/admin/files" className="btn btn-outline-light btn-sm rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
                    <i className="bi bi-folder2-open me-1"></i> Kelola Berkas
                  </Link>
                </div>
              </div>
              <i className="bi bi-hdd-network-fill position-absolute" style={{ fontSize: '90px', right: '-10px', bottom: '-20px', opacity: 0.15, zIndex: 0 }}></i>
            </div>
          </motion.div>

        </motion.div>

        {/* MIDDLE ROW: Charts & Calendar */}
        <motion.div className="row g-4 mb-4" variants={containerVariants}>
          
          {/* Pie Chart */}
          <motion.div className="col-lg-7" variants={itemVariants}>
            <div className="card shadow-sm border-0 rounded-4 h-100">
              <div className="card-header bg-white py-3 border-bottom-0">
                <h6 className="fw-bold mb-0"><i className="bi bi-pie-chart-fill text-primary me-2"></i>Distribusi Program Studi</h6>
              </div>
              <div className="card-body" style={{ height: '350px' }}>
                <ErrorBoundary fallback={<div className="d-flex h-100 justify-content-center align-items-center text-muted"><i className="bi bi-pie-chart me-2"></i>Grafik sedang tidak dapat dimuat.</div>}>
                  {stats.prodiDistribution && stats.prodiDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.prodiDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {stats.prodiDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [`${value} Mahasiswa`, name]}
                          contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="d-flex h-100 justify-content-center align-items-center text-muted">
                      Tidak ada data prodi.
                    </div>
                  )}
                </ErrorBoundary>
              </div>
            </div>
          </motion.div>

          {/* Calendar */}
          <motion.div className="col-lg-5" variants={itemVariants}>
            <div className="card shadow-sm border-0 rounded-4 h-100">
              <div className="card-header bg-white py-3 border-bottom-0 d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0"><i className="bi bi-calendar-check-fill text-primary me-2"></i>Jadwal Sesi Praktikum</h6>
                <span className="badge bg-info text-dark rounded-pill">Sesi Aktif Disorot</span>
              </div>
              <div className="card-body d-flex flex-column align-items-center">
                <ErrorBoundary fallback={<div className="p-3 text-center text-muted"><i className="bi bi-calendar-x me-2"></i>Kalender sedang tidak dapat dimuat.</div>}>
                  <Calendar 
                    tileClassName={tileClassName}
                    onClickDay={handleDayClick}
                    className="rounded-3 shadow-sm border-0 mb-3"
                  />
                </ErrorBoundary>
                
                {selectedDateInfo && (
                  <div className="w-100 p-3 bg-light rounded-3 border shadow-sm">
                    <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                      <h6 className="fw-bold mb-0 text-dark" style={{ fontSize: '0.88rem' }}>
                        <i className="bi bi-calendar-event text-primary me-2"></i>
                        Detail: {selectedDateInfo.date}
                      </h6>
                      <span className="badge bg-primary rounded-pill fw-bold">
                        {selectedDateInfo.sessions.length} Sesi
                      </span>
                    </div>

                    {/* Conflict Warning Alert */}
                    {selectedDateInfo.sessions.some(s => checkSessionConflict(s, selectedDateInfo.sessions)) && (
                      <div className="alert alert-danger p-2 mb-2 rounded-3 small fw-bold d-flex align-items-center gap-2 border-danger border-opacity-25" style={{ fontSize: '0.75rem' }}>
                        <i className="bi bi-exclamation-triangle-fill text-danger fs-6"></i>
                        <span>Terdeteksi Bentrok Ruangan & Waktu pada Tanggal Ini!</span>
                      </div>
                    )}

                    {selectedDateInfo.sessions.length > 0 ? (
                      <div className="d-flex flex-column gap-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                        {selectedDateInfo.sessions.map((s, idx) => {
                          const isConflicting = checkSessionConflict(s, selectedDateInfo.sessions);
                          return (
                            <div 
                              key={idx} 
                              className={`p-2.5 rounded-3 border transition-all ${
                                isConflicting 
                                  ? 'bg-danger bg-opacity-10 border-danger' 
                                  : 'bg-white border-secondary border-opacity-25'
                              }`}
                            >
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <div>
                                  <span className="fw-bold text-dark d-block" style={{ fontSize: '0.85rem' }}>
                                    {s.mata_kuliah} - Kelas {s.kode_kelas}
                                  </span>
                                  <small className="text-muted fw-semibold" style={{ fontSize: '0.75rem' }}>
                                    <i className="bi bi-bookmark-fill text-warning me-1"></i>Sesi ke-{s.sesi_ke}
                                  </small>
                                </div>
                                {isConflicting ? (
                                  <span className="badge bg-danger text-white rounded-pill px-2 py-0.5 fw-bold shadow-sm" style={{ fontSize: '0.68rem' }}>
                                    <i className="bi bi-exclamation-triangle-fill me-1"></i>Konflik!
                                  </span>
                                ) : (
                                  <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2 py-0.5 fw-bold" style={{ fontSize: '0.68rem' }}>
                                    Normal
                                  </span>
                                )}
                              </div>

                              <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-secondary border-opacity-10" style={{ fontSize: '0.76rem' }}>
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <span className="text-muted">
                                    <i className="bi bi-clock me-1 text-primary"></i>
                                    <strong className="text-dark">{s.waktu_mulai || '08:00'} &ndash; {s.waktu_selesai || '10:00'}</strong>
                                  </span>
                                  <span className="badge bg-secondary bg-opacity-10 text-dark border border-secondary border-opacity-25 rounded-pill">
                                    <i className="bi bi-geo-alt me-1 text-danger"></i>
                                    {s.ruangan || 'Lab B'}
                                  </span>
                                </div>

                                {s.id_praktikum && (
                                  <Link
                                    to="/admin/praktikum"
                                    state={{ openSessionClassId: s.id_praktikum, targetSessionId: s.id_pertemuan }}
                                    className="btn btn-outline-primary btn-sm rounded-pill px-2 py-0.5 fw-bold ms-auto"
                                    style={{ fontSize: '0.7rem' }}
                                  >
                                    Kelola <i className="bi bi-arrow-right"></i>
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-muted small mb-0 fst-italic text-center py-2">Tidak ada sesi praktikum pada tanggal ini.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </motion.div>

        {/* BOTTOM ROW: Needs Attention */}
        <motion.div className="row g-4" variants={containerVariants}>
          <motion.div className="col-12" variants={itemVariants}>
            <div className="card shadow-sm border-0 rounded-4 border-start border-danger border-4">
              <div className="card-header bg-white py-3 border-bottom-0">
                <h6 className="fw-bold mb-0 text-danger"><i className="bi bi-exclamation-triangle-fill me-2"></i>Kelas Butuh Perhatian</h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-4">Mata Kuliah</th>
                        <th>Kelas</th>
                        <th>Status Asdos</th>
                        <th>Status Mahasiswa</th>
                        <th className="text-end px-4">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.classesNeedingAttention && stats.classesNeedingAttention.length > 0 ? (
                        stats.classesNeedingAttention.map((cls) => (
                          <tr key={cls.id_praktikum}>
                            <td className="px-4 fw-medium">{cls.mata_kuliah}</td>
                            <td>{cls.kode_kelas}</td>
                            <td>
                              {cls.asdosCount === 0 ? (
                                <span className="badge bg-danger">0 Asdos</span>
                              ) : (
                                <span className="badge bg-success">{cls.asdosCount} Asdos</span>
                              )}
                            </td>
                            <td>
                              {cls.studentCount === 0 ? (
                                <span className="badge bg-warning text-dark">0 Mahasiswa</span>
                              ) : (
                                <span className="badge bg-success">{cls.studentCount} Mahasiswa</span>
                              )}
                            </td>
                            <td className="text-end px-4">
                              <Link to="/admin/praktikum" className="btn btn-sm btn-outline-primary">
                                Kelola
                              </Link>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center py-4 text-muted">
                            <i className="bi bi-check-circle-fill text-success fs-4 d-block mb-2"></i>
                            Semua kelas dalam kondisi baik.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

      </motion.div>
    </>
  );
};

export default Dashboard;