const DAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * DateHeader — sticky thead with weekday abbreviation + date number per column.
 * Highlights today, dims past days, and marks weekends subtly.
 */
export default function DateHeader({ month, today: todayProp }) {
  const today = todayProp instanceof Date ? todayProp : new Date();
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [yearStr, monthStr] = (month || currentYearMonth).split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10); // 1-based
  const daysInMonth = new Date(year, monthIndex, 0).getDate();

  const isCurrentMonth = month === currentYearMonth;
  const todayDay = today.getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const date = new Date(year, monthIndex - 1, dayNum);
    const weekday = DAY_ABBR[date.getDay()];
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const isToday = isCurrentMonth && dayNum === todayDay;
    const isPast = isCurrentMonth
      ? dayNum < todayDay
      : month < currentYearMonth;

    return { dayNum, weekday, isWeekend, isToday, isPast };
  });

  return (
    <thead>
      <tr style={{ position: 'sticky', top: 0, zIndex: 2 }}>
        {/* Corner cell */}
        <th
          style={{ position: 'sticky', left: 0, zIndex: 3 }}
          className="w-[130px] min-w-[130px] sm:w-[180px] sm:min-w-[180px] bg-white dark:bg-gray-900 border-b-2 border-gray-100 dark:border-gray-800"
          aria-hidden="true"
        />

        {days.map(({ dayNum, weekday, isWeekend, isToday, isPast }) => {
          let bg = 'bg-white dark:bg-gray-900';
          let textColor = isWeekend ? 'text-indigo-400' : 'text-gray-400 dark:text-gray-500';
          let numColor = isWeekend ? 'text-indigo-500' : 'text-gray-600 dark:text-gray-400';
          let border = 'border-b-2 border-gray-100 dark:border-gray-800';
          let ring = '';

          if (isToday) {
            bg = 'bg-indigo-500';
            textColor = 'text-indigo-100';
            numColor = 'text-white font-bold';
            border = 'border-b-2 border-indigo-500';
            ring = 'shadow-sm';
          } else if (isPast) {
            bg = 'bg-gray-50 dark:bg-gray-800';
            textColor = 'text-gray-300 dark:text-gray-600';
            numColor = 'text-gray-400 dark:text-gray-500';
          }

          return (
            <th
              key={dayNum}
              scope="col"
              className={[bg, border, ring, 'w-[34px] min-w-[34px] sm:w-[44px] sm:min-w-[44px] text-center select-none px-0'].join(' ')}
              aria-label={`${weekday} ${dayNum}${isToday ? ' (today)' : ''}`}
            >
              <div className="flex flex-col items-center justify-center py-1.5 gap-0.5">
                <span className={`text-[8px] sm:text-[9px] font-semibold uppercase tracking-wide ${textColor}`}>
                  {weekday}
                </span>
                <span className={`text-[11px] sm:text-xs leading-none ${numColor}`}>
                  {dayNum}
                </span>
              </div>
            </th>
          );
        })}

        {/* Goal / completion column */}
        <th
          scope="col"
          style={{ position: 'sticky', right: 0, zIndex: 3 }}
          className="w-[64px] min-w-[64px] sm:w-[80px] sm:min-w-[80px] bg-white dark:bg-gray-900 border-b-2 border-l border-gray-100 dark:border-gray-800 text-center select-none px-1"
        >
          <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            Goal
          </span>
        </th>
      </tr>
    </thead>
  );
}
