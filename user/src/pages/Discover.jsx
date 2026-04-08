import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiBookmark, FiFileText, FiInfo, FiLock } from 'react-icons/fi'; // <--- Added FiLock

export default function Discover() {
  const [books, setBooks] = useState([]);
  const [savedBookIds, setSavedBookIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const currentCategory = searchParams.get('category') || 'All Books';
  const searchQuery = searchParams.get('search') || '';
  const ageFilter = searchParams.get('age') || '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const libraryRes = await axios.get('http://localhost:5000/api/users/library');
        setSavedBookIds(libraryRes.data.map(b => b._id));

        let endpoint = 'http://localhost:5000/api/books/random?limit=50';
        let params = {};

        if (searchQuery || currentCategory !== 'All Books' || ageFilter) {
          endpoint = 'http://localhost:5000/api/books';
          params = {
            status: 'available', 
            limit: 50,
            category: currentCategory !== 'All Books' ? currentCategory : '',
            search: searchQuery,
            age: ageFilter 
          };
        }

        const res = await axios.get(endpoint, { params });
        setBooks(res.data.data);
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentCategory, searchQuery, ageFilter]);

  const toggleBookmark = async (e, bookId) => {
    e.stopPropagation(); 
    try {
      const res = await axios.post(`http://localhost:5000/api/users/library/${bookId}`);
      setSavedBookIds(res.data.savedBooks);
    } catch (error) {
      console.error('Failed to toggle bookmark', error);
    }
  };

  const getPageTitle = () => {
    if (ageFilter === 'old') return 'Archived Books';
    if (searchQuery) return `Search: "${searchQuery}"`;
    return currentCategory;
  };

  const getPageSubtitle = () => {
    if (ageFilter === 'old') return 'Preserved historical books from 5+ years ago';
    if (searchQuery || currentCategory !== 'All Books') return `Explore books in ${currentCategory}`;
    return 'Discover our randomized daily picks';
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 border-b border-gray-200 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 capitalize">
            {getPageTitle()}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-xs md:text-sm">
            {getPageSubtitle()}
          </p>
        </div>
        <div className="text-xs md:text-sm text-gray-400 dark:text-slate-500 mt-2 md:mt-0">{books.length} results</div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 animate-pulse text-gray-500 dark:text-slate-500">Loading library...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-slate-500">No books found.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 md:gap-4">
          {books.map((book) => {
            const isSaved = savedBookIds.includes(book._id);
            
            // --- NEW: Calculate if this book is restricted ---
            const fiveYearsAgo = new Date();
            fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
            const isRestricted = new Date(book.createdAt) < fiveYearsAgo && !book.unrestricted;

            return (
              <div 
                key={book._id} 
                onClick={() => navigate(`/book/${book._id}`)} 
                className={`bg-white dark:bg-[#1e293b] rounded-xl overflow-hidden shadow-md border ${isRestricted ? 'border-orange-200 dark:border-orange-900/50 hover:border-orange-400 dark:hover:border-orange-500' : 'border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-600'} transition-all group flex flex-col h-full cursor-pointer`}
              >
                <div className={`relative aspect-[2/3] bg-gray-100 dark:bg-slate-800 overflow-hidden ${isRestricted ? 'opacity-90 sepia-[.15]' : ''}`}>
                  {book.cover_image ? (
                    <img src={book.cover_image} alt={book.title} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isRestricted ? 'grayscale-[20%]' : ''}`} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-600 text-xs p-2 text-center">No Cover</div>
                  )}
                  
                  <button 
                    onClick={(e) => toggleBookmark(e, book._id)}
                    className="absolute top-2 right-2 p-2 rounded-full backdrop-blur-md bg-white/50 dark:bg-black/40 hover:bg-white/80 dark:hover:bg-black/60 transition-colors z-10"
                  >
                    <FiBookmark className={`text-sm md:text-base ${isSaved ? (isRestricted ? 'fill-orange-500 text-orange-500' : 'fill-blue-500 text-blue-500') : 'text-gray-700 dark:text-white'}`} />
                  </button>
                </div>

                <div className="p-3 flex flex-col flex-1">
                  <h3 className={`font-bold text-gray-900 dark:text-gray-100 text-xs md:text-sm line-clamp-2 mb-1 transition-colors leading-snug ${isRestricted ? 'group-hover:text-orange-600 dark:group-hover:text-orange-400' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                    {book.title}
                  </h3>
                  <p className="text-[10px] md:text-xs text-gray-500 dark:text-slate-400 mb-3 line-clamp-1">{book.author || 'Unknown Author'}</p>
                  
                  <div className="mt-auto flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-500 font-medium">
                    <span className="bg-gray-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded truncate max-w-[65%] text-gray-600 dark:text-slate-300">
                      {book.category || 'Uncategorized'}
                    </span>
                    
                    {/* --- NEW: Show Restricted lock OR Format icon --- */}
                    {isRestricted ? (
                      <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold">
                        <FiLock /> Restricted
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <FiFileText /> {book.format || 'PDF'}
                      </span>
                    )}
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