import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

// ── Cookie helpers ────────────────────────────────────────────────────────────
const COOKIE_NAME = 'tracksy_token';
const COOKIE_DAYS = 7;

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
}

function getCookie(name) {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Strict`;
}

// ── JWT decode (no library needed) ───────────────────────────────────────────
function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  // `initialising` prevents ProtectedRoute from redirecting before we've
  // had a chance to read the cookie on first render.
  const [initialising, setInitialising] = useState(true);

  useEffect(() => {
    // 1. Try cookie first, fall back to localStorage (migration path)
    const storedToken = getCookie(COOKIE_NAME) || localStorage.getItem('tracksy_token');

    if (storedToken) {
      const payload = decodeToken(storedToken);

      if (payload && payload.exp * 1000 > Date.now()) {
        // Valid — hydrate state and ensure cookie is set
        setCookie(COOKIE_NAME, storedToken, COOKIE_DAYS);
        setToken(storedToken);
        setUser(payload);
      } else {
        // Expired — clean up everywhere
        deleteCookie(COOKIE_NAME);
        localStorage.removeItem('tracksy_token');
      }
    }

    setInitialising(false);
  }, []);

  const login = (newToken, newUser) => {
    // Persist in cookie (7 days) AND localStorage as backup
    setCookie(COOKIE_NAME, newToken, COOKIE_DAYS);
    localStorage.setItem('tracksy_token', newToken);

    setToken(newToken);
    setUser(newUser);

    if (newUser.profile) {
      localStorage.setItem('tracksy_profile', JSON.stringify(newUser.profile));
    }
  };

  const logout = () => {
    deleteCookie(COOKIE_NAME);
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, initialising }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
