// src/layouts/LayoutMhs.jsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/header';
import Footer from '../components/footer';
import ErrorBoundary from '../components/ErrorBoundary';
import '../assets/css/asdos-theme.css';

const LayoutMhs = () => {
    return (
        <div className="mahasiswa-dark-glass-theme">
            <Header />

            <div className="d-flex" id="wrapper">
                {/* Full-width Glass Content Area */}
                <div 
                    id="page-content-wrapper" 
                    className="d-flex flex-column w-100" 
                    style={{ minHeight: '100vh' }}
                >
                    <div className="container-fluid px-4 py-4 flex-grow-1">
                        <ErrorBoundary>
                            <Outlet />
                        </ErrorBoundary>
                    </div>

                    <Footer />
                </div>
            </div>
        </div>
    );
};

export default LayoutMhs;