import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import UserManagement from "./pages/UserManagement";
import Login from "./pages/Login";
import BookInventory from "./pages/BookInventory";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import DownloadsLogs from "./pages/DownloadsLogs";
import AdminMessages from "./pages/AdminMessages";
import SystemLogs from "./pages/SystemLogs";
import RestrictedBooks from "./pages/RestrictedBooks";
import NotifyUsers from "./pages/NotifyUsers";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />

            <Route path="books" element={<BookInventory />} />
            <Route path="settings" element={<Settings />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="downloads" element={<DownloadsLogs />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="messages" element={<AdminMessages />} />
            <Route path="/system-logs" element={<SystemLogs />} />
            <Route path="/restricted-books" element={<RestrictedBooks />} />
            <Route path="/notify-users" element={<NotifyUsers />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
