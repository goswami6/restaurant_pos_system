import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
  const urlRid =
    queryParams.get('id') ||
    queryParams.get('restaurant_id') ||
    queryParams.get('restaurantId') ||
    queryParams.get('restaurant') ||
    queryParams.get('rest_id') ||
    queryParams.get('rid');

  if (urlRid) {
    const cleanId = parseInt(urlRid, 10);
    if (!isNaN(cleanId) && cleanId > 0) {
      sessionStorage.setItem('emenu_restaurant_id', String(cleanId));
    }
  }

  return <MenuPage onLogout={onLogout} />;
};

function App() {
  const [user, setUser] = useState<any>(() => {
    const savedUser = localStorage.getItem('emenu_user');
    if (savedUser) return JSON.parse(savedUser);

    // Default guest customer session for QR code scan & direct browsing (NO login required)
    const defaultUser = { phone: 'Guest Customer', isGuest: true };
    localStorage.setItem('emenu_user', JSON.stringify(defaultUser));
    return defaultUser;
  });

  React.useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlRid =
      queryParams.get('id') ||
      queryParams.get('restaurant_id') ||
      queryParams.get('restaurantId') ||
      queryParams.get('restaurant') ||
      queryParams.get('rest_id') ||
      queryParams.get('rid');

    if (urlRid) {
      const cleanId = parseInt(urlRid, 10);
      if (!isNaN(cleanId) && cleanId > 0) {
        sessionStorage.setItem('emenu_restaurant_id', String(cleanId));
      }
    }
  }, []);

  const handleLogin = (userData: any) => {
    // Clear guest table override when staff/waiter logs in
    sessionStorage.removeItem('emenu_table');
    const staffUser = { ...userData, isGuest: false };
    localStorage.setItem('emenu_user', JSON.stringify(staffUser));
    setUser(staffUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('emenu_user');
    sessionStorage.removeItem('emenu_table');
    // Fallback to guest mode so customer can still browse menu
    const guestUser = { phone: 'Guest Customer', isGuest: true };
    localStorage.setItem('emenu_user', JSON.stringify(guestUser));
    setUser(guestUser);
  };

  return (
    <Router>
      <ToastContainer position="top-center" autoClose={2000} hideProgressBar={true} newestOnTop closeOnClick pauseOnHover theme="colored" />
      <Routes>
        <Route 
          path="/login" 
          element={user && !user.isGuest ? <Navigate to="/tables" replace /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/" 
          element={<MenuRouteWrapper onLogout={handleLogout} />} 
        />
        <Route 
          path="/menu" 
          element={<MenuRouteWrapper onLogout={handleLogout} />} 
        />
        <Route 
          path="/cart" 
          element={<CartPage />} 
        />
        <Route 
          path="/order-info" 
          element={<OrderInfoPage />} 
        />
        <Route 
          path="/order-number" 
          element={<OrderNumberPage />} 
        />
        <Route 
          path="/tables" 
          element={user && !user.isGuest ? <TablesPage /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/history" 
          element={user && !user.isGuest ? <HistoryPage /> : <Navigate to="/" replace />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
