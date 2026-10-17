// client/src/pages/auth/ForgotPassword.jsx
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import logoPA from '../../assets/img/logo_pa.jpeg';
import ContactSupportModal from '../../components/ContactSupportModal';
import '../../assets/css/login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const heroRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Gagal mengirim instruksi reset. Silakan coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Tech floating icons config (consistent with Login page)
  const techIcons = [
    { id: 1, icon: 'bi-key-fill', color: 'text-warning', top: '15%', left: '12%', duration: 7, driftX: [0, 15, -10, 0], driftY: [0, -12, 10, 0] },
    { id: 2, icon: 'bi-envelope-check-fill', color: 'text-info', top: '22%', right: '14%', duration: 8, driftX: [0, -12, 10, 0], driftY: [0, 10, -15, 0] },
    { id: 3, icon: 'bi-shield-lock-fill', color: 'text-success', bottom: '25%', left: '10%', duration: 7.5, driftX: [0, 10, -12, 0], driftY: [0, -15, 10, 0] },
    { id: 4, icon: 'bi-cpu-fill', color: 'text-primary', bottom: '18%', right: '15%', duration: 9, driftX: [0, -14, 12, 0], driftY: [0, 12, -10, 0] },
  ];

  return (
    <div className="login-wrapper container-fluid g-0">
      <div className="row g-0">
        
        {/* HERO PANEL (LEFT) */}
        <div 
          ref={heroRef}
          className="col-lg-7 d-none d-lg-flex login-left overflow-hidden position-relative"
        >
          <div className="tech-grid-bg"></div>

          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3]
            }} 
            transition={{ 
              duration: 6, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="position-absolute rounded-circle pointer-events-none" 
            style={{ 
              width: '550px', 
              height: '550px', 
              background: 'radial-gradient(circle, #60a5fa 0%, transparent 70%)', 
              filter: 'blur(70px)'
            }} 
          />

          {techIcons.map((item) => (
            <motion.div
              key={item.id}
              drag
              dragConstraints={heroRef}
              dragElastic={0.35}
              whileHover={{ scale: 1.25, cursor: 'grab', zIndex: 30 }}
              whileTap={{ scale: 1.15, cursor: 'grabbing', zIndex: 30 }}
              animate={{
                x: item.driftX,
                y: item.driftY,
                rotate: [0, 8, -8, 0]
              }}
              transition={{
                duration: item.duration,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="position-absolute rounded-circle d-flex align-items-center justify-content-center border border-light border-opacity-25 shadow-lg"
              style={{
                top: item.top,
                left: item.left,
                right: item.right,
                bottom: item.bottom,
                width: '64px',
                height: '64px',
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(16px)',
                userSelect: 'none',
                zIndex: 10
              }}
            >
              <i className={`bi ${item.icon} fs-3 ${item.color}`}></i>
            </motion.div>
          ))}

          <motion.div 
            initial={{ opacity: 0, y: 25 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }} 
            className="login-brand-content position-relative"
            style={{ zIndex: 5 }}
          >
            <h1 className="brand-title">PRAKTIS</h1>
            <p className="brand-desc mx-auto mb-0">
              Layanan Pemulihan Kata Sandi Akun Mahasiswa, Asdos, dan Staf Laboratorium.
            </p>
          </motion.div>
        </div>

        {/* FORM PANEL (RIGHT) */}
        <div className="col-lg-5 login-right">
          <div className="login-card">
            
            {/* Logo & Header */}
            <div className="text-center mb-4">
              <img 
                src={logoPA} 
                alt="Logo PA" 
                width="95" 
                className="mb-3 rounded-4 shadow-sm border border-2 border-white" 
              />
              <h3 className="fw-bold text-dark mb-1">Lupa Password?</h3>
              <p className="text-muted small mb-0">
                Masukkan email Anda untuk menerima tautan pemulihan kata sandi.
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="alert alert-danger rounded-3 py-2.5 px-3 small d-flex align-items-center mb-3"
              >
                <i className="bi bi-exclamation-circle-fill me-2 fs-5 text-danger"></i>
                <div>{error}</div>
              </motion.div>
            )}

            {!submitted ? (
              <form onSubmit={handleSubmit}>
                <div className="form-floating mb-4">
                  <input 
                    type="email" 
                    className="form-control bg-light" 
                    id="reset-email" 
                    placeholder="name@example.com" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                  <label htmlFor="reset-email" className="text-muted">Alamat Email Terdaftar</label>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 shadow-sm py-3 rounded-3 fw-bold hover-lift d-flex justify-content-center align-items-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      <span>Mengirim Tautan...</span>
                    </>
                  ) : (
                    <>
                      <span>Kirim Tautan Reset</span>
                      <i className="bi bi-send-fill"></i>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-light p-4 rounded-4 border text-center mb-4"
              >
                <div className="d-inline-flex p-3 rounded-circle bg-success-subtle text-success mb-3">
                  <i className="bi bi-check2-circle fs-1"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Instruksi Terkirim!</h5>
                <p className="text-muted small mb-3">
                  Jika email <strong>{email}</strong> terdaftar di sistem, tautan reset kata sandi telah dikirimkan.
                </p>
                <div className="alert alert-warning border-0 small text-start py-2 px-3 rounded-3 mb-3">
                  <i className="bi bi-info-circle-fill me-1 text-warning"></i>
                  Tautan berlaku selama <strong>15 menit</strong>. Jangan lupa periksa folder <em>Spam/Junk</em> jika email tidak kunjung muncul di kotak masuk utama.
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1.5"
                >
                  Kirim Ulang Email
                </button>
              </motion.div>
            )}

            {/* Navigation Links */}
            <div className="text-center mt-4 d-flex flex-column gap-2">
              <Link 
                to="/auth/login" 
                className="text-decoration-none small text-primary fw-semibold d-inline-flex align-items-center justify-content-center gap-1"
              >
                <i className="bi bi-arrow-left"></i>
                <span>Kembali ke Halaman Login</span>
              </Link>

              <div className="d-flex justify-content-center align-items-center gap-3 pt-2 border-top mt-3">
                <Link to="/faq" className="text-decoration-none small text-muted">
                  <i className="bi bi-question-circle me-1"></i>Pusat Bantuan FAQ
                </Link>
                <span className="text-muted">&bull;</span>
                <button 
                  type="button" 
                  onClick={() => setShowContactModal(true)} 
                  className="btn btn-link p-0 text-decoration-none small text-muted border-0"
                >
                  <i className="bi bi-whatsapp me-1 text-success"></i>Kontak Lab
                </button>
              </div>
            </div>

            <div className="mt-4 text-center text-muted small" style={{ fontSize: '0.75rem' }}>
              &copy; 2026 Lab Teknik &bull; PRAKTIS System
            </div>
          </div>
        </div>

      </div>

      {/* Contact Info Modal */}
      <ContactSupportModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)} 
      />
    </div>
  );
};

export default ForgotPassword;
