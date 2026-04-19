import { useState, useEffect, useRef } from 'react';
import { createHabit } from '../services/api';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const TYPE_OPTIONS = [
  {
    value: 'boolean',
    icon: '✅',
    label: 'Checkbox',
    desc: 'Done / not done each day',
  },
  {
    value: 'numeric',
    icon: '🔢',
    label: 'Number',
    desc: 'Track a measurable value',
  },
];

const FREQ_OPTIONS = [
  { value: 'daily', icon: '📅', label: 'Every day' },
  { value: 'weekly', icon: '📆', label: 'Once a week' },
  { value: 'custom', icon: '🗓', label: 'Specific days' },
];

export default function AddHabitModal({ month, onCreated, onClose }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('boolean');
  const [frequency, setFrequency] = useState('daily');
  const [selectedDays, setSelectedDays] = useState([]);
  const [nameError, setNameError] = useState('');
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nameInputRef = useRef(null);
  useEffect(() => { nameInputRef.current?.focus(); }, []);

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function toggleDay(day) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    if (!name.trim()) { setNameError('Habit name is required.'); return; }
    setNameError('');

    if (frequency === 'custom' && selectedDays.length === 0) {
      setApiError('Please select at least one day.');
      return;
    }

    setSubmitting(true);
    try {
      // Store frequency metadata in the name as a suffix for now
      // (the backend stores it as-is; a future migration can add a field)
      const response = await createHabit(name.trim(), type, month);
      // Attach frequency info to the returned habit object client-side
      const newHabit = {
        ...response.data,
        frequency,
        activeDays: frequency === 'custom' ? selectedDays : undefined,
      };
      onCreated(newHabit);
      onClose();
    } catch (err) {
      setApiError(
        err?.response?.data?.error || 'Failed to create habit. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-habit-title"
    >
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-md sm:mx-4 rounded-t-3xl sm:rounded-2xl shadow-2xl animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 id="add-habit-title" className="text-lg font-bold text-gray-900 dark:text-white">New Habit</h2>
            <p className="text-xs text-gray-400 mt-0.5">{month}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="habit-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Habit name
            </label>
            <input
              id="habit-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setNameError(''); setApiError(''); }}
              placeholder="e.g. Morning run, Read 20 pages…"
              className={[
                'w-full px-4 py-3 rounded-xl border text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 focus:bg-white transition-all',
                nameError ? 'border-red-400 bg-red-50' : 'border-gray-200 dark:border-gray-700',
              ].join(' ')}
              disabled={submitting}
            />
            {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
          </div>

          {/* Type */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Type</p>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={[
                    'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                    type === opt.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300',
                  ].join(' ')}
                  disabled={submitting}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <div>
                    <p className={`text-sm font-semibold ${type === opt.value ? 'text-indigo-700' : 'text-gray-700 dark:text-gray-300'}`}>
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-400">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Frequency</p>
            <div className="grid grid-cols-3 gap-2">
              {FREQ_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFrequency(opt.value)}
                  className={[
                    'flex flex-col items-center gap-1 px-2 py-3 rounded-xl border-2 text-center transition-all',
                    frequency === opt.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-gray-300',
                  ].join(' ')}
                  disabled={submitting}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className={`text-xs font-semibold ${frequency === opt.value ? 'text-indigo-700' : 'text-gray-600 dark:text-gray-400'}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Day picker for custom frequency */}
            {frequency === 'custom' && (
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={[
                      'w-10 h-10 rounded-full text-xs font-bold transition-all',
                      selectedDays.includes(day)
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
                    ].join(' ')}
                    disabled={submitting}
                  >
                    {day[0]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* API error */}
          {apiError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="text-red-400 text-sm">⚠</span>
              <p className="text-sm text-red-600">{apiError}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 shadow-md hover:shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Adding…
                </span>
              ) : 'Add Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
