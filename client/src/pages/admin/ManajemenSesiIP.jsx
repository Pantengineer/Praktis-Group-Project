import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

const ManajemenSesiIP = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [bannedIps, setBannedIps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('SESSIONS'); // 'SESSIONS' | 'BANNED' | 'TRAFFIC'

  // Modal State for Ban Action
  const [showBanModal, setShowBanModal] = useState(false);
  const [banForm, setBanForm] = useState({
    ip_address: '',
    reason: 'Upaya akses mencurigakan atau pelanggaran tata tertib.',
    durationMinutes: '60',
    is_permanent: false
  });
  const [submittingBan, setSubmittingBan] = useState(false);

  // Observability & Traffic Stats States
  const [timeWindowHours, setTimeWindowHours] = useState('1'); // '0.5' | '1' | '6' | '24'
  const [trafficData, setTrafficData] = useState({
    summary: { totalRequests: 0, totalBandwidthMB: 0, avgLatencyMs: 0, errorRatePct: 0 },
    timeSeries: [],
    topIPs: []
  });
  const [apiLogs, setApiLogs] = useState([]);
  const [logFilter, setLogFilter] = useState({ ip: '', method: '', statusCode: '', page: 1 });
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [totalLogsCount, setTotalLogsCount] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSessions, resBanned] = await Promise.all([
        api.get('/api/admin/active-sessions'),
        api.get('/api/admin/banned-ips')
      ]);
      const sessions = Array.isArray(resSessions.data?.activeSessions) 
        ? resSessions.data.activeSessions 
        : (Array.isArray(resSessions.data) ? resSessions.data : []);
      const bans = Array.isArray(resBanned.data?.bannedIps) 
        ? resBanned.data.bannedIps 
        : (Array.isArray(resBanned.data) ? resBanned.data : []);
      setActiveSessions(sessions);
      setBannedIps(bans);
    } catch (err) {
      console.error("Error fetching session/IP data:", err);
      setActiveSessions([]);
      setBannedIps([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrafficAndLogs = async () => {
    try {
      setLoadingLogs(true);
      const params = new URLSearchParams({
        page: logFilter.page,
        limit: 15
      });
      if (logFilter.ip) params.append('ip', logFilter.ip);
      if (logFilter.method) params.append('method', logFilter.method);
      if (logFilter.statusCode) params.append('statusCode', logFilter.statusCode);

      const [resStats, resLogs] = await Promise.all([
        api.get(`/api/admin/api-traffic-stats?hours=${timeWindowHours}`),
        api.get(`/api/admin/api-logs?${params.toString()}`)
      ]);

      setTrafficData(resStats.data || { summary: {}, timeSeries: [], topIPs: [] });
      setApiLogs(resLogs.data.logs || []);
      setLogTotalPages(resLogs.data.totalPages || 1);
      setTotalLogsCount(resLogs.data.totalLogs || 0);
    } catch (err) {
      console.error("Error fetching traffic/logs data:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Live polling every 8 seconds when on TRAFFIC tab
  useEffect(() => {
    if (activeTab === 'TRAFFIC') {
      fetchTrafficAndLogs();
      const interval = setInterval(() => {
        fetchTrafficAndLogs();
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [activeTab, logFilter, timeWindowHours]);

  const openBanModal = (ipAddress = '') => {
    setBanForm({
      ip_address: ipAddress,
      reason: 'Upaya akses mencurigakan atau pelanggaran tata tertib.',
      durationMinutes: '60',
      is_permanent: false
    });
    setShowBanModal(true);
  };

  const handleBanSubmit = async (e) => {
    e.preventDefault();
    if (!banForm.ip_address) return alert("Alamat IP tidak boleh kosong.");

    try {
      setSubmittingBan(true);
      await api.post('/api/admin/ban-ip', {
        ip_address: banForm.ip_address,
        reason: banForm.reason,
        durationMinutes: banForm.is_permanent ? 0 : parseInt(banForm.durationMinutes),
        is_permanent: banForm.is_permanent
      });

      alert(`IP ${banForm.ip_address} berhasil diblokir.`);
      setShowBanModal(false);
      fetchData();
      if (activeTab === 'TRAFFIC') fetchTrafficAndLogs();
    } catch (err) {
      console.error("Error banning IP:", err);
      alert(err.response?.data?.message || "Gagal memblokir IP.");
    } finally {
      setSubmittingBan(false);
    }
  };

  const handleUnban = async (ip_address) => {
    if (!window.confirm(`Hapus pemblokiran untuk IP ${ip_address}?`)) return;

    try {
      await api.post('/api/admin/unban-ip', { ip_address });
      alert(`Pemblokiran IP ${ip_address} berhasil dicabut.`);
      fetchData();
    } catch (err) {
      console.error("Error unbanning IP:", err);
      alert("Gagal mencabut pemblokiran IP.");
    }
  };

  const getMethodBadgeClass = (method) => {
    switch (method) {
      case 'GET': return 'bg-success text-white';
      case 'POST': return 'bg-primary text-white';
      case 'PUT': return 'bg-warning text-dark';
      case 'DELETE': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  };

  const getStatusBadgeClass = (code) => {
    if (code >= 200 && code < 300) return 'bg-success text-white';
    if (code >= 400 && code < 500) return 'bg-warning text-dark';
    if (code >= 500) return 'bg-danger text-white';
    return 'bg-secondary text-white';
  };

  // Convert UTC ISO timestamps to local browser timezone display times
  const formattedTimeSeries = (trafficData.timeSeries || []).map(item => ({
    ...item,
    displayTime: item.timestampIso
      ? new Date(item.timestampIso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      : ''
  }));

  return (
    <div className="container-fluid p-4">
      {/* HEADER TITLE */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <i className="bi bi-shield-check text-primary fs-3"></i>
            <span>Manajemen Keamanan Sesi & Observabilitas API</span>
          </h2>
          <p className="text-muted mb-0">Pantau sesi pengguna aktif, analisis trafik API secara real-time, dan kelola daftar pemblokiran IP.</p>
        </div>

        <button
          onClick={() => openBanModal('')}
          className="btn btn-danger rounded-pill px-4 btn-sm fw-bold shadow-sm d-inline-flex align-items-center gap-2"
        >
          <i className="bi bi-slash-circle"></i>
          <span>Blokir IP Manual</span>
        </button>
      </div>

      {/* TABS NAVIGATION */}
      <ul className="nav nav-pills mb-4 gap-2 border-bottom pb-3">
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'SESSIONS' ? 'active bg-primary text-white shadow-sm' : 'text-secondary bg-light'}`}
            onClick={() => setActiveTab('SESSIONS')}
          >
            <i className="bi bi-people me-2"></i>Sesi Aktif ({activeSessions.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'BANNED' ? 'active bg-danger text-white shadow-sm' : 'text-secondary bg-light'}`}
            onClick={() => setActiveTab('BANNED')}
          >
            <i className="bi bi-slash-circle me-2"></i>IP Terblokir ({bannedIps.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-4 fw-bold ${activeTab === 'TRAFFIC' ? 'active bg-info text-white shadow-sm' : 'text-secondary bg-light'}`}
            onClick={() => setActiveTab('TRAFFIC')}
          >
            <i className="bi bi-activity me-2"></i>Observabilitas & Traffic API
          </button>
        </li>
      </ul>

      {/* TAB 1: ACTIVE SESSIONS */}
      {activeTab === 'SESSIONS' && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
            <h5 className="fw-bold text-dark mb-0">Daftar Sesi IP Aktif saat ini</h5>
            <button onClick={fetchData} className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold">
              <i className="bi bi-arrow-clockwise me-1"></i>Refresh
            </button>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status"></div>
                <p className="text-muted mt-2 small">Memuat daftar sesi aktif...</p>
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-inbox fs-1 d-block mb-2 text-secondary opacity-50"></i>
                Belum ada aktivitas sesi IP yang tercatat.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr className="small text-uppercase text-muted">
                      <th>IP Address</th>
                      <th>Pengguna Terakhir</th>
                      <th>Perangkat / User Agent</th>
                      <th>Aktivitas Terakhir</th>
                      <th className="text-end">Aksi Keamanan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSessions.map((session, idx) => (
                      <tr key={idx}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2.5 py-1.5 font-monospace fw-bold" style={{ fontSize: '0.85rem' }}>
                              {session.ip_address}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{session.user_name || 'Pengguna Anonim'}</div>
                          <small className="text-muted" style={{ fontSize: '0.78rem' }}>User ID: #{session.id_user || '-'}</small>
                        </td>
                        <td>
                          <div className="text-truncate text-muted small" style={{ maxWidth: '300px' }} title={session.user_agent}>
                            <i className="bi bi-laptop me-1"></i>{session.user_agent || 'Client API'}
                          </div>
                        </td>
                        <td className="small text-muted">
                          {new Date(session.last_active).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                        </td>
                        <td className="text-end">
                          <button
                            onClick={() => openBanModal(session.ip_address)}
                            className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold"
                          >
                            <i className="bi bi-slash-circle me-1"></i>Blokir IP
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BANNED IPS */}
      {activeTab === 'BANNED' && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
          <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
            <h5 className="fw-bold text-dark mb-0">Daftar IP Address Terblokir</h5>
            <button onClick={fetchData} className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold">
              <i className="bi bi-arrow-clockwise me-1"></i>Refresh
            </button>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-danger" role="status"></div>
                <p className="text-muted mt-2 small">Memuat daftar IP terblokir...</p>
              </div>
            ) : bannedIps.length === 0 ? (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-shield-check fs-1 d-block mb-2 text-success opacity-50"></i>
                Tidak ada IP address yang sedang diblokir.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr className="small text-uppercase text-muted">
                      <th>IP Address</th>
                      <th>Alasan Pemblokiran</th>
                      <th>Status & Masa Berlaku</th>
                      <th>Diblokir Oleh</th>
                      <th className="text-end">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bannedIps.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <span className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2.5 py-1.5 font-monospace fw-bold" style={{ fontSize: '0.85rem' }}>
                            {item.ip_address}
                          </span>
                        </td>
                        <td>
                          <div className="text-dark small fw-bold">{item.reason}</div>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            Waktu Blokir: {new Date(item.banned_at).toLocaleString('id-ID')}
                          </small>
                        </td>
                        <td>
                          {item.is_permanent ? (
                            <span className="badge bg-danger text-white rounded-pill px-3 py-1 fw-bold">Permanen</span>
                          ) : (
                            <div>
                              <span className="badge bg-warning text-dark rounded-pill px-2.5 py-1 fw-bold mb-1">Sementara</span>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                Berakhir: {new Date(item.expires_at).toLocaleString('id-ID')}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="small text-muted">{item.banned_by}</td>
                        <td className="text-end">
                          <button
                            onClick={() => handleUnban(item.ip_address)}
                            className="btn btn-outline-success btn-sm rounded-pill px-3 fw-bold"
                          >
                            <i className="bi bi-check-circle me-1"></i>Buka Pemblokiran
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: OBSERVABILITY & API TRAFFIC */}
      {activeTab === 'TRAFFIC' && (
        <div className="d-flex flex-column gap-4">
          {/* APM METRIC CARDS */}
          <div className="row g-3">
            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary bg-opacity-10 p-3 rounded-4 text-primary">
                    <i className="bi bi-activity fs-3"></i>
                  </div>
                  <div>
                    <small className="text-muted d-block fw-bold" style={{ fontSize: '0.78rem' }}>Total Permintaan API</small>
                    <h3 className="fw-bold text-dark mb-0">{trafficData.summary.totalRequests || 0}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-success bg-opacity-10 p-3 rounded-4 text-success">
                    <i className="bi bi-arrow-down-up fs-3"></i>
                  </div>
                  <div>
                    <small className="text-muted d-block fw-bold" style={{ fontSize: '0.78rem' }}>Transfer Data / Bandwidth</small>
                    <h3 className="fw-bold text-dark mb-0">{trafficData.summary.totalBandwidthMB || 0} <span className="fs-6 text-muted font-normal">MB</span></h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-warning bg-opacity-10 p-3 rounded-4 text-warning">
                    <i className="bi bi-speedometer2 fs-3"></i>
                  </div>
                  <div>
                    <small className="text-muted d-block fw-bold" style={{ fontSize: '0.78rem' }}>Rata-rata Latensi Server</small>
                    <h3 className="fw-bold text-dark mb-0">{trafficData.summary.avgLatencyMs || 0} <span className="fs-6 text-muted font-normal">ms</span></h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-6 col-md-3">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-danger bg-opacity-10 p-3 rounded-4 text-danger">
                    <i className="bi bi-exclamation-triangle fs-3"></i>
                  </div>
                  <div>
                    <small className="text-muted d-block fw-bold" style={{ fontSize: '0.78rem' }}>Tingkat Error (4xx / 5xx)</small>
                    <h3 className="fw-bold text-dark mb-0">{trafficData.summary.errorRatePct || 0} <span className="fs-6 text-muted font-normal">%</span></h3>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* TIME-SERIES TRAFFIC & BANDWIDTH CHART */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h5 className="fw-bold text-dark mb-0">Dinamika Trafik API & Volume Bandwidth</h5>
                  <span className="badge bg-success text-white px-2.5 py-1 rounded-pill fw-bold d-inline-flex align-items-center gap-1.5" style={{ fontSize: '0.72rem' }}>
                    <span className="spinner-grow spinner-grow-sm text-white" style={{ width: '8px', height: '8px' }}></span>
                    <span>LIVE Auto-Refresh</span>
                  </span>
                </div>
                <p className="text-muted small mb-0">Disajikan dalam Waktu Lokal Anda. Y-Axis Kiri: Permintaan API, Y-Axis Kanan: Bandwidth KB</p>
              </div>

              {/* TIME WINDOW SELECTOR & TOP IPS */}
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <small className="text-muted fw-bold">Jendela Waktu:</small>
                  <select
                    value={timeWindowHours}
                    onChange={(e) => setTimeWindowHours(e.target.value)}
                    className="form-select form-select-sm rounded-pill px-3 fw-bold border-primary text-primary"
                    style={{ width: '150px' }}
                  >
                    <option value="0.5">30 Menit Terakhir</option>
                    <option value="1">1 Jam Terakhir</option>
                    <option value="6">6 Jam Terakhir</option>
                    <option value="24">24 Jam Terakhir</option>
                  </select>
                </div>

                {trafficData.topIPs?.length > 0 && (
                  <div className="d-flex align-items-center gap-1.5 flex-wrap">
                    <small className="text-muted me-1 fw-bold">IP Teraktif:</small>
                    {trafficData.topIPs.map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => setLogFilter({ ...logFilter, ip: item.ip, page: 1 })}
                        className="btn btn-outline-primary btn-sm rounded-pill px-2.5 py-0.5 font-monospace fw-bold"
                        style={{ fontSize: '0.75rem' }}
                        title="Klik untuk memfilter log IP ini"
                      >
                        {item.ip} ({item.count})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ width: '100%', height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formattedTimeSeries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorBw" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="displayTime" stroke="#64748b" style={{ fontSize: '0.78rem' }} />
                  <YAxis yAxisId="req" stroke="#3b82f6" style={{ fontSize: '0.78rem' }} label={{ value: 'Permintaan API', angle: -90, position: 'insideLeft', style: { fill: '#3b82f6', fontSize: '0.75rem' } }} />
                  <YAxis yAxisId="bw" orientation="right" stroke="#10b981" style={{ fontSize: '0.78rem' }} label={{ value: 'Bandwidth (KB)', angle: 90, position: 'insideRight', style: { fill: '#10b981', fontSize: '0.75rem' } }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '0.82rem' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '0.82rem', paddingTop: '10px' }} />
                  <Area yAxisId="req" type="monotone" dataKey="requests" name="Permintaan API" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReq)" />
                  <Area yAxisId="bw" type="monotone" dataKey="bandwidthKB" name="Bandwidth (KB)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBw)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PER-IP REQUEST LOGS EXPLORER TABLE */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div>
                <h5 className="fw-bold text-dark mb-0">Riwayat Log Permintaan API Granular ({totalLogsCount})</h5>
                <small className="text-muted">Jelajahi setiap panggilan API berdasarkan IP Address, HTTP Method, dan HTTP Status Code.</small>
              </div>

              {/* FILTER CONTROLS */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Cari Alamat IP..."
                  value={logFilter.ip}
                  onChange={(e) => setLogFilter({ ...logFilter, ip: e.target.value, page: 1 })}
                  className="form-control form-control-sm rounded-pill px-3 shadow-none font-monospace"
                  style={{ width: '160px' }}
                />

                <select
                  value={logFilter.method}
                  onChange={(e) => setLogFilter({ ...logFilter, method: e.target.value, page: 1 })}
                  className="form-select form-select-sm rounded-pill px-3 shadow-none fw-bold"
                  style={{ width: '120px' }}
                >
                  <option value="">Semua Method</option>
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>

                <select
                  value={logFilter.statusCode}
                  onChange={(e) => setLogFilter({ ...logFilter, statusCode: e.target.value, page: 1 })}
                  className="form-select form-select-sm rounded-pill px-3 shadow-none fw-bold"
                  style={{ width: '130px' }}
                >
                  <option value="">Semua Status</option>
                  <option value="200">200 OK</option>
                  <option value="401">401 Unauthorized</option>
                  <option value="403">403 Forbidden</option>
                  <option value="404">404 Not Found</option>
                  <option value="500">500 Server Error</option>
                </select>

                {logFilter.ip && (
                  <button
                    onClick={() => setLogFilter({ ip: '', method: '', statusCode: '', page: 1 })}
                    className="btn btn-outline-danger btn-sm rounded-pill px-2.5"
                    title="Reset Filter"
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                )}

                <button onClick={fetchTrafficAndLogs} className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-bold">
                  <i className="bi bi-arrow-clockwise me-1"></i>Refresh
                </button>
              </div>
            </div>

            <div className="card-body p-0">
              {loadingLogs ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-info" role="status"></div>
                  <p className="text-muted mt-2 small">Memuat log permintaan API...</p>
                </div>
              ) : apiLogs.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-journal-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                  Tidak ada log permintaan API yang cocok dengan filter.
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr className="small text-uppercase text-muted">
                        <th>Waktu (Lokal)</th>
                        <th>IP Address</th>
                        <th>Metode</th>
                        <th>Endpoint API</th>
                        <th>Status Response</th>
                        <th>Latensi</th>
                        <th>Ukuran Payload</th>
                        <th className="text-end">Aksi Keamanan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiLogs.map((log) => (
                        <tr key={log._id}>
                          <td className="small text-muted font-monospace" style={{ fontSize: '0.78rem' }}>
                            {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td>
                            <button
                              onClick={() => setLogFilter({ ...logFilter, ip: log.ip_address, page: 1 })}
                              className="btn btn-link p-0 text-decoration-none font-monospace fw-bold text-dark small"
                              title="Filter log hanya untuk IP ini"
                            >
                              {log.ip_address}
                            </button>
                          </td>
                          <td>
                            <span className={`badge rounded-pill px-2.5 py-1 font-monospace fw-bold ${getMethodBadgeClass(log.method)}`} style={{ fontSize: '0.72rem' }}>
                              {log.method}
                            </span>
                          </td>
                          <td>
                            <div className="text-truncate font-monospace small text-dark" style={{ maxWidth: '260px' }} title={log.endpoint}>
                              {log.endpoint}
                            </div>
                          </td>
                          <td>
                            <span className={`badge rounded-pill px-2.5 py-1 font-monospace fw-bold ${getStatusBadgeClass(log.status_code)}`} style={{ fontSize: '0.75rem' }}>
                              {log.status_code}
                            </span>
                          </td>
                          <td className="small font-monospace text-muted">
                            {log.response_time_ms} ms
                          </td>
                          <td className="small font-monospace text-muted">
                            {(log.content_length_bytes / 1024).toFixed(1)} KB
                          </td>
                          <td className="text-end">
                            <button
                              onClick={() => openBanModal(log.ip_address)}
                              className="btn btn-outline-danger btn-sm rounded-pill px-2.5 py-1 font-bold"
                              style={{ fontSize: '0.75rem' }}
                            >
                              <i className="bi bi-slash-circle me-1"></i>Blokir IP
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* PAGINATION */}
            {logTotalPages > 1 && (
              <div className="card-footer bg-white border-top py-3 d-flex justify-content-between align-items-center">
                <small className="text-muted">
                  Halaman {logFilter.page} dari {logTotalPages} ({totalLogsCount} total log)
                </small>
                <div className="d-flex gap-2">
                  <button
                    disabled={logFilter.page <= 1}
                    onClick={() => setLogFilter({ ...logFilter, page: logFilter.page - 1 })}
                    className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                  >
                    <i className="bi bi-chevron-left"></i> Sblmnya
                  </button>
                  <button
                    disabled={logFilter.page >= logTotalPages}
                    onClick={() => setLogFilter({ ...logFilter, page: logFilter.page + 1 })}
                    className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                  >
                    Selanjutnya <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BAN MODAL */}
      {showBanModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-danger d-flex align-items-center gap-2">
                  <i className="bi bi-slash-circle fs-4"></i>
                  <span>Pemblokiran Akses IP Address</span>
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowBanModal(false)}></button>
              </div>

              <form onSubmit={handleBanSubmit}>
                <div className="modal-body py-4">

                  {/* IP Address */}
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Alamat IP Target</label>
                    <input
                      type="text"
                      className="form-control rounded-3 font-monospace fw-bold text-danger"
                      placeholder="Contoh: 192.168.1.50"
                      value={banForm.ip_address}
                      onChange={(e) => setBanForm({ ...banForm, ip_address: e.target.value })}
                      required
                    />
                  </div>

                  {/* Reason */}
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Alasan Pemblokiran</label>
                    <textarea
                      className="form-control rounded-3"
                      rows="2"
                      placeholder="Masukkan alasan pemblokiran..."
                      value={banForm.reason}
                      onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  {/* Duration Options */}
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">Durasi Pemblokiran</label>
                    <div className="form-check mb-2">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="permanentCheck"
                        checked={banForm.is_permanent}
                        onChange={(e) => setBanForm({ ...banForm, is_permanent: e.target.checked })}
                      />
                      <label className="form-check-input-label fw-bold text-danger ms-1" htmlFor="permanentCheck">
                        Pemblokiran Permanen (Tanpa Batas Waktu)
                      </label>
                    </div>

                    {!banForm.is_permanent && (
                      <select
                        value={banForm.durationMinutes}
                        onChange={(e) => setBanForm({ ...banForm, durationMinutes: e.target.value })}
                        className="form-select form-select-sm rounded-pill px-3 fw-bold"
                      >
                        <option value="15">15 Menit</option>
                        <option value="60">1 Jam</option>
                        <option value="1440">24 Jam (1 Hari)</option>
                        <option value="4320">3 Hari</option>
                        <option value="10080">7 Hari</option>
                      </select>
                    )}
                  </div>

                  <div className="alert alert-warning small py-2 px-3 rounded-3 mb-0" style={{ fontSize: '0.78rem' }}>
                    <i className="bi bi-shield-exclamation me-1"></i>Sistem secara otomatis mencegah pemblokiran pada IP lokal admin.
                  </div>

                </div>

                <div className="modal-footer border-top-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4 btn-sm fw-bold" onClick={() => setShowBanModal(false)}>
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingBan}
                    className="btn btn-danger rounded-pill px-4 btn-sm fw-bold d-inline-flex align-items-center gap-1"
                  >
                    {submittingBan ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-slash-circle"></i>
                        <span>Terapkan Pemblokiran</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManajemenSesiIP;
