import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiBookmark, FiFileText, FiTrash2 } from 'react-icons/fi';

export default function MyLibrary() {
  const [savedBooks, setSavedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate(); 

  useEffect(() => {
    fetchLibrary();
  }, []);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/users/library');
      setSavedBooks(res.data);
    } catch (error) {
      console.error('Error fetching library', error);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (e, bookId) => {
    e.stopPropagation(); 
    try {
      await axios.post(`http://localhost:5000/api/users/library/${bookId}`);
      setSavedBooks(prev => prev.filter(book => book._id !== bookId));
    } catch (error) {
      console.error('Failed to remove bookmark', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 border-b border-gray-200 dark:border-slate-800 pb-4 transition-colors">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">My Library</h1>
        <p className="text-gray-500 dark:text-slate-400 text-xs md:text-sm">Manage your saved books and reading list</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 animate-pulse text-gray-500 dark:text-slate-500">Loading your books...</div>
      ) : savedBooks.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/20 rounded-xl border border-gray-200 dark:border-slate-800 transition-colors">
          <FiBookmark className="text-4xl text-gray-400 dark:text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-300 mb-2">Your library is empty</h2>
          <p className="text-gray-500 dark:text-slate-500 text-sm">Head over to the Discover page to find books to save.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
          {savedBooks.map((book) => (
            <div 
              key={book._id} 
              onClick={() => navigate(`/book/${book._id}`)} 
              className="bg-white dark:bg-[#1e293b] rounded-lg overflow-hidden shadow-md border border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600 transition-all group flex flex-col h-full relative cursor-pointer"
            >
              
              <div className="relative aspect-[2/3] bg-gray-100 dark:bg-slate-800 overflow-hidden">
                {book.cover_image ? (
                  <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-600 text-xs p-2 text-center">No Cover</div>
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <button 
                    onClick={(e) => removeBookmark(e, book._id)}
                    className="bg-red-500/90 hover:bg-red-600 text-white p-2.5 rounded-full flex items-center gap-2 text-xs font-medium backdrop-blur-sm transition-transform transform translate-y-2 group-hover:translate-y-0 pointer-events-auto"
                  >
                    <FiTrash2 /> Remove
                  </button>
                </div>
              </div>

              <div className="p-3 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs md:text-sm line-clamp-2 mb-1 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {book.title}
                </h3>
                <p className="text-[10px] md:text-xs text-gray-500 dark:text-slate-400 mb-3 line-clamp-1">{book.author || 'Unknown Author'}</p>
                
                <div className="mt-auto flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-500 font-medium">
                  <span className="bg-gray-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded truncate max-w-[65%] text-gray-600 dark:text-slate-300">
                    {book.genre && book.genre.length > 0 ? book.genre[0] : 'General'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FiFileText /> {book.format || 'PDF'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}