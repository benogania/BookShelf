import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FiActivity, FiSearch, FiClock } from 'react-icons/fi';

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/system/logs/history', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(res.data);
      } catch (err) {
        console.error("Failed to fetch history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  // Search filter
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const search = searchQuery.toLowerCase();
      return (
        (log.title && log.title.toLowerCase().includes(search)) ||
        (log.description && log.description.toLowerCase().includes(search))
      );
    });
  }, [logs, searchQuery]);

  const getLogColor = (type) => {
    switch(type) {
      case 'success': return 'bg-green-500 ring-green-100 dark:ring-green-900/30';
      case 'warning': return 'bg-yellow-500 ring-yellow-100 dark:ring-yellow-900/30';
      case 'error': return 'bg-red-500 ring-red-100 dark:ring-red-900/30';
      default: return 'bg-blue-500 ring-blue-100 dark:ring-blue-900/30';
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center text-slate-500 animate-pulse">Loading System History...</div>;
  }

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto bg-slate-100 dark:bg-[#0f172a]">
      
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FiActivity className="text-blue-500" /> System Logs History
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
            <FiClock /> Showing activity for the past 5 days
          </p>
        </div>

        <div className="relative w-full md:w-72 shrink-0">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Logs Timeline Layout */}
      <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 max-w-4xl">
        <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-4 space-y-8">
          
          {filteredLogs.length === 0 ? (
            <p className="text-slate-500 pl-6">No records found.</p>
          ) : (
            filteredLogs.map((log) => (
              <div key={log._id} className="relative pl-8 group">
                {/* Dot */}
                <span className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ${getLogColor(log.type)}`}></span>
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{log.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{log.description}</p>
                  </div>
                  
                  {/* Timestamp aligned right on desktop */}
                  <div className="shrink-0 sm:text-right mt-1 sm:mt-0">
                    <span className="text-xs font-medium text-slate-900 dark:text-slate-300 block">
                      {new Date(log.createdAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}

        </div>
      </div>
    </div>
  );
}