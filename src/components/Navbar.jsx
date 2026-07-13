import React from 'react';

const Navbar = ({ currentView, setCurrentView, onNewReservationClick }) => {
    return (
        <nav className="top-nav">
            <ul className="nav-links">
                <li className={currentView === 'Menu' ? 'active' : ''} onClick={() => setCurrentView('Menu')}>☰ Menu</li>
                <li className={currentView === 'Order' ? 'active' : ''} onClick={() => setCurrentView('Order')}>🛒 Order</li>
                <li className={currentView === 'Tables' ? 'active' : ''} onClick={() => setCurrentView('Tables')}>🪟 Tables</li>
                <li className={currentView === 'Staff' ? 'active' : ''} onClick={() => setCurrentView('Staff')}>👤 Staff</li>
                <li className={currentView === 'Settings' ? 'active' : ''} onClick={() => setCurrentView('Settings')}>⚙️ Settings</li>
                <li className={currentView === 'History' ? 'active' : ''} onClick={() => setCurrentView('History')}>⏳ History</li>
            </ul>
            <button 
                className="btn-reservation" 
                onClick={onNewReservationClick}
            >
                + New Reservation
            </button>
        </nav>
    );
};

export default Navbar;
