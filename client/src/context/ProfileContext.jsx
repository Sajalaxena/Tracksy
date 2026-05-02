import { createContext, useContext, useState, useEffect } from 'react';
import { getProfile, updateProfileData } from '../services/api';

const ProfileContext = createContext(null);

function loadProfile() {
  try {
    const raw = localStorage.getItem('tracksy_profile');
    return raw ? JSON.parse(raw) : { displayName: '', bio: '', avatar: null };
  } catch {
    return { displayName: '', bio: '', avatar: null };
  }
}

// Read token from cookie OR localStorage — mirrors AuthContext logic
function getStoredToken() {
  const cookieMatch = document.cookie
    .split('; ')
    .find((row) => row.startsWith('tracksy_token='));
  return cookieMatch
    ? decodeURIComponent(cookieMatch.split('=')[1])
    : localStorage.getItem('tracksy_token');
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(loadProfile);
  const [accountInfo, setAccountInfo] = useState(() => {
    try {
      const raw = localStorage.getItem('tracksy_user');
      return raw ? JSON.parse(raw) : { email: '', memberSince: null };
    } catch { return { email: '', memberSince: null }; }
  });
  const [loading, setLoading] = useState(true);

  // Fetch profile from backend on mount — works after refresh because
  // we read the token from the cookie, not just localStorage
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await getProfile();
        const { profile: serverProfile, email, memberSince } = response.data;

        setProfile(serverProfile);
        localStorage.setItem('tracksy_profile', JSON.stringify(serverProfile));

        const info = { email, memberSince };
        setAccountInfo(info);
        // Merge into tracksy_user so AuthContext also benefits on next refresh
        try {
          const raw = localStorage.getItem('tracksy_user');
          const existing = raw ? JSON.parse(raw) : {};
          localStorage.setItem('tracksy_user', JSON.stringify({ ...existing, ...info }));
        } catch { /* ignore */ }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  async function updateProfile(updates) {
    // Optimistic update
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('tracksy_profile', JSON.stringify(next));
      return next;
    });

    try {
      const response = await updateProfileData(updates);
      const serverProfile = response.data.profile;
      setProfile(serverProfile);
      localStorage.setItem('tracksy_profile', JSON.stringify(serverProfile));
    } catch (err) {
      console.error('Failed to update profile:', err);
      // Revert optimistic update
      setProfile(loadProfile());
    }
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, accountInfo, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
