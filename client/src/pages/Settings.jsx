import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Settings as SettingsIcon, User, Briefcase, Shield, Save, Trash2, AlertTriangle, X, Sun, Moon, Monitor, KeyRound, Camera, Link2, Github, Linkedin, Twitter, Globe, Trash } from 'lucide-react';

export default function Settings() {
  const { user, token, updateProfile, deleteAccount, changePassword, updateAvatar, removeAvatar } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [title, setTitle] = useState(user?.title || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Avatar state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || '');
  const [avatarMessage, setAvatarMessage] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Social links state
  const [socials, setSocials] = useState([]);
  const [socialPlatform, setSocialPlatform] = useState('GitHub');
  const [socialUrl, setSocialUrl] = useState('');
  const [socialMessage, setSocialMessage] = useState('');
  const [socialsLoading, setSocialsLoading] = useState(true);

  // Password change state
  const [pwdCurrent, setPwdCurrent] = useState('');
  const [pwdNew, setPwdNew] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [pwdMessage, setPwdMessage] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Delete confirmation state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Theme state
  const [theme, setTheme] = useState(localStorage.getItem('devtask_theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('devtask_theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchSocials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSocials = async () => {
    try {
      const response = await fetch('/api/socials', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSocials(await response.json());
      }
    } catch (err) {
      console.error('Error fetching social links', err);
    } finally {
      setSocialsLoading(false);
    }
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(file);
    setAvatarMessage('');
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!avatarFile) return;
    setAvatarMessage('');
    setAvatarUploading(true);
    try {
      const data = await updateAvatar(avatarFile);
      setAvatarPreview(data.avatarUrl);
      setAvatarFile(null);
      setAvatarMessage('Profile photo updated successfully.');
    } catch (err) {
      setAvatarMessage(err.message || 'Failed to upload photo.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarRemove = async () => {
    setAvatarMessage('');
    try {
      await removeAvatar();
      setAvatarPreview('');
      setAvatarFile(null);
      setAvatarMessage('Profile photo removed.');
    } catch (err) {
      setAvatarMessage(err.message || 'Failed to remove photo.');
    }
  };

  const handleAddSocial = async (e) => {
    e.preventDefault();
    setSocialMessage('');
    try {
      const response = await fetch('/api/socials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ platform: socialPlatform, url: socialUrl })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add link');
      }
      setSocialUrl('');
      setSocials(prev => [data, ...prev]);
    } catch (err) {
      setSocialMessage(err.message);
    }
  };

  const handleDeleteSocial = async (id) => {
    try {
      const response = await fetch(`/api/socials/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSocials(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Error deleting social link', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      await updateProfile({ name, title });
      setMessage('Profile credentials successfully synchronized.');
    } catch (err) {
      setMessage(err.message || 'Failed to sync credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount();
      // After deletion, AuthContext logout() redirects to login automatically
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete account.');
      setDeleting(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMessage('');
    if (pwdNew !== pwdConfirm) {
      setPwdMessage('New password and confirmation do not match.');
      return;
    }
    setPwdLoading(true);
    try {
      await changePassword(pwdCurrent, pwdNew);
      setPwdMessage('Password successfully updated.');
      setPwdCurrent('');
      setPwdNew('');
      setPwdConfirm('');
    } catch (err) {
      setPwdMessage(err.message || 'Failed to update password.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="flex-grow p-4 md:p-8 bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-textMuted max-h-[calc(100vh-80px)] overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-mono font-bold text-slate-900 dark:text-textHeader flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-neonCyan" /> Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-textMuted mt-1">Configure workspace tags, security, and preferences</p>
        </div>

        {/* Profile Photo */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 flex items-center gap-2">
            <Camera className="w-4 h-4 text-neonCyan" /> Profile Photo
          </h3>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex flex-col items-center gap-2 shrink-0">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-2 border-neonCyan shadow-lg neon-glow-cyan" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-neonCyan/20 text-neonCyan border-2 border-dashed border-neonCyan/50 flex items-center justify-center">
                  <Camera className="w-8 h-8" />
                </div>
              )}
              <span className="text-[10px] font-mono text-slate-500 dark:text-textMuted">Max 2 MB · PNG/JPG</span>
            </div>

            <form onSubmit={handleAvatarUpload} className="flex-1 space-y-3 w-full">
              {avatarMessage && (
                <p className={`text-xs font-mono ${avatarMessage.includes('success') || avatarMessage.includes('removed') ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {avatarMessage}
                </p>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFile}
                className="block w-full text-xs font-mono text-slate-500 dark:text-textMuted file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-mono file:font-bold file:bg-slate-100 dark:file:bg-darkHover file:text-neonCyan hover:file:bg-slate-200 dark:hover:file:bg-darkBorder file:cursor-pointer cursor-pointer transition-all"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={!avatarFile || avatarUploading}
                  className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                    avatarFile && !avatarUploading
                      ? 'bg-gradient-to-r from-neonCyan to-neonTeal text-slate-950 hover:brightness-110 shadow-md'
                      : 'bg-slate-100 dark:bg-darkHover text-slate-400 dark:text-textMuted cursor-not-allowed'
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  {avatarUploading ? 'Uploading...' : 'Upload Photo'}
                </button>
                {user?.avatarUrl && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    className="px-4 py-2 border border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-xs font-mono font-bold flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 flex items-center gap-2">
            <Shield className="w-4 h-4 text-neonTeal" /> Security & Profile Settings
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            {message && (
              <div className={`p-3 rounded-lg text-xs font-mono text-center border ${
                message.includes('success') 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-medium text-slate-500 dark:text-textMuted mb-2">Display Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-medium text-slate-500 dark:text-textMuted mb-2">Primary Specialization</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-gradient-to-r from-neonCyan to-neonTeal text-slate-950 font-mono font-bold text-xs rounded-lg hover:brightness-110 flex items-center gap-1.5 shadow-md"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Sync Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Social Links */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-neonCyan" /> Social Links
          </h3>

          <form onSubmit={handleAddSocial} className="grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-3 mb-4">
            <select
              value={socialPlatform}
              onChange={(e) => setSocialPlatform(e.target.value)}
              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none transition-all"
            >
              <option value="GitHub">GitHub</option>
              <option value="LinkedIn">LinkedIn</option>
              <option value="Twitter">Twitter / X</option>
              <option value="Website">Website</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="url"
              required
              placeholder="https://github.com/username"
              value={socialUrl}
              onChange={(e) => setSocialUrl(e.target.value)}
              className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none transition-all"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-neonCyan to-neonTeal text-slate-950 font-mono font-bold text-xs rounded-lg hover:brightness-110 flex items-center justify-center gap-1.5 shadow-md"
            >
              <Link2 className="w-4 h-4" /> Add
            </button>
          </form>

          {socialMessage && (
            <p className="text-xs font-mono text-red-500 mb-3">{socialMessage}</p>
          )}

          {socialsLoading ? (
            <p className="text-xs font-mono text-slate-500 dark:text-textMuted">Loading social links...</p>
          ) : socials.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 dark:text-textMuted bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
              No social links configured yet. Add your GitHub, LinkedIn, or portfolio above.
            </p>
          ) : (
            <ul className="space-y-2">
              {socials.map(social => (
                <li
                  key={social.id}
                  className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5"
                >
                  <SocialIcon platform={social.platform} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-textHeader block">{social.platform}</span>
                    <a
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-neonCyan hover:underline truncate block"
                    >
                      {social.url}
                    </a>
                  </div>
                  <button
                    onClick={() => handleDeleteSocial(social.id)}
                    className="p-1.5 rounded bg-slate-100 dark:bg-darkHover border border-slate-200 dark:border-darkBorder text-slate-400 hover:text-red-400 transition-all"
                    title="Remove link"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Appearance — Theme Toggle */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 flex items-center gap-2">
            <Monitor className="w-4 h-4 text-neonCyan" /> Appearance
          </h3>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-mono font-semibold text-slate-900 dark:text-textHeader">Theme Mode</p>
              <p className="text-xs text-slate-500 dark:text-textMuted mt-1">Switch between light and dark interface</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 rounded-xl p-1 border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all duration-300 ${
                  theme === 'light'
                    ? 'bg-white dark:bg-slate-800 text-amber-500 shadow-md border border-slate-200 dark:border-slate-700'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Sun className="w-4 h-4" /> Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono font-bold transition-all duration-300 ${
                  theme === 'dark'
                    ? 'bg-slate-800 text-neonCyan shadow-md border border-slate-700'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <Moon className="w-4 h-4" /> Dark
              </button>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-neonCyan" /> Change Password
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwdMessage && (
              <div className={`p-3 rounded-lg text-xs font-mono text-center border ${
                pwdMessage.includes('successfully')
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                {pwdMessage}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono font-medium text-slate-500 dark:text-textMuted mb-2">Current Password</label>
              <input
                type="password"
                value={pwdCurrent}
                onChange={(e) => setPwdCurrent(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none transition-all"
                required
                autoComplete="current-password"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono font-medium text-slate-500 dark:text-textMuted mb-2">New Password</label>
                <input
                  type="password"
                  value={pwdNew}
                  onChange={(e) => setPwdNew(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none transition-all"
                  required
                  minLength="6"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-xs font-mono font-medium text-slate-500 dark:text-textMuted mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={pwdConfirm}
                  onChange={(e) => setPwdConfirm(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-neonCyan outline-none transition-all"
                  required
                  minLength="6"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={pwdLoading}
                className="px-4 py-2 bg-gradient-to-r from-neonCyan to-neonTeal text-slate-950 font-mono font-bold text-xs rounded-lg hover:brightness-110 flex items-center gap-1.5 shadow-md"
              >
                <KeyRound className="w-4 h-4" />
                {pwdLoading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Danger Zone — Delete Account & Workspace */}
        <div className="bg-white dark:bg-darkSurface border border-red-200 dark:border-red-500/20 rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-mono font-bold text-red-600 dark:text-red-400 border-b border-red-100 dark:border-red-500/10 pb-3 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Danger Zone
          </h3>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-sm font-mono font-semibold text-slate-900 dark:text-textHeader">Delete Account & Workspace</p>
              <p className="text-xs text-slate-500 dark:text-textMuted mt-1 leading-relaxed max-w-md">
                Permanently delete your account and all workspace data — tasks, courses, analytics, and profile. 
                This action is <span className="text-red-500 font-bold">irreversible</span>.
              </p>
            </div>
            <button
              onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); setDeleteError(''); }}
              className="px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 font-mono font-bold text-xs rounded-lg hover:bg-red-500/20 hover:border-red-500/50 transition-all flex items-center gap-2 shrink-0"
            >
              <Trash2 className="w-4 h-4" /> Delete Workspace
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b border-red-100 dark:border-red-500/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-mono font-bold text-slate-900 dark:text-textHeader">Confirm Workspace Deletion</h3>
                <p className="text-[10px] text-red-500 font-mono uppercase tracking-wide font-semibold">Irreversible Action</p>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-textMuted dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-red-500/5 border border-red-500/15 rounded-lg p-4">
                <p className="text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed">
                  This will <span className="text-red-500 font-bold">permanently delete</span> the following:
                </p>
                <ul className="mt-3 space-y-1.5 text-xs font-mono text-slate-600 dark:text-textMuted">
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Your user account & credentials</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> All tasks across every board column</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> All courses & roadmap progress</li>
                  <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400"></span> Daily analytics & coding hour logs</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-textMuted mb-2">
                  Type <span className="text-red-500 font-bold select-all">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-textHeader font-mono focus:border-red-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                  autoFocus
                />
              </div>

              {deleteError && (
                <div className="p-3 rounded-lg text-xs font-mono text-center bg-red-500/10 border border-red-500/20 text-red-500">
                  {deleteError}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-textMuted border border-slate-300 dark:border-slate-800 rounded-lg hover:text-slate-950 dark:hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className={`px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                  deleteConfirmText === 'DELETE'
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleting ? 'Purging workspace...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SocialIcon({ platform }) {
  const normalized = (platform || '').toLowerCase();
  if (normalized.includes('github')) return <Github className="w-5 h-5 text-slate-400 dark:text-textMuted shrink-0" />;
  if (normalized.includes('linkedin')) return <Linkedin className="w-5 h-5 text-neonCyan shrink-0" />;
  if (normalized.includes('twitter') || normalized === 'x') return <Twitter className="w-5 h-5 text-neonTeal shrink-0" />;
  if (normalized.includes('website') || normalized.includes('web') || normalized.includes('portfolio')) return <Globe className="w-5 h-5 text-neonTeal shrink-0" />;
  return <Link2 className="w-5 h-5 text-slate-400 dark:text-textMuted shrink-0" />;
}
