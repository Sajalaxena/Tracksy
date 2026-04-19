import { useState, useRef, useEffect } from 'react';

// ── Icons ──────────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2 7L5.5 10.5L12 3.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MissedIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ── Boolean cell ───────────────────────────────────────────────────────────

function BooleanCell({ value, onChange, isPast, isToday }) {
  const checked = !!value;
  const missed = isPast && !checked; // past day, not ticked

  return (
    <td className="w-[44px] h-[44px] text-center align-middle p-0">
      <div className="flex items-center justify-center w-full h-full">
        <button
          role="checkbox"
          aria-checked={checked}
          onClick={() => onChange(!value)}
          title={missed ? 'Missed — click to mark done' : checked ? 'Done' : 'Mark done'}
          className={[
            'w-[26px] h-[26px] rounded-full flex items-center justify-center',
            'focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200',
            checked
              ? 'bg-emerald-500 border-0 shadow-sm focus:ring-emerald-400 hover:bg-emerald-600'
              : missed
              ? 'bg-red-50 border-2 border-red-400 text-red-400 hover:bg-red-100 focus:ring-red-300'
              : isToday
              ? 'bg-white border-2 border-indigo-400 hover:border-indigo-500 focus:ring-indigo-300'
              : 'bg-white border-2 border-gray-200 hover:border-gray-400 focus:ring-gray-300',
          ].join(' ')}
        >
          {checked ? <CheckIcon /> : missed ? <MissedIcon /> : null}
        </button>
      </div>
    </td>
  );
}

// ── Numeric cell ───────────────────────────────────────────────────────────

function NumericCell({ value, onChange, isPast }) {
  const [focused, setFocused] = useState(false);
  const [inputValue, setInputValue] = useState(value != null ? String(value) : '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!focused) setInputValue(value != null ? String(value) : '');
  }, [value, focused]);

  useEffect(() => {
    if (focused && inputRef.current) inputRef.current.focus();
  }, [focused]);

  function commitValue(raw) {
    const parsed = parseFloat(raw);
    if (isFinite(parsed)) onChange(parsed);
  }

  const numericValue = parseFloat(value);
  const showAbbreviated = !focused && isFinite(numericValue) && numericValue >= 1000;
  const isEmpty = value == null || value === '';
  const showMissed = isPast && isEmpty && !focused;

  return (
    <td className="w-[44px] h-[44px] text-center align-middle p-0">
      <div
        className={[
          'flex items-center justify-center w-full h-full',
          showMissed ? 'bg-red-50/60' : '',
        ].join(' ')}
      >
        {showAbbreviated ? (
          <div
            className="w-10 text-center text-xs font-semibold text-gray-600 cursor-pointer select-none"
            onClick={() => setFocused(true)}
          >
            {`${Math.round(numericValue / 1000)}k`}
          </div>
        ) : showMissed ? (
          <button
            onClick={() => setFocused(true)}
            className="text-red-400 hover:text-red-500 transition-colors"
            title="Missed — click to enter value"
          >
            <MissedIcon />
          </button>
        ) : (
          <input
            ref={inputRef}
            type="number"
            min="0"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); commitValue(inputValue); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { commitValue(inputValue); e.target.blur(); } }}
            className={[
              'w-10 text-center text-xs bg-transparent border-0 outline-none font-medium',
              'focus:ring-2 focus:ring-indigo-400 rounded',
              '[appearance:textfield]',
              '[&::-webkit-outer-spin-button]:appearance-none',
              '[&::-webkit-inner-spin-button]:appearance-none',
            ].join(' ')}
            aria-label="Day value"
          />
        )}
      </div>
    </td>
  );
}

// ── Public component ───────────────────────────────────────────────────────

/**
 * CellInput
 * Props:
 *   type      — "boolean" | "numeric"
 *   value     — current value
 *   day       — day number 1–31
 *   month     — "YYYY-MM" of the grid
 *   onChange  — callback(newValue)
 */
export default function CellInput({ type, value, day, month, onChange }) {
  // Determine if this day is in the past
  const now = new Date();
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const todayDay = now.getDate();

  const isPast = month < currentYearMonth || (month === currentYearMonth && day < todayDay);
  const isToday = month === currentYearMonth && day === todayDay;

  if (type === 'boolean') {
    return <BooleanCell value={value} onChange={onChange} isPast={isPast} isToday={isToday} />;
  }
  if (type === 'numeric') {
    return <NumericCell value={value} onChange={onChange} isPast={isPast} />;
  }
  return <td className="w-[44px] h-[44px]" />;
}
