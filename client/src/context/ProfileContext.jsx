import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getProfile, updateProfileData } from '../services/api';

const ProfileContext = createContext(null);

const EMPTY_PROFILE = { displayName: '', bio: '', avatar: null };

function loadCachedProfile() {
  try {
    const raw = localStorage.getItem('tracksy_profile');
    return raw ? JSON.parse(raw) : EMPTY_PROFILE;
  } catch {
    return EMPTY_PROFILE;
  }
}

function loadCachedAccountInfo() {
  try {
    const raw = localStorage.getItem('tracksy_user');
    return raw ? JSON.parse(raw) : { email: '', memberSince: null };
  } catch {
    return { email: '', memberSince: null };
  }
}

// Read token from cookie OR localStorage
function getStoredToken() {
  const cookieMatch = document.cookie
    .split('; ')
    .find((row) => row.startsWith('tracksy_token='));
  return cookieMatch
    ? decodeURIComponent(cookieMatch.split('=')[1])
    : localStorage.getItem('tracksy_token');
}

export function ProfileProvider({ children }) {
  // Start from cache so UI is instant — server fetch will overwrite
  const [profile,     setProfile]     = useState(loadCachedProfile);
  const [accountInfo, setAccountInfo] = useState(loadCachedAccountInfo);
  const [loading,     setLoading]     = useState(true);

  // ── Fetch fresh profile from server ────────────────────────────────────────
  const refreshProfile = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await getProfile();
      const { profile: serverProfile, email, memberSince } = data;

      // Normalise — server may return null for avatar
      const normalised = {
        displayName: serverProfile?.displayName || '',
        bio:         serverProfile?.bio         || '',
        avatar:      serverProfile?.avatar      || null,
      };

      setProfile(normalised);
      localStorage.setItem('tracksy_profile', JSON.stringify(normalised));

      const info = { email: email || '', memberSince: memberSince || null };
      setAccountInfo(info);

      // Keep tracksy_user in sync so AuthContext has fresh email on next boot
      try {
        const existing = JSON.parse(localStorage.getItem('tracksy_user') || '{}');
        localStorage.setItem('tracksy_user', JSON.stringify({ ...existing, ...info }));
      } catch { /* ignore */ }
    } catch (err) {
      // Network / 401 — keep cached data, don't wipe it
      console.error('ProfileContext: failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  // ── Update profile fields ───────────────────────────────────────────────────
  async function updateProfile(updates) {
    // 1. Optimistic update so UI feels instant
    const previous = { ...profile };
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('tracksy_profile', JSON.stringify(next));
      return next;
    });

    try {
      // 2. Persist to server
      const { data } = await updateProfileData(updates);
      const serverProfile = data.profile;

      // 3. Overwrite with server's canonical response (includes avatar URL)
      const normalised = {
        displayName: serverProfile?.displayName || '',
        bio:         serverProfile?.bio         || '',
        avatar:      serverProfile?.avatar      || null,
      };

      setProfile(normalised);
      localStorage.setItem('tracksy_profile', JSON.stringify(normalised));
    } catch (err) {
      console.error('ProfileContext: failed to update profile', err);
      // 4. Revert to what we had BEFORE the optimistic update
      setProfile(previous);
      localStorage.setItem('tracksy_profile', JSON.stringify(previous));
      throw err; // re-throw so callers can show an error message
    }
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, accountInfo, loading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
