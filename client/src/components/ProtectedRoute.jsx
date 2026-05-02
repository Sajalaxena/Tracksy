import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Waits for the auth cookie/localStorage check to finish before deciding
 * whether to render the protected page or redirect to /login.
 * Without this, a hard refresh would flash the login screen for a split
 * second even when the user has a valid session.
 */
const ProtectedRoute = () => {
  const { token, initialising } = useAuth();

  // Still reading cookie — render nothing (or a spinner) to avoid flash
  if (initialising) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
