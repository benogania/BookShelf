import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
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
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4 font-sans text-gray-100">
      <div className="max-w-md w-full bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-800 p-8">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 mb-4">
            <BsShieldCheck className="text-3xl text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
          <p className="text-sm text-slate-400 mt-2">Sign in to your library</p>
        </div>

        {error && <div className="mb-6 p-3 bg-red-900/20 text-red-400 border border-red-800/50 rounded-lg text-sm text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input 
              type="text" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 text-white outline-none placeholder-slate-600 transition-colors" 
              placeholder="Enter your username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 text-white outline-none placeholder-slate-600 transition-colors" 
              placeholder="Enter password"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-70 mt-4"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-6">
          Don't have an account? <Link to="/register" className="text-blue-500 hover:text-blue-400 hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}