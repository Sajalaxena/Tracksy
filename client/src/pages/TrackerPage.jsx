import { useState, useEffect, useCallback } from 'react';
import { getHabits } from '../services/api';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import MonthSelector from '../components/MonthSelector';
import HabitGrid from '../components/HabitGrid';
import AddHabitModal from '../components/AddHabitModal';

export default function TrackerPage() {
  const [selectedMonth, setSelectedMonth] = useState(
    () => new Date().toISOString().slice(0, 7)
  );
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchHabits = useCallback(async (month) => {
    setLoading(true);
    setError('');
    try {
      const response = await getHabits(month);
      setHabits(response.data);
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
          <div className="ml-auto flex items-center gap-2">
            <MonthSelector value={selectedMonth} onChange={setSelectedMonth} />
            {/* New Habit button — hidden on mobile (use bottom nav Add) */}
            <button
              type="button"
              onClick={openModal}
              className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Habit</span>
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
    </div>
  );
}
