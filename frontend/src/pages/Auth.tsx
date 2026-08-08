import { useState, useEffect } from 'react';
import { NyaarLogo } from '../components/NyaarLogo';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { 
  Mail, 
  Lock, 
  User, 
  Briefcase, 
  Phone, 
  Loader2, 
  ChevronRight, 
  ChevronLeft, 
  Eye,
  EyeOff,
  CheckCircle2,
  BarChart3,
  Target,
  Zap,
  Users
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Auth() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  // Onboarding wizard steps (1: Profile, 2: Password, 3: Workspace)
  const [signupStep, setSignupStep] = useState(1);
  const [workspaceAction, setWorkspaceAction] = useState<'CREATE' | 'JOIN'>('CREATE');

  // Password reset inline states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Send request email, 2: Confirm token reset
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [resetForm, setResetForm] = useState({ token: '', newPassword: '', confirmPassword: '' });

  // Auth Store details
  const login = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '', rememberMe: false });
  const [signupForm, setSignupForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    workspaceName: '',
    inviteCode: ''
  });

  // Invite states
  const [inviteToken, setInviteToken] = useState('');
  const [inviteRole, setInviteRole] = useState('');
  const [inviteWorkspaceName, setInviteWorkspaceName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('inviteToken');
    if (token) {
      setInviteToken(token);
      setActiveTab('signup');
      verifyToken(token);
    }
  }, []);

  const verifyToken = async (token: string) => {
    setError('');
    try {
      const res = await api.get(`/api/invitations/verify?token=${token}`);
      setInviteRole(res.data.role);
      setInviteWorkspaceName(res.data.workspaceName);
      setSignupForm(prev => ({ ...prev, email: res.data.email }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'The invitation link is invalid or has expired.');
      setInviteToken('');
    }
  };

  if (isAuthenticated && user?.workspaceId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isAuthenticated && !user?.workspaceId) {
    return <Navigate to="/onboarding" replace />;
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!loginForm.email || !loginForm.email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!loginForm.password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/login', loginForm);
      const data = response.data;
      
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

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
      setError(err.response?.data?.message || 'Invalid credentials or account suspended.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // If joining via invite token
    if (inviteToken) {
      if (!signupForm.fullName || !signupForm.password) {
        setError('Please fill in your name and password.');
        return;
      }
      if (signupForm.password !== signupForm.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setLoading(true);
      try {
        const response = await api.post('/api/auth/register-invited', {
          fullName: signupForm.fullName,
          email: signupForm.email,
          phone: signupForm.phone,
          password: signupForm.password,
          confirmPassword: signupForm.confirmPassword,
          token: inviteToken
        });
        
        const data = response.data;
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        login(data.token, {
          id: data.userId,
          email: data.email,
          fullName: data.fullName,
          roles: data.roles,
          workspaceId: data.workspaceId,
          workspaceName: data.workspaceName,
          workspaceSlug: data.workspaceSlug,
          inviteCode: data.inviteCode,
        });

        navigate('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to register via invite.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Step validations
    if (signupStep === 1) {
      if (!signupForm.fullName.trim()) {
        setError('Full name is required.');
        return;
      }
      if (!signupForm.email || !signupForm.email.includes('@')) {
        setError('Valid email address is required.');
        return;
      }
      if (!signupForm.phone.trim()) {
        setError('Phone number is required.');
        return;
      }
      setSignupStep(2);
      return;
    }

    if (signupStep === 2) {
      if (!signupForm.password || signupForm.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (signupForm.password !== signupForm.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setSignupStep(3);
      return;
    }

    // Final registration submit
    setLoading(true);
    try {
      const payload = {
        fullName: signupForm.fullName,
        email: signupForm.email,
        phone: signupForm.phone,
        password: signupForm.password,
        confirmPassword: signupForm.confirmPassword,
        workspaceAction: workspaceAction,
        workspaceName: workspaceAction === 'CREATE' ? signupForm.workspaceName : undefined,
        companyName: workspaceAction === 'CREATE' ? signupForm.companyName : undefined,
        inviteCode: workspaceAction === 'JOIN' ? signupForm.inviteCode : undefined
      };

      const response = await api.post('/api/auth/register', payload);
      const data = response.data;

      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      login(data.token, {
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        roles: data.roles,
        workspaceId: data.workspaceId,
        workspaceName: data.workspaceName,
        workspaceSlug: data.workspaceSlug,
        inviteCode: data.inviteCode,
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please check details.');
      setSignupStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (resetStep === 1) {
        await api.post('/api/auth/password-reset/request', forgotForm);
        setSuccessMessage('Password reset code generated and sent to system console.');
        setResetStep(2);
      } else {
        await api.post('/api/auth/password-reset/confirm', resetForm);
        setSuccessMessage('Password updated successfully. Please sign in with your new password.');
        setIsForgotPassword(false);
        setResetStep(1);
        setActiveTab('login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#F8FAFC] text-[#1E293B] flex">
      {/* Background Decorative Gradients & Waves */}
      <div className="absolute top-0 right-0 w-full lg:w-1/2 h-full bg-gradient-to-br from-[#0F4C81] via-[#1D9BF0] to-[#00C2A8] opacity-5 lg:opacity-100 transition-opacity" />
      
      {/* Container Grid */}
      <div className="relative z-10 flex min-h-screen w-full flex-col lg:flex-row">
        
        {/* LEFT COLUMN: Modern Enterprise Business Showcase */}
        <div className="hidden lg:flex lg:w-7/12 flex-col justify-between p-12 lg:p-16 bg-gradient-to-br from-[#0F4C81] via-[#123E68] to-[#0A2E52] text-white relative overflow-hidden">
          {/* Wave Background Pattern overlay */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1D9BF0_1px,transparent_1px)] [background-size:24px_24px]" />
          
          {/* Animated Float Blobs */}
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#1D9BF0]/20 blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-[#00C2A8]/20 blur-3xl animate-float-delayed" />

          {/* Header Branding */}
          <div className="relative z-10 flex items-center gap-3">
            <NyaarLogo size={44} animated />
            <div>
              <span className="text-2xl font-black tracking-tight text-white block">NYAAR</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Enterprise Growth SaaS Platform</span>
            </div>
          </div>

          {/* Middle Floating Analytics Cards Showcase */}
          <div className="relative z-10 my-auto space-y-6 max-w-xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-3"
            >
              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-400/30 px-3.5 py-1 text-xs font-bold text-cyan-300">
                <Zap size={14} className="text-[#00C2A8]" /> Streamlined Lead & Team Intelligence
              </span>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-white">
                Accelerate Sales Pipeline & Team Velocity
              </h1>
              <p className="text-sm font-medium text-slate-300 leading-relaxed">
                Empower your sales, marketing, and management teams with automated lead assignments, task workflows, and real-time activity insights.
              </p>
            </motion.div>

            {/* Interactive Graphic Card 1: Revenue & Lead Metrics */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md shadow-xl animate-float">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-200">Active Pipeline</span>
                  <div className="h-8 w-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                    <BarChart3 size={16} />
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold text-white mt-2">$148,250</h3>
                <p className="text-[10px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                  ↑ +34.8% vs last month
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-md shadow-xl animate-float-delayed">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-200">Task Completion Rate</span>
                  <div className="h-8 w-8 rounded-xl bg-teal-500/20 flex items-center justify-center text-[#00C2A8]">
                    <Target size={16} />
                  </div>
                </div>
                <h3 className="text-2xl font-extrabold text-white mt-2">96.4%</h3>
                <p className="text-[10px] font-semibold text-cyan-300 mt-1 flex items-center gap-1">
                  Automated distribution
                </p>
              </div>
            </div>

            {/* Feature Checkmarks */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 size={16} className="text-[#00C2A8]" /> Granular RBAC Permissions
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 size={16} className="text-[#00C2A8]" /> Automated Task Assignment
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 size={16} className="text-[#00C2A8]" /> Live System Monitoring
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <CheckCircle2 size={16} className="text-[#00C2A8]" /> WebSocket Realtime Sync
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400 font-medium">
            <span>© 2026 NYAAR Inc. Enterprise Edition</span>
            <div className="flex items-center gap-4">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Security</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Modern White / Light SaaS Form */}
        <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16 bg-[#F8FAFC]">
          
          {/* Mobile Header Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <NyaarLogo size={36} animated />
            <span className="text-2xl font-black text-[#0F4C81]">NYAAR</span>
          </div>

          <div className="w-full max-w-md space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
            
            {/* Header Title */}
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#0F4C81]">
                {isForgotPassword 
                  ? 'Reset Account Password' 
                  : activeTab === 'login' 
                  ? 'Sign In to Workspace' 
                  : 'Register Workspace Account'}
              </h2>
              <p className="mt-1.5 text-xs font-semibold text-slate-500">
                {isForgotPassword 
                  ? 'Enter your registered email to receive a password reset token.' 
                  : activeTab === 'login' 
                  ? 'Enter your credentials to access your marketing & team dashboard.' 
                  : 'Setup your enterprise workspace or join an existing team.'}
              </p>
            </div>

            {/* TAB SELECTOR BUTTONS */}
            {!isForgotPassword && !inviteToken && (
              <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => { setActiveTab('login'); setError(''); setSuccessMessage(''); }}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                    activeTab === 'login' 
                      ? 'bg-[#0F4C81] text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('signup'); setSignupStep(1); setError(''); setSuccessMessage(''); }}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                    activeTab === 'signup' 
                      ? 'bg-[#0F4C81] text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Register Team
                </button>
              </div>
            )}

            {/* ERROR & SUCCESS ALERTS */}
            {error && (
              <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-bold text-rose-600 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                {error}
              </div>
            )}
            {successMessage && (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-bold text-emerald-600 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                {successMessage}
              </div>
            )}

            {/* FORGOT PASSWORD FORM */}
            {isForgotPassword ? (
              <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase text-[#0F4C81]">Password Recovery</h3>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setError(''); }}
                    className="text-xs font-bold text-[#1D9BF0] hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>

                {resetStep === 1 ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Registered Email Address</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400"><Mail size={16} /></span>
                      <input
                        type="email"
                        required
                        placeholder="e.g. admin@company.com"
                        value={forgotForm.email}
                        onChange={(e) => setForgotForm({ email: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81] focus:bg-white transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">8-Digit Reset Code</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter reset code"
                        value={resetForm.token}
                        onChange={(e) => setResetForm({ ...resetForm, token: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81] focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400"><Lock size={16} /></span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Minimum 6 characters"
                          value={resetForm.newPassword}
                          onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81] focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        placeholder="Repeat new password"
                        value={resetForm.confirmPassword}
                        onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81] focus:bg-white"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#0F4C81] hover:bg-[#0A365C] py-3 text-xs font-bold text-white shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : resetStep === 1 ? 'Generate Reset Code' : 'Update Password'}
                </button>
              </form>
            ) : activeTab === 'login' ? (

              /* LOGIN FORM */
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400"><Mail size={16} /></span>
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex@nyaar.com"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">Password</label>
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }}
                      className="text-[11px] font-bold text-[#1D9BF0] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400"><Lock size={16} /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81] focus:bg-white transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={loginForm.rememberMe}
                    onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-[#0F4C81] focus:ring-[#0F4C81]"
                  />
                  <label htmlFor="rememberMe" className="text-xs font-semibold text-slate-600 cursor-pointer">
                    Remember me on this browser
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#0F4C81] hover:bg-[#0A365C] py-3.5 text-xs font-bold text-white shadow-lg shadow-[#0F4C81]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Access Workspace Dashboard'}
                </button>
              </form>
            ) : (

              /* REGISTER FORM */
              <form onSubmit={handleSignupSubmit} className="space-y-4">
                
                {inviteToken && (
                  <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-3 text-xs text-[#0F4C81]">
                    <p className="font-bold uppercase tracking-wider text-[10px]">Workspace Invitation</p>
                    <p className="mt-1 font-medium">Joining workspace <span className="font-bold">{inviteWorkspaceName}</span> as <span className="font-bold">{inviteRole}</span></p>
                  </div>
                )}

                {!inviteToken && (
                  <div className="mb-4 flex items-center justify-between">
                    {[1, 2, 3].map((s) => (
                      <div key={s} className="flex items-center">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          signupStep === s 
                            ? 'bg-[#0F4C81] text-white shadow-md ring-4 ring-[#0F4C81]/15' 
                            : signupStep > s 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-slate-100 border border-slate-200 text-slate-400'
                        }`}>
                          {signupStep > s ? '✓' : s}
                        </div>
                        {s < 3 && <div className={`h-0.5 w-14 mx-1 transition-all ${signupStep > s ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                      </div>
                    ))}
                  </div>
                )}

                {signupStep === 1 && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400"><User size={16} /></span>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sarah Jenkins"
                          value={signupForm.fullName}
                          onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81] focus:bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400"><Mail size={16} /></span>
                        <input
                          type="email"
                          required
                          disabled={!!inviteToken}
                          placeholder="sarah@company.com"
                          value={signupForm.email}
                          onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81] focus:bg-white disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400"><Phone size={16} /></span>
                        <input
                          type="text"
                          required
                          placeholder="+1 (555) 000-0000"
                          value={signupForm.phone}
                          onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81] focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {signupStep === 2 && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Create Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400"><Lock size={16} /></span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Minimum 6 characters"
                          value={signupForm.password}
                          onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81] focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400"><Lock size={16} /></span>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          placeholder="Repeat password"
                          value={signupForm.confirmPassword}
                          onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-10 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81] focus:bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {signupStep === 3 && !inviteToken && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <button
                        type="button"
                        onClick={() => setWorkspaceAction('CREATE')}
                        className={`rounded-2xl border p-3.5 text-center transition-all ${
                          workspaceAction === 'CREATE'
                            ? 'border-[#0F4C81] bg-[#0F4C81]/10 text-[#0F4C81] font-bold'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <Briefcase size={18} className="mx-auto mb-1" />
                        <span className="block text-xs">Create Workspace</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setWorkspaceAction('JOIN')}
                        className={`rounded-2xl border p-3.5 text-center transition-all ${
                          workspaceAction === 'JOIN'
                            ? 'border-[#0F4C81] bg-[#0F4C81]/10 text-[#0F4C81] font-bold'
                            : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        <Users size={18} className="mx-auto mb-1" />
                        <span className="block text-xs">Join Workspace</span>
                      </button>
                    </div>

                    {workspaceAction === 'CREATE' ? (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Workspace Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Apex Growth Agency"
                            value={signupForm.workspaceName}
                            onChange={(e) => setSignupForm({ ...signupForm, workspaceName: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Company Name</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Apex Corp Inc"
                            value={signupForm.companyName}
                            onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })}
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81]"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Workspace Invite Code</label>
                        <input
                          type="text"
                          required
                          placeholder="WS-XXXXXXXX"
                          value={signupForm.inviteCode}
                          onChange={(e) => setSignupForm({ ...signupForm, inviteCode: e.target.value })}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 px-4 text-xs font-medium text-slate-900 outline-none focus:border-[#0F4C81] uppercase"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  {signupStep > 1 && !inviteToken && (
                    <button
                      type="button"
                      onClick={() => { setError(''); setSignupStep(prev => prev - 1); }}
                      className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-600 hover:bg-slate-100"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-2xl bg-[#0F4C81] hover:bg-[#0A365C] py-3.5 text-xs font-bold text-white shadow-lg shadow-[#0F4C81]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : inviteToken ? (
                      'Accept Invitation & Register'
                    ) : signupStep < 3 ? (
                      <>Continue to Step {signupStep + 1} <ChevronRight size={14} /></>
                    ) : (
                      'Complete Team Setup'
                    )}
                  </button>
                </div>
              </form>
            )}

          </div>

          <div className="mt-8 text-center text-xs text-slate-500 font-semibold">
            Need help? Contact system administrator or visit <Link to="/" className="text-[#0F4C81] hover:underline font-bold">Main Welcome Page</Link>
          </div>
        </div>

      </div>
    </div>
  );
}
