import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';

const NAV_ITEMS = [
  {
    to: '/',
    end: true,
    label: 'Tracker',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
      </svg>
    ),
  },
  {
    to: '/analytics',
    end: false,
    label: 'Analytics',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    to: '/profile',
    end: false,
    label: 'Profile',
    icon: (active) => (
      <svg className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

/**
 * BottomNav — mobile-only bottom navigation bar (hidden on md+).
 */
export default function BottomNav({ onNewHabit }) {
  const { dark, toggle } = useTheme();
  const { logout, user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const displayName  = profile?.displayName || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName[0]?.toUpperCase() || 'U';

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg"
      aria-label="Mobile navigation"
    >
      <div
        className="flex items-center justify-around px-1"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}
      >
        {/* Nav links */}
        {NAV_ITEMS.map(({ to, end, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl min-w-[48px] transition-all',
                isActive ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span>{icon(isActive)}</span>
                <span className="text-[10px] font-semibold">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Add habit */}
        {onNewHabit && (
          <button
            type="button"
            onClick={onNewHabit}
            className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl min-w-[48px] text-gray-400 dark:text-gray-500 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px] font-semibold">Add</span>
          </button>
        )}

        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={toggle}
          className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl min-w-[48px] text-gray-400 dark:text-gray-500 transition-all"
        >
          {dark ? (
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          <span className="text-[10px] font-semibold">{dark ? 'Light' : 'Dark'}</span>
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl min-w-[48px] text-gray-400 dark:text-gray-500 hover:text-rose-500 transition-all"
          title={`Sign out (${displayName})`}
        >
          {/* Show avatar if available, else logout icon */}
          {profile?.avatar ? (
            <img
              src={profile.avatar}
              alt={displayName}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-rose-400"
            />
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          )}
          <span className="text-[10px] font-semibold">Logout</span>
        </button>
      </div>
    </nav>
  );
}
