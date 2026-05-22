/* eslint-disable react/prop-types */
import { useState } from 'react';
import { TreePine } from 'lucide-react';
import { EDU_EMAIL_ERROR, isEduEmail, signInWithUsername, signUp, sendPasswordReset } from '../firebase/auth';

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetStatus, setResetStatus] = useState(null); // 'sent' | 'error' | null
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const result = await signInWithUsername(formData.username, formData.password);
        if (result.success) {
          onLogin(result.user);
        } else {
          setError(result.error);
        }
      } else {
        if (!formData.email || !formData.username || !formData.password) {
          setError('Please fill in all fields');
          setLoading(false);
          return;
        }
        if (!isEduEmail(formData.email)) {
          setError(EDU_EMAIL_ERROR);
          setLoading(false);
          return;
        }
        const result = await signUp(formData.email, formData.password, formData.username, {
          profileComplete: false
        });
        if (result.success) {
          onLogin(result.user);
        } else {
          setError(result.error);
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetUsername.trim()) return;
    setResetLoading(true);
    setResetError('');
    const result = await sendPasswordReset(resetUsername.trim());
    setResetLoading(false);
    if (result.success) {
      setResetStatus('sent');
    } else {
      setResetError(result.error);
    }
  };

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-rose-500 via-rose-400 to-rose-300 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl mb-4">
            <TreePine className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">IndusTree</h1>
          <p className="text-rose-100">Connect, discuss, and grow together</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Toggle Tabs */}
          <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                isLogin
                  ? 'bg-white text-rose-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                !isLogin
                  ? 'bg-white text-rose-500 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '50px', paddingLeft: '10px', paddingRight: '10px' }}>
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@school.edu"
                  required={!isLogin}
                  className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all placeholder:text-slate-400"
                />
                <p className="mt-2 text-xs text-slate-500">
                  New accounts require a valid .edu email address.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full px-4 py-3.5 bg-slate-50 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all placeholder:text-slate-400"
              />
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-400"
                  />
                  <span className="text-slate-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setShowReset(true); setResetStatus(null); setResetError(''); setResetUsername(''); }}
                  className="text-rose-500 hover:text-rose-600 font-semibold"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Create Account')}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-slate-500">
            {isLogin ? (
              <p>
                Don&apos;t have an account?{' '}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-rose-500 hover:text-rose-600 font-semibold"
                >
                  Sign up
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-rose-500 hover:text-rose-600 font-semibold"
                >
                  Login
                </button>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>

      {/* Forgot password modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowReset(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl" style={{ padding: '32px 24px' }}>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Reset your password</h3>
            <p className="text-sm text-slate-500 mb-5">Enter your username and we&apos;ll send a reset link to the email on your account.</p>

            {resetStatus === 'sent' ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm text-center">
                Reset email sent. Check your inbox.
              </div>
            ) : (
              <form onSubmit={handleReset} className="flex flex-col gap-4">
                <input
                  type="text"
                  value={resetUsername}
                  onChange={(e) => setResetUsername(e.target.value)}
                  placeholder="Your username"
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 transition-all"
                />
                {resetError && (
                  <p className="text-rose-600 text-sm">{resetError}</p>
                )}
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3 bg-rose-500 text-white font-bold rounded-xl hover:bg-rose-600 transition-all disabled:opacity-50"
                >
                  {resetLoading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            )}

            <button
              onClick={() => setShowReset(false)}
              className="mt-4 w-full text-center text-sm text-slate-400 hover:text-slate-600"
            >
              Back to login
            </button>
          </div>
        </div>
      )}
    </>
  );
}
