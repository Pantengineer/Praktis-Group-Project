import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../utils/api";
import { motion } from "framer-motion";
import ClassHeaderBanner from "../../components/ClassHeaderBanner";

const PresensiAsdos = () => {
  const { id_praktikum } = useParams();

  // Data States
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [sessionInfo, setSessionInfo] = useState(null);

  // UI States
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [error, setError] = useState(null);

  // ==========================================
  // FETCH SESSIONS AND STATUSES
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      if (!id_praktikum) {
        setLoadingSessions(false);
        return;
      }

      try {
        setLoadingSessions(true);
        setError(null);

        const [statusRes, sessionRes] = await Promise.all([
          api.get("/api/attendance/statuses"),
          api.get(`/api/content/session/list/${id_praktikum}`),
        ]);

        if (!isMounted) return;

        setStatuses(statusRes.data || []);

        const sessionData = sessionRes.data || [];
        setSessions(sessionData);

        if (sessionData.length > 0) {
          setSelectedSession(sessionData[0].id_pertemuan);
        } else {
          setSelectedSession("");
        }
      } catch (err) {
        console.error("Error fetching initial data:", err);

        if (isMounted) {
          setError("Gagal memuat data sesi kelas.");
        }
      } finally {
        if (isMounted) {
          setLoadingSessions(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, [id_praktikum]);

  // ==========================================
  // FETCH ATTENDANCE SHEET
  // ==========================================

  useEffect(() => {
    let isMounted = true;

    const fetchAttendanceSheet = async () => {
      if (!selectedSession) {
        setAttendanceList([]);
        setSessionInfo(null);
        return;
      }

      try {
        setLoadingSheet(true);
        setSaveStatus(null);

        const res = await api.get(`/api/attendance/session/${selectedSession}`);

        if (!isMounted) return;

        setSessionInfo(res.data.session || null);

        if (res.data.statuses?.length > 0) {
          setStatuses(res.data.statuses);
        }

        const rawAttendance = res.data.attendance || [];

        const formattedList = rawAttendance.map((item) => ({
          id_user: item.id_user,
          nama: item.nama,
          nim: item.nim,
          id_status: item.presensi?.id_status || null,
        }));

        setAttendanceList(formattedList);
      } catch (err) {
        console.error("Error fetching attendance:", err);

        if (isMounted) {
          setError("Gagal memuat presensi mahasiswa.");
        }
      } finally {
        if (isMounted) {
          setLoadingSheet(false);
        }
      }
    };

    fetchAttendanceSheet();

    return () => {
      isMounted = false;
    };
  }, [selectedSession]);

  // ==========================================
  // ATTENDANCE STATUS HANDLERS
  // ==========================================

  const handleStatusChange = (userId, newStatusId) => {
    setAttendanceList((prev) =>
      prev.map((record) =>
        record.id_user === userId
          ? {
              ...record,
              id_status: parseInt(newStatusId, 10),
            }
          : record,
      ),
    );

    setSaveStatus(null);
  };

  const handleMarkAllHadir = () => {
    const hadirStatus = statuses.find(
      (status) => status.status.toLowerCase() === "hadir",
    );

    if (!hadirStatus) return;

    setAttendanceList((prev) =>
      prev.map((record) => ({
        ...record,
        id_status: hadirStatus.id_status,
      })),
    );

    setSaveStatus(null);
  };

  const isAlpaStatus = (label) => {
    if (!label) return false;

    return ["alfa", "alpa", "alpha"].includes(label.toLowerCase());
  };

  // ==========================================
  // SAVE ATTENDANCE
  // ==========================================

  const handleSave = async () => {
    if (!selectedSession || attendanceList.length === 0) {
      return;
    }

    try {
      setSaving(true);
      setSaveStatus(null);

      const defaultAlpaId =
        statuses.find((status) => isAlpaStatus(status.status))?.id_status || 4;

      const payload = {
        records: attendanceList.map((record) => ({
          id_user: record.id_user,
          id_status: record.id_status || defaultAlpaId,
        })),
      };

      await api.post(`/api/attendance/session/${selectedSession}`, payload);

      setSaveStatus("saved");

      setTimeout(() => {
        setSaveStatus(null);
      }, 3000);
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert("Gagal menyimpan presensi.");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // EXPORT CSV
  // ==========================================

  const handleExportCsv = async (scope) => {
    const isSession = scope === "session";

    const exportId = isSession ? selectedSession : id_praktikum;

    if (!exportId || exporting) return;

    try {
      setExporting(scope);

      const url = isSession
        ? `/api/attendance/export/session/${exportId}`
        : `/api/attendance/export/praktikum/${exportId}`;

      const response = await api.get(url, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8",
      });

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;

      link.download = isSession
        ? `presensi_sesi_${exportId}.csv`
        : `rekap_presensi_praktikum_${exportId}.csv`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
      }, 1000);
    } catch (err) {
      console.error("Error exporting CSV:", err);

      alert("Gagal export CSV. Pastikan Anda memiliki akses.");
    } finally {
      setExporting(null);
    }
  };

  // ==========================================
  // STATISTICS
  // ==========================================

  const getStatusLabel = (record) => {
    const status = statuses.find(
      (s) => Number(s.id_status) === Number(record.id_status),
    );

    return status?.status?.toLowerCase() || "";
  };

  const totalStudents = attendanceList.length;

  const hadirCount = attendanceList.filter(
    (record) => getStatusLabel(record) === "hadir",
  ).length;

  const izinCount = attendanceList.filter((record) =>
    ["izin", "sakit"].includes(getStatusLabel(record)),
  ).length;

  const alpaCount = attendanceList.filter(
    (record) => isAlpaStatus(getStatusLabel(record)) || !record.id_status,
  ).length;

  // ==========================================
  // ANIMATION
  // ==========================================

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 15,
    },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  // ==========================================
  // LOADING AND ERROR
  // ==========================================

  if (loadingSessions) {
    return (
      <div className="text-center py-5 text-light">
        <div className="spinner-border text-light" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>

        <p className="opacity-75 mt-3">Memuat modul presensi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card static rounded-4 p-4 text-white text-center">
        <i className="bi bi-exclamation-circle fs-1 d-block mb-3 text-danger" />
        {error}
      </div>
    );
  }

  // ==========================================
  // MAIN COMPONENT
  // ==========================================

  return (
    <div className="container-fluid p-0">
      {/* HEADER BANNER */}
      <ClassHeaderBanner
        id_praktikum={id_praktikum}
        activeTab="Manajemen Presensi Mahasiswa"
        backUrl={`/asdos/kelas/${id_praktikum}`}
        backLabel="Kembali ke Class Hub"
      />

      {/* SESSION SELECTOR */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card static rounded-4 p-4 mb-4"
      >
        <label className="form-label small fw-bold text-light opacity-75 mb-2 text-uppercase tracking-wider">
          <i className="bi bi-calendar-check me-2" />
          Pilih Sesi Pertemuan
        </label>

        {sessions.length === 0 ? (
          <div className="text-light opacity-75 small py-2">
            Belum ada sesi pertemuan. Silakan buat sesi di menu{" "}
            <strong className="text-white">Jadwal</strong>.
          </div>
        ) : (
          <select
            className="form-select form-select-lg bg-dark text-white border-light border-opacity-25 rounded-3 fw-bold shadow-none"
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            style={{ colorScheme: "dark" }}
          >
            {sessions.map((session) => (
              <option
                key={session.id_pertemuan}
                value={session.id_pertemuan}
                className="bg-dark text-white"
              >
                Sesi {session.sesi_ke} —{" "}
                {new Date(session.tanggal).toLocaleDateString("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </option>
            ))}
          </select>
        )}
      </motion.div>

      {/* STATISTICS */}
      {selectedSession && !loadingSheet && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="row g-3 mb-4"
        >
          {[
            {
              title: "Total Mahasiswa",
              value: totalStudents,
              icon: "bi-people",
              color: "primary",
            },
            {
              title: "Hadir",
              value: hadirCount,
              icon: "bi-person-check",
              color: "success",
            },
            {
              title: "Sakit / Izin",
              value: izinCount,
              icon: "bi-exclamation-circle",
              color: "warning",
            },
            {
              title: "Alpa / Belum",
              value: alpaCount,
              icon: "bi-person-x",
              color: "danger",
            },
          ].map((item) => (
            <div key={item.title} className="col-6 col-md-3">
              <div className="glass-card static rounded-4 p-3 d-flex align-items-center">
                <div
                  className={`bg-${item.color} bg-opacity-25 p-3 rounded-4 me-3`}
                >
                  <i className={`bi ${item.icon} fs-4 text-${item.color}`} />
                </div>

                <div>
                  <small className="text-light opacity-75 d-block">
                    {item.title}
                  </small>

                  <h4 className="fw-bold text-white mb-0">{item.value}</h4>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* ATTENDANCE SHEET */}
      {selectedSession && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="glass-card static rounded-4 overflow-hidden p-0 mb-4"
        >
          {/* SHEET HEADER */}
          <div
            className="p-4 border-bottom border-light border-opacity-10 d-flex justify-content-between align-items-center flex-wrap gap-3"
            style={{
              background: "rgba(255,255,255,0.03)",
            }}
          >
            <div>
              <h5 className="fw-bold text-white mb-1">
                Lembar Presensi —{" "}
                {sessionInfo
                  ? `Sesi ${sessionInfo.sesi_ke}`
                  : "Daftar Kehadiran"}
              </h5>

              <small className="text-light opacity-75">
                Klik status di tiap baris untuk memperbarui kehadiran mahasiswa.
              </small>
            </div>

            <div className="d-flex gap-2 align-items-center flex-wrap">
              {/* EXPORT SESSION CSV */}
              <button
                type="button"
                className="btn btn-outline-success rounded-pill px-3 btn-sm fw-bold"
                onClick={() => handleExportCsv("session")}
                disabled={
                  Boolean(exporting) ||
                  saving ||
                  loadingSheet ||
                  attendanceList.length === 0
                }
                title="Export presensi sesi terpilih"
              >
                {exporting === "session" ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Mengunduh...
                  </>
                ) : (
                  <>
                    <i className="bi bi-filetype-csv me-1" />
                    Export CSV Sesi
                  </>
                )}
              </button>

              {/* EXPORT PRAKTIKUM CSV */}
              <button
                type="button"
                className="btn btn-outline-info rounded-pill px-3 btn-sm fw-bold"
                onClick={() => handleExportCsv("praktikum")}
                disabled={
                  Boolean(exporting) ||
                  saving ||
                  loadingSheet ||
                  attendanceList.length === 0
                }
                title="Export rekap seluruh pertemuan"
              >
                {exporting === "praktikum" ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Mengunduh...
                  </>
                ) : (
                  <>
                    <i className="bi bi-download me-1" />
                    Export CSV Rekap
                  </>
                )}
              </button>

              {/* MARK ALL PRESENT */}
              <button
                type="button"
                className="btn btn-outline-light rounded-pill px-3 btn-sm fw-bold"
                onClick={handleMarkAllHadir}
                disabled={attendanceList.length === 0 || saving}
                title="Tandai semua mahasiswa sebagai Hadir"
              >
                <i className="bi bi-check-all me-1" />
                Tandai semua Hadir
              </button>

              {/* SAVE ATTENDANCE */}
              <button
                type="button"
                className={`btn ${
                  saveStatus === "saved" ? "btn-success" : "btn-primary"
                } rounded-pill px-4 btn-sm fw-bold transition-all`}
                onClick={handleSave}
                disabled={saving || attendanceList.length === 0}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Menyimpan...
                  </>
                ) : saveStatus === "saved" ? (
                  <>
                    <i className="bi bi-check2 me-1" />
                    Presensi Tersimpan
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-1" />
                    Simpan Presensi
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TABLE CONTENT */}
          <div className="table-responsive">
            {loadingSheet ? (
              <div className="text-center py-5 text-light">
                <div className="spinner-border text-light" role="status" />
                <p className="opacity-75 mt-3 small">
                  Memuat daftar mahasiswa...
                </p>
              </div>
            ) : attendanceList.length === 0 ? (
              <div className="text-center py-5 text-light opacity-50">
                <i className="bi bi-people fs-1 d-block mb-3 opacity-50" />
                Belum ada mahasiswa terdaftar di kelas ini.
              </div>
            ) : (
              <table className="table table-dark table-hover align-middle mb-0 bg-transparent">
                <thead>
                  <tr className="border-bottom border-light border-opacity-10 text-uppercase tracking-wider small text-light opacity-75">
                    <th className="px-4 py-3 bg-transparent">Mahasiswa</th>

                    <th className="py-3 bg-transparent">NIM</th>

                    <th className="px-4 py-3 bg-transparent text-center">
                      Status Kehadiran
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {attendanceList.map((record) => (
                    <motion.tr
                      variants={itemVariants}
                      key={record.id_user}
                      className="border-bottom border-light border-opacity-10"
                    >
                      <td className="px-4 bg-transparent fw-bold text-white">
                        {record.nama || "Mahasiswa"}
                      </td>

                      <td className="bg-transparent text-light opacity-75 small">
                        {record.nim || "-"}
                      </td>

                      <td className="px-4 bg-transparent">
                        <div className="d-flex justify-content-center gap-2 flex-wrap">
                          {statuses.map((status) => {
                            const isSelected =
                              Number(record.id_status) ===
                              Number(status.id_status);

                            const labelLower = status.status.toLowerCase();

                            let activeClass = "btn-outline-light opacity-50";

                            if (isSelected) {
                              if (labelLower === "hadir") {
                                activeClass =
                                  "btn-success text-white shadow-sm fw-bold";
                              } else if (labelLower === "sakit") {
                                activeClass =
                                  "btn-warning text-dark shadow-sm fw-bold";
                              } else if (labelLower === "izin") {
                                activeClass =
                                  "btn-info text-dark shadow-sm fw-bold";
                              } else if (isAlpaStatus(labelLower)) {
                                activeClass =
                                  "btn-danger text-white shadow-sm fw-bold";
                              }
                            }

                            return (
                              <button
                                key={status.id_status}
                                type="button"
                                className={`btn btn-sm rounded-pill px-3 py-1 ${activeClass}`}
                                style={{
                                  minWidth: "75px",
                                  fontSize: "0.82rem",
                                }}
                                onClick={() =>
                                  handleStatusChange(
                                    record.id_user,
                                    status.id_status,
                                  )
                                }
                              >
                                {status.status}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PresensiAsdos;
