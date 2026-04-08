import React, { useState, useEffect } from 'react';
import { FiSearch, FiMessageSquare } from 'react-icons/fi'; // Removed FiBell here
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import NotificationBell from './NotificationBell'; // <--- NEW: Import our Bell Component! (Adjust path if needed)

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  
  // Admin Unread Count State
  const [unreadCount, setUnreadCount] = useState(0);

  // Keep local input in sync if URL changes
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  // Live Polling for Admin Unread Messages
  useEffect(() => {
    const fetchAdminUnreadCount = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        if (!token) return;

        // Cache-busting URL to ensure we always get the live number
        const res = await axios.get(`http://localhost:5000/api/messages/admin/unread-count?t=${new Date().getTime()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        });
        
        setUnreadCount(res.data.unreadCount);
      } catch (error) {
        // Silently fail so it doesn't spam the console
      }
    };

    fetchAdminUnreadCount();
    const intervalId = setInterval(fetchAdminUnreadCount, 5000);

    return () => clearInterval(intervalId);
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value) {
      navigate(`/books?search=${encodeURIComponent(value)}&page=1`);
    } else {
      if (location.pathname === '/books') {
         navigate(`/books`);
      }
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-[#1e293b] border-b border-b-slate-50 dark:border-slate-800 transition-colors duration-200 sticky top-0 z-10">
      <div className="flex-1 max-w-2xl flex items-center">
        <div className="relative w-full">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search inventory (title, author)..."
            className="w-full bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-4">
        
        {/* --- NEW: THE FULLY FUNCTIONAL NOTIFICATION BELL --- */}
        <NotificationBell />

        {/* --- MESSAGES ICON WITH NUMBERED BADGE --- */}
        <button 
          onClick={() => navigate('/messages')} 
          className="relative p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
          title="Admin Inbox"
        >
          <FiMessageSquare className="text-xl" />
          
          {/* Display the numbered badge only if count is greater than 0 */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold border-2 border-white dark:border-[#1e293b] rounded-full animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

      </div>
    </header>
  );
}