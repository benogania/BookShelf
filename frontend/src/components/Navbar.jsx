import React, { useState, useEffect } from 'react';
import { FiSearch, FiBell } from 'react-icons/fi';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');

  // Keep local input in sync if URL changes (like hitting the back button)
  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    // If typing in search, navigate to books page with the query
    if (value) {
      navigate(`/books?search=${encodeURIComponent(value)}&page=1`);
    } else {
      // If cleared, just go to books page without query
      if (location.pathname === '/books') {
         navigate(`/books`);
      }
    }
  };

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-[#1e293b] border-b dark:border-slate-800 transition-colors duration-200 sticky top-0 z-10">
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
        <button className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
          <FiBell className="text-xl" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-[#1e293b]"></span>
        </button>
        {/* We can leave Add New Book here, or route it to the books page modal later */}
        <button onClick={() => navigate('/books')} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-2">
          <span>+</span> Add New Book
        </button>
      </div>
    </header>
  );
}