import React, { useState } from 'react';
import { API_BASE_URL } from './config';

const ALLOWED_ROLES = ['admin', 'cashier', 'manager', 'super admin', 'super_admin'];

const Login = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.trim();
    const cleanPassword = password.trim();

    if (!cleanPhone || !cleanPassword) {
      setError('Phone number and password are required.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phone: cleanPhone,
          password: cleanPassword
        })
      });

      const data = await response.json();

      if (!response.ok || data.status === false) {
        setError(data.message || 'Invalid phone number or password.');
        return;
      }

      const userData = data.data || {};
      const roleName = String(userData.role_name || '').toLowerCase();
      const roleAlias = String(userData.role_alias || '').toLowerCase();

      // Role-Based Access Control (RBAC): Only Admin, Cashier, or Manager allowed
      const isRoleAllowed = ALLOWED_ROLES.some(
        allowed => roleName.includes(allowed) || roleAlias.includes(allowed)
      );

      if (!isRoleAllowed) {
        setError('Access Denied.');
        return;
      }

      userData.username = userData.name || userData.phone || 'User';
      onLogin(userData);
    } catch (err) {
      console.error('Login request failed:', err);
      setError('Unable to connect to login server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0f172a] p-0 sm:p-4 font-sans selection:bg-[#0077b6]/30 relative overflow-hidden">
      {/* Ambient background lighting */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-[#0077b6]/15 rounded-full blur-3xl pointer-events-none animate-pulse duration-[6000ms]"></div>
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]"></div>

      {/* Main Outer Card */}
      <div className="relative w-full h-full sm:h-auto min-h-screen sm:min-h-0 max-w-full sm:max-w-md bg-[#0f172a] rounded-none sm:rounded-[32px] shadow-none sm:shadow-2xl overflow-hidden border-0 sm:border sm:border-slate-800 flex flex-col justify-between my-0 sm:my-auto">
        
        {/* Top Header Block */}
        <div className="bg-[#0f172a] text-white px-6 sm:px-6 pt-7 sm:pt-7 pb-11 sm:pb-11 relative flex justify-between items-start flex-shrink-0">
          <div>
            <h1 className="text-3xl sm:text-3xl font-serif font-extrabold tracking-tight text-white mb-0.5">
              Restaurant
            </h1>
            <p className="text-slate-300 font-serif text-sm sm:text-base tracking-wide">
              pos system
            </p>
          </div>

          <div className="relative -mr-1">
            <div className="w-16 h-16 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-slate-100 to-white p-1 shadow-xl border-3 border-[#0f172a] flex items-center justify-center transform transition-transform hover:scale-105">
              <div className="w-full h-full rounded-full bg-[#0f172a]/5 flex items-center justify-center text-2xl sm:text-2xl shadow-inner border border-slate-200/60">
                🍽️
              </div>
            </div>
          </div>
        </div>

        {/* Form Body Panel */}
        <div className="bg-[#f3f4f6] text-slate-900 px-6 sm:px-7 py-7 sm:py-7 rounded-t-[32px] sm:rounded-t-[36px] -mt-5 relative shadow-inner flex-1 flex flex-col justify-between min-h-0">
          <div className="min-h-0 flex-1 flex flex-col justify-start">
            <h2 className="text-2xl sm:text-2xl font-serif font-extrabold text-slate-900 mb-4">
              Sign In
            </h2>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-3 px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2 shadow-xs">
                <span className="text-rose-500 text-xs flex-shrink-0">⚠️</span>
                <span className="leading-tight">{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-serif font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter registered phone"
                    required
                    className="w-full px-4 py-3 sm:py-2.5 bg-white border border-slate-300/80 focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 text-sm font-semibold shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-serif font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full pl-4 pr-10 py-3 sm:py-2.5 bg-white border border-slate-300/80 focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 text-sm font-semibold shadow-xs"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3 flex justify-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-8 bg-[#0f172a] hover:bg-[#0077b6] active:scale-[0.98] text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <span>Sign In to POS</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 mb-2 text-center text-[10px] font-medium text-slate-400 flex-shrink-0">
            POS Access Control &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
