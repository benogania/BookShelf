import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { FiTrash2, FiShield, FiUser, FiSearch, FiFilter, FiList } from 'react-icons/fi';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL Params State
  const [searchParams, setSearchParams] = useSearchParams();
  const currentSearch = searchParams.get('search') || '';
  const currentRole = searchParams.get('role') || 'all';
  const currentSort = searchParams.get('sort') || 'newest';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/users', {
        params: {
          search: currentSearch,
          role: currentRole,
          sort: currentSort
        }
      });
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever filters change
  useEffect(() => {
    fetchUsers();
  }, [currentSearch, currentRole, currentSort]);

  // Handlers for URL Params
  const handleSearchChange = (e) => {
    setSearchParams(prev => {
      if (e.target.value) prev.set('search', e.target.value);
      else prev.delete('search');
      return prev;
    });
  };

  const handleRoleChange = (e) => {
    setSearchParams(prev => {
      prev.set('role', e.target.value);
      return prev;
    });
  };

  const handleSortChange = (e) => {
    setSearchParams(prev => {
      prev.set('sort', e.target.value);
      return prev;
    });
  };

  // User Actions
  const handleRoleToggle = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (window.confirm(`Are you sure you want to change this user to ${newRole}?`)) {
      try {
        await axios.put(`http://localhost:5000/api/users/${id}/role`, { role: newRole });
        fetchUsers(); 
      } catch (error) {
        alert(error.response?.data?.message || "Failed to update role");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this user?")) {
      try {
        await axios.delete(`http://localhost:5000/api/users/${id}`);
        fetchUsers(); 
      } catch (error) {
        alert(error.response?.data?.message || "Failed to delete user");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100 h-full flex flex-col">
      
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">View, promote, and manage system access.</p>
        </div>
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium border border-blue-100 dark:border-blue-800/50">
          Total Users: {users.length}
        </div>
      </div>

      {/* Control Bar: Search, Filter, Sort */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search Bar */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={currentSearch}
            onChange={handleSearchChange}
            placeholder="Search by username..."
            className="w-full bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {/* Role Filter (Show Admins Feature) */}
        <div className="relative md:w-48">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select 
            value={currentRole}
            onChange={handleRoleChange}
            className="w-full appearance-none bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 py-2 pl-10 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Users</option>
            <option value="admin">Admins Only</option>
            <option value="user">Standard Users</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="relative md:w-56">
          <FiList className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select 
            value={currentSort}
            onChange={handleSortChange}
            className="w-full appearance-none bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 py-2 pl-10 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="newest">Newest Joined</option>
            <option value="oldest">Oldest Joined</option>
            <option value="last_active">Recently Active</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="flex-1 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/30">
                <th className="p-5 pb-3">User Details</th>
                <th className="p-5 pb-3">Role</th>
                <th className="p-5 pb-3">Joined Date</th>
                <th className="p-5 pb-3">Last Active</th>
                <th className="p-5 pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No users found matching your criteria.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="border-b border-gray-50 dark:border-slate-800/60 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    
                    <td className="p-5 flex gap-4 items-center border-none">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${u.role === 'admin' ? 'bg-indigo-500' : 'bg-slate-400'}`}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 capitalize">{u.username}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">ID: {u._id.slice(-6)}</div>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 w-max ${
                        u.role === 'admin' 
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50' 
                          : 'bg-gray-100 text-gray-600 dark:bg-slate-700/50 dark:text-gray-300 border border-gray-200 dark:border-slate-600/50'
                      }`}>
                        {u.role === 'admin' ? <FiShield size={12} /> : <FiUser size={12} />}
                        {u.role === 'admin' ? 'Administrator' : 'Standard User'}
                      </span>
                    </td>

                    <td className="p-5 text-sm text-gray-600 dark:text-gray-300">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="p-5 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(u.lastActive)}
                    </td>

                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => handleRoleToggle(u._id, u.role)} 
                          className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        >
                          {u.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                        </button>
                        <button 
                          onClick={() => handleDelete(u._id)} 
                          className="text-gray-400 hover:text-red-500 transition-colors ml-2" 
                          title="Delete User"
                        >
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}