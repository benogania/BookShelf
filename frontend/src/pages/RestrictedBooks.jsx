import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FiLock, FiUnlock, FiShield, FiSearch } from 'react-icons/fi'; // <-- Added FiSearch

export default function RestrictedBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- NEW: Search State ---
  const [searchQuery, setSearchQuery] = useState('');

  const fetchRestrictedBooks = async () => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/books/admin/restricted', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(res.data);
    } catch (err) {
      console.error("Failed to fetch restricted books", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestrictedBooks();
  }, []);

  const handleToggle = async (bookId, currentAction) => {
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/books/admin/restrict-toggle/${bookId}`, 
      { action: currentAction }, 
      { headers: { Authorization: `Bearer ${token}` } });
      
      // Refresh the list immediately
      fetchRestrictedBooks();
    } catch (err) {
      console.error(`Failed to ${currentAction} book`, err);
    }
  };

  // --- NEW: Filter Logic ---
  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    
    const lowerQuery = searchQuery.toLowerCase();
    return books.filter(book => 
      (book.title && book.title.toLowerCase().includes(lowerQuery)) ||
      (book.author && book.author.toLowerCase().includes(lowerQuery))
    );
  }, [books, searchQuery]);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading archive database...</div>;

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-100 dark:bg-[#0f172a]">
      
      {/* --- UPDATED: Header with Search Bar --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiShield className="text-orange-500" /> Restricted Books Manager
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your 5-year archives. Unrestrict books to make them public, or restrict them back to the vault.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72 shrink-0">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-medium">Book Info</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Current Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-500">
                    {searchQuery ? `No restricted books found matching "${searchQuery}".` : 'No restricted books found in the system.'}
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => {
                  // Determine if the book is currently locked or unlocked
                  const fiveYearsAgo = new Date();
                  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
                  const isCurrentlyRestricted = new Date(book.createdAt) < fiveYearsAgo;

                  return (
                    <tr key={book._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 flex gap-3 items-center">
                        <div className="w-10 h-12 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden shrink-0">
                          {book.cover_image && <img src={book.cover_image} alt="cover" className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-200 text-sm line-clamp-1" title={book.title}>
                            {book.title && book.title.length > 50 ? `${book.title.substring(0, 50)}...` : book.title}
                          </div>
                          <div className="text-xs text-slate-500">{book.author}</div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                        {book.category || '-'}
                      </td>
                      <td className="p-4">
                        {isCurrentlyRestricted ? (
                          <span className="px-2.5 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-500 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                            <FiLock /> Restricted (Archived)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-500 rounded-full text-xs font-bold flex items-center gap-1 w-max">
                            <FiUnlock /> Unrestricted (Public)
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {isCurrentlyRestricted ? (
                          <button 
                            onClick={() => handleToggle(book._id, 'unrestrict')}
                            className="px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-500 dark:hover:bg-green-900/40 rounded-lg text-sm font-medium transition-colors"
                          >
                            Unrestrict
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleToggle(book._id, 'restrict')}
                            className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            Restrict Again
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}