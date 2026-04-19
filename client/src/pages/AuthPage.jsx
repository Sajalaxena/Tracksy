import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import { validatePassword, validateEmail, sanitizeInput } from '../utils/validation';

const FEATURES = [
  { icon: '📊', label: 'Track daily habits' },
  { icon: '🔥', label: 'Build streaks' },
  { icon: '🎯', label: 'Set & hit goals' },
  { icon: '📈', label: 'Visualise progress' },
];

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const authContext = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Sanitize inputs
    const sanitizedEmail = sanitizeInput(email);

    // Validate email
    if (!validateEmail(sanitizedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Validate password strength for signup
    if (isSignup) {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setError(passwordValidation.errors[0]); // Show first error
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      const response = isSignup
        ? await api.signup(sanitizedEmail, password)
        : await api.login(sanitizedEmail, password);

      const { token, user } = response.data;
      authContext.login(token, user);
      navigate('/');
    } catch (err) {
      const message =
        err.response?.data?.error || 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#2D5016] flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-60px] right-[-60px] w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-accent rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">Tracksy</span>
          </div>
          <p className="mt-4 text-white/60 text-sm leading-relaxed max-w-xs">
            Your personal habit tracker — build consistency, celebrate wins, and grow every day.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.label}
              className="flex items-center gap-3 animate-slide-in-left"
              style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'both' }}
            >
              <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-lg backdrop-blur-sm">
                {f.icon}
              </div>
              <span className="text-white/80 text-sm font-medium">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Bottom quote */}
        <p className="text-white/30 text-xs animate-fade-in" style={{ animationDelay: '600ms', animationFillMode: 'both' }}>
          "We are what we repeatedly do. Excellence, then, is not an act, but a habit." — Aristotle
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-white px-6 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-accent rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">L</span>
            </div>
            <span className="text-gray-900 font-bold text-xl">Tracksy</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-2 text-gray-500 text-sm">
              {isSignup
                ? 'Start tracking habits and building streaks today.'
                : 'Sign in to continue your habit journey.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">✉</span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all shadow-sm hover:border-gray-300"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔒</span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-12 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all shadow-sm hover:border-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {isSignup && password && (
                <div className="mt-2 text-xs text-gray-500 space-y-1">
                  <p className="font-medium">Password must contain:</p>
                  <ul className="space-y-0.5 ml-2">
                    <li className={password.length >= 8 ? 'text-green-600' : 'text-gray-400'}>
                      ✓ At least 8 characters
                    </li>
                    <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                      ✓ One lowercase letter
                    </li>
                    <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                      ✓ One uppercase letter
                    </li>
                    <li className={/\d/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                      ✓ One number
                    </li>
                    <li className={/[@$!%*?&]/.test(password) ? 'text-green-600' : 'text-gray-400'}>
                      ✓ One special character (@$!%*?&)
                    </li>
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            {isSignup && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Confirm password
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔒</span>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all shadow-sm hover:border-gray-300"
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 animate-scale-in">
                <span className="text-red-500 text-sm">⚠</span>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-accent to-accent-light hover:from-accent-light hover:to-accent focus:outline-none focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  {isSignup ? 'Creating account…' : 'Signing in…'}
                </span>
              ) : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          {/* Switch */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <Link to="/login" className="text-accent font-semibold hover:underline">
                  Sign In
                </Link>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="text-accent font-semibold hover:underline">
                  Create Account
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
