import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BsShieldCheck, BsEye, BsEyeSlash } from 'react-icons/bs';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // NEW: Track password visibility
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Connects to your existing Admin backend
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });

      const { token, user } = response.data;
      
      // Save to client context
      login(token, user.username);
      navigate('/');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // UPDATED: Added light mode defaults and dark: variants for the background and text
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f172a] px-4 font-sans text-slate-900 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 p-8 transition-colors duration-300">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-600/10 mb-4 transition-colors duration-300">
            <BsShieldCheck className="text-3xl text-blue-600 dark:text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Sign in to your library</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white outline-none placeholder-slate-400 dark:placeholder-slate-600 transition-colors" 
              placeholder="Enter your username"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            {/* UPDATED: Wrapper set to relative to hold the absolute eye icon */}
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} // Toggles between text and password
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-[#0f172a] border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white outline-none placeholder-slate-400 dark:placeholder-slate-600 transition-colors" 
                placeholder="Enter password"
              />
              {/* NEW: Show/Hide Button */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 focus:outline-none transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <BsEyeSlash size={20} /> : <BsEye size={20} />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-70 mt-4 shadow-sm"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          Don't have an account? <Link to="/register" className="text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:underline transition-colors">Register here</Link>
        </p>
      </div>
    </div>
  );
}