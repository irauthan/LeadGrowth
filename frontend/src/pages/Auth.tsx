import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Briefcase, Phone, Loader2, Sparkles, TrendingUp } from 'lucide-react';

export default function Auth() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Auth Store details
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  // If already authenticated and workspace exists, send to dashboard
  if (isAuthenticated && user?.workspaceId) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated but onboarding pending, send to onboarding
  if (isAuthenticated && !user?.workspaceId) {
    return <Navigate to="/onboarding" replace />;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', loginForm);
      const data = response.data;
      
      // Save in zustand
      login(data.token, {
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        designation: data.designation,
        profileImage: data.profileImage,
        roles: data.roles,
        workspaceId: data.workspaceId,
        workspaceName: data.workspaceName,
        workspaceSlug: data.workspaceSlug,
        inviteCode: data.inviteCode,
      });

      if (data.workspaceId) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (signupForm.password !== signupForm.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await api.post('/api/auth/register', signupForm);
      const data = response.data;
      
      // Registration logs user in immediately
      login(data.token, {
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        roles: data.roles || [],
      });

      // Send directly to onboarding to configure workspace
      navigate('/onboarding');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred during signup. Email may be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 dark:bg-slate-950">
      {/* Ambient backgrounds */}
      <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-brand-300 to-indigo-300 opacity-20 blur-[100px] dark:from-brand-900/20 dark:to-indigo-900/20" />
      <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-indigo-300 to-rose-300 opacity-20 blur-[100px] dark:from-indigo-950/20 dark:to-rose-950/20" />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-white shadow-xl shadow-brand-500/20 nav-glow">
            <TrendingUp size={26} className="animate-pulse-slow" />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Lead Growth</h2>
          <p className="mt-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
            One Dashboard. Every Lead. Complete Growth.
          </p>
        </div>

        {/* Card Panel */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {/* Tab buttons */}
          <div className="mb-8 flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/60">
            <button
              onClick={() => { setActiveTab('login'); setError(''); }}
              className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                activeTab === 'login'
                  ? 'bg-white text-brand-600 shadow dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setActiveTab('signup'); setError(''); }}
              className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
                activeTab === 'signup'
                  ? 'bg-white text-brand-600 shadow dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form Content */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400"
              >
                {error}
              </motion.div>
            )}

            {activeTab === 'login' ? (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLoginSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3.5 pl-12 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50 dark:focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <Lock size={18} />
                    </span>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3.5 pl-12 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50 dark:focus:border-brand-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 py-3.5 font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.01] hover:shadow-brand-500/30 disabled:opacity-70 nav-glow"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <span>Sign In</span>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignupSubmit}
                className="space-y-4"
              >
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <User size={18} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      value={signupForm.fullName}
                      onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50 dark:focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Company Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <Briefcase size={18} />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Growth Marketing Agency"
                      value={signupForm.companyName}
                      onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50 dark:focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={signupForm.email}
                      onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50 dark:focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <Phone size={18} />
                    </span>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={signupForm.phone}
                      onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50 dark:focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 px-4 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50 dark:focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 px-4 text-sm outline-none transition-all focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50 dark:focus:border-brand-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 py-3.5 mt-2 font-bold text-white shadow-lg shadow-brand-500/20 transition-all hover:scale-[1.01] hover:shadow-brand-500/30 disabled:opacity-70 nav-glow"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <span className="flex items-center gap-1">
                      <Sparkles size={16} />
                      Create Account
                    </span>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {/* Demo Credentials Info Box for fast sign-in */}
        <div className="mt-6 rounded-2xl border border-slate-200/50 bg-white/30 p-4 text-xs dark:border-slate-800/40 dark:bg-slate-900/25">
          <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">💡 Quick Access Credentials:</p>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="font-semibold text-brand-600 dark:text-brand-400">Admin Role</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">admin@leadgrowth.com</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Admin@123</p>
            </div>
            <div>
              <p className="font-semibold text-indigo-500">Manager Role</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">manager@leadgrowth.com</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Manager@123</p>
            </div>
            <div>
              <p className="font-semibold text-emerald-500">User Role</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">user@leadgrowth.com</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">User@123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
