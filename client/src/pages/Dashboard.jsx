import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { Clock, CheckSquare, Zap, GraduationCap, Code2, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const analytics = await response.json();
      setData(analytics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-darkBg text-neonCyan font-mono">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-neonCyan border-t-transparent rounded-full animate-spin"></div>
          <span>Loading telemetry stream...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-8 bg-darkBg">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <div>
            <h4 className="font-bold font-mono">Telemetry Error</h4>
            <p className="text-sm font-mono">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const summary = data?.summary || { totalCodingHours: 0, activeTasks: 0, sprintVelocity: 0, completedCourses: 0 };
  const weeklyCoding = data?.weeklyCoding || [];
  const taskStatusDistribution = data?.taskStatusDistribution || [];
  const skillMastery = data?.skillMastery || [];

  const maxLoggedHours = Math.max(10, ...weeklyCoding.map(d => d.hours));
  const yMax = Math.ceil(maxLoggedHours / 2) * 2;
  const yTicks = [];
  for (let v = 0; v <= yMax; v += 2) yTicks.push(v);

  const COLORS = ['#38BDF8', '#818CF8', '#A78BFA', '#34D399'];

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-textMuted space-y-8 max-h-[calc(100vh-80px)]">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Metric 1 */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-6 rounded-xl relative overflow-hidden group shadow-sm">
          <div className="absolute right-0 bottom-0 text-neonCyan/5 translate-y-2 translate-x-2 group-hover:scale-110 transition-transform duration-300">
            <Clock className="w-32 h-32 stroke-[1]" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold tracking-widest text-slate-500 dark:text-textMuted uppercase">Coding Practice</span>
            <div className="p-2 rounded-lg bg-neonCyan/10 text-neonCyan border border-neonCyan/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-mono font-bold text-slate-900 dark:text-textHeader">{summary.totalCodingHours.toFixed(1)}h</h3>
          <p className="text-xs text-slate-500 dark:text-textMuted mt-1">Total aggregated hours</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-6 rounded-xl relative overflow-hidden group shadow-sm">
          <div className="absolute right-0 bottom-0 text-neonTeal/5 translate-y-2 translate-x-2 group-hover:scale-110 transition-transform duration-300">
            <CheckSquare className="w-32 h-32 stroke-[1]" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold tracking-widest text-slate-500 dark:text-textMuted uppercase">Active Backlog</span>
            <div className="p-2 rounded-lg bg-neonTeal/10 text-neonTeal border border-neonTeal/20">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-mono font-bold text-slate-900 dark:text-textHeader">{summary.activeTasks}</h3>
          <p className="text-xs text-slate-500 dark:text-textMuted mt-1">Incomplete tasks</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-6 rounded-xl relative overflow-hidden group shadow-sm">
          <div className="absolute right-0 bottom-0 text-indigo-500/5 translate-y-2 translate-x-2 group-hover:scale-110 transition-transform duration-300">
            <Zap className="w-32 h-32 stroke-[1]" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold tracking-widest text-slate-500 dark:text-textMuted uppercase">Sprint Velocity</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-mono font-bold text-slate-900 dark:text-textHeader">{summary.sprintVelocity}%</h3>
          <p className="text-xs text-slate-500 dark:text-textMuted mt-1">Tasks resolved</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-6 rounded-xl relative overflow-hidden group shadow-sm">
          <div className="absolute right-0 bottom-0 text-purple-500/5 translate-y-2 translate-x-2 group-hover:scale-110 transition-transform duration-300">
            <GraduationCap className="w-32 h-32 stroke-[1]" />
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono font-bold tracking-widest text-slate-500 dark:text-textMuted uppercase">Syllabus Progress</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-3xl font-mono font-bold text-slate-900 dark:text-textHeader">{summary.completedCourses}</h3>
          <p className="text-xs text-slate-500 dark:text-textMuted mt-1">Completed tracks</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left main chart (Weekly coding tracker) */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-6 rounded-xl lg:col-span-2 shadow-sm min-w-0">
          <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader mb-6 tracking-wide flex items-center gap-2">
            <Code2 className="w-4 h-4 text-neonCyan" /> 7-DAY INTENSITY TRACKER
          </h3>
          <div className="h-56 md:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyCoding} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} interval="preserveStartEnd" minTickGap={12} stroke="#475569" fontSize={isMobile ? 9 : 11} fontFamily="JetBrains Mono" />
                <YAxis domain={[0, yMax]} ticks={yTicks} width={isMobile ? 30 : 60} stroke="#475569" fontSize={isMobile ? 9 : 11} fontFamily="JetBrains Mono" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121212', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC', fontFamily: 'JetBrains Mono' }}
                />
                <Area type="monotone" dataKey="hours" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right chart (Task Distribution) */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-6 rounded-xl flex flex-col justify-between shadow-sm min-w-0">
          <div>
            <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader mb-6 tracking-wide">TASK DISTRIBUTION</h3>
            <div className="h-52 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {taskStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121212', borderColor: '#334155', borderRadius: '8px', color: '#F8FAFC', fontFamily: 'JetBrains Mono' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-4 border-t border-slate-100 dark:border-darkBorder">
            {taskStatusDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }}></span>
                <span className="text-slate-500 dark:text-textMuted">{entry.name}:</span>
                <span className="text-slate-900 dark:text-textHeader font-bold">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skill Mastery Progress Sparklines */}
      <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-6 rounded-xl shadow-sm">
        <h3 className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader mb-6 tracking-wide">TECHNOLOGY PROGRESS & MASTERY</h3>
        {skillMastery.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-textMuted font-mono">No tasks with technology tags resolved yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skillMastery.map((skill) => (
              <div key={skill.name} className="space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-900 dark:text-textHeader font-bold">{skill.name}</span>
                  <span className="text-neonCyan">{skill.value}% XP</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-darkInput h-2 rounded-full overflow-hidden border border-slate-200 dark:border-darkInput">
                  <div
                    className="bg-gradient-to-r from-neonCyan to-neonTeal h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, skill.value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
