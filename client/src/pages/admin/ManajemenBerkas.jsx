import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { getCleanFilename } from '../../utils/fileHelpers';
import { motion } from 'framer-motion';

const ManajemenBerkas = () => {
  const [files, setFiles] = useState([]);
  const [storageStats, setStorageStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL'); // 'ALL' | 'materi' | 'tugas' | 'pengumpulan'
  const [sortBy, setSortBy] = useState('DATE_DESC'); // 'DATE_DESC' | 'SIZE_DESC' | 'SIZE_ASC' | 'NAME_ASC'

  // Delete modal state
  const [selectedFileForDelete, setSelectedFileForDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resFiles, resStorage] = await Promise.all([
        api.get('/api/admin/files'),
        api.get('/api/admin/storage-stats')
      ]);
      const fileData = resFiles.data?.files || (Array.isArray(resFiles.data) ? resFiles.data : []);
      setFiles(Array.isArray(fileData) ? fileData : []);
      setStorageStats(resStorage?.data || null);
    } catch (err) {
      console.error("Error fetching files:", err);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteFile = async () => {
    if (!selectedFileForDelete) return;
    try {
      setDeleting(true);
      const { category, id, fileIndex } = selectedFileForDelete;
      await api.delete(`/api/admin/files/${category}/${id}/${fileIndex ?? 0}`);
      setSelectedFileForDelete(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menghapus berkas.");
    } finally {
      setDeleting(false);
    }
  };

  const getFileIcon = (filename, mimetype) => {
    const ext = filename?.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext) || mimetype?.includes('pdf')) {
      return <i className="bi bi-file-earmark-pdf-fill fs-4 text-danger me-2"></i>;
    }
    if (['doc', 'docx'].includes(ext) || mimetype?.includes('word')) {
      return <i className="bi bi-file-earmark-word-fill fs-4 text-primary me-2"></i>;
    }
    if (['ppt', 'pptx'].includes(ext) || mimetype?.includes('presentation')) {
      return <i className="bi bi-file-earmark-ppt-fill fs-4 text-warning me-2"></i>;
    }
    if (['zip', 'rar', '7z'].includes(ext) || mimetype?.includes('zip')) {
      return <i className="bi bi-file-earmark-zip-fill fs-4 text-secondary me-2"></i>;
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) || mimetype?.includes('image')) {
      return <i className="bi bi-file-earmark-image-fill fs-4 text-info me-2"></i>;
    }
    return <i className="bi bi-file-earmark-text-fill fs-4 text-dark opacity-75 me-2"></i>;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDownloadUrl = (file) => {
    const baseURL = api.defaults.baseURL || 'http://localhost:5001';
    if (file.category === 'materi') {
      return `${baseURL}/api/content/materi/${file.id}/download/${file.fileIndex}?view=true`;
    }
    if (file.category === 'tugas') {
      return `${baseURL}/api/content/tugas/${file.id}/download/${file.fileIndex}?view=true`;
    }
    return `${baseURL}/${file.path}`;
  };

  // Filter & Sort Logic
  const filteredFiles = files.filter(f => {
    // 1. Category Filter
    if (categoryFilter !== 'ALL' && f.category !== categoryFilter) return false;

    // 2. Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = f.filename?.toLowerCase().includes(q);
      const matchTitle = f.title?.toLowerCase().includes(q);
      const matchUploader = f.uploadedBy?.toLowerCase().includes(q);
      const matchNim = f.uploaderNim?.toLowerCase().includes(q);
      const matchClass = f.kode_kelas?.toLowerCase().includes(q);
      if (!matchName && !matchTitle && !matchUploader && !matchNim && !matchClass) return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'SIZE_DESC') return (b?.size || 0) - (a?.size || 0);
    if (sortBy === 'SIZE_ASC') return (a?.size || 0) - (b?.size || 0);
    if (sortBy === 'NAME_ASC') return String(a?.filename || '').localeCompare(String(b?.filename || ''));
    return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0); // DATE_DESC
  });

  return (
    <div className="container-fluid p-4" style={{ maxWidth: '1400px', margin: '0 auto' }}>
      
      {/* HEADER SECTION */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold text-dark mb-1">
            <i className="bi bi-folder2-open me-2 text-primary"></i>Manajemen Berkas & Penyimpanan
          </h2>
          <p className="text-muted mb-0">Audit, kelola, dan bersihkan berkas terunggah di seluruh sistem praktikum.</p>
        </div>
        <button onClick={fetchData} className="btn btn-outline-secondary rounded-pill px-3 btn-sm fw-bold">
          <i className="bi bi-arrow-clockwise me-1"></i> Refresh Data
        </button>
      </div>

      {/* STORAGE STATS METRICS ROW */}
      <div className="row g-3 mb-4">
        
        {/* TOTAL CAPACITY CARD */}
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-dark text-white h-100 position-relative overflow-hidden">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-uppercase tracking-wider opacity-75 fw-bold">Kapasitas Sistem</span>
              <span className="badge bg-info text-dark rounded-pill fw-bold" style={{ fontSize: '0.7rem' }}>
                {storageStats?.usedPercentage || 0}% Terpakai
              </span>
            </div>
            <h3 className="fw-bold mb-2">
              {storageStats ? `${(storageStats.totalUsedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB` : '0 GB'}
              <span className="fs-6 opacity-50 fw-normal ms-1">/ {(storageStats?.maxStorageMB / 1024).toFixed(1)} GB</span>
            </h3>
            <div className="progress bg-secondary bg-opacity-50" style={{ height: '6px', borderRadius: '3px' }}>
              <div 
                className={`progress-bar ${
                  storageStats?.usedPercentage > 90 ? 'bg-danger' : storageStats?.usedPercentage > 70 ? 'bg-warning' : 'bg-info'
                }`}
                style={{ width: `${Math.min(storageStats?.usedPercentage || 0, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* MATERI BREAKDOWN CARD */}
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-uppercase fw-bold text-primary">Materi Pembelajaran</span>
              <i className="bi bi-journal-text fs-4 text-primary opacity-75"></i>
            </div>
            <h4 className="fw-bold text-dark mb-1">{formatFileSize(storageStats?.categories?.materi?.bytes)}</h4>
            <span className="small text-muted">{storageStats?.categories?.materi?.count || 0} Berkas Terunggah</span>
          </div>
        </div>

        {/* TUGAS BREAKDOWN CARD */}
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-warning bg-opacity-10 border border-warning border-opacity-25 h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-uppercase fw-bold text-warning-emphasis">Tugas & Modul</span>
              <i className="bi bi-clipboard-check fs-4 text-warning opacity-75"></i>
            </div>
            <h4 className="fw-bold text-dark mb-1">{formatFileSize(storageStats?.categories?.tugas?.bytes)}</h4>
            <span className="small text-muted">{storageStats?.categories?.tugas?.count || 0} Berkas Terunggah</span>
          </div>
        </div>

        {/* PENGUMPULAN BREAKDOWN CARD */}
        <div className="col-lg-3 col-md-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-success bg-opacity-10 border border-success border-opacity-25 h-100">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <span className="small text-uppercase fw-bold text-success">Submission Mahasiswa</span>
              <i className="bi bi-file-earmark-arrow-up fs-4 text-success opacity-75"></i>
            </div>
            <h4 className="fw-bold text-dark mb-1">{formatFileSize(storageStats?.categories?.pengumpulan?.bytes)}</h4>
            <span className="small text-muted">{storageStats?.categories?.pengumpulan?.count || 0} Berkas Terunggah</span>
          </div>
        </div>

      </div>

      {/* FILTER & TOOLBAR CARD */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
          
          {/* SEARCH BAR */}
          <div className="position-relative flex-grow-1" style={{ minWidth: '240px', maxWidth: '380px' }}>
            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" style={{ fontSize: '0.85rem' }}></i>
            <input
              type="text"
              placeholder="Cari berkas, uploader, NIM, atau kelas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control form-control-sm rounded-pill ps-5 pe-3 py-1.5 bg-light border-0"
              style={{ fontSize: '0.83rem' }}
            />
            {searchTerm && (
              <i 
                className="bi bi-x-circle-fill position-absolute top-50 end-0 translate-middle-y me-3 cursor-pointer text-muted" 
                onClick={() => setSearchTerm('')}
              ></i>
            )}
          </div>

          {/* CATEGORY PILL TABS */}
          <div className="p-1 bg-light rounded-pill d-inline-flex border" style={{ background: '#f8fafc' }}>
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`btn btn-sm rounded-pill px-3 py-1 fw-bold border-0 ${categoryFilter === 'ALL' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
              style={{ fontSize: '0.78rem' }}
            >
              Semua Berkas ({files.length})
            </button>
            <button
              onClick={() => setCategoryFilter('materi')}
              className={`btn btn-sm rounded-pill px-3 py-1 fw-bold border-0 ${categoryFilter === 'materi' ? 'bg-primary text-white shadow-sm' : 'text-muted'}`}
              style={{ fontSize: '0.78rem' }}
            >
              Materi
            </button>
            <button
              onClick={() => setCategoryFilter('tugas')}
              className={`btn btn-sm rounded-pill px-3 py-1 fw-bold border-0 ${categoryFilter === 'tugas' ? 'bg-warning text-dark shadow-sm' : 'text-muted'}`}
              style={{ fontSize: '0.78rem' }}
            >
              Tugas
            </button>
            <button
              onClick={() => setCategoryFilter('pengumpulan')}
              className={`btn btn-sm rounded-pill px-3 py-1 fw-bold border-0 ${categoryFilter === 'pengumpulan' ? 'bg-success text-white shadow-sm' : 'text-muted'}`}
              style={{ fontSize: '0.78rem' }}
            >
              Submission
            </button>
          </div>

          {/* SORT DROPDOWN */}
          <div className="d-flex align-items-center gap-2 ms-auto">
            <span className="small text-muted fw-bold">Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-select form-select-sm rounded-pill px-3 py-1.5 fw-bold bg-white text-dark shadow-sm border"
              style={{ fontSize: '0.8rem', width: 'auto' }}
            >
              <option value="DATE_DESC">Terbaru</option>
              <option value="SIZE_DESC">Ukuran Terbesar</option>
              <option value="SIZE_ASC">Ukuran Terkecil</option>
              <option value="NAME_ASC">Nama (A-Z)</option>
            </select>
          </div>

        </div>
      </div>

      {/* FILES TABLE CARD */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        {loading ? (
          <div className="text-center py-5 text-muted">
            <div className="spinner-border text-primary" role="status"></div>
            <p className="mt-2 small">Memuat daftar berkas sistem...</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-folder-x fs-1 d-block mb-2 text-secondary"></i>
            <h6 className="fw-bold">Tidak Ada Berkas Ditemukan</h6>
            <p className="small mb-0">Coba ubah kata kunci pencarian atau kategori filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '0.85rem' }}>
              <thead className="bg-light border-bottom">
                <tr>
                  <th className="ps-4 py-3 fw-bold text-muted text-uppercase" style={{ fontSize: '0.72rem' }}>Nama Berkas & Judul</th>
                  <th className="py-3 fw-bold text-muted text-uppercase" style={{ fontSize: '0.72rem' }}>Kategori</th>
                  <th className="py-3 fw-bold text-muted text-uppercase" style={{ fontSize: '0.72rem' }}>Kelas / Mata Kuliah</th>
                  <th className="py-3 fw-bold text-muted text-uppercase" style={{ fontSize: '0.72rem' }}>Uploader / Pengunggah</th>
                  <th className="py-3 fw-bold text-muted text-uppercase text-end" style={{ fontSize: '0.72rem' }}>Ukuran</th>
                  <th className="py-3 fw-bold text-muted text-uppercase text-center" style={{ fontSize: '0.72rem' }}>Tanggal Upload</th>
                  <th className="pe-4 py-3 fw-bold text-muted text-uppercase text-end" style={{ fontSize: '0.72rem' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file, idx) => (
                  <tr key={`${file.category}-${file.id}-${file.fileIndex || idx}`}>
                    
                    {/* Filename & Title */}
                    <td className="ps-4 py-3">
                      <div className="d-flex align-items-center">
                        {getFileIcon(file.filename, file.mimetype)}
                        <div>
                          <div className="fw-bold text-dark text-truncate" style={{ maxWidth: '240px' }} title={getCleanFilename(file.filename)}>
                            {getCleanFilename(file.filename)}
                          </div>
                          <small className="text-muted d-block text-truncate" style={{ maxWidth: '240px', fontSize: '0.75rem' }}>
                            {file.title}
                          </small>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3">
                      {file.category === 'materi' && (
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-2.5 py-1 fw-bold">
                          Materi
                        </span>
                      )}
                      {file.category === 'tugas' && (
                        <span className="badge bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25 rounded-pill px-2.5 py-1 fw-bold">
                          Tugas
                        </span>
                      )}
                      {file.category === 'pengumpulan' && (
                        <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-2.5 py-1 fw-bold">
                          Submission
                        </span>
                      )}
                    </td>

                    {/* Class */}
                    <td className="py-3">
                      <div className="fw-bold text-dark">{file.kode_kelas}</div>
                      <small className="text-muted d-block text-truncate" style={{ maxWidth: '160px', fontSize: '0.75rem' }}>
                        {file.mata_kuliah} {file.sesi_ke ? `• Sesi ${file.sesi_ke}` : ''}
                      </small>
                    </td>

                    {/* Uploader */}
                    <td className="py-3">
                      <div className="fw-bold text-dark">{file.uploadedBy}</div>
                      {file.uploaderNim !== '-' && (
                        <small className="badge bg-light text-muted border px-1.5 py-0.5 rounded" style={{ fontSize: '0.7rem' }}>
                          NIM: {file.uploaderNim}
                        </small>
                      )}
                    </td>

                    {/* File Size */}
                    <td className="py-3 text-end fw-bold text-dark">
                      {formatFileSize(file.size)}
                    </td>

                    {/* Date */}
                    <td className="py-3 text-center text-muted" style={{ fontSize: '0.78rem' }}>
                      {new Date(file.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>

                    {/* Actions */}
                    <td className="pe-4 py-3 text-end">
                      <div className="d-inline-flex gap-2">
                        <a
                          href={getDownloadUrl(file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary rounded-circle p-1.5 d-inline-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px' }}
                          title="Buka / Unduh Berkas"
                        >
                          <i className="bi bi-box-arrow-up-right"></i>
                        </a>
                        <button
                          onClick={() => setSelectedFileForDelete(file)}
                          className="btn btn-sm btn-outline-danger rounded-circle p-1.5 d-inline-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px' }}
                          title="Hapus Berkas dari Sistem"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {selectedFileForDelete && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">
                  <i className="bi bi-exclamation-triangle-fill me-2"></i>Konfirmasi Hapus Berkas
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedFileForDelete(null)}></button>
              </div>
              <div className="modal-body py-3">
                <p className="mb-2">Apakah Anda yakin ingin menghapus berkas berikut dari sistem?</p>
                <div className="card p-3 bg-light border-0 rounded-3 mb-2">
                  <div className="fw-bold text-dark text-break">{getCleanFilename(selectedFileForDelete.filename)}</div>
                  <small className="text-muted">
                    Kategori: <strong className="text-uppercase">{selectedFileForDelete.category}</strong> • Ukuran: {formatFileSize(selectedFileForDelete.size)}
                  </small>
                </div>
                <small className="text-danger">
                  <i className="bi bi-info-circle me-1"></i>Tindakan ini akan menghapus berkas fisik dari server disk dan database secara permanen.
                </small>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button type="button" className="btn btn-outline-secondary rounded-pill px-4 btn-sm fw-bold" onClick={() => setSelectedFileForDelete(null)}>
                  Batal
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteFile}
                  disabled={deleting}
                  className="btn btn-danger rounded-pill px-4 btn-sm fw-bold d-inline-flex align-items-center gap-1"
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Menghapus...</span>
                    </>
                  ) : (
                    <>
                      <i className="bi bi-trash"></i>
                      <span>Ya, Hapus Permanen</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManajemenBerkas;
