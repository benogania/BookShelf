import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import { FiBookmark, FiFileText, FiX, FiDownload, FiInfo } from 'react-icons/fi';

export default function Discover() {
  const [books, setBooks] = useState([]);
  const [savedBookIds, setSavedBookIds] = useState([]); // Track user's bookmarks
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category') || 'All Books';
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch user's saved books so we can color the bookmark icons
        const libraryRes = await axios.get('http://localhost:5000/api/users/library');
        setSavedBookIds(libraryRes.data.map(b => b._id));

        // 2. Fetch the catalog
        let endpoint = 'http://localhost:5000/api/books/random?limit=50';
        let params = {};

        if (searchQuery || currentCategory !== 'All Books') {
          endpoint = 'http://localhost:5000/api/books';
          params = {
            status: 'available', limit: 50,
            category: currentCategory !== 'All Books' ? currentCategory : '',
            search: searchQuery
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
  }, [currentCategory, searchQuery]);

  // Handle Bookmarking
  const toggleBookmark = async (e, bookId) => {
    e.stopPropagation(); // Stop the modal from opening when clicking the bookmark button
    try {
      const res = await axios.post(`http://localhost:5000/api/users/library/${bookId}`);
      setSavedBookIds(res.data.savedBooks);
    } catch (error) {
      console.error('Failed to toggle bookmark', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-6 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 capitalize">
            {searchQuery ? `Search: "${searchQuery}"` : currentCategory}
          </h1>
          <p className="text-slate-400 text-xs md:text-sm">
            {searchQuery || currentCategory !== 'All Books' ? `Explore books in ${currentCategory}` : 'Discover our randomized daily picks'}
          </p>
        </div>
        <div className="text-xs md:text-sm text-slate-500 mt-2 md:mt-0">{books.length} results</div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 animate-pulse text-slate-500">Loading library...</div>
      ) : books.length === 0 ? (
        <div className="text-center py-20 text-slate-500">No books found.</div>
      ) : (
        /* INCREASED GRID COLUMNS = SMALLER CARDS */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4">
          {books.map((book) => {
            const isSaved = savedBookIds.includes(book._id);
            return (
              <div 
                key={book._id} 
                onClick={() => setSelectedBook(book)}
                className="bg-[#1e293b] rounded-lg overflow-hidden shadow-md border border-slate-800 hover:border-slate-600 transition-all group flex flex-col h-full cursor-pointer"
              >
                <div className="relative aspect-[2/3] bg-slate-800 overflow-hidden">
                  {book.cover_image ? (
                    <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs p-2 text-center">No Cover</div>
                  )}
                  
                  {/* Persistent Bookmark Button Top Right */}
                  <button 
                    onClick={(e) => toggleBookmark(e, book._id)}
                    className="absolute top-2 right-2 p-2 rounded-full backdrop-blur-md bg-black/40 hover:bg-black/60 transition-colors z-10"
                  >
                    <FiBookmark className={`text-sm md:text-base ${isSaved ? 'fill-blue-500 text-blue-500' : 'text-white'}`} />
                  </button>

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="bg-white/20 backdrop-blur-md p-2 rounded-md text-white">
                      <FiInfo className="text-lg" />
                    </div>
                  </div>
                </div>

                {/* Tighter padding for smaller cards */}
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-100 text-xs md:text-sm line-clamp-2 mb-1 group-hover:text-blue-400 transition-colors leading-snug">
                    {book.title}
                  </h3>
                  <p className="text-[10px] md:text-xs text-slate-400 mb-3 line-clamp-1">{book.author}</p>
                  
                  <div className="mt-auto flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span className="bg-slate-700/50 px-1.5 py-0.5 rounded truncate max-w-[65%]">
                      {book.genre[0] || 'General'}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiFileText /> {book.format || 'PDF'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Details Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedBook(null)}>
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar relative flex flex-col md:flex-row" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedBook(null)} className="absolute top-4 right-4 p-2 bg-slate-800/50 hover:bg-slate-700 rounded-full text-slate-300 transition-colors z-10">
              <FiX size={20} />
            </button>

            <div className="w-full md:w-2/5 bg-slate-800/30 flex flex-col items-center p-6 border-b md:border-b-0 md:border-r border-slate-800">
              <div className="w-40 md:w-full aspect-[2/3] bg-slate-900 rounded-xl shadow-lg overflow-hidden border border-slate-700 mb-6 mt-4 md:mt-0">
                {selectedBook.cover_image ? <img src={selectedBook.cover_image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600">No Image</div>}
              </div>
              
              <div className="flex flex-col w-full gap-3">
                <a href={selectedBook.download_link || '#'} target="_blank" rel="noopener noreferrer" className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${selectedBook.download_link ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`} onClick={(e) => !selectedBook.download_link && e.preventDefault()}>
                  <FiDownload /> {selectedBook.download_link ? 'Read / Download' : 'Not Available'}
                </a>
                <button 
                  onClick={(e) => toggleBookmark(e, selectedBook._id)}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${savedBookIds.includes(selectedBook._id) ? 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 border border-emerald-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                >
                  <FiBookmark className={savedBookIds.includes(selectedBook._id) ? 'fill-emerald-400' : ''} /> 
                  {savedBookIds.includes(selectedBook._id) ? 'Saved to Library' : 'Save to Library'}
                </button>
              </div>
            </div>

            <div className="w-full md:w-3/5 p-6 md:p-8 flex flex-col">
              <div className="mb-4">
                <h2 className="text-2xl font-bold text-white leading-tight mb-1">{selectedBook.title}</h2>
                <p className="text-base text-slate-400">{selectedBook.author}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-800 mb-4 text-xs md:text-sm">
                <div><div className="text-slate-500 mb-0.5">Format</div><div className="text-slate-200">{selectedBook.format || 'N/A'}</div></div>
                <div><div className="text-slate-500 mb-0.5">Size</div><div className="text-slate-200">{selectedBook.size || 'N/A'}</div></div>
                <div><div className="text-slate-500 mb-0.5">Language</div><div className="text-slate-200">{selectedBook.language || 'English'}</div></div>
                <div><div className="text-slate-500 mb-0.5">Published</div><div className="text-slate-200">{selectedBook.publish_date || 'N/A'}</div></div>
              </div>

              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-2">Description</h3>
                <p className="text-slate-400 leading-relaxed text-xs md:text-sm whitespace-pre-line">
                  {selectedBook.description || "No description provided."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}