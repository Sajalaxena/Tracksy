import { createContext, useContext, useState } from 'react';

const ProfileContext = createContext(null);

function loadProfile() {
  try {
    const raw = localStorage.getItem('tracksy_profile');
    return raw ? JSON.parse(raw) : { displayName: '', avatar: null };
  } catch {
    return { displayName: '', avatar: null };
  }
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(loadProfile);

  function updateProfile(updates) {
    setProfile((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('tracksy_profile', JSON.stringify(next));
      return next;
    });
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export const useProfile = () => useContext(ProfileContext);
