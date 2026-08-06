import React, { useState } from 'react';
import { API_BASE_URL } from './config';

const Login = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() || !password.trim()) {
      setError('Please fill in all fields.');
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
          phone: phone.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful via live API:', data);
        const userData = data.data || {};
        userData.username = userData.name || userData.phone || 'Ravi';
        onLogin(userData);
        return;
      } else {
        throw new Error(data.message || 'Login failed.');
      }
    } catch (err) {
      console.warn('Live API login failed, trying fallback demo credentials. Error:', err.message);
      
      // Fallback local check for demo credentials
      if (phone.trim() === '8269420494' && password.trim() === '12345678') {
        const mockSuccessResponse = {
          "id": "1",
          "name": "Ravi Sen",
          "email": "ravisen68@gmail.com",
          "phone": "8269420494",
          "role_id": "6",
          "role_name": "Super Admin",
          "role_alias": "super_admin",
          "restaurent_id": null,
          "restaurant_name": null,
          "status": "1",
          "username": "Ravi Sen"
        };
        console.log('Login successful via fallback mock:', mockSuccessResponse);
        onLogin(mockSuccessResponse);
      } else {
        setError(err.message || 'Invalid phone number or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setPhone('8269420494');
    setPassword('12345678');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans selection:bg-[#0077b6]/30 relative overflow-hidden" style={{ backgroundColor: '#0f172a' }}>
      {/* Decorative ambient lighting circles matching website navbar/theme */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#0077b6]/15 rounded-full blur-3xl pointer-events-none animate-pulse duration-[6000ms]"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]"></div>

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 transform transition-all duration-500">
        
        {/* Branding & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#0077b6]/10 border border-[#0077b6]/20 rounded-2xl mb-3 text-3xl shadow-sm text-[#0077b6]">
            🍽️
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-1">
            Welcome to <span className="text-[#0077b6]">Restaurant POS</span>
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm font-medium">Sign in to access order management & billing system</p>
        </div>

        {/* Demo Credentials Auto-Fill Pill Card matching website theme */}
        <div 
          onClick={handleFillDemo}
          className="group mb-5 p-3.5 bg-sky-50 hover:bg-sky-100/70 border border-sky-200/80 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between shadow-xs"
          title="Click to auto-fill demo credentials"
        >
          <div className="flex items-center gap-3">
            <span className="text-[#0077b6] text-xl group-hover:scale-110 transition-transform">⚡</span>
            <div>
              <div className="text-[11px] font-bold text-[#0077b6] uppercase tracking-wider flex items-center gap-1.5">
                <span>Demo Credentials</span>
              </div>
              <p className="text-xs text-slate-600 font-mono mt-0.5">
                Phone: <strong className="text-slate-900">8269420494</strong> | Pass: <strong className="text-slate-900">12345678</strong>
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-[#0077b6] text-white text-[10px] font-bold rounded-lg group-hover:bg-[#005f92] transition-colors shadow-xs">
            Auto-fill
          </span>
        </div>

        {/* Alert Error */}
        {error && (
          <div className="mb-5 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
            <span className="text-rose-500 text-base">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm">
                <i className="bi bi-telephone"></i>
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit phone number"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0077b6] focus:bg-white focus:ring-2 focus:ring-[#0077b6]/20 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-sm">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 focus:border-[#0077b6] focus:bg-white focus:ring-2 focus:ring-[#0077b6]/20 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 text-sm font-semibold"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-[#0077b6] hover:bg-[#005f92] active:scale-[0.98] text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-md shadow-[#0077b6]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <span>→</span>
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-400 font-medium">
          Restaurant POS System &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default Login;
