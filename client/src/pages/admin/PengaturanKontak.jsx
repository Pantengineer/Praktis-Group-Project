// client/src/pages/admin/PengaturanKontak.jsx
import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { motion } from 'framer-motion';

const PengaturanKontak = () => {
  const [form, setForm] = useState({
    phone: '',
    email: '',
    hours: '',
    whatsappMessage: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [previewData, setPreviewData] = useState(null);

  const fetchContactSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/settings/contact');
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setForm({
          phone: d.phone || '',
          email: d.email || '',
          hours: d.hours || '',
          whatsappMessage: d.whatsappMessage || 'Halo Admin PRAKTIS, saya ingin bertanya terkait praktikum.',
        });
        setPreviewData(d);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setStatus({ type: 'danger', message: 'Gagal memuat informasi kontak dari server.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContactSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setSaving(true);

    try {
      const res = await api.put('/api/settings/contact', {
        phone: form.phone,
        email: form.email,
        hours: form.hours,
        whatsappMessage: form.whatsappMessage,
      });

      if (res.data?.success) {
        setStatus({ type: 'success', message: 'Pengaturan kontak berhasil diperbarui di database MariaDB!' });
        setPreviewData(res.data.data);
      }
    } catch (err) {
      console.error('Save settings error:', err);
      setStatus({
        type: 'danger',
        message: err.response?.data?.message || 'Gagal menyimpan pengaturan kontak.',
      });
    } finally {
      setSaving(false);
    }
  };

  const cleanPhone = form.phone.replace(/\D/g, '');
  const waNumber = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
  const testWaUrl = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(form.whatsappMessage || 'Halo Admin PRAKTIS.')}`
    : '#';

  return (
    <div className="container-fluid p-0">
      
      {/* HEADER SECTION */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">
            <i className="bi bi-gear-wide-connected text-primary me-2"></i>
            Pengaturan Kontak & Helpdesk Lab
          </h3>
          <p className="text-muted small mb-0">
            Kelola nomor WhatsApp, email helpdesk, dan jam kerja yang ditampilkan kepada mahasiswa dan asisten dosen.
          </p>
        </div>
      </div>

      {status.message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`alert alert-${status.type} alert-dismissible fade show rounded-3 py-3 px-4 shadow-sm mb-4`}
          role="alert"
        >
          <div className="d-flex align-items-center gap-2">
            <i className={`bi ${status.type === 'success' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'} fs-5`}></i>
            <span className="fw-medium">{status.message}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setStatus({ type: '', message: '' })}
            aria-label="Close"
          ></button>
        </motion.div>
      )}

      {loading ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center">
          <div className="spinner-border text-primary mx-auto mb-3" role="status"></div>
          <span className="text-muted">Memuat data dari tabel SystemSettings (MariaDB)...</span>
        </div>
      ) : (
        <div className="row g-4">
          
          {/* FORM EDIT (KIRI) */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm rounded-4 h-100">
              <div className="card-header bg-white border-bottom border-light-subtle py-3 px-4">
                <h5 className="card-title fw-bold mb-0 text-dark">
                  <i className="bi bi-pencil-square text-primary me-2"></i>
                  Formulir Kontak Laboratorium
                </h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSave}>
                  
                  {/* PHONE NUMBER */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">
                      Nomor Telepon / WhatsApp Lab <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="bi bi-telephone-fill"></i>
                      </span>
                      <input
                        type="text"
                        name="phone"
                        className="form-control bg-light border-start-0"
                        placeholder="Contoh: 081234567890"
                        value={form.phone}
                        onChange={handleChange}
                        required
                        disabled={saving}
                      />
                    </div>
                    <div className="form-text text-muted small">
                      Format lokal (contoh: 08123456789) akan secara otomatis dikonversi menjadi format internasional WhatsApp (628123456789).
                    </div>
                  </div>

                  {/* EMAIL */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">
                      Alamat Email Dukungan / Helpdesk <span className="text-danger">*</span>
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="bi bi-envelope-fill"></i>
                      </span>
                      <input
                        type="email"
                        name="email"
                        className="form-control bg-light border-start-0"
                        placeholder="Contoh: lab@praktis.ac.id"
                        value={form.email}
                        onChange={handleChange}
                        required
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* HELPDESK HOURS */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-dark small">
                      Jam Operasional Layanan Helpdesk
                    </label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="bi bi-clock-history"></i>
                      </span>
                      <input
                        type="text"
                        name="hours"
                        className="form-control bg-light border-start-0"
                        placeholder="Contoh: Senin - Jumat, 08:00 - 16:00 WIB"
                        value={form.hours}
                        onChange={handleChange}
                        disabled={saving}
                      />
                    </div>
                  </div>

                  {/* WHATSAPP DEFAULT MESSAGE */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold text-dark small">
                      Pesan Otomatis WhatsApp (Greeting Message)
                    </label>
                    <textarea
                      name="whatsappMessage"
                      rows="3"
                      className="form-control bg-light"
                      placeholder="Pesan yang otomatis terisi ketika mahasiswa mengklik tombol chat WhatsApp..."
                      value={form.whatsappMessage}
                      onChange={handleChange}
                      disabled={saving}
                    ></textarea>
                    <div className="form-text text-muted small">
                      Pesan ini memudahkan mahasiswa memulai percakapan tanpa bingung mengetik format awal.
                    </div>
                  </div>

                  <div className="d-flex gap-2 justify-content-end pt-3 border-top">
                    <button
                      type="button"
                      onClick={fetchContactSettings}
                      className="btn btn-outline-secondary px-3 rounded-3"
                      disabled={saving}
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary px-4 rounded-3 fw-bold d-flex align-items-center gap-2"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status"></span>
                          <span>Menyimpan ke SQL...</span>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-cloud-arrow-up-fill"></i>
                          <span>Simpan Pengaturan</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW (KANAN) */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm rounded-4 h-100 bg-white">
              <div className="card-header bg-white border-bottom border-light-subtle py-3 px-4">
                <h5 className="card-title fw-bold mb-0 text-dark">
                  <i className="bi bi-eye-fill text-info me-2"></i>
                  Pratinjau Tampilan Pengguna
                </h5>
              </div>
              <div className="card-body p-4 d-flex flex-column justify-content-between">
                <div>
                  <div className="badge bg-primary-subtle text-primary px-3 py-1.5 rounded-pill mb-3 small fw-semibold">
                    <i className="bi bi-broadcast me-1"></i> Live Preview Mahasiswa / Asdos
                  </div>
                  
                  <div className="p-3.5 rounded-4 border bg-light mb-4 shadow-sm">
                    <h6 className="fw-bold text-dark mb-1">
                      <i className="bi bi-headset text-primary me-2"></i>
                      Kontak Bantuan Laboratorium
                    </h6>
                    <p className="text-muted small mb-3" style={{ fontSize: '0.8rem' }}>
                      Informasi resmi yang dilihat mahasiswa di menu FAQ dan Login footer.
                    </p>

                    <div className="bg-white p-3 rounded-3 border mb-3">
                      <div className="small text-muted mb-1">Nomor Telepon:</div>
                      <div className="fw-bold text-dark fs-6 mb-2">
                        {form.phone || <em className="text-muted">(Belum diisi)</em>}
                      </div>

                      <div className="small text-muted mb-1">Email Dukungan:</div>
                      <div className="fw-semibold text-primary mb-2">
                        {form.email || <em className="text-muted">(Belum diisi)</em>}
                      </div>

                      <div className="small text-muted mb-1">Jam Operasional:</div>
                      <div className="small text-dark fw-medium">
                        {form.hours || <em className="text-muted">(Belum diisi)</em>}
                      </div>
                    </div>

                    <a
                      href={testWaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-success w-100 rounded-3 py-2.5 fw-bold d-flex align-items-center justify-content-center gap-2 text-decoration-none shadow-sm"
                      style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
                    >
                      <i className="bi bi-whatsapp fs-5"></i>
                      <span>Chat WhatsApp Lab</span>
                    </a>
                  </div>
                </div>

                <div className="p-3 rounded-3 bg-info-subtle border border-info-subtle text-info-emphasis small">
                  <i className="bi bi-info-circle-fill me-1.5"></i>
                  Perubahan langsung tersimpan ke tabel <code>system_settings</code> di MariaDB dan dapat diakses publik melalui endpoint <code>GET /api/settings/contact</code>.
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default PengaturanKontak;
