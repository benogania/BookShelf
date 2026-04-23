import React, { useContext, useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { 
  FiCompass, 
  FiBookmark, 
  FiSearch, 
  FiMenu, 
  FiX, 
  FiEdit3, 
  FiCheck, 
  FiSettings, 
  FiMessageSquare,
  FiArchive,
  FiBell 
} from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import MessageAdminModal from './MessageAdminModal';
import { useLocation } from 'react-router-dom';

export default function ClientLayout() {
  const { logout } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const location = useLocation();

  const isReadingPage = location.pathname.includes('/read/');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // LIVE SEARCH STATE
  const [searchInput, setSearchInput] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);

  // DYNAMIC CATEGORIES STATE
  const [allCategories, setAllCategories] = useState([]);
  const [pinnedCategories, setPinnedCategories] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempPinned, setTempPinned] = useState([]);

  // MESSAGING STATES
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // --- NEW: NOTIFICATION STATES ---
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  // LIVE POLLING FOR MESSAGES & NOTIFICATIONS
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('clientToken') || localStorage.getItem('token');
        if (!token) return; 
        
        // 1. Fetch Message Count
        const msgRes = await axios.get(`http://localhost:5000/api/messages/unread-count?t=${new Date().getTime()}`, {
          headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' }
        });
        setUnreadMessageCount(msgRes.data.unreadCount);

        // 2. Fetch Notification Count
        const notifRes = await axios.get(`http://localhost:5000/api/user-notifications/unread-count?t=${new Date().getTime()}`, {
          headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-cache' }
        });
        setUnreadNotifCount(notifRes.data.unreadCount);

      } catch (error) {
        // Silently fail to avoid console spam
      }
    };

    fetchCounts();
    const intervalId = setInterval(fetchCounts, 5000); // Polls every 5 seconds
    return () => clearInterval(intervalId);
  }, []);

  // Fetch Categories on Load
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/books/categories');
        const dbCategories = res.data;
        setAllCategories(dbCategories);

        const saved = localStorage.getItem('pinnedCategories');
        if (saved) {
          setPinnedCategories(JSON.parse(saved));
        } else {
          setPinnedCategories(dbCategories.slice(0, 6));
        }
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    };
    fetchCategories();
  }, []);

  // LIVE SEARCH EFFECT
  useEffect(() => {
    if (!searchInput.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/books?search=${encodeURIComponent(searchInput)}&limit=5&status=available`);
        setSearchResults(res.data.data);
        setShowSearchDropdown(true);
      } catch (error) {
        console.error("Search error", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  // Handle clicking outside search AND notifications
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // SEARCH HANDLERS
  const handleBookSelect = (bookId) => {
    navigate(`/book/${bookId}`);
    setShowSearchDropdown(false);
    setSearchInput(''); 
    setMobileMenuOpen(false); 
  };

  const executeSearch = () => {
    if (searchInput.trim() !== '') {
      navigate(`/?search=${encodeURIComponent(searchInput.trim())}`);
      setShowSearchDropdown(false);
    } else {
      navigate(`/`); 
    }
    setMobileMenuOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') executeSearch();
  };

  // --- NEW: NOTIFICATION HANDLERS ---
  const toggleNotifications = async () => {
    if (!showNotifDropdown) {
      try {
        const token = localStorage.getItem('clientToken') || localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/user-notifications/my-notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
      } catch (err) { console.error("Failed to load notifications", err); }
    }
    setShowNotifDropdown(!showNotifDropdown);
    setShowSearchDropdown(false); // Close search if open
  };

  const markNotifAsRead = async (id, isRead) => {
    if (isRead) return;
    try {
      const token = localStorage.getItem('clientToken') || localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/user-notifications/mark-read/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadNotifCount(prev => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const markAllNotifsRead = async () => {
    try {
      const token = localStorage.getItem('clientToken') || localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/user-notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadNotifCount(0);
    } catch (err) {}
  };

  // PIN/UNPIN LOGIC
  const openEditModal = () => {
    setTempPinned([...pinnedCategories]);
    setIsEditModalOpen(true);
  };

  const togglePin = (category) => {
    if (tempPinned.includes(category)) {
      setTempPinned(tempPinned.filter(c => c !== category));
    } else {
      if (tempPinned.length >= 6) {
        alert('You can only pin up to 6 categories to your sidebar.');
        return;
      }
      setTempPinned([...tempPinned, category]);
    }
  };

  const savePins = () => {
    setPinnedCategories(tempPinned);
    localStorage.setItem('pinnedCategories', JSON.stringify(tempPinned));
    setIsEditModalOpen(false);
  };

  return (
    <div className={`flex h-screen bg-gray-50 dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 font-sans overflow-hidden transition-colors duration-300`}>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-white dark:bg-[#1e293b] border-r border-gray-200 dark:border-slate-800 flex flex-col h-full z-50 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white shadow-sm">
              <span className="transform rotate-90 text-xs tracking-tighter">|||</span>
            </div>
            <span className="text-xl font-bold tracking-wide text-gray-900 dark:text-white">BookShelf</span>
          </div>
          <button className="md:hidden text-gray-500 dark:text-slate-400" onClick={() => setMobileMenuOpen(false)}>
            <FiX size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 overflow-y-auto custom-scrollbar px-4">
          <div className="text-[10px] font-bold text-gray-500 dark:text-slate-500 mb-3 px-2 uppercase tracking-widest">Menu</div>
          <NavLink to="/" end className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${isActive && !searchParams.get('category') ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 font-medium' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-gray-200'}`}>
            <FiCompass /> <span className="text-sm">Books</span>
          </NavLink>
          <NavLink to="/library" className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 font-medium' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-gray-200'}`}>
            <FiBookmark /> <span className="text-sm">My Library</span>
          </NavLink>

          {/* Dynamic Categories Header */}
          <div className="flex items-center justify-between mt-8 mb-3 px-2 group">
            <div className="text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest">Pinned Categories</div>
            <button 
              onClick={openEditModal}
              className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 opacity-70 group-hover:opacity-100"
              title="Edit Pinned Categories"
            >
              <FiEdit3 size={14} />
            </button>
          </div>

          {/* Dynamic Pinned Categories List */}
          {pinnedCategories.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500 dark:text-slate-500 italic">No categories pinned.</div>
          ) : (
            pinnedCategories.map(category => {
              const isActive = searchParams.get('category') === category;
              return (
                <button 
                  key={category} 
                  onClick={() => { navigate(`/?category=${encodeURIComponent(category)}`); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm text-left mb-1 ${isActive ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 font-medium' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-gray-200'}`}
                >
                  <span className="truncate">{category}</span>
                </button>
              )
            })
          )}

          {/* Archives Section */}
          <div className="mt-8 mb-3 px-2 text-[10px] font-bold text-gray-500 dark:text-slate-500 uppercase tracking-widest">
            Archives
          </div>
          <NavLink 
            to="/old-books" 
            className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-500 font-medium' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800/50 hover:text-gray-900 dark:hover:text-gray-200'}`}
            onClick={() => setMobileMenuOpen(false)}
          >
            <FiArchive /> <span className="text-sm">Old Books</span>
          </NavLink>
        </div>

        {/* Bottom Sidebar - Settings Link */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-800 shrink-0">
          <NavLink 
            to="/settings" 
            onClick={() => setMobileMenuOpen(false)} 
            className={({isActive}) => `flex items-center gap-3 w-full px-4 py-3 text-sm transition-all rounded-lg ${isActive ? 'bg-blue-600 shadow-md text-white font-medium' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'}`}
          >
            <FiSettings className={({isActive}) => isActive ? 'text-white' : 'text-gray-400 dark:text-slate-400'} size={18} /> 
            <span>Account Settings</span>
          </NavLink>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        
        {/* Header */}
        {!isReadingPage && (
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-gray-200 dark:border-slate-800 shrink-0 gap-4 bg-white dark:bg-[#0f172a] transition-colors relative z-20">
          
          {/* Left Side: Mobile Menu & Search */}
          <div className="flex items-center gap-3 flex-1">
            <button className="md:hidden text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors" onClick={() => setMobileMenuOpen(true)}>
              <FiMenu size={24} />
            </button>
            
            <div className="w-full max-w-2xl relative" ref={searchRef}>
              <FiSearch 
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors z-10" 
                onClick={executeSearch}
                size={18}
              />
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => { if(searchInput.trim()) setShowSearchDropdown(true) }}
                onKeyDown={handleKeyDown}
                placeholder="Search books..." 
                className="w-full bg-gray-100 dark:bg-[#1e293b] border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500 shadow-sm"
              />

              {/* Live Search Dropdown */}
              {showSearchDropdown && searchInput.trim() !== '' && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[400px]">
                  {isSearching ? (
                    <div className="p-4 text-sm text-gray-500 dark:text-slate-400 text-center animate-pulse">Searching library...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="overflow-y-auto custom-scrollbar">
                      {searchResults.map(book => (
                        <div 
                          key={book._id} 
                          onClick={() => handleBookSelect(book._id)}
                          className="flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer border-b border-gray-100 dark:border-slate-800/50 last:border-0 transition-colors"
                        >
                          <div className="w-10 h-14 shrink-0 bg-gray-200 dark:bg-slate-900 rounded overflow-hidden">
                            {book.cover_image ? (
                              <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                            ) : (
                              <FiBookmark className="w-full h-full p-3 text-gray-400 dark:text-slate-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-200 truncate">{book.title}</h4>
                            <p className="text-xs text-blue-600 dark:text-blue-400 truncate">{book.author || 'Unknown Author'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-gray-500 dark:text-slate-400 text-center">No books found for "{searchInput}"</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center shrink-0 gap-3 ml-2">
            
            {/* --- NEW: NOTIFICATION BELL DROPDOWN --- */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={toggleNotifications}
                className="relative p-2 text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors flex items-center justify-center"
              >
                <FiBell size={20} />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-orange-500 border-2 border-white dark:border-[#0f172a] rounded-full animate-pulse"></span>
                )}
              </button>

              {/* DROPDOWN MENU */}
              {showNotifDropdown && (
                <div className="absolute top-full right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl z-50 flex flex-col max-h-[400px]">
                  <div className="p-3 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 rounded-t-xl">
                     <h3 className="font-bold text-sm text-gray-900 dark:text-white">System Alerts</h3>
                     {unreadNotifCount > 0 && (
                       <button onClick={markAllNotifsRead} className="text-[11px] font-medium text-blue-600 hover:underline">Mark all read</button>
                     )}
                  </div>
                  <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                    {notifications.length === 0 ? (
                       <div className="text-center text-xs text-gray-500 py-6">No new alerts.</div>
                    ) : (
                       notifications.map(notif => (
                         <div 
                           key={notif._id} 
                           onClick={() => markNotifAsRead(notif._id, notif.isRead)} 
                           className={`p-3 mb-1 rounded-lg transition-colors cursor-pointer ${notif.isRead ? 'bg-transparent hover:bg-gray-50 dark:hover:bg-slate-800/50' : 'bg-orange-50/50 dark:bg-orange-900/10 border-l-2 border-orange-500'}`}
                         >
                            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">{notif.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-slate-400 mt-1 leading-relaxed">{notif.message}</p>
                            <span className="text-[10px] text-gray-400 mt-2 block">
                              {new Date(notif.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                       ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* EXISTING: Message Admin Button */}
            <button 
              onClick={() => {
                setIsMessageModalOpen(true);
                setUnreadMessageCount(0);
              }}
              className="relative flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#1e293b] dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all"
            >
              <div className="relative">
                <FiMessageSquare size={18} />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-[#1e293b] rounded-full animate-pulse"></span>
                )}
              </div>
            </button>
          </div>

        </header>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative z-0">
          <Outlet />
        </main>
      </div>

      <MessageAdminModal 
        isOpen={isMessageModalOpen} 
        onClose={() => setIsMessageModalOpen(false)} 
      />

      {/* PIN/UNPIN CATEGORIES MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-[#0f172a]/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Customize Sidebar</h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Pin up to 6 categories for quick access ({tempPinned.length}/6)</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white bg-gray-200 dark:bg-slate-800 hover:bg-gray-300 dark:hover:bg-slate-700 rounded-full transition-colors">
                <FiX size={18} />
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar bg-white dark:bg-[#1e293b]">
              {allCategories.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-slate-500 py-10">No categories found in the database yet.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {allCategories.map(category => {
                    const isSelected = tempPinned.includes(category);
                    return (
                      <button
                        key={category}
                        onClick={() => togglePin(category)}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-all text-left ${isSelected ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-700 dark:text-blue-400 shadow-inner' : 'bg-white dark:bg-[#0f172a] border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500'}`}
                      >
                        <span className="truncate pr-2 font-medium">{category}</span>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shrink-0">
                            <FiCheck size={14} />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded border border-gray-300 dark:border-slate-600 shrink-0"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-[#0f172a]/50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsEditModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                Cancel
              </button>
              <button 
                onClick={savePins}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-md transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}