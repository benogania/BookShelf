import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiBookmark, FiFileText, FiLock, FiPlay } from 'react-icons/fi';

// ==========================================
// REUSABLE: BOOK CARD WITH HOVER OVERLAY
// ==========================================
const BookCard = ({ book, isSaved, onToggleBookmark, navigate }) => {
  // Calculate if this book is restricted (older than 5 years and not explicitly unrestricted)
  const fiveYearsAgo = new Date();
  fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
  const isRestricted = new Date(book.createdAt) < fiveYearsAgo && !book.unrestricted;

  return (
    <div 
      onClick={() => navigate(`/book/${book._id}`)} 
      className={`bg-white dark:bg-[#1e293b] rounded-xl overflow-hidden shadow-md border ${isRestricted ? 'border-orange-200 dark:border-orange-900/50 hover:border-orange-400 dark:hover:border-orange-500' : 'border-gray-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-600'} transition-all group flex flex-col h-full cursor-pointer`}
    >
      {/* Cover Image & Hover Overlay Container */}
      <div className={`relative aspect-[2/3] bg-gray-100 dark:bg-slate-800 overflow-hidden ${isRestricted ? 'sepia-[.15]' : ''}`}>
        {book.cover_image ? (
          <img 
            src={book.cover_image} 
            alt={book.title} 
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isRestricted ? 'grayscale-[20%]' : ''}`} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-slate-600 text-xs p-2 text-center">No Cover</div>
        )}
        
        {/* Bookmark Button */}
        <button 
          onClick={(e) => onToggleBookmark(e, book._id)}
          className="absolute top-2 right-2 p-2 rounded-full backdrop-blur-md bg-white/70 dark:bg-black/50 hover:bg-white dark:hover:bg-black/80 transition-all z-30 shadow-sm hover:scale-110"
        >
          <FiBookmark className={`text-sm md:text-base ${isSaved ? (isRestricted ? 'fill-orange-500 text-orange-500' : 'fill-blue-500 text-blue-500') : 'text-gray-700 dark:text-gray-200'}`} />
        </button>

        {/* --- SLEEK HOVER QUICK VIEW OVERLAY --- */}
        <div className="absolute inset-0 bg-slate-900/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4 z-20 backdrop-blur-[2px]">
          <div>
            <h3 className="text-white font-bold text-sm mb-1 line-clamp-2 leading-snug">{book.title}</h3>
            <p className="text-slate-300 text-[10px] md:text-xs line-clamp-4 leading-relaxed mt-2">
              {book.description || `Explore ${book.title} by ${book.author || 'this author'}. Click to view full details and access the document.`}
            </p>
          </div>
          
          <div className="flex items-center justify-end mt-4">
            <button 
              onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/read/${book._id}`);
              }}
              className={`${isRestricted ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'} text-white text-xs font-bold py-1.5 px-3 rounded flex items-center gap-1.5 transition-colors shadow-lg`}
            >
              {isRestricted ? <FiLock className="text-[10px]" /> : <FiPlay className="text-[10px]" />} Read
            </button>
          </div>
        </div>
      </div>

      {/* Card Footer (Visible when not hovering) */}
      <div className="p-3 flex flex-col flex-1 bg-white dark:bg-[#1e293b] z-10">
        <h3 className={`font-bold text-gray-900 dark:text-gray-100 text-xs md:text-sm line-clamp-2 mb-1 transition-colors leading-snug ${isRestricted ? 'group-hover:text-orange-600 dark:group-hover:text-orange-400' : 'group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
          {book.title}
        </h3>
        <p className="text-[10px] md:text-xs text-gray-500 dark:text-slate-400 mb-3 line-clamp-1">{book.author || 'Unknown Author'}</p>
        
        <div className="mt-auto flex items-center justify-between text-[10px] text-gray-500 dark:text-slate-500 font-medium">
          <span className="bg-gray-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded truncate max-w-[65%] text-gray-600 dark:text-slate-300">
            {book.category || 'Uncategorized'}
          </span>
          
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
};

// ==========================================
// MAIN DISCOVER PAGE
// ==========================================
export default function Discover() {
  const [books, setBooks] = useState([]);
  const [savedBookIds, setSavedBookIds] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- NEW: Display count for the Load More feature ---
  const [displayedBooksCount, setDisplayedBooksCount] = useState(12);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const currentCategory = searchParams.get('category') || 'All Books';
  const searchQuery = searchParams.get('search') || '';
  const ageFilter = searchParams.get('age') || '';

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayedBooksCount(12);
  }, [currentCategory, searchQuery, ageFilter]);

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

  const handleLoadMore = () => {
    setDisplayedBooksCount(prev => prev + 12);
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
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-8 border-b border-gray-200 dark:border-slate-800 pb-4 transition-colors">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mb-1 capitalize tracking-tight">
            {getPageTitle()}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-xs md:text-sm">
            {getPageSubtitle()}
          </p>
        </div>
        <div className="text-xs md:text-sm text-gray-400 dark:text-slate-500 font-medium mt-3 md:mt-0 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full inline-block">
          {books.length} results
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 animate-pulse text-gray-500 dark:text-slate-500 font-medium">Loading library...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-gray-500 dark:text-slate-500">
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">No books found</h3>
          <p>Try adjusting your search or category filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6">
            {books.slice(0, displayedBooksCount).map((book) => (
              <div key={book._id} className="flex justify-center h-full">
                <BookCard 
                  book={book} 
                  isSaved={savedBookIds.includes(book._id)}
                  onToggleBookmark={toggleBookmark}
                  navigate={navigate}
                />
              </div>
            ))}
          </div>

          {/* --- NEW: Load More Pagination --- */}
          {displayedBooksCount < books.length && (
            <div className="mt-12 flex justify-center">
              <button 
                onClick={handleLoadMore}
                className="px-8 py-3 bg-white dark:bg-[#1e293b] border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 transition-all shadow-sm active:scale-95"
              >
                Load More Results
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}