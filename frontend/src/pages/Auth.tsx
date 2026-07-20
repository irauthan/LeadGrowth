import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Mail, Lock, User, Briefcase, Phone, Loader2, TrendingUp, ChevronRight, ChevronLeft, HelpCircle } from 'lucide-react';

export default function Auth() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    setLoading(true);
    setError('');
    setSuccessMessage('');

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
      setError(err.response?.data?.message || 'Invalid credentials or suspended account.');
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
      if (!signupForm.fullName || !signupForm.email || !signupForm.phone) {
        setError('Please fill in all details for Step 1');
        return;
      }
      setSignupStep(2);
      return;
    }

    if (signupStep === 2) {
      if (!signupForm.password || !signupForm.confirmPassword) {
        setError('Passwords are required');
        return;
      }
      if (signupForm.password !== signupForm.confirmPassword) {
        setError('Passwords do not match');
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
      setError(err.response?.data?.message || 'Registration failed. Check details.');
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
        setSuccessMessage('Password reset code generated and sent to console.');
        setResetStep(2);
      } else {
        await api.post('/api/auth/password-reset/confirm', resetForm);
        setSuccessMessage('Password updated successfully. Please login.');
        setIsForgotPassword(false);
        setResetStep(1);
        setActiveTab('login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Action failed. Please verify.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B1120] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        
        {/* LOGO */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-[#06B6D4] text-white shadow-xl shadow-blue-500/10">
            <TrendingUp size={24} />
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
            Lead Growth
          </h2>
          <p className="mt-1.5 text-xs font-semibold text-slate-400">
            Enterprise SaaS Campaign Lead & Team Productivity Platform
          </p>
        </div>

        {/* AUTH CARD */}
        <div className="rounded-3xl border border-slate-800 bg-[#111827]/80 p-8 shadow-2xl backdrop-blur-md">
          
          {/* TAB HEADERS */}
          {!isForgotPassword && !inviteToken && (
            <div className="mb-6 flex rounded-2xl bg-slate-950 p-1">
              <button
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                  activeTab === 'login' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setActiveTab('signup'); setSignupStep(1); setError(''); }}
                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                  activeTab === 'signup' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Register Team
              </button>
            </div>
          )}

          {/* MESSAGES */}
          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-medium text-red-400">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 rounded-xl bg-green-500/10 border border-green-500/30 p-3 text-xs font-medium text-green-400">
              {successMessage}
            </div>
          )}

          {/* INLINE FORGOT PASSWORD FORM */}
          {isForgotPassword ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase">Reset Password</h3>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(false)}
                  className="text-xs text-blue-500 font-bold hover:underline"
                >
                  Back to Sign In
                </button>
              </div>

              {resetStep === 1 ? (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><Mail size={14} /></span>
                    <input
                      type="email"
                      required
                      placeholder="rahul@example.com"
                      value={forgotForm.email}
                      onChange={(e) => setForgotForm({ email: e.target.value })}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2 pl-9 pr-4 text-xs font-medium text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Reset Code</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter 8-digit code"
                      value={resetForm.token}
                      onChange={(e) => setResetForm({ ...resetForm, token: e.target.value })}
                      className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 py-2 px-4 text-xs font-medium text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Minimum 6 characters"
                      value={resetForm.newPassword}
                      onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })}
                      className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 py-2 px-4 text-xs font-medium text-white outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      placeholder="Repeat password"
                      value={resetForm.confirmPassword}
                      onChange={(e) => setResetForm({ ...resetForm, confirmPassword: e.target.value })}
                      className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 py-2 px-4 text-xs font-medium text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : resetStep === 1 ? 'Generate Reset Code' : 'Update Password'}
              </button>
            </form>
          ) : activeTab === 'login' ? (
            
            /* SIGN IN FORM */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><Mail size={14} /></span>
                  <input
                    type="email"
                    required
                    placeholder="rahul@leadgrowth.com"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-xs font-medium text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMessage(''); }}
                    className="text-[10px] text-blue-500 font-bold hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><Lock size={14} /></span>
                  <input
                    type="password"
                    required
                    placeholder="Password@123"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-xs font-medium text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={loginForm.rememberMe}
                  onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                  className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-0"
                />
                <label htmlFor="rememberMe" className="text-[10px] font-bold uppercase tracking-wider text-slate-400 cursor-pointer">
                  Remember Me (Stay signed in)
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : 'Access Workspace'}
              </button>
            </form>
          ) : (
            
            /* SIGNUP WIZARD FORM */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              
              {/* INVITE BANNER */}
              {inviteToken && (
                <div className="mb-3 rounded-xl bg-blue-600/10 border border-blue-500/20 p-3 text-xs text-blue-400">
                  <p className="font-bold uppercase tracking-wider text-[10px]">Invitation Active</p>
                  <p className="mt-1 font-medium">Joining workspace: <span className="font-bold text-white">{inviteWorkspaceName}</span> as <span className="font-bold text-white">{inviteRole}</span></p>
                </div>
              )}

              {/* STEP INDICATORS */}
              {!inviteToken && (
                <div className="mb-4 flex items-center justify-between">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                        signupStep === s 
                          ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-500/20' 
                          : signupStep > s 
                          ? 'bg-green-600 text-white' 
                          : 'bg-slate-900 border border-slate-800 text-slate-500'
                      }`}>
                        {signupStep > s ? '✓' : s}
                      </div>
                      {s < 3 && <div className={`h-0.5 w-16 mx-1 transition-all ${signupStep > s ? 'bg-green-600' : 'bg-slate-800'}`} />}
                    </div>
                  ))}
                </div>
              )}

              {/* STEP 1: Profile Info */}
              {signupStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><User size={14} /></span>
                      <input
                        type="text"
                        required
                        placeholder="Rahul Sharma"
                        value={signupForm.fullName}
                        onChange={(e) => setSignupForm({ ...signupForm, fullName: e.target.value })}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-xs font-medium text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Email Address</label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><Mail size={14} /></span>
                      <input
                        type="email"
                        required
                        disabled={!!inviteToken}
                        placeholder="rahul@example.com"
                        value={signupForm.email}
                        onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-xs font-medium text-white outline-none focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><Phone size={14} /></span>
                      <input
                        type="text"
                        required
                        placeholder="+91 99999 99999"
                        value={signupForm.phone}
                        onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-xs font-medium text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Passwords */}
              {signupStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Password</label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><Lock size={14} /></span>
                      <input
                        type="password"
                        required
                        placeholder="Minimum 6 characters"
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-xs font-medium text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Confirm Password</label>
                    <div className="relative mt-1">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-500"><Lock size={14} /></span>
                      <input
                        type="password"
                        required
                        placeholder="Confirm password"
                        value={signupForm.confirmPassword}
                        onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-4 text-xs font-medium text-white outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Workspace Action (Only for non-invited registration) */}
              {signupStep === 3 && !inviteToken && (
                <div className="space-y-3">
                  <div className="mb-4 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setWorkspaceAction('CREATE')}
                      className={`rounded-2xl border p-4 text-center transition-all ${
                        workspaceAction === 'CREATE'
                          ? 'border-blue-500 bg-blue-600/10 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Briefcase size={20} className="mx-auto mb-1.5" />
                      <span className="block text-[11px] font-extrabold uppercase tracking-wider">Create Workspace</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkspaceAction('JOIN')}
                      className={`rounded-2xl border p-4 text-center transition-all ${
                        workspaceAction === 'JOIN'
                          ? 'border-blue-500 bg-blue-600/10 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <HelpCircle size={20} className="mx-auto mb-1.5" />
                      <span className="block text-[11px] font-extrabold uppercase tracking-wider">Join Workspace</span>
                    </button>
                  </div>

                  {workspaceAction === 'CREATE' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Acme Marketing Agency"
                          value={signupForm.workspaceName}
                          onChange={(e) => setSignupForm({ ...signupForm, workspaceName: e.target.value })}
                          className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-xs font-medium text-white outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Company Name</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Acme Corp"
                          value={signupForm.companyName}
                          onChange={(e) => setSignupForm({ ...signupForm, companyName: e.target.value })}
                          className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-xs font-medium text-white outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace Invite Code</label>
                      <input
                        type="text"
                        required
                        placeholder="WS-XXXXXXXX"
                        value={signupForm.inviteCode}
                        onChange={(e) => setSignupForm({ ...signupForm, inviteCode: e.target.value })}
                        className="w-full mt-1 rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-4 text-xs font-medium text-white outline-none focus:border-blue-500 uppercase"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* NAVIGATION BUTTONS */}
              <div className="flex gap-3">
                {signupStep > 1 && !inviteToken && (
                  <button
                    type="button"
                    onClick={() => { setError(''); setSignupStep(prev => prev - 1); }}
                    className="flex items-center justify-center rounded-xl border border-slate-800 bg-slate-950 px-4 text-slate-400 hover:text-white"
                  >
                    <ChevronLeft size={16} />
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-lg transition-all hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : inviteToken ? (
                    'Accept & Register'
                  ) : signupStep < 3 ? (
                    <>Next Step <ChevronRight size={14} /></>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
