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

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(loadProfile);
  const [loading, setLoading] = useState(true);

  // Fetch profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('tracksy_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await getProfile();
        const serverProfile = response.data.profile;
        
        // Update both state and localStorage with server data
        setProfile(serverProfile);
        localStorage.setItem('tracksy_profile', JSON.stringify(serverProfile));
      } catch (err) {
        // If fetch fails, use localStorage data
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  async function updateProfile(updates) {
    // Optimistically update UI
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('tracksy_profile', JSON.stringify(next));
      return next;
    });

    // Sync with backend
    try {
      const response = await updateProfileData(updates);
      const serverProfile = response.data.profile;
      
      // Update with server response
      setProfile(serverProfile);
      localStorage.setItem('tracksy_profile', JSON.stringify(serverProfile));
    } catch (err) {
      console.error('Failed to update profile:', err);
      // Revert on error
      setProfile((prev) => {
        const reverted = { ...prev };
        Object.keys(updates).forEach(key => {
          delete reverted[key];
        });
        return reverted;
      });
    }
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
