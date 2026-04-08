import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../components/Pagination';
import BookModal from '../components/BookModal';
import { FiEdit, FiTrash2, FiFilter, FiEye } from 'react-icons/fi';

export default function BookInventory() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, total: 1, totalItems: 0 });
  const [categories, setCategories] = useState([]); 
  
  // URL Params State
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const currentSearch = searchParams.get('search') || '';
  const currentCategory = searchParams.get('category') || '';
  const currentStatus = searchParams.get('status') || ''; 

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookToEdit, setBookToEdit] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/books/categories'); 
        setCategories(res.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, [books]);

  // Fetch Books List
  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/books`, {
        params: {
          page: currentPage,
          limit: 30,
          search: currentSearch,
          category: currentCategory,
          status: currentStatus 
        }
      })
      setBooks(res.data.data);
      setPagination({
        current: res.data.currentPage,
        total: res.data.totalPages,
        totalItems: res.data.totalItems
      });
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [currentPage, currentSearch, currentCategory, currentStatus]);

  const handlePageChange = (newPage) => {
    setSearchParams(prev => {
      prev.set('page', newPage);
      return prev;
    });
  };

  const handleStatusChange = (e) => {
    setSearchParams(prev => {
      if (e.target.value) prev.set('status', e.target.value);
      else prev.delete('status');
      prev.set('page', 1); 
      return prev;
    });
  };

  const handleCategoryChange = (e) => {
    setSearchParams(prev => {
      if (e.target.value) prev.set('category', e.target.value);
      else prev.delete('category');
      prev.set('page', 1); 
      return prev;
    });
  };

  const entriesStart = pagination.totalItems === 0 ? 0 : (pagination.current - 1) * 30 + 1;
  const entriesEnd = Math.min(pagination.current * 30, pagination.totalItems);

  // Modal Actions
  const handleAddClick = () => { setBookToEdit(null); setIsModalOpen(true); };
  const handleEditClick = (book) => { setBookToEdit(book); setIsModalOpen(true); };
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
       try {
         await axios.delete(`http://localhost:5000/api/books/${id}`);
         fetchBooks();
       } catch (error) {
         console.error("Error deleting book:", error);
         alert("Failed to delete book.");
       }
    }
  };

  const handleToggleStatus = async (book) => {
    const currentStatus = book.isActive !== false; 
    
    try {
      await axios.put(`http://localhost:5000/api/books/${book._id}`, {
        isActive: !currentStatus
      });
      fetchBooks(); 
    } catch (error) {
      console.error("Error toggling book status:", error);
      alert("Failed to update status.");
    }
  };

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Book Inventory</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage, add, update, and delete library titles.</p>
        </div>
        
        <div className="flex items-center gap-3">
          
          <div className="relative">
            <FiEye className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={currentStatus}
              onChange={handleStatusChange}
              className="appearance-none bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 py-2 pl-9 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select 
              value={currentCategory}
              onChange={handleCategoryChange}
              className="appearance-none bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 py-2 pl-9 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <button onClick={handleAddClick} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm transition font-medium whitespace-nowrap">
            + Add Book
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden">
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/30">
                <th className="p-5 pb-3">Title & Author</th>
                <th className="p-5 pb-3">Category</th>
                <th className="p-5 pb-3">ISBN / ID</th>
                <th className="p-5 pb-3">Status</th>
                <th className="p-5 pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">Loading inventory...</td></tr>
              ) : books.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">No books found.</td></tr>
              ) : (
                books.map((book) => (
                  <tr key={book._id} className="border-b border-gray-50 dark:border-slate-800/60 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                    
                    <td className="p-5 flex gap-4 items-center border-none">
                      <div className="w-10 h-14 bg-gray-100 dark:bg-slate-800 rounded shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-slate-700">
                        {book.cover_image ? (
                          <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-[9px] text-gray-400 text-center leading-tight p-1">Image<br/>Not<br/>Avail.</span>
                        )}
                      </div>
                      
                      {/* --- UPDATED: Title truncation logic applied here --- */}
                      <div className="flex-1 min-w-0">
                        <div 
                          className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate"
                          title={book.title}
                        >
                          {book.title && book.title.length > 50 
                            ? `${book.title.substring(0, 50)}...` 
                            : book.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                          {book.author}
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <span className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700/50 text-gray-600 dark:text-gray-300 rounded text-xs font-medium">
                        {book.category || 'Uncategorized'} 
                      </span>
                    </td>

                    <td className="p-5 text-sm text-gray-500 dark:text-gray-400">
                      {book.isbn || 'N/A'}
                    </td>

                    <td className="p-5">
                      <div className="flex flex-col gap-1.5 items-start">
                        <button 
                          onClick={() => handleToggleStatus(book)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1 transition-all duration-200 ${
                            book.isActive !== false 
                              ? 'bg-transparent text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/60 hover:bg-green-50 dark:hover:bg-green-900/40 cursor-pointer' 
                              : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer'
                          }`}
                          title="Click to toggle visibility"
                        >
                          {book.isActive !== false ? (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                              Available
                            </>
                          ) : (
                            <>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                              Hidden
                            </>
                          )}
                        </button>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">Format: {book.format || 'PDF'}</span>
                      </div>
                    </td>

                    <td className="p-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleEditClick(book)} className="text-gray-400 hover:text-blue-500 transition-colors" title="Edit">
                          <FiEdit className="text-lg" />
                        </button>
                        <button onClick={() => handleDelete(book._id)} className="text-gray-400 hover:text-red-500 transition-colors" title="Delete">
                          <FiTrash2 className="text-lg" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 bg-gray-50/50 dark:bg-slate-800/30">
          <div>
            Showing {entriesStart} to {entriesEnd} of {pagination.totalItems} entries
          </div>
          <Pagination 
            currentPage={pagination.current} 
            totalPages={pagination.total} 
            onPageChange={handlePageChange} 
          />
        </div>
      </div>

      <BookModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        fetchBooks={fetchBooks} 
        bookToEdit={bookToEdit} 
      />
    </div>
  );
}