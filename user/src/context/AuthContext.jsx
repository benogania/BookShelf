import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Using 'clientToken' to avoid colliding with your Admin app's token
    const token = localStorage.getItem('clientToken');
    const username = localStorage.getItem('clientUsername');
    
    if (token) {
      setUser({ token, username });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    setLoading(false);
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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};