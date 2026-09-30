import React, { useState } from 'react';
import { apiClient } from '../api/client';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const data = await apiClient.login(username.trim(), password);
      localStorage.setItem('tl_token', data.access_token);
      localStorage.setItem('tl_user', data.username);
      onLoginSuccess(data.username);
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d1b2e] via-[#0f2545] to-[#0a1628] flex items-center justify-center p-4">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#1E7EF5 1px, transparent 1px), linear-gradient(90deg, #1E7EF5 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

          {/* Logo + Brand */}
          <div className="flex flex-col items-center mb-8">
            <img
              src="/logo-icon.png"
              alt="ThreatLens"
              className="w-16 h-16 rounded-2xl object-contain mb-4 shadow-lg"
            />
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight">
                <span className="text-white">Threat</span>
                <span className="text-[#1E7EF5]">Lens</span>
              </h1>
              <p className="text-white/40 text-xs font-mono uppercase tracking-widest mt-1">
                Detect • Analyze • Stay Safe
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h2 className="text-white text-lg font-semibold">Sign in to your workspace</h2>
            <p className="text-white/40 text-sm mt-1">AI-Powered Cyber Threat Intelligence Platform</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-xs font-mono uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[18px] text-white/30">person</span>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="analyst"
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#1E7EF5]/60 focus:bg-white/[0.09] transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-white/60 text-xs font-mono uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-[18px] text-white/30">lock</span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#1E7EF5]/60 focus:bg-white/[0.09] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/30 hover:text-white/60 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
                <span className="material-symbols-outlined text-[16px] text-red-400 shrink-0">error</span>
                <span className="text-red-300 text-xs font-medium">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full py-3 bg-[#1E7EF5] hover:bg-[#1a6fd4] active:bg-[#1560bb] disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-[#1E7EF5]/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
              <span className="text-white/30 text-[11px] font-mono uppercase tracking-wider">SOC Engine Online</span>
            </div>
            <span className="text-white/20 text-[11px] font-mono">v3.0.0</span>
          </div>
        </div>

        {/* Security note */}
        <p className="text-center text-white/20 text-[11px] font-mono mt-4 uppercase tracking-wider">
          Secured · All sessions are logged
        </p>
      </div>
    </div>
  );
};
