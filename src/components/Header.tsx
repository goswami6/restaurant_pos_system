import React from 'react';
import { Bell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const savedUser = localStorage.getItem('emenu_user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  const table = React.useMemo(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const urlTable = queryParams.get('table') || queryParams.get('table_number');
    if (urlTable) {
      const clean = String(urlTable).replace(/[^0-9]/g, '');
      sessionStorage.setItem('emenu_table', clean || urlTable);
      return clean || urlTable;
    }
    const stored = sessionStorage.getItem('emenu_table') || '';
    const cleanStored = String(stored).replace(/[^0-9]/g, '');
    return cleanStored || stored;
  }, []);

  const displayTable = React.useMemo(() => {
    if (!table) return '';
    const clean = String(table).replace(/[^0-9]/g, '');
    return clean ? `Table #${clean}` : table;
  }, [table]);

  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="navbar sticky top-0 z-50 flex h-[10vh] w-full items-center justify-between bg-white px-[3%] py-[1.5%] shadow-md">
      {/* LEFT: Logo & Restaurant Title */}
      <div className="logo-section flex items-center">
        <div className="logo flex items-center text-xl">🏠</div>
        <div className="shop-name ml-[5px] text-[20px] font-bold text-[#0077b6] flex items-center gap-2">
          BIG BEN RESTAURANT
          {table && (
            <span className="bg-[#e8f8f0] text-[#2ecc71] border border-[#2ecc71]/20 text-[11px] px-2 py-0.5 rounded-full font-bold">
              {displayTable}
            </span>
          )}
        </div>
      </div>

      {/* CENTER: Navigation Tabs for Staff/Waiters */}
      {user && !user.isGuest && (
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
          <Link 
            to={table ? `/?table=${table}` : "/"} 
            className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
              currentPath === '/' 
                ? 'bg-white text-[#0077b6] shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🍔 Menu
          </Link>
          <Link 
            to="/tables" 
            className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
              currentPath === '/tables' 
                ? 'bg-white text-[#0077b6] shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Tables
          </Link>
          <Link 
            to="/history" 
            className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
              currentPath === '/history' 
                ? 'bg-white text-[#0077b6] shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ⏳ History
          </Link>
        </div>
      )}

      {/* RIGHT: User Phone, Notifications & Actions */}
      <div className="icons flex items-center gap-[15px] text-[20px]">
        {user && !user.isGuest && (
          <span className="text-xs text-gray-500 font-semibold">
            📱 {user.phone}
          </span>
        )}
        {onLogout && user && !user.isGuest && (
          <button 
            onClick={onLogout}
            className="text-xs font-semibold text-red-500 hover:text-red-750 cursor-pointer border border-red-200 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
          >
            Logout
          </button>
        )}
        <button id="notification-btn" className="text-black transition-colors hover:text-[#0077b6] cursor-pointer">
          <Bell size={20} />
        </button>
      </div>
    </nav>
  );
};

export default Header;
