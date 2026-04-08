import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // Using 'clientToken' to avoid colliding with your Admin app's token
      const token = localStorage.getItem('clientToken');
      const username = localStorage.getItem('clientUsername');
      
      if (token) {
        try {
          // 1. Crack open the JWT token to read its data
          const payloadBase64 = token.split('.')[1];
          const decodedJson = atob(payloadBase64);
          const payload = JSON.parse(decodedJson);

          // 2. Check if the expiration time (in milliseconds) has passed
          const isExpired = payload.exp * 1000 < Date.now();

          if (isExpired) {
            console.warn("Session expired. Clearing old token.");
            // Wipe everything to force a clean logout
            localStorage.removeItem('clientToken');
            localStorage.removeItem('clientUsername');
            delete axios.defaults.headers.common['Authorization'];
            setUser(null);
          } else {
            // Token is valid! Let them in and set up Axios headers.
            setUser({ token, username });
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
        } catch (error) {
          // If the token is corrupted or unreadable, wipe it to be safe
          console.error("Invalid token format. Clearing session.");
          localStorage.removeItem('clientToken');
          localStorage.removeItem('clientUsername');
          delete axios.defaults.headers.common['Authorization'];
          setUser(null);
        }
      }
      
      // Tell the app we are done checking so it can render the correct page
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token, username) => {
    localStorage.setItem('clientToken', token);
    localStorage.setItem('clientUsername', username);
    setUser({ token, username });
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const logout = () => {
    localStorage.removeItem('clientToken');
    localStorage.removeItem('clientUsername');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  // --- CRITICAL FIX FOR THE "GHOST SESSION" ---
  // Prevent the app from drawing the Main Page or routing anywhere 
  // until we finish checking if the token is alive.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-white transition-colors duration-300">
        <div className="animate-pulse font-medium">Verifying session...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};