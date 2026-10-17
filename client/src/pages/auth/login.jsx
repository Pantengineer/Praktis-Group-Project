import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/authContext';
import { motion } from 'framer-motion';
import '../../assets/css/login.css';
import logoPA from '../../assets/img/logo_pa.jpeg';
import ContactSupportModal from '../../components/ContactSupportModal';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);

    // Ref for draggable constraints container
    const heroRef = useRef(null);
    
    const { login } = useAuth(); 

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/api/auth/login', {
                email,
                password
            });

            login(response.data.token, response.data.user);

        } catch (err) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Login failed. Please try again.');
            setLoading(false);
        }
    };

    // Random spread tech icons configuration
    const techIcons = [
        { id: 1, icon: 'bi-cpu-fill', color: 'text-info', top: '12%', left: '10%', duration: 7, driftX: [0, 18, -12, 0], driftY: [0, -15, 10, 0] },
        { id: 2, icon: 'bi-database-fill-gear', color: 'text-warning', top: '18%', right: '12%', duration: 8.5, driftX: [0, -15, 10, 0], driftY: [0, 12, -18, 0] },
        { id: 3, icon: 'bi-code-slash', color: 'text-success', top: '48%', left: '6%', duration: 6.8, driftX: [0, 12, -14, 0], driftY: [0, -18, 12, 0] },
        { id: 4, icon: 'bi-diagram-3-fill', color: 'text-primary', top: '52%', right: '7%', duration: 9.2, driftX: [0, -18, 14, 0], driftY: [0, 15, -10, 0] },
        { id: 5, icon: 'bi-lightning-charge-fill', color: 'text-warning', bottom: '12%', left: '15%', duration: 7.4, driftX: [0, 14, -10, 0], driftY: [0, -12, 16, 0] },
        { id: 6, icon: 'bi-terminal-fill', color: 'text-info', bottom: '15%', right: '14%', duration: 8.1, driftX: [0, -12, 16, 0], driftY: [0, 14, -12, 0] },
        { id: 7, icon: 'bi-rocket-takeoff-fill', color: 'text-danger', top: '32%', left: '18%', duration: 9.5, driftX: [0, 20, -15, 0], driftY: [0, -10, 15, 0] },
        { id: 8, icon: 'bi-shield-lock-fill', color: 'text-success', bottom: '34%', right: '18%', duration: 7.8, driftX: [0, -16, 12, 0], driftY: [0, 18, -14, 0] },
    ];

    return (
        <div className="login-wrapper container-fluid g-0">
            <div className="row g-0">
                
                {/* HERO PANEL (LEFT WITH DRAGGABLE & BOUNCING TECH ICONS) */}
                <div 
                    ref={heroRef}
                    className="col-lg-7 d-none d-lg-flex login-left overflow-hidden position-relative"
                >
                    {/* Tech Grid Pattern */}
                    <div className="tech-grid-bg"></div>

                    {/* Ambient Pulsing Glow Orb */}
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

                    {/* RANDOM SPREAD DRAGGABLE & BOUNCING TECH ICONS */}
                    {techIcons.map((item) => (
                        <motion.div
                            key={item.id}
                            drag
                            dragConstraints={heroRef}
                            dragElastic={0.35}
                            dragTransition={{ bounceStiffness: 350, bounceDamping: 18 }}
                            whileHover={{ scale: 1.25, cursor: 'grab', zIndex: 30 }}
                            whileTap={{ scale: 1.15, cursor: 'grabbing', zIndex: 30 }}
                            animate={{
                                x: item.driftX,
                                y: item.driftY,
                                rotate: [0, 10, -10, 0]
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
                                WebkitBackdropFilter: 'blur(16px)',
                                userSelect: 'none',
                                zIndex: 10
                            }}
                            title="Tarik dan lempar ikon ini!"
                        >
                            <i className={`bi ${item.icon} fs-3 ${item.color}`}></i>
                        </motion.div>
                    ))}

                    {/* Brand Main Content (Center) */}
                    <motion.div 
                        initial={{ opacity: 0, y: 25 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ duration: 0.6 }} 
                        className="login-brand-content position-relative"
                        style={{ zIndex: 5 }}
                    >
                        <h1 className="brand-title">PRAKTIS</h1>
                        
                        <p className="brand-desc mx-auto mb-0">
                            Platform terintegrasi manajemen praktikum. <br />
                            Memudahkan pengelolaan jadwal, materi, dan penilaian tugas <br /> dalam satu sistem yang efisien.
                        </p>
                    </motion.div>
                </div>

                {/* LOGIN FORM PANEL (RIGHT - CLEAN WHITE & BLUE) */}
                <div className="col-lg-5 login-right">
                    <div className="login-card">
                        <div className="text-center mb-4">
                            <img 
                                src={logoPA} 
                                alt="Logo PA" 
                                width="110" 
                                className="mb-3 rounded-4 shadow-sm border border-2 border-white" 
                            />                               
                            <h3 className="fw-bold text-dark mb-1">Welcome Back!</h3>
                            <p className="text-muted small mb-0">Silakan login untuk melanjutkan.</p>
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

                        <form onSubmit={handleLogin}>
                            {/* EMAIL FLOATING FIELD */}
                            <div className="form-floating mb-3">
                                <input 
                                    type="email" 
                                    className="form-control bg-light" 
                                    id="email" 
                                    placeholder="name@example.com" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                                <label htmlFor="email" className="text-muted">Email</label>
                            </div>

                            {/* PASSWORD FLOATING FIELD WITH TOGGLE */}
                            <div className="form-floating mb-4 position-relative">
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    className="form-control bg-light pe-5" 
                                    id="password" 
                                    placeholder="Password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                                <label htmlFor="password" className="text-muted">Password</label>
                                
                                <button
                                    type="button"
                                    className="btn border-0 text-muted opacity-75 hover-opacity-100 position-absolute end-0 top-50 translate-middle-y me-2"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex="-1"
                                >
                                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                                </button>
                            </div>
                            
                            {/* SUBMIT BUTTON */}
                            <button 
                                type="submit" 
                                className="btn btn-primary w-100 shadow-sm py-3 rounded-3 fw-bold hover-lift d-flex justify-content-center align-items-center gap-2"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status"></span>
                                        <span>Signing In...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <i className="bi bi-arrow-right"></i>
                                    </>
                                )}
                            </button>

                            <div className="d-flex justify-content-between align-items-center mt-4">
                                <Link 
                                    to="/faq" 
                                    className="text-decoration-none small text-muted hover-opacity-100 d-inline-flex align-items-center gap-1"
                                >
                                    <i className="bi bi-question-circle"></i>
                                    <span>Pusat Bantuan FAQ</span>
                                </Link>
                                <Link 
                                    to="/auth/forgot-password" 
                                    className="text-decoration-none small text-primary fw-semibold"
                                >
                                    Lupa Password?
                                </Link>
                            </div>

                            <div className="text-center mt-3 pt-3 border-top">
                                <button 
                                    type="button" 
                                    onClick={() => setShowContactModal(true)} 
                                    className="btn btn-link p-0 text-decoration-none small text-muted d-inline-flex align-items-center gap-1"
                                >
                                    <i className="bi bi-whatsapp text-success fs-6"></i>
                                    <span>Butuh Bantuan Lab? Hubungi Kami</span>
                                </button>
                            </div>
                        </form>

                        <div className="mt-5 text-center text-muted small" style={{ fontSize: '0.75rem' }}>
                            &copy; 2026 Lab Teknik &bull; PRAKTIS System
                        </div>
                    </div>
                </div>

            </div>

            {/* Contact Support Modal */}
            <ContactSupportModal 
                isOpen={showContactModal} 
                onClose={() => setShowContactModal(false)} 
            />
        </div>
    );
};

export default Login;