// src/layouts/LayoutAsdos.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import '../assets/css/asdos-theme.css'; // ADDED FOR THEME

const LayoutAsdos = () => {
    return (
        <div className="asdos-dark-glass-theme">
            <Header />

            <div className="d-flex" id="wrapper">
                
                {/* Konten Kanan - Full Width */}
                <div 
                    id="page-content-wrapper" 
                    className="d-flex flex-column w-100" 
                    style={{ minHeight: '100vh' }}
                >
                    {/* Outlet */}
                    <div className="container-fluid px-4 py-4 flex-grow-1">
                        <Outlet />
                    </div>

                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default LayoutAsdos;