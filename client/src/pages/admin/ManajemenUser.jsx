import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';

const ManajemenUser = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination & Search States
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Column Filters
    const [filterProdi, setFilterProdi] = useState('');
    const [filterAngkatan, setFilterAngkatan] = useState('');
    const [filterRole, setFilterRole] = useState('');

    // Safe Users Array
    const safeUsers = Array.isArray(users) ? users : [];

    const filteredUsers = safeUsers.filter(u => {
        if (!u) return false;
        const searchLower = (searchTerm || '').toLowerCase();
        const matchesSearch = !searchLower ||
                              (u.nama && u.nama.toLowerCase().includes(searchLower)) ||
                              (u.nim && u.nim.toLowerCase().includes(searchLower)) ||
                              (u.email && u.email.toLowerCase().includes(searchLower));
        
        const matchesProdi = filterProdi === '' || u.prodi === filterProdi;
        const matchesAngkatan = filterAngkatan === '' || String(u.angkatan) === filterAngkatan;
        
        const userRoles = Array.isArray(u.Roles) ? u.Roles : [];
        const isAdmin = userRoles.some(r => r?.deskripsi === 'admin');
        const isAsdos = userRoles.some(r => r?.deskripsi === 'asdos');
        const highestRole = isAdmin ? 'admin' : (isAsdos ? 'asdos' : 'mahasiswa');
        const matchesRole = filterRole === '' || highestRole === filterRole;

        return matchesSearch && matchesProdi && matchesAngkatan && matchesRole;
    });
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const currentUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const { formData, handleChange, reset } = useForm({
        nama: '',
        email: '',
        password: '',
        role: 'mahasiswa',
        nim: '',
        prodi: '',
        angkatan: new Date().getFullYear()
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/admin/users');
            const data = Array.isArray(res.data) 
                ? res.data 
                : (Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data?.users) ? res.data.users : []));
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Hapus user ini?')) {
            await api.delete(`/api/admin/users/${id}`);
            fetchUsers();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/admin/users', formData);
            alert('User created!');
            fetchUsers();
            reset();
        } catch (err) {
            alert(err.response?.data?.message || 'Error creating user');
        }
    };

    return (
        <div className="container-fluid">
            <h3 className="fw-bold mb-4">Manajemen User</h3>

            {/* Create Form */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-3">Tambah User Baru</h5>
                    <form onSubmit={handleSubmit} className="row g-3">
                        <div className="col-md-3">
                            <input type="text" className="form-control form-control-sm" placeholder="Nama Lengkap"
                                name="nama" value={formData.nama} onChange={handleChange} required />
                        </div>
                        <div className="col-md-2">
                            <input type="text" className="form-control form-control-sm" placeholder="NIM"
                                name="nim" value={formData.nim} onChange={handleChange} />
                        </div>
                        <div className="col-md-3">
                            <input type="email" className="form-control form-control-sm" placeholder="Email"
                                name="email" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className="col-md-2">
                            <input type="password" className="form-control form-control-sm" placeholder="Password"
                                name="password" value={formData.password} onChange={handleChange} required />
                        </div>
                        <div className="col-md-2">
                            <select className="form-select form-select-sm" name="role" value={formData.role} onChange={handleChange}>
                                <option value="mahasiswa">Mahasiswa</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <select className="form-select form-select-sm" name="prodi" value={formData.prodi} onChange={handleChange}>
                                <option value="">Pilih Program Studi (Opsional)</option>
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
                        <div className="col-md-2">
                            <input type="number" className="form-control form-control-sm" placeholder="Angkatan"
                                name="angkatan" value={formData.angkatan} onChange={handleChange} min="2010" max={new Date().getFullYear()} step="1" />
                        </div>
                        <div className="col-12 text-end">
                            <button type="submit" className="btn btn-primary btn-sm"><i className="bi bi-plus-lg"></i> Tambah User</button>
                        </div>
                    </form>
                </div>
            </div>

            {/* List Users */}
            <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold">Daftar Pengguna</h6>
                    <div className="input-group input-group-sm" style={{ width: '250px' }}>
                        <span className="input-group-text bg-light border-end-0"><i className="bi bi-search"></i></span>
                        <input type="text" className="form-control border-start-0 bg-light" placeholder="Cari nama atau NIM..."
                            value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                    </div>
                </div>
                <div className="card-body p-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="align-middle">Nama</th>
                                    <th className="align-middle">NIM</th>
                                    <th>
                                        <div className="mb-1">Prodi</div>
                                        <select className="form-select form-select-sm" value={filterProdi} onChange={e => {setFilterProdi(e.target.value); setCurrentPage(1);}}>
                                            <option value="">Semua</option>
                                            {[...new Set(safeUsers.map(u => u?.prodi).filter(Boolean))].map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </th>
                                    <th>
                                        <div className="mb-1">Angkatan</div>
                                        <select className="form-select form-select-sm" value={filterAngkatan} onChange={e => {setFilterAngkatan(e.target.value); setCurrentPage(1);}}>
                                            <option value="">Semua</option>
                                            {[...new Set(safeUsers.map(u => u?.angkatan).filter(Boolean))].sort().reverse().map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </th>
                                    <th className="align-middle">Email</th>
                                    <th>
                                        <div className="mb-1">Role</div>
                                        <select className="form-select form-select-sm" value={filterRole} onChange={e => {setFilterRole(e.target.value); setCurrentPage(1);}}>
                                            <option value="">Semua</option>
                                            <option value="admin">Admin</option>
                                            <option value="asdos">Asdos</option>
                                            <option value="mahasiswa">Mahasiswa</option>
                                        </select>
                                    </th>
                                    <th className="text-center align-middle">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center py-4">Loading data...</td></tr>
                                ) : (() => {
                                    if (filteredUsers.length === 0) {
                                        return <tr><td colSpan="7" className="text-center text-muted py-4">Tidak ada pengguna ditemukan.</td></tr>;
                                    }

                                    return currentUsers.map(u => {
                                        if (!u) return null;
                                        // Determine highest privilege role
                                        const userRoles = Array.isArray(u.Roles) ? u.Roles : [];
                                        const isAdmin = userRoles.some(r => r?.deskripsi === 'admin');
                                        const isAsdos = userRoles.some(r => r?.deskripsi === 'asdos');

                                        const topRole = isAdmin ? 'admin' : (isAsdos ? 'asdos' : 'mahasiswa');
                                        const badgeClass = isAdmin ? 'bg-danger' : (isAsdos ? 'bg-primary' : 'bg-secondary');

                                        return (
                                            <tr key={u.id_user || Math.random()}>
                                                <td className="fw-bold">{u.nama}</td>
                                                <td>{u.nim || '-'}</td>
                                                <td>{u.prodi || '-'}</td>
                                                <td>{u.angkatan || '-'}</td>
                                                <td className="text-muted small">{u.email}</td>
                                                <td>
                                                    <span className={`badge ${badgeClass} text-uppercase`}>
                                                        {topRole}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <Link
                                                        to={`/admin/user/${u.id_user}`}
                                                        className="btn btn-outline-primary btn-sm me-2"
                                                        title="Lihat Profil"
                                                    >
                                                        <i className="bi bi-person-gear"></i>
                                                    </Link>

                                                    <button onClick={() => handleDelete(u.id_user)} className="btn btn-outline-danger btn-sm" title="Hapus User">
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
                {!loading && users.length > 0 && (
                        <div className="card-footer bg-white d-flex justify-content-between align-items-center py-3">
                            <span className="text-muted small">
                                Menampilkan {currentUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(filteredUsers.length, currentPage * itemsPerPage)} dari {filteredUsers.length} pengguna
                            </span>
                            <div className="btn-group">
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                >
                                    Prev
                                </button>
                                <button
                                    className="btn btn-sm btn-outline-secondary"
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                )}
            </div>
        </div>
    );
};

export default ManajemenUser;