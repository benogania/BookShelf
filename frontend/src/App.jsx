import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout'; // <-- Import the new Layout
import UserManagement from './pages/UserManagement';
// Pages
import Login from './pages/Login';
import BookInventory from './pages/BookInventory';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import DownloadsLogs from './pages/DownloadsLogs';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes wrapped in Layout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout /> {/* <-- Use Layout here */}
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            {/* The Outlet in Layout.jsx will render BookInventory when the path is /books */}
            <Route path="books" element={<BookInventory />} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="downloads" element={<DownloadsLogs />} />
            <Route path="dashboard" element={<Dashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;