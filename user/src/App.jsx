import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MyLibrary from './pages/MyLibrary';

// Layouts & Pages
import ClientLayout from './components/ClientLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Discover from './pages/Discover';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Client Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <ClientLayout />

              </ProtectedRoute>
            }
          >
            {/* The Discover Grid loads by default at "/" */}
            <Route index element={<Discover />} />
            <Route path="library" element={<MyLibrary />} />
            
            {/* You can add more user pages here later like: */}
            {/* <Route path="library" element={<MyLibrary />} /> */}
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;