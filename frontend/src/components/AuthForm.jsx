import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Shield, Sparkles } from 'lucide-react';

export default function AuthForm({ onAuthSuccess }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const apiUrl = mode === 'login' ? '/api/auth/login' : '/api/auth/register';

  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password.length > 128) {
      setError('Password must not exceed 128 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const body = mode === 'login'
        ? { email: trimmedEmail, password }
        : { email: trimmedEmail, password, full_name: fullName.trim() || undefined };

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        let errorMsg = 'Authentication failed';
        if (typeof data.detail === 'string') {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          errorMsg = data.detail.map((d) => d.msg || d.detail || JSON.stringify(d)).join('; ');
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();
      const token = data.access_token;
      if (!token) {
        throw new Error('Missing access token from auth response.');
      }
      onAuthSuccess(token);
    } catch (err) {
      setError(err.message || 'Auth request failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030712] px-4 py-10">
      <div
        className="w-full max-w-md rounded-3xl border border-slate-800 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl"
        style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Shield className="h-6 w-6" />
          </div>
          <p className="text-xs uppercase tracking-[0.3em] font-semibold text-cyan-400">FraudGuard AI</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-100">{mode === 'login' ? 'Sign In' : 'Create Account'}</h1>
          <p className="mt-1 text-sm text-slate-400">
            {mode === 'login'
              ? 'Enter your email and password to access the platform.'
              : 'Register a new account for FraudGuard AI.'}
          </p>
        </div>

        {/* Quick Demo Credentials Autofill Banner */}
        {mode === 'login' && (
          <div className="mb-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-slate-300">
            <div className="flex items-center justify-between font-semibold text-cyan-300 mb-2">
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                Quick Demo Access:
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('demo@fraudguard.ai', 'demo1234')}
                className="flex-1 rounded-xl border border-cyan-500/30 bg-cyan-500/10 py-1.5 px-2 font-medium text-cyan-300 transition hover:bg-cyan-500/20 text-center"
              >
                Demo Admin 1
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('demo2@fraudguard.ai', 'demo1234')}
                className="flex-1 rounded-xl border border-slate-700 bg-slate-800/60 py-1.5 px-2 font-medium text-slate-300 transition hover:bg-slate-800 text-center"
              >
                Demo Auditor 2
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="auth-input w-full rounded-2xl border border-slate-700 pl-10 pr-4 py-3.5 text-sm font-semibold outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500"
                  style={{ backgroundColor: '#030712', color: '#ffffff', caretColor: '#00f2fe' }}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="demo@fraudguard.ai"
                required
                className="auth-input w-full rounded-2xl border border-slate-700 pl-10 pr-4 py-3.5 text-sm font-semibold outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500"
                style={{ backgroundColor: '#030712', color: '#ffffff', caretColor: '#00f2fe' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="auth-input w-full rounded-2xl border border-slate-700 pl-10 pr-11 py-3.5 text-sm font-semibold outline-none transition focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500"
                style={{ backgroundColor: '#030712', color: '#ffffff', caretColor: '#00f2fe' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition focus:outline-none"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-cyan-400 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Working…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          {mode === 'login' ? (
            <>
              New to FraudGuard AI?{' '}
              <button
                type="button"
                className="font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
                onClick={() => setMode('register')}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                className="font-semibold text-cyan-400 hover:text-cyan-300 underline underline-offset-4"
                onClick={() => setMode('login')}
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

