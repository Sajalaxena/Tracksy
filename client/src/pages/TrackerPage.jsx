import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getHabits, carryOverHabits } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { useStreakCelebration } from '../hooks/useStreakCelebration';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import MonthSelector from '../components/MonthSelector';
import HabitGrid from '../components/HabitGrid';
import AddHabitModal from '../components/AddHabitModal';
import StreakCelebration from '../components/StreakCelebration';

export default function TrackerPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date().toISOString().slice(0, 7)
  );
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [carriedOver, setCarriedOver] = useState(false);

  // Returns the previous month string in YYYY-MM format
  function prevMonth(yyyyMm) {
    const [y, m] = yyyyMm.split('-').map(Number);
    const d = new Date(y, m - 2, 1); // m-1 is current, m-2 is previous
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  const fetchHabits = useCallback(async (month) => {
    setLoading(true);
    setError('');
    setCarriedOver(false);
    try {
      const response = await getHabits(month);

      // If this month is empty, auto-carry from the previous month
      if (response.data.length === 0) {
        const from = prevMonth(month);
        const carryRes = await carryOverHabits(from, month);
        if (carryRes.data.carried) {
          setCarriedOver(true);
          setHabits(carryRes.data.habits);
        } else {
          setHabits([]);
        }
      } else {
        setHabits(response.data);
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to load habits. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setHabits([]);
    fetchHabits(selectedMonth);
  }, [selectedMonth, fetchHabits]);

  function openModal() { setModalOpen(true); }
  
  const displayName = profile?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName[0].toUpperCase();

  // Streak celebration hook
  const { celebration, closeCelebration } = useStreakCelebration(habits);

  return (
    // pb-20 on mobile to clear the bottom nav bar
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Sidebar onNewHabit={openModal} />

      <main className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0 shadow-sm">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-tight">
              Habit Tracker
            </h1>
            <p className="text-xs text-gray-400 hidden sm:block">Log your daily habits</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
            
            {/* Profile section - replaces New Habit button */}
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

        {/* Grid area — pb-20 on mobile for bottom nav clearance */}
        <div className="flex-1 overflow-auto p-3 sm:p-6 pb-24 md:pb-6">
          {loading && (
            <div className="flex items-center justify-center h-48">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Loading habits…</p>
              </div>
            </div>
          )}

          {!loading && error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              {/* Carry-over notice */}
              {carriedOver && (
                <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-800">
                  <span className="text-indigo-500 text-base">✨</span>
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    Your habits were automatically carried over from last month. Start logging!
                  </p>
                </div>
              )}
              <HabitGrid
                month={selectedMonth}
                habits={habits}
                onAddHabit={openModal}
                onHabitsChange={() => fetchHabits(selectedMonth)}
              />
            </div>
          )}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav onNewHabit={openModal} />

      {modalOpen && (
        <AddHabitModal
          month={selectedMonth}
          onCreated={(h) => setHabits((prev) => [...prev, h])}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Streak celebration */}
      {celebration && (
        <StreakCelebration
          streak={celebration.streak}
          habitName={celebration.habitName}
          onClose={closeCelebration}
        />
      )}
    </div>
  );
}
