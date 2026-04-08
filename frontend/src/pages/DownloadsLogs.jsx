import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import Pagination from '../components/Pagination';
import { FiFilter, FiActivity, FiAlertCircle, FiCheckCircle, FiInfo } from 'react-icons/fi';

export default function DownloadsLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, total: 1, totalItems: 0 });

  // URL Params State
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const currentType = searchParams.get('type') || 'all';

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/logs', {
        params: {
          page: currentPage,
          limit: 10,
          type: currentType
        }
      });
      setLogs(res.data.data);
      setPagination({
        current: res.data.currentPage,
        total: res.data.totalPages,
        totalItems: res.data.totalItems
      });
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [currentPage, currentType]);

  const handlePageChange = (newPage) => {
    setSearchParams(prev => {
      prev.set('page', newPage);
      return prev;
    });
  };

  const handleTypeChange = (e) => {
    setSearchParams(prev => {
      prev.set('type', e.target.value);
      prev.set('page', 1);
      return prev;
    });
  };

  const entriesStart = pagination.totalItems === 0 ? 0 : (pagination.current - 1) * 10 + 1;
  const entriesEnd = Math.min(pagination.current * 10, pagination.totalItems);

  // Helper for Log Type Badges
  const getLogStyle = (type) => {
    switch(type) {
      case 'error': return { icon: <FiAlertCircle />, color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50' };
      case 'warning': return { icon: <FiAlertCircle />, color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50' };
      case 'success': return { icon: <FiCheckCircle />, color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800/50' };
      default: return { icon: <FiInfo />, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/50' };
    }
  };

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">System Logs & Downloads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track system events, API requests, and user activities.</p>
        </div>
        
        {/* Filter Dropdown */}
        <div className="relative md:w-48">
          <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select 
            value={currentType}
            onChange={handleTypeChange}
            className="w-full appearance-none bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 py-2 pl-10 pr-8 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">All Logs</option>
            <option value="info">System Info</option>
            <option value="success">Success Events</option>
            <option value="warning">Warnings</option>
            <option value="error">Errors</option>
          </select>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-800 text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-slate-800/30">
                <th className="p-5 pb-3">Timestamp</th>
                <th className="p-5 pb-3">Status</th>
                <th className="p-5 pb-3">Event Action</th>
                <th className="p-5 pb-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">Loading system logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No logs found matching your criteria.</td></tr>
              ) : (
                logs.map((log) => {
                  const style = getLogStyle(log.type);
                  return (
                    <tr key={log._id} className="border-b border-gray-50 dark:border-slate-800/60 hover:bg-gray-50 dark:hover:bg-slate-800/40 transition-colors">
                      
                      <td className="p-5 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium border flex items-center gap-1.5 w-max ${style.color}`}>
                          {style.icon}
                          <span className="uppercase tracking-wide">{log.type || 'info'}</span>
                        </span>
                      </td>

                      <td className="p-5 font-medium text-sm text-gray-900 dark:text-gray-100">
                        {log.action}
                      </td>

                      <td className="p-5 text-sm text-gray-600 dark:text-gray-400">
                        {log.details}
                      </td>
                    </tr>
                  )
                })
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
    </div>
  );
}