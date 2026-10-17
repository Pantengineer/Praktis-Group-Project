// client/src/pages/auth/ResetPassword.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../utils/api';
import logoPA from '../../assets/img/logo_pa.jpeg';
import '../../assets/css/login.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // 'verifying' | 'valid' | 'invalid' | 'success'
  const [user, setUser] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [redirectCount, setRedirectCount] = useState(3);

  const heroRef = useRef(null);

  // 1. Verify token on mount
  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setErrorMessage('Token reset tidak ditemukan pada tautan.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/api/auth/verify-reset-token/${token}`);
        if (res.data?.valid) {
          setUser(res.data.user);
          setStatus('valid');
        } else {
          setStatus('invalid');
          setErrorMessage('Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.');
        }
      } catch (err) {
        console.error('Verify token failed:', err);
        setStatus('invalid');
        setErrorMessage(err.response?.data?.message || 'Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.');
      }
    };

    verify();
  }, [token]);

  // 2. Countdown redirect on success
  useEffect(() => {
    let timer;
    if (status === 'success') {
      timer = setInterval(() => {
        setRedirectCount((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate('/auth/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [status, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword.length < 6) {
      setErrorMessage('Kata sandi minimal harus terdiri dari 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/api/auth/reset-password', {
        token,
        newPassword,
      });

      setStatus('success');
    } catch (err) {
      console.error('Reset password error:', err);
      setErrorMessage(err.response?.data?.message || 'Gagal mereset kata sandi. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

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

          <motion.div 
            initial={{ opacity: 0, y: 25 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }} 
            className="login-brand-content position-relative"
            style={{ zIndex: 5 }}
          >
            <h1 className="brand-title">PRAKTIS</h1>
            <p className="brand-desc mx-auto mb-0">
              Buat Kata Sandi Baru yang Kuat dan Aman untuk Melanjutkan Akses Praktikum.
            </p>
          </motion.div>
        </div>

        {/* FORM PANEL (RIGHT) */}
        <div className="col-lg-5 login-right">
          <div className="login-card">
            
            <div className="text-center mb-4">
              <img 
                src={logoPA} 
                alt="Logo PA" 
                width="95" 
                className="mb-3 rounded-4 shadow-sm border border-2 border-white" 
              />
              <h3 className="fw-bold text-dark mb-1">Reset Kata Sandi</h3>
              {user && (
                <p className="text-muted small mb-0">
                  Untuk akun: <strong className="text-dark">{user.email}</strong> ({user.nama})
                </p>
              )}
            </div>

            {/* STATE 1: VERIFYING TOKEN */}
            {status === 'verifying' && (
              <div className="text-center py-5">
                <div className="spinner-border text-primary mb-3" role="status"></div>
                <p className="text-muted small">Memverifikasi keabsahan tautan reset...</p>
              </div>
            )}

            {/* STATE 2: INVALID OR EXPIRED TOKEN */}
            {status === 'invalid' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-light p-4 rounded-4 border text-center mb-3"
              >
                <div className="d-inline-flex p-3 rounded-circle bg-danger-subtle text-danger mb-3">
                  <i className="bi bi-shield-x fs-1"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Tautan Tidak Valid</h5>
                <p className="text-muted small mb-4">
                  {errorMessage || 'Tautan reset kata sandi ini tidak valid atau batas waktu 15 menit telah berakhir.'}
                </p>
                <div className="d-flex flex-column gap-2">
                  <Link to="/auth/forgot-password" className="btn btn-primary rounded-3 py-2 fw-semibold">
                    Minta Tautan Baru
                  </Link>
                  <Link to="/auth/login" className="btn btn-outline-secondary rounded-3 py-2 small">
                    Kembali ke Login
                  </Link>
                </div>
              </motion.div>
            )}

            {/* STATE 3: FORM RESET PASSWORD */}
            {status === 'valid' && (
              <>
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="alert alert-danger rounded-3 py-2 px-3 small d-flex align-items-center mb-3"
                  >
                    <i className="bi bi-exclamation-circle-fill me-2 fs-5 text-danger"></i>
                    <div>{errorMessage}</div>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit}>
                  {/* NEW PASSWORD */}
                  <div className="form-floating mb-3 position-relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="form-control bg-light pe-5" 
                      id="newPassword" 
                      placeholder="Kata Sandi Baru" 
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={submitting}
                    />
                    <label htmlFor="newPassword" className="text-muted">Kata Sandi Baru</label>

                    <button
                      type="button"
                      className="btn border-0 text-muted opacity-75 hover-opacity-100 position-absolute end-0 top-50 translate-middle-y me-2"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div className="form-floating mb-4 position-relative">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="form-control bg-light pe-5" 
                      id="confirmPassword" 
                      placeholder="Konfirmasi Kata Sandi Baru" 
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={submitting}
                    />
                    <label htmlFor="confirmPassword" className="text-muted">Konfirmasi Kata Sandi</label>
                  </div>

                  <div className="small text-muted mb-4 d-flex align-items-center gap-2">
                    <i className={`bi ${newPassword.length >= 6 ? 'bi-check-circle-fill text-success' : 'bi-circle text-muted'}`}></i>
                    <span>Minimal 6 karakter</span>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 shadow-sm py-3 rounded-3 fw-bold hover-lift d-flex justify-content-center align-items-center gap-2"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status"></span>
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <span>Simpan Kata Sandi Baru</span>
                        <i className="bi bi-shield-check"></i>
                      </>
                    )}
                  </button>
                </form>
              </>
            )}

            {/* STATE 4: SUCCESS */}
            {status === 'success' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-light p-4 rounded-4 border text-center mb-3"
              >
                <div className="d-inline-flex p-3 rounded-circle bg-success-subtle text-success mb-3">
                  <i className="bi bi-check-circle-fill fs-1"></i>
                </div>
                <h5 className="fw-bold text-dark mb-2">Kata Sandi Diperbarui!</h5>
                <p className="text-muted small mb-4">
                  Kata sandi Anda telah berhasil diganti. Anda akan dialihkan secara otomatis ke halaman login dalam <strong>{redirectCount} detik</strong>.
                </p>
                <Link to="/auth/login" className="btn btn-primary w-100 rounded-3 py-2.5 fw-semibold">
                  Login Sekarang
                </Link>
              </motion.div>
            )}

            <div className="mt-5 text-center text-muted small" style={{ fontSize: '0.75rem' }}>
              &copy; 2026 Lab Teknik &bull; PRAKTIS System
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;
