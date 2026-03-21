import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FiBarChart2, FiUsers, FiDownloadCloud, FiServer } from 'react-icons/fi';

export default function Dashboard() {
  const [data, setData] = useState({ stats: {}, recentBooks: [], logs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/dashboard/stats');
        setData(res.data);
      } catch (error) {
        console.error('Error fetching dashboard data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="p-6 text-gray-500 dark:text-gray-400">Loading system overview...</div>;
  }

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">System Overview</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Real-time statistics and backend analytics.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-800/50">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-green-700 dark:text-green-400">System Online</span>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard title="Total Books" value={data.stats.totalBooks} sub="↗ +12% from last month" icon={<FiBarChart2 />} color="blue" />
        <StatCard title="Active Users" value={data.stats.activeUsers} sub="↗ +4.3% new signups" icon={<FiUsers />} color="indigo" />
        <StatCard title="Total Downloads" value={data.stats.totalDownloads?.toLocaleString()} sub="48 new today" icon={<FiDownloadCloud />} color="orange" />
        <StatCard title="API Requests" value={data.stats.apiRequests} sub="~ 99.9% Uptime" icon={<FiServer />} color="green" />
      </div>

      {/* Bottom Layout: Inventory & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recently Added Inventory (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold">Recently Added Inventory</h2>
            <Link to="/books" className="text-sm text-blue-600 dark:text-blue-500 hover:underline">View All →</Link>
          </div>
         <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-slate-800/80">
                <th className="p-4 pb-3">Book Info</th>
                <th className="p-4 pb-3">Category</th>
                <th className="p-4 pb-3">Format</th>
                <th className="p-4 pb-3 text-right">Added On</th>
              </tr>
            </thead>
            <tbody>
              {data.recentBooks.map((book) => (
                <tr key={book._id} className="border-b border-gray-50 dark:border-slate-800/40 hover:bg-gray-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 flex gap-4 items-center border-none">
                    {/* Cover Image Thumbnail */}
                    <div className="w-10 h-14 bg-gray-100 dark:bg-slate-800 rounded shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200 dark:border-slate-700">
                      {book.cover_image ? (
                        <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-gray-400 text-center leading-tight p-1">Image<br/>Not<br/>Avail.</span>
                      )}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{book.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{book.author}</div>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{book.genre[0] || 'Uncategorized'}</td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-transparent text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800/60">
                      {book.format}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                    {new Date(book.createdAt).toISOString().split('T')[0]}
                  </td>
                </tr>
              ))}
              {data.recentBooks.length === 0 && (
                <tr><td colSpan="4" className="p-4 text-center text-sm text-gray-500">No books found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* System Logs (Spans 1 column) */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 p-5">
          <h2 className="text-lg font-bold mb-4">System Logs</h2>
          <div className="relative border-l-2 border-gray-100 dark:border-slate-700 ml-3 space-y-6">
            
            {/* Render dynamic logs if they exist, otherwise render placeholders to match your screenshot */}
            {data.logs.length > 0 ? (
              data.logs.map((log) => (
                <LogItem key={log._id} type={log.type} title={log.action} desc={log.details} time={log.timeAgo || 'Just now'} />
              ))
            ) : (
              <>
                <LogItem type="info" title="Batch sync completed" desc="Synced 450 records from external API" time="10 mins ago" />
                <LogItem type="success" title="New User Registration" desc="User ID: #8829 created" time="1 hour ago" />
                <LogItem type="warning" title="High API Latency Detected" desc="Google Books API response > 2s" time="3 hours ago" />
                <LogItem type="error" title="Failed Authentication" desc="Multiple attempts from IP 192.168.1.1" time="Yesterday" />
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}

// Sub-component for the top stat cards
function StatCard({ title, value, sub, icon, color }) {
  const colorMap = {
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
    indigo: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400',
    orange: 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400',
    green: 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400',
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</div>
          <div className="text-3xl font-bold">{value}</div>
        </div>
        <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <div className={`text-sm mt-2 ${sub.includes('+') ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
        {sub}
      </div>
    </div>
  );
}

// Sub-component for the timeline log items
function LogItem({ type, title, desc, time }) {
  const typeColors = {
    info: 'bg-blue-500 ring-blue-100 dark:ring-blue-900/30',
    success: 'bg-green-500 ring-green-100 dark:ring-green-900/30',
    warning: 'bg-yellow-500 ring-yellow-100 dark:ring-yellow-900/30',
    error: 'bg-red-500 ring-red-100 dark:ring-red-900/30'
  };

  return (
    <div className="relative pl-6">
      <span className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ${typeColors[type]}`}></span>
      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1 block">{time}</span>
    </div>
  );
}