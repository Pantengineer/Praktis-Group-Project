import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // 1. Import Link
import { useAuth } from '../context/authContext'; // 2. Import Auth Context

// Default placeholder image
const profileImg = "https://via.placeholder.com/42";

const Header = () => {
  const { user, logout } = useAuth(); // 3. Get current user data

  const getProfileLink = () => {
    const roles = user?.roles || []; // Safely access roles array

    if (roles.includes('admin')) return '/admin/profile';
    if (roles.includes('asdos')) return '/asdos/profile';
    if (roles.includes('mahasiswa')) return '/mahasiswa/profile';

    return '/profile'; // Fallback
  };

  const getTimelineLink = () => {
    const roles = user?.roles || [];
    if (roles.includes('admin')) return '/admin/timeline';
    if (roles.includes('asdos')) return '/asdos/timeline';
    if (roles.includes('mahasiswa')) return '/mahasiswa/timeline';
    return '/timeline';
  };

  const profileImg = user?.nama ? `https://ui-avatars.com/api/?name=${user.nama}&background=random&size=42` : "https://via.placeholder.com/42";

  // Hide on scroll logic
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Hides navbar if scrolling down, shows if scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Navbar Fixed Top */}
      <nav
        className="navbar navbar-expand-lg navbar-dark bg-primary border-bottom shadow-sm fixed-top py-3"
        style={{ 
          zIndex: 1050,
          transform: showNavbar ? 'translateY(0)' : 'translateY(-100%)',
          transition: 'transform 0.3s ease-in-out'
        }}
      >
        <div className="container-fluid px-4">

          {/* Brand Logo & Timeline Navigation Link */}
          <div className="d-flex align-items-center gap-3">
            <Link className="navbar-brand fw-bold d-flex align-items-center mb-0 me-2" to="/">
              <span style={{ letterSpacing: '1px', fontSize: '1.3rem' }}>
                PRAKTIS
              </span>
            </Link>

            <Link 
              to={getTimelineLink()} 
              className="btn btn-outline-light btn-sm rounded-pill px-3 py-1.5 fw-bold d-inline-flex align-items-center gap-2 border-opacity-50"
              style={{ fontSize: '0.85rem' }}
            >
              <i className="bi bi-signpost-split"></i>
              <span>TIMELINE</span>
            </Link>
          </div>

          {/* Bagian Kanan (Profile User) */}
          <div className="dropdown">
            <button
              className="btn d-flex align-items-center text-white gap-3 text-decoration-none border-0 bg-transparent p-0"
              type="button"
              id="profileDropdown"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{ boxShadow: 'none' }}
            >
              <div className="text-end d-none d-md-block line-height-sm">
                <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                  {user?.nama || 'User'}
                </div>
                <div className="text-white-50 small" style={{ fontSize: '0.75rem' }}>
                  {user?.role === 'admin' ? 'Administrator' : (user?.prodi || user?.role)}
                </div>
              </div>

              <img
                src={profileImg}
                className="rounded-circle border border-2 border-white shadow-sm"
                width="42"
                height="42"
                alt="Profile"
                style={{ objectFit: 'cover' }}
              />
            </button>
            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2" aria-labelledby="profileDropdown">
              <li>
                <Link className="dropdown-item" to={getProfileLink()}>
                  <i className="bi bi-person me-2"></i>Profile
                </Link>
              </li>
              {user?.roles?.length > 1 && (
                <li>
                  <Link className="dropdown-item" to="/auth/role-selection">
                    <i className="bi bi-arrow-repeat me-2"></i>Ganti Peran
                  </Link>
                </li>
              )}
              <li>
                <Link className="dropdown-item" to="/faq">
                  <i className="bi bi-question-circle me-2"></i>Bantuan &amp; FAQ
                </Link>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button className="dropdown-item text-danger" onClick={() => logout && logout()}>
                  <i className="bi bi-box-arrow-right me-2"></i>Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Spacer agar konten tidak ketutup Navbar (Margin Top 78px) */}
      <div style={{ marginTop: '78px' }}></div>
    </>
  );
};

export default Header;