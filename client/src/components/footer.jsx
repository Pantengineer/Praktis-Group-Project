import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="py-4 bg-light mt-auto border-top">
            <div className="container-fluid px-4">
                <div className="d-flex align-items-center justify-content-between small">
                    <div className="text-muted">Copyright &copy; PRAKTIS System 2026</div>
                    <div className="d-flex align-items-center gap-2">
                        <Link to="/faq" className="text-decoration-none text-muted">
                            Pusat Bantuan &amp; FAQ
                        </Link>
                        <span>&middot;</span>
                        <a href="#" className="text-decoration-none text-muted">Privacy Policy</a>
                        <span>&middot;</span>
                        <a href="#" className="text-decoration-none text-muted">Terms</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;