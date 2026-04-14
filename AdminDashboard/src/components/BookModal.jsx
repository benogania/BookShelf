import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiUploadCloud, FiCode, FiFileText } from 'react-icons/fi';

export default function BookModal({ isOpen, onClose, fetchBooks, bookToEdit }) {
  const initialState = {
    title: '', author: '', publisher: '', publish_date: '',
    category: '', genre: '', format: 'PDF', language: '', size: '',
    isbn: '', description: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [coverFile, setCoverFile] = useState(null);
  const [bookFile, setBookFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- BULK INSERT STATE ---
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [jsonInput, setJsonInput] = useState('[\n  {\n    "title": "Example Book",\n    "author": "John Doe",\n    "category": "Science",\n    "format": "PDF",\n    "genre": "Physics, Space"\n  }\n]');

  useEffect(() => {
    if (bookToEdit) {
      setFormData({
        ...bookToEdit,
        genre: bookToEdit.genre ? bookToEdit.genre.join(', ') : '' 
      });
      setCoverFile(null);
      setBookFile(null);
      setIsBulkMode(false); // Force single mode when editing
    } else {
      setFormData(initialState);
      setCoverFile(null);
      setBookFile(null);
    }
  }, [bookToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    if (e.target.name === 'cover_image') setCoverFile(e.target.files[0]);
    else if (e.target.name === 'book_file') setBookFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) throw new Error("Admin token missing.");

      if (isBulkMode && !bookToEdit) {
        // ==========================================
        // FLOW A: BULK JSON IMPORT
        // ==========================================
        let parsedData;
        try {
          parsedData = JSON.parse(jsonInput);
        } catch (err) {
          throw new Error("Invalid JSON syntax. Please check for missing commas or quotes.");
        }

        if (!Array.isArray(parsedData)) {
          throw new Error("JSON must be an array of objects enclosed in brackets: [...]");
        }

        // Send JSON data (no multipart headers needed here)
        const config = { headers: { Authorization: `Bearer ${adminToken}` } };
        await axios.post('http://localhost:5000/api/books/bulk', parsedData, config);

      } else {
        // ==========================================
        // FLOW B: SINGLE BOOK & FILE UPLOAD
        // ==========================================
        const submitData = new FormData();
        
        Object.keys(formData).forEach(key => {
          submitData.append(key, formData[key]);
        });

        if (coverFile) submitData.append('cover_image', coverFile);
        if (bookFile) submitData.append('book_file', bookFile);

        // Tell Axios we are sending physical files
        const config = { 
          headers: { 
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'multipart/form-data' 
          } 
        };

        if (bookToEdit) {
          await axios.put(`http://localhost:5000/api/books/${bookToEdit._id}`, submitData, config);
        } else {
          await axios.post('http://localhost:5000/api/books', submitData, config);
        }
      }
      
      fetchBooks(); 
      onClose();    
    } catch (err) {
      console.error("Submission Error:", err);
      setError(err.response?.data?.message || err.message || 'Failed to save book(s)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50 shrink-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {bookToEdit ? 'Edit Book' : 'Add New Book'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{error}</div>}
          
          {/* --- TABS (Only show when adding new books) --- */}
          {!bookToEdit && (
            <div className="flex border-b border-gray-200 dark:border-slate-700 mb-6 gap-2">
              <button
                type="button"
                onClick={() => setIsBulkMode(false)}
                className={`flex items-center gap-2 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${!isBulkMode ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                <FiFileText /> Single Entry
              </button>
              <button
                type="button"
                onClick={() => setIsBulkMode(true)}
                className={`flex items-center gap-2 py-2 px-4 text-sm font-medium border-b-2 transition-colors ${isBulkMode ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                <FiCode /> Bulk JSON Import
              </button>
            </div>
          )}

          <form id="book-form" onSubmit={handleSubmit} className="flex flex-col h-full">
            
            {/* --- VIEW A: BULK JSON IMPORT --- */}
            {isBulkMode && !bookToEdit ? (
              <div className="flex-1 flex flex-col h-full min-h-[350px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste JSON Array
                </label>
                <textarea 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full flex-1 p-4 font-mono text-sm bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white resize-none custom-scrollbar"
                  placeholder="[\n  { \n    title: '...', \n    author: '...' \n  }\n]"
                ></textarea>
                {/* THE JSX PARSE ERROR FIX IS RIGHT HERE: */}
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Format must be an array of objects {"`[ { ... } ]`"}. Keys must be enclosed in double quotes. Required keys: <span className="font-mono text-blue-500">"title"</span>, <span className="font-mono text-blue-500">"author"</span>. 
                  <br/>*Note: Book files and covers must be uploaded individually later by clicking "Edit".*
                </p>
              </div>

            ) : (
              /* --- VIEW B: SINGLE FORM WITH FILES --- */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="md:col-span-1 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition relative overflow-hidden group">
                  <FiUploadCloud className="mx-auto text-3xl text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" />
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 cursor-pointer">
                    Upload Cover Image
                    <input type="file" name="cover_image" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </label>
                  <span className="text-xs text-blue-500 truncate block max-w-full font-medium">
                    {coverFile ? coverFile.name : (bookToEdit?.cover_image ? 'New file overrides current' : 'No file selected')}
                  </span>
                </div>

                <div className="md:col-span-1 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-4 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition relative overflow-hidden group">
                  <FiUploadCloud className="mx-auto text-3xl text-gray-400 mb-2 group-hover:text-blue-500 transition-colors" />
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 cursor-pointer">
                    Upload Book (PDF/EPUB)
                    <input type="file" name="book_file" accept=".pdf,.epub" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </label>
                  <span className="text-xs text-blue-500 truncate block max-w-full font-medium">
                    {bookFile ? bookFile.name : (bookToEdit?.download_link ? 'New file overrides current' : 'No file selected')}
                  </span>
                </div>

                <div className="md:col-span-2 mt-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author *</label>
                  <input type="text" name="author" required value={formData.author} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <input type="text" name="category" placeholder="e.g. Mathematics" value={formData.category} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Genres (comma separated)</label>
                  <input type="text" name="genre" placeholder="e.g. Science, Physics" value={formData.genre} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ISBN</label>
                  <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
                  <select name="format" value={formData.format} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all">
                    <option value="PDF">PDF</option>
                    <option value="EPUB">EPUB</option>
                    <option value="Audiobook">Audiobook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publisher</label>
                  <input type="text" name="publisher" value={formData.publisher} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publish Date</label>
                  <input type="date" name="publish_date" value={formData.publish_date} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all custom-scrollbar resize-none"></textarea>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition">
            Cancel
          </button>
          <button type="submit" form="book-form" disabled={loading} className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition disabled:opacity-70 flex items-center gap-2">
            {loading ? 'Processing...' : (isBulkMode && !bookToEdit ? 'Import Books' : 'Save Book')}
          </button>
        </div>

      </div>
    </div>
  );
}