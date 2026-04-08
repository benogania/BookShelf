import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiX, FiCode } from 'react-icons/fi';

export default function BookModal({ isOpen, onClose, fetchBooks, bookToEdit }) {
  const initialState = {
    title: '', author: '', publisher: '', publish_date: '',
    genre: '', format: 'PDF', language: '', size: '',
    isbn: '', description: '', cover_image: '', download_link: ''
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // New States for Bulk Import
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [jsonInput, setJsonInput] = useState('[\n  {\n    "title": "Example Book",\n    "author": "John Doe",\n    "format": "PDF",\n    "genre": "Fiction, Science"\n  }\n]');

  // Populate form if we are editing an existing book
  useEffect(() => {
    if (bookToEdit) {
      setFormData({
        ...bookToEdit,
        genre: bookToEdit.genre ? bookToEdit.genre.join(', ') : '' 
      });
      setIsBulkMode(false); // Force single mode when editing
    } else {
      setFormData(initialState);
    }
  }, [bookToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (isBulkMode && !bookToEdit) {
        // --- BULK IMPORT LOGIC ---
        let parsedData;
        try {
          parsedData = JSON.parse(jsonInput);
        } catch (err) {
          throw new Error("Invalid JSON syntax. Please check for missing commas or quotes.");
        }

        if (!Array.isArray(parsedData)) {
          throw new Error("JSON must be an array of objects enclosed in brackets: [...]");
        }

        await axios.post('http://localhost:5000/api/books/bulk', parsedData, config);

      } else {
        // --- SINGLE ENTRY LOGIC ---
        let parsedGenre = [];
        if (typeof formData.genre === 'string') {
            parsedGenre = formData.genre.split(',').map(g => g.trim()).filter(Boolean);
        } else if (Array.isArray(formData.genre)) {
            parsedGenre = formData.genre;
        }

        const payload = { ...formData, genre: parsedGenre };

        if (bookToEdit) {
          await axios.put(`http://localhost:5000/api/books/${bookToEdit._id}`, payload, config);
        } else {
          await axios.post('http://localhost:5000/api/books', payload, config);
        }
      }
      
      fetchBooks(); 
      onClose();    
    } catch (err) {
      console.error("Submission Error:", err);
      setError(err.response?.data?.message || err.message || 'Failed to save book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity p-4">
      <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {bookToEdit ? 'Edit Book' : 'Add New Book'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{error}</div>}
          
          {/* Toggle Tabs (Only show if we are adding a NEW book, not editing) */}
          {!bookToEdit && (
            <div className="flex border-b border-gray-200 dark:border-slate-700 mb-6">
              <button
                type="button"
                onClick={() => setIsBulkMode(false)}
                className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${!isBulkMode ? 'border-blue-600 text-blue-600 dark:border-blue-500 dark:text-blue-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
              >
                Single Entry
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
            
            {/* --- JSON BULK IMPORT VIEW --- */}
            {isBulkMode && !bookToEdit ? (
              <div className="flex-1 flex flex-col h-full min-h-[300px]">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Paste JSON Array
                </label>
                <textarea 
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="w-full flex-1 p-4 font-mono text-sm bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white resize-none custom-scrollbar"
                  placeholder="[\n  { \n    title: '...', \n    author: '...' \n  }\n]"
                ></textarea>
                <p className="text-xs text-gray-500 mt-2">
                  Format must be an array of objects. Keys must be enclosed in double quotes. Required keys: "title", "author".
                </p>
              </div>

            ) : (
            /* --- SINGLE ENTRY FORM VIEW --- */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Author *</label>
                  <input type="text" name="author" required value={formData.author} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ISBN</label>
                  <input type="text" name="isbn" value={formData.isbn} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format</label>
                  <select name="format" value={formData.format} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
                    <option value="PDF">PDF</option>
                    <option value="EPUB">EPUB</option>
                    <option value="Audiobook">Audiobook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Genres (comma separated)</label>
                  <input type="text" name="genre" placeholder="e.g. Science, Physics, Non-fiction" value={formData.genre} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publisher</label>
                  <input type="text" name="publisher" value={formData.publisher} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publish Date</label>
                  <input type="date" name="publish_date" value={formData.publish_date} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
                  <input type="text" name="language" placeholder="e.g. English" value={formData.language} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File Size</label>
                  <input type="text" name="size" placeholder="e.g. 15MB or 350 pages" value={formData.size} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image URL</label>
                  <input type="url" name="cover_image" placeholder="https://example.com/image.jpg" value={formData.cover_image} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Download Link URL</label>
                  <input type="url" name="download_link" placeholder="https://example.com/download.pdf" value={formData.download_link} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-gray-900 dark:text-white" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"></textarea>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition">
            Cancel
          </button>
          <button type="submit" form="book-form" disabled={loading} className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition disabled:opacity-70 flex items-center">
            {loading ? 'Saving...' : (isBulkMode && !bookToEdit ? 'Import JSON' : 'Save Book')}
          </button>
        </div>

      </div>
    </div>
  );
}