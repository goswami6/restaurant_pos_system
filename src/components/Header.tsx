import React, { useState } from 'react';
import { Bell, Menu as MenuIcon, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface HeaderProps {
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <nav className="navbar sticky top-0 z-50 bg-white shadow-sm border-b border-gray-150">
      <div className="flex min-h-[60px] w-full items-center justify-between px-3 sm:px-6 py-2">
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

        {/* CENTER: Desktop Navigation Tabs for Staff/Waiters */}
        {user && !user.isGuest && (
          <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <Link 
              to={table ? `/?table=${table}` : "/"} 
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
                currentPath === '/' 
                  ? 'bg-white text-[#0077b6] shadow-xs' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              🍔 Menu
            </Link>
            <Link 
              to="/tables" 
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
                currentPath === '/tables' 
                  ? 'bg-white text-[#0077b6] shadow-xs' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              📋 Tables
            </Link>
            <Link 
              to="/history" 
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${
                currentPath === '/history' 
                  ? 'bg-white text-[#0077b6] shadow-xs' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              ⏳ History
            </Link>
          </div>
        )}

        {/* RIGHT: Desktop User Phone, Notifications & Actions */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {user && !user.isGuest && (
            <span className="text-xs text-gray-500 font-semibold">
              📱 {user.phone}
            </span>
          )}
          {onLogout && user && !user.isGuest && (
            <button 
              onClick={onLogout}
              className="text-xs font-semibold text-red-500 hover:text-red-700 cursor-pointer border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-md transition-colors"
            >
              Logout
            </button>
          )}
          <button id="notification-btn" className="text-gray-700 hover:text-[#0077b6] transition-colors cursor-pointer p-1">
            <Bell size={18} />
          </button>
        </div>

        {/* MOBILE TOGGLE BUTTON (Visible on < md screens) */}
        <div className="flex md:hidden items-center gap-2">
          <button id="notification-btn-mobile" className="text-gray-700 hover:text-[#0077b6] p-1 cursor-pointer">
            <Bell size={18} />
          </button>
          {user && !user.isGuest && (
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100 transition-all cursor-pointer"
              title="Toggle Menu"
            >
              {isMobileMenuOpen ? <X size={20} /> : <MenuIcon size={20} />}
            </button>
          )}
        </div>
      </div>

      {/* MOBILE MENU DRAWER */}
      {isMobileMenuOpen && user && !user.isGuest && (
        <div className="md:hidden bg-gray-50 border-t border-gray-200 p-3 space-y-2.5 animate-in slide-in-from-top-2 duration-150">
          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <Link 
              to={table ? `/?table=${table}` : "/"} 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-2 rounded-lg transition-all ${
                currentPath === '/' 
                  ? 'bg-[#0077b6] text-white shadow-xs' 
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              🍔 Menu
            </Link>
            <Link 
              to="/tables" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-2 rounded-lg transition-all ${
                currentPath === '/tables' 
                  ? 'bg-[#0077b6] text-white shadow-xs' 
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              📋 Tables
            </Link>
            <Link 
              to="/history" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-2 rounded-lg transition-all ${
                currentPath === '/history' 
                  ? 'bg-[#0077b6] text-white shadow-xs' 
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              ⏳ History
            </Link>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-200 text-xs">
            <span className="text-gray-600 font-semibold">
              📱 {user.phone}
            </span>
            {onLogout && (
              <button 
                onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                className="font-bold text-red-600 hover:text-red-800 bg-red-50 border border-red-200 px-3 py-1 rounded-md transition-colors"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Header;
