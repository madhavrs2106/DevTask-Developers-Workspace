import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid
} from 'recharts';
import {
  Clock, CheckSquare, Zap, GraduationCap, Code2, AlertCircle,
  Flame, Target, TrendingUp, CalendarDays, BarChart3, Layers
} from 'lucide-react';

const COLORS = ['#7aa2f7', '#7dcfff', '#bb9af7', '#9ece6a', '#e0af68', '#f7768e'];
const STATUS_COLORS = { TODO: '#a9b1d6', IN_PROGRESS: '#7aa2f7', IN_REVIEW: '#bb9af7', DONE: '#9ece6a' };
const DIFF_COLORS = { BEGINNER: '#9ece6a', INTERMEDIATE: '#e0af68', ADVANCED: '#f7768e' };
const FONT = 'JetBrains Mono, monospace';

const tooltipStyle = {
  backgroundColor: '#16161e',
  border: '1px solid #292e42',
  borderRadius: '8px',
  color: '#c0caf5',
  fontFamily: FONT,
  fontSize: '11px',
  padding: '8px 12px',
};

function MetricCard({ icon: Icon, iconColor, label, value, sub, sparkData, sparkColor }) {
  return (
    <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-5 rounded-xl relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-300 translate-y-3 translate-x-3">
        <Icon className="w-28 h-28 stroke-[1]" />
      </div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-slate-400 dark:text-textMuted uppercase">{label}</span>
        <div className={`p-1.5 rounded-md border ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <h3 className="text-2xl md:text-3xl font-mono font-bold text-slate-900 dark:text-textHeader">{value}</h3>
      <p className="text-[11px] text-slate-400 dark:text-textMuted mt-1 font-mono">{sub}</p>
      {sparkData && sparkData.length > 0 && (
        <div className="mt-3 h-8">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={sparkColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={sparkColor} strokeWidth={1.5} fill={`url(#spark-${label})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function MonthHeatmap({ data, maxHours }) {
  const weeks = useMemo(() => {
    if (!data || data.length === 0) return [];
    const grid = [];
    let week = new Array(7).fill(null);
    const firstDay = new Date(data[0].date + 'T00:00:00Z').getUTCDay();
    let dayIndex = 0;

    for (let i = 0; i < firstDay; i++) week[i] = { date: '', hours: 0, empty: true };

    for (const d of data) {
      const dow = (firstDay + dayIndex) % 7;
      week[dow] = d;
      if (dow === 6 || dayIndex === data.length - 1) {
        grid.push(week);
        week = new Array(7).fill(null);
      }
      dayIndex++;
    }
    if (week.some(d => d !== null)) grid.push(week);
    return grid;
  }, [data]);

  const getColor = (hours) => {
    if (!hours || hours === 0) return 'bg-slate-100 dark:bg-darkHover';
    const ratio = maxHours > 0 ? hours / maxHours : 0;
    if (ratio < 0.25) return 'bg-neonCyan/20';
    if (ratio < 0.5) return 'bg-neonCyan/40';
    if (ratio < 0.75) return 'bg-neonCyan/60';
    return 'bg-neonCyan/90';
  };

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 mb-2">
        {dayLabels.map((d, i) => (
          <div key={i} className="text-center text-[9px] font-mono text-slate-400 dark:text-textMuted font-bold">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {weeks.flat().map((cell, i) => {
          if (!cell || cell.empty) return <div key={i} className="aspect-square" />;
          const dayNum = cell.date ? cell.date.split('-')[2] : '';
          return (
            <div
              key={i}
              title={`${cell.date}: ${cell.hours.toFixed(1)}h`}
              className={`aspect-square rounded-md ${getColor(cell.hours)} flex items-center justify-center transition-all duration-200 hover:ring-1 hover:ring-neonCyan/50 cursor-default`}
            >
              <span className="text-[8px] font-mono text-slate-500 dark:text-textMuted">{dayNum}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[9px] font-mono text-slate-400 dark:text-textMuted">Less</span>
        {['bg-slate-100 dark:bg-darkHover', 'bg-neonCyan/20', 'bg-neonCyan/40', 'bg-neonCyan/60', 'bg-neonCyan/90'].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[9px] font-mono text-slate-400 dark:text-textMuted">More</span>
      </div>
    </div>
  );
}

function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#c0caf5" textAnchor="middle" dominantBaseline="central" fontSize={11} fontFamily={FONT} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

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

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      setData(await response.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 dark:bg-darkBg text-neonCyan font-mono">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neonCyan border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Initializing telemetry stream...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-4 md:p-8 bg-slate-50 dark:bg-darkBg">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <h4 className="font-bold font-mono text-sm">Telemetry Error</h4>
            <p className="text-xs font-mono mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const summary = data?.summary || { totalCodingHours: 0, activeTasks: 0, sprintVelocity: 0, completedCourses: 0, completedTasks: 0 };
  const weeklyCoding = data?.weeklyCoding || [];
  const monthActivity = data?.monthActivity || [];
  const monthHours = data?.monthHours || 0;
  const monthSessions = data?.monthSessions || 0;
  const taskStatusDistribution = data?.taskStatusDistribution || [];
  const difficultyDistribution = data?.difficultyDistribution || {};
  const skillMastery = data?.skillMastery || [];

  const totalTasks = summary.activeTasks + summary.completedTasks;
  const monthMaxHours = Math.max(1, ...monthActivity.map(d => d.hours));

  const weekSpark = weeklyCoding.map(d => ({ v: d.hours }));
  const taskSpark = [
    { v: summary.completedTasks },
    { v: totalTasks }
  ];
  const courseSpark = [{ v: summary.completedCourses }];

  const diffData = [
    { name: 'Beginner', count: difficultyDistribution.BEGINNER || 0, color: DIFF_COLORS.BEGINNER },
    { name: 'Intermediate', count: difficultyDistribution.INTERMEDIATE || 0, color: DIFF_COLORS.INTERMEDIATE },
    { name: 'Advanced', count: difficultyDistribution.ADVANCED || 0, color: DIFF_COLORS.ADVANCED },
  ];
  const maxDiffCount = Math.max(1, ...diffData.map(d => d.count));

  return (
    <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-textMuted space-y-6 max-h-[calc(100vh-80px)]">

      {/* ─── ROW 1: Key Metrics ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Clock}
          iconColor="bg-neonCyan/10 text-neonCyan border-neonCyan/20"
          label="Total Hours"
          value={`${summary.totalCodingHours.toFixed(1)}h`}
          sub={`${monthHours.toFixed(1)}h this month`}
          sparkData={weekSpark}
          sparkColor="#7aa2f7"
        />
        <MetricCard
          icon={CheckSquare}
          iconColor="bg-neonTeal/10 text-neonTeal border-neonTeal/20"
          label="Active Tasks"
          value={summary.activeTasks}
          sub={`${totalTasks} total tasks`}
          sparkData={taskSpark}
          sparkColor="#7dcfff"
        />
        <MetricCard
          icon={Zap}
          iconColor="bg-purple-500/10 text-purple-400 border-purple-500/20"
          label="Velocity"
          value={`${summary.sprintVelocity}%`}
          sub={`${summary.completedTasks} tasks done`}
          sparkData={weekSpark}
          sparkColor="#bb9af7"
        />
        <MetricCard
          icon={GraduationCap}
          iconColor="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          label="Courses"
          value={summary.completedCourses}
          sub={`${monthSessions} sessions this month`}
          sparkData={courseSpark}
          sparkColor="#9ece6a"
        />
      </div>

      {/* ─── ROW 2: 7-Day Chart + Task Status Donut ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 7-Day Intensity Tracker */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-5 rounded-xl lg:col-span-2 shadow-sm min-w-0">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-textHeader tracking-[0.15em] flex items-center gap-2">
              <Code2 className="w-4 h-4 text-neonCyan" /> 7-DAY INTENSITY TRACKER
            </h3>
            <span className="text-[10px] font-mono text-slate-400 dark:text-textMuted">
              Avg: {(weeklyCoding.reduce((s, d) => s + d.hours, 0) / 7).toFixed(1)}h/day
            </span>
          </div>
          <div className="h-52 md:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyCoding} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7aa2f7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#7aa2f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#292e42" vertical={false} />
                <XAxis dataKey="date" tickFormatter={d => d.slice(5)} interval="preserveStartEnd" minTickGap={12} stroke="#475569" fontSize={isMobile ? 9 : 10} fontFamily={FONT} tickLine={false} />
                <YAxis stroke="#475569" fontSize={isMobile ? 9 : 10} fontFamily={FONT} tickLine={false} axisLine={false} width={35} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v.toFixed(1)}h`, 'Hours']} labelFormatter={l => `Date: ${l}`} />
                <Area type="monotone" dataKey="hours" stroke="#7aa2f7" strokeWidth={2.5} fillOpacity={1} fill="url(#gradHours)" dot={{ r: 3, fill: '#7aa2f7', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#7aa2f7', stroke: '#16161e', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Status Donut */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-5 rounded-xl shadow-sm min-w-0 flex flex-col">
          <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-textHeader tracking-[0.15em] mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4 text-neonTeal" /> TASK STATUS
          </h3>
          <div className="flex-1 min-h-0">
            {totalTasks === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs font-mono text-slate-400 dark:text-textMuted">No tasks yet</div>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskStatusDistribution.filter(d => d.value > 0)}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                      labelLine={false}
                      label={CustomPieLabel}
                    >
                      {taskStatusDistribution.filter(d => d.value > 0).map((entry, i) => {
                        const statusKey = entry.name.replace(/\s/g, '_').toUpperCase();
                        return <Cell key={i} fill={STATUS_COLORS[statusKey] || COLORS[i % COLORS.length]} />;
                      })}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [v, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-mono pt-3 border-t border-slate-100 dark:border-darkBorder">
            {taskStatusDistribution.map((entry, i) => {
              const statusKey = entry.name.replace(/\s/g, '_').toUpperCase();
              return (
                <div key={entry.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[statusKey] || COLORS[i] }} />
                  <span className="text-slate-400 dark:text-textMuted truncate">{entry.name}</span>
                  <span className="text-slate-900 dark:text-textHeader font-bold ml-auto">{entry.value}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── ROW 3: Monthly Heatmap + Difficulty Distribution ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Activity Heatmap */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-textHeader tracking-[0.15em] flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-neonCyan" /> MONTHLY ACTIVITY
            </h3>
            <span className="text-[10px] font-mono text-slate-400 dark:text-textMuted">
              {data?.monthKey || '—'} &middot; {monthHours.toFixed(1)}h logged
            </span>
          </div>
          {monthActivity.length === 0 ? (
            <p className="text-xs font-mono text-slate-400 dark:text-textMuted text-center py-12">No activity data</p>
          ) : (
            <MonthHeatmap data={monthActivity} maxHours={monthMaxHours} />
          )}
        </div>

        {/* Difficulty Distribution */}
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-textHeader tracking-[0.15em] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" /> DIFFICULTY BREAKDOWN
            </h3>
            <span className="text-[10px] font-mono text-slate-400 dark:text-textMuted">{totalTasks} tasks</span>
          </div>
          {totalTasks === 0 ? (
            <p className="text-xs font-mono text-slate-400 dark:text-textMuted text-center py-12">No tasks yet</p>
          ) : (
            <div className="space-y-5">
              {diffData.map((d) => (
                <div key={d.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-xs font-mono font-bold text-slate-700 dark:text-textHeader">{d.name}</span>
                    </div>
                    <span className="text-xs font-mono text-slate-400 dark:text-textMuted">
                      {d.count} <span className="text-slate-300 dark:text-darkBorder">|</span> {totalTasks > 0 ? Math.round((d.count / totalTasks) * 100) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-darkHover h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${maxDiffCount > 0 ? (d.count / maxDiffCount) * 100 : 0}%`,
                        backgroundColor: d.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sprint Summary */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-darkBorder">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 dark:bg-darkHover rounded-lg p-3 text-center">
                <p className="text-lg font-mono font-bold text-slate-900 dark:text-textHeader">{summary.completedTasks}</p>
                <p className="text-[10px] font-mono text-slate-400 dark:text-textMuted uppercase tracking-wider">Completed</p>
              </div>
              <div className="bg-slate-50 dark:bg-darkHover rounded-lg p-3 text-center">
                <p className="text-lg font-mono font-bold text-slate-900 dark:text-textHeader">{summary.activeTasks}</p>
                <p className="text-[10px] font-mono text-slate-400 dark:text-textMuted uppercase tracking-wider">Remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── ROW 4: Tech Stack Mastery ─── */}
      <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-5 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xs font-mono font-bold text-slate-900 dark:text-textHeader tracking-[0.15em] flex items-center gap-2">
            <Target className="w-4 h-4 text-neonTeal" /> TECHNOLOGY MASTERY
          </h3>
          <span className="text-[10px] font-mono text-slate-400 dark:text-textMuted">Based on task usage</span>
        </div>
        {skillMastery.length === 0 ? (
          <p className="text-xs font-mono text-slate-400 dark:text-textMuted">No technology tags found in your tasks yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {skillMastery.map((skill, i) => (
              <div key={skill.name} className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-textHeader">{skill.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-neonCyan/10 text-neonCyan border border-neonCyan/20">
                      {skill.value} XP
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-textMuted">
                      Lvl {Math.floor(skill.value / 50) + 1}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 dark:bg-darkHover h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${Math.min(100, skill.value)}%`,
                      background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[(i + 1) % COLORS.length]})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── ROW 5: Quick Insights ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <Flame className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-slate-400 dark:text-textMuted uppercase tracking-wider">Peak Day</p>
            <p className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader">
              {weeklyCoding.length > 0 ? weeklyCoding.reduce((max, d) => d.hours > max.hours ? d : max, weeklyCoding[0]).date.slice(5) : '—'}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-neonCyan/10 border border-neonCyan/20">
            <TrendingUp className="w-5 h-5 text-neonCyan" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-slate-400 dark:text-textMuted uppercase tracking-wider">Best Streak</p>
            <p className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader">
              {(() => {
                let best = 0, cur = 0;
                for (const d of weeklyCoding) {
                  if (d.hours > 0) { cur++; best = Math.max(best, cur); } else { cur = 0; }
                }
                return best > 0 ? `${best} days` : '—';
              })()}
            </p>
          </div>
        </div>
        <div className="bg-white dark:bg-darkSurface border border-slate-200 dark:border-darkBorder p-4 rounded-xl shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-slate-400 dark:text-textMuted uppercase tracking-wider">Monthly Sessions</p>
            <p className="text-sm font-mono font-bold text-slate-900 dark:text-textHeader">{monthSessions}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
