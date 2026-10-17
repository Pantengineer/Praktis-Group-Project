// src/layouts/LayoutAdmin.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SidebarAdmin from '../components/SidebarAdmin';
import Header from '../components/header';
import Footer from '../components/footer';

const LayoutAdmin = () => {
    // State untuk mengatur buka/tutup sidebar di Mobile
    const [isToggled, setIsToggled] = useState(false);

    // Fungsi untuk mengubah status toggle
    const handleToggle = () => {
        setIsToggled(!isToggled);
    };

    return (
        <div className="d-flex flex-column min-vh-100">
            {/* 1. HEADER (Navbar Atas) */}
            <Header />

            <div className={`d-flex flex-grow-1 ${isToggled ? "toggled" : ""}`} id="wrapper">

                {/* 2. SIDEBAR (Kiri) */}
                <div id="sidebar-wrapper-container">
                    <SidebarAdmin />
                </div>

                {/* 3. KONTEN UTAMA (Kanan) */}
                <div id="page-content-wrapper" className="d-flex flex-column flex-grow-1 bg-light">

                    {/* Navbar Mobile (Hanya muncul di layar HP/Kecil) */}
                    <nav className="navbar navbar-expand-lg navbar-light bg-transparent py-3 px-4 d-md-none border-bottom">
                        <div className="d-flex align-items-center">
                            <i
                                className="bi bi-list fs-3 me-3"
                                id="menu-toggle"
                                onClick={handleToggle}
                                style={{ cursor: 'pointer' }}
                            ></i>
                            <h5 className="fw-bold mb-0 text-dark">Menu Admin</h5>
                        </div>
                    </nav>

                    {/* OUTLET (Isi Dashboard) */}
                    <div className="container-fluid px-4 py-4 flex-grow-1">
                        <Outlet />
                    </div>

                    {/* FOOTER */}
                    <Footer />

                </div>
            </div>
        </div>
    );
};

export default LayoutAdmin;