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
    <nav className="navbar sticky top-0 z-50 flex min-h-[60px] w-full items-center justify-between bg-white px-3 sm:px-6 py-2 shadow-sm border-b border-gray-150">
      {/* LEFT: Logo & Restaurant Title */}
      <div className="logo-section flex items-center min-w-0">
        <span className="logo text-lg sm:text-xl mr-1.5 flex-shrink-0">🏠</span>
        <div className="shop-name text-sm sm:text-base md:text-lg font-extrabold text-[#0077b6] flex items-center gap-1.5 min-w-0 truncate">
          <span className="truncate">BIG BEN RESTAURANT</span>
          {table && (
            <span className="bg-[#e8f8f0] text-[#2ecc71] border border-[#2ecc71]/20 text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold flex-shrink-0">
              {displayTable}
            </span>
          )}
        </div>
      </div>

      {/* CENTER: Navigation Tabs for Staff/Waiters */}
      {user && !user.isGuest && (
        <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-100 p-1 rounded-lg flex-shrink-0 mx-1">
          <Link 
            to={table ? `/?table=${table}` : "/"} 
            className={`text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all ${
              currentPath === '/' 
                ? 'bg-white text-[#0077b6] shadow-xs' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            🍔 <span className="hidden sm:inline">Menu</span>
          </Link>
          <Link 
            to="/tables" 
            className={`text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all ${
              currentPath === '/tables' 
                ? 'bg-white text-[#0077b6] shadow-xs' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 <span className="hidden sm:inline">Tables</span>
          </Link>
          <Link 
            to="/history" 
            className={`text-[11px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all ${
              currentPath === '/history' 
                ? 'bg-white text-[#0077b6] shadow-xs' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ⏳ <span className="hidden sm:inline">History</span>
          </Link>
        </div>
      )}

      {/* RIGHT: User Phone, Notifications & Actions */}
      <div className="icons flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {user && !user.isGuest && (
          <span className="text-[11px] sm:text-xs text-gray-500 font-semibold hidden md:inline-block">
            📱 {user.phone}
          </span>
        )}
        {onLogout && user && !user.isGuest && (
          <button 
            onClick={onLogout}
            className="text-[11px] sm:text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer border border-red-200 hover:bg-red-50 px-2 py-1 rounded-md transition-colors"
          >
            Logout
          </button>
        )}
        <button id="notification-btn" className="text-gray-700 hover:text-[#0077b6] transition-colors cursor-pointer p-1">
          <Bell size={18} className="sm:w-5 sm:h-5" />
        </button>
      </div>
    </nav>
  );
};

export default Header;
