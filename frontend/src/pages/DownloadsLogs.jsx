import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch, FiChevronUp, FiChevronDown, FiDownload } from 'react-icons/fi';

export default function Downloads() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- NEW: Search and Sort States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'downloadedAt', direction: 'desc' });

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/books/logs/downloads', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch download logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // --- NEW: Sorting Logic ---
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // --- NEW: Filter & Sort the Data before rendering ---
  const processedLogs = React.useMemo(() => {
    // 1. Filter by Search Query (checks title, username, and email)
    const filtered = logs.filter(log => {
      const search = searchQuery.toLowerCase();
      return (
        (log.bookTitle && log.bookTitle.toLowerCase().includes(search)) ||
        (log.userName && log.userName.toLowerCase().includes(search)) ||
        (log.userEmail && log.userEmail.toLowerCase().includes(search))
      );
    });

    // 2. Sort the filtered results
    return filtered.sort((a, b) => {
      // Date Sorting
      if (sortConfig.key === 'downloadedAt') {
        const dateA = new Date(a.downloadedAt || a.createdAt).getTime();
        const dateB = new Date(b.downloadedAt || b.createdAt).getTime();
        return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      // Alphabetical Sorting for Strings (Title, Username)
      const valA = (a[sortConfig.key] || '').toString().toLowerCase();
      const valB = (b[sortConfig.key] || '').toString().toLowerCase();
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [logs, searchQuery, sortConfig]);

  // Helper component for Sort Icons
  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <FiChevronDown className="opacity-20 ml-1" />;
    return sortConfig.direction === 'asc' ? 
      <FiChevronUp className="text-blue-500 ml-1" /> : 
      <FiChevronDown className="text-blue-500 ml-1" />;
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex justify-center items-center text-slate-500 animate-pulse">
        Loading Download Logs...
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-100 dark:bg-[#0f172a]">
      
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiDownload className="text-blue-500" /> Download Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track user download activity across your library.
          </p>
        </div>

        {/* --- NEW: Search Input --- */}
        <div className="relative w-full md:w-72 shrink-0">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search title, user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                
                {/* --- NEW: Clickable Headers for Sorting --- */}
                <th 
                  className="p-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort('bookTitle')}
                >
                  <div className="flex items-center">Book Title <SortIcon columnKey="bookTitle" /></div>
                </th>
                
                <th 
                  className="p-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort('userName')}
                >
                  <div className="flex items-center">Downloaded By <SortIcon columnKey="userName" /></div>
                </th>
                
                <th 
                  className="p-4 font-medium cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => handleSort('downloadedAt')}
                >
                  <div className="flex items-center">Date / Time <SortIcon columnKey="downloadedAt" /></div>
                </th>

              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {processedLogs.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-500 dark:text-slate-400">
                    {searchQuery ? 'No logs match your search.' : 'No downloads recorded yet.'}
                  </td>
                </tr>
              ) : (
                processedLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                    <td className="p-4">
                      <span className="font-medium ml-10 text-slate-900 dark:text-slate-200">
                        {log.bookTitle}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900 dark:text-slate-200">
                          {log.userName}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-500">
                         
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {new Date(log.downloadedAt || log.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(log.downloadedAt || log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}