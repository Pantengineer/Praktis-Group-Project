// client/src/pages/public/Faq.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/authContext';
import { FAQ_CATEGORIES, FAQ_ITEMS } from '../../data/faqData';
import ContactSupportModal from '../../components/ContactSupportModal';
import api from '../../utils/api';
import logoPA from '../../assets/img/logo_pa.jpeg';

const Faq = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openItem, setOpenItem] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactData, setContactData] = useState({
    phone: '081234567890',
    email: 'lab@praktis.ac.id',
    hours: 'Senin - Jumat, 08:00 - 16:00 WIB',
    whatsappUrl: '',
    whatsappNumber: '6281234567890',
  });

  // Fetch live contact settings from backend
  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await api.get('/api/settings/contact');
        if (res.data?.success && res.data?.data) {
          setContactData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load contact info in FAQ:', err);
      }
    };
    fetchContact();
  }, []);

  // Filter FAQ items based on category and search query
  const filteredFaqs = useMemo(() => {
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      const matchesSearch =
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggleAccordion = (id) => {
    setOpenItem((prev) => (prev === id ? null : id));
  };

  const handleBackNavigation = () => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    const roles = user.roles || [];
    if (roles.includes('admin')) navigate('/admin/dashboard');
    else if (roles.includes('asdos')) navigate('/asdos/dashboard');
    else navigate('/mahasiswa/dashboard');
  };

  const waLink = contactData.whatsappUrl || `https://wa.me/${contactData.whatsappNumber || '6281234567890'}?text=${encodeURIComponent('Halo Admin PRAKTIS, saya ingin bertanya terkait praktikum.')}`;

  return (
    <div className="min-vh-100 bg-light" style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}>
      
      {/* HEADER / NAVIGATION BAR */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom sticky-top shadow-sm py-3 px-4">
        <div className="container-xl d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-3">
            <img src={logoPA} alt="Logo Praktis" width="42" className="rounded-3 shadow-sm border" />
            <div>
              <span className="fw-bold text-primary fs-5 tracking-tight d-block lh-1">PRAKTIS</span>
              <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Helpdesk & FAQ</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              onClick={handleBackNavigation}
              className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 fw-medium"
            >
              <i className="bi bi-arrow-left"></i>
              <span>{user ? 'Kembali ke Dashboard' : 'Kembali ke Login'}</span>
            </button>
            <button
              onClick={() => setShowContactModal(true)}
              className="btn btn-success btn-sm rounded-pill px-3 py-1.5 d-flex align-items-center gap-1.5 fw-medium"
              style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
            >
              <i className="bi bi-whatsapp"></i>
              <span className="d-none d-sm-inline">Kontak Admin</span>
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SEARCH BANNER */}
      <div 
        className="text-white py-5 px-3 position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0d6efd 0%, #1e3a8a 100%)',
        }}
      >
        <div className="container-xl text-center py-4 position-relative" style={{ zIndex: 2 }}>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="badge bg-white bg-opacity-25 text-white px-3 py-1.5 rounded-pill mb-3 small fw-semibold">
              <i className="bi bi-question-circle-fill me-1"></i> Pusat Informasi & Bantuan
            </span>
            <h1 className="fw-bold mb-3 display-6">Frequently Asked Questions (FAQ)</h1>
            <p className="text-white-50 mx-auto mb-4" style={{ maxWidth: '600px' }}>
              Temukan jawaban cepat untuk pertanyaan umum seputar akun, jadwal praktikum, unduh materi, pengumpulan tugas, dan presensi.
            </p>

            {/* Live Search Input */}
            <div className="mx-auto position-relative" style={{ maxWidth: '580px' }}>
              <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fs-5"></i>
              <input
                type="text"
                className="form-control form-control-lg rounded-pill ps-5 pe-5 shadow border-0"
                placeholder="Cari pertanyaan... (contoh: tugas, deadline, lupa password)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '1rem', height: '54px' }}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="btn border-0 text-muted position-absolute top-50 end-0 translate-middle-y me-3"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="bi bi-x-circle-fill"></i>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="container-xl py-5">
        
        {/* CATEGORY FILTER PILLS */}
        <div className="d-flex flex-wrap justify-content-center gap-2 mb-5">
          {FAQ_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`btn rounded-pill px-3.5 py-2 d-flex align-items-center gap-2 transition-all small fw-semibold shadow-sm ${
                  isActive ? 'btn-primary shadow' : 'btn-white bg-white text-dark border-light-subtle'
                }`}
                style={{ transition: 'all 0.2s ease' }}
              >
                <i className={`bi ${cat.icon} ${isActive ? 'text-white' : 'text-primary'}`}></i>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ACCORDION FAQ ITEMS */}
        <div className="mx-auto" style={{ maxWidth: '820px' }}>
          {filteredFaqs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-4 p-5 text-center shadow-sm border border-light-subtle"
            >
              <i className="bi bi-search text-muted display-4 mb-3 d-block opacity-50"></i>
              <h5 className="fw-bold text-dark mb-1">Pertanyaan Tidak Ditemukan</h5>
              <p className="text-muted small mb-4">
                Tidak ada FAQ yang cocok dengan kata kunci "<strong>{searchQuery}</strong>".
              </p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  className="btn btn-outline-primary btn-sm rounded-pill px-3"
                >
                  Reset Filter
                </button>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="btn btn-primary btn-sm rounded-pill px-3"
                >
                  Tanyakan ke Admin Lab
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filteredFaqs.map((faq) => {
                const isOpen = openItem === faq.id;
                return (
                  <motion.div
                    key={faq.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-4 border transition-all shadow-sm ${
                      isOpen ? 'border-primary shadow' : 'border-light-subtle'
                    }`}
                    style={{ overflow: 'hidden' }}
                  >
                    <button
                      type="button"
                      className="w-100 text-start p-4 bg-transparent border-0 d-flex justify-content-between align-items-center gap-3 cursor-pointer"
                      onClick={() => toggleAccordion(faq.id)}
                    >
                      <span className="fw-semibold text-dark fs-6 d-flex align-items-center gap-2">
                        <i className={`bi bi-question-circle-fill ${isOpen ? 'text-primary' : 'text-muted'}`}></i>
                        <span>{faq.question}</span>
                      </span>
                      <span
                        className={`badge rounded-circle p-2 d-flex align-items-center justify-content-center transition-all ${
                          isOpen ? 'bg-primary text-white' : 'bg-light text-muted'
                        }`}
                        style={{ width: '32px', height: '32px' }}
                      >
                        <i className={`bi ${isOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                      </span>
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="px-4 pb-4 pt-1 text-muted small border-top border-light-subtle lh-lg">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* CONTACT INFO CARD (DYNAMICALLY LOADED FROM MariaDB SystemSettings) */}
          <div className="mt-5 p-4 rounded-4 bg-white border border-light-subtle shadow-sm text-center">
            <div className="d-inline-flex p-3 rounded-circle bg-primary-subtle text-primary mb-3">
              <i className="bi bi-headset fs-2"></i>
            </div>
            <h4 className="fw-bold text-dark mb-2">Masih Membutuhkan Bantuan?</h4>
            <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '520px' }}>
              Jika Anda mengalami kendala teknis praktikum yang belum terjawab di FAQ, Anda dapat menghubungi tim administrator laboratorium langsung.
            </p>

            <div className="d-flex flex-wrap justify-content-center gap-3">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-success rounded-pill px-4 py-2.5 d-flex align-items-center gap-2 fw-semibold shadow-sm"
                style={{ backgroundColor: '#25D366', borderColor: '#25D366' }}
              >
                <i className="bi bi-whatsapp fs-5"></i>
                <span>Hubungi via WhatsApp ({contactData.phone})</span>
              </a>

              <button
                type="button"
                onClick={() => setShowContactModal(true)}
                className="btn btn-outline-primary rounded-pill px-4 py-2.5 fw-semibold"
              >
                <i className="bi bi-info-circle me-1.5"></i>
                Lihat Detail Kontak & Jam Kerja
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="text-center py-4 text-muted small border-top bg-white mt-5">
        &copy; {new Date().getFullYear()} Laboratorium Teknik Informatika &bull; PRAKTIS System
      </footer>

      {/* Contact Support Modal */}
      <ContactSupportModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
      />
    </div>
  );
};

export default Faq;
