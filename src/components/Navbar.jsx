import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePOS } from '../context/POSContext';

const Navbar = ({ setShowReservationModal }) => {
    const { posSettings } = usePOS();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const currentPath = location.pathname.replace('/', '') || 'order';
    const navTo = (path) => {
        navigate('/' + path);
        setMobileMenuOpen(false);
    };

    const navItems = [
        { path: 'menu', label: 'Menu', icon: '☰' },
        { path: 'order', label: 'Order', icon: '🛒' },
        ...(posSettings.isEnableTables ? [{ path: 'tables', label: 'Tables', icon: '🪟' }] : []),
        { path: 'staff', label: 'Staff', icon: '👤' },
        { path: 'settings', label: 'Settings', icon: '⚙️' },
        { path: 'history', label: 'History', icon: '⏳' },
    ];

    const currentItem = navItems.find(item => item.path === currentPath || (item.path === 'history' && currentPath.startsWith('history/'))) || navItems[1];

    return (
        <header className="position-relative" style={{ zIndex: 1000 }}>
            <nav className="top-nav">
                {/* Mobile Hamburger Toggle Button */}
                <button 
                    className="btn-hamburger d-md-none"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle navigation menu"
                >
                    <span style={{ fontSize: '1.1rem', lineHeight: 1 }}>{mobileMenuOpen ? '✕' : '☰'}</span>
                    <span className="ms-2 fw-bold text-uppercase" style={{ fontSize: '0.82rem', letterSpacing: '0.04em' }}>
                        {currentItem.icon} {currentItem.label}
                    </span>
                    <span className="ms-2 text-slate-400" style={{ fontSize: '0.65rem' }}>{mobileMenuOpen ? '▲' : '▼'}</span>
                </button>

                {/* Desktop Navigation Links */}
                <ul className="nav-links d-none d-md-flex">
                    {navItems.map(item => {
                        const isActive = currentPath === item.path || (item.path === 'history' && currentPath.startsWith('history/'));
                        return (
                            <li 
                                key={item.path}
                                className={isActive ? 'active' : ''} 
                                onClick={() => navTo(item.path)}
                            >
                                <span style={{ fontSize: '0.95rem' }}>{item.icon}</span>
                                <span style={{ fontSize: '0.8rem', letterSpacing: '0.02em' }}>{item.label}</span>
                            </li>
                        );
                    })}
                </ul>

                {/* Reservation Button */}
                {posSettings.isEnableTables && (
                    <button className="btn-reservation" onClick={() => setShowReservationModal(true)}>
                        <span className="d-none d-sm-inline">+ New Reservation</span>
                        <span className="d-inline d-sm-none">+ Res</span>
                    </button>
                )}
            </nav>

            {/* Mobile Dropdown Drawer Menu */}
            {mobileMenuOpen && (
                <div 
                    className="mobile-nav-dropdown d-md-none"
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: '#0f172a',
                        borderBottom: '1px solid #1e293b',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
                    }}
                >
                    {navItems.map(item => {
                        const isActive = currentPath === item.path || (item.path === 'history' && currentPath.startsWith('history/'));
                        return (
                            <div
                                key={item.path}
                                className={`mobile-nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => navTo(item.path)}
                            >
                                <span style={{ fontSize: '1.2rem', width: '24px', textAlign: 'center' }}>{item.icon}</span>
                                <span className="fw-bold" style={{ fontSize: '0.9rem' }}>{item.label} Page</span>
                                {isActive && <span className="ms-auto text-xs bg-white/20 px-2 py-0.5 rounded">Active</span>}
                            </div>
                        );
                    })}
                </div>
            )}
        </header>
    );
};

export default Navbar;
