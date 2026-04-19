/**
 * Analytics utility functions for Tracksy habit tracker.
 * Both functions are pure (no side effects, no I/O).
 */

/**
 * Returns the number of days in the given month.
 * @param {string} month - YYYY-MM formatted string
 * @returns {number}
 */
function daysInMonth(month) {
  const [year, monthIndex] = month.split('-').map(Number);
  // Day 0 of the next month = last day of the current month
  return new Date(year, monthIndex, 0).getDate();
}

/**
 * Computes the completion rate for a habit record in a given month.
 *
 * @param {object} record - HabitRecord document (with a `data` Map or plain object)
 * @param {string} month  - YYYY-MM formatted string
 * @returns {number} Percentage in [0, 100]
 */
function completionRate(record, month) {
  const totalDays = daysInMonth(month);

  // Determine how many days have elapsed in the month
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  let daysElapsed;
  if (currentYearMonth === month) {
    daysElapsed = Math.min(now.getDate(), totalDays);
  } else {
    daysElapsed = totalDays;
  }

  if (daysElapsed === 0) return 0;

  // Support both Mongoose Map objects and plain JS objects
  const entries =
    record.data instanceof Map
      ? Array.from(record.data.values())
      : Object.values(record.data || {});

  // Count days with a logged value (not null, not undefined, not false)
  const loggedDays = entries.filter(
    (v) => v !== null && v !== undefined && v !== false
  ).length;

  const rate = (loggedDays / daysElapsed) * 100;

  // Clamp to [0, 100]
  return Math.min(100, Math.max(0, rate));
}

/**
 * Computes the current streak for a habit record.
 * Walks backwards from today counting consecutive days with a logged value.
 *
 * @param {object} record - HabitRecord document (with a `data` Map or plain object)
 * @returns {number} Non-negative integer streak count
 */
function streak(record) {
  const today = new Date().getDate();

  // Support both Mongoose Map objects and plain JS objects
  const getData = (day) => {
    const key = String(day);
    if (record.data instanceof Map) {
      return record.data.get(key);
    }
    return (record.data || {})[key];
  };

  let count = 0;
  for (let day = today; day >= 1; day--) {
    const v = getData(day);
    if (v !== null && v !== undefined && v !== false) {
      count++;
    } else {
      break;
    }
  }

  return count;
}

module.exports = { completionRate, streak };
