import React from 'react';
import { useAuth } from '../context/authContext';
import SidebarNavLink from './SidebarNavLink';

const SidebarAdmin = () => {
    // 2. Get logout function from context
    const { logout } = useAuth();

    const handleLogout = (e) => {
        e.preventDefault();
        if (window.confirm("Yakin ingin keluar?")) {
            logout(); // 3. Use the robust logout function
        }
    };

    return (
        <div className="d-flex flex-column h-100" id="sidebar-wrapper">
            <div className="sidebar-heading text-center py-4 primary-text fs-4 fw-bold text-uppercase border-bottom">
                <i className="bi bi-shield-lock me-2 text-primary"></i>Admin
            </div>

            <div className="list-group list-group-flush my-3 px-2 flex-grow-1">
                <SidebarNavLink 
                    to="/admin/dashboard" 
                    icon="bi-speedometer2" 
                    label="Dashboard" 
                />

                <SidebarNavLink 
                    to="/admin/users" 
                    icon="bi-people" 
                    label="Manajemen User" 
                />

                <SidebarNavLink 
                    to="/admin/praktikum" 
                    icon="bi-journal-bookmark" 
                    label="Manajemen Praktikum" 
                />

                <SidebarNavLink 
                    to="/admin/files" 
                    icon="bi-folder2-open" 
                    label="Manajemen Berkas" 
                />

                <SidebarNavLink 
                    to="/admin/sessions" 
                    icon="bi-shield-slash" 
                    label="Keamanan & Sesi IP" 
                />

                <SidebarNavLink 
                    to="/admin/contact-settings" 
                    icon="bi-headset" 
                    label="Kontak & Helpdesk" 
                />

            </div>
        </div>
    );
};

export default SidebarAdmin;