import React, { useState, useEffect, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiBook, FiUsers, FiDownload, FiSettings, FiMoon, FiSun } from 'react-icons/fi';
import { BsShieldCheck } from 'react-icons/bs';
import { AuthContext } from '../context/AuthContext'; // Import the context

export default function Sidebar() {
  const { user } = useContext(AuthContext); // Grab the logged-in user

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; 
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: <FiHome /> },
    { name: 'Book Inventory', path: '/books', icon: <FiBook />, badge: 5 },
    { name: 'User Management', path: '/users', icon: <FiUsers /> },
    { name: 'Downloads', path: '/downloads', icon: <FiDownload /> },
  ];

  return (
    <aside className="w-64 flex flex-col bg-white dark:bg-[#1e293b] border-r border-gray-100 dark:border-slate-800 transition-colors duration-200 h-screen sticky top-0 z-20">
      
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-slate-800">
        <BsShieldCheck className="text-2xl text-slate-800 dark:text-white mr-2" />
        <span className="text-xl font-bold text-slate-800 dark:text-white">
          Lumina <span className="text-blue-500">Admin</span>
        </span>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-6 flex flex-col gap-1 px-4 overflow-y-auto custom-scrollbar">
        <div className="text-xs font-semibold text-gray-400 dark:text-slate-500 mb-2 px-2 uppercase tracking-wider">
          System Core
        </div>
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-500 font-medium'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800/50 dark:hover:text-gray-200'
              }`
            }
          >
            <div className="flex items-center gap-3">
              {link.icon}
              <span className="text-sm">{link.name}</span>
            </div>
            {link.badge && (
              <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">
                {link.badge}
              </span>
            )}
          </NavLink>
        ))}

        <div className="text-xs font-semibold text-gray-400 dark:text-slate-500 mt-6 mb-2 px-2 uppercase tracking-wider">
          Configuration
        </div>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/10 dark:text-blue-500 font-medium'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800/50 dark:hover:text-gray-200'
            }`
          }
        >
          <FiSettings />
          <span className="text-sm">Settings</span>
        </NavLink>
      </div>

      {/* Dynamic User Profile & Theme Toggle */}
      <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-4">
        <div className="flex items-center gap-3 px-2">
          
          {/* Avatar: First Letter of Username */}
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold uppercase shadow-sm">
            {user?.username ? user.username.charAt(0) : 'A'}
          </div>
          
          <div className="flex flex-col overflow-hidden">
            {/* Display the Username */}
            <span className="text-sm font-medium text-gray-900 dark:text-white capitalize truncate">
              {user?.username || 'System Admin'}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
              {user?.role || 'admin'}@lumina.io
            </span>
          </div>
        </div>
        
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center justify-center gap-2 w-full py-2 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
        >
          {isDarkMode ? <FiSun className="text-yellow-400" /> : <FiMoon className="text-slate-600" />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  );
}