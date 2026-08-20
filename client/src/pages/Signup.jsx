import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, Briefcase, ChevronRight } from 'lucide-react';

export default function Signup({ navigateToLogin }) {
  const { signup } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [title, setTitle] = useState('Full Stack Developer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim().toLowerCase().endsWith('@devtask.io')) {
      setError('Only @devtask.io email addresses are allowed');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password, title);
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-darkBg flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-darkSurface border border-slate-800 rounded-2xl p-6 md:p-8 relative shadow-2xl overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-neonCyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-neonTeal/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <img
            src="/devtask-logo.png"
            alt="DevTask logo"
            className="w-16 h-16 rounded-xl object-cover neon-glow-cyan mb-3"
          />
          <h2 className="text-2xl font-bold font-mono text-textHeader tracking-wide">Initialize DevTask</h2>
          <p className="text-xs text-textMuted mt-1">Spin up your custom engineering environment</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs font-mono text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-medium text-textMuted mb-2">Developer Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Ada Lovelace"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-textHeader font-mono focus:border-neonCyan outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-textMuted mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="ada@devtask.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-textHeader font-mono focus:border-neonCyan outline-none transition-all"
                required
              />
            </div>
            <p className="text-[10px] font-mono text-textMuted mt-1.5">Organization email required — must end with <span className="text-neonTeal">@devtask.io</span></p>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-textMuted mb-2">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                minLength="6"
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-textHeader font-mono focus:border-neonCyan outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-textMuted mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                minLength="6"
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-textHeader font-mono focus:border-neonCyan outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-medium text-textMuted mb-2">Primary Specialization</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <select
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-textHeader font-mono focus:border-neonCyan outline-none transition-all appearance-none"
              >
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Frontend Engineer">Frontend Engineer</option>
                <option value="Backend Engineer">Backend Engineer</option>
                <option value="DevOps & Cloud Engineer">DevOps & Cloud Engineer</option>
                <option value="Computer Science Learner">Computer Science Learner</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-neonCyan to-neonTeal text-slate-950 font-mono font-bold rounded-lg hover:brightness-110 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Account...' : 'Deploy Environment'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-textMuted mt-6 font-mono">
          Already verified?{' '}
          <button onClick={navigateToLogin} className="text-neonCyan hover:underline">
            Establish Session
          </button>
        </p>
      </div>
    </div>
  );
}
