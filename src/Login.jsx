import React, { useState } from 'react';
import { API_BASE_URL } from './config';

const Login = ({ onLogin }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
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
      
      // Fallback local check for the demo credentials requested
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 p-4 font-sans selection:bg-amber-500/30">
      {/* Decorative ambient light circles */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[6000ms]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[8000ms]"></div>

      <div className="relative w-full max-w-md bg-slate-900/75 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:border-slate-700/60">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl mb-4 text-3xl shadow-inner shadow-amber-500/5">
            🍽️
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">My Restaurant POS</span>
          </h2>
          <p className="text-slate-400 text-sm">Sign in to manage your system</p>
        </div>

        {/* Demo Credentials Info Box */}
        <div 
          onClick={handleFillDemo}
          className="group mb-6 p-4 bg-amber-950/20 hover:bg-amber-950/30 border border-amber-500/20 rounded-xl cursor-pointer transition-all duration-300 flex items-start gap-3"
        >
          <span className="text-amber-400 text-lg mt-0.5 group-hover:scale-110 transition-transform">💡</span>
          <div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              Demo Mode
              <span className="inline-block px-1.5 py-0.5 bg-amber-500/20 text-[10px] text-amber-300 rounded-md font-medium border border-amber-500/20 animate-pulse">
                Click to Auto-fill
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Phone: <strong className="text-white">8269420494</strong><br />
              Password: <strong className="text-white">12345678</strong>
            </p>
          </div>
        </div>

        {/* Alert Error */}
        {error && (
          <div className="mb-6 p-3 bg-red-950/30 border border-red-500/30 text-red-200 text-sm rounded-lg flex items-center gap-2 animate-shake">
            <span className="text-red-400">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Phone Number
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                📞
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter Phone Number (e.g. 8269420494)"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-white placeholder-slate-600 outline-none transition-all duration-300 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Password
              </label>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                🔒
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 rounded-xl text-white placeholder-slate-600 outline-none transition-all duration-300 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          Restaurant Management System &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
};

export default Login;
