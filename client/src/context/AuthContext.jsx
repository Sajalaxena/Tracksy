import React, { createContext, useContext, useState, useEffect } from 'react';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('tracksy_token');
    if (!storedToken) return;

    try {
      // Decode the JWT payload (middle part, base64url encoded)
      const parts = storedToken.split('.');
      if (parts.length !== 3) return;

      const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

      // Check if token is still valid (exp is in the future)
      if (payload.exp && payload.exp * 1000 > Date.now()) {
        setToken(storedToken);
        setUser(payload);
      } else {
        // Token expired — clean up
        localStorage.removeItem('tracksy_token');
      }
    } catch {
      // Malformed token — clean up
      localStorage.removeItem('tracksy_token');
    }
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem('tracksy_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
