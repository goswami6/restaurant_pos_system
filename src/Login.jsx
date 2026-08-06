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
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 font-sans selection:bg-[#0077b6]/30 relative overflow-hidden">
      {/* Decorative ambient lighting circles */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#0077b6]/15 rounded-full blur-3xl pointer-events-none animate-pulse duration-[6000ms]"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]"></div>

      {/* Main Outer Card Frame */}
      <div className="relative w-full max-w-md bg-[#0f172a] rounded-[32px] shadow-2xl overflow-hidden border border-slate-800">
        
        {/* Top Header Block (Matches screenshot header with circular badge) */}
        <div className="bg-[#0f172a] text-white p-7 pb-14 relative flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-serif font-extrabold tracking-tight text-white mb-0.5">
              Restaurant
            </h1>
            <p className="text-slate-300 font-serif text-lg tracking-wide">
              pos system
            </p>
          </div>

          {/* Floating Circular Badge with Shadow (Matching screenshot logo design) */}
          <div className="relative -mr-1">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-slate-100 to-white p-1.5 shadow-2xl border-4 border-[#0f172a] flex items-center justify-center transform transition-transform hover:scale-105">
              <div className="w-full h-full rounded-full bg-[#0f172a]/5 flex items-center justify-center text-3xl shadow-inner border border-slate-200/60">
                🍽️
              </div>
            </div>
          </div>
        </div>

        {/* Curved Body Panel (Matching screenshot curved white body) */}
        <div className="bg-[#f3f4f6] text-slate-900 p-6 sm:p-8 rounded-t-[36px] -mt-6 relative shadow-inner">
          
          <h2 className="text-2xl font-serif font-extrabold text-slate-900 mb-5">
            Login
          </h2>

          {/* Demo Credentials Auto-Fill Pill Card */}
          <div 
            onClick={handleFillDemo}
            className="group mb-5 p-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl cursor-pointer transition-all duration-300 flex items-center justify-between shadow-xs"
            title="Click to auto-fill demo credentials"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-[#0077b6] text-lg group-hover:scale-110 transition-transform">⚡</span>
              <div>
                <div className="text-[10px] font-bold text-[#0077b6] uppercase tracking-wider flex items-center gap-1">
                  <span>Demo Mode</span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                  Phone: <strong className="text-slate-900">8269420494</strong> | Pass: <strong className="text-slate-900">12345678</strong>
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 bg-[#0f172a] text-white text-[10px] font-bold rounded-lg group-hover:bg-[#0077b6] transition-colors shadow-xs">
              Auto-fill
            </span>
          </div>

          {/* Alert Error */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <span className="text-rose-500 text-base">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-serif font-bold text-slate-500 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="8269420494"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300/80 focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 text-sm font-semibold shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-serif font-bold text-slate-500 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300/80 focus:border-[#0f172a] focus:ring-2 focus:ring-[#0f172a]/10 rounded-xl text-slate-900 placeholder-slate-400 outline-none transition-all duration-300 text-sm font-semibold shadow-xs"
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

            {/* Action Button (Matching screenshot pill button style) */}
            <div className="pt-2 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="py-2.5 px-10 bg-[#0f172a] hover:bg-[#0077b6] active:scale-[0.98] text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-[10px] font-medium text-slate-400">
            POS Management &copy; {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
