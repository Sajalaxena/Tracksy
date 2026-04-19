import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useProfile } from '../context/ProfileContext';

const NAV_ITEMS = [
  {
    to: '/',
    end: true,
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 6h18M3 14h18M3 18h18" />
      </svg>
    ),
    label: 'Tracker',
  },
  {
    to: '/analytics',
    end: false,
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    label: 'Analytics',
  },
  {
    to: '/profile',
    end: false,
    icon: (
      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    label: 'Profile',
  },
];

export default function Sidebar({ onNewHabit }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const { profile } = useProfile();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const displayName = profile.displayName || user?.email?.split('@')[0] || 'User';
  const avatarLetter = displayName[0]?.toUpperCase() || 'U';

  return (
    // hidden on mobile (< md), icon-only on tablet (md), full on desktop (lg)
    <aside className="hidden md:flex flex-col flex-shrink-0 bg-[#0F172A] h-screen relative overflow-hidden
                      w-[64px] lg:w-[220px] transition-all duration-300">
      {/* Decorative blob */}
      <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="px-3 lg:px-5 py-5 flex items-center gap-3 overflow-hidden">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-green-700 rounded-lg flex items-center justify-center shadow-md flex-shrink-0">
          <span className="text-white font-bold text-sm">L</span>
        </div>
        <span className="text-white font-bold text-base tracking-tight select-none hidden lg:block whitespace-nowrap">
          Tracksy
        </span>
      </div>

      <div className="mx-3 lg:mx-5 h-px bg-white/10 mb-3" />

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-2 lg:px-3 flex-1" aria-label="Main navigation">
        {NAV_ITEMS.map(({ to, end, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px]',
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/5',
              ].join(' ')
            }
            title={label}
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-emerald-400' : 'text-white/40'}>{icon}</span>
                <span className="hidden lg:block">{label}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 hidden lg:block" />}
              </>
            )}
          </NavLink>
        ))}

        {/* New Habit */}
        {onNewHabit && (
          <button
            type="button"
            onClick={onNewHabit}
            title="New Habit"
            className="flex items-center gap-3 px-2 lg:px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 min-h-[44px] w-full text-left mt-1"
          >
            <svg className="w-5 h-5 flex-shrink-0 text-white/40" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden lg:block">New Habit</span>
          </button>
        )}
      </nav>

      {/* Bottom */}
      <div className="px-2 lg:px-3 pb-5 mt-auto space-y-1">
        <div className="h-px bg-white/10 mb-3" />

        {/* Dark mode toggle */}
        <button
          type="button"
          onClick={toggle}
          title={dark ? 'Light Mode' : 'Dark Mode'}
          className="flex items-center gap-3 w-full px-2 lg:px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200 min-h-[44px]"
        >
          {dark ? (
            <svg className="w-5 h-5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          <span className="hidden lg:block">{dark ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* User avatar + name */}
        <NavLink
          to="/profile"
          title={displayName}
          className="flex items-center gap-2 px-2 lg:px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          {profile.avatar ? (
            <img src={profile.avatar} alt="avatar" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-green-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{avatarLetter}</span>
            </div>
          )}
          <span className="text-white/50 text-xs truncate hidden lg:block">{displayName}</span>
        </NavLink>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign Out"
          className="flex items-center gap-3 w-full px-2 lg:px-3 py-2.5 rounded-lg text-sm font-medium text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all duration-200 min-h-[44px] group"
        >
          <svg className="w-5 h-5 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="hidden lg:block">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
