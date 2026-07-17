import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, Users, ArrowLeft, Loader2, Globe, Compass, Users2, Landmark } from 'lucide-react';

export default function Onboarding() {
  const [step, setStep] = useState<'choose' | 'create' | 'join'>('choose');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const setWorkspace = useAuthStore((state) => state.setWorkspace);
  const user = useAuthStore((state) => state.user);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    companyName: '',
    industry: 'Technology',
    teamSize: 5,
    website: '',
    timezone: 'UTC+5:30',
  });

  const [joinForm, setJoinForm] = useState({
    inviteCode: '',
  });

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/workspaces/create', createForm);
      const data = response.data;
      
      // Update global auth store state
      setWorkspace(
        data.workspaceId,
        data.workspaceName,
        data.workspaceSlug,
        data.inviteCode,
        'ROLE_ADMIN' // Assign ROLE_ADMIN upon workspace creation
      );

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred while creating workspace.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/workspaces/join', joinForm);
      const data = response.data;

      // Update global auth store state
      setWorkspace(
        data.workspaceId,
        data.workspaceName,
        data.workspaceSlug,
        data.inviteCode,
        'ROLE_USER' // Assign ROLE_USER upon joining workspace
      );

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Invalid workspace invite code. Please double check.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12 dark:bg-slate-950">
      {/* Ambient background glows */}
      <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-brand-300 to-indigo-300 opacity-20 blur-[100px] dark:from-brand-900/20 dark:to-indigo-900/20" />
      <div className="absolute -right-40 bottom-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-indigo-300 to-rose-300 opacity-20 blur-[100px] dark:from-indigo-950/20 dark:to-rose-950/20" />

      <div className="relative z-10 w-full max-w-xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <h2 className="text-3xl font-extrabold tracking-tight">Let's Setup Your Workspace</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Welcome, {user?.fullName}! Select an option below to configure your analytics dashboard.
          </p>
        </div>

        {/* Card Containment */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 'choose' && (
              <motion.div
                key="choose"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 gap-6 sm:grid-cols-2"
              >
                {/* Create Card */}
                <button
                  onClick={() => setStep('create')}
                  className="group flex flex-col items-start rounded-2xl border border-slate-200 bg-white/40 p-6 text-left shadow-sm transition-all hover:scale-[1.02] hover:bg-white hover:shadow-lg hover:border-brand-500 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                    <PlusCircle size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    Create Workspace
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Create a new organization workspace. You will become the administrator.
                  </p>
                </button>

                {/* Join Card */}
                <button
                  onClick={() => setStep('join')}
                  className="group flex flex-col items-start rounded-2xl border border-slate-200 bg-white/40 p-6 text-left shadow-sm transition-all hover:scale-[1.02] hover:bg-white hover:shadow-lg hover:border-indigo-500 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:bg-slate-900"
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
                    <Users size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    Join Workspace
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Join your team's existing workspace using an invite code generated by your administrator.
                  </p>
                </button>
              </motion.div>
            )}

            {step === 'create' && (
              <motion.form
                key="create"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleCreateSubmit}
                className="space-y-4 text-left"
              >
                <div className="flex items-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setStep('choose')}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className="text-sm font-bold">Back to options</span>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Workspace Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Marketing Agency"
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 px-4 text-sm outline-none focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Company Name (Optional)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <Landmark size={18} />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Acme Corporation"
                      value={createForm.companyName}
                      onChange={(e) => setCreateForm({ ...createForm, companyName: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 pl-12 pr-4 text-sm outline-none focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Industry
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <Compass size={18} />
                      </span>
                      <select
                        value={createForm.industry}
                        onChange={(e) => setCreateForm({ ...createForm, industry: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 pl-12 pr-4 text-sm outline-none focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50"
                      >
                        <option value="Technology">Technology</option>
                        <option value="E-commerce">E-commerce</option>
                        <option value="Digital Marketing">Digital Marketing</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Healthcare">Healthcare</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Team Size
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <Users2 size={18} />
                      </span>
                      <input
                        type="number"
                        min={1}
                        value={createForm.teamSize}
                        onChange={(e) => setCreateForm({ ...createForm, teamSize: parseInt(e.target.value) || 1 })}
                        className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 pl-12 pr-4 text-sm outline-none focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Website URL
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                        <Globe size={18} />
                      </span>
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={createForm.website}
                        onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })}
                        className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 pl-12 pr-4 text-sm outline-none focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                      Timezone
                    </label>
                    <select
                      value={createForm.timezone}
                      onChange={(e) => setCreateForm({ ...createForm, timezone: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3 px-4 text-sm outline-none focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50"
                    >
                      <option value="UTC-5:00">Eastern Time (EST)</option>
                      <option value="UTC-8:00">Pacific Time (PST)</option>
                      <option value="UTC">Coordinated Universal Time (UTC)</option>
                      <option value="UTC+1:00">Central European (CET)</option>
                      <option value="UTC+5:30">India Time (IST)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 py-3.5 mt-4 font-bold text-white shadow-lg transition-all hover:scale-[1.01] disabled:opacity-70 nav-glow"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <span>Create & Launch Workspace</span>
                  )}
                </button>
              </motion.form>
            )}

            {step === 'join' && (
              <motion.form
                key="join"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                onSubmit={handleJoinSubmit}
                className="space-y-4 text-left"
              >
                <div className="flex items-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setStep('choose')}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <span className="text-sm font-bold">Back to options</span>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Workspace Invite Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="LG-XXXXXX"
                    value={joinForm.inviteCode}
                    onChange={(e) => setJoinForm({ ...joinForm, inviteCode: e.target.value.toUpperCase() })}
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 py-3.5 px-4 font-mono text-center text-lg outline-none tracking-widest focus:border-brand-500 focus:bg-white dark:border-slate-800/80 dark:bg-slate-900/50"
                  />
                  <p className="mt-2 text-xs text-slate-400 leading-normal">
                    💡 Ask your administrator/owner for the 9-digit alphanumeric code (e.g. LG-LEAD-GROWTH-2026) to link your account.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 py-3.5 mt-4 font-bold text-white shadow-lg transition-all hover:scale-[1.01] disabled:opacity-70 nav-glow"
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <span>Validate Code & Join</span>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
