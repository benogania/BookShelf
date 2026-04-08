import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiBookmark, FiFileText, FiArchive } from 'react-icons/fi';

export default function OldBooks() {
  const [books, setBooks] = useState([]);
  const [savedBookIds, setSavedBookIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch user's saved books
        const libraryRes = await axios.get('http://localhost:5000/api/users/library');
        setSavedBookIds(libraryRes.data.map(b => b._id));

        // 2. Fetch ONLY the old books using our new age=old query!
        const token = localStorage.getItem('clientToken') || localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/books?age=old&status=available&limit=50', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        setBooks(res.data.data);
      } catch (error) {
        console.error('Error fetching archived books', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleBookmark = async (e, bookId) => {
    e.stopPropagation(); 
    try {
      const res = await axios.post(`http://localhost:5000/api/users/library/${bookId}`);
      setSavedBookIds(res.data.savedBooks);
    } catch (error) {
      console.error('Failed to toggle bookmark', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Archive Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 border-b border-gray-200 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-3">
            <FiArchive className="text-blue-600 dark:text-blue-500" /> Archived Books
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-xs md:text-sm">
            Preserved historical books from 5+ years ago. Request access to read.
          </p>
        </div>
        <div className="text-xs md:text-sm text-gray-400 dark:text-slate-500 mt-2 md:mt-0">{books.length} preserved</div>
      </div>

      {/* Book Grid */}
      {loading ? (
        <div className="flex justify-center py-20 animate-pulse text-gray-500 dark:text-slate-500">Dusting off the archives...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-slate-500">No books older than 5 years found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
          {books.map((book) => {
            const isSaved = savedBookIds.includes(book._id);
            return (
              <div 
                key={book._id} 
                onClick={() => navigate(`/book/${book._id}`)} 
                className="bg-white dark:bg-[#1e293b] rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-slate-800 hover:border-orange-300 dark:hover:border-orange-600 transition-all group flex flex-col h-full cursor-pointer"
              >
                <div className="relative aspect-[2/3] bg-gray-100 dark:bg-slate-800 overflow-hidden opacity-90 sepia-[.2]">
                  {book.cover_image ? (
                    <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 grayscale-[30%]" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-600 text-xs p-2 text-center">No Cover</div>
                  )}
                  
                  <button 
                    onClick={(e) => toggleBookmark(e, book._id)}
                    className="absolute top-2 right-2 p-2 rounded-full backdrop-blur-md bg-white/50 dark:bg-black/40 hover:bg-white/80 dark:hover:bg-black/60 transition-colors z-10"
                  >
                    <FiBookmark className={`text-sm md:text-base ${isSaved ? 'fill-orange-500 text-orange-500' : 'text-gray-700 dark:text-white'}`} />
                  </button>
                </div>

                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-xs md:text-sm line-clamp-2 mb-1 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors leading-snug">
                    {book.title}
                  </h3>
                  <p className="text-[10px] md:text-xs text-gray-500 dark:text-slate-400 mb-3 line-clamp-1">{book.author || 'Unknown Author'}</p>
                  
                  <div className="mt-auto flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-500 font-medium">
                    <span className="bg-gray-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded truncate max-w-[65%] text-gray-600 dark:text-slate-300">
                      {book.category || 'Uncategorized'}
                    </span>
                    <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                      Archived
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}