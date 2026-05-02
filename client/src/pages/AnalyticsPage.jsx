import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend,
  RadialBarChart, RadialBar,
} from 'recharts';
import { getHabits } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import MonthSelector from '../components/MonthSelector';
import { getHabitColor } from '../components/CategoryName';

// ---------------------------------------------------------------------------
// Analytics logic
// ---------------------------------------------------------------------------
function daysInMonth(month) {
  const [year, monthIndex] = month.split('-').map(Number);
  return new Date(year, monthIndex, 0).getDate();
}

function completionRate(record, month) {
  const totalDays = daysInMonth(month);
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let daysElapsed = currentYearMonth === month ? Math.min(now.getDate(), totalDays) : totalDays;
  if (daysElapsed === 0) return 0;
  const entries = Object.values(record.data || {});
  const loggedDays = entries.filter((v) => v !== null && v !== undefined && v !== false).length;
  return Math.min(100, Math.max(0, (loggedDays / daysElapsed) * 100));
}

function streak(record) {
  const today = new Date().getDate();
  const data = record.data || {};
  let count = 0;
  for (let day = today; day >= 1; day--) {
    const v = data[String(day)];
    if (v !== null && v !== undefined && v !== false) count++;
    else break;
  }
  return count;
}

function monthOffset(monthsBack) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsBack);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function shortMonthLabel(yyyyMm) {
  const [year, month] = yyyyMm.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' });
}

function shortMonth(yyyyMm) {
  const [year, month] = yyyyMm.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleString('default', { month: 'short' });
}

