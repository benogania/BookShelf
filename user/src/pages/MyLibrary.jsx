import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiBookmark, FiFileText, FiTrash2 } from 'react-icons/fi';

export default function MyLibrary() {
  const [savedBooks, setSavedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const removeBookmark = async (bookId) => {
    try {
      await axios.post(`http://localhost:5000/api/users/library/${bookId}`);
      // Remove it from the local state immediately for a snappy UI response
      setSavedBooks(prev => prev.filter(book => book._id !== bookId));
    } catch (error) {
      console.error('Failed to remove bookmark', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">My Library</h1>
        <p className="text-slate-400 text-xs md:text-sm">Manage your saved books and reading list</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 animate-pulse text-slate-500">Loading your books...</div>
      ) : savedBooks.length === 0 ? (
        <div className="text-center py-20 bg-slate-800/20 rounded-xl border border-slate-800">
          <FiBookmark className="text-4xl text-slate-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-300 mb-2">Your library is empty</h2>
          <p className="text-slate-500 text-sm">Head over to the Discover page to find books to save.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
          {savedBooks.map((book) => (
            <div key={book._id} className="bg-[#1e293b] rounded-lg overflow-hidden shadow-md border border-slate-800 hover:border-slate-600 transition-all group flex flex-col h-full relative">
              
              <div className="relative aspect-[2/3] bg-slate-800 overflow-hidden">
                {book.cover_image ? (
                  <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs p-2 text-center">No Cover</div>
                )}
                
                {/* Remove Button Hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button 
                    onClick={() => removeBookmark(book._id)}
                    className="bg-red-500/80 hover:bg-red-600 text-white p-2.5 rounded-full flex items-center gap-2 text-xs font-medium backdrop-blur-sm transition-transform transform translate-y-2 group-hover:translate-y-0"
                  >
                    <FiTrash2 /> Remove
                  </button>
                </div>
              </div>

              <div className="p-3 flex flex-col flex-1">
                <h3 className="font-bold text-gray-100 text-xs md:text-sm line-clamp-2 mb-1 leading-snug">
                  {book.title}
                </h3>
                <p className="text-[10px] md:text-xs text-slate-400 mb-3 line-clamp-1">{book.author}</p>
                
                <div className="mt-auto flex items-center justify-between text-[10px] text-slate-500 font-medium">
                  <a 
                    href={book.download_link || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`px-2 py-1 rounded w-full text-center ${book.download_link ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/40' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                  >
                    Read
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}