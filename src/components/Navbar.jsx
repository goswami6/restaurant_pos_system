import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePOS } from '../context/POSContext';

const Navbar = ({ setShowReservationModal }) => {
    const { posSettings } = usePOS();
    console.log("Navbar: posSettings =", posSettings);
    const navigate = useNavigate();
    const location = useLocation();

    const currentPath = location.pathname.replace('/', '') || 'order';
    const navTo = (path) => navigate('/' + path);

    return (
        <nav className="top-nav">
            <ul className="nav-links">
                <li className={currentPath === 'menu' ? 'active' : ''} onClick={() => navTo('menu')}>
                    <span>☰</span><span className="d-none d-sm-inline ms-1">Menu</span>
                </li>
                <li className={currentPath === 'order' ? 'active' : ''} onClick={() => navTo('order')}>
                    <span>🛒</span><span className="d-none d-sm-inline ms-1">Order</span>
                </li>
                {posSettings.isEnableTables && (
                    <li className={currentPath === 'tables' ? 'active' : ''} onClick={() => navTo('tables')}>
                        <span>🪟</span><span className="d-none d-sm-inline ms-1">Tables</span>
                    </li>
                )}
                <li className={currentPath === 'staff' ? 'active' : ''} onClick={() => navTo('staff')}>
                    <span>👤</span><span className="d-none d-sm-inline ms-1">Staff</span>
                </li>
                <li className={currentPath === 'settings' ? 'active' : ''} onClick={() => navTo('settings')}>
                    <span>⚙️</span><span className="d-none d-sm-inline ms-1">Settings</span>
                </li>
                <li className={currentPath === 'history' || currentPath.startsWith('history/') ? 'active' : ''} onClick={() => navTo('history')}>
                    <span>⏳</span><span className="d-none d-sm-inline ms-1">History</span>
                </li>
            </ul>
            {posSettings.isEnableTables && (
                <button className="btn-reservation" onClick={() => setShowReservationModal(true)}>
                    <span className="d-none d-sm-inline">+ New Reservation</span>
                    <span className="d-inline d-sm-none">+ Res</span>
                </button>
            )}
        </nav>
    );
};

export default Navbar;
