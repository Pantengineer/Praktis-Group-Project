import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import { useForm } from '../../hooks/useForm';

const ManajemenPraktikum = () => {
    const location = useLocation();
    const [labs, setLabs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);

    // Pagination & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Column Filters
    const [filterTahun, setFilterTahun] = useState('');
    const [filterHari, setFilterHari] = useState('');
    const [filterJam, setFilterJam] = useState('');
    const [filterRuangan, setFilterRuangan] = useState('');
    const [filterAsdos, setFilterAsdos] = useState('');

    const safeLabs = Array.isArray(labs) ? labs : [];

    const filteredLabs = safeLabs.filter(lab => {
        if (!lab) return false;
        const asdosNames = (lab.PraktikumUserRoles || []).map(r => r.User?.nama?.toLowerCase() || '').join(' ');
        const searchLower = (searchTerm || '').toLowerCase();

        const matchesSearch = !searchLower ||
            (lab.mata_kuliah && lab.mata_kuliah.toLowerCase().includes(searchLower)) ||
            (lab.kode_kelas && lab.kode_kelas.toLowerCase().includes(searchLower)) ||
            asdosNames.includes(searchLower);

        const parts = lab.jadwal ? lab.jadwal.split(', ') : [];
        const hari = parts[0] || '';
        const jam = parts[1] || '';
        const asdosCount = lab.PraktikumUserRoles ? lab.PraktikumUserRoles.length : 0;

        const matchesTahun = filterTahun === '' || lab.tahun_pelajaran === filterTahun;
        const matchesHari = filterHari === '' || hari === filterHari;
        const matchesJam = filterJam === '' || jam.toLowerCase().includes(filterJam.toLowerCase());
        const matchesRuangan = filterRuangan === '' || lab.ruangan === filterRuangan;
        const matchesAsdos = filterAsdos === '' ||
            (filterAsdos === 'assigned' && asdosCount > 0) ||
            (filterAsdos === 'unassigned' && asdosCount === 0);

        return matchesSearch && matchesTahun && matchesHari && matchesJam && matchesRuangan && matchesAsdos;
    });
    const totalPages = Math.ceil(filteredLabs.length / itemsPerPage);
    const currentLabs = filteredLabs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    // Asdos Assignment States
    const [showAsdosModal, setShowAsdosModal] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [stagedAsdos, setStagedAsdos] = useState([]);

    // Asdos Modal Pagination & Search
    const [asdosSearchTerm, setAsdosSearchTerm] = useState('');
    const [asdosCurrentPage, setAsdosCurrentPage] = useState(1);
    const asdosItemsPerPage = 5;

    const { formData, handleChange, reset } = useForm({
        mata_kuliah: '',
        kode_kelas: 'A',
        tahun_pelajaran: `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`,
        semester: '1',
        sks: '3',
        ruangan: 'Lab B',
        tanggal_mulai: '',
        waktu_mulai: '08:00',
        waktu_selesai: '10:00'
    });

    useEffect(() => {
        fetchLabs();
    }, []);

    const fetchLabs = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/admin/praktikum');
            const data = Array.isArray(res.data) 
                ? res.data 
                : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data?.praktikum) ? res.data.praktikum : []));
            setLabs(data);
        } catch (err) {
            console.error('Error fetching labs:', err);
            setLabs([]);
        } finally {
            setLoading(false);
        }
    };

    const [showSessionModal, setShowSessionModal] = useState(false);
    const [selectedLab, setSelectedLab] = useState(null);
    const [sessions, setSessions] = useState([]);       // Real sessions from API
    const [sessionsLoading, setSessionsLoading] = useState(false);

    // Session CRUD States
    const [sessionForm, setSessionForm] = useState({ sesi_ke: '', tanggal: '', waktu_mulai: '', waktu_selesai: '', ruangan: 'Lab B' });
    const [editingSessionId, setEditingSessionId] = useState(null);

    const fetchAvailableUsers = async () => {
        try {
            const res = await api.get('/api/admin/users');
            const allUsers = Array.isArray(res.data) ? res.data : (res.data.data || []);
            // Filter out users who have 'admin' role, keep those with 'mahasiswa' or 'asdos'
            setAvailableUsers(allUsers.filter(u =>
                u.Roles &&
                !u.Roles.some(r => r.deskripsi === 'admin') &&
                u.Roles.some(r => r.deskripsi === 'mahasiswa' || r.deskripsi === 'asdos')
            ));
        } catch (err) {
            console.error("Error fetching users", err);
        }
    };

    const openAsdosModal = () => {
        setShowAsdosModal(true);
        if (availableUsers.length === 0) fetchAvailableUsers();
    };

    const handleAssignAsdos = async (user) => {
        if (editingId) {
            try {
                await api.post('/api/admin/asdos', { id_praktikum: editingId, id_user: user.id_user });
                setStagedAsdos(prev => [...prev, user]);
            } catch (err) {
                alert(err.response?.data?.message || 'Gagal');
            }
        } else {
            setStagedAsdos(prev => [...prev, user]);
        }
    };

    const handleRemoveAsdos = async (user) => {
        if (editingId) {
            try {
                await api.delete('/api/admin/asdos', { data: { id_praktikum: editingId, id_user: user.id_user } });
                setStagedAsdos(prev => prev.filter(u => u.id_user !== user.id_user));
            } catch (err) {
                alert(err.response?.data?.message || 'Gagal');
            }
        } else {
            setStagedAsdos(prev => prev.filter(u => u.id_user !== user.id_user));
        }
    };

    // 2.4: Fetch REAL sessions from the API when modal is opened
    const handleOpenSession = async (lab, targetSessionId = null) => {
        setSelectedLab(lab);
        setShowSessionModal(true);
        setSessionsLoading(true);
        try {
            const res = await api.get(`/api/content/session/list/${lab.id_praktikum}`);
            const sessionList = Array.isArray(res.data) ? res.data : [];
            setSessions(sessionList);

            if (targetSessionId) {
                const targetSession = sessionList.find(s => String(s.id_pertemuan) === String(targetSessionId));
                if (targetSession) {
                    handleEditSession(targetSession);
                }
            }
        } catch (err) {
            console.error('Error fetching sessions:', err);
            setSessions([]);
        } finally {
            setSessionsLoading(false);
        }
    };

    // Auto-open Session Modal if navigated from Timeline with openSessionClassId
    useEffect(() => {
        if (!loading && labs.length > 0 && location.state?.openSessionClassId) {
            const targetClassId = String(location.state.openSessionClassId);
            const targetSessionId = location.state?.targetSessionId;
            const targetClass = labs.find(c => String(c.id_praktikum) === targetClassId);
            if (targetClass) {
                handleOpenSession(targetClass, targetSessionId);
            }
        }
    }, [loading, labs, location.state]);

    const handleCloseSession = () => {
        setSelectedLab(null);
        setShowSessionModal(false);
        setSessions([]);
        setEditingSessionId(null);
        setSessionForm({ sesi_ke: '', tanggal: '', waktu_mulai: '', waktu_selesai: '', ruangan: 'Lab B' });
    };

    const handleSessionChange = (e) => {
        setSessionForm({ ...sessionForm, [e.target.name]: e.target.value });
    };

    const handleSaveSession = async (e) => {
        e.preventDefault();
        try {
            // If adding new, calculate next sesi_ke if empty
            let sesi_ke = sessionForm.sesi_ke;
            if (!editingSessionId && !sesi_ke) {
                sesi_ke = sessions.length > 0 ? Math.max(...sessions.map(s => s.sesi_ke)) + 1 : 1;
            }

            const payload = { ...sessionForm, sesi_ke, id_praktikum: selectedLab.id_praktikum };

            if (editingSessionId) {
                await api.put(`/api/content/session/${editingSessionId}`, payload);
                alert('Sesi berhasil diupdate');
            } else {
                await api.post('/api/content/session', payload);
                alert('Sesi berhasil ditambahkan');
            }
            // Reset form and reload sessions
            setSessionForm({ sesi_ke: '', tanggal: '', waktu_mulai: '', waktu_selesai: '', ruangan: 'Lab B' });
            setEditingSessionId(null);
            handleOpenSession(selectedLab);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan sesi');
        }
    };

    const handleEditSession = (session) => {
        setEditingSessionId(session.id_pertemuan);
        setSessionForm({
            sesi_ke: session.sesi_ke,
            tanggal: session.tanggal ? session.tanggal.split('T')[0] : '', // format to YYYY-MM-DD
            waktu_mulai: session.waktu_mulai || '',
            waktu_selesai: session.waktu_selesai || '',
            ruangan: session.ruangan || 'Lab B'
        });
    };

    const handleDeleteSession = async (id) => {
        if (window.confirm('Yakin hapus sesi ini? Data materi dan tugas di dalamnya akan ikut terhapus.')) {
            try {
                await api.delete(`/api/content/session/${id}`);
                handleOpenSession(selectedLab);
            } catch (err) {
                alert('Gagal menghapus sesi');
            }
        }
    };

    const handleCancelSessionEdit = () => {
        setEditingSessionId(null);
        setSessionForm({ sesi_ke: '', tanggal: '', waktu_mulai: '', waktu_selesai: '', ruangan: 'Lab B' });
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/api/admin/praktikum/${editingId}`, formData);
                alert('Praktikum berhasil diupdate.');
            } else {
                const res = await api.post('/api/admin/praktikum', formData);
                const newClassId = res.data?.data?.id_praktikum;

                // Batch assign stagedAsdos
                if (newClassId && stagedAsdos.length > 0) {
                    for (const asdos of stagedAsdos) {
                        try {
                            await api.post('/api/admin/asdos', {
                                id_praktikum: newClassId,
                                id_user: asdos.id_user
                            });
                        } catch (err) {
                            console.error("Failed to assign asdos", asdos.id_user);
                        }
                    }
                }
                alert('Praktikum berhasil dibuat! 10 sesi telah digenerate dan Asdos ditugaskan.');
            }
            fetchLabs();
            setEditingId(null);
            reset();
            setStagedAsdos([]);
        } catch (err) {
            alert(err.response?.data?.message || 'Gagal menyimpan praktikum');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Hapus praktikum ini? Data yang terkait (Asdos/Nilai/Sesi) akan hilang.')) {
            try {
                await api.delete(`/api/admin/praktikum/${id}`);
                fetchLabs();
            } catch (err) {
                alert('Gagal menghapus');
            }
        }
    };

    const handleEdit = async (lab) => {
        setEditingId(lab.id_praktikum);

        handleChange({ target: { name: 'mata_kuliah', value: lab.mata_kuliah } });
        handleChange({ target: { name: 'kode_kelas', value: lab.kode_kelas } });
        handleChange({ target: { name: 'tahun_pelajaran', value: lab.tahun_pelajaran } });
        handleChange({ target: { name: 'semester', value: lab.semester || 1 } });
        handleChange({ target: { name: 'ruangan', value: lab.ruangan } });

        // Fetch the real date and time from the first session
        try {
            const res = await api.get(`/api/content/session/list/${lab.id_praktikum}`);
            const labSessions = Array.isArray(res.data) ? res.data : (res.data.data || []);
            if (labSessions.length > 0) {
                const firstSession = labSessions.find(s => s.sesi_ke === 1) || labSessions[0];
                if (firstSession.tanggal) {
                    handleChange({ target: { name: 'tanggal_mulai', value: firstSession.tanggal.split('T')[0] } });
                }
                if (firstSession.waktu_mulai) {
                    handleChange({ target: { name: 'waktu_mulai', value: firstSession.waktu_mulai } });
                }
                if (firstSession.waktu_selesai) {
                    handleChange({ target: { name: 'waktu_selesai', value: firstSession.waktu_selesai } });
                }
            }

            // Fetch existing Asdos
            const asdosRes = await api.get(`/api/admin/asdos?id_praktikum=${lab.id_praktikum}`);
            setStagedAsdos(asdosRes.data.map(a => a.User));
        } catch (err) {
            console.error('Error fetching data for edit:', err);
        }
    };
    return (
        <div className="container-fluid p-4">
            <h3 className="fw-bold mb-4">Manajemen Praktikum</h3>

            {/* 1. INPUT FORM */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white py-3 d-flex align-items-center">
                    <h5 className="fw-bold mb-0 me-3">{editingId ? "Edit Kelas" : "Buat Kelas Baru"}</h5>
                    {!editingId && (
                        <span className="text-muted small mb-0" style={{ opacity: 0.7 }}>
                            <i className="bi bi-info-circle me-1"></i>Sistem akan otomatis generate 10 sesi.
                        </span>
                    )}
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="p-3 bg-light rounded-3 mb-3">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h6 className="small fw-bold text-dark mb-0"><i className="bi bi-journal-plus me-2"></i>Informasi & Konfigurasi Jadwal</h6>
                                <button type="button" className="btn btn-sm btn-outline-primary" onClick={openAsdosModal}>
                                    <i className="bi bi-person-badge me-1"></i> Tugaskan Asdos
                                    {stagedAsdos.length > 0 && <span className="badge bg-primary ms-2">{stagedAsdos.length}</span>}
                                </button>
                            </div>

                            {/* ROW 1: Basic Info */}
                            <div className="row g-3 mb-3">
                                <div className="col-md-4">
                                    <label className="form-label small text-muted fw-bold">Mata Kuliah</label>
                                    <input type="text" className="form-control" placeholder="Ex: Pemrograman Web" required
                                        name="mata_kuliah" value={formData.mata_kuliah} onChange={handleChange} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small text-muted fw-bold">Kode Kelas</label>
                                    <input type="text" className="form-control" placeholder="Ex: A, B" required
                                        name="kode_kelas" value={formData.kode_kelas} onChange={handleChange} />
                                </div>

                                <div className="col-md-2">
                                    <label className="form-label small text-muted fw-bold">Tahun Ajar</label>
                                    <select className="form-select" name="tahun_pelajaran" value={formData.tahun_pelajaran} onChange={handleChange} required>
                                        <option value="" disabled>Pilih Tahun Ajar</option>
                                        {Array.from({ length: new Date().getFullYear() - 2010 + 1 }, (_, i) => {
                                            const y = new Date().getFullYear() - i;
                                            const value = `${y - 1}/${y}`;
                                            return <option key={value} value={value}>{value}</option>;
                                        })}
                                    </select>
                                </div>

                                <div className="col-md-1">
                                    <label className="form-label small text-muted fw-bold">Smt</label>
                                    <input type="number" className="form-control" required
                                        name="semester" value={formData.semester} onChange={handleChange} />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small text-muted fw-bold">Ruangan</label>
                                    <select className="form-select" name="ruangan" value={formData.ruangan} onChange={handleChange}>
                                        <option value="Lab B">Lab B</option>
                                        <option value="Lab C">Lab C</option>
                                        <option value="Lab D">Lab D</option>
                                        <option value="Lab Cisco">Lab Cisco</option>
                                        <option value="Online">Online</option>
                                    </select>
                                </div>
                            </div>

                            {/* ROW 2: Scheduling */}
                            <div className="row g-3 align-items-end mt-2 pt-3 border-top">
                                <div className="col-md-3">
                                    <label className="form-label small text-muted">Tanggal Mulai (Sesi 1)</label>
                                    <input type="date" className="form-control" required
                                        name="tanggal_mulai" value={formData.tanggal_mulai} onChange={handleChange} />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small text-muted">Jam Mulai</label>
                                    <input type="time" className="form-control" required
                                        name="waktu_mulai" value={formData.waktu_mulai} onChange={handleChange} />
                                </div>

                                <div className="col-md-3">
                                    <label className="form-label small text-muted">Jam Selesai</label>
                                    <input type="time" className="form-control" required
                                        name="waktu_selesai" value={formData.waktu_selesai} onChange={handleChange} />
                                </div>

                                <div className="col-md-3">
                                    <div className="d-flex gap-2 w-100">
                                        {editingId && (
                                            <button type="button" className="btn btn-secondary w-50" onClick={() => { setEditingId(null); reset(); setStagedAsdos([]); }}>
                                                Batal
                                            </button>
                                        )}
                                        <button type="submit" className={`btn btn-primary ${editingId ? 'w-50' : 'w-100'}`}>
                                            {editingId ? "Update" : "Generate"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Button Daftar Mahasiswa (Visible only when editing) */}
                        {editingId && (
                            <Link 
                                to={`/admin/praktikum/${editingId}/mahasiswa`} 
                                className="btn btn-outline-success w-100 fw-bold mt-2"
                            >
                                <i className="bi bi-people me-2"></i> Daftar Mahasiswa
                            </Link>
                        )}
                    </form>
                </div>
            </div>

            {/* 2. DATA TABLE */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold">Daftar Kelas Praktikum</h6>
                    <div className="input-group input-group-sm" style={{ width: '250px' }}>
                        <span className="input-group-text bg-light border-end-0"><i className="bi bi-search"></i></span>
                        <input type="text" className="form-control border-start-0 bg-light" placeholder="Cari mata kuliah..."
                            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                    </div>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Mata Kuliah</th>
                                    <th>Kelas</th>
                                    <th>
                                        <div className="mb-1">Tahun</div>
                                        <select className="form-select form-select-sm" value={filterTahun} onChange={e => { setFilterTahun(e.target.value); setCurrentPage(1); }}>
                                            <option value="">Semua</option>
                                            {[...new Set(labs.map(l => l.tahun_pelajaran))].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </th>
                                    <th>
                                        <div className="mb-1">Hari</div>
                                        <select className="form-select form-select-sm" value={filterHari} onChange={e => { setFilterHari(e.target.value); setCurrentPage(1); }}>
                                            <option value="">Semua</option>
                                            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map(h => <option key={h} value={h}>{h}</option>)}
                                        </select>
                                    </th>
                                    <th>
                                        <div className="mb-1">Jam</div>
                                        <input type="text" className="form-control form-control-sm" placeholder="Ex: 08:00" value={filterJam} onChange={e => { setFilterJam(e.target.value); setCurrentPage(1); }} />
                                    </th>
                                    <th>
                                        <div className="mb-1">Ruangan</div>
                                        <select className="form-select form-select-sm" value={filterRuangan} onChange={e => { setFilterRuangan(e.target.value); setCurrentPage(1); }}>
                                            <option value="">Semua</option>
                                            {[...new Set(labs.map(l => l.ruangan))].map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </th>
                                    <th>
                                        <div className="mb-1">Asdos</div>
                                        <select className="form-select form-select-sm" value={filterAsdos} onChange={e => { setFilterAsdos(e.target.value); setCurrentPage(1); }}>
                                            <option value="">Semua</option>
                                            <option value="assigned">Terisi</option>
                                            <option value="unassigned">Kosong</option>
                                        </select>
                                    </th>
                                    <th>Mahasiswa</th>
                                    <th className="text-center align-middle">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="9" className="text-center py-4">Loading data...</td></tr>
                                ) : (() => {
                                    if (filteredLabs.length === 0) {
                                        return <tr><td colSpan="9" className="text-center text-muted py-4">Tidak ada data ditemukan.</td></tr>;
                                    }

                                    return currentLabs.map(lab => {
                                        const parts = lab.jadwal ? lab.jadwal.split(', ') : [];
                                        const hari = parts[0] || '-';
                                        const jam = parts[1] || '-';
                                        return (
                                            <tr key={lab.id_praktikum}>
                                                <td className="fw-bold">{lab.mata_kuliah}</td>
                                                <td><span className="badge bg-primary bg-opacity-10 text-primary">{lab.kode_kelas || lab.kelas || '-'}</span></td>
                                                <td>{lab.tahun_pelajaran}</td>
                                                <td>{hari}</td>
                                                <td>{jam}</td>
                                                <td>{lab.ruangan}</td>
                                                <td>
                                                    {lab.PraktikumUserRoles && lab.PraktikumUserRoles.length > 0 ? (
                                                        lab.PraktikumUserRoles.map(pur => (
                                                            <div key={pur.User?.id_user} className="small text-muted mb-1">
                                                                <i className="bi bi-person-fill me-1"></i>{pur.User?.nama || '-'}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <span className="small text-muted fst-italic">Belum ada</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="badge bg-success">{lab.studentCount || 0} Mahasiswa</span>
                                                </td>
                                                <td className="text-center">

                                                    {/* Kelola Session */}
                                                    <button
                                                        className="btn btn-outline-info btn-sm me-2"
                                                        title="Kelola Session"
                                                        onClick={() => handleOpenSession(lab)}
                                                    >
                                                        <i className="bi bi-calendar-week"></i>
                                                    </button>

                                                    {/* Edit Kelas */}
                                                    <button
                                                        className="btn btn-outline-primary btn-sm me-2"
                                                        title="Edit Kelas"
                                                        onClick={() => handleEdit(lab)}
                                                    >
                                                        <i className="bi bi-gear"></i>
                                                    </button>

                                                    {/* Hapus */}
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        title="Hapus Kelas"
                                                        onClick={() => handleDelete(lab.id_praktikum)}
                                                    >
                                                        <i className="bi bi-trash"></i>
                                                    </button>

                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination Controls */}
                {!loading && labs.length > 0 && (
                    <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
                        <span className="text-muted small">
                            Menampilkan {currentLabs.length} dari {filteredLabs.length} kelas
                        </span>
                        <div className="btn-group">
                            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Prev</button>
                            <button className="btn btn-sm btn-outline-secondary" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)}>Next</button>
                        </div>
                    </div>
                )}
            </div>
            {showSessionModal && (
                <div
                    className="modal fade show"
                    style={{ display: "block", background: "rgba(0,0,0,.5)" }}
                >
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">

                            <div className="modal-header">
                                <h5 className="modal-title fw-bold">
                                    <i className="bi bi-calendar-week me-2"></i>
                                    Dynamic Session Management
                                </h5>

                                <button
                                    className="btn-close"
                                    onClick={handleCloseSession}
                                />
                            </div>

                            <div className="modal-body">

                                <div className="mb-4">
                                    <h4 className="fw-bold mb-1">
                                        {selectedLab?.mata_kuliah}
                                    </h4>
                                    <div className="text-muted">
                                        Kelas {selectedLab?.kode_kelas || selectedLab?.kelas || '-'}
                                    </div>
                                </div>

                                {/* INLINE FORM */}
                                <div className="card bg-light border-0 mb-4">
                                    <div className="card-body">
                                        <h6 className="fw-bold mb-3">{editingSessionId ? "Edit Sesi" : "Tambah Sesi Baru"}</h6>
                                        <form onSubmit={handleSaveSession}>
                                            <div className="row g-2 mb-2">
                                                <div className="col-md-2">
                                                    <label className="form-label small">Sesi Ke</label>
                                                    <input type="number" className="form-control form-control-sm" name="sesi_ke"
                                                        value={sessionForm.sesi_ke}
                                                        placeholder={sessions.length > 0 && !editingSessionId ? `${Math.max(...sessions.map(s => s.sesi_ke)) + 1}` : "1"}
                                                        onChange={handleSessionChange} />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label small">Tanggal</label>
                                                    <input type="date" className="form-control form-control-sm" name="tanggal"
                                                        value={sessionForm.tanggal} onChange={handleSessionChange} required />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="form-label small">Waktu Mulai</label>
                                                    <input type="time" className="form-control form-control-sm" name="waktu_mulai"
                                                        value={sessionForm.waktu_mulai} onChange={handleSessionChange} required />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="form-label small">Waktu Selesai</label>
                                                    <input type="time" className="form-control form-control-sm" name="waktu_selesai"
                                                        value={sessionForm.waktu_selesai} onChange={handleSessionChange} required />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="form-label small">Ruangan</label>
                                                    <select className="form-select form-select-sm" name="ruangan"
                                                        value={sessionForm.ruangan} onChange={handleSessionChange}>
                                                        <option value="Lab B">Lab B</option>
                                                        <option value="Lab C">Lab C</option>
                                                        <option value="Lab D">Lab D</option>
                                                        <option value="Lab Cisco">Lab Cisco</option>
                                                        <option value="Online">Online</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="d-flex justify-content-end gap-2 mt-3">
                                                {editingSessionId && (
                                                    <button type="button" className="btn btn-sm btn-secondary" onClick={handleCancelSessionEdit}>Batal</button>
                                                )}
                                                <button type="submit" className="btn btn-sm btn-primary">
                                                    {editingSessionId ? "Simpan Perubahan" : "Tambah Sesi"}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                <div className="list-group">
                                    {sessionsLoading ? (
                                        <div className="text-center py-4 text-muted">
                                            <div className="spinner-border spinner-border-sm me-2"></div>Memuat sesi...
                                        </div>
                                    ) : sessions.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            <i className="bi bi-calendar-x fs-3 d-block mb-2"></i>
                                            Belum ada sesi untuk kelas ini.
                                        </div>
                                    ) : (
                                        sessions.map((session) => (
                                            <div
                                                key={session.id_pertemuan}
                                                className="list-group-item mb-2 rounded shadow-sm"
                                            >
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h6 className="fw-bold mb-0">Sesi {session.sesi_ke}</h6>
                                                        <small className="text-muted">
                                                            {session.tanggal
                                                                ? new Date(session.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                                                                : '-'}
                                                            <br />
                                                            {session.waktu_mulai} &ndash; {session.waktu_selesai}
                                                        </small>
                                                    </div>
                                                    <div>
                                                        <span className="badge bg-light text-dark border me-3">
                                                            <i className="bi bi-geo-alt me-1"></i>
                                                            {session.ruangan || 'Belum diatur'}
                                                        </span>
                                                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEditSession(session)} title="Edit">
                                                            <i className="bi bi-pencil"></i>
                                                        </button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteSession(session.id_pertemuan)} title="Hapus">
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                </div>

                            </div>

                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={handleCloseSession}>
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAsdosModal && (
                <div className="modal fade show" style={{ display: "block", background: "rgba(0,0,0,.5)" }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title fw-bold"><i className="bi bi-person-badge me-2"></i>Tugaskan Asdos</h5>
                                <button className="btn-close" onClick={() => setShowAsdosModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                {/* Selected Asdos */}
                                <div className="mb-4">
                                    <h6 className="fw-bold mb-3">Asdos Terpilih</h6>
                                    {stagedAsdos.length === 0 ? (
                                        <div className="text-muted small">Belum ada asdos yang ditugaskan.</div>
                                    ) : (
                                        <ul className="list-group">
                                            {stagedAsdos.map(a => (
                                                <li key={a.id_user} className="list-group-item d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <span className="fw-bold">{a.nama}</span> <br />
                                                        <small className="text-muted">{a.nim}</small>
                                                    </div>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleRemoveAsdos(a)}>Hapus</button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* Available Users */}
                                <div>
                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0">Daftar Pengguna</h6>
                                        <input type="text" className="form-control form-control-sm w-50" placeholder="Cari nama atau NIM..."
                                            value={asdosSearchTerm} onChange={(e) => { setAsdosSearchTerm(e.target.value); setAsdosCurrentPage(1); }} />
                                    </div>

                                    {(() => {
                                        const filtered = availableUsers.filter(u =>
                                            (u.nama && u.nama.toLowerCase().includes(asdosSearchTerm.toLowerCase())) ||
                                            (u.nim && u.nim.toLowerCase().includes(asdosSearchTerm.toLowerCase()))
                                        );
                                        const totalAsdosPages = Math.ceil(filtered.length / asdosItemsPerPage);
                                        const currentList = filtered.slice((asdosCurrentPage - 1) * asdosItemsPerPage, asdosCurrentPage * asdosItemsPerPage);

                                        return (
                                            <>
                                                <ul className="list-group mb-2">
                                                    {currentList.map(u => {
                                                        const isAssigned = stagedAsdos.some(s => s.id_user === u.id_user);
                                                        return (
                                                            <li key={u.id_user} className="list-group-item d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <span className="fw-bold">{u.nama}</span>
                                                                    <span className="badge bg-secondary ms-2">
                                                                        {u.Roles?.map(r => r.deskripsi).join(', ')}
                                                                    </span><br />
                                                                    <small className="text-muted">{u.nim}</small>
                                                                </div>
                                                                <button
                                                                    className={`btn btn-sm ${isAssigned ? 'btn-success' : 'btn-outline-primary'}`}
                                                                    disabled={isAssigned}
                                                                    onClick={() => handleAssignAsdos(u)}
                                                                >
                                                                    {isAssigned ? 'Ditugaskan' : 'Tugaskan'}
                                                                </button>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                                <div className="d-flex justify-content-between align-items-center mt-2">
                                                    <small className="text-muted">Hal {asdosCurrentPage} dari {totalAsdosPages || 1}</small>
                                                    <div className="btn-group">
                                                        <button className="btn btn-sm btn-outline-secondary" disabled={asdosCurrentPage === 1} onClick={() => setAsdosCurrentPage(p => p - 1)}>Prev</button>
                                                        <button className="btn btn-sm btn-outline-secondary" disabled={asdosCurrentPage === totalAsdosPages || totalAsdosPages === 0} onClick={() => setAsdosCurrentPage(p => p + 1)}>Next</button>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={() => setShowAsdosModal(false)}>Selesai</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManajemenPraktikum;