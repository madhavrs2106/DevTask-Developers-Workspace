import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Settings, Flame, Link2, Github, Linkedin, Twitter, Globe } from 'lucide-react';

export default function Profile({ onNavigateToSettings }) {
  const { user, token } = useAuth();
  const [socials, setSocials] = useState([]);
  const [socialsLoading, setSocialsLoading] = useState(true);

  const streak = user?.streak || 0;

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

  return (
    <div className="flex-grow p-4 md:p-8 bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-textMuted max-h-[calc(100vh-80px)] overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-mono font-bold text-slate-900 dark:text-textHeader flex items-center gap-2">
              <User className="w-5 h-5 text-neonCyan" /> Developer Profile
            </h2>
            <p className="text-xs text-slate-500 dark:text-textMuted mt-1">Your developer identity and online presence</p>
          </div>
          <button
            onClick={onNavigateToSettings}
            className="p-2.5 rounded-lg bg-slate-100 dark:bg-darkHover border border-slate-200 dark:border-darkBorder text-slate-600 dark:text-textMuted hover:text-neonCyan hover:border-neonCyan/40 transition-all duration-300"
            title="Edit profile in Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Summary */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md flex flex-col md:flex-row items-center gap-6">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-neonCyan shadow-lg neon-glow-cyan"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-neonCyan/20 text-neonCyan border-2 border-neonCyan flex items-center justify-center text-3xl font-mono font-bold uppercase shadow-lg">
              {user?.name?.charAt(0) || 'D'}
            </div>
          )}
          <div className="flex-1 text-center md:text-left space-y-1">
            <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-textHeader">{user?.name}</h3>
            <p className="text-sm font-mono text-neonCyan">{user?.title}</p>
            <p className="text-xs text-slate-500 dark:text-textMuted flex items-center justify-center md:justify-start gap-1">
              <Mail className="w-3.5 h-3.5" /> {user?.email}
            </p>
          </div>
          <div
            title={`${streak} consecutive active day${streak === 1 ? '' : 's'}`}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full border font-mono text-sm font-bold shrink-0 ${
              streak > 0
                ? 'bg-orange-500/10 border-orange-500/25 text-orange-500 dark:text-orange-400'
                : 'bg-slate-100 dark:bg-darkHover border-slate-200 dark:border-darkBorder text-slate-400 dark:text-textMuted'
            }`}
          >
            <Flame className="w-5 h-5" />
            <span>{streak}</span>
          </div>
        </div>

        {/* Social Links (read-only) */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-neonCyan" /> Social Links
          </h3>

          {socialsLoading ? (
            <p className="text-xs font-mono text-slate-500 dark:text-textMuted">Loading social links...</p>
          ) : socials.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 dark:text-textMuted bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
              No social links configured yet. Add them from Settings.
            </p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {socials.map(social => (
                <li
                  key={social.id}
                  className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-3"
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialIcon({ platform }) {
  const normalized = platform.toLowerCase();
  if (normalized.includes('github')) return <Github className="w-5 h-5 text-slate-400 dark:text-textMuted shrink-0" />;
  if (normalized.includes('linkedin')) return <Linkedin className="w-5 h-5 text-neonCyan shrink-0" />;
  if (normalized.includes('twitter') || normalized.includes('x')) return <Twitter className="w-5 h-5 text-neonTeal shrink-0" />;
  if (normalized.includes('website') || normalized.includes('web') || normalized.includes('portfolio')) return <Globe className="w-5 h-5 text-neonTeal shrink-0" />;
  return <Link2 className="w-5 h-5 text-slate-400 dark:text-textMuted shrink-0" />;
}
