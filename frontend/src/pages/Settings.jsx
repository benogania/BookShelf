import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiLock, FiLogOut, FiSave } from 'react-icons/fi';

export default function Settings() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      return setStatus({ type: 'error', message: 'Passwords do not match.' });
    }

    setLoading(true);
    try {
      const payload = {};
      if (formData.username) payload.username = formData.username;
      if (formData.newPassword) payload.newPassword = formData.newPassword;

      await axios.put('http://localhost:5000/api/users/profile', payload);
      
      setStatus({ type: 'success', message: 'Profile updated successfully!' });
      setFormData({ username: '', newPassword: '', confirmPassword: '' }); // Clear form
    } catch (error) {
      setStatus({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to update profile.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout(); // Clears token from localStorage and Context
    navigate('/login'); // Redirects to login page
  };

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Manage your admin profile and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Profile Update Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
              <h2 className="text-lg font-bold">Admin Credentials</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Update your login username or password. Leave blank if you do not wish to change it.</p>
            </div>
            
            <div className="p-6">
              {status.message && (
                <div className={`mb-6 p-3 rounded-lg text-sm border ${status.type === 'error' ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:border-green-800'}`}>
                  {status.message}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Username</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="Enter new username"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="password" 
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="password" 
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end border-t border-gray-100 dark:border-slate-800 mt-6">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg shadow-sm transition disabled:opacity-70 font-medium"
                  >
                    <FiSave />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Danger Zone / Logout */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/30">
              <h2 className="text-lg font-bold text-red-600 dark:text-red-400">Session Management</h2>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                End your current session. You will be required to sign back in using your credentials.
              </p>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-white dark:bg-transparent border border-gray-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-lg transition font-medium"
              >
                <FiLogOut />
                Sign Out
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}