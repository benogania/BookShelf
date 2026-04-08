import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  // 1. Grab both 'user' AND 'loading' from the context
  const { user, loading } = useContext(AuthContext);

  // 2. CRITICAL FIX: If the app is still checking the token, DO NOT redirect yet. Just wait.
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-slate-500 animate-pulse">Verifying access...</div>
      </div>
    );
  }

  // 3. Once loading is done, if there is no user, kick them out
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 4. If they have a user, let them into the Dashboard!
  return children;
}