import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  FiBarChart2,
  FiUsers,
  FiDownloadCloud,
  FiServer,
} from "react-icons/fi";

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " mins ago";
  return "Just now";
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function Dashboard() {
  const [data, setData] = useState({ stats: {}, recentBooks: [], logs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const adminToken =
          localStorage.getItem("adminToken") || localStorage.getItem("token");
        const config = { headers: { Authorization: `Bearer ${adminToken}` } };

        const [systemRes, booksRes] = await Promise.all([
          axios
            .get("http://localhost:5000/api/system/dashboard-stats", config)
            .catch(() => ({ data: {} })),
          axios
            .get("http://localhost:5000/api/books?limit=5", config)
            .catch(() => ({ data: { data: [] } })),
        ]);

        const sysData = systemRes.data;

        setData({
          stats: {
            totalBooks: sysData.totalBooks || 0,
            activeUsers: sysData.activeUsers || 0,
            totalDownloads: sysData.totalDownloads || 0,
            apiRequests: formatNumber(sysData.apiRequests || 0),
          },
          recentBooks: booksRes.data.data || [],
          logs: sysData.systemLogs ? sysData.systemLogs.slice(0, 6) : [],
        });
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-slate-500 dark:text-slate-400 animate-pulse">
        Loading system overview...
      </div>
    );
  }

  return (
    <div className="p-6 text-slate-900 dark:text-slate-100 overflow-y-auto custom-scrollbar h-full bg-slate-100 dark:bg-[#0f172a]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">System Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time statistics and backend analytics.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full border border-green-100 dark:border-green-800/50">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            System Online
          </span>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          title="Total Books"
          value={data.stats.totalBooks}
          sub="Live Inventory"
          icon={<FiBarChart2 />}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={data.stats.activeUsers}
          sub="Registered Accounts"
          icon={<FiUsers />}
          color="indigo"
        />

        <StatCard
          title="Total Downloads"
          value={Number(data.stats.totalDownloads).toLocaleString()}
          sub="Lifetime pulls"
          icon={<FiDownloadCloud />}
          color="orange"
        />

        <StatCard
          title="API Requests"
          value={data.stats.apiRequests}
          sub="~ 99.9% Uptime"
          icon={<FiServer />}
          color="green"
        />
      </div>

      {/* Bottom Layout: Inventory & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recently Added Inventory (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold">Recently Added Inventory</h2>
            <Link
              to="/books"
              className="text-sm text-blue-600 dark:text-blue-500 hover:underline"
            >
              View All →
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/50">
                  <th className="p-4 pb-3 w-1/2">Book Info</th>
                  <th className="p-4 pb-3">Category</th>
                  <th className="p-4 pb-3">Format</th>
                  <th className="p-4 pb-3 text-right">Added On</th>
                </tr>
              </thead>
              <tbody>
                {data.recentBooks.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-sm text-slate-500">
                      No books found.
                    </td>
                  </tr>
                ) : (
                  data.recentBooks.map((book) => (
                    <tr
                      key={book._id}
                      className="border-b border-slate-100 dark:border-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4 flex gap-4 items-center border-none overflow-hidden max-w-[250px] md:max-w-xs lg:max-w-sm">
                        <div className="w-10 h-14 bg-slate-100 dark:bg-slate-800 rounded shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          {book.cover_image ? (
                            <img
                              src={book.cover_image}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[9px] text-slate-400 text-center leading-tight p-1">
                              No<br />Cover
                            </span>
                          )}
                        </div>
                        {/* --- THE FIX IS HERE: min-w-0 flex-1 forces the truncate to work --- */}
                        <div className="min-w-0 flex-1">
                          <div 
                            className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate"
                            title={book.title}
                          >
                            {book.title}
                          </div>
                          <div 
                            className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate"
                            title={book.author}
                          >
                            {book.author}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {book.category || "Uncategorized"}
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-transparent text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-800/60">
                          {book.format || "PDF"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400 text-right whitespace-nowrap">
                        {new Date(book.createdAt).toISOString().split("T")[0]}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Logs (Spans 1 column) */}
        <div className="bg-white dark:bg-[#1e293b] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">System Logs</h2>
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
          </div>

          <div className="relative border-l-2 border-slate-200 dark:border-slate-700 ml-3 space-y-6 flex-1 mb-4">
            {data.logs.length > 0 ? (
              data.logs.map((log) => (
                <LogItem
                  key={log._id}
                  type={log.type}
                  title={log.title}
                  desc={log.description}
                  time={timeAgo(log.createdAt)}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500 pl-4">
                No system logs recorded yet.
              </p>
            )}
          </div>

          {/* View All Button pinned to the bottom */}
          <Link
            to="/system-logs"
            className="mt-auto text-sm font-medium text-blue-600 dark:text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 hover:underline text-center block pt-4 border-t border-slate-200 dark:border-slate-800 transition-colors"
          >
            View All History →
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, icon, color }) {
  const colorMap = {
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400",
    indigo:
      "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400",
    orange:
      "text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-400",
    green:
      "text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <div className="bg-white dark:bg-[#1e293b] p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
            {title}
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-white">
            {value}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg ${colorMap[color]}`}>{icon}</div>
      </div>
      <div
        className={`text-sm mt-2 font-medium ${sub.includes("~") ? "text-green-500" : "text-slate-500 dark:text-slate-400"}`}
      >
        {sub}
      </div>
    </div>
  );
}

function LogItem({ type, title, desc, time }) {
  const typeColors = {
    info: "bg-blue-500 ring-blue-100 dark:ring-blue-900/30",
    success: "bg-green-500 ring-green-100 dark:ring-green-900/30",
    warning: "bg-yellow-500 ring-yellow-100 dark:ring-yellow-900/30",
    error: "bg-red-500 ring-red-100 dark:ring-red-900/30",
  };

  return (
    <div className="relative pl-6">
      <span
        className={`absolute -left-[5px] top-1.5 w-2 h-2 rounded-full ring-4 ${typeColors[type] || typeColors.info}`}
      ></span>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {title}
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
        {desc}
      </p>
      <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block">
        {time}
      </span>
    </div>
  );
}