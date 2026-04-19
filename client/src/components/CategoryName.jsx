// Vibrant palette — same order as AnalyticsPage PALETTE so colors stay consistent
export const HABIT_COLORS = [
  '#6366F1', // indigo
  '#F43F5E', // rose
  '#F59E0B', // amber
  '#06B6D4', // cyan
  '#10B981', // emerald
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#3B82F6', // blue
];

export function getHabitColor(index) {
  return HABIT_COLORS[index % HABIT_COLORS.length];
}

/**
 * CategoryName — sticky left `<td>` showing a colored dot + habit name.
 * Color is derived from the row index to match the analytics palette.
 *
 * Props:
 *   name  — habit name string
 *   index — row index (0-based) used to pick a color
 */
export default function CategoryName({ name, index = 0 }) {
  const color = getHabitColor(index);

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
      className="border-b border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-3"
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
          style={{ background: color }}
        />
        <span
          className="block text-sm font-semibold truncate"
          title={name}
          style={{ color }}
        >
          {name}
        </span>
      </div>
    </td>
  );
}
