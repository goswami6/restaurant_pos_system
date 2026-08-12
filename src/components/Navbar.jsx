import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePOS } from '../context/POSContext';

const Navbar = ({ setShowReservationModal }) => {
    const { posSettings, fetchTables, fetchOrders, showToast } = usePOS();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([fetchTables(), fetchOrders()]);
            showToast('success', '🔄 Sync Complete', 'Tables & Orders refreshed');
        } catch (err) {
            console.warn('Manual refresh failed:', err.message);
        } finally {
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    const currentPath = location.pathname.replace('/', '') || 'order';
    const navTo = (path) => {
        navigate('/' + path);
        setMobileMenuOpen(false);
    };

    const navItems = [
        { path: 'menu', label: 'Menu', iconClass: 'bi-journal-richtext' },
        { path: 'order', label: 'Order', iconClass: 'bi-cart3' },
        ...(posSettings.isEnableTables ? [{ path: 'tables', label: 'Tables', iconClass: 'bi-grid-3x3-gap-fill' }] : []),
        { path: 'staff', label: 'Staff', iconClass: 'bi-people-fill' },
        { path: 'settings', label: 'Settings', iconClass: 'bi-gear-fill' },
        { path: 'history', label: 'History', iconClass: 'bi-clock-history' },
    ];

    const currentItem = navItems.find(item => item.path === currentPath || (item.path === 'history' && currentPath.startsWith('history/'))) || navItems[1];

    return (
        <header className="position-relative" style={{ zIndex: 1000 }}>
            <nav className="top-nav">
                {/* Mobile Header Bar (Clean & Modern with Real Bootstrap Icons) */}
                <div className="d-flex d-md-none align-items-center justify-content-between w-100 py-0 px-1 gap-2">
                    {/* Clean Hamburger Icon Button */}
                    <button 
                        onClick={() => setMobileMenuOpen(true)}
                        aria-label="Toggle navigation menu"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            padding: '4px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <i className="bi bi-list text-white fs-3"></i>
                    </button>

                    {/* Centered Page Title with Real Icon */}
                    <div 
                        style={{
                            color: '#ffffff',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <i className={`bi ${currentItem.iconClass} text-info`}></i>
                        <span>{currentItem.label}</span>
                    </div>

                    <div className="d-flex align-items-center gap-1">
                        <button
                            type="button"
                            onClick={handleManualRefresh}
                            className="btn btn-sm btn-outline-light d-flex align-items-center justify-content-center p-1 rounded-2"
                            title="Refresh Data"
                            disabled={isRefreshing}
                        >
                            <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin-anim' : ''}`}></i>
                        </button>
                        {/* Reservation Button */}
                        {posSettings.isEnableTables ? (
                            <button 
                                className="btn-reservation" 
                                onClick={() => setShowReservationModal(true)}
                                style={{ padding: '5px 10px', fontSize: '0.72rem', borderRadius: '8px', margin: 0 }}
                            >
                                + Res
                            </button>
                        ) : null}
                    </div>
                </div>

                {/* Desktop Navigation Links with Real Icons */}
                <ul className="nav-links d-none d-md-flex">
                    {navItems.map(item => {
                        const isActive = currentPath === item.path || (item.path === 'history' && currentPath.startsWith('history/'));
                        return (
                            <li 
                                key={item.path}
                                className={isActive ? 'active' : ''} 
                                onClick={() => navTo(item.path)}
                            >
                                <i className={`bi ${item.iconClass} me-1.5`} style={{ fontSize: '0.95rem' }}></i>
                                <span style={{ fontSize: '0.8rem', letterSpacing: '0.02em' }}>{item.label}</span>
                            </li>
                        );
                    })}
                </ul>

                {/* Desktop Action Area: Refresh + Reservation Button */}
                <div className="d-none d-md-flex align-items-center gap-2">
                    <button
                        type="button"
                        onClick={handleManualRefresh}
                        className="btn btn-sm btn-outline-light text-xs font-bold rounded-2 px-2.5 py-1.5 d-flex align-items-center gap-1.5"
                        disabled={isRefreshing}
                    >
                        <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin-anim' : ''}`}></i>
                        <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                    </button>
                    {posSettings.isEnableTables && (
                        <button className="btn-reservation" onClick={() => setShowReservationModal(true)}>
                            <span>+ New Reservation</span>
                        </button>
                    )}
                </div>
            </nav>

            {/* Mobile Offcanvas Left-to-Right Side Drawer Overlay */}
            {mobileMenuOpen && (
                <div className="d-md-none">
                    {/* Backdrop Blur Overlay */}
                    <div 
                        onClick={() => setMobileMenuOpen(false)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            backgroundColor: 'rgba(15, 23, 42, 0.75)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 9998
                        }}
                    />

                    {/* Left Side Drawer */}
                    <div 
                        style={{
                            position: 'fixed',
                            top: 0,
                            bottom: 0,
                            left: 0,
                            width: '285px',
                            maxWidth: '85vw',
                            backgroundColor: '#0f172a',
                            borderRight: '1px solid #1e293b',
                            boxShadow: '10px 0 30px rgba(0, 0, 0, 0.5)',
                            zIndex: 9999,
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                    >
                        {/* Drawer Header */}
                        <div 
                            style={{
                                padding: '18px 20px',
                                borderBottom: '1px solid #1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#1e293b'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <i className="bi bi-shop text-primary fs-4"></i>
                                <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '1.05rem', letterSpacing: '0.02em' }}>
                                    POS Navigation
                                </span>
                            </div>
                            <button
                                onClick={() => setMobileMenuOpen(false)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: 'none',
                                    color: '#ffffff',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <i className="bi bi-x-lg text-white" style={{ fontSize: '0.95rem' }}></i>
                            </button>
                        </div>

                        {/* Drawer Items */}
                        <div style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 8px 10px 8px' }}>
                                Navigation Menu
                            </div>
                            {navItems.map(item => {
                                const isActive = currentPath === item.path || (item.path === 'history' && currentPath.startsWith('history/'));
                                return (
                                    <div
                                        key={item.path}
                                        onClick={() => navTo(item.path)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '14px',
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            marginBottom: '6px',
                                            cursor: 'pointer',
                                            backgroundColor: isActive ? '#2563eb' : 'transparent',
                                            color: isActive ? '#ffffff' : '#94a3b8',
                                            fontWeight: isActive ? 700 : 600,
                                            fontSize: '0.92rem',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <i className={`bi ${item.iconClass}`} style={{ fontSize: '1.15rem', width: '24px', textAlign: 'center' }}></i>
                                        <span>{item.label} Page</span>
                                        {isActive && (
                                            <span style={{ marginLeft: 'auto', fontSize: '0.7rem', backgroundColor: 'rgba(255, 255, 255, 0.25)', padding: '2px 8px', borderRadius: '12px' }}>
                                                Active
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Drawer Footer */}
                        <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b', backgroundColor: '#090d16' }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                                Self POS System • v1.0
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Navbar;
