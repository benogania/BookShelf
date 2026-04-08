import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { BsShieldCheck } from 'react-icons/bs';

export default function Register() {
  const [formData, setFormData] = useState({ username: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        username: formData.username,
        password: formData.password
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] px-4 font-sans text-gray-100">
      <div className="max-w-md w-full bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-800 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 mb-4">
            <BsShieldCheck className="text-3xl text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-white">Join Edushelf</h2>
          <p className="text-sm text-slate-400 mt-2">Create your free reader account</p>
        </div>

        {error && <div className="mb-6 p-3 bg-red-900/20 text-red-400 border border-red-800/50 rounded-lg text-sm text-center">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
            <input type="text" name="username" required onChange={handleChange} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 text-white outline-none placeholder-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input type="password" name="password" required onChange={handleChange} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 text-white outline-none placeholder-slate-600" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
            <input type="password" name="confirmPassword" required onChange={handleChange} className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-lg focus:ring-1 focus:ring-blue-500 text-white outline-none placeholder-slate-600" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-70 mt-2">
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        
        <p className="text-center text-sm text-slate-400 mt-6">
          Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-400 hover:underline">Log in here</Link>
        </p>
      </div>
    </div>
  );
}