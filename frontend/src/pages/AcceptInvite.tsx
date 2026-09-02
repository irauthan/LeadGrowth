import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Lock, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  TrendingUp, 
  ChevronRight,
  Eye,
  EyeOff
} from 'lucide-react';
import HoosshLogo from '../components/HoosshLogo';

export default function AcceptInvite() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrorMsg('No invitation token provided. Please check your invitation link.');
      setLoading(false);
      return;
    }
    validateInviteToken();
  }, [token]);

  const validateInviteToken = async () => {
    try {
      const res = await api.get(`/api/invites/validate?token=${token}`);
      setInviteData(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid, expired, or previously accepted invitation token.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    if (!fullName.trim() || !password) {
      setErrorMsg('Full name and password are required.');
      setSubmitting(false);
      return;
    }

    try {
      const res = await api.post('/api/invites/accept', {
        token,
        fullName: fullName.trim(),
        password
      });

      setSuccessMsg(res.data.message || 'Invitation accepted! Redirecting to login...');
      setTimeout(() => {
        navigate('/auth');
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white flex-col space-y-4">
        <Loader2 size={40} className="animate-spin text-cyan-400" />
        <span className="text-sm font-bold text-slate-400">Validating Workspace Invitation Token...</span>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl space-y-6">
        
        {/* Branding Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <div className="mb-2">
            <HoosshLogo size={42} variant="full" animated showTagline tagline="Lead Growth" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white">Join Workspace</h2>
          <p className="text-xs text-slate-400">Complete your profile setup to accept your workspace invitation.</p>
        </div>

        {errorMsg && (
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-bold text-rose-400 flex items-center gap-2">
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {inviteData && !successMsg && (
          <>
            {/* Invite Details Banner */}
            <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Workspace:</span>
                <span className="font-extrabold text-cyan-400">{inviteData.workspaceName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Invited Email:</span>
                <span className="font-bold text-white">{inviteData.email}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-semibold">Assigned Role:</span>
                <span className="font-extrabold text-emerald-400 uppercase text-[10px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  ROLE_{inviteData.role}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 py-3 pl-10 pr-4 text-sm font-medium text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Set Account Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-800/60 py-3 pl-10 pr-10 text-sm font-medium text-white outline-none focus:border-cyan-400"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 py-3.5 text-sm font-bold text-white shadow-xl shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <>Accept & Join Workspace <ChevronRight size={16} /></>}
              </button>
            </form>
          </>
        )}

        <div className="text-center pt-2">
          <Link to="/auth" className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors">
            Already have an account? Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}

