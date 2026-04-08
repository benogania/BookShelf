import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MyLibrary from './pages/MyLibrary';
import PdfReader from './pages/PdfReader';

// Layouts & Pages
import ClientLayout from './components/ClientLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Discover from './pages/Discover';
import BookDetails from './pages/BookDetails';
import Settings from './pages/Settings';
import { ThemeProvider } from './context/ThemeContext';
import OldBooks from './pages/OldBooks';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
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
            <Route path="book/:id" element={<BookDetails />} />
            <Route path="settings" element={<Settings />} />
            <Route path="/read/:id" element={<PdfReader />} />
            <Route path="/old-books" element={<OldBooks />} />

            {/* You can add more user pages here later like: */}
            {/* <Route path="library" element={<MyLibrary />} /> */}
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;