import { useState, useEffect, useRef } from 'react';
import DateHeader from './DateHeader';
import { getHabitColor } from './CategoryName';
import CellInput from './CellInput';
import { updateCell, deleteHabit, renameHabit } from '../services/api';
import { useToast } from '../context/ToastContext';

// ── Helpers ────────────────────────────────────────────────────────────────

function getDataValue(data, day) {
  if (!data) return undefined;
  const key = String(day);
  return typeof data.get === 'function' ? data.get(key) : data[key];
}

function getDaysInMonth(month) {
  const [yearStr, monthStr] = (month || '').split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10);
  if (!year || !monthIndex) return 31;
  return new Date(year, monthIndex, 0).getDate();
}

// ── Inline rename input ────────────────────────────────────────────────────

function RenameInput({ initialName, onSave, onCancel }) {
  const [val, setVal] = useState(initialName);
  const ref = useRef(null);

  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);

  function handleKey(e) {
    if (e.key === 'Enter') onSave(val.trim());
    if (e.key === 'Escape') onCancel();
  }

  return (
    <div className="flex items-center gap-1 px-2">
      <input
        ref={ref}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => onSave(val.trim())}
        className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 border border-indigo-400 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400/40 bg-white dark:bg-gray-800"
        style={{ minWidth: 0 }}
      />
      <button
        onMouseDown={(e) => { e.preventDefault(); onSave(val.trim()); }}
        className="text-emerald-500 hover:text-emerald-600 p-1 rounded transition-colors"
        title="Save"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>
      <button
        onMouseDown={(e) => { e.preventDefault(); onCancel(); }}
        className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
        title="Cancel"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Category cell with edit/delete actions ─────────────────────────────────

function CategoryCell({ habit, index, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const color = getHabitColor(index);

  async function handleSave(newName) {
    setEditing(false);
    if (!newName || newName === habit.name) return;
    await onRename(habit._id, newName);
  }

  return (
    <td
      style={{
        position: 'sticky',
        left: 0,
        minWidth: '180px',
        maxWidth: '220px',
        height: '48px',
        zIndex: 1,
      }}
      className="border-b border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {editing ? (
        <RenameInput
          initialName={habit.name}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      ) : (
        <div className="flex items-center justify-between px-3 h-full">
          {/* Color dot + name */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
              style={{ background: color }}
            />
            <span
              className="text-sm font-semibold truncate"
              title={habit.name}
              style={{ color }}
            >
              {habit.name}
            </span>
          </div>

          {/* Action buttons — visible on hover */}
          <div
            className={[
              'flex items-center gap-0.5 flex-shrink-0 transition-opacity duration-150 ml-1',
              hovered ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          >
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
              title="Rename habit"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={() => onDelete(habit._id, habit.name)}
              className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Delete habit"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </td>
  );
}

// ── Delete confirm dialog ──────────────────────────────────────────────────

function DeleteConfirm({ habitName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-scale-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">Delete habit?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              "<span className="font-medium text-gray-700 dark:text-gray-300">{habitName}</span>" and all its data will be permanently removed.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-sm"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add habit row ──────────────────────────────────────────────────────────

function AddHabitRow({ daysInMonth, onAddHabit }) {
  return (
    <tr>
      <td
        colSpan={daysInMonth + 1}
        className="border-t border-gray-100"
        style={{ height: '48px' }}
      >
        <button
          onClick={onAddHabit}
          className="ml-3 flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add New Habit
        </button>
      </td>
    </tr>
  );
}

// ── HabitGrid ──────────────────────────────────────────────────────────────

export default function HabitGrid({ month, habits = [], onCellChange, onAddHabit, onHabitsChange }) {
  const { showToast } = useToast();
  const [localHabits, setLocalHabits] = useState(habits);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => { setLocalHabits(habits); }, [habits]);

  // ── Scroll to today's column on mount and when month changes ─────────────
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Only scroll if we're viewing the current month
    if (month !== currentYearMonth) return;

    const todayDay = now.getDate();

    // Each day column is 44px wide. The sticky name column is 180px.
    // Column index is 0-based: day 1 is at index 0.
    const CELL_WIDTH = 44;
    const NAME_COL_WIDTH = 180;

    // Position of today's column left edge
    const todayLeft = NAME_COL_WIDTH + (todayDay - 1) * CELL_WIDTH;

    // Center today in the visible area (subtract half the container width)
    const containerWidth = container.clientWidth;
    const scrollTarget = todayLeft - containerWidth / 2 + CELL_WIDTH / 2;

    // Use requestAnimationFrame to ensure the DOM has rendered
    requestAnimationFrame(() => {
      container.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: 'smooth',
      });
    });
  }, [month]);

  const daysInMonth = getDaysInMonth(month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // ── Cell change ──────────────────────────────────────────────────────────
  async function handleCellChange(habitId, day, newValue) {
    const previousHabits = localHabits;
    setLocalHabits((prev) =>
      prev.map((habit) => {
        if (habit._id !== habitId) return habit;
        const dataCopy = {};
        if (habit.data && typeof habit.data.forEach === 'function') {
          habit.data.forEach((v, k) => { dataCopy[k] = v; });
        } else if (habit.data) {
          Object.assign(dataCopy, habit.data);
        }
        dataCopy[String(day)] = newValue;
        return { ...habit, data: dataCopy };
      })
    );
    try {
      await updateCell(habitId, String(day), newValue);
      if (onCellChange) onCellChange(habitId, day, newValue);
    } catch {
      setLocalHabits(previousHabits);
      showToast('Failed to save. Changes reverted.');
    }
  }

  // ── Rename ───────────────────────────────────────────────────────────────
  async function handleRename(habitId, newName) {
    const previousHabits = localHabits;
    setLocalHabits((prev) =>
      prev.map((h) => h._id === habitId ? { ...h, name: newName } : h)
    );
    try {
      await renameHabit(habitId, newName);
      if (onHabitsChange) onHabitsChange();
      showToast('Habit renamed ✓');
    } catch (err) {
      setLocalHabits(previousHabits);
      showToast(err?.response?.data?.error || 'Failed to rename habit.');
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function confirmDelete() {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    setLocalHabits((prev) => prev.filter((h) => h._id !== id));
    try {
      await deleteHabit(id);
      if (onHabitsChange) onHabitsChange();
      showToast('Habit deleted.');
    } catch {
      showToast('Failed to delete habit.');
      if (onHabitsChange) onHabitsChange(); // re-fetch to restore
    }
  }

  return (
    <>
      <div ref={scrollRef} style={{ overflowX: 'auto' }} role="region" aria-label="Habit grid" className="dark:bg-gray-900">
        <table style={{ borderCollapse: 'collapse' }} className="min-w-max">
          <DateHeader month={month} />
          <tbody>
            {localHabits.map((habit, habitIdx) => (
              <tr key={habit._id} style={{ height: '48px' }} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <CategoryCell
                  habit={habit}
                  index={habitIdx}
                  onRename={handleRename}
                  onDelete={(id, name) => setDeleteTarget({ id, name })}
                />
                {days.map((day) => {
                  const value = getDataValue(habit.data, day);
                  return (
                    <CellInput
                      key={day}
                      type={habit.type}
                      value={value}
                      day={day}
                      month={month}
                      onChange={(newValue) => handleCellChange(habit._id, day, newValue)}
                    />
                  );
                })}
              </tr>
            ))}            <AddHabitRow daysInMonth={daysInMonth} onAddHabit={onAddHabit} />
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <DeleteConfirm
          habitName={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
