import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MenuPage from './pages/MenuPage';
import CartPage from './pages/CartPage';
import OrderInfoPage from './pages/OrderInfoPage';
import OrderNumberPage from './pages/OrderNumberPage';
import Login from './pages/Login';
import TablesPage from './pages/TablesPage';
import HistoryPage from './pages/HistoryPage';

const MenuRouteWrapper: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const urlTable = queryParams.get('table') || queryParams.get('table_number');

  if (urlTable) {
    sessionStorage.setItem('emenu_table', urlTable);
  }

  return <MenuPage onLogout={onLogout} />;
};

function App() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('emenu_user');
    if (savedUser) return JSON.parse(savedUser);

    // Default guest session for direct customer menu access
    const defaultUser = { phone: 'Guest Customer', isGuest: true };
    localStorage.setItem('emenu_user', JSON.stringify(defaultUser));
    return defaultUser;
  });

  React.useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlTable = queryParams.get('table') || queryParams.get('table_number');
    if (urlTable) {
      sessionStorage.setItem('emenu_table', urlTable);
    }
  }, []);

  const handleLogin = (userData: any) => {
    // Clear any guest table override and set real staff session
    sessionStorage.removeItem('emenu_table');
    const staffUser = { ...userData, isGuest: false };
    localStorage.setItem('emenu_user', JSON.stringify(staffUser));
    setUser(staffUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('emenu_user');
    sessionStorage.removeItem('emenu_table');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user && !user.isGuest ? <Navigate to="/tables" replace /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/" 
          element={user ? <MenuRouteWrapper onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/menu" 
          element={user ? <MenuRouteWrapper onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/cart" 
          element={user ? <CartPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/order-info" 
          element={user ? <OrderInfoPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/order-number" 
          element={user ? <OrderNumberPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/tables" 
          element={user ? <TablesPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/history" 
          element={user ? <HistoryPage /> : <Navigate to="/login" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