// All 12 months for a given year as YYYY-MM strings
function yearMonths(year) {
  return Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, '0')}`
  );
}

// ---------------------------------------------------------------------------
// Color helper — uses the same palette as CategoryName/HabitGrid
// ---------------------------------------------------------------------------
function getColor(idx) {
  return { fill: getHabitColor(idx), light: getHabitColor(idx) + '22' };
}

// ---------------------------------------------------------------------------
// Achievement badge helper
// ---------------------------------------------------------------------------
function getAchievement(rate) {
  if (rate >= 90) return { emoji: '🏆', label: 'Champion', color: 'text-amber-500' };
  if (rate >= 70) return { emoji: '🥇', label: 'On Fire', color: 'text-orange-500' };
  if (rate >= 50) return { emoji: '⭐', label: 'Consistent', color: 'text-indigo-500' };
  if (rate >= 25) return { emoji: '🌱', label: 'Growing', color: 'text-emerald-500' };
  return { emoji: '🚀', label: 'Starting', color: 'text-cyan-500' };
}

// ---------------------------------------------------------------------------
// Custom tooltip for area chart
// ---------------------------------------------------------------------------
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl p-3 text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-600 dark:text-gray-400">{p.dataKey}:</span>
          <span className="font-bold" style={{ color: p.color }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card with animated number
// ---------------------------------------------------------------------------
function StatCard({ value, label, icon, gradient, delay = 0 }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg animate-fade-in-up"
      style={{
        background: gradient,
        animationDelay: `${delay}ms`,
        animationFillMode: 'both',
      }}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-6 -translate-x-6" />
      <div className="relative">
        <div className="text-3xl mb-1">{icon}</div>
        <div className="text-4xl font-bold tracking-tight">{value}</div>
        <div className="text-white/70 text-sm mt-1 font-medium">{label}</div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Donut card with achievement badge
// ---------------------------------------------------------------------------
function DonutCard({ habit, idx, month }) {
  const rate = completionRate(habit, month);
  const remaining = Math.max(0, 100 - rate);
  const color = getColor(idx);
  const achievement = getAchievement(rate);
  const data = [
    { name: 'Done', value: parseFloat(rate.toFixed(1)) },
    { name: 'Left', value: parseFloat(remaining.toFixed(1)) },
  ];

  return (
    <div
      className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 flex flex-col items-center hover:shadow-md transition-shadow duration-300 animate-scale-in"
      style={{ animationDelay: `${idx * 80}ms`, animationFillMode: 'both' }}
    >
      {/* Donut */}
      <div className="relative">
        <ResponsiveContainer width={110} height={110}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={32}
              outerRadius={50}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              <Cell fill={color.fill} />
              <Cell fill="#F1F5F9" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center % */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{rate.toFixed(0)}%</span>
        </div>
      </div>

      {/* Name in habit color */}
      <p
        className="text-sm font-semibold text-center mt-2 truncate max-w-[120px]"
        title={habit.name}
        style={{ color: color.fill }}
      >
        {habit.name}
      </p>

      {/* Achievement badge */}
      <div
        className="mt-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ background: color.light, color: color.fill }}
      >
        <span>{achievement.emoji}</span>
        <span>{achievement.label}</span>
      </div>

      {/* Streak pill */}
      {streak(habit) > 0 && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-orange-500 font-medium">
          <span>🔥</span>
          <span>{streak(habit)} day streak</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trends chart
// ---------------------------------------------------------------------------
function TrendsChart({ habitsByMonth, months }) {
  const allNames = Array.from(
    new Set(months.flatMap((m) => (habitsByMonth[m] || []).map((h) => h.name)))
  );

  if (!allNames.length) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500">
        <span className="text-4xl mb-2">📊</span>
        <p className="text-sm">No data yet — start tracking habits!</p>
      </div>
    );
  }

  const chartData = months.map((m) => {
    const habitsForMonth = habitsByMonth[m] || [];
    const entry = { month: shortMonthLabel(m) };
    allNames.forEach((name) => {
      const habit = habitsForMonth.find((h) => h.name === name);
      entry[name] = habit ? parseFloat(completionRate(habit, m).toFixed(1)) : 0;
    });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <defs>
          {allNames.map((name, idx) => {
            const c = getColor(idx);
            return (
              <linearGradient key={name} id={`grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={c.fill} stopOpacity={0.25} />
                <stop offset="95%" stopColor={c.fill} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 12, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }}
          formatter={(value) => <span style={{ color: '#64748B' }}>{value}</span>}
        />
        {allNames.map((name, idx) => {
          const c = getColor(idx);
          return (
            <Area
              key={name}
              type="monotone"
              dataKey={name}
              stroke={c.fill}
              fill={`url(#grad-${idx})`}
              strokeWidth={2.5}
              dot={{ r: 4, fill: c.fill, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: c.fill, stroke: '#fff', strokeWidth: 2 }}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Summary table
// ---------------------------------------------------------------------------
function SummaryTable({ habits, month }) {
  if (!habits.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400 dark:text-gray-500">
        <span className="text-4xl mb-2">🎯</span>
        <p className="text-sm">No habits tracked this month yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="text-left px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Habit</th>
            <th className="text-center px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Progress</th>
            <th className="text-right px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Rate</th>
            <th className="text-right px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Streak</th>
            <th className="text-right px-5 py-3 font-semibold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wide">Badge</th>
          </tr>
        </thead>
        <tbody>
          {habits.map((habit, idx) => {
            const rate = completionRate(habit, month);
            const currentStreak = streak(habit);
            const color = getColor(idx);
            const achievement = getAchievement(rate);
            return (
              <tr
                key={habit._id}
                className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm" style={{ background: color.fill }} />
                    <span className="font-semibold text-sm" style={{ color: color.fill }}>{habit.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden min-w-[80px]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${rate}%`, background: color.fill }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="font-bold text-gray-800 dark:text-gray-200">{rate.toFixed(1)}%</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="flex items-center justify-end gap-1">
                    {currentStreak > 0 && <span>🔥</span>}
                    <span className="font-medium text-gray-700 dark:text-gray-300">{currentStreak}d</span>
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: color.light, color: color.fill }}
                  >
                    {achievement.emoji} {achievement.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Yearly overview chart — avg completion per month across the full year
// ---------------------------------------------------------------------------
function YearlyChart({ habitsByMonth, year }) {
  const months = yearMonths(year);

  const data = months.map((m) => {
    const habits = habitsByMonth[m] || [];
    const avg = habits.length
      ? habits.reduce((s, h) => s + completionRate(h, m), 0) / habits.length
      : 0;
    return {
      month: shortMonth(m),
      avg: parseFloat(avg.toFixed(1)),
      habits: habits.length,
    };
  });

  const hasAnyData = data.some((d) => d.avg > 0);

  if (!hasAnyData) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-gray-500">
        <span className="text-4xl mb-2">📅</span>
        <p className="text-sm">No data for {year} yet.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="yearGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 12, fill: '#94A3B8' }}
          axisLine={false}
          tickLine={false}
          width={42}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl p-3 text-xs">
                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">{label}</p>
                <p className="text-indigo-500 font-bold">{payload[0].value}% avg completion</p>
                <p className="text-gray-400">{payload[0].payload.habits} habit{payload[0].payload.habits !== 1 ? 's' : ''}</p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="avg"
          stroke="#6366F1"
          fill="url(#yearGrad)"
          strokeWidth={2.5}
          dot={(props) => {
            const { cx, cy, payload } = props;
            if (payload.avg === 0) return null;
            return <circle key={`dot-${payload.month}`} cx={cx} cy={cy} r={4} fill="#6366F1" stroke="#fff" strokeWidth={2} />;
          }}
          activeDot={{ r: 6, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
          name="Avg Completion"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Radial progress for "Goal" overview
// ---------------------------------------------------------------------------
function GoalOverview({ habits, month }) {
  if (!habits.length) return null;

  const avgRate = habits.length
    ? habits.reduce((s, h) => s + completionRate(h, month), 0) / habits.length
    : 0;

  const radialData = [{ name: 'Overall', value: parseFloat(avgRate.toFixed(1)), fill: '#6366F1' }];

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl p-6 text-white shadow-lg animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">Monthly Goal</p>
          <p className="text-4xl font-bold">{avgRate.toFixed(0)}%</p>
          <p className="text-white/70 text-sm mt-1">avg. completion across all habits</p>
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000"
                style={{ width: `${avgRate}%` }}
              />
            </div>
            <span className="text-white/80 text-xs font-medium">100%</span>
          </div>
        </div>
        <div className="relative">
          <ResponsiveContainer width={100} height={100}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius={28}
              outerRadius={46}
              data={radialData}
              startAngle={90}
              endAngle={-270}
            >
              <RadialBar dataKey="value" cornerRadius={6} background={{ fill: 'rgba(255,255,255,0.15)' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">🎯</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AnalyticsPage
// ---------------------------------------------------------------------------
export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

  const currentYear  = new Date().getFullYear();
  const currentMonth = monthOffset(0);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear,  setSelectedYear]  = useState(currentYear);
  const [habitsByMonth, setHabitsByMonth] = useState({});
  const [yearlyLoading, setYearlyLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Last 3 months for the monthly trends chart
  const trendMonths = [monthOffset(2), monthOffset(1), monthOffset(0)];

  // Fetch the 3 trend months + all 12 months of the selected year
  const fetchAllData = useCallback(async (year) => {
    setLoading(true);
    setYearlyLoading(true);
    setError('');
    try {
      const allMonths = Array.from(
        new Set([...trendMonths, ...yearMonths(year)])
      );
      const results = await Promise.all(allMonths.map((m) => getHabits(m)));
      const byMonth = {};
      allMonths.forEach((m, i) => { byMonth[m] = results[i].data; });
      setHabitsByMonth(byMonth);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
      setYearlyLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchAllData(selectedYear); }, [fetchAllData, selectedYear]);

  const habitsForSelected = habitsByMonth[selectedMonth] || [];

  const totalEntries = habitsForSelected.reduce((s, h) => {
    return s + Object.values(h.data || {}).filter((v) => v !== null && v !== undefined && v !== false).length;
  }, 0);
  const longestStreak = habitsForSelected.reduce((max, h) => Math.max(max, streak(h)), 0);
  const topHabit = habitsForSelected.length
    ? habitsForSelected.reduce((best, h) => completionRate(h, selectedMonth) > completionRate(best, selectedMonth) ? h : best, habitsForSelected[0])
    : null;

  const displayName  = profile?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName[0].toUpperCase();

  // Year options: current year and 2 years back
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar />

      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Analytics</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">Track your progress and achievements</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />

            {/* Profile section */}
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex flex-col items-center gap-1 group cursor-pointer hover:opacity-80 transition-opacity"
              title="Go to Profile"
            >
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={displayName}
                  className="w-10 h-10 rounded-lg object-cover ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-indigo-500 transition-all"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center ring-2 ring-gray-200 dark:ring-gray-700 group-hover:ring-indigo-500 transition-all">
                  <span className="text-white text-sm font-bold">{avatarLetter}</span>
                </div>
              )}
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 group-hover:text-indigo-500 transition-colors max-w-[80px] truncate">
                {displayName}
              </span>
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 pb-24 md:pb-6 space-y-4 sm:space-y-6">
          {loading && (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-sm text-gray-400 dark:text-gray-500">Loading analytics…</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {/* ── Stat cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard value={totalEntries}            label="Total Entries"   icon="📝" gradient="linear-gradient(135deg, #6366F1, #8B5CF6)" delay={0} />
                <StatCard value={`${longestStreak}d`}    label="Longest Streak"  icon="🔥" gradient="linear-gradient(135deg, #F43F5E, #F97316)" delay={100} />
                <StatCard value={habitsForSelected.length} label="Active Habits"  icon="🎯" gradient="linear-gradient(135deg, #06B6D4, #3B82F6)" delay={200} />
                <StatCard
                  value={topHabit ? `${completionRate(topHabit, selectedMonth).toFixed(0)}%` : '—'}
                  label={topHabit ? `Best: ${topHabit.name}` : 'Best Habit'}
                  icon="🏆"
                  gradient="linear-gradient(135deg, #F59E0B, #10B981)"
                  delay={300}
                />
              </div>

              {/* ── Yearly overview ── */}
              <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Yearly Overview
                  </h2>
                  {/* Year selector */}
                  <div className="flex gap-1">
                    {yearOptions.map((y) => (
                      <button
                        key={y}
                        onClick={() => setSelectedYear(y)}
                        className={[
                          'px-3 py-1 rounded-lg text-xs font-semibold transition-all',
                          selectedYear === y
                            ? 'bg-indigo-500 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                        ].join(' ')}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
                {yearlyLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <YearlyChart habitsByMonth={habitsByMonth} year={selectedYear} />
                )}
              </div>

              {/* ── Goal + Monthly Trends ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
                <GoalOverview habits={habitsForSelected} month={selectedMonth} />
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-5">
                  <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-500" />
                    Monthly Trends (last 3 months)
                  </h2>
                  <TrendsChart habitsByMonth={habitsByMonth} months={trendMonths} />
                </div>
              </div>

              {/* ── Donut cards ── */}
              {habitsForSelected.length > 0 && (
                <section>
                  <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Completion by Habit — {shortMonthLabel(selectedMonth)}
                  </h2>
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 sm:flex-wrap sm:overflow-visible">
                    {habitsForSelected.map((habit, idx) => (
                      <div key={habit._id} className="flex-shrink-0 sm:flex-shrink">
                        <DonutCard habit={habit} idx={idx} month={selectedMonth} />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* ── Summary table ── */}
              <section>
                <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 sm:mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Habit Details — {shortMonthLabel(selectedMonth)}
                </h2>
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <SummaryTable habits={habitsForSelected} month={selectedMonth} />
                </div>
              </section>
            </>
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
