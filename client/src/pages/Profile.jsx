import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Settings, Flame, Link2, Github, Linkedin, Twitter, Globe, BookOpen, Award, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const currentMonthKey = (() => {
  const n = new Date();
  return `${n.getUTCFullYear()}-${String(n.getUTCMonth() + 1).padStart(2, '0')}`;
})();

function formatDuration(hours) {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const parts = [];
  if (h > 0) parts.push(`${h} hour${h === 1 ? '' : 's'}`);
  if (m > 0) parts.push(`${m} minute${m === 1 ? '' : 's'}`);
  return parts.length ? parts.join(' ') : '0 minutes';
}

function dayCellClass(hours) {
  if (hours <= 0) return 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800';
  if (hours < 1) return 'bg-emerald-500/40 border border-emerald-500/40';
  if (hours < 2) return 'bg-emerald-500/70 border border-emerald-500/70';
  return 'bg-emerald-500 border border-emerald-500';
}

function buildMonthRows(activity) {
  if (!activity.length) return [];
  const first = new Date(activity[0].date + 'T00:00:00Z');
  const year = first.getUTCFullYear();
  const month = first.getUTCMonth();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const leading = (first.getUTCDay() + 6) % 7;
  const hoursByDate = {};
  activity.forEach(d => { hoursByDate[d.date] = d.hours; });
  const rows = [];
  let week = [];
  for (let i = 0; i < leading; i++) week.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    week.push({ date, hours: hoursByDate[date] || 0 });
    if (week.length === 7) { rows.push(week); week = []; }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    rows.push(week);
  }
  return rows;
}

export default function Profile({ onNavigateToSettings }) {
  const { user, token } = useAuth();
  const [socials, setSocials] = useState([]);
  const [socialsLoading, setSocialsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [viewedMonth, setViewedMonth] = useState(currentMonthKey);

  const streak = user?.streak || 0;

  useEffect(() => {
    fetchSocials();
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedMonth]);

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

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setCourses(await response.json());
      }
    } catch (err) {
      console.error('Error fetching courses', err);
    }
  };

  const fetchAnalytics = async () => {
    setAnalytics(null);
    try {
      const response = await fetch(`/api/analytics?month=${viewedMonth}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setAnalytics(await response.json());
      }
    } catch (err) {
      console.error('Error fetching analytics', err);
    }
  };

  const goMonth = (delta) => {
    setViewedMonth(prev => {
      const [y, m] = prev.split('-').map(Number);
      const d = new Date(Date.UTC(y, m - 1 + delta, 1));
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    });
  };

  const canGoNext = viewedMonth < currentMonthKey;

  const learnedCourses = courses.filter(c => c.progressPercent === 100 || c.status === 'COMPLETED');
  const learningCourses = courses.filter(c => c.status === 'IN_PROGRESS');

  const monthActivity = analytics?.monthActivity || [];
  const monthSessions = analytics?.monthSessions || 0;
  const monthHours = analytics?.monthHours || 0;
  const monthLabel = monthActivity.length
    ? new Date(monthActivity[0].date + 'T00:00:00Z').toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    : '';
  const monthWeeks = buildMonthRows(monthActivity);

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
            title={`${streak} consecutive study day${streak === 1 ? '' : 's'}`}
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

        {/* Learning / Learned Courses */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
          <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-neonCyan" /> Learning / Learned Courses
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-textMuted uppercase tracking-widest">Learning</span>
                <span className="text-xs font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  {learningCourses.length}
                </span>
              </div>
              {learningCourses.length === 0 ? (
                <p className="text-xs font-mono text-slate-500 dark:text-textMuted bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
                  No courses in progress.
                </p>
              ) : (
                <ul className="space-y-2">
                  {learningCourses.map(course => (
                    <li key={course.id} className="flex items-center gap-2.5 bg-indigo-500/5 dark:bg-slate-950 border border-indigo-500/15 rounded-lg px-3 py-2">
                      <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="text-xs font-mono text-slate-900 dark:text-textHeader truncate flex-1">{course.title}</span>
                      <span className="text-[10px] font-mono text-indigo-400 shrink-0">{course.progressPercent}%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-textMuted uppercase tracking-widest">Learned</span>
                <span className="text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {learnedCourses.length}
                </span>
              </div>
              {learnedCourses.length === 0 ? (
                <p className="text-xs font-mono text-slate-500 dark:text-textMuted bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
                  No completed courses yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {learnedCourses.map(course => (
                    <li key={course.id} className="flex items-center gap-2.5 bg-emerald-500/5 dark:bg-slate-950 border border-emerald-500/15 rounded-lg px-3 py-2">
                      <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-mono text-slate-900 dark:text-textHeader truncate flex-1">{course.title}</span>
                      <span className="text-[10px] font-mono text-emerald-400 shrink-0">100%</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

        {/* Learning Activity */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-md">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
            <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-neonCyan" /> Learning Activity
            </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goMonth(-1)}
              disabled={analytics === null}
              className="p-1.5 rounded-md bg-slate-100 dark:bg-darkHover border border-slate-200 dark:border-darkBorder text-slate-500 dark:text-textMuted hover:text-neonCyan hover:border-neonCyan/40 transition-all disabled:opacity-40 disabled:hover:text-slate-500 dark:disabled:hover:text-textMuted disabled:hover:border-slate-200 dark:disabled:hover:border-darkBorder"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-500 dark:text-textMuted w-20 text-center">{monthLabel}</span>
            <button
              onClick={() => goMonth(1)}
              disabled={!canGoNext || analytics === null}
              className="p-1.5 rounded-md bg-slate-100 dark:bg-darkHover border border-slate-200 dark:border-darkBorder text-slate-500 dark:text-textMuted hover:text-neonCyan hover:border-neonCyan/40 transition-all disabled:opacity-40 disabled:hover:text-slate-500 dark:disabled:hover:text-textMuted disabled:hover:border-slate-200 dark:disabled:hover:border-darkBorder"
              title={canGoNext ? 'Next month' : 'Latest month'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          </div>

          {analytics === null ? (
            <p className="text-xs font-mono text-slate-500 dark:text-textMuted">Loading activity...</p>
          ) : monthActivity.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 dark:text-textMuted bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-4 text-center">
              No study hours logged this month yet. Add a duration to a task to get started.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                <div className="flex gap-2">
                  {DAY_LABELS.map(label => (
                    <span key={label} className="w-6 md:w-8 text-[9px] sm:text-[10px] font-mono text-slate-400 dark:text-textMuted text-center uppercase">{label}</span>
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  {monthWeeks.map((week, wi) => (
                    <div key={wi} className="flex gap-2">
                      {week.map((cell, ri) => cell ? (
                        <div
                          key={cell.date}
                          title={`${cell.date} · ${cell.hours} study hour${cell.hours === 1 ? '' : 's'}`}
                          className={`h-6 w-6 md:h-8 md:w-8 rounded-md ${dayCellClass(cell.hours)}`}
                        />
                      ) : (
                        <div key={`empty-${wi}-${ri}`} className="h-6 w-6 md:h-8 md:w-8 rounded-md" />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1 pt-3 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs font-mono text-slate-500 dark:text-textMuted">
                  <span className="font-bold text-sm text-slate-900 dark:text-textHeader">{monthSessions}</span> learning session{monthSessions === 1 ? '' : 's'}
                </p>
                <p className="text-xs font-mono text-slate-500 dark:text-textMuted">
                  <span className="font-bold text-sm text-slate-900 dark:text-textHeader">{formatDuration(monthHours)}</span>
                </p>
              </div>
            </div>
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
