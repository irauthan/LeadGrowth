import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { getProfileImageUrl } from '../utils/imageUrl';
import { 
  User as UserIcon, 
  Lock, 
  Loader2, 
  Smartphone, 
  Briefcase, 
  FileText,
  Camera,
  Upload,
  Trash2
} from 'lucide-react';

const compressImageFile = (file: File, maxWidth = 350, maxHeight = 350, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

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

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setProfileError('Image size should be less than 8MB.');
      return;
    }

    try {
      const compressedBase64 = await compressImageFile(file);
      setProfileForm((prev) => ({ ...prev, profileImage: compressedBase64 }));
      setProfileError('');
    } catch (err) {
      console.error(err);
      setProfileError('Failed to process image file.');
    }
  };

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
        <h1 className="text-3xl font-extrabold tracking-tight text-theme-text font-sans">Settings & Profile</h1>
        <p className="mt-1 text-sm text-theme-text-muted">
          Manage your personal account credentials, designations, and workspace preferences.
        </p>
      </div>

      {/* Main grids */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left pane: Profile summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm flex flex-col items-center text-center">
            {/* Avatar picker container */}
            <div className="relative group mb-4">
              {profileForm.profileImage ? (
                <img
                  src={getProfileImageUrl(profileForm.profileImage)}
                  alt="avatar"
                  className="h-28 w-28 rounded-3xl object-cover shadow-md border-2 border-theme-border"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-theme-primary text-3xl font-extrabold text-white shadow-md">
                  {getInitials(user?.fullName || '')}
                </div>
              )}
              <label
                htmlFor="avatar-file-input"
                className="absolute inset-0 rounded-3xl bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer text-white text-[11px] font-extrabold gap-1 backdrop-blur-xs shadow-lg"
              >
                <Camera size={22} />
                <span>Upload Photo</span>
              </label>
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleImageFileUpload}
                className="hidden"
              />
            </div>

            <h3 className="text-xl font-bold text-theme-text">{user?.fullName}</h3>
            <p className="text-xs text-theme-primary font-bold mt-1 uppercase tracking-wider">{user?.roles[0]?.replace('ROLE_', '')}</p>
            <p className="text-xs text-theme-text-muted mt-0.5 leading-normal">{user?.email}</p>

            {user?.bio && (
              <p className="mt-5 text-xs text-theme-text-muted border-t border-theme-border/40 pt-4 w-full leading-normal">
                "{user.bio}"
              </p>
            )}
          </div>
        </div>

        {/* Center/Right pane: Edit fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Profile */}
          <div className="glass-card rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
            <h3 className="text-lg font-bold text-theme-text mb-6 flex items-center gap-2">
              <UserIcon size={18} className="text-theme-text-muted" />
              <span>Profile Settings</span>
            </h3>

            {profileMessage && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-bold text-emerald-400">
                {profileMessage}
              </div>
            )}
            {profileError && (
              <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-bold text-rose-400">
                {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Phone Number</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-theme-text-muted">
                      <Smartphone size={16} />
                    </span>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 pl-11 pr-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Designation / Title</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-4 flex items-center text-theme-text-muted">
                      <Briefcase size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Lead Analyst"
                      value={profileForm.designation}
                      onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                      className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 pl-11 pr-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Profile Avatar Photo</label>
                  <div className="flex items-center gap-3 mt-1">
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-theme-bg-alt border border-theme-border text-xs font-bold text-theme-text hover:bg-theme-border/40 cursor-pointer transition-all">
                      <Upload size={16} className="text-theme-primary" />
                      <span>{profileForm.profileImage ? 'Change Photo File' : 'Upload Photo File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileUpload}
                        className="hidden"
                      />
                    </label>
                    {profileForm.profileImage && (
                      <button
                        type="button"
                        onClick={() => setProfileForm({ ...profileForm, profileImage: '' })}
                        className="px-3.5 py-2.5 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 text-xs font-bold hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Trash2 size={14} /> Remove Photo
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] font-semibold text-theme-text-muted">Choose any JPG, PNG, WEBP, GIF or SVG file (Max 5MB)</p>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Biography</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-theme-text-muted">
                    <FileText size={16} />
                  </span>
                  <textarea
                    rows={3}
                    placeholder="Short bio description..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 pl-11 pr-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
              </div>

              
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex items-center gap-2 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all"
                >
                  {profileLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="glass-card rounded-3xl border border-theme-border bg-theme-card p-6 shadow-sm">
            <h3 className="text-lg font-bold text-theme-text mb-6 flex items-center gap-2">
              <Lock size={18} className="text-theme-text-muted" />
              <span>Change Security Password</span>
            </h3>

            {passwordMessage && (
              <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-xs font-bold text-emerald-400">
                {passwordMessage}
              </div>
            )}
            {passwordError && (
              <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-xs font-bold text-rose-400">
                {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Old Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-theme-text-muted">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full rounded-2xl border border-theme-border bg-theme-bg-alt py-2.5 px-4 text-sm outline-none focus:border-theme-primary text-theme-text"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center gap-2 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all"
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
