// client/src/components/ContactSupportModal.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const ContactSupportModal = ({ isOpen, onClose }) => {
  const [contact, setContact] = useState({
    phone: '081234567890',
    email: 'lab@praktis.ac.id',
    hours: 'Senin - Jumat, 08:00 - 16:00 WIB',
    whatsappUrl: '',
    whatsappNumber: '6281234567890',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchContact = async () => {
        setLoading(true);
        try {
          const res = await api.get('/api/settings/contact');
          if (res.data?.success && res.data?.data) {
            setContact(res.data.data);
          }
        } catch (err) {
          console.error('Failed to fetch contact info:', err);
        } finally {
          setLoading(false);
        }
      };

      fetchContact();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultWaUrl = contact.whatsappUrl || `https://wa.me/${contact.whatsappNumber || '6281234567890'}?text=${encodeURIComponent('Halo Admin PRAKTIS, saya membutuhkan bantuan.')}`;

  return (
    <AnimatePresence>
      <div 
        className="modal-backdrop fade show position-fixed top-0 start-0 w-100 h-100" 
        style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1050 }}
        onClick={onClose}
      ></div>

      <div 
        className="modal fade show d-block position-fixed top-0 start-0 w-100 h-100" 
        tabIndex="-1" 
        style={{ zIndex: 1055, overflowY: 'auto' }}
        onClick={onClose}
      >
        <div 
          className="modal-dialog modal-dialog-centered" 
          style={{ maxWidth: '480px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="modal-content border-0 shadow-lg rounded-4 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="modal-header border-0 bg-primary text-white p-4 position-relative">
              <div>
                <span className="badge bg-white text-primary mb-2 px-2.5 py-1 rounded-pill fw-semibold">
                  <i className="bi bi-shield-check me-1"></i> Helpdesk Resmi
                </span>
                <h5 className="modal-title fw-bold mb-1">Kontak Bantuan Laboratorium</h5>
                <p className="small mb-0 text-white-50">
                  Hubungi tim administrator laboratorium jika Anda membutuhkan bantuan teknis.
                </p>
              </div>
              <button 
                type="button" 
                className="btn-close btn-close-white position-absolute top-0 end-0 m-3" 
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>

            {/* Modal Body */}
            <div className="modal-body p-4 bg-light">
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary spinner-border-sm me-2" role="status"></div>
                  <span className="text-muted small">Memuat informasi kontak...</span>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {/* WhatsApp Quick Action Button */}
                  <a
                    href={defaultWaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-success d-flex align-items-center justify-content-center gap-2 py-3 px-4 rounded-3 shadow-sm fw-bold hover-lift text-decoration-none"
                    style={{ background: '#25D366', borderColor: '#25D366' }}
                  >
                    <i className="bi bi-whatsapp fs-5"></i>
                    <span>Chat WhatsApp Admin Lab</span>
                  </a>

                  {/* Contact Details Card */}
                  <div className="bg-white p-3 rounded-3 border border-light-subtle shadow-sm">
                    <div className="d-flex align-items-center gap-3 py-2 border-bottom">
                      <div className="bg-primary-subtle text-primary p-2.5 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                        <i className="bi bi-telephone-fill fs-5"></i>
                      </div>
                      <div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>NOMOR TELEPON / HP</div>
                        <a href={`tel:${contact.phone}`} className="fw-semibold text-dark text-decoration-none">
                          {contact.phone}
                        </a>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 py-2 border-bottom">
                      <div className="bg-info-subtle text-info p-2.5 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                        <i className="bi bi-envelope-fill fs-5"></i>
                      </div>
                      <div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>ALAMAT EMAIL RESMI</div>
                        <a href={`mailto:${contact.email}`} className="fw-semibold text-dark text-decoration-none">
                          {contact.email}
                        </a>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 py-2">
                      <div className="bg-warning-subtle text-warning p-2.5 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
                        <i className="bi bi-clock-history fs-5"></i>
                      </div>
                      <div>
                        <div className="text-muted small" style={{ fontSize: '0.75rem' }}>JAM OPERASIONAL HELPDESK</div>
                        <div className="fw-semibold text-dark">
                          {contact.hours}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-muted" style={{ fontSize: '0.75rem' }}>
                    Mohon sebutkan <strong>NIM</strong> dan <strong>Mata Praktikum</strong> Anda saat menghubungi admin laboratorium.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer border-0 bg-white p-3 d-flex justify-content-end">
              <button 
                type="button" 
                className="btn btn-outline-secondary rounded-3 px-4 py-2 small fw-medium"
                onClick={onClose}
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ContactSupportModal;
