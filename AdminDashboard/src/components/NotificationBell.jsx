import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FiBell, FiUser, FiDownload, FiMessageSquare, FiCheck } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom'; // <--- NEW: Import useNavigate

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate(); // <--- NEW: Initialize navigate

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Fetch notifications on load
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      const res = await axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
      await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  // --- NEW: Handle clicks on individual notifications ---
  const handleNotificationClick = (type) => {
    setIsOpen(false); // Close the dropdown menu

    // Route to the specific pages based on the notification type
    if (type === 'message') {
      navigate('/messages');
    } else if (type === 'download') {
      navigate('/downloads');
    } else if (type === 'registration') {
      navigate('/users');
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'registration': return <div className="p-2 bg-green-500/20 text-green-500 rounded-full"><FiUser /></div>;
      case 'download': return <div className="p-2 bg-blue-500/20 text-blue-500 rounded-full"><FiDownload /></div>;
      case 'message': return <div className="p-2 bg-purple-500/20 text-purple-500 rounded-full"><FiMessageSquare /></div>;
      default: return <div className="p-2 bg-slate-500/20 text-slate-500 rounded-full"><FiBell /></div>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:text-white transition-colors relative"
      >
        <FiBell className="text-xl" />
        
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full border-1 border-slate-600 dark:borlder-slate-200">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-[#1e293b] rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
          
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]/50">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead}
                className="text-xs text-blue-500 hover:text-blue-400 flex items-center gap-1 transition-colors"
              >
                <FiCheck /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                No new notifications.
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  onClick={() => handleNotificationClick(notif.type)} // <--- NEW: Added onClick handler
                  className={`px-4 py-3 border-b border-slate-100 dark:border-slate-800/50 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`} // <--- NEW: Added cursor-pointer
                >
                  <div className="shrink-0 mt-1">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm leading-tight ${!notif.isRead ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-600 dark:text-slate-400'}`}>
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()} at {new Date(notif.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 shrink-0 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                  )}
                </div>
              ))
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}