import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/authContext';
import { motion } from 'framer-motion';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: authUser } = useAuth();

    const getDashboardLink = () => {
        const roles = authUser?.roles || [];
        if (roles.includes('admin')) return '/admin/dashboard';
        if (roles.includes('asdos')) return '/asdos/dashboard';
        return '/mahasiswa/dashboard';
    };

    // Data State
    const [profile, setProfile] = useState(null);
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        nama: '',
        email: '',
        prodi: '',
        angkatan: '',
        nim: ''
    });

    // Permissions & Theme Check
    const isViewingOther = id && parseInt(id) !== authUser?.id;
    const isSelf = !isViewingOther;
    const isAdmin = Array.isArray(authUser?.roles) && authUser.roles.includes('admin');
    
    // Asdos & Mahasiswa use the glass theme; Admin uses the clean light theme
    const isGlassTheme = !isAdmin;

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const endpoint = isViewingOther ? `/api/admin/users/${id}` : '/api/users/profile';
            const res = await api.get(endpoint);

            let userData = {};

            if (res.data.user) {
                userData = res.data.user;
                setClasses(res.data.classes || []);
            } else {
                userData = res.data;
                setClasses(res.data.classes || []);
            }

            setProfile(userData);

            // Initialize Edit Form
            setEditForm({
                nama: userData.nama || '',
                email: userData.email || '',
                prodi: userData.prodi || '',
                angkatan: userData.angkatan || '',
                nim: userData.nim || ''
            });

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        try {
            if (isViewingOther) {
                await api.put(`/api/admin/users/${profile.id_user}`, editForm);
            } else {
                await api.put('/api/users/profile', editForm);
            }
            alert("Profil berhasil diperbarui!");
            setIsEditing(false);
            fetchProfile();
        } catch (err) {
            alert(err.response?.data?.message || "Gagal update profile");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) {
        return (
            <div className={`text-center py-5 ${isGlassTheme ? 'text-light' : 'text-primary'}`}>
                <div className={`spinner-border ${isGlassTheme ? 'text-light' : 'text-primary'}`} role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
                <p className={`${isGlassTheme ? 'opacity-75' : 'text-muted'} mt-3`}>Memuat profil user...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className={isGlassTheme ? "glass-card static rounded-4 p-4 text-white text-center" : "alert alert-danger"}>
                User tidak ditemukan
            </div>
        );
    }

    // =========================================================================
    // RENDER: GLASS THEME FOR ASDOS & MAHASISWA
    // =========================================================================
    if (isGlassTheme) {
        return (
            <div className="container-fluid p-0">
                {/* TOP BACK BUTTON */}
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <button 
                        onClick={() => navigate(getDashboardLink())} 
                        className="btn btn-outline-light btn-sm rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-2 border-opacity-50"
                        style={{ fontSize: '0.85rem' }}
                    >
                        <i className="bi bi-arrow-left"></i>
                        <span>Kembali ke Dashboard</span>
                    </button>
                </div>

                {/* HEADER HERO PROFILE CARD */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="glass-card static rounded-4 p-4 mb-4 text-center position-relative overflow-hidden">
                    <div className="d-flex justify-content-center mb-3">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nama)}&background=0d6efd&color=ffffff&size=128`}
                            className="rounded-circle border border-4 border-light border-opacity-50 shadow-lg"
                            alt="Profile Avatar"
                            width="110"
                            height="110"
                        />
                    </div>
                    <h3 className="fw-bold text-white mb-1">{profile.nama}</h3>
                    <p className="text-light opacity-75 small mb-3">{profile.email}</p>

                    <div className="d-flex justify-content-center gap-2 flex-wrap">
                        {profile.nim && (
                            <span className="badge border border-light text-light px-3 py-2 rounded-pill" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                <i className="bi bi-card-heading me-1"></i>NIM: {profile.nim}
                            </span>
                        )}
                        {profile.prodi && (
                            <span className="badge border border-light text-light px-3 py-2 rounded-pill" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                <i className="bi bi-mortarboard me-1"></i>{profile.prodi}
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* DETAILS & CLASSES GRID */}
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="row g-4">
                    {/* LEFT COLUMN: Profile Details */}
                    <motion.div variants={itemVariants} className="col-lg-5">
                        <div className="glass-card rounded-4 h-100 p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-light border-opacity-10">
                                <h5 className="mb-0 fw-bold text-white d-flex align-items-center">
                                    <i className="bi bi-person-lines-fill me-2 text-info"></i>Informasi Akun
                                </h5>
                                {isSelf && !isEditing && (
                                    <button onClick={() => setIsEditing(true)} className="btn btn-sm btn-outline-light rounded-pill px-3 fw-bold">
                                        <i className="bi bi-pencil-square me-1"></i>Edit
                                    </button>
                                )}
                            </div>

                            {isEditing ? (
                                /* === EDIT FORM (GLASS THEME) === */
                                <form onSubmit={handleSaveProfile}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-light opacity-75">Nama Lengkap</label>
                                        <input type="text" name="nama" className="form-control bg-dark text-white border-light border-opacity-25 rounded-3" value={editForm.nama} onChange={handleEditChange} required />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label small fw-bold text-light opacity-75">NIM</label>
                                            <input type="text" name="nim" className="form-control bg-dark text-white border-light border-opacity-25 rounded-3" value={editForm.nim} onChange={handleEditChange} />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label small fw-bold text-light opacity-75">Angkatan</label>
                                            <input type="number" name="angkatan" className="form-control bg-dark text-white border-light border-opacity-25 rounded-3" value={editForm.angkatan} onChange={handleEditChange} min="2010" max={new Date().getFullYear()} step="1" />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-light opacity-75">Program Studi</label>
                                        <select name="prodi" className="form-select bg-dark text-white border-light border-opacity-25 rounded-3" value={editForm.prodi} onChange={handleEditChange} style={{ colorScheme: 'dark' }}>
                                            <option value="">Pilih Program Studi</option>
                                            <option value="Informatika">Informatika</option>
                                            <option value="Sistem Informasi">Sistem Informasi</option>
                                            <option value="Teknik Industri">Teknik Industri</option>
                                            <option value="Teknik Sipil">Teknik Sipil</option>
                                            <option value="Ilmu & Teknologi Pangan">Ilmu & Teknologi Pangan</option>
                                            <option value="Teknik Lingkungan">Teknik Lingkungan</option>
                                            <option value="Manajemen">Manajemen</option>
                                            <option value="Akuntansi">Akuntansi</option>
                                            <option value="Hubungan Internasional">Hubungan Internasional</option>
                                            <option value="Public Policy">Public Policy</option>
                                            <option value="Ilmu Komunikasi">Ilmu Komunikasi</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-light opacity-75">Email</label>
                                        <input type="email" name="email" className="form-control bg-dark text-white border-light border-opacity-25 rounded-3" value={editForm.email} onChange={handleEditChange} required />
                                    </div>

                                    <div className="d-flex gap-2 justify-content-end pt-2">
                                        <button type="button" onClick={() => setIsEditing(false)} className="btn btn-light rounded-pill px-4 fw-bold">Batal</button>
                                        <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold">Simpan Perubahan</button>
                                    </div>
                                </form>
                            ) : (
                                /* === VIEW MODE (GLASS THEME) === */
                                <div className="d-flex flex-column gap-3 text-white">
                                    <div className="d-flex justify-content-between border-bottom border-light border-opacity-10 pb-2">
                                        <span className="text-light opacity-75 small">Nama Lengkap</span>
                                        <span className="fw-bold text-end">{profile.nama}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-bottom border-light border-opacity-10 pb-2">
                                        <span className="text-light opacity-75 small">NIM</span>
                                        <span className="fw-bold">{profile.nim || '-'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-bottom border-light border-opacity-10 pb-2">
                                        <span className="text-light opacity-75 small">Email</span>
                                        <span className="fw-bold">{profile.email}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-bottom border-light border-opacity-10 pb-2">
                                        <span className="text-light opacity-75 small">Prodi</span>
                                        <span className="fw-bold">{profile.prodi || '-'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-bottom border-light border-opacity-10 pb-2">
                                        <span className="text-light opacity-75 small">Angkatan</span>
                                        <span className="fw-bold">{profile.angkatan || '-'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-light opacity-75 small">Bergabung Sejak</span>
                                        <span className="fw-bold">{new Date(profile.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* RIGHT COLUMN: Classes */}
                    <motion.div variants={itemVariants} className="col-lg-7">
                        <div className="glass-card rounded-4 h-100 p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom border-light border-opacity-10">
                                <h5 className="mb-0 fw-bold text-white d-flex align-items-center">
                                    <i className="bi bi-journal-bookmark-fill me-2 text-warning"></i>Kelas Praktikum
                                </h5>
                                <span className="badge border border-light text-light px-3 py-1.5 rounded-pill small" style={{ background: 'rgba(255,255,255,0.1)' }}>
                                    Total {classes.length} Kelas
                                </span>
                            </div>

                            {classes.length === 0 ? (
                                <div className="text-center py-5 text-light opacity-50">
                                    <i className="bi bi-journal-x fs-1 opacity-50 mb-2 d-block"></i>
                                    User ini belum terdaftar di kelas manapun.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-dark table-hover align-middle mb-0 bg-transparent">
                                        <thead>
                                            <tr className="border-bottom border-light border-opacity-10 text-uppercase tracking-wider small text-light opacity-75">
                                                <th className="py-3 bg-transparent">Mata Kuliah</th>
                                                <th className="py-3 bg-transparent">Role</th>
                                                <th className="py-3 text-end bg-transparent">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classes.map((cls, idx) => (
                                                <tr key={idx} className="border-bottom border-light border-opacity-10">
                                                    <td className="bg-transparent">
                                                        <div className="fw-bold text-white">{cls.nama_praktikum}</div>
                                                        <small className="text-light opacity-50">
                                                            Kelas {cls.kode_kelas} &bull; {cls.tahun}
                                                        </small>
                                                    </td>
                                                    <td className="bg-transparent">
                                                        <span className={`badge rounded-pill px-3 py-1.5 ${cls.role === 'asdos' ? 'bg-danger bg-opacity-25 text-white border border-danger' : 'bg-primary bg-opacity-25 text-white border border-primary'}`}>
                                                            {cls.role}
                                                        </span>
                                                    </td>
                                                    <td className="text-end bg-transparent">
                                                        <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-25 px-3 py-1.5 rounded-pill">Aktif</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        );
    }

    // =========================================================================
    // RENDER: CLEAN LIGHT THEME FOR ADMIN
    // =========================================================================
    return (
        <div className="container-fluid p-4">
            {/* TOP BACK BUTTON */}
            <div className="d-flex align-items-center justify-content-between mb-3">
                <button 
                    onClick={() => navigate(getDashboardLink())} 
                    className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-2"
                    style={{ fontSize: '0.85rem' }}
                >
                    <i className="bi bi-arrow-left"></i>
                    <span>Kembali ke Dashboard</span>
                </button>
            </div>

            {/* HEADER SECTION */}
            <div className="card shadow-sm border-0 rounded-4 overflow-hidden mb-4">
                <div className="bg-primary bg-gradient p-5 text-center text-white" style={{ minHeight: '160px' }}>
                </div>
                <div className="card-body text-center position-relative" style={{ marginTop: '-80px' }}>
                    <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nama)}&background=random&size=128`}
                        className="rounded-circle border border-4 border-white shadow"
                        alt="Profile"
                        width="128"
                        height="128"
                    />
                    <h3 className="fw-bold mt-3 mb-1">{profile.nama}</h3>
                    <p className="text-muted mb-3">{profile.email}</p>

                    <div className="d-flex justify-content-center gap-2">
                        {profile.nim && <span className="badge bg-light text-dark border px-3 py-2">{profile.nim}</span>}
                        {profile.prodi && <span className="badge bg-light text-dark border px-3 py-2">{profile.prodi}</span>}
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* LEFT COLUMN: Profile Details */}
                <div className="col-lg-5">
                    <div className="card shadow-sm border-0 rounded-4 h-100">
                        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0 fw-bold">Informasi Akun</h5>
                            {isSelf && !isEditing && (
                                <button onClick={() => setIsEditing(true)} className="btn btn-sm btn-outline-primary fw-bold">
                                    <i className="bi bi-pencil-square me-2"></i>Edit
                                </button>
                            )}
                        </div>
                        <div className="card-body p-4">
                            {isEditing ? (
                                <form onSubmit={handleSaveProfile}>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Nama Lengkap</label>
                                        <input type="text" name="nama" className="form-control" value={editForm.nama} onChange={handleEditChange} required />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label small fw-bold text-muted">NIM</label>
                                            <input type="text" name="nim" className="form-control" value={editForm.nim} onChange={handleEditChange} />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label small fw-bold text-muted">Angkatan</label>
                                            <input type="number" name="angkatan" className="form-control" value={editForm.angkatan} onChange={handleEditChange} min="2010" max={new Date().getFullYear()} step="1" />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label small fw-bold text-muted">Program Studi</label>
                                        <select name="prodi" className="form-select" value={editForm.prodi} onChange={handleEditChange}>
                                            <option value="">Pilih Program Studi</option>
                                            <option value="Informatika">Informatika</option>
                                            <option value="Sistem Informasi">Sistem Informasi</option>
                                            <option value="Teknik Industri">Teknik Industri</option>
                                            <option value="Teknik Sipil">Teknik Sipil</option>
                                            <option value="Ilmu & Teknologi Pangan">Ilmu & Teknologi Pangan</option>
                                            <option value="Teknik Lingkungan">Teknik Lingkungan</option>
                                            <option value="Manajemen">Manajemen</option>
                                            <option value="Akuntansi">Akuntansi</option>
                                            <option value="Hubungan Internasional">Hubungan Internasional</option>
                                            <option value="Public Policy">Public Policy</option>
                                            <option value="Ilmu Komunikasi">Ilmu Komunikasi</option>
                                            <option value="Lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label small fw-bold text-muted">Email</label>
                                        <input type="email" name="email" className="form-control" value={editForm.email} onChange={handleEditChange} required />
                                    </div>

                                    <div className="d-flex gap-2 justify-content-end">
                                        <button type="button" onClick={() => setIsEditing(false)} className="btn btn-light">Batal</button>
                                        <button type="submit" className="btn btn-primary fw-bold">Simpan Perubahan</button>
                                    </div>
                                </form>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    <div className="d-flex justify-content-between border-bottom pb-2">
                                        <span className="text-muted">Nama Lengkap</span>
                                        <span className="fw-bold text-end">{profile.nama}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-bottom pb-2">
                                        <span className="text-muted">NIM</span>
                                        <span className="fw-bold">{profile.nim || '-'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-bottom pb-2">
                                        <span className="text-muted">Email</span>
                                        <span className="fw-bold">{profile.email}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-bottom pb-2">
                                        <span className="text-muted">Prodi</span>
                                        <span className="fw-bold">{profile.prodi || '-'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between border-bottom pb-2">
                                        <span className="text-muted">Angkatan</span>
                                        <span className="fw-bold">{profile.angkatan || '-'}</span>
                                    </div>
                                    <div className="d-flex justify-content-between">
                                        <span className="text-muted">Bergabung Sejak</span>
                                        <span className="fw-bold">{new Date(profile.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Classes */}
                <div className="col-lg-7">
                    <div className="card shadow-sm border-0 rounded-4 h-100">
                        <div className="card-header bg-white py-3">
                            <h5 className="mb-0 fw-bold">Kelas Praktikum</h5>
                        </div>
                        <div className="card-body p-0">
                            {classes.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-journal-x fs-1 opacity-25 mb-2 d-block"></i>
                                    User ini belum terdaftar di kelas manapun.
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light small text-uppercase">
                                            <tr>
                                                <th className="ps-4 py-3">Mata Kuliah</th>
                                                <th className="py-3">Role</th>
                                                <th className="py-3 text-end pe-4">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classes.map((cls, idx) => (
                                                <tr key={idx}>
                                                    <td className="ps-4">
                                                        <div className="fw-bold text-dark">{cls.nama_praktikum}</div>
                                                        <small className="text-muted">
                                                            Kelas {cls.kode_kelas} &bull; {cls.tahun}
                                                        </small>
                                                    </td>
                                                    <td>
                                                        <span className={`badge rounded-pill ${cls.role === 'asdos' ? 'bg-danger bg-opacity-10 text-danger' : 'bg-primary bg-opacity-10 text-primary'}`}>
                                                            {cls.role}
                                                        </span>
                                                    </td>
                                                    <td className="text-end pe-4">
                                                        <span className="badge bg-success">Aktif</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;