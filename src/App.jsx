import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { POSProvider } from './context/POSContext';
import Login from './Login';

// Pages
import TablesPage from './pages/TablesPage';
import OrderPage from './pages/OrderPage';
import MenuView from './pages/MenuView';
import StaffPage from './pages/StaffPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import OrderDetailPage from './pages/OrderDetailPage';

// Layout
import AppLayout from './components/AppLayout';

function App() {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('pos_user');
        return saved ? JSON.parse(saved) : null;
    });

    const handleLogin = (userData) => {
        localStorage.setItem('pos_user', JSON.stringify(userData));
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('pos_user');
        setUser(null);
    };

    if (!user) return <Login onLogin={handleLogin} />;

    return (
        <BrowserRouter>
            <POSProvider user={user} onLogout={handleLogout}>
                <Routes>
                    <Route path="/" element={<AppLayout />}>
                        <Route index element={<Navigate to="/order" replace />} />
                        <Route path="tables" element={<TablesPage />} />
                        <Route path="order" element={<OrderPage />} />
                        <Route path="menu" element={<MenuView />} />
                        <Route path="staff" element={<StaffPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="history" element={<HistoryPage />} />
                        <Route path="history/:id" element={<OrderDetailPage />} />
                        <Route path="*" element={<Navigate to="/order" replace />} />
                    </Route>
                </Routes>
            </POSProvider>
        </BrowserRouter>
    );
}

export default App;