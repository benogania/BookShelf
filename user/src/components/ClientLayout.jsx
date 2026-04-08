import React, { useContext, useState } from 'react';
import { Outlet, NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import { FiCompass, FiBookmark, FiSearch, FiLogOut, FiSun, FiMoon, FiMenu, FiX } from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';

export default function ClientLayout() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark for user side

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      navigate(`/?search=${e.target.value}`);
    }
  };

  const categories = ['Fiction', 'Science', 'Technology', 'History', 'Business', 'Art & Design'];

  return (
    <div className={`flex h-screen bg-[#0f172a] text-gray-100 font-sans overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
      
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-[#1e293b] border-r border-slate-800 flex flex-col h-full z-50 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center mr-3 font-bold text-white shadow-sm">|||</div>
            <span className="text-xl font-bold">Lumina</span>
          </div>
          <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(false)}><FiX size={24} /></button>
        </div>

        <div className="flex-1 py-6 overflow-y-auto custom-scrollbar px-4">
          <div className="text-[10px] font-bold text-slate-500 mb-3 px-2 uppercase tracking-widest">Menu</div>
          <NavLink to="/" end className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors ${isActive ? 'bg-blue-600/10 text-blue-500 border-l-2 border-blue-500' : 'text-slate-400 hover:bg-slate-800/50 hover:text-gray-200'}`}>
            <FiCompass /> <span className="text-sm font-medium">Discover</span>
          </NavLink>
          <NavLink to="/library" className={({isActive}) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-blue-600/10 text-blue-500 border-l-2 border-blue-500' : 'text-slate-400 hover:bg-slate-800/50 hover:text-gray-200'}`}>
            <FiBookmark /> <span className="text-sm font-medium">My Library</span>
          </NavLink>

          <div className="text-[10px] font-bold text-slate-500 mt-8 mb-3 px-2 uppercase tracking-widest">Categories</div>
          {categories.map(cat => {
            const isActive = searchParams.get('category') === cat;
            return (
              <button 
                key={cat} 
                onClick={() => { navigate(`/?category=${encodeURIComponent(cat)}`); setMobileMenuOpen(false); }}
                className={`w-full flex items-center px-3 py-2.5 rounded-lg transition-colors text-sm text-left ${isActive ? 'bg-blue-600/10 text-blue-500 font-medium border-l-2 border-blue-500' : 'text-slate-400 hover:bg-slate-800/50 hover:text-gray-200'}`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        <div className="p-4 border-t border-slate-800 flex flex-col gap-2">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-400 hover:text-gray-200 transition-colors">
            {isDarkMode ? <FiSun /> : <FiMoon />} {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-400 hover:text-red-400 transition-colors">
            <FiLogOut /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 flex items-center px-4 md:px-8 border-b border-slate-800 shrink-0 gap-4">
          <button className="md:hidden text-slate-400" onClick={() => setMobileMenuOpen(true)}>
            <FiMenu size={24} />
          </button>
          <div className="w-full max-w-2xl relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search books, authors, or ISBN..." 
              onKeyDown={handleSearch}
              className="w-full bg-[#1e293b] border border-slate-700 text-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-500"
            />
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  );
}