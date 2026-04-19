/**
 * MonthSelector component — renders two <select> controls for choosing a
 * month (Jan–Dec) and a year (current year ± 2), emitting a YYYY-MM string
 * via the onChange callback whenever either value changes.
 *
 * @param {{ value: string, onChange: (yyyyMm: string) => void }} props
 *   value    — currently selected month in "YYYY-MM" format
 *   onChange — called with the new "YYYY-MM" string on any change
 */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December',
];

export default function MonthSelector({ value, onChange }) {
  // Parse the YYYY-MM string into year (number) and month (1-12).
  const [yearStr, monthStr] = (value || '').split('-');
  const selectedYear = parseInt(yearStr, 10) || new Date().getFullYear();
  const selectedMonth = parseInt(monthStr, 10) || new Date().getMonth() + 1;

  const currentYear = new Date().getFullYear();
  // Build year options: current year - 2 through current year + 1 (5 years).
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  /** Emit a new YYYY-MM string when either select changes. */
  function handleMonthChange(e) {
    const newMonth = String(e.target.value).padStart(2, '0');
    const newYear = String(selectedYear);
    onChange(`${newYear}-${newMonth}`);
  }

  function handleYearChange(e) {
    const newYear = e.target.value;
    const newMonth = String(selectedMonth).padStart(2, '0');
    onChange(`${newYear}-${newMonth}`);
  }

  const selectClass =
    'min-h-[40px] px-1.5 sm:px-2 py-1 rounded border border-border-cell bg-white dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 text-xs sm:text-sm ' +
    'focus:outline-none focus:ring-2 focus:ring-accent cursor-pointer max-w-[90px] sm:max-w-none';

  return (
    <div className="flex items-center gap-2">
      {/* Month select */}
      <label htmlFor="month-select" className="sr-only">
        Month
      </label>
      <select
        id="month-select"
        value={selectedMonth}
        onChange={handleMonthChange}
        className={selectClass}
        aria-label="Select month"
      >
        {MONTH_NAMES.map((name, index) => (
          <option key={name} value={index + 1}>
            {name}
          </option>
        ))}
      </select>

      {/* Year select */}
      <label htmlFor="year-select" className="sr-only">
        Year
      </label>
      <select
        id="year-select"
        value={selectedYear}
        onChange={handleYearChange}
        className={selectClass}
        aria-label="Select year"
      >
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  );
}
