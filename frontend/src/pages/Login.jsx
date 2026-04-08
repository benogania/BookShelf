import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { BsShieldCheck } from 'react-icons/bs';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });

      // Extract token and user from backend response
      const { token, user } = response.data;
      
      // -> ADD THIS LINE: Save the username to local storage
      localStorage.setItem('username', user.username); 
      
      // Update global auth state
      login(token, user.role);

      // Redirect to the dashboard/books page
      navigate('/books');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to connect to server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] transition-colors duration-200 px-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-slate-800">
        
        {/* Header Section */}
        <div className="p-8 text-center border-b border-gray-100 dark:border-slate-800">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 mb-4">
            <BsShieldCheck className="text-3xl text-blue-600 dark:text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to Lumina
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Sign in to access the admin panel
          </p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors"
                placeholder="Enter admin username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-md transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
        
      </div>
    </div>
  );
}