import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { 
  User as UserIcon, 
  Lock, 
  Loader2, 
  Smartphone, 
  Briefcase, 
  FileText,
  Camera
} from 'lucide-react';

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  // Forms
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    designation: user?.designation || '',
    bio: user?.bio || '',
    profileImage: user?.profileImage || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMessage('');
    setProfileError('');

    try {
      const response = await api.put('/api/users/profile', profileForm);
      const data = response.data;
      
      // Update global auth store state
      updateUser({
        fullName: data.fullName,
        phone: data.phone,
        designation: data.designation,
        bio: data.bio,
        profileImage: data.profileImage,
      });

      setProfileMessage('Profile settings updated successfully.');
    } catch (err: any) {
      console.error(err);
      setProfileError(err.response?.data?.message || 'Failed to update profile settings.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordMessage('');
    setPasswordError('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    try {
      await api.post('/api/users/password', passwordForm);
      setPasswordMessage('Your password has been changed successfully.');
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      console.error(err);
      setPasswordError(err.response?.data?.message || 'Incorrect old password. Please retry.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100 font-sans">Settings & Profile</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your personal account credentials, designations, and workspace preferences.
        </p>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left pane: Profile summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            {/* Avatar picker container */}
            <div className="relative group mb-4">
              {profileForm.profileImage ? (
                <img
                  src={profileForm.profileImage}
                  alt="avatar"
                  className="h-28 w-28 rounded-3xl object-cover shadow-md"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-3xl font-extrabold text-white shadow-md">
                  {getInitials(user?.fullName || '')}
                </div>
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{user?.fullName}</h3>
            <p className="text-xs text-brand-600 dark:text-brand-400 font-bold mt-1 uppercase tracking-wider">{user?.roles[0]?.replace('ROLE_', '')}</p>
            <p className="text-xs text-slate-400 mt-0.5 leading-normal">{user?.email}</p>

            {user?.bio && (
              <p className="mt-5 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 pt-4 w-full leading-normal">
                "{user.bio}"
              </p>
            )}
          </div>
        </div>

        {/* Center/Right pane: Edit fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile */}
          <div className="glass-card rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <UserIcon size={18} className="text-slate-400" />
              <span>Profile Settings</span>
            </h3>

            {profileMessage && (
              <div className="mb-4 rounded-xl bg-green-50 p-4 text-xs font-bold text-green-700 dark:bg-green-950/20 dark:text-green-400">
                {profileMessage}
              </div>
            )}
            {profileError && (
              <div className="mb-4 rounded-xl bg-red-50 p-4 text-xs font-bold text-red-700 dark:bg-red-950/20 dark:text-red-400">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <Smartphone size={16} />
                    </span>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-2.5 pl-11 pr-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Designation / Title</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <Briefcase size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Lead Analyst"
                      value={profileForm.designation}
                      onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-2.5 pl-11 pr-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Avatar Image URL</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-slate-400">
                      <Camera size={16} />
                    </span>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={profileForm.profileImage}
                      onChange={(e) => setProfileForm({ ...profileForm, profileImage: e.target.value })}
                      className="w-full rounded-2xl border border-slate-200 bg-white/50 py-2.5 pl-11 pr-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Biography</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400">
                    <FileText size={16} />
                  </span>
                  <textarea
                    rows={3}
                    placeholder="Short bio description..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 py-2.5 pl-11 pr-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 px-6 py-2.5 text-sm font-bold text-white shadow"
                >
                  {profileLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="glass-card rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <Lock size={18} className="text-slate-400" />
              <span>Change Security Password</span>
            </h3>

            {passwordMessage && (
              <div className="mb-4 rounded-xl bg-green-50 p-4 text-xs font-bold text-green-700 dark:bg-green-950/20 dark:text-green-400">
                {passwordMessage}
              </div>
            )}
            {passwordError && (
              <div className="mb-4 rounded-xl bg-red-50 p-4 text-xs font-bold text-red-700 dark:bg-red-950/20 dark:text-red-400">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Old Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white/50 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full rounded-2xl border border-slate-200 bg-white/50 py-2.5 px-4 text-sm outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-500 px-6 py-2.5 text-sm font-bold text-white shadow"
                >
                  {passwordLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Change Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
